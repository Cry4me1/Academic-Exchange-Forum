-- ==============================================================================
-- 迁移脚本: 20261024_profile_analytics_and_last_seen.sql
-- 描述: 个人主页多元数据与在线时间感知系统
--       1. profiles 新增 last_seen_at 与 show_online_status 隐私开关字段并回填存量数据
--       2. 新增服务端节流心跳 RPC touch_user_last_seen()
--       3. 新增主页多元数据聚合 RPC get_scholar_profile_analytics(uuid)
--          (聚合 365 天热力图每日细分明细、24h 活跃时段分布、涉及领域真实篇数与互动数)
-- ==============================================================================

-- 1. 扩充 profiles 表字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE NOT NULL;

COMMENT ON COLUMN public.profiles.last_seen_at IS '用户最近一次在线活跃时间戳';
COMMENT ON COLUMN public.profiles.show_online_status IS '是否对外公开在线状态与上次在线时间';

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles(last_seen_at DESC);

-- 回填存量用户的 last_seen_at（优先取最近发帖/评论/点赞时间，兜底取注册时间）
WITH latest_activity AS (
  SELECT user_id, MAX(act_at) AS max_at
  FROM (
    SELECT author_id AS user_id, MAX(created_at) AS act_at FROM public.posts GROUP BY author_id
    UNION ALL
    SELECT author_id AS user_id, MAX(created_at) AS act_at FROM public.comments GROUP BY author_id
    UNION ALL
    SELECT user_id, MAX(created_at) AS act_at FROM public.likes GROUP BY user_id
  ) sub
  GROUP BY user_id
)
UPDATE public.profiles p
SET last_seen_at = COALESCE(la.max_at, p.created_at, NOW())
FROM latest_activity la
WHERE p.id = la.user_id;

-- 2. 服务端防抖更新在线心跳 RPC（2 分钟内重复触发跳过写入，降低 IOPS 开销）
CREATE OR REPLACE FUNCTION public.touch_user_last_seen()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET last_seen_at = NOW()
  WHERE id = v_uid
    AND (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '2 minutes');
END;
$$;

REVOKE ALL ON FUNCTION public.touch_user_last_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_user_last_seen() TO authenticated;

-- 3. 个人主页多元数据一站式聚合 RPC（含细分构成明细）
CREATE OR REPLACE FUNCTION public.get_scholar_profile_analytics(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer_id UUID := auth.uid();
  v_is_owner BOOLEAN := (v_viewer_id IS NOT NULL AND v_viewer_id = p_target_user_id);
  v_profile RECORD;
  v_heatmap JSONB;
  v_hourly JSONB;
  v_domains JSONB;
BEGIN
  SELECT id, last_seen_at, COALESCE(show_online_status, TRUE) AS show_online_status
  INTO v_profile
  FROM public.profiles
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- A. 聚合近 375 天每日活跃计数及发帖/评论/评审决斗细分明细
  WITH raw_events AS (
    SELECT (created_at AT TIME ZONE 'Asia/Shanghai')::DATE AS act_date, 'post' AS kind
    FROM public.posts
    WHERE author_id = p_target_user_id
      AND is_published = TRUE
      AND COALESCE(is_hidden, FALSE) = FALSE
      AND COALESCE(review_status, 'approved') = 'approved'
      AND created_at >= NOW() - INTERVAL '375 days'
    UNION ALL
    SELECT (created_at AT TIME ZONE 'Asia/Shanghai')::DATE, 'comment' AS kind
    FROM public.comments
    WHERE author_id = p_target_user_id
      AND created_at >= NOW() - INTERVAL '375 days'
    UNION ALL
    SELECT (created_at AT TIME ZONE 'Asia/Shanghai')::DATE, 'other' AS kind
    FROM public.peer_reviews
    WHERE user_id = p_target_user_id
      AND created_at >= NOW() - INTERVAL '375 days'
    UNION ALL
    SELECT (created_at AT TIME ZONE 'Asia/Shanghai')::DATE, 'other' AS kind
    FROM public.duels
    WHERE (challenger_id = p_target_user_id OR opponent_id = p_target_user_id)
      AND created_at >= NOW() - INTERVAL '375 days'
  ),
  daily_agg AS (
    SELECT act_date,
           COUNT(*)::INT AS cnt,
           COUNT(*) FILTER (WHERE kind = 'post')::INT AS posts_cnt,
           COUNT(*) FILTER (WHERE kind = 'comment')::INT AS comments_cnt,
           COUNT(*) FILTER (WHERE kind = 'other')::INT AS others_cnt
    FROM raw_events
    GROUP BY act_date
    ORDER BY act_date ASC
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', to_char(act_date, 'YYYY-MM-DD'),
    'count', cnt,
    'posts', posts_cnt,
    'comments', comments_cnt,
    'others', others_cnt
  )), '[]'::jsonb)
  INTO v_heatmap
  FROM daily_agg;

  -- B. 聚合 0-23 时活跃频次数组
  WITH hour_events AS (
    SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Shanghai'))::INT AS hr
    FROM public.posts
    WHERE author_id = p_target_user_id
      AND is_published = TRUE
      AND COALESCE(is_hidden, FALSE) = FALSE
      AND COALESCE(review_status, 'approved') = 'approved'
    UNION ALL
    SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Shanghai'))::INT AS hr
    FROM public.comments
    WHERE author_id = p_target_user_id
    UNION ALL
    SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Shanghai'))::INT AS hr
    FROM public.peer_reviews
    WHERE user_id = p_target_user_id
  ),
  hour_counts AS (
    SELECT gs.h AS hr, COALESCE(COUNT(he.hr), 0)::INT AS cnt
    FROM generate_series(0, 23) AS gs(h)
    LEFT JOIN hour_events he ON he.hr = gs.h
    GROUP BY gs.h
    ORDER BY gs.h ASC
  )
  SELECT COALESCE(jsonb_agg(cnt ORDER BY hr ASC), '[]'::jsonb)
  INTO v_hourly
  FROM hour_counts;

  -- C. 聚合涉及领域标签真实发帖篇数、评论条数与点赞浏览次数
  WITH tag_events AS (
    SELECT unnest(tags) AS tag, 1 AS p_cnt, 0 AS c_cnt, 0 AS l_cnt, 3.0 AS create_w, 3.0 AS total_w
    FROM public.posts
    WHERE author_id = p_target_user_id
      AND is_published = TRUE
      AND COALESCE(is_hidden, FALSE) = FALSE
      AND COALESCE(review_status, 'approved') = 'approved'
    UNION ALL
    SELECT unnest(p.tags) AS tag, 0 AS p_cnt, 1 AS c_cnt, 0 AS l_cnt, 1.5 AS create_w, 2.0 AS total_w
    FROM public.comments c
    JOIN public.posts p ON p.id = c.post_id
    WHERE c.author_id = p_target_user_id
      AND p.is_published = TRUE
      AND COALESCE(p.is_hidden, FALSE) = FALSE
    UNION ALL
    SELECT unnest(p.tags) AS tag, 0 AS p_cnt, 0 AS c_cnt, 1 AS l_cnt, 0.0 AS create_w, 1.0 AS total_w
    FROM public.likes l
    JOIN public.posts p ON p.id = l.post_id
    WHERE l.user_id = p_target_user_id
      AND p.is_published = TRUE
      AND COALESCE(p.is_hidden, FALSE) = FALSE
  ),
  tag_agg AS (
    SELECT trim(tag) AS clean_tag,
           SUM(p_cnt)::INT AS posts_count,
           SUM(c_cnt)::INT AS comments_count,
           SUM(l_cnt)::INT AS likes_count,
           ROUND(SUM(create_w)::NUMERIC, 1) AS creation_score,
           ROUND(SUM(total_w)::NUMERIC, 1) AS total_score
    FROM tag_events
    WHERE tag IS NOT NULL AND trim(tag) <> ''
    GROUP BY trim(tag)
    ORDER BY total_score DESC, creation_score DESC
    LIMIT 12
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'tag', clean_tag,
    'posts_count', posts_count,
    'comments_count', comments_count,
    'likes_count', likes_count,
    'creation', creation_score,
    'total', total_score
  )), '[]'::jsonb)
  INTO v_domains
  FROM tag_agg;

  RETURN jsonb_build_object(
    'last_seen_at', CASE
      WHEN v_is_owner OR v_profile.show_online_status THEN v_profile.last_seen_at
      ELSE NULL
    END,
    'show_online_status', v_profile.show_online_status,
    'heatmap', v_heatmap,
    'hourly', v_hourly,
    'domains', v_domains
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scholar_profile_analytics(UUID) TO anon, authenticated;
