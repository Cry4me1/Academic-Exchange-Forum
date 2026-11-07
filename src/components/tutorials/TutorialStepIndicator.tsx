"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, PenTool, BookOpen, Swords, MessageSquare, Coins, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens";
import { TUTORIAL_MODULES_CONFIG, type CompletedTasksByStep } from "./tutorial-constants";

interface TutorialStepIndicatorProps {
    currentStep: number;
    completedTasksByStep?: CompletedTasksByStep;
    onStepClick?: (step: number) => void;
}

export function TutorialStepIndicator({
    currentStep,
    completedTasksByStep = {},
    onStepClick,
}: TutorialStepIndicatorProps) {
    const { t } = useI18n();
    const prefersReducedMotion = useReducedMotion();
    const tSteps = t.tutorials.steps;

    const tutorialSteps = [
        { number: 1, title: tSteps.step1Title, icon: PenTool, desc: tSteps.step1Desc },
        { number: 2, title: tSteps.step2Title, icon: BookOpen, desc: tSteps.step2Desc },
        { number: 3, title: tSteps.step3Title, icon: Swords, desc: tSteps.step3Desc },
        { number: 4, title: tSteps.step4Title, icon: MessageSquare, desc: tSteps.step4Desc },
        { number: 5, title: tSteps.step5Title, icon: Coins, desc: tSteps.step5Desc },
        { number: 6, title: tSteps.step6Title, icon: Bot, desc: tSteps.step6Desc },
    ];

    return (
        <nav
            aria-label="训练营实训模块导览"
            onMouseMove={trackPointer120fps}
            className="relative w-full rounded-3xl border-0 p-2 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden"
        >
            {/* 120fps 纯物理无色光随鼠动漫反射层 */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-25 transition-opacity duration-300"
                style={{
                    background:
                        "radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.55), transparent 80%)",
                }}
            />

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {tutorialSteps.map((step) => {
                    const modConfig = TUTORIAL_MODULES_CONFIG.find((m) => m.step === step.number);
                    const totalInStep = modConfig ? modConfig.taskIds.length : 1;
                    const doneInStep = modConfig
                        ? modConfig.taskIds.filter((id) =>
                              (completedTasksByStep[step.number] || []).includes(id)
                          ).length
                        : 0;
                    const isModuleCompleted = doneInStep >= totalInStep && totalInStep > 0;
                    const isCurrent = currentStep === step.number;
                    const Icon = step.icon;

                    return (
                        <button
                            key={step.number}
                            type="button"
                            onClick={() => onStepClick?.(step.number)}
                            className={cn(
                                "relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border-0 text-left select-none cursor-pointer group",
                                "transition-[transform,background-color,color] duration-150 ease-[var(--ease-out-snappy)] active:scale-[0.97]",
                                !isCurrent &&
                                    "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-900/[0.035] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.04]"
                            )}
                        >
                            {/* 物理弹簧流体选中底座 */}
                            {isCurrent && (
                                <motion.div
                                    layoutId={prefersReducedMotion ? undefined : "tutorial-step-active-pill"}
                                    transition={MOTION_SPRINGS.fluidPill}
                                    className="absolute inset-0 rounded-2xl border-0 bg-white/95 dark:bg-zinc-800/90 shadow-[0_4px_20px_-2px_rgba(14,165,233,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_4px_20px_-2px_rgba(14,165,233,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
                                />
                            )}

                            {/* 步骤水滴圆章 */}
                            <div
                                className={cn(
                                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 transition-[background-color,color,box-shadow] duration-200",
                                    isModuleCompleted
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_10px_rgba(16,185,129,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.15)]"
                                        : isCurrent
                                        ? "bg-zinc-950/90 text-white dark:bg-white/95 dark:text-zinc-950 shadow-[0_3px_12px_rgba(0,0,0,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.4)]"
                                        : "bg-zinc-900/[0.05] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                                )}
                            >
                                {isModuleCompleted ? (
                                    <Check className="h-4 w-4 stroke-[2.25]" />
                                ) : (
                                    <Icon className="h-4 w-4 stroke-[1.85]" />
                                )}
                            </div>

                            {/* 文字与微进度计数（锁定 font-medium + tabular-nums 零布局跳动） */}
                            <div className="relative z-10 min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <span
                                        className={cn(
                                            "block text-xs font-medium truncate transition-colors duration-150",
                                            isCurrent
                                                ? "text-zinc-950 dark:text-white"
                                                : isModuleCompleted
                                                ? "text-zinc-800 dark:text-zinc-200"
                                                : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200"
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-[10px] font-mono font-medium tabular-nums shrink-0",
                                            isModuleCompleted
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : isCurrent
                                                ? "text-sky-600 dark:text-sky-400"
                                                : "text-zinc-400 dark:text-zinc-500"
                                        )}
                                    >
                                        {doneInStep}/{totalInStep}
                                    </span>
                                </div>
                                <span className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                    {step.desc}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
