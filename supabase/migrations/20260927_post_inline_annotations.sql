-- ==========================================================
-- 迁移脚本: 学术行间划线批注与边注协同系统 (Inline Margin Notes)
-- 创建时间: 2026-09-27
-- 功能: 创建 post_annotations 表，支持划线选区锚点、多色彩微光标签、
--       微线程嵌套研讨、作者结题状态与 Supabase Realtime 同步
-- ==========================================================

-- 1. 创建 post_annotations 表
CREATE TABLE IF NOT EXISTS public.post_annotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.post_annotations(id) ON DELETE CASCADE,
    anchor_text TEXT NOT NULL,
    anchor_prefix TEXT DEFAULT '',
    anchor_suffix TEXT DEFAULT '',
    content TEXT NOT NULL,
    color VARCHAR(20) DEFAULT 'amber',
    is_resolved BOOLEAN DEFAULT FALSE,
    review_status post_review_status DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立高性能索引
CREATE INDEX IF NOT EXISTS idx_post_annotations_post_id ON public.post_annotations(post_id);
CREATE INDEX IF NOT EXISTS idx_post_annotations_parent_id ON public.post_annotations(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_annotations_author_id ON public.post_annotations(author_id);
CREATE INDEX IF NOT EXISTS idx_post_annotations_created_at ON public.post_annotations(created_at);
CREATE INDEX IF NOT EXISTS idx_post_annotations_status ON public.post_annotations(post_id, is_resolved);

-- 3. 配置 Row Level Security (RLS)
ALTER TABLE public.post_annotations ENABLE ROW LEVEL SECURITY;

-- 所有人均可查看已过审的批注，或查看自己的批注，管理员可查看所有
DROP POLICY IF EXISTS "Anyone can view approved annotations" ON public.post_annotations;
CREATE POLICY "Anyone can view approved annotations" ON public.post_annotations
    FOR SELECT USING (
        (review_status = 'approved')
        OR auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid()
        )
    );

-- 登录学者可以发表批注
DROP POLICY IF EXISTS "Authenticated users can create annotations" ON public.post_annotations;
CREATE POLICY "Authenticated users can create annotations" ON public.post_annotations
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 批注作者、文章原作者或管理员可更新（例如切换已解决状态）
DROP POLICY IF EXISTS "Authors and post owners can update annotations" ON public.post_annotations;
CREATE POLICY "Authors and post owners can update annotations" ON public.post_annotations
    FOR UPDATE USING (
        auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND author_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid()
        )
    );

-- 批注作者、文章原作者或管理员可删除批注
DROP POLICY IF EXISTS "Authors and post owners can delete annotations" ON public.post_annotations;
CREATE POLICY "Authors and post owners can delete annotations" ON public.post_annotations
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_id AND author_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid()
        )
    );

-- 4. 自动更新 updated_at 时间戳触发器
DROP TRIGGER IF EXISTS on_post_annotations_updated ON public.post_annotations;
CREATE TRIGGER on_post_annotations_updated
    BEFORE UPDATE ON public.post_annotations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. 开启 Supabase Realtime 实时广播推送
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'post_annotations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_annotations;
    END IF;
END $$;
