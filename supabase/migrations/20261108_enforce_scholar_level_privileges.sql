-- ==============================================================================
-- 迁移脚本: 20261108_enforce_scholar_level_privileges.sql
-- 描述: 全面落实学者等级（Lv1 - Lv6）特权限制与实时晋升机制（不含铭牌/勋章外观变动）
--       1. Lv2: 解锁边缘学术批注权限 (post_annotations INSERT RLS)
--       2. Lv3: 解锁帖子历史版本追溯对比 (post_revisions SELECT RLS)
--       3. Lv3: 解锁撰写同行评审资格 (peer_reviews INSERT/UPDATE RLS)
--       4. Lv4: 解锁创建协作实验室 (lab_rooms INSERT RLS)
--       5. Lv5: 同行评审 1.5 倍权威系数 (peer_reviews.authority_weight & sync_scholar_level)
--       6. 实时自动晋升触发器: 发帖、获赞、采纳、评审变更时自动重算学者等级
-- ==============================================================================

-- 1. peer_reviews 表增加 authority_weight (同行评审权威系数，Lv5+ 自动为 1.50)
ALTER TABLE public.peer_reviews
  ADD COLUMN IF NOT EXISTS authority_weight NUMERIC(4,2) DEFAULT 1.00 NOT NULL;

COMMENT ON COLUMN public.peer_reviews.authority_weight IS '同行评审权威系数 (默认 1.00，Lv5+ 学者享受 1.50 倍权威系数)';

-- 回填存量同行评审的权威系数
UPDATE public.peer_reviews pr
SET authority_weight = CASE
  WHEN COALESCE(p.vip_level, 1) >= 5 THEN 1.50
  ELSE 1.00
END
FROM public.profiles p
WHERE (pr.reviewer_id = p.id OR pr.user_id = p.id);

-- 升级 peer_reviews 字段同步触发器，自动计算 Lv5+ 1.5 倍权威系数
CREATE OR REPLACE FUNCTION public.sync_peer_review_user_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewer_level INT := 1;
BEGIN
  IF NEW.user_id IS NULL AND NEW.reviewer_id IS NOT NULL THEN
    NEW.user_id := NEW.reviewer_id;
  ELSIF NEW.reviewer_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.reviewer_id := NEW.user_id;
  END IF;

  SELECT COALESCE(vip_level, 1) INTO v_reviewer_level
  FROM public.profiles
  WHERE id = COALESCE(NEW.reviewer_id, NEW.user_id);

  IF v_reviewer_level >= 5 THEN
    NEW.authority_weight := 1.50;
  ELSE
    NEW.authority_weight := COALESCE(NULLIF(NEW.authority_weight, 0), 1.00);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_peer_review_user_fields
  BEFORE INSERT OR UPDATE ON public.peer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_peer_review_user_fields();

-- 2. 升级核心学者等级计算函数 public.sync_scholar_level(uuid)，纳入 Lv5+ 1.5 倍同行评审权威系数
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
  v_peer_review_weighted NUMERIC := 0;
  v_peer_review_exp INT := 0;
  v_duel_wins INT := 0;
  v_contributions INT := 0;
  v_exp INT := 0;
  v_new_level INT := 1;
  v_current_level INT := 1;
  v_cfg RECORD;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(vip_level, 1) INTO v_current_level
  FROM public.profiles
  WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_posts
  FROM public.posts
  WHERE author_id = p_user_id
    AND is_published = TRUE
    AND COALESCE(is_hidden, FALSE) = FALSE
    AND COALESCE(review_status::text, 'approved') = 'approved'
    AND COALESCE(pqs_score, 60) >= 60;

  SELECT COUNT(l.id) INTO v_post_likes
  FROM public.likes l
  JOIN public.posts p ON l.post_id = p.id
  WHERE p.author_id = p_user_id;

  SELECT COUNT(l.id) INTO v_comment_likes
  FROM public.likes l
  JOIN public.comments c ON l.comment_id = c.id
  WHERE c.author_id = p_user_id;

  v_total_likes := v_post_likes + v_comment_likes;

  SELECT COUNT(*) INTO v_accepted
  FROM public.comments
  WHERE author_id = p_user_id
    AND is_accepted = TRUE;

  SELECT
    COALESCE(SUM(GREATEST(COALESCE(authority_weight, 1.00), CASE WHEN v_current_level >= 5 THEN 1.50 ELSE 1.00 END)), 0),
    COALESCE(ROUND(SUM(25 * GREATEST(COALESCE(authority_weight, 1.00), CASE WHEN v_current_level >= 5 THEN 1.50 ELSE 1.00 END))), 0)::INT
  INTO v_peer_review_weighted, v_peer_review_exp
  FROM public.peer_reviews
  WHERE user_id = p_user_id OR reviewer_id = p_user_id;

  SELECT COALESCE(duel_wins, 0) INTO v_duel_wins
  FROM public.profiles
  WHERE id = p_user_id;

  v_contributions := v_accepted + ROUND(v_peer_review_weighted)::INT + v_duel_wins;

  v_exp := (v_posts * 15)
         + (v_post_likes * 5)
         + (v_comment_likes * 3)
         + (v_accepted * 30)
         + v_peer_review_exp
         + (v_duel_wins * 20);

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

-- 3. 建立实时学者等级自动同步触发器 (发帖、点赞、回答采纳、同行评审)
CREATE OR REPLACE FUNCTION public.trg_fn_auto_sync_scholar_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    v_target_user_id := COALESCE(NEW.author_id, OLD.author_id);
  ELSIF TG_TABLE_NAME = 'comments' THEN
    v_target_user_id := COALESCE(NEW.author_id, OLD.author_id);
  ELSIF TG_TABLE_NAME = 'peer_reviews' THEN
    v_target_user_id := COALESCE(NEW.reviewer_id, NEW.user_id, OLD.reviewer_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'likes' THEN
    IF COALESCE(NEW.post_id, OLD.post_id) IS NOT NULL THEN
      SELECT author_id INTO v_target_user_id
      FROM public.posts
      WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    ELSIF COALESCE(NEW.comment_id, OLD.comment_id) IS NOT NULL THEN
      SELECT author_id INTO v_target_user_id
      FROM public.comments
      WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    END IF;
  END IF;

  IF v_target_user_id IS NOT NULL THEN
    PERFORM public.sync_scholar_level(v_target_user_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_posts_sync_scholar_level
  AFTER INSERT OR UPDATE OF is_published, is_hidden, review_status, pqs_score OR DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_auto_sync_scholar_level();

CREATE OR REPLACE TRIGGER trg_comments_sync_scholar_level
  AFTER INSERT OR UPDATE OF is_accepted OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_auto_sync_scholar_level();

CREATE OR REPLACE TRIGGER trg_likes_sync_scholar_level
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_auto_sync_scholar_level();

CREATE OR REPLACE TRIGGER trg_peer_reviews_sync_scholar_level
  AFTER INSERT OR UPDATE OF authority_weight OR DELETE ON public.peer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_auto_sync_scholar_level();

-- 4. 落实各等级特权 RLS 策略硬性限制 (使用 ALTER POLICY 零破坏平滑升级)
ALTER POLICY "Authenticated users can create annotations" ON public.post_annotations
  WITH CHECK (
    auth.uid() = author_id
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND COALESCE(p.vip_level, 1) >= 2
      )
      OR public.is_admin()
    )
  );

ALTER POLICY "Anyone can view revisions of published posts" ON public.post_revisions
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_revisions.post_id
        AND (
          posts.author_id = auth.uid()
          OR (
            posts.is_published = TRUE
            AND EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = auth.uid() AND COALESCE(p.vip_level, 1) >= 3
            )
          )
        )
    )
    OR public.is_admin()
  );

ALTER POLICY "Insert peer reviews" ON public.peer_reviews
  WITH CHECK (
    (auth.uid() = user_id OR auth.uid() = reviewer_id)
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND COALESCE(p.vip_level, 1) >= 3
      )
      OR public.is_admin()
    )
  );

ALTER POLICY "Update peer reviews" ON public.peer_reviews
  USING (
    (auth.uid() = user_id OR auth.uid() = reviewer_id)
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND COALESCE(p.vip_level, 1) >= 3
      )
      OR public.is_admin()
    )
  );

ALTER POLICY "lab_rooms_insert" ON public.lab_rooms
  WITH CHECK (
    auth.uid() = created_by
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND COALESCE(p.vip_level, 1) >= 4
      )
      OR public.is_admin()
    )
  );

-- 执行一次全量用户学者等级与权威系数重算同步
SELECT public.sync_all_scholar_levels();
