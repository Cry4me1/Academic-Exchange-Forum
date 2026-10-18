-- ============================================
-- 专栏导读文章设置与主页流聚合展示 (Collection Lead Post & Feed Consolidation)
-- 创建时间: 2026-10-18
-- 功能: 允许作者在专栏中设置“主页仅展示一篇文章（导读文章）”，其余文章通过导读文章内的专栏目录阅读；作者亦可不设置（默认各篇独立展示）
-- ============================================

-- 1. 在 collections 表添加导读文章与主页展示控制字段
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS only_show_lead_post_in_feed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lead_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- 2. 添加部分索引以加速主页流判断
CREATE INDEX IF NOT EXISTS idx_collections_feed_lead 
  ON public.collections(only_show_lead_post_in_feed) 
  WHERE only_show_lead_post_in_feed = TRUE;

-- 3. 创建判定函数：获取主页 Feed 流中需要被折叠/排除的帖子 ID
-- 说明：如果专栏开启了 only_show_lead_post_in_feed = TRUE，
-- 则该专栏中除导读文章（作者指定 lead_post_id，若未指定则兜底为专栏内 position 最小的首篇）之外的所有其他文章 ID，
-- 均在此函数中返回，供主页 Feed 进行排除过滤。
CREATE OR REPLACE FUNCTION public.get_feed_excluded_collection_post_ids()
RETURNS TABLE (post_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH active_collections AS (
    SELECT 
      c.id AS col_id,
      COALESCE(
        -- 若作者显式指定 lead_post_id，且该文章确实在该专栏中且未被删除
        (
          SELECT cp_lead.post_id 
          FROM public.collection_posts cp_lead 
          JOIN public.posts p ON p.id = cp_lead.post_id
          WHERE cp_lead.collection_id = c.id 
            AND cp_lead.post_id = c.lead_post_id
            AND p.is_published = TRUE
            AND p.is_hidden = FALSE
          LIMIT 1
        ),
        -- 兜底默认：取专栏内当前排序第一的有效公开文章
        (
          SELECT cp_first.post_id 
          FROM public.collection_posts cp_first 
          JOIN public.posts p2 ON p2.id = cp_first.post_id
          WHERE cp_first.collection_id = c.id
            AND p2.is_published = TRUE
            AND p2.is_hidden = FALSE
          ORDER BY cp_first.position ASC, cp_first.added_at ASC 
          LIMIT 1
        )
      ) AS effective_lead_post_id
    FROM public.collections c
    WHERE c.only_show_lead_post_in_feed = TRUE
  )
  SELECT DISTINCT cp.post_id
  FROM public.collection_posts cp
  JOIN active_collections ac ON ac.col_id = cp.collection_id
  WHERE cp.post_id IS NOT NULL 
    AND (ac.effective_lead_post_id IS NOT NULL AND cp.post_id != ac.effective_lead_post_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 授予函数执行权限给已认证用户与匿名访客（主页访客亦能生效）
GRANT EXECUTE ON FUNCTION public.get_feed_excluded_collection_post_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_feed_excluded_collection_post_ids() TO anon;

-- 4. 创建 RPC 函数：专栏作者快捷设置/切换导读文章与主页流聚合模式
CREATE OR REPLACE FUNCTION public.set_collection_lead_post(
  target_collection_id UUID,
  target_post_id UUID,
  enable_feed_limit BOOLEAN DEFAULT TRUE
)
RETURNS JSONB AS $$
DECLARE
  v_author_id UUID;
  v_exists BOOLEAN;
BEGIN
  -- 校验专栏所有权
  SELECT author_id INTO v_author_id
  FROM public.collections
  WHERE id = target_collection_id;

  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '专栏不存在');
  END IF;

  IF v_author_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', '未授权：只有专栏作者可以修改导读文章设置');
  END IF;

  -- 如果指定了 target_post_id，校验该帖子确实隶属于该专栏
  IF target_post_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.collection_posts 
      WHERE collection_id = target_collection_id AND post_id = target_post_id
    ) INTO v_exists;

    IF NOT v_exists THEN
      RETURN jsonb_build_object('success', false, 'error', '指定文章不属于该专栏');
    END IF;
  END IF;

  -- 更新专栏设置
  UPDATE public.collections
  SET 
    lead_post_id = target_post_id,
    only_show_lead_post_in_feed = COALESCE(enable_feed_limit, only_show_lead_post_in_feed),
    updated_at = NOW()
  WHERE id = target_collection_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_collection_lead_post(UUID, UUID, BOOLEAN) TO authenticated;
