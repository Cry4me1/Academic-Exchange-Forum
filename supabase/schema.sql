-- ==============================================================================
-- Scholarly 学术论坛 - 数据库全量纯净架构定义 (Unified Clean Schema)
-- 
-- 适用说明：
--   1. 本文件由 48 个历史增量 Migration 归一化提炼而成，包含系统所需的终态全量表结构、
--      RPC 存储过程、触发器、安全加固策略、pgvector 向量模型以及 RLS 行级安全控制。
--   2. 全新 Supabase 实例或本地开发环境只需在 SQL Editor 中一次性执行本文件即可完成初始化。
--   3. 已彻底剔除历史开发过程中的修补冗余、重复覆盖与特定个人账号硬编码。
-- ==============================================================================

-- ==============================================================================
-- 模块 1: 基础扩展 (Extensions)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- 用于知识图谱与语义相似度推荐 (1024 维)

-- ==============================================================================
-- 模块 2: 管理员权限与系统配置 (Admin Roles & System Settings)
-- ==============================================================================

-- 1. 管理员角色表
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'analyst')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);

-- 2. 系统全局配置表
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 初始化默认系统配置
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('require_invite_code', 'false'::jsonb, '是否开启注册必须填写邀请码'),
  ('allow_user_generate_code', 'true'::jsonb, '是否允许合格学者自主生成邀请码'),
  ('default_user_credit', '100'::jsonb, '新用户注册默认赠送的积分数')
ON CONFLICT (key) DO NOTHING;

-- 3. 管理员判定辅助函数 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.admin_roles') IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 4. 服务端保活表
CREATE TABLE IF NOT EXISTS public._keep_alive (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ping_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 模块 3: 用户系统与学者档案 (User Profiles & Identity)
-- ==============================================================================

-- 1. 学者个人资料表
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    country TEXT,
    language TEXT DEFAULT 'zh-CN',
    timezone TEXT DEFAULT 'Asia/Shanghai',
    gender TEXT,
    reputation_score INT DEFAULT 100 NOT NULL,
    
    -- 开发者与 VIP 荣誉系统
    is_developer BOOLEAN DEFAULT FALSE NOT NULL,
    developer_title TEXT,
    vip_level INT DEFAULT 0 NOT NULL,
    vip_title TEXT,
    special_title TEXT,
    badges TEXT[] DEFAULT '{}'::TEXT[],
    banner_style TEXT DEFAULT 'default',
    
    -- 入站引导与状态
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    terms_accepted_at TIMESTAMPTZ,
    onboarding_step INT DEFAULT 1 NOT NULL,
    
    -- 对决战绩统计
    duel_wins INT DEFAULT 0 NOT NULL,
    duel_losses INT DEFAULT 0 NOT NULL,
    
    -- 风控状态
    is_banned BOOLEAN DEFAULT FALSE NOT NULL,
    is_muted BOOLEAN DEFAULT FALSE NOT NULL,
    banned_until TIMESTAMPTZ,
    muted_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON public.profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(id, onboarding_completed);

-- 2. 第三方绑定账号（如洛谷等）
CREATE TABLE IF NOT EXISTS public.user_oauth_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    provider_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_user ON public.user_oauth_accounts(user_id);

-- 3. 开发者判定函数
CREATE OR REPLACE FUNCTION public.is_developer(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((SELECT is_developer FROM public.profiles WHERE id = user_id), FALSE);
END;
$$;

-- 4. 新用户注册自动创建 Profile 触发器 (匿名制，无 full_name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    username, 
    avatar_url,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(public.profiles.username, ''), EXCLUDED.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 开发者声誉保护触发器
CREATE OR REPLACE FUNCTION public.protect_developer_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT is_developer FROM public.profiles WHERE id = NEW.id) = TRUE THEN
    NEW.reputation_score := GREATEST(OLD.reputation_score, NEW.reputation_score);
    NEW.duel_losses := OLD.duel_losses;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_developer_reputation ON public.profiles;
CREATE TRIGGER protect_developer_reputation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_developer_reputation();

-- 6. 用户搜索 RPC
CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT,
  bio TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.avatar_url, p.bio
  FROM public.profiles p
  WHERE p.username ILIKE '%' || search_term || '%'
    AND p.is_banned = FALSE
  LIMIT 20;
END;
$$;

-- 7. 统计活跃用户数 RPC
CREATE OR REPLACE FUNCTION public.get_active_users_count(days_ago INT DEFAULT 7)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_count
  FROM (
    SELECT author_id AS user_id FROM public.posts WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
    UNION
    SELECT author_id AS user_id FROM public.comments WHERE created_at >= NOW() - (days_ago || ' days')::INTERVAL
  ) active_users;
  RETURN COALESCE(v_count, 0);
END;
$$;

-- 8. VIP 称号自动同步
CREATE OR REPLACE FUNCTION public.sync_vip_title(p_user_id UUID, p_level INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
BEGIN
  v_title := CASE p_level
    WHEN 1 THEN '初级学者'
    WHEN 2 THEN '资深研究员'
    WHEN 3 THEN '学术先锋'
    WHEN 4 THEN '首席科学家'
    WHEN 5 THEN '终身院士'
    ELSE NULL
  END;

  UPDATE public.profiles
  SET vip_level = p_level,
      vip_title = v_title,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_all_vip_titles()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (public.is_admin() OR (SELECT is_developer FROM public.profiles WHERE id = auth.uid())) THEN
    RAISE EXCEPTION '权限不足：仅管理员可全量同步 VIP 头衔';
  END IF;

  UPDATE public.profiles
  SET vip_title = CASE vip_level
    WHEN 1 THEN '初级学者'
    WHEN 2 THEN '资深研究员'
    WHEN 3 THEN '学术先锋'
    WHEN 4 THEN '首席科学家'
    WHEN 5 THEN '终身院士'
    ELSE NULL
  END;
END;
$$;

-- ==============================================================================
-- 模块 4: 社交关系与即时通讯 (Social, Messaging & Notifications)
-- ==============================================================================

-- 1. 好友关系表
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_users ON public.friendships(user_id, friend_id);

-- 2. 会话与私信系统
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'rich_text', 'post_reference', 'attachment', 'system')),
    referenced_post_id UUID,
    is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);

-- 3. 消息附件表
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 'r2' CHECK (storage_provider IN ('r2', 'supabase')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_msg ON public.message_attachments(message_id);

-- 4. 全站通知中心
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    related_id UUID,
    from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);

-- 5. 消息撤回判断函数
CREATE OR REPLACE FUNCTION public.can_revoke_message(p_message_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  SELECT sender_id, created_at INTO v_sender_id, v_created_at
  FROM public.messages WHERE id = p_message_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_sender_id != p_user_id THEN RETURN FALSE; END IF;
  IF NOW() - v_created_at > INTERVAL '2 minutes' THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 模块 5: 帖子、富文本、评论与版本控制 (Posts, Comments, Revisions, Literature)
-- ==============================================================================

-- 1. 帖子核心表
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content JSONB NOT NULL,                          -- Novel/Tiptap 富文本 JSON
    tags TEXT[] DEFAULT '{}'::TEXT[],
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- 统计计数
    view_count INT DEFAULT 0 NOT NULL,
    like_count INT DEFAULT 0 NOT NULL,
    comment_count INT DEFAULT 0 NOT NULL,
    bookmark_count INT DEFAULT 0 NOT NULL,
    share_count INT DEFAULT 0 NOT NULL,
    
    -- 学术问答与采纳
    accepted_answer_id UUID,
    
    -- 内容审核状态
    review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected', 'hidden')),
    
    -- 学术元数据（DOI、文献引用、BibTeX、期刊等）
    academic_meta JSONB DEFAULT '{}'::JSONB,
    
    -- 主页封面图展示
    cover_image TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_review_status ON public.posts(review_status);

-- 2. 帖子双向链接/引用表 (WikiLink)
CREATE TABLE IF NOT EXISTS public.post_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    target_post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(source_post_id, target_post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_links_source ON public.post_links(source_post_id);
CREATE INDEX IF NOT EXISTS idx_post_links_target ON public.post_links(target_post_id);

-- 3. 帖子共创作者表
CREATE TABLE IF NOT EXISTS public.post_co_authors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'co_author' CHECK (role IN ('co_author', 'contributor', 'annotator')),
    contribution_summary TEXT,
    lab_room_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(post_id, user_id)
);

-- 4. 帖子版本历史与修订对比表 (Revisions)
CREATE TABLE IF NOT EXISTS public.post_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    editor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    edit_summary TEXT,
    revision_number INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_revisions_post_id ON public.post_revisions(post_id, revision_number DESC);

-- 5. 评论系统
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    is_accepted BOOLEAN DEFAULT FALSE NOT NULL,
    review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected', 'hidden')),
    like_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);

-- 6. 互动关系表 (点赞、收藏、转发)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_like_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id),
    CONSTRAINT unique_user_comment_like UNIQUE (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. 帖子浏览量与历史版本触发器
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_post_revision()
RETURNS TRIGGER AS $$
DECLARE
  v_next_num INT;
BEGIN
  IF (OLD.title IS DISTINCT FROM NEW.title) OR (OLD.content IS DISTINCT FROM NEW.content) THEN
    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO v_next_num
    FROM public.post_revisions WHERE post_id = OLD.id;

    INSERT INTO public.post_revisions (post_id, editor_id, title, content, revision_number, created_at)
    VALUES (OLD.id, auth.uid(), OLD.title, OLD.content, v_next_num, NOW());
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_post_update_save_revision ON public.posts;
CREATE TRIGGER before_post_update_save_revision
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.save_post_revision();

-- 采纳回答切换函数
CREATE OR REPLACE FUNCTION public.toggle_comment_acceptance(p_comment_id UUID, p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_author UUID;
  v_comment_author UUID;
  v_current_accepted UUID;
  v_is_now_accepted BOOLEAN;
BEGIN
  SELECT author_id, accepted_answer_id INTO v_post_author, v_current_accepted
  FROM public.posts WHERE id = p_post_id;

  IF v_post_author != auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', '只有帖子作者可以采纳回答');
  END IF;

  SELECT author_id INTO v_comment_author
  FROM public.comments WHERE id = p_comment_id;

  IF v_current_accepted = p_comment_id THEN
    UPDATE public.posts SET accepted_answer_id = NULL WHERE id = p_post_id;
    UPDATE public.comments SET is_accepted = FALSE WHERE id = p_comment_id;
    v_is_now_accepted := FALSE;
  ELSE
    IF v_current_accepted IS NOT NULL THEN
      UPDATE public.comments SET is_accepted = FALSE WHERE id = v_current_accepted;
    END IF;
    UPDATE public.posts SET accepted_answer_id = p_comment_id WHERE id = p_post_id;
    UPDATE public.comments SET is_accepted = TRUE WHERE id = p_comment_id;
    v_is_now_accepted := TRUE;

    UPDATE public.profiles SET reputation_score = reputation_score + 15 WHERE id = v_comment_author;
  END IF;

  RETURN jsonb_build_object('success', true, 'is_accepted', v_is_now_accepted);
END;
$$;

-- 维护点赞与评论计数
CREATE OR REPLACE FUNCTION public.handle_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like_change ON public.likes;
CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_like_count();

CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

-- 8. 周点赞榜统计 RPC
CREATE OR REPLACE FUNCTION public.get_weekly_like_leaderboard(since_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '7 days'))
RETURNS TABLE (
  author_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_likes BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.author_id,
    pr.username,
    pr.avatar_url,
    COUNT(l.id) AS total_likes
  FROM public.likes l
  JOIN public.posts p ON l.post_id = p.id
  JOIN public.profiles pr ON p.author_id = pr.id
  WHERE l.created_at >= since_date
  GROUP BY p.author_id, pr.username, pr.avatar_url
  ORDER BY total_likes DESC
  LIMIT 20;
END;
$$;

-- 9. 标签相似帖匹配 RPC
CREATE OR REPLACE FUNCTION public.match_posts_by_tags(
  target_tags TEXT[],
  exclude_post_id UUID DEFAULT NULL,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author_id UUID,
  tags TEXT[],
  shared_tag_count INT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.author_id,
    p.tags,
    CARDINALITY(ARRAY(SELECT UNNEST(p.tags) INTERSECT SELECT UNNEST(target_tags))) AS shared_tag_count
  FROM public.posts p
  WHERE p.is_published = TRUE
    AND (exclude_post_id IS NULL OR p.id != exclude_post_id)
    AND p.tags && target_tags
  ORDER BY shared_tag_count DESC, p.created_at DESC
  LIMIT match_count;
END;
$$;

-- ==============================================================================
-- 模块 6: 学术对决与辩论竞技系统 (Academic Duels, LP Bets & Peer Review)
-- ==============================================================================

-- 1. 对决主表
CREATE TABLE IF NOT EXISTS public.duels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic TEXT NOT NULL,
    description TEXT,
    challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'voting', 'completed', 'cancelled')),
    
    challenger_lp NUMERIC(12,2) DEFAULT 0 NOT NULL,
    opponent_lp NUMERIC(12,2) DEFAULT 0 NOT NULL,
    
    max_rounds INT DEFAULT 3 NOT NULL,
    current_round INT DEFAULT 1 NOT NULL,
    winner_id UUID REFERENCES public.profiles(id),
    challenger_score NUMERIC(5,2) DEFAULT 0,
    opponent_score NUMERIC(5,2) DEFAULT 0,
    
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_duels_status ON public.duels(status);
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON public.duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON public.duels(opponent_id);

-- 2. 对决邀请表
CREATE TABLE IF NOT EXISTS public.duel_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. 对决轮次辩论表
CREATE TABLE IF NOT EXISTS public.duel_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    challenger_speech TEXT,
    opponent_speech TEXT,
    challenger_score NUMERIC(5,2),
    opponent_score NUMERIC(5,2),
    ai_analysis JSONB,
    content_hash TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'voting', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(duel_id, round_number)
);

-- 4. 对决实时弹幕与评论
CREATE TABLE IF NOT EXISTS public.duel_live_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'danmaku' CHECK (type IN ('danmaku', 'comment', 'support_challenger', 'support_opponent')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_duel_comments_duel ON public.duel_live_comments(duel_id, created_at DESC);

-- 5. 观众押注与预测表 (LP Bets)
CREATE TABLE IF NOT EXISTS public.duel_bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    duel_id UUID NOT NULL REFERENCES public.duels(id) ON DELETE CASCADE,
    spectator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'refunded')),
    funded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_duel_bets_duel ON public.duel_bets(duel_id, spectator_id);

-- 6. 同行评审表 (Peer Reviews)
CREATE TABLE IF NOT EXISTS public.peer_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    duel_id UUID REFERENCES public.duels(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 1 AND score <= 10),
    review_content TEXT NOT NULL,
    academic_rigor_score INT CHECK (academic_rigor_score >= 1 AND academic_rigor_score <= 10),
    originality_score INT CHECK (originality_score >= 1 AND originality_score <= 10),
    clarity_score INT CHECK (clarity_score >= 1 AND clarity_score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_reviewer_target UNIQUE (reviewer_id, post_id)
);

-- ==============================================================================
-- 模块 7: 积分与代币经济体系 (Credits & Token Economy)
-- ==============================================================================

-- 1. 用户积分余额表
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(12,2) DEFAULT 100.00 NOT NULL CHECK (balance >= 0),
    total_recharged NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    total_spent NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    last_monthly_claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_credits_balance ON public.user_credits(balance DESC);

-- 2. VIP 体系规则配置表
CREATE TABLE IF NOT EXISTS public.vip_level_config (
    level INT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    min_spent NUMERIC(12,2) DEFAULT 0 NOT NULL,
    perks TEXT[] DEFAULT '{}'::TEXT[],
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO public.vip_level_config (level, name, title, min_spent, perks)
VALUES
  (1, 'VIP 1', '初级学者', 0, ARRAY['基础学术交流', '常规发帖与评论']),
  (2, 'VIP 2', '资深研究员', 100, ARRAY['每月领取双倍津贴', '专属研究员标识']),
  (3, 'VIP 3', '学术先锋', 500, ARRAY['发起高额学术对决', '优先同行评审通道']),
  (4, 'VIP 4', '首席科学家', 2000, ARRAY['创建多个协作实验室', '尊贵科学家徽章']),
  (5, 'VIP 5', '终身院士', 10000, ARRAY['终身定制头衔', '全站全局特权'])
ON CONFLICT (level) DO NOTHING;

-- 3. 积分交易流水账单
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2),
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);

-- 4. 积分批量发放记录表
CREATE TABLE IF NOT EXISTS public.credit_batch_grants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    grant_type TEXT NOT NULL,
    target_criteria JSONB,
    affected_user_count INT DEFAULT 0 NOT NULL,
    total_amount_granted NUMERIC(12,2) DEFAULT 0 NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 新用户注册赠送初始积分触发器
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_recharged, total_spent)
  VALUES (NEW.id, 100.00, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (NEW.id, 100.00, 100.00, 'signup_bonus', '新学者入驻初始学术积分礼包');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- 5. 原子扣减积分 RPC (FOR UPDATE 防并发)
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', '权限不足：无法操作他人积分');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', '扣除积分必须大于0');
  END IF;

  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '积分账户不存在');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', '积分余额不足', 'balance', v_current_balance);
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.user_credits
  SET balance = v_new_balance,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, -p_amount, v_new_balance, p_type, p_description);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- 6. 原子增加积分 RPC
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', '增加积分必须大于0');
  END IF;

  INSERT INTO public.user_credits (user_id, balance, total_recharged, total_spent)
  VALUES (p_user_id, p_amount, 0.00, 0.00)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = public.user_credits.balance + p_amount,
      updated_at = NOW()
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, p_description);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- 7. 领取月度津贴 RPC
CREATE OR REPLACE FUNCTION public.claim_monthly_bonus(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_claimed TIMESTAMPTZ;
  v_vip_level INT;
  v_bonus_amount NUMERIC;
  v_result JSONB;
BEGIN
  IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', '仅本人可领取月度奖励');
  END IF;

  SELECT last_monthly_claimed_at INTO v_last_claimed
  FROM public.user_credits WHERE user_id = p_user_id FOR UPDATE;

  IF v_last_claimed IS NOT NULL AND v_last_claimed > (NOW() - INTERVAL '30 days') THEN
    RETURN jsonb_build_object('success', false, 'error', '本月津贴已领取，请下月再来');
  END IF;

  SELECT vip_level INTO v_vip_level FROM public.profiles WHERE id = p_user_id;
  v_bonus_amount := 50.00 + (COALESCE(v_vip_level, 0) * 50.00);

  v_result := public.add_user_credits(p_user_id, v_bonus_amount, 'monthly_bonus', '领取学者每月研讨津贴');

  IF (v_result->>'success')::BOOLEAN = TRUE THEN
    UPDATE public.user_credits SET last_monthly_claimed_at = NOW() WHERE user_id = p_user_id;
  END IF;

  RETURN v_result;
END;
$$;

-- 8. 创建对决并扣除开盘手续费 RPC
CREATE OR REPLACE FUNCTION public.create_duel_with_fee(
    p_topic TEXT,
    p_description TEXT,
    p_challenger_lp NUMERIC,
    p_opponent_lp NUMERIC,
    p_invitee_id UUID DEFAULT NULL,
    p_post_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_duel_id UUID;
    v_deduct_res JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', '请先登录');
    END IF;

    IF p_challenger_lp > 0 THEN
        v_deduct_res := public.deduct_user_credits(v_user_id, p_challenger_lp, 'duel_fee', '创建学术对决质押保证金: ' || p_topic);
        IF (v_deduct_res->>'success')::BOOLEAN = FALSE THEN
            RETURN v_deduct_res;
        END IF;
    END IF;

    INSERT INTO public.duels (
        topic,
        description,
        challenger_id,
        challenger_lp,
        opponent_lp,
        post_id,
        status
    )
    VALUES (
        p_topic,
        p_description,
        v_user_id,
        p_challenger_lp,
        p_opponent_lp,
        p_post_id,
        'pending'
    )
    RETURNING id INTO v_duel_id;

    IF p_invitee_id IS NOT NULL THEN
        INSERT INTO public.duel_invitations (duel_id, invitee_id, status)
        VALUES (v_duel_id, p_invitee_id, 'pending');
    END IF;

    RETURN jsonb_build_object('success', true, 'duel_id', v_duel_id);
END;
$$;

-- 9. 观众押注原子 RPC
CREATE OR REPLACE FUNCTION public.place_duel_bet(
    p_duel_id UUID,
    p_target_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_duel RECORD;
    v_deduct_res JSONB;
    v_bet_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', '请先登录');
    END IF;

    SELECT * INTO v_duel FROM public.duels WHERE id = p_duel_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', '对决不存在');
    END IF;

    IF v_duel.status != 'active' AND v_duel.status != 'voting' THEN
        RETURN jsonb_build_object('success', false, 'error', '当前对决未处于可投票/押注状态');
    END IF;

    IF v_user_id = v_duel.challenger_id OR v_user_id = v_duel.opponent_id THEN
        RETURN jsonb_build_object('success', false, 'error', '辩论选手不得参与观众预测下注');
    END IF;

    IF p_target_id != v_duel.challenger_id AND p_target_id != v_duel.opponent_id THEN
        RETURN jsonb_build_object('success', false, 'error', '押注目标必须为对决双方之一');
    END IF;

    v_deduct_res := public.deduct_user_credits(v_user_id, p_amount, 'duel_bet', '参与学术对决预测下注');
    IF (v_deduct_res->>'success')::BOOLEAN = FALSE THEN
        RETURN v_deduct_res;
    END IF;

    INSERT INTO public.duel_bets (duel_id, spectator_id, target_id, amount, status, funded)
    VALUES (p_duel_id, v_user_id, p_target_id, p_amount, 'active', TRUE)
    RETURNING id INTO v_bet_id;

    RETURN jsonb_build_object('success', true, 'bet_id', v_bet_id);
END;
$$;

-- 10. 对决结算分账触发器
CREATE OR REPLACE FUNCTION public.handle_duel_bets_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_bet RECORD;
  v_reward NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    IF NEW.winner_id = NEW.challenger_id AND NEW.opponent_lp > 0 THEN
      PERFORM public.add_user_credits(NEW.challenger_id, NEW.opponent_lp, 'duel_reward', '赢得学术对决奖池 LP');
    ELSIF NEW.winner_id = NEW.opponent_id AND NEW.challenger_lp > 0 THEN
      PERFORM public.add_user_credits(NEW.opponent_id, NEW.challenger_lp, 'duel_reward', '赢得学术对决奖池 LP');
    END IF;

    FOR v_bet IN 
      SELECT * FROM public.duel_bets 
      WHERE duel_id = NEW.id AND status = 'active' AND funded = TRUE
    LOOP
      IF v_bet.target_id = NEW.winner_id THEN
        v_reward := v_bet.amount * 2;
        PERFORM public.add_user_credits(v_bet.spectator_id, v_reward, 'duel_reward', '学术对决预测获胜奖励分账');
        UPDATE public.duel_bets SET status = 'won', settled_at = NOW() WHERE id = v_bet.id;
      ELSE
        UPDATE public.duel_bets SET status = 'lost', settled_at = NOW() WHERE id = v_bet.id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_duel_end_settle_bets ON public.duels;
CREATE TRIGGER on_duel_end_settle_bets
  AFTER UPDATE ON public.duels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_duel_bets_settlement();

-- ==============================================================================
-- 模块 8: 实验室共创研讨室与笔记 (Lab Collaboration & Yjs Snapshots)
-- ==============================================================================

-- 1. 实验室房间表
CREATE TABLE IF NOT EXISTS public.lab_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT NOT NULL DEFAULT 'hybrid' CHECK (room_type IN ('reading', 'whiteboard', 'hybrid')),
    max_members INT DEFAULT 10 NOT NULL,
    access_code_hash TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 实验室成员表
CREATE TABLE IF NOT EXISTS public.lab_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.lab_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_members_room ON public.lab_members(room_id, user_id);

-- 3. 实验室文献/帖子关联表
CREATE TABLE IF NOT EXISTS public.lab_post_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.lab_rooms(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(room_id, post_id)
);

-- 4. 实验室笔记当前状态 (Yjs 二进制快照)
CREATE TABLE IF NOT EXISTS public.lab_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID UNIQUE NOT NULL REFERENCES public.lab_rooms(id) ON DELETE CASCADE,
    yjs_state BYTEA NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. 实验室笔记版本快照
CREATE TABLE IF NOT EXISTS public.lab_note_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.lab_rooms(id) ON DELETE CASCADE,
    yjs_state BYTEA NOT NULL,
    snapshot_type TEXT NOT NULL DEFAULT 'auto' CHECK (snapshot_type IN ('auto', 'manual', 'pre_rollback')),
    label TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_snapshots_room ON public.lab_note_snapshots(room_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.cleanup_old_lab_snapshots(target_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.lab_note_snapshots
    WHERE room_id = target_room_id
      AND snapshot_type = 'auto'
      AND id NOT IN (
          SELECT id FROM public.lab_note_snapshots
          WHERE room_id = target_room_id
            AND snapshot_type = 'auto'
          ORDER BY created_at DESC
          LIMIT 50
      );
END;
$$;

-- ==============================================================================
-- 模块 9: 知识图谱与向量检索 (Knowledge Graph & pgvector 1024-dim)
-- ==============================================================================

-- 1. 帖子向量嵌入表 (Cohere 1024 维模型)
CREATE TABLE IF NOT EXISTS public.post_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID UNIQUE NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    embedding VECTOR(1024) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 向量余弦相似度匹配 RPC
CREATE OR REPLACE FUNCTION public.match_posts (
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  filter_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity FLOAT,
  author_id UUID,
  tags TEXT[]
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    1 - (pe.embedding <=> query_embedding) AS similarity,
    p.author_id,
    p.tags
  FROM public.post_embeddings pe
  JOIN public.posts p ON pe.post_id = p.id
  WHERE p.is_published = TRUE
    AND p.review_status = 'approved'
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    AND (filter_tags IS NULL OR p.tags && filter_tags)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ==============================================================================
-- 模块 10: 学术文集与合集系统 (Collections & Follows)
-- ==============================================================================

-- 1. 文集主表
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    post_count INT DEFAULT 0 NOT NULL,
    follower_count INT DEFAULT 0 NOT NULL,
    view_count INT DEFAULT 0 NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_author ON public.collections(created_by);

-- 2. 文集收录帖子关联表
CREATE TABLE IF NOT EXISTS public.collection_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0 NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(collection_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_posts ON public.collection_posts(collection_id, sort_order ASC);

-- 3. 文集关注表
CREATE TABLE IF NOT EXISTS public.collection_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(collection_id, user_id)
);

-- 4. 文集阅读浏览表
CREATE TABLE IF NOT EXISTS public.collection_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. 文集帖子重排序 RPC
CREATE OR REPLACE FUNCTION public.reorder_collection_posts(
    p_collection_id UUID,
    p_post_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
    v_index INT;
BEGIN
    SELECT created_by INTO v_owner_id FROM public.collections WHERE id = p_collection_id;
    IF v_owner_id != auth.uid() AND NOT public.is_admin() THEN
        RAISE EXCEPTION '只有文集创作者可以调整排序';
    END IF;

    FOR v_index IN 1..array_length(p_post_ids, 1) LOOP
        UPDATE public.collection_posts
        SET sort_order = v_index
        WHERE collection_id = p_collection_id AND post_id = p_post_ids[v_index];
    END LOOP;

    RETURN TRUE;
END;
$$;

-- 6. 文集浏览自增 RPC
CREATE OR REPLACE FUNCTION public.increment_collection_view_count(p_collection_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.collections SET view_count = view_count + 1 WHERE id = p_collection_id;
END;
$$;

-- ==============================================================================
-- 模块 11: 公告、风控、报告与邀请码 (Announcements, Moderation & Invites)
-- ==============================================================================

-- 1. 系统全站公告表
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('system', 'activity', 'maintenance', 'update')),
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'vip', 'role')),
    target_role TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. 敏感词规则库
CREATE TABLE IF NOT EXISTS public.sensitive_words (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    word TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'general' NOT NULL,
    match_level TEXT DEFAULT 'block' CHECK (match_level IN ('block', 'review', 'mask')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. 内容审核日志表
CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'avatar', 'banner', 'message')),
    target_id UUID NOT NULL,
    comment_id UUID,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trigger_word TEXT,
    action_taken TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. 用户举报表
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'message', 'duel')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    handled_by UUID REFERENCES public.profiles(id),
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. 管理员操作审计日志表
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. 学者邀请码体系
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    usage_limit INT DEFAULT 1 NOT NULL,
    used_count INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invitation_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code_id UUID NOT NULL REFERENCES public.invitation_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. 邀请码验证 RPC
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_code TEXT;
    v_record RECORD;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
    IF v_clean_code = '' THEN
        RETURN jsonb_build_object('valid', false, 'error', '邀请码不能为空');
    END IF;

    SELECT c.*, p.username as inviter_username
    INTO v_record
    FROM public.invitation_codes c
    LEFT JOIN public.profiles p ON c.creator_id = p.id
    WHERE UPPER(c.code) = v_clean_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', '邀请码不存在');
    END IF;

    IF NOT v_record.is_active THEN
        RETURN jsonb_build_object('valid', false, 'error', '该邀请码已被停用或作废');
    END IF;

    IF v_record.expires_at IS NOT NULL AND v_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('valid', false, 'error', '该邀请码已过期');
    END IF;

    IF v_record.used_count >= v_record.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', '该邀请码的使用次数已达上限');
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'code', v_record.code,
        'remaining_uses', v_record.usage_limit - v_record.used_count,
        'inviter_name', COALESCE(v_record.inviter_username, '系统官方'),
        'note', v_record.note
    );
END;
$$;

-- 8. 消耗邀请码 RPC
CREATE OR REPLACE FUNCTION public.consume_invite_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_check JSONB;
    v_code_id UUID;
BEGIN
    v_check := public.validate_invite_code(p_code);
    IF (v_check->>'valid')::BOOLEAN = FALSE THEN
        RETURN v_check;
    END IF;

    SELECT id INTO v_code_id FROM public.invitation_codes WHERE UPPER(code) = UPPER(TRIM(p_code)) FOR UPDATE;

    UPDATE public.invitation_codes
    SET used_count = used_count + 1
    WHERE id = v_code_id;

    INSERT INTO public.invitation_records (code_id, user_id, registered_at)
    VALUES (v_code_id, p_user_id, NOW());

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ==============================================================================
-- 模块 12: 存储桶配置 (Supabase Storage Buckets)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('avatars', 'avatars', true, 5242880),
  ('attachments', 'attachments', false, 52428800),
  ('collection-covers', 'collection-covers', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 模块 13: 全局行级安全策略 (Row Level Security - RLS)
-- ==============================================================================

-- 启用全量表 RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_co_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_level_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_batch_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_post_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_note_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitive_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_records ENABLE ROW LEVEL SECURITY;

-- 1. Profiles & OAuth 策略
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "user_oauth_select_own" ON public.user_oauth_accounts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_oauth_all_own" ON public.user_oauth_accounts FOR ALL USING (auth.uid() = user_id);

-- 2. Posts & Links 策略
CREATE POLICY "posts_select_public" ON public.posts FOR SELECT USING (is_published = true OR auth.uid() = author_id OR public.is_admin());
CREATE POLICY "posts_insert_auth" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = author_id OR public.is_admin()) WITH CHECK (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "post_links_select_public" ON public.post_links FOR SELECT USING (true);
CREATE POLICY "post_links_insert_auth" ON public.post_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_links_delete_auth" ON public.post_links FOR DELETE USING (auth.uid() IS NOT NULL);

-- 3. Comments 策略
CREATE POLICY "comments_select_public" ON public.comments FOR SELECT USING (review_status = 'approved' OR auth.uid() = author_id OR public.is_admin());
CREATE POLICY "comments_insert_auth" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (auth.uid() = author_id OR public.is_admin()) WITH CHECK (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- 4. Messages & Notifications
CREATE POLICY "messages_select_member" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id OR 
  EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = messages.conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "messages_insert_sender" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_all" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 5. User Credits & VIP
CREATE POLICY "user_credits_select_own" ON public.user_credits FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_credits_admin_update" ON public.user_credits FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "vip_level_config_select" ON public.vip_level_config FOR SELECT USING (true);
CREATE POLICY "vip_level_config_admin" ON public.vip_level_config FOR ALL USING (public.is_admin());
CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "credit_transactions_admin_insert" ON public.credit_transactions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "credit_batch_grants_admin" ON public.credit_batch_grants FOR ALL USING (public.is_admin());

-- 6. Duels & Bets
CREATE POLICY "duels_select_public" ON public.duels FOR SELECT USING (true);
CREATE POLICY "duels_insert_challenger" ON public.duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "duels_update_participants" ON public.duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id OR public.is_admin());
CREATE POLICY "duel_rounds_select_public" ON public.duel_rounds FOR SELECT USING (true);
CREATE POLICY "duel_bets_select_own" ON public.duel_bets FOR SELECT USING (auth.uid() = spectator_id OR public.is_admin());

-- 7. Lab Rooms & Notes
CREATE POLICY "lab_rooms_select_member" ON public.lab_rooms FOR SELECT USING (
  auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.lab_members lm WHERE lm.room_id = lab_rooms.id AND lm.user_id = auth.uid())
);
CREATE POLICY "lab_rooms_insert_auth" ON public.lab_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "lab_rooms_update_owner" ON public.lab_rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "lab_notes_all_member" ON public.lab_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.lab_members lm WHERE lm.room_id = lab_notes.room_id AND lm.user_id = auth.uid())
);

-- 8. Collections
CREATE POLICY "collections_select_public" ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = created_by OR public.is_admin());
CREATE POLICY "collections_insert_auth" ON public.collections FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "collections_update_own" ON public.collections FOR UPDATE USING (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "collections_delete_own" ON public.collections FOR DELETE USING (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "collection_posts_select_public" ON public.collection_posts FOR SELECT USING (true);

-- 9. Admin, Announcements & Reports
CREATE POLICY "admin_roles_select_admin" ON public.admin_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "system_announcements_select" ON public.system_announcements FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "system_announcements_admin" ON public.system_announcements FOR ALL USING (public.is_admin());
CREATE POLICY "reports_select_reporter_or_admin" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());
CREATE POLICY "reports_insert_auth" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_logs_admin" ON public.admin_action_logs FOR ALL USING (public.is_admin());
CREATE POLICY "sensitive_words_admin" ON public.sensitive_words FOR ALL USING (public.is_admin());
CREATE POLICY "system_settings_select_public" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "system_settings_admin_write" ON public.system_settings FOR ALL USING (public.is_admin());

-- ==============================================================================
-- 模块 14: Supabase Realtime 实时广播发布配置
-- ==============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_rounds;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_live_comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_invitations;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;
