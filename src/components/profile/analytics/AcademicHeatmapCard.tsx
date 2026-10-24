"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addDays, eachDayOfInterval, format, startOfWeek, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import type { HeatmapDayDetail, YearActivityBreakdown } from "./analytics-utils";
import { GlassHoverTooltip } from "./GlassHoverTooltip";
import { LiquidGlassPanel } from "./LiquidGlassPanel";

interface AcademicHeatmapCardProps {
    heatmapMap: Record<string, HeatmapDayDetail>;
    yearBreakdown: YearActivityBreakdown;
    loading?: boolean;
    className?: string;
}

interface DayCell {
    date: Date;
    dateKey: string;
    fullDateLabel: string;
    detail: HeatmapDayDetail;
    isFuture: boolean;
}

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const LEGEND_ITEMS = [
    { sample: 0, range: "0 次互动" },
    { sample: 1, range: "1 次互动" },
    { sample: 2, range: "2 - 3 次互动" },
    { sample: 4, range: "4 - 6 次互动" },
    { sample: 7, range: "7 次及以上互动" },
];

function getLevelClass(count: number): string {
    if (count <= 0) {
        return "bg-zinc-200/55 dark:bg-zinc-800/65 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.06)]";
    }
    if (count === 1) {
        return "bg-emerald-300/75 dark:bg-emerald-900/80 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.7)]";
    }
    if (count <= 3) {
        return "bg-emerald-400/85 dark:bg-emerald-700/85 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.6)]";
    }
    if (count <= 6) {
        return "bg-emerald-500/90 dark:bg-emerald-500/85 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.5),0_0_6px_rgba(16,185,129,0.2)]";
    }
    return "bg-emerald-600 dark:bg-emerald-400 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.55),0_0_8px_rgba(16,185,129,0.3)]";
}

/**
 * 热力图面板（常态极简清晰 + 悬浮呈现每日与全年细分互动构成）
 */
export function AcademicHeatmapCard({
    heatmapMap,
    yearBreakdown,
    loading = false,
    className,
}: AcademicHeatmapCardProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [hoverDay, setHoverDay] = useState<{
        cell: DayCell;
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 全局防粘连守护：页面滚动、失焦或鼠标快速划出晶格矩阵时立即收起
    useEffect(() => {
        if (!hoverDay) return;

        const handlePointerMove = (e: PointerEvent) => {
            const el = gridRef.current;
            if (!el) {
                setHoverDay(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            if (
                e.clientX < rect.left - 2 ||
                e.clientX > rect.right + 2 ||
                e.clientY < rect.top - 2 ||
                e.clientY > rect.bottom + 2
            ) {
                setHoverDay(null);
            }
        };

        const handleDismiss = () => setHoverDay(null);

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("scroll", handleDismiss, { capture: true, passive: true });
        window.addEventListener("blur", handleDismiss);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("scroll", handleDismiss, true);
            window.removeEventListener("blur", handleDismiss);
        };
    }, [hoverDay]);

    // 构建 53 周完整周一对齐矩阵，并精确计算不跳月的月份刻度
    const { weeks, monthMarkers } = useMemo(() => {
        const today = new Date();
        const todayKey = format(today, "yyyy-MM-dd");
        const firstMonday = startOfWeek(subWeeks(today, 52), { weekStartsOn: 1 });
        const lastSunday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 6);
        const allDays = eachDayOfInterval({ start: firstMonday, end: lastSunday });

        const weekCols: DayCell[][] = [];
        for (let i = 0; i < allDays.length; i += 7) {
            const slice = allDays.slice(i, i + 7).map((d) => {
                const dateKey = format(d, "yyyy-MM-dd");
                const detail = heatmapMap[dateKey] || {
                    count: 0,
                    posts: 0,
                    comments: 0,
                    others: 0,
                };
                return {
                    date: d,
                    dateKey,
                    fullDateLabel: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAY_NAMES[d.getDay()]}`,
                    detail,
                    isFuture: dateKey > todayKey,
                };
            });
            weekCols.push(slice);
        }

        // 先收集所有自然月切换列，若首列残月宽度不足 3 列则移除首列残月以保留下一个完整月
        const rawMarkers: Array<{ colIndex: number; text: string }> = [];
        let prevMonth = -1;

        weekCols.forEach((col, colIdx) => {
            const anchorDay = col.find((c) => !c.isFuture && c.date.getDate() === 1) || col[0];
            const m = anchorDay.date.getMonth();
            if (m !== prevMonth) {
                rawMarkers.push({ colIndex: colIdx, text: `${m + 1}月` });
                prevMonth = m;
            }
        });

        if (rawMarkers.length >= 2 && rawMarkers[1].colIndex - rawMarkers[0].colIndex < 3) {
            rawMarkers.shift();
        }

        const filteredMarkers: Array<{ colIndex: number; text: string }> = [];
        for (const mk of rawMarkers) {
            const last = filteredMarkers[filteredMarkers.length - 1];
            if (!last || mk.colIndex - last.colIndex >= 3) {
                filteredMarkers.push(mk);
            }
        }

        return { weeks: weekCols, monthMarkers: filteredMarkers };
    }, [heatmapMap]);

    // 窄屏下自动对齐至最右侧（最近月份）
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el && el.scrollWidth > el.clientWidth) {
            el.scrollLeft = el.scrollWidth;
        }
    }, [weeks.length, loading]);

    return (
        <LiquidGlassPanel className={cn("p-4 sm:p-5", className)}>
            {/* 顶栏：左侧极简标题 + 右侧带悬浮构成详情的汇总胶囊 */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    热力图
                </h2>

                {loading ? (
                    <span className="text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                        ···
                    </span>
                ) : (
                    <GlassHoverTooltip
                        align="right"
                        content={
                            <div className="min-w-[156px] space-y-1.5 tabular-nums">
                                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    近一年活跃构成
                                </div>
                                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/90 dark:via-zinc-700/80 to-transparent" />
                                <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-zinc-400 dark:text-zinc-500">发布帖子</span>
                                        <span className="font-medium">{yearBreakdown.posts} 篇</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-zinc-400 dark:text-zinc-500">发表评论</span>
                                        <span className="font-medium">{yearBreakdown.comments} 条</span>
                                    </div>
                                    {yearBreakdown.others > 0 && (
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-zinc-400 dark:text-zinc-500">评审与对决</span>
                                            <span className="font-medium">{yearBreakdown.others} 次</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-4 pt-0.5 text-emerald-600 dark:text-emerald-400">
                                        <span>活跃天数</span>
                                        <span className="font-semibold">共 {yearBreakdown.activeDays} 天</span>
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <span className="text-xs font-medium tabular-nums text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-default">
                            近一年 {yearBreakdown.total} 次互动
                        </span>
                    </GlassHoverTooltip>
                )}
            </div>

            {/* 53 周液态微晶网格 */}
            <div
                ref={scrollContainerRef}
                onScroll={() => setHoverDay(null)}
                className="overflow-x-auto pb-1 scrollbar-none"
            >
                <div className="inline-flex items-end gap-2 min-w-max">
                    {/* 左侧星期刻度 */}
                    <div className="grid grid-rows-7 gap-[2.5px] text-[10px] leading-[9.5px] text-zinc-400 dark:text-zinc-500 select-none pr-0.5">
                        <span className="h-[9.5px] flex items-center">一</span>
                        <span className="h-[9.5px]" />
                        <span className="h-[9.5px] flex items-center">三</span>
                        <span className="h-[9.5px]" />
                        <span className="h-[9.5px] flex items-center">五</span>
                        <span className="h-[9.5px]" />
                        <span className="h-[9.5px]" />
                    </div>

                    {/* 主列区域（顶部月份行 + 53 列晶格） */}
                    <div className="flex flex-col">
                        {/* 月份刻度行 */}
                        <div className="relative h-4 mb-1 select-none">
                            {monthMarkers.map((mk) => (
                                <span
                                    key={`${mk.colIndex}-${mk.text}`}
                                    style={{ left: `${mk.colIndex * 12}px` }}
                                    className="absolute top-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap"
                                >
                                    {mk.text}
                                </span>
                            ))}
                        </div>

                        {/* 晶格矩阵 */}
                        <div
                            ref={gridRef}
                            className="flex gap-[2.5px]"
                            onPointerLeave={() => setHoverDay(null)}
                            onMouseLeave={() => setHoverDay(null)}
                        >
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex flex-col gap-[2.5px]">
                                    {week.map((cell) => {
                                        if (cell.isFuture) {
                                            return (
                                                <div
                                                    key={cell.dateKey}
                                                    className="w-[9.5px] h-[9.5px] rounded-[2.5px] opacity-0 pointer-events-none"
                                                />
                                            );
                                        }

                                        return (
                                            <div
                                                key={cell.dateKey}
                                                onMouseEnter={(e) => {
                                                    if (loading) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const safeX = Math.max(
                                                        90,
                                                        Math.min(
                                                            window.innerWidth - 90,
                                                            rect.left + rect.width / 2
                                                        )
                                                    );
                                                    setHoverDay({
                                                        cell,
                                                        x: safeX,
                                                        y: rect.top - 8,
                                                    });
                                                }}
                                                className={cn(
                                                    "w-[9.5px] h-[9.5px] rounded-[2.5px] border-0 transition-transform duration-150",
                                                    loading
                                                        ? "bg-zinc-200/45 dark:bg-zinc-800/50 animate-pulse"
                                                        : cn("hover:scale-130 cursor-default", getLevelClass(cell.detail.count))
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 底栏图例（每个色阶方块悬浮可查看代表区间） */}
            <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 select-none">
                <span>少</span>
                <div className="flex items-center gap-[3px]">
                    {LEGEND_ITEMS.map((item) => (
                        <GlassHoverTooltip
                            key={item.sample}
                            content={
                                <span className="text-[11px] font-medium whitespace-nowrap tabular-nums">
                                    {item.range}
                                </span>
                            }
                        >
                            <span
                                className={cn(
                                    "w-2.5 h-2.5 rounded-[2.5px] border-0 transition-transform hover:scale-125",
                                    getLevelClass(item.sample)
                                )}
                            />
                        </GlassHoverTooltip>
                    ))}
                </div>
                <span>多</span>
            </div>

            {/* 单实例液态毛玻璃日期悬浮明细卡片 */}
            {mounted &&
                hoverDay &&
                createPortal(
                    <div
                        style={{ left: hoverDay.x, top: hoverDay.y }}
                        className={cn(
                            "fixed z-50 -translate-x-1/2 -translate-y-full pointer-events-none select-none",
                            "rounded-2xl border-0 px-3 py-2 text-xs tabular-nums whitespace-nowrap",
                            "bg-white/94 dark:bg-zinc-900/94 text-zinc-800 dark:text-zinc-100 backdrop-blur-2xl",
                            "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.98)]",
                            "dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.55),inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
                        )}
                    >
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                            {hoverDay.cell.fullDateLabel}
                        </div>
                        {hoverDay.cell.detail.count > 0 ? (
                            <div className="mt-0.5 flex items-center gap-2">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {hoverDay.cell.detail.count} 次互动
                                </span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {[
                                        hoverDay.cell.detail.posts > 0
                                            ? `发帖 ${hoverDay.cell.detail.posts}`
                                            : null,
                                        hoverDay.cell.detail.comments > 0
                                            ? `评论 ${hoverDay.cell.detail.comments}`
                                            : null,
                                        hoverDay.cell.detail.others > 0
                                            ? `评审/对决 ${hoverDay.cell.detail.others}`
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </span>
                            </div>
                        ) : (
                            <div className="mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                当日无互动记录
                            </div>
                        )}
                    </div>,
                    document.body
                )}
        </LiquidGlassPanel>
    );
}
