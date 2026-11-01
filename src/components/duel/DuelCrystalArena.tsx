"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Crown,
  Quote,
  RotateCw,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/duel/ReputationBadge";
import { cn } from "@/lib/utils";
import {
  MOTION_EASINGS,
  MOTION_SPRINGS,
  trackPointer120fps,
} from "@/lib/motion-tokens";

export interface DuelArenaProfile {
  id: string;
  username: string;
  avatar_url?: string;
  reputation_score?: number;
  duel_wins?: number;
  duel_losses?: number;
}

export interface DuelArenaRoundMetric {
  id: string;
  round_number: number;
  author_id: string;
  evidence_score: number;
  citation_score: number;
  logic_score: number;
  fallacy_penalty: number;
  total_score: number;
  has_fallacy: boolean;
  fallacy_type?: string;
  ai_analysis?: string;
  ai_analyzed_at?: string;
}

export interface DuelCrystalArenaData {
  id: string;
  topic: string;
  status: string;
  challenger_id: string;
  opponent_id?: string;
  winner_id?: string;
  challenger_score: number;
  opponent_score: number;
  challenger_lp: number;
  opponent_lp: number;
  challenger_position: string;
  opponent_position: string;
  max_rounds: number;
  current_round: number;
  ko_type?: string;
  ko_reason?: string;
  challenger: DuelArenaProfile;
  opponent?: DuelArenaProfile;
  winner?: { id: string; username: string };
}

interface DuelCrystalArenaProps {
  duel: DuelCrystalArenaData;
  rounds: DuelArenaRoundMetric[];
  className?: string;
}

/**
 * 零重绘物理弹簧数字滚轮 (Zero Re-render Spring Number Ticker)
 * 直接通过 MotionValue 订阅写入 DOM 节点，完全跳过 React 帧级重渲染
 */
function SpringNumberTicker({
  value,
  prefixPositive = false,
  className,
}: {
  value: number;
  prefixPositive?: boolean;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const nodeRef = React.useRef<HTMLSpanElement>(null);
  const springValue = useSpring(value, {
    stiffness: 240,
    damping: 28,
    mass: 0.8,
  });

  const formatNum = React.useCallback(
    (n: number) => {
      const rounded = Math.round(n);
      if (prefixPositive && rounded > 0) return `+${rounded}`;
      return `${rounded}`;
    },
    [prefixPositive]
  );

  React.useEffect(() => {
    if (prefersReducedMotion) {
      springValue.jump(value);
      if (nodeRef.current) {
        nodeRef.current.textContent = formatNum(value);
      }
      return;
    }
    springValue.set(value);
  }, [value, prefersReducedMotion, springValue, formatNum]);

  React.useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (nodeRef.current) {
        nodeRef.current.textContent = formatNum(latest);
      }
    });
    return unsubscribe;
  }, [springValue, formatNum]);

  return (
    <span ref={nodeRef} className={cn("tabular-nums", className)}>
      {formatNum(value)}
    </span>
  );
}

/**
 * 纯 GPU scaleX 复合层血条 (Composite-Only LP Bar)
 */
function CrystalLpBar({
  lp,
  prefersReducedMotion,
}: {
  lp: number;
  prefersReducedMotion: boolean | null;
}) {
  const safeLp = Math.min(100, Math.max(0, lp ?? 100));
  const ratio = safeLp / 100;

  const toneText =
    safeLp <= 30
      ? "text-rose-500 dark:text-rose-400"
      : safeLp <= 60
      ? "text-amber-500 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";

  const barFill =
    safeLp <= 30
      ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
      : safeLp <= 60
      ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]"
      : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]";

  return (
    <div className="mt-4 px-2 sm:px-4">
      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>学术生命值 LP</span>
        </span>
        <span className={cn("font-mono tabular-nums font-semibold", toneText)}>
          {safeLp} / 100
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-200/70 dark:bg-white/[0.08] overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.35)]">
        <motion.div
          initial={false}
          animate={{ scaleX: ratio }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.4, ease: MOTION_EASINGS.snappy }
          }
          className={cn(
            "h-full w-full rounded-full origin-left will-change-transform",
            barFill
          )}
        />
      </div>
    </div>
  );
}

/**
 * 背面 AI 裁决维度对比条
 */
function DimensionCompareRow({
  icon,
  label,
  leftVal,
  rightVal,
  maxPossible,
  prefersReducedMotion,
}: {
  icon: React.ReactNode;
  label: string;
  leftVal: number;
  rightVal: number;
  maxPossible: number;
  prefersReducedMotion: boolean | null;
}) {
  const denom = Math.max(maxPossible, leftVal, rightVal, 1);
  const leftRatio = Math.min(1, Math.max(0, leftVal / denom));
  const rightRatio = Math.min(1, Math.max(0, rightVal / denom));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
          {leftVal.toFixed(1)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          {icon}
          <span>{label}</span>
        </span>
        <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
          {rightVal.toFixed(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 items-center">
        {/* 正方（向右对齐向左延展） */}
        <div className="h-2 w-full rounded-full bg-zinc-200/65 dark:bg-white/[0.07] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ scaleX: leftRatio }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.45, ease: MOTION_EASINGS.snappy }
            }
            className="h-full w-full rounded-full bg-sky-500/90 shadow-[0_0_8px_rgba(14,165,233,0.35)] origin-right will-change-transform"
          />
        </div>

        {/* 反方（向左对齐向右延展） */}
        <div className="h-2 w-full rounded-full bg-zinc-200/65 dark:bg-white/[0.07] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ scaleX: rightRatio }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: 0.45, ease: MOTION_EASINGS.snappy }
            }
            className="h-full w-full rounded-full bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.35)] origin-left will-change-transform"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 学术对决 3D 液态晶体翻转竞技舱 (Duel 3D Crystal Flip Arena)
 * - 正面：实时双人对战态势、LP 复合层血条、物理弹簧计分牌
 * - 背面：AI 裁判三维学术指标透视矩阵、谬误审计与终局胜负铭牌
 * - 采用独立叶片级毛玻璃 + translateZ(1px) 防深度闪烁架构，完美兼容 Chromium/Safari 3D 透视
 */
export function DuelCrystalArena({
  duel,
  rounds,
  className,
}: DuelCrystalArenaProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isFlipped, setIsFlipped] = React.useState(false);
  const prevStatusRef = React.useRef(duel.status);

  // 当对决在当前会话中实时完赛（如决胜回合或 KO 触发），自动翻转揭晓晶体终局裁决铭牌
  React.useEffect(() => {
    if (
      prevStatusRef.current !== "completed" &&
      duel.status === "completed"
    ) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 480);
      prevStatusRef.current = duel.status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = duel.status;
  }, [duel.status]);

  // 聚合双方回合级 AI 裁判三维学术指标
  const telemetry = React.useMemo(() => {
    const analyzed = rounds.filter((r) => Boolean(r.ai_analyzed_at));
    const cRounds = analyzed.filter((r) => r.author_id === duel.challenger_id);
    const oRounds = analyzed.filter(
      (r) => duel.opponent_id && r.author_id === duel.opponent_id
    );

    const avg = (arr: DuelArenaRoundMetric[], pick: (r: DuelArenaRoundMetric) => number) =>
      arr.length === 0
        ? 0
        : arr.reduce((acc, item) => acc + (pick(item) || 0), 0) / arr.length;

    const latestAnalyzed =
      analyzed.length > 0 ? analyzed[analyzed.length - 1] : null;

    return {
      analyzedCount: analyzed.length,
      cCount: cRounds.length,
      oCount: oRounds.length,
      cEvidenceAvg: avg(cRounds, (r) => r.evidence_score),
      oEvidenceAvg: avg(oRounds, (r) => r.evidence_score),
      cCitationAvg: avg(cRounds, (r) => r.citation_score),
      oCitationAvg: avg(oRounds, (r) => r.citation_score),
      cLogicAvg: avg(cRounds, (r) => r.logic_score),
      oLogicAvg: avg(oRounds, (r) => r.logic_score),
      cFallacies: cRounds.filter((r) => r.has_fallacy).length,
      oFallacies: oRounds.filter((r) => r.has_fallacy).length,
      latestAnalysis: latestAnalyzed?.ai_analysis,
      latestRoundNumber: latestAnalyzed?.round_number,
    };
  }, [rounds, duel.challenger_id, duel.opponent_id]);

  const isCompleted = duel.status === "completed";
  const challengerWon = Boolean(
    duel.winner_id && duel.winner_id === duel.challenger_id
  );
  const opponentWon = Boolean(
    duel.winner_id && duel.opponent_id && duel.winner_id === duel.opponent_id
  );

  const sharedGlassSurface = cn(
    "relative w-full rounded-3xl border-0 p-5 sm:p-7 overflow-hidden",
    "bg-white/78 dark:bg-zinc-900/68 backdrop-blur-2xl",
    "shadow-[0_12px_40px_-6px_rgba(0,0,0,0.07),inset_0_1px_0.5px_rgba(255,255,255,0.88)]",
    "dark:shadow-[0_18px_48px_-8px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
  );

  return (
    <div
      className={cn("w-full select-none", className)}
      style={prefersReducedMotion ? undefined : { perspective: "1400px" }}
    >
      <motion.div
        initial={false}
        animate={
          prefersReducedMotion
            ? { rotateY: 0 }
            : { rotateY: isFlipped ? 180 : 0 }
        }
        transition={
          prefersReducedMotion ? { duration: 0 } : MOTION_SPRINGS.crystalFlip
        }
        className="relative grid grid-cols-1 will-change-transform"
        style={
          prefersReducedMotion
            ? undefined
            : { transformStyle: "preserve-3d" }
        }
      >
        {/* ==================== 正面：实时学术对决竞技舱 ==================== */}
        <div
          aria-hidden={isFlipped}
          onMouseMove={trackPointer120fps}
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-150",
            sharedGlassSurface,
            isFlipped
              ? prefersReducedMotion
                ? "opacity-0 pointer-events-none"
                : "pointer-events-none"
              : "opacity-100 pointer-events-auto"
          )}
          style={
            prefersReducedMotion
              ? undefined
              : {
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg) translateZ(1px)",
                }
          }
        >
          {/* 120fps 物理纯白漫反射光斑 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-100 transition-opacity duration-300"
            style={{
              background:
                "radial-gradient(520px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.28), transparent 60%)",
            }}
          />

          {/* 顶栏：回合状态药丸 + 3D 翻转按钮 */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-xs font-medium text-muted-foreground">
              <Swords className="h-3.5 w-3.5 text-sky-500" />
              <span>
                {isCompleted
                  ? "终局已定 · 学术裁决归档"
                  : duel.status === "pending"
                  ? "等待对手应战"
                  : `第 ${duel.current_round} / ${duel.max_rounds} 回合交锋`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-0 text-xs font-medium cursor-pointer",
                "transition-[transform,background-color,box-shadow,color] duration-150 ease-[var(--ease-out-snappy)] active:scale-[0.96]",
                isCompleted
                  ? "bg-amber-500/16 text-amber-700 dark:text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.8)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-amber-500/24"
                  : "bg-zinc-100/85 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/80 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.14]"
              )}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>{isCompleted ? "翻转揭晓终局铭牌" : "翻转透视 AI 裁决"}</span>
            </button>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-6" />

          {/* 主体：正反双方对战区 */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
            {/* 正方（挑战者） */}
            <div className="flex-1 text-center">
              <div className="relative inline-block">
                <div
                  className={cn(
                    "rounded-full p-1 transition-shadow duration-300",
                    challengerWon
                      ? "bg-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.32),inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                      : "bg-sky-500/15 shadow-[0_0_20px_rgba(14,165,233,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.75)]"
                  )}
                >
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={duel.challenger?.avatar_url} />
                    <AvatarFallback className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-lg sm:text-xl font-semibold">
                      {duel.challenger?.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {challengerWon && (
                  <span className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/90 text-zinc-950 shadow-[0_4px_12px_rgba(245,158,11,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.9)]">
                    <Trophy className="h-4 w-4" />
                  </span>
                )}
              </div>

              <p className="font-semibold text-base sm:text-lg mt-2.5 text-foreground">
                {duel.challenger?.username || "学者"}
              </p>

              <div className="mt-1.5">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full border-0 bg-sky-500/12 text-sky-700 dark:text-sky-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)]">
                  正方 · {duel.challenger_position}
                </span>
              </div>

              {duel.challenger?.reputation_score !== undefined && (
                <div className="mt-2 hidden sm:flex justify-center">
                  <ReputationBadge
                    score={duel.challenger.reputation_score}
                    wins={duel.challenger.duel_wins}
                    losses={duel.challenger.duel_losses}
                    size="sm"
                    showStats
                  />
                </div>
              )}

              <CrystalLpBar
                lp={duel.challenger_lp ?? 100}
                prefersReducedMotion={prefersReducedMotion}
              />

              <p className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400 mt-3 tracking-tight">
                <SpringNumberTicker value={duel.challenger_score} />
              </p>
            </div>

            {/* 中央晶体 VS 徽记 */}
            <div className="flex flex-row sm:flex-col items-center justify-center gap-2 px-3 py-1 sm:py-0">
              <div className="hidden sm:block w-[1px] h-10 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent" />
              <div className="inline-flex flex-col items-center justify-center h-14 w-14 rounded-full border-0 bg-zinc-100/85 dark:bg-white/[0.06] backdrop-blur-xl shadow-[0_6px_20px_-4px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                <Swords className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                <span className="text-[11px] font-bold tracking-widest text-muted-foreground">
                  VS
                </span>
              </div>
              <div className="hidden sm:block w-[1px] h-10 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent" />
            </div>

            {/* 反方（应战者） */}
            <div className="flex-1 text-center">
              {duel.opponent ? (
                <>
                  <div className="relative inline-block">
                    <div
                      className={cn(
                        "rounded-full p-1 transition-shadow duration-300",
                        opponentWon
                          ? "bg-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.32),inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                          : "bg-rose-500/15 shadow-[0_0_20px_rgba(244,63,94,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.75)]"
                      )}
                    >
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                        <AvatarImage src={duel.opponent?.avatar_url} />
                        <AvatarFallback className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-lg sm:text-xl font-semibold">
                          {duel.opponent?.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {opponentWon && (
                      <span className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/90 text-zinc-950 shadow-[0_4px_12px_rgba(245,158,11,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.9)]">
                        <Trophy className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-base sm:text-lg mt-2.5 text-foreground">
                    {duel.opponent?.username || "学者"}
                  </p>

                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full border-0 bg-rose-500/12 text-rose-700 dark:text-rose-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)]">
                      反方 · {duel.opponent_position}
                    </span>
                  </div>

                  {duel.opponent?.reputation_score !== undefined && (
                    <div className="mt-2 hidden sm:flex justify-center">
                      <ReputationBadge
                        score={duel.opponent.reputation_score}
                        wins={duel.opponent.duel_wins}
                        losses={duel.opponent.duel_losses}
                        size="sm"
                        showStats
                      />
                    </div>
                  )}

                  <CrystalLpBar
                    lp={duel.opponent_lp ?? 100}
                    prefersReducedMotion={prefersReducedMotion}
                  />

                  <p className="text-3xl sm:text-4xl font-bold text-rose-600 dark:text-rose-400 mt-3 tracking-tight">
                    <SpringNumberTicker value={duel.opponent_score} />
                  </p>
                </>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center opacity-75">
                  <div className="h-20 w-20 mb-3 rounded-full border-0 bg-zinc-200/60 dark:bg-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] flex items-center justify-center">
                    <span className="text-2xl font-semibold text-muted-foreground">
                      ?
                    </span>
                  </div>
                  <p className="text-base font-medium text-muted-foreground">
                    虚位以待 · 等待对手应战
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== 背面：AI 裁判三维矩阵与胜负晶体铭牌 ==================== */}
        <div
          aria-hidden={!isFlipped}
          onMouseMove={trackPointer120fps}
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-150",
            sharedGlassSurface,
            !isFlipped
              ? prefersReducedMotion
                ? "opacity-0 pointer-events-none"
                : "pointer-events-none"
              : "opacity-100 pointer-events-auto"
          )}
          style={
            prefersReducedMotion
              ? undefined
              : {
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg) translateZ(1px)",
                }
          }
        >
          {/* 120fps 物理微光层 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: isCompleted
                ? "radial-gradient(560px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(245,158,11,0.14), transparent 65%)"
                : "radial-gradient(560px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(14,165,233,0.12), transparent 65%)",
            }}
          />

          {/* 背面顶栏 */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-0 bg-amber-500/14 text-amber-700 dark:text-amber-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI 学术裁判多维量化透视</span>
            </div>

            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-0 bg-zinc-100/85 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/80 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.14] active:scale-[0.96] transition-[transform,background-color] duration-150 ease-[var(--ease-out-snappy)] cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>返回对战正面</span>
            </button>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-5" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* 左侧 5 列：胜负铭牌 / 实时战局态势 */}
            <div className="lg:col-span-5 rounded-2xl border-0 p-4 sm:p-5 bg-zinc-100/65 dark:bg-white/[0.04] backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] text-center space-y-2.5">
              {isCompleted ? (
                <>
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/18 text-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.28),inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {duel.winner
                      ? `${duel.winner.username} 摘得桂冠`
                      : "棋逢对手 · 学术平局"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono tabular-nums">
                    终局比分 {duel.challenger_score} : {duel.opponent_score} · 共{" "}
                    {telemetry.analyzedCount} 轮有效审阅
                  </p>
                  {duel.ko_type && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border-0 bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>
                          {duel.ko_type === "fallacy_limit"
                            ? "逻辑谬误触发终局 KO"
                            : "生命值归零触发终局 KO"}
                        </span>
                      </span>
                    </div>
                  )}
                  {duel.ko_reason && (
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                      {duel.ko_reason}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/15 text-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.75)]">
                    <Brain className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    实时交锋态势研判
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    已审阅 <span className="font-mono font-semibold text-foreground">{telemetry.analyzedCount}</span> 轮交锋论点 · 当前总分{" "}
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {duel.challenger_score}
                    </span>{" "}
                    :{" "}
                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {duel.opponent_score}
                    </span>
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-1 text-[11px] font-medium">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/12 text-sky-700 dark:text-sky-300">
                      正方谬误 {telemetry.cFallacies} 次
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/12 text-rose-700 dark:text-rose-300">
                      反方谬误 {telemetry.oFallacies} 次
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 右侧 7 列：三维场均指标对撞条 */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-0.5">
                <span className="text-sky-600 dark:text-sky-400 truncate max-w-[40%]">
                  正方 · {duel.challenger?.username || "挑战者"} (场均)
                </span>
                <span className="text-rose-600 dark:text-rose-400 truncate max-w-[40%] text-right">
                  {duel.opponent?.username || "待应战"} · 反方 (场均)
                </span>
              </div>

              <DimensionCompareRow
                icon={<Brain className="h-3.5 w-3.5 text-sky-500" />}
                label="推理严密性 (满分 5)"
                leftVal={telemetry.cEvidenceAvg}
                rightVal={telemetry.oEvidenceAvg}
                maxPossible={5}
                prefersReducedMotion={prefersReducedMotion}
              />

              <DimensionCompareRow
                icon={<BookOpen className="h-3.5 w-3.5 text-indigo-500" />}
                label="文献与论据支撑 (满分 3)"
                leftVal={telemetry.cCitationAvg}
                rightVal={telemetry.oCitationAvg}
                maxPossible={3}
                prefersReducedMotion={prefersReducedMotion}
              />

              <DimensionCompareRow
                icon={<Quote className="h-3.5 w-3.5 text-violet-500" />}
                label="正面交锋回应度 (满分 2)"
                leftVal={telemetry.cLogicAvg}
                rightVal={telemetry.oLogicAvg}
                maxPossible={2}
                prefersReducedMotion={prefersReducedMotion}
              />

              {telemetry.latestAnalysis && (
                <div className="pt-1">
                  <div className="rounded-2xl border-0 p-3 bg-zinc-100/70 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Quote className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>第 {telemetry.latestRoundNumber} 回合最新 AI 审阅摘要</span>
                    </p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {telemetry.latestAnalysis}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
