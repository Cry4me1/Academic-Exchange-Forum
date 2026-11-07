"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens";
import {
  interveneDuelAction,
  rollbackCompletedDuelAction,
  type AdminDuelRow,
  type DuelAnomaliesData,
} from "@/lib/admin/duels";
import type { DuelEconomyConfig } from "@/lib/duel-config";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Gavel,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Unlock,
  XCircle,
} from "lucide-react";

export type ArbitrationMode =
  | "force_cancel"
  | "force_complete"
  | "switch_turn"
  | "unlock_post"
  | "rollback";

interface DuelArbitrationDialogProps {
  duel: AdminDuelRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAction?: ArbitrationMode;
  isSuperAdmin: boolean;
  onSuccess: () => void;
}

export function DuelArbitrationDialog({
  duel,
  open,
  onOpenChange,
  defaultAction,
  isSuperAdmin,
  onSuccess,
}: DuelArbitrationDialogProps) {
  const [action, setAction] = useState<ArbitrationMode>("force_cancel");
  const [winnerChoice, setWinnerChoice] = useState<
    "challenger" | "opponent" | "draw"
  >("draw");
  const [refundFee, setRefundFee] = useState(true);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!duel || !open) return;
    setReason("");
    setRefundFee(duel.status === "pending");
    setWinnerChoice("draw");

    if (defaultAction) {
      setAction(defaultAction);
      return;
    }

    if (duel.status === "active") {
      setAction("force_complete");
    } else if (duel.status === "pending") {
      setAction("force_cancel");
    } else if (duel.status === "completed" && isSuperAdmin) {
      setAction("rollback");
    } else if (duel.post_id) {
      setAction("unlock_post");
    }
  }, [duel, open, defaultAction, isSuperAdmin]);

  if (!duel) return null;

  const availableActions: Array<{
    key: ArbitrationMode;
    label: string;
    desc: string;
    danger?: boolean;
  }> = [];

  if (duel.status === "active") {
    availableActions.push(
      {
        key: "force_complete",
        label: "强制完赛裁决",
        desc: "指定获胜方或平局，原子结算质押声望池、奖惩双方声望并自动解锁原帖。",
      },
      {
        key: "force_cancel",
        label: "强制流局取消",
        desc: "中止当前对决，自动原路退还全部观战质押声望并解锁关联原帖。",
        danger: true,
      },
      {
        key: "switch_turn",
        label: "强制切换发言方",
        desc: "当一方长时间挂机卡回合时，直接将发言权移交另一方继续比赛。",
      }
    );
  }

  if (duel.status === "pending") {
    availableActions.push({
      key: "force_cancel",
      label: "清理流局并退费",
      desc: "关闭未开赛对决与待响应邀请，支持 100% 原路退回挑战者发起费。",
      danger: true,
    });
  }

  if (duel.post_id) {
    availableActions.push({
      key: "unlock_post",
      label: "紧急解锁原帖",
      desc: "解除关联社区原帖的防篡改编辑锁定状态，不影响对决本身状态。",
    });
  }

  if (duel.status === "completed" && isSuperAdmin) {
    availableActions.push({
      key: "rollback",
      label: "超管赛果冲正回滚",
      desc: "仅超级管理员可用：逆向冲正已完赛对决的胜负声望奖惩与观战质押分红。",
      danger: true,
    });
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("请填写仲裁干预原因（审计日志必填）");
      return;
    }

    startTransition(async () => {
      if (action === "rollback") {
        const res = await rollbackCompletedDuelAction({
          duelId: duel.id,
          reason: reason.trim(),
        });
        if (!res.success) {
          toast.error(res.error || "冲正回滚失败");
          return;
        }
        toast.success("已完赛对决已原子冲正回滚，声望与质押账目已逆向平账");
        onOpenChange(false);
        onSuccess();
        return;
      }

      const winnerId =
        action === "force_complete"
          ? winnerChoice === "challenger"
            ? duel.challenger_id
            : winnerChoice === "opponent"
              ? duel.opponent_id
              : null
          : null;

      const res = await interveneDuelAction({
        duelId: duel.id,
        action,
        winnerId,
        refundFee: action === "force_cancel" ? refundFee : false,
        reason: reason.trim(),
      });

      if (!res.success) {
        toast.error(res.error || "仲裁操作执行失败");
        return;
      }

      const refundHint =
        res.refundedAmount && res.refundedAmount > 0
          ? `（已自动退还发起费 ${res.refundedAmount} 积分）`
          : "";
      toast.success(`原子仲裁干预已生效${refundHint}`);
      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-6 gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <Gavel className="h-3.5 w-3.5" />
              原子事务仲裁工作台
            </span>
          </div>
          <DialogTitle className="mt-1 text-left text-base font-bold text-zinc-900 dark:text-zinc-100">
            {duel.topic}
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-zinc-500">
            挑战方 @{duel.challenger?.username || "未知"} vs 应战方{" "}
            {duel.opponent ? `@${duel.opponent.username}` : "待应战"} · 所有账目变动将在单个 PostgreSQL 事务中原子执行并写入审计日志。
          </DialogDescription>
        </DialogHeader>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

        {/* 动作选择胶囊矩阵 */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            选择干预动作
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableActions.map((item) => {
              const selected = action === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAction(item.key)}
                  className={cn(
                    "rounded-2xl border-0 p-3 text-left transition-all cursor-pointer",
                    selected
                      ? item.danger
                        ? "bg-rose-500/15 text-rose-900 dark:text-rose-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_4px_14px_-2px_rgba(244,63,94,0.18)]"
                        : "bg-sky-500/15 text-sky-950 dark:text-sky-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_4px_14px_-2px_rgba(14,165,233,0.18)]"
                      : "bg-zinc-900/[0.04] hover:bg-zinc-900/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.09] text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <div className="text-xs font-medium">{item.label}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 强制完赛获胜方选择 */}
        {action === "force_complete" && (
          <div className="rounded-2xl border-0 bg-zinc-900/[0.04] dark:bg-white/[0.05] p-3.5 space-y-2.5">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              指定裁决结果
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  {
                    id: "challenger" as const,
                    label: `挑战方胜 (@${duel.challenger?.username || "挑战者"})`,
                  },
                  ...(duel.opponent_id
                    ? [
                        {
                          id: "opponent" as const,
                          label: `应战方胜 (@${duel.opponent?.username || "应战者"})`,
                        },
                      ]
                    : []),
                  {
                    id: "draw" as const,
                    label: "判定平局（退还全部观战质押）",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWinnerChoice(opt.id)}
                  className={cn(
                    "rounded-full border-0 px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    winnerChoice === opt.id
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
                      : "bg-white/75 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 hover:bg-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 强制流局退还发起费开关 */}
        {action === "force_cancel" && (
          <div className="rounded-2xl border-0 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] px-4 py-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                100% 原路退还挑战者发起费积分
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {duel.status === "pending"
                  ? "未开赛对决触发流局时，系统触发器将确保幂等全额退费，绝不重复入账。"
                  : "进行中对决若因系统故障流局，可勾选一并退还挑战者发起费。"}
              </p>
            </div>
            <Switch
              className="border-0"
              checked={refundFee}
              onCheckedChange={setRefundFee}
            />
          </div>
        )}

        {/* 必填审计原因 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            仲裁审计原因（必填，将记录至管理员操作日志）
          </label>
          <input
            type="text"
            placeholder="例如：应战方超过 72 小时未响应，清理流局并退还挑战者发起费..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/20 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 active:scale-[0.97] transition-all cursor-pointer"
          >
            取消
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={MOTION_SPRINGS.hapticTap}
            disabled={isPending || availableActions.length === 0}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-5 py-2 text-xs font-medium shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)] disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Gavel className="h-3.5 w-3.5" />
            )}
            执行原子仲裁
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DuelAnomalyPanelProps {
  anomalies: DuelAnomaliesData;
  economyConfig: DuelEconomyConfig;
  canModerate: boolean;
  onInspectDuel: (duelId: string) => void;
  onOpenArbitration: (
    duel: AdminDuelRow,
    defaultAction?: ArbitrationMode
  ) => void;
  onRefresh: () => Promise<void>;
}

export function DuelAnomalyPanel({
  anomalies,
  economyConfig,
  canModerate,
  onInspectDuel,
  onOpenArbitration,
  onRefresh,
}: DuelAnomalyPanelProps) {
  const [rejudgingId, setRejudgingId] = useState<string | null>(null);
  const [batchRejudging, setBatchRejudging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [quickActingId, setQuickActingId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      toast.success("异常监控雷达已同步最新状态");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRejudgeOrphan = async (roundId: string, roundNumber: number) => {
    setRejudgingId(roundId);
    try {
      const resp = await fetch("/api/admin/duels/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rejudge_round", roundId }),
      });
      const json = (await resp.json()) as {
        success?: boolean;
        error?: string;
        scoreData?: { totalScore: number };
      };
      if (!resp.ok || !json.success) {
        toast.error(json.error || "孤儿回合补评失败");
        return;
      }
      toast.success(
        `孤儿回合 #${roundNumber} 已补评入库（得分 ${json.scoreData?.totalScore ?? 0}）`
      );
      await onRefresh();
    } catch (err) {
      toast.error(
        "请求异常：" + (err instanceof Error ? err.message : "网络错误")
      );
    } finally {
      setRejudgingId(null);
    }
  };

  const handleBatchRejudgeAll = async () => {
    if (anomalies.orphanRounds.length === 0) return;
    setBatchRejudging(true);
    let okCount = 0;
    for (const item of anomalies.orphanRounds) {
      try {
        const resp = await fetch("/api/admin/duels/reanalyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "rejudge_round", roundId: item.id }),
        });
        const json = (await resp.json()) as { success?: boolean };
        if (resp.ok && json.success) okCount += 1;
      } catch {
        // 单条失败不阻断后续批次
      }
    }
    setBatchRejudging(false);
    toast.success(
      `批量补评完成：成功修复 ${okCount} / ${anomalies.orphanRounds.length} 个孤儿回合`
    );
    await onRefresh();
  };

  const handleCancelExpiredInvite = async (duelId: string, topic: string) => {
    setQuickActingId(duelId);
    try {
      const res = await interveneDuelAction({
        duelId,
        action: "force_cancel",
        refundFee: true,
        reason: `挑战邀请超过 ${economyConfig.invite_expire_hours} 小时未响应，异常雷达自动流局并全额退还发起费`,
      });
      if (!res.success) {
        toast.error(res.error || "流局清理失败");
        return;
      }
      toast.success(
        `已清理逾期对决「${topic.slice(0, 18)}」并全额退费 ${res.refundedAmount ?? 0} 积分`
      );
      await onRefresh();
    } finally {
      setQuickActingId(null);
    }
  };

  const handleQuickSwitchTurn = async (duel: AdminDuelRow) => {
    setQuickActingId(duel.id);
    try {
      const res = await interveneDuelAction({
        duelId: duel.id,
        action: "switch_turn",
        reason: `对决停滞超过 ${economyConfig.stall_warning_hours} 小时，管理员强制切换当前发言方`,
      });
      if (!res.success) {
        toast.error(res.error || "切换发言方失败");
        return;
      }
      toast.success("已强制切换当前回合发言权");
      await onRefresh();
    } finally {
      setQuickActingId(null);
    }
  };

  const handleQuickUnlockPost = async (duel: AdminDuelRow) => {
    setQuickActingId(duel.id);
    try {
      const res = await interveneDuelAction({
        duelId: duel.id,
        action: "unlock_post",
        reason: "对决长期停滞导致社区原帖死锁，管理员紧急解除原帖锁定",
      });
      if (!res.success) {
        toast.error(res.error || "解锁原帖失败");
        return;
      }
      toast.success("关联社区原帖已成功解除锁定");
      await onRefresh();
    } finally {
      setQuickActingId(null);
    }
  };

  const totalCount =
    anomalies.orphanRounds.length +
    anomalies.stalledDuels.length +
    anomalies.expiredInvitations.length +
    anomalies.duelReports.length;

  return (
    <div className="space-y-5">
      {/* 顶部雷达状态条 */}
      <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              对决异常监控雷达与原子修复台
            </h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              停滞阈值：{economyConfig.stall_warning_hours}h · 邀请逾期阈值：
              {economyConfig.invite_expire_hours}h · 当前检出{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {totalCount}
              </span>{" "}
              项待处理异常
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleManualRefresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-900/[0.06] hover:bg-zinc-900/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] px-4 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 active:scale-[0.97] transition-all cursor-pointer"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
          />
          立即扫描异常队列
        </button>
      </div>

      {/* 四象限 Bento 异常巡检网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 象限 1：AI 漏评孤儿回合 */}
        <div
          onMouseMove={trackPointer120fps}
          className="group relative overflow-hidden rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300 tabular-nums">
                <Sparkles className="h-3.5 w-3.5" />
                AI 漏评孤儿回合 ({anomalies.orphanRounds.length})
              </span>
            </div>
            {canModerate && anomalies.orphanRounds.length > 1 && (
              <button
                type="button"
                disabled={batchRejudging}
                onClick={() => void handleBatchRejudgeAll()}
                className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 px-3 py-1 text-xs font-medium shadow-[0_4px_12px_-2px_rgba(0,0,0,0.24),inset_0_1px_1px_rgba(255,255,255,0.35)] active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
              >
                {batchRejudging ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                一键补评全部
              </button>
            )}
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {anomalies.orphanRounds.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-zinc-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              所有对决回合均已完成 AI 评判，无漏评积压
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {anomalies.orphanRounds.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-medium">
                    <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.duel?.topic || "未知辩题"} · 第 {item.round_number}{" "}
                      回合
                    </span>
                    <span className="text-zinc-400 shrink-0">
                      @{item.author?.username || "学者"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {item.content_text || "（富文本内容，点击巡检查看）"}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onInspectDuel(item.duel_id)}
                      className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/20 px-3 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      巡检
                    </button>
                    {canModerate && (
                      <button
                        type="button"
                        disabled={rejudgingId === item.id || batchRejudging}
                        onClick={() =>
                          void handleRejudgeOrphan(item.id, item.round_number)
                        }
                        className="inline-flex items-center gap-1 rounded-full border-0 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300 active:scale-[0.97] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {rejudgingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        AI 补评入库
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 象限 2：超时停滞与锁帖死锁对决 */}
        <div
          onMouseMove={trackPointer120fps}
          className="group relative overflow-hidden rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              超时停滞与锁帖告警 ({anomalies.stalledDuels.length})
            </span>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {anomalies.stalledDuels.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-zinc-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              无超过 {economyConfig.stall_warning_hours} 小时的停滞对决或锁帖死锁
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {anomalies.stalledDuels.map((duel) => (
                <div
                  key={duel.id}
                  className="rounded-2xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[260px]">
                      {duel.topic}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {duel.post?.is_locked && (
                        <span className="inline-flex items-center gap-1 rounded-full border-0 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                          <Lock className="h-2.5 w-2.5" />
                          原帖锁定中
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-zinc-400 tabular-nums">
                        第 {duel.current_round}/{duel.max_rounds} 回合
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-zinc-500">
                    @{duel.challenger?.username || "挑战者"} vs @
                    {duel.opponent?.username || "应战者"}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onInspectDuel(duel.id)}
                      className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/20 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      回放
                    </button>
                    {canModerate && (
                      <>
                        <button
                          type="button"
                          disabled={quickActingId === duel.id}
                          onClick={() => void handleQuickSwitchTurn(duel)}
                          className="inline-flex items-center gap-1 rounded-full border-0 bg-sky-500/15 hover:bg-sky-500/25 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300 cursor-pointer"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          切回合
                        </button>
                        {duel.post?.is_locked && (
                          <button
                            type="button"
                            disabled={quickActingId === duel.id}
                            onClick={() => void handleQuickUnlockPost(duel)}
                            className="inline-flex items-center gap-1 rounded-full border-0 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 cursor-pointer"
                          >
                            <Unlock className="h-3 w-3" />
                            解锁原帖
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onOpenArbitration(duel, "force_complete")
                          }
                          className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 px-3 py-1 text-[11px] font-medium cursor-pointer"
                        >
                          <Gavel className="h-3 w-3" />
                          裁决
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 象限 3：逾期未响应挑战邀请（支持一键流局并全额退费） */}
        <div
          onMouseMove={trackPointer120fps}
          className="group relative overflow-hidden rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 tabular-nums">
              <RotateCcw className="h-3.5 w-3.5" />
              逾期未应战战书 ({anomalies.expiredInvitations.length})
            </span>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {anomalies.expiredInvitations.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-zinc-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              无超过 {economyConfig.invite_expire_hours} 小时的滞留挑战邀请
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {anomalies.expiredInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-medium">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {inv.duel?.topic || "未知对决"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-500">
                    发起方 @{inv.duel?.challenger?.username || "挑战者"} → 受邀方
                    @{inv.invitee?.username || "学者"}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onInspectDuel(inv.duel_id)}
                      className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/20 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <Eye className="h-3 w-3" />
                      查看
                    </button>
                    {canModerate && (
                      <button
                        type="button"
                        disabled={quickActingId === inv.duel_id}
                        onClick={() =>
                          void handleCancelExpiredInvite(
                            inv.duel_id,
                            inv.duel?.topic || "对决"
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full border-0 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        {quickActingId === inv.duel_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        流局并 100% 退费
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 象限 4：对决违规举报队列 */}
        <div
          onMouseMove={trackPointer120fps}
          className="group relative overflow-hidden rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-0 bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 tabular-nums">
              <Flag className="h-3.5 w-3.5" />
              对决学术不端举报 ({anomalies.duelReports.length})
            </span>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {anomalies.duelReports.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-zinc-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              当前暂无针对学术对决的待处理违规举报
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {anomalies.duelReports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-rose-600 dark:text-rose-400">
                      举报原因：{rep.reason}
                    </span>
                    <span className="text-zinc-400">
                      举报人 @{rep.reporter?.username || "学者"}
                    </span>
                  </div>
                  {rep.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {rep.description}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onInspectDuel(rep.target_id)}
                      className="inline-flex items-center gap-1 rounded-full border-0 bg-zinc-950/85 text-white dark:bg-white/90 dark:text-zinc-950 px-3 py-1 text-[11px] font-medium cursor-pointer"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      巡检涉事对决
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
