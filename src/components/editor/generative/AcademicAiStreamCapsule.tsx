"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Square, Sparkles, Feather } from "lucide-react";

interface AcademicAiStreamCapsuleProps {
    isLoading: boolean;
    completion: string;
    onStop?: () => void;
}

// 典雅克制的学者沉思阶段
const SCHOLARLY_STAGES = [
    { step: "01", label: "研读前文语境与命题主旨" },
    { step: "02", label: "梳理学术逻辑与推演脉络" },
    { step: "03", label: "组织凝练论据，行文成篇" },
];

export function AcademicAiStreamCapsule({
    isLoading,
    completion,
    onStop,
}: AcademicAiStreamCapsuleProps) {
    const [stageIndex, setStageIndex] = useState(0);
    const hasCompletion = completion.length > 0;

    // 首字等待阶段的状态机轮播（每 1.8 秒推进一次）
    useEffect(() => {
        if (!isLoading || hasCompletion) {
            setStageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setStageIndex((prev) => (prev + 1) % SCHOLARLY_STAGES.length);
        }, 1800);

        return () => clearInterval(interval);
    }, [isLoading, hasCompletion]);

    return (
        <div className="relative w-full overflow-hidden bg-zinc-50/90 dark:bg-zinc-950/90 text-zinc-900 dark:text-zinc-100 select-none">
            {/* 顶端 1.5px 发丝级微流光天际线 (Hairline Horizon Beam) */}
            {isLoading && (
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-zinc-200 dark:bg-zinc-800/80 overflow-hidden z-20">
                    <motion.div
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-zinc-500/60 dark:via-zinc-300/80 to-transparent"
                        animate={{
                            x: ["-100%", "300%"],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2.2,
                            ease: "easeInOut",
                        }}
                    />
                </div>
            )}

            {/* 阶段 1: TTFT 沉思等待态 (首字未出) */}
            {isLoading && !hasCompletion && (
                <div className="px-4 py-5 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Feather className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                            <span className="text-[11px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                                Scholarly 推演中
                            </span>
                        </div>

                        {/* 三点珍珠极简呼吸 (Trinity Pulse，替代俗套能量柱) */}
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5">
                            {[0, 1, 2].map((i) => (
                                <motion.span
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-300"
                                    animate={{
                                        opacity: [0.25, 0.9, 0.25],
                                        scale: [0.9, 1.15, 0.9],
                                    }}
                                    transition={{
                                        duration: 1.4,
                                        repeat: Infinity,
                                        delay: i * 0.25,
                                        ease: "easeInOut",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 学者三段式沉思文字轮播 */}
                    <div className="h-6 flex items-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={stageIndex}
                                initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-sans"
                            >
                                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800/60">
                                    {SCHOLARLY_STAGES[stageIndex].step}
                                </span>
                                <span>{SCHOLARLY_STAGES[stageIndex].label}</span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* 雅致发丝骨架条 (Shimmer Skeletons) */}
                    <div className="space-y-2 pt-1 opacity-70">
                        <div className="h-2 w-11/12 rounded-xs bg-zinc-200/70 dark:bg-zinc-800/70 animate-pulse" />
                        <div className="h-2 w-8/12 rounded-xs bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse [animation-delay:200ms]" />
                    </div>
                </div>
            )}

            {/* 阶段 2: 流式字迹涌出态 (Streaming Phase) */}
            {hasCompletion && (
                <div className="flex flex-col">
                    <ScrollArea className="max-h-[360px] px-4 py-3">
                        <div className="text-xs sm:text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans whitespace-pre-wrap select-text selection:bg-zinc-200 dark:selection:bg-zinc-800">
                            {completion}
                            {/* 打字机极简游标 (Typographic Cursor) */}
                            {isLoading && (
                                <motion.span
                                    animate={{ opacity: [1, 0.15, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                                    className="inline-block w-[1.5px] h-[1.15em] ml-0.5 align-text-bottom bg-zinc-900 dark:bg-zinc-100 rounded-2xs"
                                />
                            )}
                        </div>
                    </ScrollArea>

                    {/* 底部极简状态与打断操作栏 */}
                    <div className="flex items-center justify-between px-3.5 py-2 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/50 dark:bg-zinc-900/40 text-[11px] text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5">
                            {isLoading ? (
                                <>
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.65, 1, 0.65],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.6,
                                            ease: "easeInOut",
                                        }}
                                        className="shrink-0 flex items-center justify-center"
                                    >
                                        <Sparkles className="h-3 w-3 text-amber-500/80 dark:text-amber-400/80" />
                                    </motion.div>
                                    <span>撰写中 · {completion.length} 字</span>
                                </>
                            ) : (
                                <span>生成完毕 · {completion.length} 字</span>
                            )}
                        </div>

                        {isLoading && onStop && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onStop}
                                className="h-6 px-2 text-[11px] font-sans text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors gap-1"
                            >
                                <Square className="h-2.5 w-2.5 fill-current" />
                                停止 [Esc]
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
