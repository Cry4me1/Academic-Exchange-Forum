"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Sparkles, ArrowRight, ArrowLeft, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOTION_EASINGS, trackPointer120fps } from "@/lib/motion-tokens";

export interface TaskItem {
    id: string;
    title: string;
    description: string;
    hint: string;
    isCompleted: boolean;
}

interface InteractiveTaskGuideProps {
    tasks: TaskItem[];
    currentTaskIndex: number;
    onPrevTask: () => void;
    onNextTask: () => void;
    onResetTask?: () => void;
    moduleTitle: string;
}

export function InteractiveTaskGuide({
    tasks,
    currentTaskIndex,
    onPrevTask,
    onNextTask,
    onResetTask,
    moduleTitle,
}: InteractiveTaskGuideProps) {
    const prefersReducedMotion = useReducedMotion();
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return null;

    const completedCount = tasks.filter((t) => t.isCompleted).length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <div
            onMouseMove={trackPointer120fps}
            className="relative overflow-hidden rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] p-4 sm:p-5 space-y-3.5"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-65 dark:opacity-20"
                style={{
                    background:
                        "radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.45), transparent 80%)",
                }}
            />

            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border-0 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300 px-2.5 py-0.5 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                        <Sparkles className="h-3 w-3" />
                        实操任务 {currentTaskIndex + 1} / {tasks.length}
                    </span>
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {moduleTitle}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="w-24 sm:w-32 h-2 rounded-full border-0 bg-zinc-900/[0.06] dark:bg-white/[0.08] overflow-hidden">
                        <motion.div
                            className="h-full w-full origin-left bg-emerald-500/85 rounded-full"
                            initial={false}
                            animate={{ transform: `scaleX(${progressPercent / 100})` }}
                            transition={{ duration: 0.24, ease: MOTION_EASINGS.snappy }}
                        />
                    </div>
                    <span className="font-mono text-[11px] font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                        {progressPercent}%
                    </span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTask.id}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }}
                    transition={{ duration: 0.18, ease: MOTION_EASINGS.snappy }}
                    className="relative z-10 space-y-2.5 pt-1"
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 transition-colors duration-200",
                                currentTask.isCompleted
                                    ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                                    : "bg-zinc-900/[0.05] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200"
                            )}
                        >
                            {currentTask.isCompleted ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                                <span className="text-xs font-mono font-medium tabular-nums">
                                    {currentTaskIndex + 1}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {currentTask.title}
                                </h4>
                                <span
                                    className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full border-0 font-medium shrink-0",
                                        currentTask.isCompleted
                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                            : "bg-zinc-900/[0.04] dark:bg-white/[0.06] text-zinc-500"
                                    )}
                                >
                                    {currentTask.isCompleted ? "已掌握" : "待实操"}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                {currentTask.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border-0 bg-amber-500/[0.08] px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="flex-1 font-medium">{currentTask.hint}</span>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            <div className="relative z-10 flex items-center justify-between pt-0.5">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={currentTaskIndex === 0}
                    onClick={onPrevTask}
                    className="h-8 px-3 rounded-full border-0 text-xs font-medium gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-900/[0.04] dark:bg-white/[0.05] active:scale-[0.97]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    上个任务
                </Button>

                <div className="flex items-center gap-2">
                    {onResetTask && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetTask}
                            className="h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 gap-1 active:scale-[0.97]"
                            title="重新实操此步骤"
                        >
                            <RotateCcw className="h-3 w-3" />
                            重置输入
                        </Button>
                    )}

                    <Button
                        type="button"
                        size="sm"
                        onClick={onNextTask}
                        className="h-8 px-4 rounded-full border-0 text-xs font-medium gap-1 bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.24),inset_0_1px_1px_rgba(255,255,255,0.35)] active:scale-[0.97]"
                    >
                        {currentTaskIndex === tasks.length - 1 ? "完成此模块" : "下一个任务"}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
