-- ==============================================================================
-- 迁移脚本: 20261011_scholar_level_system.sql
-- 描述: 学者等级体系（Lv1 - Lv6）重构
--       1. 废除充值消费绑定，采用发帖量、获赞量、社区共建贡献三维驱动
--       2. 引入 PQS 帖子质量评分机制，过滤纯刷量低质水帖
--       3. 每月研讨津贴从 100 积分起步逐级递增，与现有积分体系完全统一
--       4. 限制学术对决质押需 Lv2+ 学者权限
-- ==============================================================================

-- 1. profiles 表扩充学术指标字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scholar_exp INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS valid_post_count INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_likes_received INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS community_contributions_count INT DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.profiles.scholar_exp IS '学术综合贡献经验值 (EXP)';
COMMENT ON COLUMN public.profiles.valid_post_count IS '有效学术产出发帖数 (PQS >= 60)';
COMMENT ON COLUMN public.profiles.total_likes_received IS '同行学术认可累计获赞总量';
COMMENT ON COLUMN public.profiles.community_contributions_count IS '深度社区学术共建数 (采纳回答+同行评审+对决胜场)';

-- 2. posts 表扩充 PQS 质量评分字段
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS pqs_score INT DEFAULT 60 NOT NULL,
  ADD COLUMN IF NOT EXISTS is_quality_approved BOOLEAN DEFAULT TRUE NOT NULL;

COMMENT ON COLUMN public.posts.pqs_score IS 'PQS 帖子质量评分 (0-100)，达到 60 方可计入升级有效帖';
COMMENT ON COLUMN public.posts.is_quality_approved IS '是否通过 PQS 质量门槛';

-- 3. vip_level_config 表升级为学者等级规则配置
ALTER TABLE public.vip_level_config
  ADD COLUMN IF NOT EXISTS min_exp INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS min_posts INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS min_likes INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS min_contributions INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS monthly_bonus NUMERIC(12,2) DEFAULT 100.00 NOT NULL;

-- 4. 插入并修正 Lv1 ~ Lv6 默认规则配置（简洁纯粹命名，津贴 100 起步）
INSERT INTO public.vip_level_config (level, name, title, min_spent, min_exp, min_posts, min_likes, min_contributions, monthly_bonus, perks, is_active)
VALUES
  (1, 'Lv1', 'Lv1', 0, 0, 0, 0, 0, 100.00, ARRAY['基础学术浏览与交流', '常规发帖与评论', '月度研讨津贴 100 积分'], TRUE),
  (2, 'Lv2', 'Lv2', 0, 100, 2, 5, 0, 180.00, ARRAY['解锁学术对决预测质押', '解锁边缘学术批注权限', '月度研讨津贴 180 积分'], TRUE),
  (3, 'Lv3', 'Lv3', 0, 400, 8, 30, 1, 280.00, ARRAY['解锁帖子历史版本追溯对比', '解锁撰写同行评审资格', '月度研讨津贴 280 积分'], TRUE),
  (4, 'Lv4', 'Lv4', 0, 1200, 20, 120, 5, 420.00, ARRAY['解锁深度推理思考链通道', '优质解答专享流光高亮', '解锁创建协作实验室', '月度研讨津贴 420 积分'], TRUE),
  (5, 'Lv5', 'Lv5', 0, 3000, 40, 350, 15, 600.00, ARRAY['同行评审 1.5 倍权威系数', '专属黑曜石液态玻璃名牌', '月度研讨津贴 600 积分'], TRUE),
  (6, 'Lv6', 'Lv6', 0, 8000, 80, 1000, 35, 1000.00, ARRAY['全站顶峰学术荣誉标牌', '全息流光粒子勋章', '月度研讨津贴 1000 积分'], TRUE)
ON CONFLICT (level) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  min_exp = EXCLUDED.min_exp,
  min_posts = EXCLUDED.min_posts,
  min_likes = EXCLUDED.min_likes,
  min_contributions = EXCLUDED.min_contributions,
  monthly_bonus = EXCLUDED.monthly_bonus,
  perks = EXCLUDED.perks,
  is_active = EXCLUDED.is_active;

-- 5. 核心计算与同步函数: sync_scholar_level(uuid)
CREATE OR REPLACE FUNCTION public.sync_scholar_level(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_posts INT := 0;
  v_post_likes INT := 0;
  v_comment_likes INT := 0;
  v_total_likes INT := 0;
  v_accepted INT := 0;
  v_peer_reviews INT := 0;
  v_duel_wins INT := 0;
  v_contributions INT := 0;
  v_exp INT := 0;
  v_new_level INT := 1;
  v_cfg RECORD;
BEGIN
  -- 1. 统计有效发帖数 (通过 PQS 质量要求且审核通过并未被删除)
  SELECT COUNT(*) INTO v_posts
  FROM public.posts
  WHERE author_id = p_user_id
    AND is_published = TRUE
    AND review_status = 'approved'
    AND COALESCE(pqs_score, 60) >= 60;

  -- 2. 统计主帖获赞数
  SELECT COUNT(l.id) INTO v_post_likes
  FROM public.likes l
  JOIN public.posts p ON l.post_id = p.id
  WHERE p.author_id = p_user_id;

  -- 3. 统计评论获赞数
  SELECT COUNT(l.id) INTO v_comment_likes
  FROM public.likes l
  JOIN public.comments c ON l.comment_id = c.id
  WHERE c.author_id = p_user_id;

  v_total_likes := v_post_likes + v_comment_likes;

  -- 4. 统计最佳答案采纳数
  SELECT COUNT(*) INTO v_accepted
  FROM public.comments
  WHERE author_id = p_user_id
    AND is_accepted = TRUE;

  -- 5. 统计同行评审完成数
  SELECT COUNT(*) INTO v_peer_reviews
  FROM public.peer_reviews
  WHERE reviewer_id = p_user_id;

  -- 6. 统计学术对决胜场数
  SELECT COALESCE(duel_wins, 0) INTO v_duel_wins
  FROM public.profiles
  WHERE id = p_user_id;

  v_contributions := v_accepted + v_peer_reviews + v_duel_wins;

  -- 7. 综合学术经验值公式
  -- 发帖: 15 EXP | 帖赞: 5 EXP | 评论赞: 3 EXP | 采纳: 30 EXP | 评审: 25 EXP | 对决胜场: 20 EXP
  v_exp := (v_posts * 15) 
         + (v_post_likes * 5) 
         + (v_comment_likes * 3) 
         + (v_accepted * 30) 
         + (v_peer_reviews * 25) 
         + (v_duel_wins * 20);

  -- 8. 根据经验与门槛判定最高达标等级 (Lv6 -> Lv1)
  FOR v_cfg IN
    SELECT level, min_exp, min_posts, min_likes, min_contributions
    FROM public.vip_level_config
    WHERE is_active = TRUE
    ORDER BY level DESC
  LOOP
    IF v_exp >= v_cfg.min_exp 
       AND v_posts >= v_cfg.min_posts 
       AND v_total_likes >= v_cfg.min_likes 
       AND v_contributions >= v_cfg.min_contributions THEN
      v_new_level := v_cfg.level;
      EXIT;
    END IF;
  END LOOP;

  -- 保底 Lv1
  IF v_new_level < 1 THEN
    v_new_level := 1;
  END IF;

  -- 9. 写回 profiles 档案
  UPDATE public.profiles
  SET vip_level = v_new_level,
      vip_title = 'Lv' || v_new_level,
      scholar_exp = v_exp,
      valid_post_count = v_posts,
      total_likes_received = v_total_likes,
      community_contributions_count = v_contributions
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 全量重算函数: sync_all_scholar_levels()
CREATE OR REPLACE FUNCTION public.sync_all_scholar_levels()
RETURNS VOID AS $$
BEGIN
  PERFORM public.sync_scholar_level(id)
  FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 兼容老函数接口 (无缝过渡)
CREATE OR REPLACE FUNCTION public.sync_vip_title(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM public.sync_scholar_level(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_all_vip_titles()
RETURNS VOID AS $$
BEGIN
  PERFORM public.sync_all_scholar_levels();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 权限赋权
REVOKE ALL ON FUNCTION public.sync_scholar_level(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scholar_level(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sync_all_scholar_levels() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_scholar_levels() TO service_role;

REVOKE ALL ON FUNCTION public.sync_vip_title(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_vip_title(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sync_all_vip_titles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_vip_titles() TO service_role;

-- 7. 重写每月研讨津贴发放函数 claim_monthly_bonus()
CREATE OR REPLACE FUNCTION public.claim_monthly_bonus()
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_month TEXT;
  v_exists BOOLEAN;
  v_level INT;
  v_bonus_amount NUMERIC(12,2) := 100.00;
  v_new_balance NUMERIC(12,2);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录' USING ERRCODE = '42501';
  END IF;

  v_month := to_char(now(), 'YYYY-MM');

  -- 检查本月是否已领
  SELECT EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = v_uid 
      AND type = 'monthly_bonus' 
      AND to_char(created_at, 'YYYY-MM') = v_month
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  -- 获取用户当前学者等级
  SELECT COALESCE(vip_level, 1) INTO v_level
  FROM public.profiles
  WHERE id = v_uid;

  -- 从学者等级配置中读取对应的月度津贴额度
  SELECT COALESCE(monthly_bonus, 100.00) INTO v_bonus_amount
  FROM public.vip_level_config
  WHERE level = v_level AND is_active = TRUE;

  IF v_bonus_amount IS NULL OR v_bonus_amount <= 0 THEN
    v_bonus_amount := 100.00 + (GREATEST(v_level - 1, 0) * 80.00);
  END IF;

  -- 发放津贴积分 (转为整数积分调用内部 add_user_credits)
  PERFORM public.add_user_credits(
    v_uid,
    v_bonus_amount::INTEGER,
    'monthly_bonus',
    v_month || ' 月度学者研讨津贴 (Lv' || v_level || ')'
  );

  SELECT balance INTO v_new_balance
  FROM public.user_credits
  WHERE user_id = v_uid;

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'bonus_amount', v_bonus_amount,
    'level', v_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.claim_monthly_bonus() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_monthly_bonus() TO authenticated;

-- 8. 限制学术对决下注：仅限 Lv2 及以上学者参与质押
CREATE OR REPLACE FUNCTION public.place_duel_bet(
  p_duel_id UUID,
  p_target_id UUID,
  p_amount INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_duel public.duels%ROWTYPE;
  v_bet_id UUID;
  v_level INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录' USING ERRCODE = '42501';
  END IF;

  -- 门槛校验: 需达到 Lv2 学者等级
  SELECT COALESCE(vip_level, 1) INTO v_level
  FROM public.profiles
  WHERE id = v_uid;

  IF v_level < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'REQUIRES_SCHOLAR_LV2');
  END IF;

  -- 金额范围校验
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  -- 决斗必须存在
  SELECT * INTO v_duel FROM public.duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_FOUND');
  END IF;

  -- 必须是进行中的决斗
  IF v_duel.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_ACTIVE');
  END IF;

  -- 选手不能自押
  IF v_uid = v_duel.challenger_id OR v_uid = v_duel.opponent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTICIPANT_CANNOT_BET');
  END IF;

  -- 押注对象必须是本场选手
  IF p_target_id <> v_duel.challenger_id AND p_target_id <> v_duel.opponent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TARGET');
  END IF;

  -- 每人每场只能下注一次
  IF EXISTS (
    SELECT 1 FROM public.duel_bets
    WHERE duel_id = p_duel_id AND spectator_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_BET');
  END IF;

  -- 原子扣减信誉分
  UPDATE public.profiles
  SET reputation_score = reputation_score - p_amount
  WHERE id = v_uid
    AND reputation_score >= p_amount;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_REPUTATION');
  END IF;

  -- 插入押注单
  INSERT INTO public.duel_bets (duel_id, spectator_id, target_id, amount)
  VALUES (p_duel_id, v_uid, p_target_id, p_amount)
  RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object('success', true, 'bet_id', v_bet_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.place_duel_bet(uuid, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_duel_bet(uuid, uuid, integer) TO authenticated;

-- 执行一次全量存量用户学者等级校准
DO $$
BEGIN
  PERFORM public.sync_all_scholar_levels();
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
