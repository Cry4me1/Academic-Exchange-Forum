"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    GraduationCap,
    Award,
    Share2,
    RotateCcw,
    Bell,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TutorialStepIndicator } from "@/components/tutorials/TutorialStepIndicator";
import { TutorialCompleteModal } from "@/components/tutorials/TutorialCompleteModal";
import {
    TUTORIAL_MODULES_CONFIG,
    TUTORIAL_TASKS_STORAGE_KEY,
    TUTORIAL_STEP_STORAGE_KEY,
    TUTORIAL_COMPLETED_MODULES_KEY,
    deriveCompletedModuleIds,
    getTotalTasksCount,
    type CompletedTasksByStep,
} from "@/components/tutorials/tutorial-constants";
import { Step1EditorTour } from "./steps/Step1EditorTour";
import { Step2PublicationTour } from "./steps/Step2PublicationTour";
import { Step3DuelTour } from "./steps/Step3DuelTour";
import { Step4MessagesTour } from "./steps/Step4MessagesTour";
import { Step5CreditsTour } from "./steps/Step5CreditsTour";
import { Step6AiReviewTour } from "./steps/Step6AiReviewTour";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { MOTION_EASINGS } from "@/lib/motion-tokens";

export function TutorialsClient() {
    const { t, isZh } = useI18n();
    const prefersReducedMotion = useReducedMotion();
    const tTut = t.tutorials;

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [completedTasksByStep, setCompletedTasksByStep] = useState<CompletedTasksByStep>({});
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);

    const totalTasksCount = useMemo(() => getTotalTasksCount(), []);

    // 初始化恢复本地实操记录与 URL ?step= 参数
    useEffect(() => {
        try {
            const savedTasksRaw = localStorage.getItem(TUTORIAL_TASKS_STORAGE_KEY);
            if (savedTasksRaw) {
                const parsed = JSON.parse(savedTasksRaw);
                if (parsed && typeof parsed === "object") {
                    setCompletedTasksByStep(parsed);
                }
            }

            const params = new URLSearchParams(window.location.search);
            const urlStep = parseInt(params.get("step") || "", 10);
            if (urlStep >= 1 && urlStep <= 6) {
                setCurrentStep(urlStep);
            } else {
                const savedStep = parseInt(
                    localStorage.getItem(TUTORIAL_STEP_STORAGE_KEY) || "1",
                    10
                );
                if (savedStep >= 1 && savedStep <= 6) {
                    setCurrentStep(savedStep);
                }
            }
        } catch {
            // ignore storage errors
        }
        setMounted(true);
    }, []);

    // 同步持久化子任务进度与 Dashboard 模块完成度
    const persistTasks = useCallback((nextMap: CompletedTasksByStep) => {
        try {
            localStorage.setItem(TUTORIAL_TASKS_STORAGE_KEY, JSON.stringify(nextMap));
            const completedModules = deriveCompletedModuleIds(nextMap);
            localStorage.setItem(
                TUTORIAL_COMPLETED_MODULES_KEY,
                JSON.stringify(completedModules)
            );
        } catch {
            // ignore storage errors
        }
    }, []);

    // 方向感知的步骤跳转（同步 URL 查询参数与平滑视口回顶）
    const navigateToStep = useCallback(
        (nextStep: number) => {
            const clamped = Math.max(1, Math.min(6, nextStep));
            if (clamped === currentStep) return;

            setDirection(clamped > currentStep ? 1 : -1);
            setCurrentStep(clamped);

            try {
                localStorage.setItem(TUTORIAL_STEP_STORAGE_KEY, String(clamped));
                const url = new URL(window.location.href);
                url.searchParams.set("step", String(clamped));
                window.history.replaceState(null, "", url.toString());
            } catch {
                // ignore
            }
        },
        [currentStep]
    );

    // 键盘 Alt + ← / → 快速切换模块（不干扰编辑器正常光标）
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!e.altKey) return;
            if (e.key === "ArrowRight" && currentStep < 6) {
                e.preventDefault();
                navigateToStep(currentStep + 1);
            } else if (e.key === "ArrowLeft" && currentStep > 1) {
                e.preventDefault();
                navigateToStep(currentStep - 1);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [currentStep, navigateToStep]);

    const handleCompleteTask = useCallback(
        (stepNum: number, taskId: string) => {
            setCompletedTasksByStep((prev) => {
                const existing = prev[stepNum] || [];
                if (existing.includes(taskId)) return prev;
                const next = {
                    ...prev,
                    [stepNum]: [...existing, taskId],
                };
                persistTasks(next);
                return next;
            });
        },
        [persistTasks]
    );

    const handleCompleteAllInStep = useCallback(
        (stepNum: number, taskIds: string[]) => {
            setCompletedTasksByStep((prev) => {
                const existing = new Set(prev[stepNum] || []);
                taskIds.forEach((id) => existing.add(id));
                const next = {
                    ...prev,
                    [stepNum]: Array.from(existing),
                };
                persistTasks(next);
                return next;
            });
            toast.success(isZh ? "已标记本节全部实操技能掌握" : "All tasks in module mastered");
        },
        [persistTasks, isZh]
    );

    const handleFinishGraduation = useCallback(() => {
        // 将全部 6 大模块标记通关并打开结业荣誉证书
        const fullMap: CompletedTasksByStep = {};
        TUTORIAL_MODULES_CONFIG.forEach((m) => {
            fullMap[m.step] = [...m.taskIds];
        });
        setCompletedTasksByStep(fullMap);
        persistTasks(fullMap);
        setIsCompleteModalOpen(true);
    }, [persistTasks]);

    const handleResetAllProgress = useCallback(() => {
        setCompletedTasksByStep({});
        try {
            localStorage.removeItem(TUTORIAL_TASKS_STORAGE_KEY);
            localStorage.removeItem(TUTORIAL_COMPLETED_MODULES_KEY);
        } catch {
            // ignore
        }
        toast.info(isZh ? "已重置全部实操训练进度" : "Training progress reset");
    }, [isZh]);

    const handleShareStepLink = useCallback(async () => {
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("step", String(currentStep));
            await navigator.clipboard.writeText(url.toString());
            toast.success(
                isZh
                    ? `已复制第 ${currentStep} 节实训直达链接`
                    : `Copied link to Step ${currentStep}`
            );
        } catch {
            toast.error(isZh ? "复制链接失败" : "Failed to copy link");
        }
    }, [currentStep, isZh]);

    const completedTasksCount = useMemo(() => {
        return TUTORIAL_MODULES_CONFIG.reduce((sum, mod) => {
            const list = completedTasksByStep[mod.step] || [];
            return sum + mod.taskIds.filter((id) => list.includes(id)).length;
        }, 0);
    }, [completedTasksByStep]);

    const completedModulesCount = useMemo(
        () => deriveCompletedModuleIds(completedTasksByStep).length,
        [completedTasksByStep]
    );

    const currentModuleConfig = useMemo(
        () =>
            TUTORIAL_MODULES_CONFIG.find((m) => m.step === currentStep) ||
            TUTORIAL_MODULES_CONFIG[0],
        [currentStep]
    );

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl w-full mx-auto space-y-6 animate-pulse">
                    <div className="h-10 w-full bg-zinc-200/50 dark:bg-zinc-800/40 rounded-full" />
                    <div className="h-24 w-2/3 mx-auto bg-zinc-200/40 dark:bg-zinc-800/30 rounded-3xl" />
                    <div className="h-20 w-full bg-zinc-200/45 dark:bg-zinc-800/35 rounded-3xl" />
                    <div className="h-96 w-full bg-zinc-200/35 dark:bg-zinc-800/25 rounded-3xl" />
                </div>
            </div>
        );
    }

    const slideOffset = direction * 16;

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            {/* 纯净温润环境微光晕（废除高饱和蓝紫激光，采用低透明度天青与暖金自然漫射） */}
            <div aria-hidden="true" className="fixed inset-0 pointer-events-none -z-0 overflow-hidden">
                <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[760px] h-[360px] bg-sky-500/[0.07] dark:bg-sky-500/[0.06] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-12%] right-[-6%] w-[460px] h-[420px] bg-amber-500/[0.06] dark:bg-amber-500/[0.05] rounded-full blur-[110px]" />
                <div className="absolute bottom-[-8%] left-[-6%] w-[420px] h-[380px] bg-emerald-500/[0.05] dark:bg-emerald-500/[0.04] rounded-full blur-[110px]" />
            </div>

            <div className="relative z-10 max-w-5xl w-full mx-auto space-y-6">
                {/* 顶栏悬浮无边框控制坞 */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3.5 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-white/75 hover:bg-white dark:bg-zinc-900/55 dark:hover:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.12)] gap-1.5 active:scale-[0.97] cursor-pointer"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>{tTut.backToDashboard}</span>
                            </Button>
                        </Link>

                        <Link href="/announcements">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3.5 rounded-full border-0 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white/55 hover:bg-white/85 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] gap-1.5 active:scale-[0.97] cursor-pointer"
                            >
                                <Bell className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    {isZh ? "全部公告" : "Announcements"}
                                </span>
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 全局实训进度胶囊（点击可随时查看结业勋章进度） */}
                        <button
                            type="button"
                            onClick={() => setIsCompleteModalOpen(true)}
                            title={isZh ? "查看研学者实训勋章与证书" : "View Scholar Certificate"}
                            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full border-0 text-xs font-medium bg-white/75 hover:bg-white dark:bg-zinc-900/55 dark:hover:bg-zinc-900/80 backdrop-blur-xl text-zinc-700 dark:text-zinc-200 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                        >
                            <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="font-mono tabular-nums">
                                {isZh
                                    ? `实操 ${completedTasksCount}/${totalTasksCount} · 通关 ${completedModulesCount}/6`
                                    : `${completedTasksCount}/${totalTasksCount} Tasks · ${completedModulesCount}/6`}
                            </span>
                        </button>

                        {/* 分享本节直达链接 */}
                        <button
                            type="button"
                            onClick={handleShareStepLink}
                            title={isZh ? "复制本节教程直达链接" : "Copy step link"}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-full border-0 bg-white/70 hover:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 backdrop-blur-xl text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-[transform,background-color] duration-150 active:scale-[0.96] cursor-pointer"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                        </button>

                        {/* 重置实操进度 */}
                        {completedTasksCount > 0 && (
                            <button
                                type="button"
                                onClick={handleResetAllProgress}
                                title={isZh ? "重置全部实训进度" : "Reset progress"}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-full border-0 bg-white/70 hover:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 backdrop-blur-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-[transform,background-color,color] duration-150 active:scale-[0.96] cursor-pointer"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        )}

                        <LanguageSwitcher variant="toggle" />
                    </div>
                </header>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 顶部欢迎主标题区域 */}
                <div className="text-center space-y-2.5 pt-1">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border-0 bg-white/75 dark:bg-zinc-900/55 backdrop-blur-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                        <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                        <span>{tTut.tag}</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950 dark:text-white leading-tight">
                        {tTut.mainTitle}
                        <span className="text-sky-600 dark:text-sky-400">
                            {tTut.titleHighlight}
                        </span>
                    </h1>

                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                        {tTut.subTitle}
                    </p>
                </div>

                {/* 6 步流体弹簧进度导览坞 */}
                <TutorialStepIndicator
                    currentStep={currentStep}
                    completedTasksByStep={completedTasksByStep}
                    onStepClick={navigateToStep}
                />

                {/* 中央主步进容器（方向感知 + GPU transform/opacity + 无障碍降级） */}
                <div className="pt-1">
                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                        <motion.div
                            key={`tutorial-step-${currentStep}`}
                            initial={
                                prefersReducedMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, transform: `translateX(${slideOffset}px)` }
                            }
                            animate={
                                prefersReducedMotion
                                    ? { opacity: 1 }
                                    : { opacity: 1, transform: "translateX(0px)" }
                            }
                            exit={
                                prefersReducedMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, transform: `translateX(${-slideOffset}px)` }
                            }
                            transition={{
                                duration: 0.2,
                                ease: MOTION_EASINGS.snappy,
                            }}
                        >
                            {currentStep === 1 && (
                                <Step1EditorTour
                                    onNext={() => navigateToStep(2)}
                                    completedTaskIds={completedTasksByStep[1] || []}
                                    onCompleteTask={(id) => handleCompleteTask(1, id)}
                                    onCompleteAllTasks={(ids) => handleCompleteAllInStep(1, ids)}
                                />
                            )}

                            {currentStep === 2 && (
                                <Step2PublicationTour
                                    onPrev={() => navigateToStep(1)}
                                    onNext={() => navigateToStep(3)}
                                    completedTaskIds={completedTasksByStep[2] || []}
                                    onCompleteTask={(id) => handleCompleteTask(2, id)}
                                    onCompleteAllTasks={(ids) => handleCompleteAllInStep(2, ids)}
                                />
                            )}

                            {currentStep === 3 && (
                                <Step3DuelTour
                                    onPrev={() => navigateToStep(2)}
                                    onNext={() => navigateToStep(4)}
                                    completedTaskIds={completedTasksByStep[3] || []}
                                    onCompleteTask={(id) => handleCompleteTask(3, id)}
                                    onCompleteAllTasks={(ids) => handleCompleteAllInStep(3, ids)}
                                />
                            )}

                            {currentStep === 4 && (
                                <Step4MessagesTour
                                    onPrev={() => navigateToStep(3)}
                                    onNext={() => navigateToStep(5)}
                                    completedTaskIds={completedTasksByStep[4] || []}
                                    onCompleteTask={(id) => handleCompleteTask(4, id)}
                                    onCompleteAllTasks={(ids) => handleCompleteAllInStep(4, ids)}
                                />
                            )}

                            {currentStep === 5 && (
                                <Step5CreditsTour
                                    onPrev={() => navigateToStep(4)}
                                    onNext={() => navigateToStep(6)}
                                    completedTaskIds={completedTasksByStep[5] || []}
                                    onCompleteTask={(id) => handleCompleteTask(5, id)}
                                    onCompleteAllTasks={(ids) => handleCompleteAllInStep(5, ids)}
                                />
                            )}

                            {currentStep === 6 && (
                                <Step6AiReviewTour
                                    onPrev={() => navigateToStep(5)}
                                    completedTaskIds={completedTasksByStep[6] || []}
                                    onCompleteTask={(id) => handleCompleteTask(6, id)}
                                    onCompleteAllTasks={(ids) => handleCompleteAllInStep(6, ids)}
                                    onOpenCompleteModal={handleFinishGraduation}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* 快捷提示与当前模块真实业务传送条 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-full border-0 bg-white/60 dark:bg-zinc-900/45 backdrop-blur-xl px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-300">
                            Alt + ← / →
                        </span>
                        <span>
                            {isZh
                                ? "支持快捷键切换实训章节 · 您的沙盒进度会自动保存在本地"
                                : "Use Alt + Arrow keys to switch steps · Progress auto-saves"}
                        </span>
                    </div>

                    <Link
                        href={currentModuleConfig.liveRoute}
                        prefetch={false}
                        className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400 hover:underline shrink-0"
                    >
                        <span>
                            {isZh
                                ? currentModuleConfig.liveRouteLabelZh
                                : currentModuleConfig.liveRouteLabelEn}
                        </span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>

            {/* 底部公约与社区快捷入口 */}
            <footer className="relative z-10 text-center pt-8 pb-4 text-xs text-zinc-400 dark:text-zinc-500">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link
                        href="/rules?tab=terms"
                        className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    >
                        {tTut.termsOfService}
                    </Link>
                    <span>·</span>
                    <Link
                        href="/rules?tab=guidelines"
                        className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    >
                        {tTut.communityGuidelines}
                    </Link>
                    <span>·</span>
                    <span>{tTut.communityName}</span>
                </div>
            </footer>

            {/* Apple Liquid Glass 结业认证弹窗 */}
            <TutorialCompleteModal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                completedTasksCount={completedTasksCount}
                totalTasksCount={totalTasksCount}
            />
        </div>
    );
}
