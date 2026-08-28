"use client";

import { motion } from "framer-motion";
import { Check, PenTool, BookOpen, Swords, MessageSquare, Coins, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

interface TutorialStepIndicatorProps {
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export function TutorialStepIndicator({
    currentStep,
    onStepClick,
}: TutorialStepIndicatorProps) {
    const { t } = useI18n();
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
        <div className="w-full max-w-5xl mx-auto px-2">
            <div className="relative flex items-center justify-between">
                {/* 贯穿底层的背景连接线 */}
                <div className="absolute top-5 left-6 right-6 h-[2px] bg-muted -z-0" />

                {/* 活跃进度的渐变连接线 */}
                <motion.div
                    className="absolute top-5 left-6 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-indigo-600 -z-0 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{
                        scaleX: Math.max(0, (currentStep - 1) / (tutorialSteps.length - 1)),
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ width: "calc(100% - 48px)" }}
                />

                {tutorialSteps.map((step) => {
                    const isCompleted = currentStep > step.number;
                    const isCurrent = currentStep === step.number;
                    const Icon = step.icon;

                    return (
                        <div
                            key={step.number}
                            onClick={() => onStepClick && onStepClick(step.number)}
                            className={cn(
                                "flex flex-col items-center relative z-10 select-none group",
                                onStepClick ? "cursor-pointer" : "cursor-default"
                            )}
                        >
                            {/* 步骤数字/图标圆圈 */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.15 : 1,
                                    borderColor: isCurrent
                                        ? "var(--primary)"
                                        : isCompleted
                                        ? "rgb(16, 185, 129)"
                                        : "hsl(var(--border))",
                                }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                    "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-sm",
                                    isCompleted
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                                        : isCurrent
                                        ? "bg-gradient-to-br from-primary to-violet-600 text-white border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/25"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/50 group-hover:text-foreground"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                                ) : (
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                            </motion.div>

                            {/* 步骤文字 */}
                            <div className="mt-2 text-center">
                                <span
                                    className={cn(
                                        "block text-[11px] sm:text-xs font-bold transition-colors leading-tight",
                                        isCurrent
                                            ? "text-primary"
                                            : isCompleted
                                            ? "text-foreground font-semibold"
                                            : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                >
                                    {step.title}
                                </span>
                                <span className="hidden md:block text-[10px] text-muted-foreground/80 mt-0.5">
                                    {step.desc}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
