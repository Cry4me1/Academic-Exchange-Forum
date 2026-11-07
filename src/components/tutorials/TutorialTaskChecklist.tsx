"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, Lightbulb, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackPointer120fps } from "@/lib/motion-tokens";
import { useI18n } from "@/i18n/context";

export interface TaskItem {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
}

interface TutorialTaskChecklistProps {
    tasks: TaskItem[];
    stepTitle: string;
    stepBadge?: string;
    hintText?: string;
    onTaskClick?: (taskId: string) => void;
    onMarkAllDone?: () => void;
}

export function TutorialTaskChecklist({
    tasks,
    stepTitle,
    stepBadge = "实操清单",
    hintText,
    onTaskClick,
    onMarkAllDone,
}: TutorialTaskChecklistProps) {
    const { isZh } = useI18n();
    const prefersReducedMotion = useReducedMotion();
    const completedCount = tasks.filter((t) => t.isCompleted).length;
    const isAllDone = tasks.length > 0 && completedCount === tasks.length;
    const progressRatio = tasks.length > 0 ? completedCount / tasks.length : 0;

    return (
        <section
            onMouseMove={trackPointer120fps}
            className="relative overflow-hidden rounded-3xl border-0 p-5 sm:p-6 space-y-4 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)]"
        >
            {/* 120fps 纯白无色光随鼠动漫射层 */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-65 dark:opacity-20"
                style={{
                    background:
                        "radial-gradient(280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.5), transparent 80%)",
                }}
            />

            {/* 顶栏：模块标题、进度药丸与快捷全标 */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-medium transition-colors duration-200",
                            isAllDone
                                ? "bg-emerald-500/[0.14] text-emerald-700 dark:text-emerald-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_12px_rgba(16,185,129,0.2)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                                : "bg-sky-500/[0.12] text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_10px_rgba(14,165,233,0.14)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                        )}
                    >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>{isAllDone ? (isZh ? "本节已全部掌握" : "Module Mastered") : stepBadge}</span>
                    </span>
                    <h2 className="text-sm sm:text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                        {stepTitle}
                    </h2>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {onMarkAllDone && !isAllDone && (
                        <button
                            type="button"
                            onClick={onMarkAllDone}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border-0 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.09] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-[transform,background-color,color] duration-150 active:scale-[0.97] cursor-pointer"
                        >
                            <CheckCheck className="h-3 w-3" />
                            <span>{isZh ? "快速全标" : "Mark All"}</span>
                        </button>
                    )}

                    {/* GPU 复合层缩放进度条（避免动画 width 触发重排） */}
                    <div className="w-28 sm:w-36 h-2 rounded-full border-0 bg-zinc-900/[0.06] dark:bg-white/[0.08] overflow-hidden shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.06)]">
                        <motion.div
                            className="h-full w-full origin-left rounded-full bg-emerald-500/85 dark:bg-emerald-400/90"
                            initial={false}
                            animate={{
                                transform: `scaleX(${progressRatio})`,
                            }}
                            transition={
                                prefersReducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }
                            }
                        />
                    </div>

                    <span className="inline-flex items-center justify-center rounded-full border-0 px-2.5 py-0.5 text-xs font-mono font-medium tabular-nums bg-zinc-900/[0.05] dark:bg-white/[0.07] text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                        {completedCount} / {tasks.length}
                    </span>
                </div>
            </div>

            {/* 渐变消融内部光缝 */}
            <div className="relative z-10 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 任务清单网格（零布局跳动：恒定字重 font-medium + 恒定胶囊占位） */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tasks.map((task, idx) => (
                    <button
                        key={task.id}
                        type="button"
                        onClick={() => onTaskClick?.(task.id)}
                        className={cn(
                            "w-full text-left p-3.5 rounded-2xl border-0 flex items-start gap-3 select-none transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-out-snappy)]",
                            onTaskClick ? "cursor-pointer active:scale-[0.985]" : "cursor-default",
                            task.isCompleted
                                ? "bg-emerald-500/[0.09] dark:bg-emerald-500/[0.11] shadow-[0_4px_20px_-4px_rgba(16,185,129,0.16),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                                : "bg-zinc-900/[0.03] dark:bg-white/[0.035] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/80 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.065] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                        )}
                    >
                        <div
                            className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-0 mt-0.5 transition-[background-color,color,box-shadow] duration-200",
                                task.isCompleted
                                    ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                    : "bg-white/85 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                            )}
                        >
                            {task.isCompleted ? (
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                                <span className="text-[11px] font-mono font-medium tabular-nums">
                                    {idx + 1}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3
                                    className={cn(
                                        "text-xs sm:text-sm font-medium truncate transition-colors duration-150",
                                        task.isCompleted
                                            ? "text-emerald-800 dark:text-emerald-300"
                                            : "text-zinc-900 dark:text-zinc-100"
                                    )}
                                >
                                    {task.title}
                                </h3>
                                {/* 固定槽位状态胶囊，零布局跳动 */}
                                <span
                                    className={cn(
                                        "inline-flex items-center justify-center w-14 py-0.5 rounded-full border-0 text-[10px] font-medium shrink-0 transition-colors duration-150",
                                        task.isCompleted
                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                            : "bg-zinc-900/[0.045] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400"
                                    )}
                                >
                                    {task.isCompleted ? (isZh ? "已掌握" : "Done") : (isZh ? "待实操" : "Todo")}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                                {task.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {/* 温润提示胶囊 */}
            {hintText && (
                <div className="relative z-10 flex items-center gap-2.5 rounded-2xl border-0 bg-amber-500/[0.08] dark:bg-amber-500/[0.09] px-3.5 py-2.5 text-xs text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="flex-1 leading-relaxed">{hintText}</span>
                </div>
            )}
        </section>
    );
}
