"use client";

import React, { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    spotlightRadius?: number;
}

/**
 * Apple Liquid Glass 标准无边框光学面板
 * - 零硬边框 (border-0) + 大曲率圆角 (rounded-3xl)
 * - 三层物理光学 (高斯磨砂 + 菲涅尔顶内高光 + 环境漫射柔阴影)
 * - 120fps DOM 原生 CSS 变量光随鼠动纯白漫反射
 */
export function LiquidGlassPanel({
    children,
    className,
    spotlightRadius = 220,
    onMouseMove,
    onMouseLeave,
    ...props
}: LiquidGlassPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const el = panelRef.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                el.style.setProperty("--spotlight-opacity", "1");
            }
            onMouseMove?.(e);
        },
        [onMouseMove]
    );

    const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const el = panelRef.current;
            if (el) {
                el.style.setProperty("--spotlight-opacity", "0");
            }
            onMouseLeave?.(e);
        },
        [onMouseLeave]
    );

    return (
        <div
            ref={panelRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative overflow-hidden rounded-3xl border-0",
                "bg-white/75 dark:bg-zinc-900/60 backdrop-blur-2xl",
                "shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_40px_-8px_rgba(0,0,0,0.06)]",
                "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_12px_40px_-8px_rgba(0,0,0,0.4)]",
                className
            )}
            {...props}
        >
            {/* 120fps 纯物理无色环境白光漫反射层 */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 dark:opacity-20"
                style={{
                    opacity: "var(--spotlight-opacity, 0)",
                    background: `radial-gradient(${spotlightRadius}px circle at var(--mouse-x, -200px) var(--mouse-y, -200px), rgba(255,255,255,0.5), transparent 80%)`,
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
