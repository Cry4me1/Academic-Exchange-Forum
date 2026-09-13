"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import AskAiAnimation from "./AskAiAnimation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useI18n } from "@/i18n/context";

export function AiFeatureCard() {
    const { t, isZh } = useI18n();

    return (
        <div className="rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl p-4 sm:p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)] relative overflow-hidden">
            {/* 顶栏 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {t.dashboardComponents.aiCardTitle}
                    </h3>
                </div>
                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                    NEW
                </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed font-normal">
                {t.dashboardComponents.aiCardDesc}
            </p>

            {/* Animation Container */}
            <div className="rounded-xl overflow-hidden border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_2px_8px_-1px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] bg-zinc-50/50 dark:bg-zinc-950/40 mb-3">
                <AskAiAnimation />
            </div>

            <div className="space-y-2.5">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                    {isZh ? (
                        <>选中文字或输入 <kbd className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-zinc-800 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-[10px] font-mono text-zinc-600 dark:text-zinc-400">/</kbd> 唤起 AI 智能协作。</>
                    ) : (
                        <>Highlight text or type <kbd className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-zinc-800 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-[10px] font-mono text-zinc-600 dark:text-zinc-400">/</kbd> to invoke AI assistance.</>
                    )}
                </p>
                <Button 
                    asChild 
                    size="sm" 
                    className="w-full h-8 text-xs font-medium rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] gap-1.5"
                >
                    <Link href="/posts/new">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {t.dashboardComponents.aiCardAction}
                        <ArrowRight className="h-3 w-3 ml-auto text-zinc-400" strokeWidth={1.75} />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
