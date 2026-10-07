-- ==============================================================================
-- 迁移：彻底修复被隐藏帖子的权限隔离、申诉流转与评论区锁定索引
-- ==============================================================================

-- 1. 帖子表字段与索引加固
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON public.posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_posts_is_locked ON public.posts(is_locked);
CREATE INDEX IF NOT EXISTS idx_posts_hidden_author ON public.posts(author_id, is_hidden);

-- 2. 彻底巩固 public.posts 的 SELECT RLS 策略
-- 只有满足 (is_published = TRUE AND is_hidden = FALSE AND review_status = 'approved') 的公开帖子，
-- 或者帖子作者本人，或者具备管理员角色的用户方可读取。
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON public.posts;
DROP POLICY IF EXISTS "public_posts_select_policy" ON public.posts;

CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (
    (is_published = TRUE AND is_hidden = FALSE AND review_status = 'approved')
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- 3. 申诉与举报权限配置：允许登录用户提交申诉（写入 reports 表）
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

-- 4. 操作日志表权限配置：允许用户写入自身的申诉/修改动作日志
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and Admins can insert logs" ON public.admin_action_logs;
CREATE POLICY "Users and Admins can insert logs" ON public.admin_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = admin_id);
