"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface GlassHoverTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    align?: "center" | "right" | "left";
}

/**
 * Apple Liquid Glass 零延迟毛玻璃悬浮详情卡片
 * - 通过 Portal 挂载至 body，不受父容器 overflow-hidden 裁剪
 * - 自动检测视口左右边界防止溢出屏幕
 * - 内置全局越界与滚动自动收起守护，100% 杜绝快速划出粘连
 */
export function GlassHoverTooltip({
    content,
    children,
    className,
    disabled = false,
    align = "center",
}: GlassHoverTooltipProps) {
    const triggerRef = useRef<HTMLSpanElement>(null);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<{
        x: number;
        y: number;
        placeBelow: boolean;
    } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const closeTooltip = useCallback(() => {
        setCoords(null);
    }, []);

    // 全局防粘连守护：窗口滚动、失焦或指针离开触发器矩形时立即销毁浮层
    useEffect(() => {
        if (!coords) return;

        const handlePointerMove = (e: PointerEvent) => {
            const el = triggerRef.current;
            if (!el) {
                setCoords(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            if (
                e.clientX < rect.left - 2 ||
                e.clientX > rect.right + 2 ||
                e.clientY < rect.top - 2 ||
                e.clientY > rect.bottom + 2
            ) {
                setCoords(null);
            }
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("scroll", closeTooltip, { capture: true, passive: true });
        window.addEventListener("blur", closeTooltip);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("scroll", closeTooltip, true);
            window.removeEventListener("blur", closeTooltip);
        };
    }, [coords, closeTooltip]);

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el || typeof window === "undefined") return;
        const rect = el.getBoundingClientRect();

        let anchorX = rect.left + rect.width / 2;
        if (align === "right") {
            anchorX = rect.right;
        } else if (align === "left") {
            anchorX = rect.left;
        }

        const safeMargin = 16;
        const clampedX = Math.max(
            safeMargin,
            Math.min(window.innerWidth - safeMargin, anchorX)
        );
        const placeBelow = rect.top < 110;
        const anchorY = placeBelow ? rect.bottom + 8 : rect.top - 8;

        setCoords({ x: clampedX, y: anchorY, placeBelow });
    }, [align]);

    const handleMouseEnter = useCallback(() => {
        if (disabled || !content) return;
        updatePosition();
    }, [disabled, content, updatePosition]);

    const translateXClass =
        align === "right"
            ? "-translate-x-full"
            : align === "left"
              ? "translate-x-0"
              : "-translate-x-1/2";

    return (
        <>
            <span
                ref={triggerRef}
                onPointerEnter={handleMouseEnter}
                onPointerLeave={closeTooltip}
                onMouseLeave={closeTooltip}
                className={cn("inline-flex", className)}
            >
                {children}
            </span>

            {mounted &&
                !disabled &&
                content &&
                coords &&
                createPortal(
                    <div
                        style={{ left: coords.x, top: coords.y }}
                        className={cn(
                            "fixed z-50 pointer-events-none select-none",
                            translateXClass,
                            coords.placeBelow ? "translate-y-0" : "-translate-y-full",
                            "rounded-2xl border-0 px-3.5 py-2.5 text-xs",
                            "bg-white/94 dark:bg-zinc-900/94 text-zinc-800 dark:text-zinc-100 backdrop-blur-2xl",
                            "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.98)]",
                            "dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.55),inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
                        )}
                    >
                        {content}
                    </div>,
                    document.body
                )}
        </>
    );
}
