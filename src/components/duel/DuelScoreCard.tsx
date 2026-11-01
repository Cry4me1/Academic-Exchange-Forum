"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    BookOpen,
    Quote,
    Brain,
    AlertTriangle,
    Star,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTION_EASINGS, MOTION_SPRINGS } from "@/lib/motion-tokens";

interface DuelScoreCardProps {
    evidenceScore: number;
    citationScore: number;
    logicScore: number;
    fallacyPenalty: number;
    totalScore: number;
    hasFallacy: boolean;
    fallacyType?: string;
    analysis?: string;
}

export function DuelScoreCard({
    evidenceScore,
    citationScore,
    logicScore,
    fallacyPenalty,
    totalScore,
    hasFallacy,
    fallacyType,
    analysis,
}: DuelScoreCardProps) {
    const prefersReducedMotion = useReducedMotion();
    const isPositive = totalScore > 0;
    const isNegative = totalScore < 0;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                        transition={MOTION_SPRINGS.hapticTap}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-0 cursor-help select-none backdrop-blur-xl transition-[background-color,box-shadow,color] duration-150 ease-[var(--ease-out-snappy)] font-mono tabular-nums",
                            "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]",
                            isPositive &&
                                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[0_2px_12px_rgba(16,185,129,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                            isNegative &&
                                "bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-[0_2px_12px_rgba(244,63,94,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                            !isPositive && !isNegative &&
                                "bg-zinc-200/50 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300",
                            hasFallacy && "shadow-[0_0_0_1.5px_rgba(244,63,94,0.35)]"
                        )}
                    >
                        {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                        {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
                        {hasFallacy && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                        <span className="font-bold text-sm tracking-tight">
                            {totalScore > 0 ? `+${totalScore}` : totalScore}
                        </span>
                    </motion.div>
                </TooltipTrigger>

                <TooltipContent
                    side="left"
                    sideOffset={8}
                    className="w-[260px] p-0 rounded-3xl border-0 overflow-hidden bg-white/92 dark:bg-zinc-900/92 backdrop-blur-2xl text-foreground shadow-[0_20px_50px_-8px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_20px_50px_-8px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                >
                    <div className="p-3.5 space-y-3">
                        {/* 顶部标题与总分胶囊 */}
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                                AI 裁判评分
                            </h4>
                            <span
                                className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono tabular-nums border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
                                    isPositive && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                                    isNegative && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
                                    !isPositive && !isNegative && "bg-zinc-200/60 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300"
                                )}
                            >
                                总分: {totalScore > 0 ? `+${totalScore}` : totalScore}
                            </span>
                        </div>

                        {/* 评分维度条目 */}
                        <div className="space-y-2">
                            <ScoreRow
                                icon={<Brain className="h-3.5 w-3.5 text-sky-500" />}
                                label="推理质量"
                                score={evidenceScore}
                                max={5}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                            <ScoreRow
                                icon={<BookOpen className="h-3.5 w-3.5 text-indigo-500" />}
                                label="论据支撑"
                                score={citationScore}
                                max={3}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                            <ScoreRow
                                icon={<Quote className="h-3.5 w-3.5 text-purple-500" />}
                                label="对话互动"
                                score={logicScore}
                                max={2}
                                prefersReducedMotion={prefersReducedMotion}
                            />
                        </div>

                        {/* 逻辑谬误惩罚 */}
                        {hasFallacy && (
                            <div className="p-2.5 rounded-2xl border-0 bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] space-y-1">
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        <span>触发逻辑谬误</span>
                                    </div>
                                    <span className="font-mono tabular-nums text-xs font-bold text-rose-600 dark:text-rose-400">
                                        {fallacyPenalty}
                                    </span>
                                </div>
                                {fallacyType && (
                                    <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80 leading-snug">
                                        {fallacyType}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 渐变消融内部微光缝 */}
                        {analysis && (
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                        )}

                        {/* AI 裁判点评分析 */}
                        {analysis && (
                            <div className="p-3 rounded-2xl bg-zinc-200/40 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80 select-none">
                                    <Quote className="h-3 w-3 text-amber-500/80 shrink-0" />
                                    <span>裁判评语</span>
                                </div>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed text-left break-words tracking-normal">
                                    {analysis}
                                </p>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// 评分行组件（使用 GPU scaleX 替代 width 布局重排动画）
function ScoreRow({
    icon,
    label,
    score,
    max,
    prefersReducedMotion,
}: {
    icon: React.ReactNode;
    label: string;
    score: number;
    max: number;
    prefersReducedMotion: boolean | null;
}) {
    const percentage = Math.min(Math.max((score / max) * 100, 0), 100);
    const ratio = percentage / 100;

    return (
        <div className="flex items-center gap-2.5 text-xs">
            <span className="shrink-0">{icon}</span>
            <span className="text-foreground font-medium flex-1 text-xs">{label}</span>
            <div className="w-24 h-2 bg-zinc-200/60 dark:bg-white/[0.08] rounded-full overflow-hidden shadow-[inset_0_1px_0.5px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(0,0,0,0.3)]">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: ratio }}
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : { duration: 0.35, ease: MOTION_EASINGS.snappy }
                    }
                    className={cn(
                        "h-full w-full rounded-full origin-left will-change-transform transition-colors duration-200",
                        percentage >= 75 && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                        percentage >= 50 && percentage < 75 && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
                        percentage < 50 && "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    )}
                />
            </div>
            <div className="font-mono tabular-nums text-xs text-right shrink-0 min-w-10 select-none">
                <span className="font-bold text-foreground">
                    {score > 0 ? `+${score}` : score}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                    /{max}
                </span>
            </div>
        </div>
    );
}
