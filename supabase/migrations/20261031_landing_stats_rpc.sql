-- ============================================
-- Landing 页统计聚合 RPC (Landing Stats Aggregation RPC)
-- 创建时间: 2026-10-31
-- 功能: 在数据库端一次性完成公开帖子数、去重学科标签数与注册学者数的聚合统计，
--       取代将整表 posts.tags 拉取至应用层内存去重的查询方式。
-- 安全: 使用 SECURITY INVOKER 严格继承调用方在 posts / profiles 表上的既有 RLS 策略。
-- ============================================

CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS TABLE (
  posts_count BIGINT,
  tags_count BIGINT,
  users_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (
      SELECT COUNT(*)
      FROM public.posts
      WHERE is_published = TRUE
        AND is_hidden = FALSE
    ) AS posts_count,
    (
      SELECT COUNT(DISTINCT tag)
      FROM public.posts p,
      LATERAL unnest(COALESCE(p.tags, ARRAY[]::TEXT[])) AS tag
      WHERE p.is_published = TRUE
        AND p.is_hidden = FALSE
    ) AS tags_count,
    (
      SELECT COUNT(*)
      FROM public.profiles
    ) AS users_count;
$$;

-- 授予匿名访客与已登录用户执行权限（受表级 RLS 策略约束）
GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO authenticated;
