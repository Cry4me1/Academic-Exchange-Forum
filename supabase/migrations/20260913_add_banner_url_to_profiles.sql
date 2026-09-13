-- ==========================================================
-- 迁移脚本: 个人主页 Banner 自定义图片与 Storage 权限支持
-- 创建时间: 2026-09-13
-- 功能: 为 profiles 表添加 banner_url 字段，注册 banners 存储桶并配置完整 RLS
-- ==========================================================

-- 1. 为 profiles 表增加 banner_url 字段
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. 在 storage.buckets 中注册 'banners' 存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 配置 banners 存储桶的 RLS 权限策略
DROP POLICY IF EXISTS "Banner images are publicly accessible." ON storage.objects;
CREATE POLICY "Banner images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'banners' );

DROP POLICY IF EXISTS "Authenticated users can upload banners." ON storage.objects;
CREATE POLICY "Authenticated users can upload banners."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own banners." ON storage.objects;
CREATE POLICY "Users can update their own banners."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'banners' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'banners' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own banners." ON storage.objects;
CREATE POLICY "Users can delete their own banners."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'banners' AND auth.uid() = owner );
