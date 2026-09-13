"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, X } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/i18n/context";

const DISMISSED_KEY = "scholarly_dashboard_tutorial_banner_dismissed_v1";
const STORAGE_KEY = "scholarly_tutorials_completed_modules_v1";

export function DashboardTutorialBanner() {
    const { t, isZh } = useI18n();
    const [isVisible, setIsVisible] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        try {
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            if (dismissed === "true") return;

            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCompletedCount(parsed.length);
                    // 如果已经全部通关5个模块，则默认不显示横幅
                    if (parsed.length >= 5) return;
                }
            }
            setIsVisible(true);
        } catch {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        try {
            localStorage.setItem(DISMISSED_KEY, "true");
        } catch {
            // ignore
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                className="relative rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl p-3.5 sm:p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)] overflow-hidden mb-5"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950/85 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                            <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {isZh ? "Scholarly 研学者实操训练营" : "Scholarly Hands-on Training Camp"}
                                </h4>
                                <span className="text-[10px] py-0.2 px-2 rounded-full font-medium border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] bg-white/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                    {isZh ? "1:1 全真沙盒" : "1:1 Interactive Sandbox"}
                                </span>
                                {completedCount > 0 && (
                                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                                        ({isZh ? `已掌握 ${completedCount}/5 技能` : `${completedCount}/5 mastered`})
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-normal">
                                {t.dashboardComponents.tutorialBannerTitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Link href="/announcements/tutorials">
                            <Button size="sm" className="h-7 text-xs px-3 rounded-full font-medium border-0 bg-zinc-950/85 text-white hover:bg-zinc-900/95 dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] gap-1 group">
                                {t.dashboardComponents.tutorialBannerAction}
                                <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
                            </Button>
                        </Link>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="h-7 w-7 rounded-full hover:bg-white/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition-colors border-0"
                            title={isZh ? "稍后再说" : "Dismiss"}
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
