-- ============================================================================
-- Phase 4: 对决管理 (/admin/duels) 数据库迁移、RLS 策略、自动退费与原子仲裁 RPC
-- Created: 2026-11-07
-- 说明: 采用纯增量幂等语法（CREATE OR REPLACE TRIGGER / pg_policies 存在性检查），
--       积分流水沿用兼容枚举 ('ask_ai_usage' / 'admin_adjustment') + metadata.tx_subtype
-- ============================================================================

-- 1. 管理员角色层级判定辅助函数（SECURITY DEFINER，锁定 search_path，收口 PUBLIC 权限）
CREATE OR REPLACE FUNCTION public.has_admin_role(p_min_role TEXT DEFAULT 'analyst')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_user_level INT := 0;
  v_req_level INT := 1;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  IF to_regclass('public.admin_roles') IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO v_role
  FROM public.admin_roles
  WHERE user_id = auth.uid();

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  v_user_level := CASE v_role
    WHEN 'analyst' THEN 1
    WHEN 'moderator' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
    ELSE 0
  END;

  v_req_level := CASE p_min_role
    WHEN 'analyst' THEN 1
    WHEN 'moderator' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'super_admin' THEN 4
    ELSE 99
  END;

  RETURN v_user_level >= v_req_level;
END;
$$;

REVOKE ALL ON FUNCTION public.has_admin_role(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(TEXT) TO service_role;

-- 2. 补齐管理后台所需 RLS 策略（使用 (SELECT ...) 优化 InitPlan，幂等检查 pg_policies）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'duels' AND policyname = 'Admins can view all duels'
  ) THEN
    CREATE POLICY "Admins can view all duels"
      ON public.duels
      FOR SELECT
      TO authenticated
      USING ((SELECT public.has_admin_role('analyst')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'duels' AND policyname = 'Participants or admins can delete cancelled duels'
  ) THEN
    CREATE POLICY "Participants or admins can delete cancelled duels"
      ON public.duels
      FOR DELETE
      TO authenticated
      USING (
        status = 'cancelled'
        AND (
          (SELECT auth.uid()) = challenger_id
          OR (SELECT auth.uid()) = opponent_id
          OR (SELECT public.has_admin_role('admin'))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'duel_invitations' AND policyname = 'Admins can view all duel invitations'
  ) THEN
    CREATE POLICY "Admins can view all duel invitations"
      ON public.duel_invitations
      FOR SELECT
      TO authenticated
      USING ((SELECT public.has_admin_role('analyst')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'duel_live_comments' AND policyname = 'Moderators can delete duel live comments'
  ) THEN
    CREATE POLICY "Moderators can delete duel live comments"
      ON public.duel_live_comments
      FOR DELETE
      TO authenticated
      USING ((SELECT public.has_admin_role('moderator')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'system_settings' AND policyname = 'Admins can upsert duel_config'
  ) THEN
    CREATE POLICY "Admins can upsert duel_config"
      ON public.system_settings
      FOR ALL
      TO authenticated
      USING (key = 'duel_config' AND (SELECT public.has_admin_role('admin')))
      WITH CHECK (key = 'duel_config' AND (SELECT public.has_admin_role('admin')));
  END IF;
END
$$;

-- 3. 后台高频巡检与异常雷达局部索引优化
CREATE INDEX IF NOT EXISTS idx_duels_status_created_at
  ON public.duels (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_duel_rounds_orphan
  ON public.duel_rounds (created_at DESC)
  WHERE ai_analyzed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_duel_invitations_pending_created
  ON public.duel_invitations (created_at ASC)
  WHERE status = 'pending';

-- 4. 初始化对决系统热配置种子（system_settings: key = 'duel_config'）
INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
  'duel_config',
  jsonb_build_object(
    'referee', jsonb_build_object(
      'model', 'deepseek-v4-flash',
      'thinking_enabled', true,
      'active_preset', 'youth_friendly',
      'custom_instructions', '',
      'max_evidence_score', 5,
      'max_citation_score', 3,
      'max_logic_score', 2,
      'fallacy_penalty', -10,
      'fallacy_lp_deduction', 10,
      'jaccard_threshold', 0.7,
      'min_content_length', 20,
      'max_content_length', 8000
    ),
    'economy', jsonb_build_object(
      'creation_fee', 100,
      'auto_refund_on_pending_cancel', true,
      'initial_lp', 100,
      'negative_ko_threshold', -30,
      'allowed_rounds', jsonb_build_array(3, 5, 7),
      'win_reputation_reward', 10,
      'loss_reputation_penalty', 5,
      'min_bet_level', 2,
      'min_bet_amount', 1,
      'max_bet_amount', 10000,
      'stall_warning_hours', 48,
      'invite_expire_hours', 72
    )
  ),
  '学术对决 AI 裁判参数、人格预设与经济风控动态配置',
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- 5. 修复观战质押缺陷：历史已扣信誉分的 pending 押注回填 funded = true，并升级 place_duel_bet 动态读取风控配置
UPDATE public.duel_bets
SET funded = TRUE
WHERE status = 'pending' AND funded = FALSE;

CREATE OR REPLACE FUNCTION public.place_duel_bet(
  p_duel_id UUID,
  p_target_id UUID,
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_duel public.duels%ROWTYPE;
  v_bet_id UUID;
  v_level INT;
  v_econ JSONB;
  v_min_level INT := 2;
  v_min_amount INT := 1;
  v_max_amount INT := 10000;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录' USING ERRCODE = '42501';
  END IF;

  SELECT value->'economy' INTO v_econ
  FROM public.system_settings
  WHERE key = 'duel_config';

  IF v_econ IS NOT NULL THEN
    v_min_level := COALESCE((v_econ->>'min_bet_level')::INT, 2);
    v_min_amount := COALESCE((v_econ->>'min_bet_amount')::INT, 1);
    v_max_amount := COALESCE((v_econ->>'max_bet_amount')::INT, 10000);
  END IF;

  SELECT COALESCE(vip_level, 1) INTO v_level
  FROM public.profiles
  WHERE id = v_uid;

  IF v_level < v_min_level THEN
    RETURN jsonb_build_object('success', false, 'error', 'REQUIRES_SCHOLAR_LV2');
  END IF;

  IF p_amount IS NULL OR p_amount < v_min_amount OR p_amount > v_max_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  SELECT * INTO v_duel FROM public.duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_FOUND');
  END IF;

  IF v_duel.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_ACTIVE');
  END IF;

  IF v_uid = v_duel.challenger_id OR v_uid = v_duel.opponent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTICIPANT_CANNOT_BET');
  END IF;

  IF p_target_id <> v_duel.challenger_id AND p_target_id <> v_duel.opponent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TARGET');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.duel_bets
    WHERE duel_id = p_duel_id AND spectator_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_BET');
  END IF;

  UPDATE public.profiles
  SET reputation_score = reputation_score - p_amount
  WHERE id = v_uid
    AND reputation_score >= p_amount;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_REPUTATION');
  END IF;

  INSERT INTO public.duel_bets (duel_id, spectator_id, target_id, amount, funded)
  VALUES (p_duel_id, v_uid, p_target_id, p_amount, TRUE)
  RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object('success', true, 'bet_id', v_bet_id);
END;
$$;

REVOKE ALL ON FUNCTION public.place_duel_bet(UUID, UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_duel_bet(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_duel_bet(UUID, UUID, INTEGER) TO service_role;

-- 6. 升级 create_duel_with_fee：服务端强制读取动态发起费、允许回合数与初始 LP，杜绝客户端篡改 p_fee
CREATE OR REPLACE FUNCTION public.create_duel_with_fee(
  p_topic TEXT,
  p_description TEXT,
  p_position TEXT,
  p_max_rounds INTEGER,
  p_opponent_id UUID,
  p_post_id UUID,
  p_fee INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_duel_id UUID;
  v_invitation_id UUID;
  v_deducted BOOLEAN := FALSE;
  v_econ JSONB;
  v_actual_fee INT := 100;
  v_initial_lp INT := 100;
  v_allowed_rounds JSONB := '[3, 5, 7]'::JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录' USING ERRCODE = '42501';
  END IF;

  SELECT value->'economy' INTO v_econ
  FROM public.system_settings
  WHERE key = 'duel_config';

  IF v_econ IS NOT NULL THEN
    v_actual_fee := GREATEST(0, COALESCE((v_econ->>'creation_fee')::INT, p_fee, 100));
    v_initial_lp := GREATEST(10, COALESCE((v_econ->>'initial_lp')::INT, 100));
    IF jsonb_typeof(v_econ->'allowed_rounds') = 'array' THEN
      v_allowed_rounds := v_econ->'allowed_rounds';
    END IF;
  ELSE
    v_actual_fee := GREATEST(0, COALESCE(p_fee, 100));
  END IF;

  IF p_topic IS NULL OR btrim(p_topic) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOPIC');
  END IF;

  IF p_opponent_id IS NULL OR p_opponent_id = v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OPPONENT');
  END IF;

  IF p_max_rounds IS NULL OR NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(v_allowed_rounds) AS r
    WHERE r::INT = p_max_rounds
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_MAX_ROUNDS');
  END IF;

  IF p_position NOT IN ('正方', '反方') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_POSITION');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_opponent_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'OPPONENT_NOT_FOUND');
  END IF;

  IF v_actual_fee > 0 THEN
    UPDATE public.user_credits
    SET balance = balance - v_actual_fee,
        total_spent = COALESCE(total_spent, 0) + v_actual_fee,
        updated_at = NOW()
    WHERE user_id = v_uid
      AND balance >= v_actual_fee;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS');
    END IF;
    v_deducted := TRUE;
  END IF;

  BEGIN
    INSERT INTO public.duels (
      topic, description, challenger_id, challenger_position,
      opponent_id, opponent_position, max_rounds,
      current_turn_user_id, post_id, challenger_lp, opponent_lp
    ) VALUES (
      btrim(p_topic), p_description, v_uid, p_position,
      p_opponent_id,
      CASE WHEN p_position = '正方' THEN '反方' ELSE '正方' END,
      p_max_rounds, v_uid, p_post_id, v_initial_lp, v_initial_lp
    )
    RETURNING id INTO v_duel_id;

    INSERT INTO public.duel_invitations (duel_id, invitee_id)
    VALUES (v_duel_id, p_opponent_id)
    RETURNING id INTO v_invitation_id;

  EXCEPTION WHEN OTHERS THEN
    IF v_deducted THEN
      UPDATE public.user_credits
      SET balance = balance + v_actual_fee,
          total_spent = GREATEST(0, COALESCE(total_spent, 0) - v_actual_fee),
          updated_at = NOW()
      WHERE user_id = v_uid;
    END IF;
    RAISE;
  END;

  IF v_actual_fee > 0 THEN
    INSERT INTO public.credit_transactions
      (user_id, amount, type, description, metadata)
    VALUES (
      v_uid, -v_actual_fee, 'ask_ai_usage',
      '学术决斗发起费（覆盖裁判 AI 成本）',
      jsonb_build_object('duel_id', v_duel_id, 'tx_subtype', 'duel_fee')
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'duel_id', v_duel_id,
    'invitation_id', v_invitation_id,
    'fee', v_actual_fee
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_duel_with_fee(TEXT, TEXT, TEXT, INTEGER, UUID, UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_duel_with_fee(TEXT, TEXT, TEXT, INTEGER, UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_duel_with_fee(TEXT, TEXT, TEXT, INTEGER, UUID, UUID, INTEGER) TO service_role;

-- 7. 升级 handle_duel_end：动态读取胜负学术声望奖惩配置
CREATE OR REPLACE FUNCTION public.handle_duel_end()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_econ JSONB;
  v_win_reward INT := 10;
  v_loss_penalty INT := 5;
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'active' AND NEW.winner_id IS NOT NULL THEN
    SELECT value->'economy' INTO v_econ
    FROM public.system_settings
    WHERE key = 'duel_config';

    IF v_econ IS NOT NULL THEN
      v_win_reward := GREATEST(0, COALESCE((v_econ->>'win_reputation_reward')::INT, 10));
      v_loss_penalty := GREATEST(0, COALESCE((v_econ->>'loss_reputation_penalty')::INT, 5));
    END IF;

    UPDATE public.profiles
    SET reputation_score = reputation_score + v_win_reward,
        duel_wins = COALESCE(duel_wins, 0) + 1
    WHERE id = NEW.winner_id;

    UPDATE public.profiles
    SET reputation_score = GREATEST(reputation_score - v_loss_penalty, 0),
        duel_losses = COALESCE(duel_losses, 0) + 1
    WHERE id = CASE
      WHEN NEW.winner_id = NEW.challenger_id THEN NEW.opponent_id
      ELSE NEW.challenger_id
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- 8. 未开赛（pending -> cancelled）100% 自动全额退费触发器（幂等防重入 + 自动清理残留邀请）
CREATE OR REPLACE FUNCTION public.handle_pending_duel_cancel_refund()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_econ JSONB;
  v_auto_refund BOOLEAN := TRUE;
  v_fee_paid INT := 0;
  v_already_refunded BOOLEAN := FALSE;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    UPDATE public.duel_invitations
    SET status = 'declined',
        responded_at = COALESCE(responded_at, NOW())
    WHERE duel_id = NEW.id
      AND status = 'pending';

    SELECT value->'economy' INTO v_econ
    FROM public.system_settings
    WHERE key = 'duel_config';

    IF v_econ IS NOT NULL AND v_econ ? 'auto_refund_on_pending_cancel' THEN
      v_auto_refund := COALESCE((v_econ->>'auto_refund_on_pending_cancel')::BOOLEAN, TRUE);
    END IF;

    IF NOT v_auto_refund THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.credit_transactions
      WHERE user_id = NEW.challenger_id
        AND amount > 0
        AND metadata->>'duel_id' = NEW.id::TEXT
        AND COALESCE((metadata->>'is_duel_fee_refund')::BOOLEAN, FALSE) = TRUE
    ) INTO v_already_refunded;

    IF v_already_refunded THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(ABS(amount), 0) INTO v_fee_paid
    FROM public.credit_transactions
    WHERE user_id = NEW.challenger_id
      AND amount < 0
      AND type = 'ask_ai_usage'
      AND metadata->>'duel_id' = NEW.id::TEXT
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_fee_paid > 0 THEN
      INSERT INTO public.user_credits (user_id, balance, total_spent, total_recharged)
      VALUES (NEW.challenger_id, v_fee_paid, 0, 0)
      ON CONFLICT (user_id) DO UPDATE
      SET balance = public.user_credits.balance + v_fee_paid,
          total_spent = GREATEST(0, COALESCE(public.user_credits.total_spent, 0) - v_fee_paid),
          updated_at = NOW();

      INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
      VALUES (
        NEW.challenger_id,
        v_fee_paid,
        'admin_adjustment',
        '决斗未开赛取消/婉拒，全额退还发起积分',
        jsonb_build_object(
          'duel_id', NEW.id,
          'is_duel_fee_refund', true,
          'tx_subtype', 'duel_refund',
          'trigger', 'pending_cancel_auto_refund'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_duel_pending_cancel_refund
  AFTER UPDATE ON public.duels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pending_duel_cancel_refund();

-- 9. 原子仲裁 RPC 1：admin_intervene_duel（强制中止退费 / 强制完赛裁决 / 切换发言权 / 紧急解锁原帖）
CREATE OR REPLACE FUNCTION public.admin_intervene_duel(
  p_duel_id UUID,
  p_action TEXT, -- 'force_cancel' | 'force_complete' | 'switch_turn' | 'unlock_post'
  p_winner_id UUID DEFAULT NULL,
  p_refund_fee BOOLEAN DEFAULT FALSE,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_duel public.duels%ROWTYPE;
  v_fee_paid INT := 0;
  v_refunded_amount INT := 0;
  v_already_refunded BOOLEAN := FALSE;
  v_next_turn UUID;
BEGIN
  IF NOT public.has_admin_role('moderator') THEN
    RAISE EXCEPTION 'permission_denied: 需要版主及以上权限' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'REASON_REQUIRED');
  END IF;

  SELECT * INTO v_duel
  FROM public.duels
  WHERE id = p_duel_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_FOUND');
  END IF;

  IF p_action = 'force_cancel' THEN
    IF v_duel.status IN ('completed', 'cancelled') THEN
      RETURN jsonb_build_object('success', false, 'error', 'ALREADY_ENDED');
    END IF;

    UPDATE public.duels
    SET status = 'cancelled',
        ended_at = NOW(),
        ko_type = 'admin_cancelled',
        ko_reason = '管理员仲裁中止：' || btrim(p_reason)
    WHERE id = p_duel_id;

    UPDATE public.duel_invitations
    SET status = 'declined',
        responded_at = COALESCE(responded_at, NOW())
    WHERE duel_id = p_duel_id AND status = 'pending';

    IF p_refund_fee THEN
      SELECT EXISTS (
        SELECT 1 FROM public.credit_transactions
        WHERE user_id = v_duel.challenger_id
          AND amount > 0
          AND metadata->>'duel_id' = p_duel_id::TEXT
          AND COALESCE((metadata->>'is_duel_fee_refund')::BOOLEAN, FALSE) = TRUE
      ) INTO v_already_refunded;

      IF v_already_refunded THEN
        SELECT COALESCE(amount, 0) INTO v_refunded_amount
        FROM public.credit_transactions
        WHERE user_id = v_duel.challenger_id
          AND amount > 0
          AND metadata->>'duel_id' = p_duel_id::TEXT
          AND COALESCE((metadata->>'is_duel_fee_refund')::BOOLEAN, FALSE) = TRUE
        ORDER BY created_at DESC
        LIMIT 1;
      ELSE
        SELECT COALESCE(ABS(amount), 0) INTO v_fee_paid
        FROM public.credit_transactions
        WHERE user_id = v_duel.challenger_id
          AND amount < 0
          AND type = 'ask_ai_usage'
          AND metadata->>'duel_id' = p_duel_id::TEXT
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_fee_paid > 0 THEN
          INSERT INTO public.user_credits (user_id, balance, total_spent, total_recharged)
          VALUES (v_duel.challenger_id, v_fee_paid, 0, 0)
          ON CONFLICT (user_id) DO UPDATE
          SET balance = public.user_credits.balance + v_fee_paid,
              total_spent = GREATEST(0, COALESCE(public.user_credits.total_spent, 0) - v_fee_paid),
              updated_at = NOW();

          INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
          VALUES (
            v_duel.challenger_id,
            v_fee_paid,
            'admin_adjustment',
            '管理员仲裁中止决斗，退还发起积分：' || btrim(p_reason),
            jsonb_build_object(
              'duel_id', p_duel_id,
              'is_duel_fee_refund', true,
              'tx_subtype', 'duel_refund',
              'admin_id', v_admin_id
            )
          );
          v_refunded_amount := v_fee_paid;
        END IF;
      END IF;
    END IF;

  ELSIF p_action = 'force_complete' THEN
    IF v_duel.status <> 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'ONLY_ACTIVE_CAN_COMPLETE');
    END IF;

    IF p_winner_id IS NOT NULL
       AND p_winner_id <> v_duel.challenger_id
       AND (v_duel.opponent_id IS NULL OR p_winner_id <> v_duel.opponent_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'INVALID_WINNER');
    END IF;

    UPDATE public.duels
    SET status = 'completed',
        winner_id = p_winner_id,
        ended_at = NOW(),
        ko_type = 'admin_judgment',
        ko_reason = '管理员仲裁裁决：' || btrim(p_reason)
    WHERE id = p_duel_id;

  ELSIF p_action = 'switch_turn' THEN
    IF v_duel.status <> 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_ACTIVE');
    END IF;

    v_next_turn := CASE
      WHEN v_duel.current_turn_user_id = v_duel.challenger_id THEN v_duel.opponent_id
      ELSE v_duel.challenger_id
    END;

    IF v_next_turn IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'NO_OPPONENT');
    END IF;

    UPDATE public.duels
    SET current_turn_user_id = v_next_turn
    WHERE id = p_duel_id;

  ELSIF p_action = 'unlock_post' THEN
    IF v_duel.post_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'NO_LINKED_POST');
    END IF;

    UPDATE public.posts
    SET is_locked = FALSE
    WHERE id = v_duel.post_id;

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'UNKNOWN_ACTION');
  END IF;

  INSERT INTO public.admin_action_logs (admin_id, action_type, target_type, target_id, details)
  VALUES (
    v_admin_id,
    'duel_' || p_action,
    'duel',
    p_duel_id::TEXT,
    jsonb_build_object(
      'previous_status', v_duel.status,
      'winner_id', p_winner_id,
      'refund_fee', p_refund_fee,
      'refunded_amount', v_refunded_amount,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'refunded_amount', v_refunded_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_intervene_duel(UUID, TEXT, UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_intervene_duel(UUID, TEXT, UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_intervene_duel(UUID, TEXT, UUID, BOOLEAN, TEXT) TO service_role;

-- 10. 原子仲裁 RPC 2：admin_override_round_score（AI 漏评补评 / 争议回合人工改判，重算总分与 LP）
CREATE OR REPLACE FUNCTION public.admin_override_round_score(
  p_round_id UUID,
  p_evidence_score INT,
  p_citation_score INT,
  p_logic_score INT,
  p_has_fallacy BOOLEAN,
  p_fallacy_type TEXT,
  p_fallacy_penalty INT,
  p_analysis TEXT,
  p_reason TEXT DEFAULT '管理员复核改判'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_round public.duel_rounds%ROWTYPE;
  v_duel public.duels%ROWTYPE;
  v_total INT;
  v_penalty INT;
  v_cfg JSONB;
  v_initial_lp INT := 100;
  v_lp_deduct INT := 10;
  v_challenger_fallacies INT := 0;
  v_opponent_fallacies INT := 0;
  v_challenger_score INT := 0;
  v_opponent_score INT := 0;
BEGIN
  IF NOT public.has_admin_role('moderator') THEN
    RAISE EXCEPTION 'permission_denied: 需要版主及以上权限' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_round FROM public.duel_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ROUND_NOT_FOUND');
  END IF;

  SELECT * INTO v_duel FROM public.duels WHERE id = v_round.duel_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_FOUND');
  END IF;

  SELECT value INTO v_cfg FROM public.system_settings WHERE key = 'duel_config';
  IF v_cfg IS NOT NULL THEN
    v_initial_lp := GREATEST(10, COALESCE((v_cfg->'economy'->>'initial_lp')::INT, 100));
    v_lp_deduct := GREATEST(0, COALESCE((v_cfg->'referee'->>'fallacy_lp_deduction')::INT, 10));
  END IF;

  v_penalty := CASE WHEN p_has_fallacy THEN -ABS(COALESCE(p_fallacy_penalty, -10)) ELSE 0 END;
  v_total := GREATEST(0, COALESCE(p_evidence_score, 0))
           + GREATEST(0, COALESCE(p_citation_score, 0))
           + GREATEST(0, COALESCE(p_logic_score, 0))
           + v_penalty;

  UPDATE public.duel_rounds
  SET evidence_score = GREATEST(0, COALESCE(p_evidence_score, 0)),
      citation_score = GREATEST(0, COALESCE(p_citation_score, 0)),
      logic_score = GREATEST(0, COALESCE(p_logic_score, 0)),
      has_fallacy = COALESCE(p_has_fallacy, FALSE),
      fallacy_type = CASE WHEN p_has_fallacy THEN NULLIF(btrim(COALESCE(p_fallacy_type, '')), '') ELSE NULL END,
      fallacy_penalty = v_penalty,
      total_score = v_total,
      ai_analysis = COALESCE(NULLIF(btrim(p_analysis), ''), ai_analysis),
      ai_analyzed_at = NOW()
  WHERE id = p_round_id;

  SELECT COALESCE(SUM(total_score), 0),
         COUNT(*) FILTER (WHERE has_fallacy = TRUE)
  INTO v_challenger_score, v_challenger_fallacies
  FROM public.duel_rounds
  WHERE duel_id = v_duel.id AND author_id = v_duel.challenger_id;

  IF v_duel.opponent_id IS NOT NULL THEN
    SELECT COALESCE(SUM(total_score), 0),
           COUNT(*) FILTER (WHERE has_fallacy = TRUE)
    INTO v_opponent_score, v_opponent_fallacies
    FROM public.duel_rounds
    WHERE duel_id = v_duel.id AND author_id = v_duel.opponent_id;
  END IF;

  UPDATE public.duels
  SET challenger_score = v_challenger_score,
      opponent_score = v_opponent_score,
      challenger_lp = GREATEST(0, v_initial_lp - (v_challenger_fallacies * v_lp_deduct)),
      opponent_lp = GREATEST(0, v_initial_lp - (v_opponent_fallacies * v_lp_deduct))
  WHERE id = v_duel.id;

  INSERT INTO public.admin_action_logs (admin_id, action_type, target_type, target_id, details)
  VALUES (
    v_admin_id,
    'duel_override_round',
    'duel_round',
    p_round_id::TEXT,
    jsonb_build_object(
      'duel_id', v_duel.id,
      'round_number', v_round.round_number,
      'previous_total', v_round.total_score,
      'new_total', v_total,
      'has_fallacy', p_has_fallacy,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'total_score', v_total,
    'challenger_score', v_challenger_score,
    'opponent_score', v_opponent_score
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_override_round_score(UUID, INT, INT, INT, BOOLEAN, TEXT, INT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_override_round_score(UUID, INT, INT, INT, BOOLEAN, TEXT, INT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_override_round_score(UUID, INT, INT, INT, BOOLEAN, TEXT, INT, TEXT, TEXT) TO service_role;

-- 11. 原子仲裁 RPC 3：admin_rollback_completed_duel（仅限 super_admin：误判终局全链路逆向冲正）
CREATE OR REPLACE FUNCTION public.admin_rollback_completed_duel(
  p_duel_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_duel public.duels%ROWTYPE;
  v_econ JSONB;
  v_win_reward INT := 10;
  v_loss_penalty INT := 5;
  v_loser_id UUID;
BEGIN
  IF NOT public.has_admin_role('super_admin') THEN
    RAISE EXCEPTION 'permission_denied: 仅超级管理员可执行已完结对决逆向回滚' USING ERRCODE = '42501';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'REASON_REQUIRED');
  END IF;

  SELECT * INTO v_duel FROM public.duels WHERE id = p_duel_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_FOUND');
  END IF;

  IF v_duel.status <> 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_COMPLETED');
  END IF;

  SELECT value->'economy' INTO v_econ FROM public.system_settings WHERE key = 'duel_config';
  IF v_econ IS NOT NULL THEN
    v_win_reward := GREATEST(0, COALESCE((v_econ->>'win_reputation_reward')::INT, 10));
    v_loss_penalty := GREATEST(0, COALESCE((v_econ->>'loss_reputation_penalty')::INT, 5));
  END IF;

  IF v_duel.winner_id IS NOT NULL THEN
    v_loser_id := CASE
      WHEN v_duel.winner_id = v_duel.challenger_id THEN v_duel.opponent_id
      ELSE v_duel.challenger_id
    END;

    UPDATE public.profiles
    SET reputation_score = GREATEST(0, reputation_score - v_win_reward),
        duel_wins = GREATEST(0, COALESCE(duel_wins, 0) - 1)
    WHERE id = v_duel.winner_id;

    IF v_loser_id IS NOT NULL THEN
      UPDATE public.profiles
      SET reputation_score = reputation_score + v_loss_penalty,
          duel_losses = GREATEST(0, COALESCE(duel_losses, 0) - 1)
      WHERE id = v_loser_id;
    END IF;
  END IF;

  UPDATE public.profiles p
  SET reputation_score = GREATEST(0, p.reputation_score - b.amount)
  FROM public.duel_bets b
  WHERE b.duel_id = p_duel_id
    AND b.spectator_id = p.id
    AND b.status = 'won'
    AND b.funded = TRUE;

  UPDATE public.profiles p
  SET reputation_score = p.reputation_score + b.amount
  FROM public.duel_bets b
  WHERE b.duel_id = p_duel_id
    AND b.spectator_id = p.id
    AND b.status = 'lost'
    AND b.funded = TRUE;

  UPDATE public.duel_bets
  SET status = 'refunded',
      settled_at = NOW()
  WHERE duel_id = p_duel_id
    AND status IN ('won', 'lost')
    AND funded = TRUE;

  UPDATE public.duels
  SET status = 'cancelled',
      winner_id = NULL,
      ko_type = 'admin_rollback',
      ko_reason = '超级管理员撤销赛果并冲正结算：' || btrim(p_reason)
  WHERE id = p_duel_id;

  INSERT INTO public.admin_action_logs (admin_id, action_type, target_type, target_id, details)
  VALUES (
    v_admin_id,
    'duel_rollback_completed',
    'duel',
    p_duel_id::TEXT,
    jsonb_build_object(
      'previous_winner_id', v_duel.winner_id,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_rollback_completed_duel(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_rollback_completed_duel(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rollback_completed_duel(UUID, TEXT) TO service_role;
