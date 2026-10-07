-- ==========================================================
-- 迁移脚本: AI 审核拦截帖子内容快照支持
-- 创建时间: 2026-10-02
-- 功能: 为 content_moderation_logs 添加帖子标题、正文快照、封面图与标签字段，
--       便于在帖子触发 AI 拦截或审核未通过时保留完整内容快照供管理员后台查阅与复核
-- ==========================================================

-- 1. 扩展 content_moderation_logs 快照字段
ALTER TABLE public.content_moderation_logs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. 索引优化：加速后台快速检索被拦截与包含快照的审计记录
CREATE INDEX IF NOT EXISTS idx_moderation_logs_final_action_created 
  ON public.content_moderation_logs(final_action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_snapshot 
  ON public.content_moderation_logs(created_at DESC) 
  WHERE content_snapshot IS NOT NULL;

-- 3. 增强 RLS 策略（管理员及作者可查阅快照，使用 author_id 与标准 is_admin 判定）
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read moderation logs with snapshot" ON public.content_moderation_logs;
DROP POLICY IF EXISTS "Admins and authors can view logs with snapshot" ON public.content_moderation_logs;
DROP POLICY IF EXISTS "Authors and Admins can view logs" ON public.content_moderation_logs;

CREATE POLICY "Authors and Admins can view logs"
  ON public.content_moderation_logs
  FOR SELECT
  TO authenticated
  USING (
    -- 1. 帖子/评论原作者可查阅自身相关的审计记录
    auth.uid() = author_id
    -- 2. 系统管理员（支持 public.is_admin() 函数或 admin_roles 表判定）
    OR (
      CASE 
        WHEN to_regproc('public.is_admin') IS NOT NULL THEN public.is_admin()
        ELSE EXISTS (
          SELECT 1 FROM public.admin_roles 
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      END
    )
  );
