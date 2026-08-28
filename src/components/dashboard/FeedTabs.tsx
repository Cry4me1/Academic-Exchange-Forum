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
            className="relative flex items-center gap-1 p-1 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 overflow-x-auto scrollbar-hidden"
        >
            {/* 滑块指示器 */}
            <motion.div
                className="absolute top-1 bottom-1 bg-white dark:bg-zinc-800 rounded-md shadow-xs border border-zinc-200/80 dark:border-zinc-700/60 pointer-events-none"
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
                            "relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap",
                            "flex-1 min-w-fit select-none",
                            isActive
                                ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )}
                    >
                        <Icon 
                            className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500")} 
                            strokeWidth={1.75}
                        />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
