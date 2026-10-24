"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { DomainRadarItem } from "./analytics-utils";
import { GlassHoverTooltip } from "./GlassHoverTooltip";
import { LiquidGlassPanel } from "./LiquidGlassPanel";

interface DomainRadarCardProps {
    domains: DomainRadarItem[];
    hasDomainData: boolean;
    loading?: boolean;
    className?: string;
}

type RadarMode = "total" | "creation";

// 纯原生 SVG 极坐标几何常量（彻底告别 Recharts Tooltip 粘连与跳动问题）
const VIEW_W = 300;
const VIEW_H = 214;
const CX = 150;
const CY = 110;
const OUTER_R = 68;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];
const TOOLTIP_W = 164;

/**
 * 260ms 丝滑数值插值 Hook：仅在切换「全部 / 创作」或数据加载时平滑过渡多边形，
 * 鼠标悬浮交互时完全静止零重绘抖动
 */
function useAnimatedRadarValues(targets: number[], durationMs = 260): number[] {
    const [values, setValues] = useState<number[]>(targets);
    const currentRef = useRef<number[]>(targets);
    const rafRef = useRef<number | null>(null);
    const targetKey = targets.join(",");

    useEffect(() => {
        const from =
            currentRef.current.length === targets.length
                ? [...currentRef.current]
                : targets.map(() => 0);
        const startTime = performance.now();

        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }

        const step = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / durationMs);
            // cubic-out 缓动
            const eased = 1 - Math.pow(1 - t, 3);
            const next = targets.map((goal, idx) => {
                const startVal = from[idx] ?? 0;
                return startVal + (goal - startVal) * eased;
            });
            currentRef.current = next;
            setValues(next);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetKey, durationMs]);

    return values;
}

/**
 * 固定尺寸领域明细毛玻璃卡片
 * 所有 6 个学科保持完全一致的宽高与行数（0 值同样对齐展示），滑动切换时 0px 尺寸跳变
 */
function DomainDetailContent({
    item,
    mode,
}: {
    item: DomainRadarItem;
    mode: RadarMode;
}) {
    const sharePct =
        mode === "total" ? item.totalSharePercent : item.creationSharePercent;

    return (
        <div
            style={{ width: `${TOOLTIP_W}px` }}
            className="rounded-2xl border-0 px-3.5 py-2.5 text-xs tabular-nums bg-white/94 dark:bg-zinc-900/94 text-zinc-800 dark:text-zinc-100 backdrop-blur-2xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.98)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.55),inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.subject}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-sky-500/12 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400">
                    占比 {sharePct}%
                </span>
            </div>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/90 dark:via-zinc-700/80 to-transparent my-1.5" />

            <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-400 dark:text-zinc-500">发布帖子</span>
                    <span
                        className={cn(
                            "font-medium",
                            item.postsCount > 0
                                ? "text-zinc-700 dark:text-zinc-200"
                                : "text-zinc-400 dark:text-zinc-500"
                        )}
                    >
                        {item.postsCount} 篇
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-zinc-400 dark:text-zinc-500">参与评论</span>
                    <span
                        className={cn(
                            "font-medium",
                            item.commentsCount > 0
                                ? "text-zinc-700 dark:text-zinc-200"
                                : "text-zinc-400 dark:text-zinc-500"
                        )}
                    >
                        {item.commentsCount} 条
                    </span>
                </div>
                {mode === "total" && (
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-400 dark:text-zinc-500">点赞浏览</span>
                        <span
                            className={cn(
                                "font-medium",
                                item.likesCount > 0
                                    ? "text-zinc-700 dark:text-zinc-200"
                                    : "text-zinc-400 dark:text-zinc-500"
                            )}
                        >
                            {item.likesCount} 次
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * 涉及领域雷达图（纯原生 SVG 同心圆极坐标 + 120fps 零跳动跟随浮层 + 多重防粘连保护）
 */
export function DomainRadarCard({
    domains,
    hasDomainData,
    loading = false,
    className,
}: DomainRadarCardProps) {
    const [mode, setMode] = useState<RadarMode>("total");
    const [mounted, setMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const chartBoxRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const activeIndexRef = useRef<number | null>(null);
    const lastPosRef = useRef<{ left: number; top: number }>({ left: -9999, top: -9999 });

    useEffect(() => {
        setMounted(true);
    }, []);

    const clearHover = useCallback(() => {
        if (activeIndexRef.current !== null) {
            activeIndexRef.current = null;
            setActiveIndex(null);
        }
    }, []);

    // 全局防粘连守护：一旦激活浮层，监听窗口滚动、失焦以及指针越界，确保 100% 离开即消失
    useEffect(() => {
        if (activeIndex === null) return;

        const handleWindowPointerMove = (e: PointerEvent) => {
            const box = chartBoxRef.current;
            if (!box) {
                clearHover();
                return;
            }
            const rect = box.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                clearHover();
            }
        };

        const handleDismiss = () => clearHover();

        window.addEventListener("pointermove", handleWindowPointerMove, { passive: true });
        window.addEventListener("scroll", handleDismiss, { capture: true, passive: true });
        window.addEventListener("blur", handleDismiss);

        return () => {
            window.removeEventListener("pointermove", handleWindowPointerMove);
            window.removeEventListener("scroll", handleDismiss, true);
            window.removeEventListener("blur", handleDismiss);
        };
    }, [activeIndex, clearHover]);

    const axisCount = domains.length || 6;

    // 预计算 6 个轴向的角度、外圈端点、文字坐标与文字热区矩形
    const axesMeta = useMemo(() => {
        return domains.map((item, idx) => {
            const angleDeg = -90 + (idx * 360) / axisCount;
            const angleRad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            const outerX = CX + OUTER_R * cos;
            const outerY = CY + OUTER_R * sin;

            let textAnchor: "middle" | "start" | "end" = "middle";
            let labelX = CX + (OUTER_R + 15) * cos;
            let labelY = CY + (OUTER_R + 15) * sin;

            if (Math.abs(cos) > 0.25) {
                textAnchor = cos > 0 ? "start" : "end";
                labelX = CX + (OUTER_R + 11) * cos;
                labelY = CY + (OUTER_R + 11) * sin;
            } else {
                labelY = sin < 0 ? CY - OUTER_R - 15 : CY + OUTER_R + 16;
            }

            // 估算文字在 SVG 坐标系下的点击/悬浮热区
            const estWidth = Math.max(34, item.subject.length * 12 + 12);
            const estHeight = 22;
            const boxMinX =
                textAnchor === "start"
                    ? labelX - 4
                    : textAnchor === "end"
                      ? labelX - estWidth + 4
                      : labelX - estWidth / 2;
            const boxMaxX = boxMinX + estWidth;
            const boxMinY = labelY - estHeight / 2;
            const boxMaxY = labelY + estHeight / 2;

            return {
                item,
                idx,
                cos,
                sin,
                outerX,
                outerY,
                labelX,
                labelY,
                textAnchor,
                boxMinX,
                boxMaxX,
                boxMinY,
                boxMaxY,
            };
        });
    }, [domains, axisCount]);

    const targetScores = useMemo(
        () => domains.map((d) => (mode === "total" ? d.total : d.creation)),
        [domains, mode]
    );
    const animatedScores = useAnimatedRadarValues(targetScores, 240);

    const vertices = useMemo(() => {
        return axesMeta.map((ax, i) => {
            const score = Math.max(0, Math.min(100, animatedScores[i] ?? 0));
            const r = (score / 100) * OUTER_R;
            return {
                x: CX + r * ax.cos,
                y: CY + r * ax.sin,
                score,
            };
        });
    }, [axesMeta, animatedScores]);

    const polygonPoints = useMemo(
        () => vertices.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(" "),
        [vertices]
    );

    // 120fps 纯连续坐标计算（同一次悬浮内绝不发生上下/左右跳变翻转）
    const updateTooltipPosition = useCallback(
        (clientX: number, clientY: number) => {
            const box = chartBoxRef.current;
            if (!box || typeof window === "undefined") return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const chartRect = box.getBoundingClientRect();
            const estTipH = mode === "total" ? 104 : 84;

            let left: number;
            let top: number;

            // 当右侧吸顶栏滚动到接近视口最顶部时，平滑悬浮在光标左侧，避免顶边溢出且无上下翻转
            if (chartRect.top < estTipH + 24 && chartRect.left > TOOLTIP_W + 24) {
                left = clientX - TOOLTIP_W - 16;
                top = Math.max(12, Math.min(vh - estTipH - 12, clientY - estTipH / 2));
            } else if (chartRect.top < estTipH + 24) {
                // 窄屏且贴近视口最顶部时置于光标下方
                left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, clientX - TOOLTIP_W / 2));
                top = Math.min(vh - estTipH - 12, clientY + 18);
            } else {
                // 常规状态：恒定居中悬浮于光标正上方 14px，随鼠标 1:1 丝滑平移
                left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, clientX - TOOLTIP_W / 2));
                top = Math.max(12, clientY - estTipH - 14);
            }

            lastPosRef.current = { left, top };
            if (tooltipRef.current) {
                tooltipRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
            }
        },
        [mode]
    );

    const handleSvgPointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!domains.length || loading) return;
            const svg = svgRef.current;
            if (!svg) return;

            const ctm = svg.getScreenCTM();
            if (!ctm || ctm.a === 0 || ctm.d === 0) return;

            const svgX = (e.clientX - ctm.e) / ctm.a;
            const svgY = (e.clientY - ctm.f) / ctm.d;

            // 1. 优先命中外圈学科文字热区
            let nextIdx: number | null = null;
            for (const ax of axesMeta) {
                if (
                    svgX >= ax.boxMinX &&
                    svgX <= ax.boxMaxX &&
                    svgY >= ax.boxMinY &&
                    svgY <= ax.boxMaxY
                ) {
                    nextIdx = ax.idx;
                    break;
                }
            }

            // 2. 极坐标圆盘扇区命中（设置中心 13px 迟滞死区消除圆心奇点乱跳，外圈以外立即收起）
            if (nextIdx === null) {
                const dx = svgX - CX;
                const dy = svgY - CY;
                const dist = Math.hypot(dx, dy);

                if (dist > OUTER_R + 20) {
                    clearHover();
                    return;
                }

                if (dist < 13) {
                    // 穿过圆心瞬间保持当前扇区不闪烁、不乱跳
                    nextIdx = activeIndexRef.current;
                } else {
                    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
                    const clockwiseFromTop = (((deg + 90) % 360) + 360) % 360;
                    const step = 360 / axisCount;
                    nextIdx =
                        Math.floor(((clockwiseFromTop + step / 2) % 360) / step) %
                        axisCount;
                }
            }

            if (nextIdx === null) {
                clearHover();
                return;
            }

            updateTooltipPosition(e.clientX, e.clientY);

            if (activeIndexRef.current !== nextIdx) {
                activeIndexRef.current = nextIdx;
                setActiveIndex(nextIdx);
            }
        },
        [domains.length, loading, axesMeta, axisCount, clearHover, updateTooltipPosition]
    );

    const activeDomain =
        activeIndex !== null && domains[activeIndex] ? domains[activeIndex] : null;
    const activeAxis =
        activeIndex !== null && axesMeta[activeIndex] ? axesMeta[activeIndex] : null;
    const activeVertex =
        activeIndex !== null && vertices[activeIndex] ? vertices[activeIndex] : null;

    return (
        <LiquidGlassPanel
            onMouseLeave={clearHover}
            className={cn("p-4 sm:p-5", className)}
        >
            {/* 顶栏 + 零跳动双态水滴胶囊 */}
            <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    涉及领域
                </h2>

                <GlassHoverTooltip
                    align="right"
                    content={
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-0.5 whitespace-nowrap">
                            <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    全部
                                </span>
                                ：综合发帖、评论与点赞浏览
                            </div>
                            <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    创作
                                </span>
                                ：仅统计发帖与评论产出
                            </div>
                        </div>
                    }
                >
                    <div
                        className={cn(
                            "inline-flex items-center p-0.5 rounded-full border-0 select-none",
                            "bg-zinc-200/55 dark:bg-zinc-800/70",
                            "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                        )}
                    >
                        {(["total", "creation"] as const).map((key) => {
                            const active = mode === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setMode(key)}
                                    className={cn(
                                        "px-2.5 h-5 rounded-full text-[11px] font-medium transition-all cursor-pointer border-0 outline-none focus:outline-none focus-visible:outline-none",
                                        active
                                            ? "bg-white dark:bg-zinc-700/90 text-zinc-900 dark:text-zinc-100 shadow-[0_1px_4px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
                                            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                    )}
                                >
                                    {key === "total" ? "全部" : "创作"}
                                </button>
                            );
                        })}
                    </div>
                </GlassHoverTooltip>
            </div>

            {/* 纯原生无边框 SVG 极坐标画布 */}
            <div
                ref={chartBoxRef}
                onPointerLeave={clearHover}
                onMouseLeave={clearHover}
                className="relative h-[214px] w-full select-none outline-none"
            >
                {loading || !mounted ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-zinc-200/45 dark:bg-zinc-800/50 animate-pulse" />
                    </div>
                ) : (
                    <>
                        <svg
                            ref={svgRef}
                            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                            onPointerMove={handleSvgPointerMove}
                            onPointerLeave={clearHover}
                            onMouseLeave={clearHover}
                            className="w-full h-full select-none outline-none cursor-default"
                        >
                            <defs>
                                <radialGradient id="scholarDomainAura" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.14} />
                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.34} />
                                </radialGradient>
                            </defs>

                            {/* 4 层同心圆极坐标环 */}
                            {GRID_LEVELS.map((lv) => (
                                <circle
                                    key={lv}
                                    cx={CX}
                                    cy={CY}
                                    r={OUTER_R * lv}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1}
                                    className="text-zinc-200/90 dark:text-zinc-800/90 pointer-events-none"
                                />
                            ))}

                            {/* 6 条基础辐射轴线 */}
                            {axesMeta.map((ax) => (
                                <line
                                    key={ax.idx}
                                    x1={CX}
                                    y1={CY}
                                    x2={ax.outerX}
                                    y2={ax.outerY}
                                    stroke="currentColor"
                                    strokeWidth={1}
                                    className="text-zinc-200/90 dark:text-zinc-800/90 pointer-events-none"
                                />
                            ))}

                            {/* 当前悬浮学科轴向微光指示线 */}
                            {activeAxis && (
                                <line
                                    x1={CX}
                                    y1={CY}
                                    x2={activeAxis.outerX}
                                    y2={activeAxis.outerY}
                                    stroke="rgba(14, 165, 233, 0.5)"
                                    strokeWidth={1.5}
                                    strokeDasharray="2.5 2.5"
                                    className="pointer-events-none"
                                />
                            )}

                            {/* 领域覆盖多边形 */}
                            {vertices.length > 0 && (
                                <polygon
                                    points={polygonPoints}
                                    fill="url(#scholarDomainAura)"
                                    stroke="#0ea5e9"
                                    strokeWidth={1.75}
                                    strokeLinejoin="round"
                                    className="pointer-events-none"
                                />
                            )}

                            {/* 常态数据顶点 */}
                            {hasDomainData &&
                                vertices.map((v, idx) => (
                                    <circle
                                        key={idx}
                                        cx={v.x}
                                        cy={v.y}
                                        r={3}
                                        fill="#0ea5e9"
                                        className="pointer-events-none"
                                    />
                                ))}

                            {/* 当前激活顶点高光环 */}
                            {activeVertex && (
                                <g className="pointer-events-none">
                                    <circle
                                        cx={activeVertex.x}
                                        cy={activeVertex.y}
                                        r={8}
                                        fill="rgba(14, 165, 233, 0.16)"
                                    />
                                    <circle
                                        cx={activeVertex.x}
                                        cy={activeVertex.y}
                                        r={4.25}
                                        fill="#0284c7"
                                        stroke="#ffffff"
                                        strokeWidth={1.5}
                                    />
                                </g>
                            )}

                            {/* 外圈 6 大学科文字刻度（字重锁死 500，绝对零布局跳动） */}
                            {axesMeta.map((ax) => {
                                const isActive = activeIndex === ax.idx;
                                return (
                                    <text
                                        key={ax.idx}
                                        x={ax.labelX}
                                        y={ax.labelY}
                                        dominantBaseline="central"
                                        textAnchor={ax.textAnchor}
                                        fontSize={11.5}
                                        fontWeight={500}
                                        fill="currentColor"
                                        className={cn(
                                            "transition-colors duration-150 pointer-events-none",
                                            isActive
                                                ? "text-sky-600 dark:text-sky-400"
                                                : "text-zinc-600 dark:text-zinc-400"
                                        )}
                                    >
                                        {ax.item.subject}
                                    </text>
                                );
                            })}
                        </svg>

                        {!hasDomainData && activeDomain === null && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/80 dark:bg-zinc-900/80 text-zinc-400 dark:text-zinc-500 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                    暂无记录
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 单一实例 Portal 液态毛玻璃浮层（pointer-events-none 彻底杜绝遮挡与粘连） */}
            {mounted &&
                activeDomain &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        style={{
                            transform: `translate3d(${lastPosRef.current.left}px, ${lastPosRef.current.top}px, 0)`,
                        }}
                        className="fixed left-0 top-0 z-50 pointer-events-none select-none will-change-transform"
                    >
                        <DomainDetailContent item={activeDomain} mode={mode} />
                    </div>,
                    document.body
                )}
        </LiquidGlassPanel>
    );
}
