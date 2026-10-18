-- ==============================================================================
-- 迁移: 20261018_code_execution_cache.sql
-- 描述: 帖子 Python 代码块首次运行缓存与全站共享快照表
-- 机制: 首次点击运行触发 E2B 沙盒计算并持久化；后续读者点击直接秒出缓存结果，降级免计算
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.code_execution_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_hash VARCHAR(64) UNIQUE NOT NULL,
    language VARCHAR(32) NOT NULL DEFAULT 'python',
    code_snippet TEXT NOT NULL,
    first_run_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_run_user_name VARCHAR(128) DEFAULT '学术同行',
    stdout TEXT DEFAULT '',
    stderr TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    execution_time_ms INT DEFAULT 0,
    hit_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全 RLS
ALTER TABLE public.code_execution_cache ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有人 (包括访客) 均可读取已缓存的代码运行结果，实现秒级直接跳出
CREATE POLICY "Public read code execution cache"
    ON public.code_execution_cache
    FOR SELECT
    USING (true);

-- 策略 2: 允许已登录用户写入新执行的缓存快照
CREATE POLICY "Authenticated users can insert execution cache"
    ON public.code_execution_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 策略 3: 允许已登录用户更新缓存（如重新执行或增加点击次数）
CREATE POLICY "Authenticated users can update execution cache"
    ON public.code_execution_cache
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 允许匿名或游客调用 RPC 自增点击量 (若需要)
CREATE OR REPLACE FUNCTION public.increment_code_cache_hits(target_hash VARCHAR(64))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.code_execution_cache
    SET hit_count = hit_count + 1,
        updated_at = NOW()
    WHERE code_hash = target_hash;
END;
$$;

-- 建立高频哈希检索索引
CREATE INDEX IF NOT EXISTS idx_code_execution_cache_hash ON public.code_execution_cache(code_hash);
