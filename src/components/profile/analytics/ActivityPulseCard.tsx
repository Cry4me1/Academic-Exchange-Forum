"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, Flame, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassHoverTooltip } from "./GlassHoverTooltip";
import { LiquidGlassPanel } from "./LiquidGlassPanel";

interface ActivityPulseCardProps {
    currentStreak: number;
    longestStreak: number;
    longestRangeLabel: string | null;
    activeDays: number;
    hourlyCounts: number[];
    totalHourlyEvents: number;
    peakPeriodLabel: string | null;
    personaLabel: string | null;
    peakSharePercent: number;
    isNightPeak: boolean;
    loading?: boolean;
    className?: string;
}

/**
 * 活跃画像卡片（顶栏画像胶囊 + 连续活跃 + 24h 起伏微光节律柱状谱，全元素支持悬浮详情）
 */
export function ActivityPulseCard({
    currentStreak,
    longestStreak,
    longestRangeLabel,
    activeDays,
    hourlyCounts,
    totalHourlyEvents,
    peakPeriodLabel,
    personaLabel,
    peakSharePercent,
    isNightPeak,
    loading = false,
    className,
}: ActivityPulseCardProps) {
    const barsRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [hoverHour, setHoverHour] = useState<{
        hour: number;
        count: number;
        percent: number;
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 全局防粘连守护：页面滚动、失焦或鼠标快速划出柱状谱区域时立即收起
    useEffect(() => {
        if (!hoverHour) return;

        const handlePointerMove = (e: PointerEvent) => {
            const el = barsRef.current;
            if (!el) {
                setHoverHour(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            if (
                e.clientX < rect.left - 2 ||
                e.clientX > rect.right + 2 ||
                e.clientY < rect.top - 2 ||
                e.clientY > rect.bottom + 2
            ) {
                setHoverHour(null);
            }
        };

        const handleDismiss = () => setHoverHour(null);

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("scroll", handleDismiss, { capture: true, passive: true });
        window.addEventListener("blur", handleDismiss);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("scroll", handleDismiss, true);
            window.removeEventListener("blur", handleDismiss);
        };
    }, [hoverHour]);

    const maxHourVal = useMemo(() => {
        if (!hourlyCounts || hourlyCounts.length === 0) return 1;
        return Math.max(1, ...hourlyCounts);
    }, [hourlyCounts]);

    return (
        <LiquidGlassPanel className={cn("p-4 sm:p-5 space-y-3.5", className)}>
            {/* 统一顶栏：标题「活跃画像」 + 画像特征胶囊（悬浮显示依据） */}
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    活跃画像
                </h2>

                {loading ? (
                    <span className="h-5 w-16 rounded-full bg-zinc-200/50 dark:bg-zinc-800/60 animate-pulse" />
                ) : personaLabel ? (
                    <GlassHoverTooltip
                        align="right"
                        content={
                            <div className="space-y-1 tabular-nums whitespace-nowrap">
                                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {personaLabel}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    常活跃于 {peakPeriodLabel}（集中了 {peakSharePercent}% 的互动）
                                </div>
                            </div>
                        }
                    >
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 h-5 px-2.5 rounded-full border-0 text-[11px] font-medium cursor-default select-none",
                                isNightPeak
                                    ? "bg-indigo-500/12 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                                    : "bg-sky-500/12 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                            )}
                        >
                            {isNightPeak ? (
                                <Moon className="h-3 w-3 shrink-0" />
                            ) : (
                                <Sun className="h-3 w-3 shrink-0" />
                            )}
                            <span>{personaLabel}</span>
                        </span>
                    </GlassHoverTooltip>
                ) : (
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                        暂无画像
                    </span>
                )}
            </div>

            {/* 模块 1：连续活跃内嵌微晶舱（悬浮显示完整历史连续区间与累计活跃天数） */}
            <GlassHoverTooltip
                disabled={loading}
                className="w-full block"
                content={
                    <div className="min-w-[168px] space-y-1.5 tabular-nums">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            连续活跃详情
                        </div>
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/90 dark:via-zinc-700/80 to-transparent" />
                        <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-400 dark:text-zinc-500">当前连续</span>
                                <span className="font-medium">{currentStreak} 天</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-400 dark:text-zinc-500">历史最长</span>
                                <span className="font-medium">
                                    {longestStreak} 天
                                    {longestRangeLabel ? `（${longestRangeLabel}）` : ""}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-zinc-400 dark:text-zinc-500">近一年活跃</span>
                                <span className="font-medium">共 {activeDays} 天</span>
                            </div>
                        </div>
                    </div>
                }
            >
                <div
                    className={cn(
                        "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border-0 transition-colors cursor-default",
                        "bg-zinc-500/[0.04] hover:bg-zinc-500/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
                        "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                    )}
                >
                    <div className="inline-flex items-center gap-2.5 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full border-0 bg-amber-500/14 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                            <Flame className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            连续活跃
                        </span>
                    </div>

                    {loading ? (
                        <span className="h-4 w-20 rounded-full bg-zinc-200/50 dark:bg-zinc-800/60 animate-pulse" />
                    ) : (
                        <div className="flex items-center gap-2 shrink-0 tabular-nums">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {currentStreak} 天
                            </span>
                            {longestStreak > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                    最长 {longestStreak} 天
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </GlassHoverTooltip>

            {/* 模块 2：24 小时活跃分布内嵌微晶舱（高低起伏液态柱状谱，逐根悬浮显详情） */}
            <div
                className={cn(
                    "px-3.5 py-3 rounded-2xl border-0 space-y-2.5",
                    "bg-zinc-500/[0.04] dark:bg-white/[0.03]",
                    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2.5 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full border-0 bg-sky-500/14 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
                            <Clock className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            活跃时段
                        </span>
                    </div>

                    {loading ? (
                        <span className="h-4 w-20 rounded-full bg-zinc-200/50 dark:bg-zinc-800/60 animate-pulse" />
                    ) : (
                        <span className="text-xs font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                            {peakPeriodLabel || "暂无记录"}
                        </span>
                    )}
                </div>

                {/* 24 小时起伏柱状谱 */}
                <div className="space-y-1.5 pt-1 select-none">
                    <div
                        ref={barsRef}
                        className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px] items-end h-9 px-0.5"
                        onPointerLeave={() => setHoverHour(null)}
                        onMouseLeave={() => setHoverHour(null)}
                    >
                        {Array.from({ length: 24 }).map((_, hr) => {
                            const val = hourlyCounts?.[hr] || 0;
                            const ratio = val > 0 ? val / maxHourVal : 0;
                            const heightPx = loading
                                ? 12
                                : val > 0
                                  ? Math.round(8 + ratio * 26)
                                  : 5;

                            let barColor = "bg-zinc-200/70 dark:bg-zinc-800/80";
                            if (!loading && val > 0) {
                                if (ratio < 0.35) {
                                    barColor = "bg-sky-300/85 dark:bg-sky-800/85";
                                } else if (ratio < 0.7) {
                                    barColor = "bg-sky-400/95 dark:bg-sky-600/90";
                                } else {
                                    barColor =
                                        "bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.28)]";
                                }
                            }

                            return (
                                <div
                                    key={hr}
                                    onMouseEnter={(e) => {
                                        if (loading) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const safeX = Math.max(
                                            80,
                                            Math.min(
                                                window.innerWidth - 80,
                                                rect.left + rect.width / 2
                                            )
                                        );
                                        const pct =
                                            totalHourlyEvents > 0
                                                ? Math.round((val / totalHourlyEvents) * 100)
                                                : 0;
                                        setHoverHour({
                                            hour: hr,
                                            count: val,
                                            percent: pct,
                                            x: safeX,
                                            y: rect.top - 8,
                                        });
                                    }}
                                    className="h-full flex items-end cursor-default group/bar"
                                >
                                    <span
                                        style={{ height: `${heightPx}px` }}
                                        className={cn(
                                            "w-full rounded-full border-0 transition-all duration-200 group-hover/bar:scale-x-125 group-hover/bar:brightness-105",
                                            loading && "animate-pulse",
                                            barColor
                                        )}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500 px-0.5">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:00</span>
                    </div>
                </div>
            </div>

            {/* 24 小时逐柱零延迟液态毛玻璃悬浮明细 */}
            {mounted &&
                hoverHour &&
                createPortal(
                    <div
                        style={{ left: hoverHour.x, top: hoverHour.y }}
                        className={cn(
                            "fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none select-none",
                            "rounded-2xl border-0 px-3 py-2 text-xs tabular-nums whitespace-nowrap",
                            "bg-white/94 dark:bg-zinc-900/94 text-zinc-800 dark:text-zinc-100 backdrop-blur-2xl",
                            "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.98)]",
                            "dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.55),inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
                        )}
                    >
                        <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                            {String(hoverHour.hour).padStart(2, "0")}:00 -{" "}
                            {String((hoverHour.hour + 1) % 24).padStart(2, "0")}:00
                        </div>
                        {hoverHour.count > 0 ? (
                            <div className="mt-0.5 font-semibold text-sky-600 dark:text-sky-400">
                                {hoverHour.count} 次互动
                                <span className="ml-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                    （占全天 {hoverHour.percent}%）
                                </span>
                            </div>
                        ) : (
                            <div className="mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                该时段暂无互动
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </LiquidGlassPanel>
    );
}
