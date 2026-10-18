-- ==============================================================================
-- 迁移: 20261018_ai_sandbox_experiments.sql
-- 描述: AI 底层算法演练场代码快照与成果分享表
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_sandbox_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL DEFAULT '未命名 AI 算法演练',
    description TEXT,
    code TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY['pytorch', 'autograd'],
    execution_time_ms INT,
    is_public BOOLEAN DEFAULT true,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全 RLS
ALTER TABLE public.ai_sandbox_experiments ENABLE ROW LEVEL SECURITY;

-- 策略: 允许所有人阅读公开的实验
CREATE POLICY "Public AI experiments are viewable by everyone" 
    ON public.ai_sandbox_experiments
    FOR SELECT 
    USING (is_public = true OR auth.uid() = author_id);

-- 策略: 登录用户可保存代码
CREATE POLICY "Authenticated users can create AI experiments" 
    ON public.ai_sandbox_experiments
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = author_id);

-- 策略: 仅作者可更新
CREATE POLICY "Users can update their own AI experiments" 
    ON public.ai_sandbox_experiments
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- 策略: 仅作者可删除
CREATE POLICY "Users can delete their own AI experiments" 
    ON public.ai_sandbox_experiments
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_ai_sandbox_author ON public.ai_sandbox_experiments(author_id);
CREATE INDEX IF NOT EXISTS idx_ai_sandbox_created_at ON public.ai_sandbox_experiments(created_at DESC);
