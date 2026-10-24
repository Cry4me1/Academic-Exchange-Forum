"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatExactDateTime, formatLastSeenShort } from "./analytics-utils";
import { GlassHoverTooltip } from "./GlassHoverTooltip";

interface OnlineStatusPillProps {
    isOnline: boolean;
    lastSeenAt: string | null;
    showOnlineStatus?: boolean;
    isOwnProfile?: boolean;
    className?: string;
}

/**
 * 极简在线 / 上次在线水滴胶囊（悬浮显示精确时间详情）
 */
export function OnlineStatusPill({
    isOnline,
    lastSeenAt,
    showOnlineStatus = true,
    isOwnProfile = false,
    className,
}: OnlineStatusPillProps) {
    if (!showOnlineStatus && !isOwnProfile) {
        return null;
    }

    if (isOnline) {
        return (
            <GlassHoverTooltip
                content={
                    <div className="flex items-center gap-1.5 whitespace-nowrap font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>当前实时在线</span>
                        {!showOnlineStatus && isOwnProfile && (
                            <span className="text-zinc-400 dark:text-zinc-500">（仅自己可见）</span>
                        )}
                    </div>
                }
            >
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 h-5 px-2.5 rounded-full border-0 select-none shrink-0 cursor-default",
                        "text-[11px] font-medium tabular-nums",
                        "bg-emerald-500/12 dark:bg-emerald-500/18 text-emerald-700 dark:text-emerald-300",
                        "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_0_10px_rgba(16,185,129,0.14)]",
                        "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_0_12px_rgba(16,185,129,0.2)]",
                        className
                    )}
                >
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span>在线</span>
                </span>
            </GlassHoverTooltip>
        );
    }

    const lastSeenLabel = formatLastSeenShort(lastSeenAt);
    if (!lastSeenLabel) {
        return null;
    }

    const exactTime = formatExactDateTime(lastSeenAt);

    return (
        <GlassHoverTooltip
            content={
                exactTime ? (
                    <div className="space-y-0.5 whitespace-nowrap">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            上次活跃时间
                        </div>
                        <div className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                            {exactTime}
                            {!showOnlineStatus && isOwnProfile ? "（已对他人隐藏）" : ""}
                        </div>
                    </div>
                ) : null
            }
        >
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 h-5 px-2.5 rounded-full border-0 select-none shrink-0 cursor-default",
                    "text-[11px] font-medium tabular-nums",
                    "bg-zinc-100/85 dark:bg-zinc-800/75 text-zinc-500 dark:text-zinc-400",
                    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_1px_3px_rgba(0,0,0,0.03)]",
                    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_1px_3px_rgba(0,0,0,0.25)]",
                    className
                )}
            >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/80 dark:bg-zinc-500 shrink-0" />
                <span>{lastSeenLabel}</span>
            </span>
        </GlassHoverTooltip>
    );
}
