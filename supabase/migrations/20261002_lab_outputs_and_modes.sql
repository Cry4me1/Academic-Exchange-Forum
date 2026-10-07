-- ==============================================================================
-- 迁移: 实验室学术成果关联 (origin_lab_room_id) 与统计系统
-- ==============================================================================

-- 1. 为 posts 表增加 origin_lab_room_id 外键关联
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS origin_lab_room_id UUID REFERENCES public.lab_rooms(id) ON DELETE SET NULL;

-- 2. 建立索引提升实验室产出成果检索效率
CREATE INDEX IF NOT EXISTS idx_posts_origin_lab_room_id 
ON public.posts(origin_lab_room_id);

-- 3. 历史数据回填：从现有 post_co_authors 中补全 origin_lab_room_id
UPDATE public.posts p
SET origin_lab_room_id = pca.lab_room_id
FROM public.post_co_authors pca
WHERE p.id = pca.post_id 
  AND pca.lab_room_id IS NOT NULL 
  AND p.origin_lab_room_id IS NULL;

-- 4. 确保 lab_rooms 的 room_type 约束支持 reading, whiteboard, hybrid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_rooms_room_type_check'
    ) THEN
        ALTER TABLE public.lab_rooms 
        ADD CONSTRAINT lab_rooms_room_type_check 
        CHECK (room_type IN ('reading', 'whiteboard', 'hybrid'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
