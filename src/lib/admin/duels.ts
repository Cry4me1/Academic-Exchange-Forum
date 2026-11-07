"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, logAdminAction } from "@/lib/admin/permissions";
import {
  DEFAULT_DUEL_CONFIG,
  normalizeDuelConfig,
  type DuelConfig,
} from "@/lib/duel-config";

export interface DuelPlayerSummary {
  id: string;
  username: string;
  avatar_url: string | null;
  reputation_score: number;
}

export interface AdminDuelRow {
  id: string;
  topic: string;
  description: string | null;
  status: "pending" | "active" | "completed" | "cancelled";
  challenger_id: string;
  opponent_id: string | null;
  winner_id: string | null;
  challenger_score: number;
  opponent_score: number;
  challenger_lp: number;
  opponent_lp: number;
  challenger_position: string;
  opponent_position: string;
  max_rounds: number;
  current_round: number;
  current_turn_user_id: string | null;
  ko_type: string | null;
  ko_reason: string | null;
  post_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  challenger: DuelPlayerSummary | null;
  opponent: DuelPlayerSummary | null;
  post: { id: string; title: string; is_locked: boolean } | null;
}

export interface AdminDuelRoundRow {
  id: string;
  duel_id: string;
  round_number: number;
  author_id: string;
  content: Record<string, unknown>;
  content_text: string | null;
  evidence_score: number;
  citation_score: number;
  logic_score: number;
  fallacy_penalty: number;
  total_score: number;
  has_fallacy: boolean;
  fallacy_type: string | null;
  ai_analysis: string | null;
  ai_analyzed_at: string | null;
  created_at: string;
  author: DuelPlayerSummary | null;
}

export interface AdminDuelBetRow {
  id: string;
  duel_id: string;
  spectator_id: string;
  target_id: string;
  amount: number;
  status: string;
  funded: boolean;
  created_at: string;
  settled_at: string | null;
  spectator: { id: string; username: string; avatar_url: string | null } | null;
}

export interface AdminDuelCommentRow {
  id: string;
  duel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: { id: string; username: string; avatar_url: string | null } | null;
}

export interface AdminDuelDetail {
  duel: AdminDuelRow;
  rounds: AdminDuelRoundRow[];
  bets: AdminDuelBetRow[];
  comments: AdminDuelCommentRow[];
  feePaid: number;
  feeRefunded: boolean;
}

export interface DuelAdminStats {
  totalDuels: number;
  activeDuels: number;
  pendingDuels: number;
  completedDuels: number;
  cancelledDuels: number;
  lockedPostsCount: number;
  orphanRoundsCount: number;
  activeBetPoolAmount: number;
  totalAnomalyCount: number;
}

export interface DuelAnomaliesData {
  orphanRounds: Array<{
    id: string;
    duel_id: string;
    round_number: number;
    content_text: string | null;
    created_at: string;
    author: { id: string; username: string } | null;
    duel: {
      id: string;
      topic: string;
      status: string;
      challenger_id: string;
      challenger_position: string;
      opponent_position: string;
    } | null;
  }>;
  stalledDuels: AdminDuelRow[];
  expiredInvitations: Array<{
    id: string;
    duel_id: string;
    invitee_id: string;
    status: string;
    created_at: string;
    invitee: { id: string; username: string } | null;
    duel: {
      id: string;
      topic: string;
      status: string;
      challenger: { id: string; username: string } | null;
    } | null;
  }>;
  duelReports: Array<{
    id: string;
    target_id: string;
    reason: string;
    description: string | null;
    status: string;
    created_at: string;
    reporter: { id: string; username: string } | null;
  }>;
}

export async function getDuelConfig(): Promise<DuelConfig> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "duel_config")
    .maybeSingle();

  return data?.value ? normalizeDuelConfig(data.value) : DEFAULT_DUEL_CONFIG;
}

export async function getDuelAdminStats(
  config?: DuelConfig
): Promise<DuelAdminStats> {
  await requireAdmin("analyst");
  const supabase = await createClient();
  const cfg = config ?? (await getDuelConfig());

  const stallCutoff = new Date(
    Date.now() - cfg.economy.stall_warning_hours * 3600 * 1000
  ).toISOString();
  const inviteCutoff = new Date(
    Date.now() - cfg.economy.invite_expire_hours * 3600 * 1000
  ).toISOString();

  const [
    totalRes,
    activeRes,
    pendingRes,
    completedRes,
    cancelledRes,
    orphanRes,
    activeBetsRes,
    stalledRes,
    expiredInvRes,
    reportsRes,
    lockedPostsRes,
  ] = await Promise.all([
    supabase.from("duels").select("id", { count: "exact", head: true }),
    supabase
      .from("duels")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("duels")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("duels")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("duels")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
    supabase
      .from("duel_rounds")
      .select("id", { count: "exact", head: true })
      .is("ai_analyzed_at", null),
    supabase.from("duel_bets").select("amount").eq("status", "pending"),
    supabase
      .from("duels")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .lt("started_at", stallCutoff),
    supabase
      .from("duel_invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", inviteCutoff),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "duel")
      .eq("status", "pending"),
    supabase
      .from("duels")
      .select("post_id")
      .eq("status", "active")
      .not("post_id", "is", null),
  ]);

  const activeBetPoolAmount = (activeBetsRes.data ?? []).reduce(
    (sum, b) => sum + (Number(b.amount) || 0),
    0
  );

  const orphanRoundsCount = orphanRes.count ?? 0;
  const totalAnomalyCount =
    orphanRoundsCount +
    (stalledRes.count ?? 0) +
    (expiredInvRes.count ?? 0) +
    (reportsRes.count ?? 0);

  return {
    totalDuels: totalRes.count ?? 0,
    activeDuels: activeRes.count ?? 0,
    pendingDuels: pendingRes.count ?? 0,
    completedDuels: completedRes.count ?? 0,
    cancelledDuels: cancelledRes.count ?? 0,
    lockedPostsCount: (lockedPostsRes.data ?? []).length,
    orphanRoundsCount,
    activeBetPoolAmount,
    totalAnomalyCount,
  };
}

export async function getAdminDuelsList(params: {
  status?: string;
  koFilter?: string;
  linkedPostOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: AdminDuelRow[]; total: number }> {
  await requireAdmin("analyst");
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("duels")
    .select(
      `
      *,
      challenger:profiles!challenger_id(id, username, avatar_url, reputation_score),
      opponent:profiles!opponent_id(id, username, avatar_url, reputation_score),
      post:posts!post_id(id, title, is_locked)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.koFilter && params.koFilter !== "all") {
    if (params.koFilter === "normal") {
      query = query.is("ko_type", null);
    } else if (params.koFilter === "any_ko") {
      query = query.not("ko_type", "is", null);
    } else {
      query = query.eq("ko_type", params.koFilter);
    }
  }

  if (params.linkedPostOnly) {
    query = query.not("post_id", "is", null);
  }

  if (params.search && params.search.trim()) {
    const keyword = params.search.trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        keyword
      );
    if (isUuid) {
      query = query.eq("id", keyword);
    } else {
      query = query.ilike("topic", `%${keyword}%`);
    }
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    console.error("[getAdminDuelsList] Error:", error);
    return { data: [], total: 0 };
  }

  return {
    data: (data ?? []) as unknown as AdminDuelRow[],
    total: count ?? 0,
  };
}

export async function getAdminDuelDetail(
  duelId: string
): Promise<AdminDuelDetail | null> {
  await requireAdmin("analyst");
  const supabase = await createClient();

  const [duelRes, roundsRes, betsRes, commentsRes, txRes] = await Promise.all([
    supabase
      .from("duels")
      .select(
        `
        *,
        challenger:profiles!challenger_id(id, username, avatar_url, reputation_score),
        opponent:profiles!opponent_id(id, username, avatar_url, reputation_score),
        post:posts!post_id(id, title, is_locked)
      `
      )
      .eq("id", duelId)
      .maybeSingle(),
    supabase
      .from("duel_rounds")
      .select(
        `
        *,
        author:profiles!author_id(id, username, avatar_url, reputation_score)
      `
      )
      .eq("duel_id", duelId)
      .order("created_at", { ascending: true }),
    supabase
      .from("duel_bets")
      .select(
        `
        *,
        spectator:profiles!spectator_id(id, username, avatar_url)
      `
      )
      .eq("duel_id", duelId)
      .order("created_at", { ascending: false }),
    supabase
      .from("duel_live_comments")
      .select(
        `
        id, duel_id, user_id, content, created_at,
        user:profiles!user_id(id, username, avatar_url)
      `
      )
      .eq("duel_id", duelId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("credit_transactions")
      .select("amount, type, metadata")
      .contains("metadata", { duel_id: duelId }),
  ]);

  if (!duelRes.data) return null;

  const txs = txRes.data ?? [];
  const feeTx = txs.find(
    (t) =>
      Number(t.amount) < 0 &&
      (t.type === "duel_fee" || t.type === "ask_ai_usage")
  );
  const refundTx = txs.find(
    (t) =>
      Number(t.amount) > 0 &&
      (t.type === "duel_refund" ||
        Boolean(
          (t.metadata as Record<string, unknown> | null)?.is_duel_fee_refund
        ))
  );

  return {
    duel: duelRes.data as unknown as AdminDuelRow,
    rounds: (roundsRes.data ?? []) as unknown as AdminDuelRoundRow[],
    bets: (betsRes.data ?? []) as unknown as AdminDuelBetRow[],
    comments: (commentsRes.data ?? []) as unknown as AdminDuelCommentRow[],
    feePaid: feeTx ? Math.abs(Number(feeTx.amount)) : 0,
    feeRefunded: Boolean(refundTx),
  };
}

export async function getDuelAnomalies(
  config?: DuelConfig
): Promise<DuelAnomaliesData> {
  await requireAdmin("analyst");
  const supabase = await createClient();
  const cfg = config ?? (await getDuelConfig());

  const stallCutoff = new Date(
    Date.now() - cfg.economy.stall_warning_hours * 3600 * 1000
  ).toISOString();
  const inviteCutoff = new Date(
    Date.now() - cfg.economy.invite_expire_hours * 3600 * 1000
  ).toISOString();

  const [orphanRes, stalledRes, expiredRes, reportsRes] = await Promise.all([
    supabase
      .from("duel_rounds")
      .select(
        `
        id, duel_id, round_number, content_text, created_at,
        author:profiles!author_id(id, username),
        duel:duels!duel_id(id, topic, status, challenger_id, challenger_position, opponent_position)
      `
      )
      .is("ai_analyzed_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("duels")
      .select(
        `
        *,
        challenger:profiles!challenger_id(id, username, avatar_url, reputation_score),
        opponent:profiles!opponent_id(id, username, avatar_url, reputation_score),
        post:posts!post_id(id, title, is_locked)
      `
      )
      .eq("status", "active")
      .lt("started_at", stallCutoff)
      .order("started_at", { ascending: true })
      .limit(30),
    supabase
      .from("duel_invitations")
      .select(
        `
        id, duel_id, invitee_id, status, created_at,
        invitee:profiles!invitee_id(id, username),
        duel:duels!duel_id(id, topic, status, challenger:profiles!challenger_id(id, username))
      `
      )
      .eq("status", "pending")
      .lt("created_at", inviteCutoff)
      .order("created_at", { ascending: true })
      .limit(30),
    supabase
      .from("reports")
      .select(
        `
        id, target_id, reason, description, status, created_at,
        reporter:profiles!reporter_id(id, username)
      `
      )
      .eq("target_type", "duel")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return {
    orphanRounds: (orphanRes.data ??
      []) as unknown as DuelAnomaliesData["orphanRounds"],
    stalledDuels: (stalledRes.data ?? []) as unknown as AdminDuelRow[],
    expiredInvitations: (expiredRes.data ??
      []) as unknown as DuelAnomaliesData["expiredInvitations"],
    duelReports: (reportsRes.data ??
      []) as unknown as DuelAnomaliesData["duelReports"],
  };
}

export async function interveneDuelAction(params: {
  duelId: string;
  action: "force_cancel" | "force_complete" | "switch_turn" | "unlock_post";
  winnerId?: string | null;
  refundFee?: boolean;
  reason: string;
}): Promise<{ success: boolean; error?: string; refundedAmount?: number }> {
  await requireAdmin("moderator");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_intervene_duel", {
    p_duel_id: params.duelId,
    p_action: params.action,
    p_winner_id: params.winnerId ?? null,
    p_refund_fee: Boolean(params.refundFee),
    p_reason: params.reason.trim(),
  });

  if (error) {
    console.error("[interveneDuelAction] RPC error:", error);
    return { success: false, error: error.message };
  }

  const res = data as {
    success: boolean;
    error?: string;
    refunded_amount?: number;
  };

  if (!res.success) {
    const map: Record<string, string> = {
      REASON_REQUIRED: "请填写仲裁原因（审计必填）",
      DUEL_NOT_FOUND: "未找到该对决记录",
      ALREADY_ENDED: "该对决已结束或已取消",
      ONLY_ACTIVE_CAN_COMPLETE: "仅进行中的对决可执行强制完赛裁决",
      INVALID_WINNER: "指定的获胜方不是本场选手",
      DUEL_NOT_ACTIVE: "仅进行中的对决可切换当前发言方",
      NO_OPPONENT: "本场对决尚无应战选手",
      NO_LINKED_POST: "本场对决未关联任何社区原帖",
    };
    return {
      success: false,
      error: map[res.error ?? ""] ?? res.error ?? "仲裁操作失败",
    };
  }

  revalidatePath("/admin/duels");
  revalidatePath("/duels");
  revalidatePath(`/duels/${params.duelId}`);
  return { success: true, refundedAmount: res.refunded_amount ?? 0 };
}

export async function overrideRoundScoreAction(params: {
  roundId: string;
  duelId: string;
  evidenceScore: number;
  citationScore: number;
  logicScore: number;
  hasFallacy: boolean;
  fallacyType: string;
  fallacyPenalty: number;
  analysis: string;
  reason: string;
}): Promise<{ success: boolean; error?: string; totalScore?: number }> {
  await requireAdmin("moderator");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_override_round_score", {
    p_round_id: params.roundId,
    p_evidence_score: params.evidenceScore,
    p_citation_score: params.citationScore,
    p_logic_score: params.logicScore,
    p_has_fallacy: params.hasFallacy,
    p_fallacy_type: params.fallacyType,
    p_fallacy_penalty: params.fallacyPenalty,
    p_analysis: params.analysis,
    p_reason: params.reason.trim() || "管理员人工复核改判",
  });

  if (error) {
    console.error("[overrideRoundScoreAction] RPC error:", error);
    return { success: false, error: error.message };
  }

  const res = data as {
    success: boolean;
    error?: string;
    total_score?: number;
  };
  if (!res.success) {
    return { success: false, error: res.error ?? "改判失败" };
  }

  revalidatePath("/admin/duels");
  revalidatePath(`/duels/${params.duelId}`);
  return { success: true, totalScore: res.total_score };
}

export async function rollbackCompletedDuelAction(params: {
  duelId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin("super_admin");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_rollback_completed_duel", {
    p_duel_id: params.duelId,
    p_reason: params.reason.trim(),
  });

  if (error) {
    console.error("[rollbackCompletedDuelAction] RPC error:", error);
    return { success: false, error: error.message };
  }

  const res = data as { success: boolean; error?: string };
  if (!res.success) {
    return { success: false, error: res.error ?? "赛果冲正回滚失败" };
  }

  revalidatePath("/admin/duels");
  revalidatePath("/duels");
  revalidatePath(`/duels/${params.duelId}`);
  return { success: true };
}

export async function deleteDuelCommentAction(params: {
  commentId: string;
  duelId: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin("moderator");
  const supabase = await createClient();

  const { error } = await supabase
    .from("duel_live_comments")
    .delete()
    .eq("id", params.commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction({
    actionType: "duel_delete_danmaku",
    targetType: "duel_live_comment",
    targetId: params.commentId,
    details: { duel_id: params.duelId },
  });

  revalidatePath("/admin/duels");
  return { success: true };
}

export async function updateDuelConfigAction(
  nextConfig: DuelConfig
): Promise<{ success: boolean; error?: string; config?: DuelConfig }> {
  const admin = await requireAdmin("admin");
  const supabase = await createClient();
  const normalized = normalizeDuelConfig(nextConfig);

  const { error } = await supabase.from("system_settings").upsert(
    {
      key: "duel_config",
      value: normalized,
      description: "学术对决 AI 裁判参数、人格预设与经济风控动态配置",
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[updateDuelConfigAction] Error:", error);
    return { success: false, error: error.message };
  }

  await logAdminAction({
    actionType: "duel_update_config",
    targetType: "system_settings",
    targetId: "duel_config",
    details: {
      active_preset: normalized.referee.active_preset,
      model: normalized.referee.model,
      creation_fee: normalized.economy.creation_fee,
      auto_refund_on_pending_cancel:
        normalized.economy.auto_refund_on_pending_cancel,
    },
  });

  revalidatePath("/admin/duels");
  revalidatePath("/duels");
  return { success: true, config: normalized };
}
