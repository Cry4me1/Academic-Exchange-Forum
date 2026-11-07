"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MOTION_SPRINGS } from "@/lib/motion-tokens";
import {
  deleteDuelCommentAction,
  getAdminDuelDetail,
  overrideRoundScoreAction,
  type AdminDuelDetail,
  type AdminDuelRoundRow,
  type AdminDuelRow,
} from "@/lib/admin/duels";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Crown,
  ExternalLink,
  Gavel,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Trash2,
  Unlock,
} from "lucide-react";

const NovelViewer = dynamic(() => import("@/components/editor/NovelViewer"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border-0 bg-zinc-500/5 p-4 text-xs font-medium text-zinc-400 animate-pulse">
      正在加载学术富文本与 LaTeX 公式渲染引擎...
    </div>
  ),
});

interface DuelInspectDrawerProps {
  duelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canModerate: boolean;
  isSuperAdmin: boolean;
  onOpenArbitration: (duel: AdminDuelRow) => void;
  onMutated?: () => void;
}

type InspectTab = "rounds" | "ledger" | "danmaku";

const STATUS_META: Record<
  AdminDuelRow["status"],
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "待应战",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
  },
  active: {
    label: "交锋中",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
  },
  completed: {
    label: "已完赛",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
  },
  cancelled: {
    label: "已取消",
    badgeClass:
      "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]",
  },
};

const KO_LABELS: Record<string, string> = {
  negative_score: "负分阈值 KO",
  lp_zero: "LP 归零 KO",
  surrender: "主动认输",
  admin_arbitration: "管理员强制裁决",
  admin_rollback: "超管冲正回滚",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function DuelInspectDrawer({
  duelId,
  open,
  onOpenChange,
  canModerate,
  isSuperAdmin,
  onOpenArbitration,
  onMutated,
}: DuelInspectDrawerProps) {
  const [detail, setDetail] = useState<AdminDuelDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectTab>("rounds");
  const [rejudgingRoundId, setRejudgingRoundId] = useState<string | null>(null);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // 人工改判表单状态
  const [overrideForm, setOverrideForm] = useState({
    evidenceScore: 0,
    citationScore: 0,
    logicScore: 0,
    hasFallacy: false,
    fallacyType: "",
    fallacyPenalty: 0,
    analysis: "",
    reason: "",
  });

  const loadDetail = useCallback(async (targetId: string) => {
    setLoading(true);
    try {
      const res = await getAdminDuelDetail(targetId);
      setDetail(res);
    } catch (err) {
      toast.error(
        "读取对决详情失败：" +
          (err instanceof Error ? err.message : "网络异常")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && duelId) {
      setEditingRoundId(null);
      void loadDetail(duelId);
    }
  }, [open, duelId, loadDetail]);

  const startEditRound = (round: AdminDuelRoundRow) => {
    if (editingRoundId === round.id) {
      setEditingRoundId(null);
      return;
    }
    setEditingRoundId(round.id);
    setOverrideForm({
      evidenceScore: Number(round.evidence_score) || 0,
      citationScore: Number(round.citation_score) || 0,
      logicScore: Number(round.logic_score) || 0,
      hasFallacy: Boolean(round.has_fallacy),
      fallacyType: round.fallacy_type || "",
      fallacyPenalty: Number(round.fallacy_penalty) || 0,
      analysis: round.ai_analysis || "",
      reason: "",
    });
  };

  const handleSaveOverride = (round: AdminDuelRoundRow) => {
    if (!detail) return;
    startTransition(async () => {
      const res = await overrideRoundScoreAction({
        roundId: round.id,
        duelId: detail.duel.id,
        evidenceScore: Number(overrideForm.evidenceScore) || 0,
        citationScore: Number(overrideForm.citationScore) || 0,
        logicScore: Number(overrideForm.logicScore) || 0,
        hasFallacy: overrideForm.hasFallacy,
        fallacyType: overrideForm.hasFallacy
          ? overrideForm.fallacyType.trim() || "人工判定逻辑漏洞"
          : "",
        fallacyPenalty: overrideForm.hasFallacy
          ? -Math.abs(Number(overrideForm.fallacyPenalty) || 10)
          : 0,
        analysis: overrideForm.analysis.trim() || "管理员人工复核改判",
        reason: overrideForm.reason.trim() || "管理员人工复核改判回合得分",
      });

      if (!res.success) {
        toast.error(res.error || "人工改判失败");
        return;
      }

      toast.success(
        `第 ${round.round_number} 回合改判已生效（新总分：${res.totalScore ?? 0}）`
      );
      setEditingRoundId(null);
      await loadDetail(detail.duel.id);
      onMutated?.();
    });
  };

  const handleAiRejudge = async (roundId: string, roundNumber: number) => {
    if (!detail) return;
    setRejudgingRoundId(roundId);
    try {
      const resp = await fetch("/api/admin/duels/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "rejudge_round",
          roundId,
        }),
      });
      const json = (await resp.json()) as {
        success?: boolean;
        error?: string;
        durationMs?: number;
        scoreData?: { totalScore: number };
      };
      if (!resp.ok || !json.success) {
        toast.error(json.error || "AI 重新评判失败");
        return;
      }
      toast.success(
        `第 ${roundNumber} 回合 AI 重评完成（得分 ${json.scoreData?.totalScore ?? 0}，耗时 ${((json.durationMs ?? 0) / 1000).toFixed(1)}s）`
      );
      await loadDetail(detail.duel.id);
      onMutated?.();
    } catch (err) {
      toast.error(
        "AI 重评请求异常：" +
          (err instanceof Error ? err.message : "网络错误")
      );
    } finally {
      setRejudgingRoundId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!detail) return;
    setDeletingCommentId(commentId);
    try {
      const res = await deleteDuelCommentAction({
        commentId,
        duelId: detail.duel.id,
      });
      if (!res.success) {
        toast.error(res.error || "删除弹幕失败");
        return;
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
            }
          : null
      );
      toast.success("违规观战弹幕已清理并记入审计日志");
      onMutated?.();
    } finally {
      setDeletingCommentId(null);
    }
  };

  const duel = detail?.duel ?? null;
  const canTriggerArbitration =
    duel &&
    canModerate &&
    (duel.status === "pending" ||
      duel.status === "active" ||
      Boolean(duel.post?.is_locked) ||
      (isSuperAdmin && duel.status === "completed"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-900/5 dark:bg-white/10 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Swords className="h-3.5 w-3.5 text-sky-500" />
              全景巡检抽屉
            </span>
            {duel && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border-0 px-3 py-1 text-xs font-medium",
                  STATUS_META[duel.status].badgeClass
                )}
              >
                {STATUS_META[duel.status].label}
              </span>
            )}
            {duel?.ko_type && (
              <span className="inline-flex items-center rounded-full border-0 bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                {KO_LABELS[duel.ko_type] || duel.ko_type}
              </span>
            )}
            {duel?.post && (
              <Link
                href={`/posts/${duel.post.id}`}
                target="_blank"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-medium transition-colors",
                  duel.post.is_locked
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                    : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/20"
                )}
              >
                {duel.post.is_locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
                <span className="max-w-[160px] truncate">
                  {duel.post.is_locked ? "原帖锁定中" : "原帖已解锁"}：
                  {duel.post.title}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            )}
          </div>

          <SheetTitle className="mt-2 text-left text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-100">
            {duel ? duel.topic : "正在读取对决记录..."}
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono">
              UUID: {duelId || "—"} · 第 {duel?.current_round ?? 0}/
              {duel?.max_rounds ?? 0} 回合
            </span>
            <span className="flex items-center gap-2">
              {duel && (
                <Link
                  href={`/duels/${duel.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-500/10 hover:bg-zinc-500/20 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  前台观战页
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {duelId && (
                <button
                  type="button"
                  onClick={() => void loadDetail(duelId)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-500/10 hover:bg-zinc-500/20 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <RefreshCw
                    className={cn("h-3 w-3", loading && "animate-spin")}
                  />
                  刷新
                </button>
              )}
              {canTriggerArbitration && duel && (
                <button
                  type="button"
                  onClick={() => onOpenArbitration(duel)}
                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-3 py-1 text-xs font-medium shadow-[0_4px_12px_-2px_rgba(0,0,0,0.24),inset_0_1px_1px_rgba(255,255,255,0.35)] active:scale-[0.97] transition-all cursor-pointer"
                >
                  <Gavel className="h-3 w-3" />
                  仲裁干预
                </button>
              )}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

        {loading && !detail ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 text-zinc-500">
            <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
            <p className="text-sm font-medium">正在同步对决回合、账单与弹幕...</p>
          </div>
        ) : !detail || !duel ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-12 text-zinc-500">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
            <p className="text-sm font-medium">未找到该对决记录或已被物理移除</p>
          </div>
        ) : (
          <>
            {/* 双方选手状态对比舱 */}
            <div className="px-6 py-4 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 挑战者 */}
                <div className="rounded-2xl border-0 bg-sky-500/[0.07] dark:bg-sky-500/[0.1] p-3.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex rounded-full border-0 bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300 shrink-0">
                        挑战方 · {duel.challenger_position}
                      </span>
                      <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        @{duel.challenger?.username || "未知学者"}
                      </span>
                    </div>
                    {duel.winner_id && duel.winner_id === duel.challenger_id && (
                      <span className="inline-flex items-center gap-1 rounded-full border-0 bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0">
                        <Crown className="h-3 w-3" />
                        胜方
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
                    <span>累计得分：{duel.challenger_score}</span>
                    <span>LP 生命值：{duel.challenger_lp}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, duel.challenger_lp))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 应战者 */}
                <div className="rounded-2xl border-0 bg-amber-500/[0.07] dark:bg-amber-500/[0.1] p-3.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex rounded-full border-0 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0">
                        应战方 · {duel.opponent_position}
                      </span>
                      <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {duel.opponent
                          ? `@${duel.opponent.username}`
                          : "等待应战中"}
                      </span>
                    </div>
                    {duel.winner_id && duel.winner_id === duel.opponent_id && (
                      <span className="inline-flex items-center gap-1 rounded-full border-0 bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0">
                        <Crown className="h-3 w-3" />
                        胜方
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
                    <span>累计得分：{duel.opponent_score}</span>
                    <span>LP 生命值：{duel.opponent_lp}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, duel.opponent_lp))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {duel.ko_reason && (
                <div className="mt-3 rounded-2xl border-0 bg-zinc-500/[0.08] px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  裁决记录说明：{duel.ko_reason}
                </div>
              )}

              {/* 抽屉内二级胶囊切换栏（严格锁死 font-medium 零布局跳动） */}
              <div className="mt-4 inline-flex flex-wrap items-center gap-1 rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.06] p-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                {(
                  [
                    {
                      id: "rounds" as const,
                      label: `回合回放与改判 (${detail.rounds.length})`,
                      icon: Scale,
                    },
                    {
                      id: "ledger" as const,
                      label: `发起费与质押账单 (${detail.bets.length})`,
                      icon: Coins,
                    },
                    {
                      id: "danmaku" as const,
                      label: `实时弹幕治理 (${detail.comments.length})`,
                      icon: MessageSquare,
                    },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 rounded-full border-0 px-3.5 py-1.5 text-xs font-medium transition-colors tabular-nums cursor-pointer",
                        isActive
                          ? "text-zinc-950 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="duel-inspect-tab-pill"
                          transition={MOTION_SPRINGS.fluidPill}
                          className="absolute inset-0 rounded-full border-0 bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                        />
                      )}
                      <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

            {/* 滚动内容区 */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {activeTab === "rounds" && (
                <>
                  {detail.rounds.length === 0 ? (
                    <div className="rounded-3xl border-0 bg-white/60 dark:bg-zinc-800/40 p-10 text-center text-sm font-medium text-zinc-500 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                      当前对决尚未产生任何交锋回合
                    </div>
                  ) : (
                    detail.rounds.map((round) => {
                      const isChallenger =
                        round.author_id === duel.challenger_id;
                      const isOrphan = !round.ai_analyzed_at;
                      const isEditing = editingRoundId === round.id;
                      const isRejudging = rejudgingRoundId === round.id;

                      return (
                        <div
                          key={round.id}
                          className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-800/50 p-5 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-4px_rgba(0,0,0,0.35)] space-y-3.5"
                        >
                          {/* 回合头部 */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full border-0 bg-zinc-900/8 dark:bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
                                第 {round.round_number} 回合
                              </span>
                              <span
                                className={cn(
                                  "inline-flex rounded-full border-0 px-2.5 py-0.5 text-xs font-medium",
                                  isChallenger
                                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                )}
                              >
                                {isChallenger
                                  ? `挑战方 · ${duel.challenger_position}`
                                  : `应战方 · ${duel.opponent_position}`}{" "}
                                · @{round.author?.username || "学者"}
                              </span>
                              {isOrphan && (
                                <span className="inline-flex items-center gap-1 rounded-full border-0 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                                  <AlertTriangle className="h-3 w-3" />
                                  AI 漏评孤儿回合
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-zinc-400 tabular-nums">
                              {formatDateTime(round.created_at)}
                            </span>
                          </div>

                          {/* 学术富文本回放（支持 LaTeX 与代码块） */}
                          <div className="rounded-2xl border-0 bg-zinc-900/[0.025] dark:bg-black/25 p-4 text-sm">
                            {round.content &&
                            Object.keys(round.content).length > 0 ? (
                              <NovelViewer initialValue={round.content} />
                            ) : (
                              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                                {round.content_text || "（空内容）"}
                              </p>
                            )}
                          </div>

                          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                          {/* 四维得分胶囊与 AI 评语 */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium tabular-nums">
                              <span className="rounded-full border-0 bg-sky-500/12 px-2.5 py-1 text-sky-700 dark:text-sky-300">
                                证据 +{round.evidence_score}
                              </span>
                              <span className="rounded-full border-0 bg-indigo-500/12 px-2.5 py-1 text-indigo-700 dark:text-indigo-300">
                                引用 +{round.citation_score}
                              </span>
                              <span className="rounded-full border-0 bg-emerald-500/12 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                                逻辑 +{round.logic_score}
                              </span>
                              {round.has_fallacy && (
                                <span className="rounded-full border-0 bg-rose-500/15 px-2.5 py-1 text-rose-700 dark:text-rose-300">
                                  谬误 ({round.fallacy_type || "逻辑漏洞"}){" "}
                                  {round.fallacy_penalty}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "rounded-full border-0 px-3 py-1 font-semibold",
                                  round.total_score >= 0
                                    ? "bg-zinc-900/10 text-zinc-900 dark:bg-white/15 dark:text-white"
                                    : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                )}
                              >
                                回合总分：
                                {round.total_score > 0
                                  ? `+${round.total_score}`
                                  : round.total_score}
                              </span>
                            </div>

                            {canModerate && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isRejudging || isPending}
                                  onClick={() =>
                                    void handleAiRejudge(
                                      round.id,
                                      round.round_number
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {isRejudging ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3 w-3" />
                                  )}
                                  {isOrphan ? "AI 补评入库" : "AI 重评"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => startEditRound(round)}
                                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/22 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 active:scale-[0.97] transition-all cursor-pointer"
                                >
                                  <SlidersHorizontal className="h-3 w-3" />
                                  {isEditing ? "收起改判" : "人工改判"}
                                </button>
                              </div>
                            )}
                          </div>

                          {round.ai_analysis && (
                            <div className="rounded-2xl border-0 bg-sky-500/[0.06] dark:bg-sky-500/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                              <span className="font-semibold text-sky-700 dark:text-sky-300">
                                裁判评语：
                              </span>
                              {round.ai_analysis}
                            </div>
                          )}

                          {/* 内联人工复核改判面板 */}
                          {isEditing && canModerate && (
                            <div className="rounded-2xl border-0 bg-zinc-900/[0.04] dark:bg-white/[0.05] p-4 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                              <div className="grid grid-cols-3 gap-2.5">
                                <label className="space-y-1">
                                  <span className="text-[11px] font-medium text-zinc-500">
                                    证据分
                                  </span>
                                  <input
                                    type="number"
                                    value={overrideForm.evidenceScore}
                                    onChange={(e) =>
                                      setOverrideForm((f) => ({
                                        ...f,
                                        evidenceScore: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full rounded-full border-0 bg-white/85 dark:bg-zinc-900/75 px-3 py-1.5 text-xs font-medium tabular-nums outline-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-[11px] font-medium text-zinc-500">
                                    引用分
                                  </span>
                                  <input
                                    type="number"
                                    value={overrideForm.citationScore}
                                    onChange={(e) =>
                                      setOverrideForm((f) => ({
                                        ...f,
                                        citationScore: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full rounded-full border-0 bg-white/85 dark:bg-zinc-900/75 px-3 py-1.5 text-xs font-medium tabular-nums outline-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-[11px] font-medium text-zinc-500">
                                    逻辑分
                                  </span>
                                  <input
                                    type="number"
                                    value={overrideForm.logicScore}
                                    onChange={(e) =>
                                      setOverrideForm((f) => ({
                                        ...f,
                                        logicScore: Number(e.target.value),
                                      }))
                                    }
                                    className="w-full rounded-full border-0 bg-white/85 dark:bg-zinc-900/75 px-3 py-1.5 text-xs font-medium tabular-nums outline-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                                  />
                                </label>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                  <Switch
                                    className="border-0"
                                    checked={overrideForm.hasFallacy}
                                    onCheckedChange={(checked) =>
                                      setOverrideForm((f) => ({
                                        ...f,
                                        hasFallacy: checked,
                                        fallacyPenalty: checked
                                          ? f.fallacyPenalty || -10
                                          : 0,
                                      }))
                                    }
                                  />
                                  判定存在逻辑谬误（联动重算双方总分与 LP）
                                </label>

                                {overrideForm.hasFallacy && (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="谬误类型（如：偷换概念）"
                                      value={overrideForm.fallacyType}
                                      onChange={(e) =>
                                        setOverrideForm((f) => ({
                                          ...f,
                                          fallacyType: e.target.value,
                                        }))
                                      }
                                      className="w-40 rounded-full border-0 bg-white/85 dark:bg-zinc-900/75 px-3 py-1.5 text-xs font-medium outline-none"
                                    />
                                    <input
                                      type="number"
                                      placeholder="扣分 (-10)"
                                      value={overrideForm.fallacyPenalty}
                                      onChange={(e) =>
                                        setOverrideForm((f) => ({
                                          ...f,
                                          fallacyPenalty: Number(
                                            e.target.value
                                          ),
                                        }))
                                      }
                                      className="w-24 rounded-full border-0 bg-white/85 dark:bg-zinc-900/75 px-3 py-1.5 text-xs font-medium tabular-nums outline-none"
                                    />
                                  </div>
                                )}
                              </div>

                              <textarea
                                rows={2}
                                placeholder="更新裁判复核评语..."
                                value={overrideForm.analysis}
                                onChange={(e) =>
                                  setOverrideForm((f) => ({
                                    ...f,
                                    analysis: e.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/75 p-3 text-xs font-medium outline-none"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <input
                                  type="text"
                                  placeholder="审计备注原因（如：申诉复核修正引用得分）"
                                  value={overrideForm.reason}
                                  onChange={(e) =>
                                    setOverrideForm((f) => ({
                                      ...f,
                                      reason: e.target.value,
                                    }))
                                  }
                                  className="flex-1 min-w-[200px] rounded-full border-0 bg-white/85 dark:bg-zinc-900/75 px-3.5 py-1.5 text-xs font-medium outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleSaveOverride(round)}
                                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-4 py-1.5 text-xs font-medium shadow-[0_4px_14px_-2px_rgba(0,0,0,0.26),inset_0_1px_1px_rgba(255,255,255,0.38)] active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {isPending && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  确认原子改判
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === "ledger" && (
                <div className="space-y-4">
                  {/* 发起费与自动退费状态卡片 */}
                  <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-800/50 p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        挑战者发起费扣款记录
                      </p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {detail.feePaid > 0
                          ? `${detail.feePaid} 积分`
                          : "0 积分（免发起费或历史对决）"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.feeRefunded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          已 100% 全额退回挑战者账户
                        </span>
                      ) : detail.feePaid > 0 ? (
                        <span className="inline-flex items-center rounded-full border-0 bg-zinc-500/12 px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          已正常核销（未触发退费）
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* 观战学者声望质押列表 */}
                  <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-800/50 p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        观战学者声望质押明细
                      </h4>
                      <span className="text-xs font-medium text-zinc-500 tabular-nums">
                        总质押池：
                        {detail.bets.reduce(
                          (acc, b) => acc + (Number(b.amount) || 0),
                          0
                        )}{" "}
                        声望
                      </span>
                    </div>
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                    {detail.bets.length === 0 ? (
                      <p className="py-6 text-center text-xs font-medium text-zinc-500">
                        本场对决暂无观战质押记录
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detail.bets.map((bet) => {
                          const backChallenger =
                            bet.target_id === duel.challenger_id;
                          return (
                            <div
                              key={bet.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-0 bg-zinc-900/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 text-xs font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-900 dark:text-zinc-100">
                                  @{bet.spectator?.username || "观战学者"}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full border-0 px-2.5 py-0.5 text-[11px]",
                                    backChallenger
                                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  )}
                                >
                                  押注{backChallenger ? "挑战方" : "应战方"}
                                </span>
                                {bet.funded && (
                                  <span className="rounded-full border-0 bg-emerald-500/12 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                                    已预扣锁仓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5 tabular-nums">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {bet.amount} 声望
                                </span>
                                <span className="rounded-full border-0 bg-zinc-500/12 px-2.5 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                                  {bet.status === "pending"
                                    ? "待结算"
                                    : bet.status === "won"
                                      ? "押中分红"
                                      : bet.status === "lost"
                                        ? "未押中"
                                        : bet.status === "refunded"
                                          ? "已原路退回"
                                          : bet.status}
                                </span>
                                <span className="text-zinc-400">
                                  {formatDateTime(bet.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "danmaku" && (
                <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-800/50 p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      实时观战弹幕审计流
                    </h4>
                    <span className="text-xs font-medium text-zinc-500 tabular-nums">
                      最近 {detail.comments.length} 条记录
                    </span>
                  </div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                  {detail.comments.length === 0 ? (
                    <p className="py-6 text-center text-xs font-medium text-zinc-500">
                      本场对决暂无观战实时弹幕
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start justify-between gap-3 rounded-2xl border-0 bg-zinc-900/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 font-medium">
                              <span className="text-zinc-900 dark:text-zinc-100">
                                @{comment.user?.username || "匿名观众"}
                              </span>
                              <span className="text-zinc-400 tabular-nums">
                                {formatDateTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 break-words">
                              {comment.content}
                            </p>
                          </div>
                          {canModerate && (
                            <button
                              type="button"
                              disabled={deletingCommentId === comment.id}
                              onClick={() =>
                                void handleDeleteComment(comment.id)
                              }
                              className="inline-flex items-center gap-1 rounded-full border-0 bg-rose-500/12 hover:bg-rose-500/22 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 active:scale-[0.96] transition-all shrink-0 cursor-pointer"
                            >
                              {deletingCommentId === comment.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              清理
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
