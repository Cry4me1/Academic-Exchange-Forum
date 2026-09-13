"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Heart, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/context";

export type FeedFilter = "latest" | "trending" | "following" | "solved" | "help";

interface FeedTabsProps {
    activeTab: FeedFilter;
    onTabChange: (tab: FeedFilter) => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    const { t } = useI18n();
    const tFeed = t.feedTabs;

    const tabs: { value: FeedFilter; label: string; icon: typeof Clock }[] = [
        { value: "latest", label: tFeed.latest, icon: Clock },
        { value: "trending", label: tFeed.trending, icon: Flame },
        { value: "following", label: tFeed.following, icon: Heart },
        { value: "solved", label: tFeed.solved, icon: CheckCircle2 },
        { value: "help", label: tFeed.help, icon: HelpCircle },
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    // 计算滑块位置
    useEffect(() => {
        if (!containerRef.current) return;
        const activeElement = containerRef.current.querySelector(
            `[data-tab="${activeTab}"]`
        ) as HTMLButtonElement | null;

        if (activeElement) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const activeRect = activeElement.getBoundingClientRect();
            setIndicatorStyle({
                left: activeRect.left - containerRect.left + containerRef.current.scrollLeft,
                width: activeRect.width,
            });

            // 移动端：自动滚动到选中项可见
            activeElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [activeTab]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center gap-1 p-1 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(0,0,0,0.3)] overflow-x-auto scrollbar-hidden"
        >
            {/* 滑块指示器 */}
            <motion.div
                className="absolute top-1 bottom-1 bg-white/95 dark:bg-zinc-800/90 rounded-full border-0 shadow-[0_2px_10px_-1px_rgba(0,0,0,0.1),inset_0_1px_0.5px_rgba(255,255,255,1)] dark:shadow-[0_2px_10px_-1px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.18)] backdrop-blur-md pointer-events-none"
                animate={{
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                }}
                transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                }}
            />

            {/* Tab 按钮 */}
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;

                return (
                    <button
                        key={tab.value}
                        type="button"
                        data-tab={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={cn(
                            "relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap",
                            "flex-1 min-w-fit select-none border-0",
                            isActive
                                ? "text-zinc-950 dark:text-white font-medium"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                        )}
                    >
                        <Icon 
                            className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-500")} 
                            strokeWidth={1.75}
                        />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
