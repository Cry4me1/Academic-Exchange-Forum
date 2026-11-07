"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { MOTION_SPRINGS } from "@/lib/motion-tokens";
import { GLASS, DIVIDER_V } from "./welcome-glass";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps?: number;
}

/**
 * 入驻步骤指示器（Liquid Glass 分段胶囊）
 * - 激活段由 layoutId 液态药丸承载，步骤切换时以弹簧平移（可被打断）
 * - 序号 / 完成对勾共用同一尺寸圆形容器，字重恒定 font-medium，零布局跳动
 */
export function StepIndicator({ currentStep }: StepIndicatorProps) {
    const { t } = useI18n();
    const shouldReduceMotion = useReducedMotion();

    const steps = [
        { number: 1, title: t.welcome.stepIndicator.step1Title, subtitle: t.welcome.stepIndicator.step1Subtitle },
        { number: 2, title: t.welcome.stepIndicator.step2Title, subtitle: t.welcome.stepIndicator.step2Subtitle },
        { number: 3, title: t.welcome.stepIndicator.step3Title, subtitle: t.welcome.stepIndicator.step3Subtitle },
    ];

    return (
        <nav aria-label="入驻进度" className="flex w-full justify-center">
            <ol className={cn(GLASS, "relative inline-flex max-w-full items-center gap-0.5 rounded-full p-1")}>
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.number;
                    const isCurrent = currentStep === step.number;

                    return (
                        <li key={step.number} className="flex items-center">
                            {index > 0 && <span aria-hidden className={cn(DIVIDER_V, "hidden sm:block")} />}

                            <div
                                aria-current={isCurrent ? "step" : undefined}
                                className="relative flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 sm:pr-4 select-none"
                            >
                                {/* 激活段液态药丸 */}
                                {isCurrent && (
                                    <motion.span
                                        aria-hidden
                                        layoutId={shouldReduceMotion ? undefined : "welcome-step-pill"}
                                        transition={MOTION_SPRINGS.fluidPill}
                                        className="absolute inset-0 rounded-full bg-white/95 dark:bg-zinc-800/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0.5px_rgba(255,255,255,1)] dark:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                                    />
                                )}

                                {/* 序号 / 完成态（固定尺寸） */}
                                <span
                                    className={cn(
                                        "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums transition-[background-color,color,box-shadow] duration-200",
                                        isCompleted &&
                                            "bg-zinc-950/85 text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)] dark:bg-white/90 dark:text-zinc-950",
                                        isCurrent &&
                                            "bg-[rgba(245,158,11,0.16)] text-amber-700 shadow-[0_0_12px_rgba(245,158,11,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:text-amber-300 dark:shadow-[0_0_12px_rgba(245,158,11,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.12)]",
                                        !isCompleted &&
                                            !isCurrent &&
                                            "bg-zinc-900/[0.05] text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500"
                                    )}
                                >
                                    {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : step.number}
                                </span>

                                {/* 标题与副标题（字重锁定） */}
                                <span className="relative z-10 flex flex-col leading-tight">
                                    <span
                                        className={cn(
                                            "text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                            isCurrent
                                                ? "text-zinc-950 dark:text-white"
                                                : isCompleted
                                                  ? "text-zinc-700 dark:text-zinc-300"
                                                  : "text-zinc-400 dark:text-zinc-500"
                                        )}
                                    >
                                        {step.title}
                                    </span>
                                    <span className="hidden md:block text-[10px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                                        {step.subtitle}
                                    </span>
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
