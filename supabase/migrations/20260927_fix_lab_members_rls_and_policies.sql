-- ==============================================================================
-- 迁移: 补齐共创研讨室 lab_members 与 lab_rooms 的完整 RLS 策略
-- ==============================================================================

-- 1. 确保 lab_members 具备针对登录用户的完整 RLS 读写策略
ALTER TABLE public.lab_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_members_select" ON public.lab_members;
CREATE POLICY "lab_members_select" ON public.lab_members
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lab_members_insert" ON public.lab_members;
CREATE POLICY "lab_members_insert" ON public.lab_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.lab_rooms lr
            WHERE lr.id = lab_members.room_id AND lr.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "lab_members_update" ON public.lab_members;
CREATE POLICY "lab_members_update" ON public.lab_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.lab_rooms lr
            WHERE lr.id = lab_members.room_id AND lr.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "lab_members_delete" ON public.lab_members;
CREATE POLICY "lab_members_delete" ON public.lab_members
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.lab_rooms lr
            WHERE lr.id = lab_members.room_id AND lr.created_by = auth.uid()
        )
    );

-- 2. 优化 lab_rooms 的 SELECT 策略：允许已认证用户读取房间公开元数据（用于大盘展示及受邀页渲染）
DROP POLICY IF EXISTS "lab_rooms_select_member" ON public.lab_rooms;
DROP POLICY IF EXISTS "lab_rooms_select_authenticated" ON public.lab_rooms;
CREATE POLICY "lab_rooms_select_authenticated" ON public.lab_rooms
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. 补齐 lab_post_links 的 RLS 策略（如果尚未配置）
ALTER TABLE public.lab_post_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lab_post_links_select" ON public.lab_post_links;
CREATE POLICY "lab_post_links_select" ON public.lab_post_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.lab_members lm
            WHERE lm.room_id = lab_post_links.room_id
            AND lm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.lab_rooms lr
            WHERE lr.id = lab_post_links.room_id
            AND lr.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "lab_post_links_insert" ON public.lab_post_links;
CREATE POLICY "lab_post_links_insert" ON public.lab_post_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lab_members lm
            WHERE lm.room_id = lab_post_links.room_id
            AND lm.user_id = auth.uid()
            AND lm.role IN ('owner', 'admin', 'editor')
        ) OR
        EXISTS (
            SELECT 1 FROM public.lab_rooms lr
            WHERE lr.id = lab_post_links.room_id
            AND lr.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "lab_post_links_delete" ON public.lab_post_links;
CREATE POLICY "lab_post_links_delete" ON public.lab_post_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.lab_members lm
            WHERE lm.room_id = lab_post_links.room_id
            AND lm.user_id = auth.uid()
            AND lm.role IN ('owner', 'admin')
        ) OR
        EXISTS (
            SELECT 1 FROM public.lab_rooms lr
            WHERE lr.id = lab_post_links.room_id
            AND lr.created_by = auth.uid()
        )
    );
