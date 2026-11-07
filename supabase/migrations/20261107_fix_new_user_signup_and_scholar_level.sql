-- ==============================================================================
-- 迁移脚本: 20261107_fix_new_user_signup_and_scholar_level.sql
-- 描述: 修复新用户注册时报 "Database error creating new user"
--       (根因: auth.users INSERT -> handle_new_user_credits -> add_user_credits
--        -> sync_vip_title -> sync_scholar_level 查询了不存在的 peer_reviews.reviewer_id 列)
--       同时补齐 peer_reviews 外键索引、保护 vip_override 特授头衔、加固 search_path 与最小权限
-- ==============================================================================

-- 1. 为 public.peer_reviews 补齐 reviewer_id 兼容列、回填历史数据并建立外键索引
ALTER TABLE public.peer_reviews
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.peer_reviews
SET reviewer_id = user_id
WHERE reviewer_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_peer_reviews_user ON public.peer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer ON public.peer_reviews(reviewer_id);

CREATE OR REPLACE FUNCTION public.sync_peer_review_user_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.reviewer_id IS NOT NULL THEN
    NEW.user_id := NEW.reviewer_id;
  ELSIF NEW.reviewer_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.reviewer_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_peer_review_user_fields
  BEFORE INSERT OR UPDATE ON public.peer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_peer_review_user_fields();

-- 2. 重写并加固核心学者等级计算函数 public.sync_scholar_level(uuid)
CREATE OR REPLACE FUNCTION public.sync_scholar_level(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- 1. 统计有效发帖数 (通过 PQS 质量要求且审核通过并未被隐藏)
  SELECT COUNT(*) INTO v_posts
  FROM public.posts
  WHERE author_id = p_user_id
    AND is_published = TRUE
    AND COALESCE(is_hidden, FALSE) = FALSE
    AND COALESCE(review_status::text, 'approved') = 'approved'
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

  -- 5. 统计同行评审完成数 (双向兼容 user_id 与 reviewer_id)
  SELECT COUNT(*) INTO v_peer_reviews
  FROM public.peer_reviews
  WHERE user_id = p_user_id OR reviewer_id = p_user_id;

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

  IF v_new_level < 1 THEN
    v_new_level := 1;
  END IF;

  -- 9. 写回 profiles 档案（保留 vip_override 管理员锁定等级与专属头衔）
  UPDATE public.profiles p
  SET vip_level = CASE
        WHEN COALESCE(p.vip_override, FALSE) = TRUE THEN p.vip_level
        ELSE v_new_level
      END,
      vip_title = CASE
        WHEN COALESCE(p.vip_override, FALSE) = TRUE THEN COALESCE(NULLIF(p.vip_title, ''), 'Lv' || p.vip_level)
        ELSE 'Lv' || v_new_level
      END,
      scholar_exp = GREATEST(
        v_exp,
        CASE
          WHEN COALESCE(p.vip_override, FALSE) = TRUE THEN COALESCE(
            (SELECT c.min_exp FROM public.vip_level_config c WHERE c.level = p.vip_level LIMIT 1),
            0
          )
          ELSE 0
        END
      ),
      valid_post_count = v_posts,
      total_likes_received = v_total_likes,
      community_contributions_count = v_contributions
  WHERE p.id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_all_scholar_levels()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_scholar_level(id)
  FROM public.profiles;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_vip_title(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_scholar_level(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_all_vip_titles()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_all_scholar_levels();
END;
$$;

-- 3. 加固注册链路函数 (固定 search_path = public 并收紧权限)
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT '积分充值'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_recharged)
  VALUES (
    p_user_id,
    p_amount,
    CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = public.user_credits.balance + p_amount,
    total_recharged = public.user_credits.total_recharged
      + CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions
    (user_id, amount, type, description)
  VALUES
    (p_user_id, p_amount, p_type, p_description);

  PERFORM public.sync_vip_title(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url, auth_provider, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''), split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'auth_provider'), ''), 'email'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(public.profiles.username, ''), EXCLUDED.username),
    auth_provider = COALESCE(NULLIF(public.profiles.auth_provider, ''), EXCLUDED.auth_provider);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signup_bonus INTEGER := 100;
  v_setting_val JSONB;
BEGIN
  SELECT value INTO v_setting_val
  FROM public.system_settings
  WHERE key = 'credits';

  IF v_setting_val IS NOT NULL AND (v_setting_val->>'signup_bonus') IS NOT NULL THEN
    v_signup_bonus := (v_setting_val->>'signup_bonus')::INTEGER;
  END IF;

  IF v_signup_bonus > 0 THEN
    PERFORM public.add_user_credits(
      NEW.id,
      v_signup_bonus,
      'signup_bonus',
      '新用户注册奖励'
    );
  ELSE
    INSERT INTO public.user_credits (user_id, balance, total_spent, total_recharged)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET email_verified = (NEW.email_confirmed_at IS NOT NULL) WHERE id = NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
      UPDATE public.profiles SET email_verified = (NEW.email_confirmed_at IS NOT NULL) WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. 最小权限控制
REVOKE ALL ON FUNCTION public.sync_scholar_level(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scholar_level(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sync_all_scholar_levels() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_scholar_levels() TO service_role;

REVOKE ALL ON FUNCTION public.sync_vip_title(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_vip_title(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.sync_all_vip_titles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_vip_titles() TO service_role;

REVOKE ALL ON FUNCTION public.add_user_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_credits() TO supabase_auth_admin, service_role;

REVOKE ALL ON FUNCTION public.sync_email_verified() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_email_verified() TO supabase_auth_admin, service_role;

-- 5. 执行全量存量用户学者等级真实校准
SELECT public.sync_all_scholar_levels();
