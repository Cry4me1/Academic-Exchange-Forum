"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import AskAiAnimation from "./AskAiAnimation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useI18n } from "@/i18n/context";

export function AiFeatureCard() {
    const { t, isZh } = useI18n();

    return (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs backdrop-blur-md relative overflow-hidden">
            {/* 顶栏 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {t.dashboardComponents.aiCardTitle}
                    </h3>
                </div>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    NEW
                </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed font-normal">
                {t.dashboardComponents.aiCardDesc}
            </p>

            {/* Animation Container */}
            <div className="rounded-lg overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs bg-zinc-50/50 dark:bg-zinc-950/40 mb-3">
                <AskAiAnimation />
            </div>

            <div className="space-y-2.5">
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                    {isZh ? (
                        <>选中文字或输入 <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">/</kbd> 唤起 AI 智能协作。</>
                    ) : (
                        <>Highlight text or type <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">/</kbd> to invoke AI assistance.</>
                    )}
                </p>
                <Button 
                    asChild 
                    size="sm" 
                    className="w-full h-8 text-xs font-medium rounded-lg bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-2xs gap-1.5"
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
