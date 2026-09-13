-- ==========================================================
-- 迁移脚本: 个人主页四季自然飘落特效持久化支持
-- 创建时间: 2026-09-13
-- 功能: 为 profiles 表添加 falling_effect 字段，支持主页主人设定四季背景动效并在访客来访时自动且持续呈现
-- ==========================================================

-- 1. 为 profiles 表增加 falling_effect 字段
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS falling_effect TEXT DEFAULT NULL;

-- 2. 字段注释说明
COMMENT ON COLUMN public.profiles.falling_effect IS '个人主页四季飘落特效类型: petal(落花樱花), rain(空山细雨), leaf(金秋落叶), snow(初雪静谧), NULL/空(关闭)';
