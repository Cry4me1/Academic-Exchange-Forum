-- ============================================================
-- 评论区 @ 提及功能与 Scholarly AI 交互式账号系统
-- 创建时间: 2026-09-05
-- ============================================================

-- 1. 确保 auth.users 中存在 Scholarly AI 专属账号
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
) VALUES (
    '00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-000000000000',
    'ai@scholarly.internal',
    '',
    NOW(),
    '{"provider": "system", "providers": ["system"]}',
    '{"username": "Scholarly AI", "full_name": "Scholarly AI 官方学术助手"}',
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. 确保 public.profiles 中存在 Scholarly AI 的公开资料
INSERT INTO public.profiles (
    id,
    username,
    email,
    avatar_url,
    bio,
    special_title,
    vip_title,
    vip_level,
    is_verified,
    badges
) VALUES (
    '00000000-0000-0000-0000-0000000000a1',
    'Scholarly AI',
    'ai@scholarly.internal',
    '/scholarly-ai-avatar.jpg',
    'Scholarly 官方学术智能助手，随时为你推导公式、解答学术难题。',
    '学术智能体',
    '学术智脑',
    6,
    true,
    ARRAY['官方认证', 'AI助手']
) ON CONFLICT (id) DO UPDATE SET
    username = 'Scholarly AI',
    avatar_url = '/scholarly-ai-avatar.jpg',
    bio = 'Scholarly 官方学术智能助手，随时为你推导公式、解答学术难题。',
    special_title = '学术智能体',
    vip_title = '学术智脑',
    vip_level = 6,
    is_verified = true,
    badges = ARRAY['官方认证', 'AI助手'];

-- 3. 确保 notifications 表支持 mention 类型
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'notifications' AND constraint_name = 'notifications_type_check'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
          CHECK (type IN (
            'like', 'comment', 'friend_request', 'friend_accepted',
            'message', 'mention', 'duel_invite', 'duel_accepted',
            'duel_rejected', 'system', 'collection_update'
          ));
    END IF;
END $$;

-- 4. 辅助函数：根据当前用户获取 @ 提及候选人列表
-- 当 search_query 为空时：返回 Scholarly AI + 用户好友 + 最近提及的学者
-- 当 search_query 不为空时：在所有用户中模糊搜索匹配学者，并包含 Scholarly AI
CREATE OR REPLACE FUNCTION public.get_mention_candidates(
    p_user_id UUID,
    p_query TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 15
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    special_title TEXT,
    vip_level INTEGER,
    is_verified BOOLEAN,
    is_ai BOOLEAN,
    relationship TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_clean_query TEXT := TRIM(COALESCE(p_query, ''));
BEGIN
    -- 情况 A：无搜索词，展示默认候选人（Scholarly AI + 好友 + 最近互动）
    IF v_clean_query = '' THEN
        RETURN QUERY
        -- 1. 置顶 Scholarly AI
        SELECT 
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.special_title,
            p.vip_level,
            p.is_verified,
            TRUE AS is_ai,
            'ai'::TEXT AS relationship
        FROM public.profiles p
        WHERE p.id = '00000000-0000-0000-0000-0000000000a1'

        UNION ALL

        -- 2. 当前用户的好友
        SELECT 
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.special_title,
            p.vip_level,
            p.is_verified,
            FALSE AS is_ai,
            'friend'::TEXT AS relationship
        FROM public.profiles p
        JOIN public.friendships f ON (
            (f.requester_id = p_user_id AND f.addressee_id = p.id) OR
            (f.addressee_id = p_user_id AND f.requester_id = p.id)
        )
        WHERE f.status = 'accepted'
          AND p.id != p_user_id
          AND p.id != '00000000-0000-0000-0000-0000000000a1'

        UNION ALL

        -- 3. 用户最近互动的学者（未添加为好友的其他学者，按活跃度限制）
        SELECT 
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.special_title,
            p.vip_level,
            p.is_verified,
            FALSE AS is_ai,
            'recent'::TEXT AS relationship
        FROM public.profiles p
        WHERE p.id != p_user_id
          AND p.id != '00000000-0000-0000-0000-0000000000a1'
          AND NOT EXISTS (
              SELECT 1 FROM public.friendships f 
              WHERE f.status = 'accepted'
                AND ((f.requester_id = p_user_id AND f.addressee_id = p.id) OR
                     (f.addressee_id = p_user_id AND f.requester_id = p.id))
          )
        LIMIT p_limit;

    -- 情况 B：有搜索词，全局模糊匹配
    ELSE
        RETURN QUERY
        -- 如果搜索词包含 ai / scholarly / 学术 / 助手，优先匹配 Scholarly AI
        SELECT 
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.special_title,
            p.vip_level,
            p.is_verified,
            TRUE AS is_ai,
            'ai'::TEXT AS relationship
        FROM public.profiles p
        WHERE p.id = '00000000-0000-0000-0000-0000000000a1'
          AND (
              'scholarly ai' ILIKE '%' || v_clean_query || '%' OR
              v_clean_query ILIKE '%ai%' OR
              v_clean_query ILIKE '%学术%' OR
              v_clean_query ILIKE '%助手%' OR
              v_clean_query ILIKE '%智能%'
          )

        UNION ALL

        -- 匹配其他普通学者
        SELECT 
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.special_title,
            p.vip_level,
            p.is_verified,
            FALSE AS is_ai,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM public.friendships f 
                    WHERE f.status = 'accepted'
                      AND ((f.requester_id = p_user_id AND f.addressee_id = p.id) OR
                           (f.addressee_id = p_user_id AND f.requester_id = p.id))
                ) THEN 'friend'
                ELSE 'user'
            END AS relationship
        FROM public.profiles p
        WHERE p.id != p_user_id
          AND p.id != '00000000-0000-0000-0000-0000000000a1'
          AND (
              p.username ILIKE '%' || v_clean_query || '%' OR
              p.full_name ILIKE '%' || v_clean_query || '%'
          )
        LIMIT p_limit;
    END IF;
END;
$$;
