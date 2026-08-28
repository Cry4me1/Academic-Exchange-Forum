-- ==============================================================================
-- 迁移：为 posts 表增加封面图字段 (cover_image)
-- 用于在 Dashboard 首页瀑布流及卡片中突出展示文章封面
-- ==============================================================================

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS cover_image TEXT;

COMMENT ON COLUMN public.posts.cover_image IS '帖子在 Dashboard 及卡片中展示的主封面图片 URL';
