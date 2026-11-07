"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import {
    Award,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    PenTool,
    LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";
import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens";

interface TutorialCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    completedTasksCount?: number;
    totalTasksCount?: number;
}

export function TutorialCompleteModal({
    isOpen,
    onClose,
    completedTasksCount = 18,
    totalTasksCount = 18,
}: TutorialCompleteModalProps) {
    const { t, isZh } = useI18n();
    const prefersReducedMotion = useReducedMotion();
    const tModal = t.tutorials.completeModal;

    useEffect(() => {
        if (!isOpen || prefersReducedMotion) return;

        const end = Date.now() + 1400;
        const colors = ["#0ea5e9", "#f59e0b", "#10b981", "#38bdf8", "#fbbf24"];

        let rafId = 0;
        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.72 },
                colors,
                zIndex: 9999,
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.72 },
                colors,
                zIndex: 9999,
            });

            if (Date.now() < end) {
                rafId = requestAnimationFrame(frame);
            }
        };
        rafId = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafId);
    }, [isOpen, prefersReducedMotion]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-md p-0 overflow-visible bg-transparent border-0 shadow-none outline-none"
            >
                <motion.div
                    onMouseMove={trackPointer120fps}
                    initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                    transition={MOTION_SPRINGS.panelPop}
                    className="relative overflow-hidden rounded-3xl border-0 bg-white/88 dark:bg-zinc-900/88 backdrop-blur-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.16)] p-6 sm:p-8 text-center space-y-5"
                >
                    {/* 120fps 纯白光随鼠动物理反射 */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-75 dark:opacity-25"
                        style={{
                            background:
                                "radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.6), transparent 80%)",
                        }}
                    />

                    {/* 琥珀微光荣誉勋章 */}
                    <div className="relative z-10 mx-auto flex h-18 w-18 items-center justify-center rounded-3xl border-0 bg-amber-500/[0.15] text-amber-600 dark:text-amber-400 shadow-[0_8px_28px_rgba(245,158,11,0.24),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_28px_rgba(245,158,11,0.22),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <Award className="h-9 w-9 stroke-[1.75]" />
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full border-0 bg-emerald-500 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                            <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>
                    </div>

                    {/* 标题与认证说明 */}
                    <div className="relative z-10 space-y-2">
                        <span className="inline-flex items-center rounded-full border-0 bg-amber-500/[0.14] text-amber-700 dark:text-amber-300 text-xs font-medium px-3.5 py-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                            {tModal.badge}
                        </span>
                        <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                            {tModal.title}
                        </DialogTitle>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                            {tModal.description}
                        </p>
                    </div>

                    {/* 消融光缝 */}
                    <div className="relative z-10 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 实操成就清单卡片 */}
                    <div className="relative z-10 rounded-2xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] p-4 text-left text-xs space-y-2.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                        <div className="flex items-center justify-between gap-2 text-zinc-900 dark:text-zinc-100 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                <span>{tModal.skillsTitle}</span>
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                {completedTasksCount}/{totalTasksCount} {isZh ? "实操项" : "Tasks"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300 text-[11px] font-medium">
                            <span className="truncate">{tModal.skill1}</span>
                            <span className="truncate">{tModal.skill2}</span>
                            <span className="truncate">{tModal.skill3}</span>
                            <span className="truncate">{tModal.skill4}</span>
                            <span className="truncate">{tModal.skill5}</span>
                            <span className="truncate">{tModal.skill6}</span>
                        </div>
                    </div>

                    {/* 核心黑曜石/白月光行动按钮与快捷路径 */}
                    <div className="relative z-10 space-y-2 pt-1">
                        <Link href="/dashboard" onClick={onClose} className="block w-full">
                            <Button className="w-full h-11 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] gap-2 transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer">
                                <LayoutDashboard className="h-4 w-4" />
                                <span>{tModal.goToDashboard}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>

                        <div className="grid grid-cols-2 gap-2">
                            <Link href="/posts/new" onClick={onClose} className="block">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-9 rounded-full border-0 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-900/[0.045] hover:bg-zinc-900/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] gap-1.5 active:scale-[0.97] cursor-pointer"
                                >
                                    <PenTool className="h-3.5 w-3.5 text-sky-500" />
                                    <span>{isZh ? "撰写首篇论文" : "Write First Paper"}</span>
                                </Button>
                            </Link>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="w-full h-9 rounded-full border-0 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-900/[0.03] hover:bg-zinc-900/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] active:scale-[0.97] cursor-pointer"
                            >
                                {tModal.stayInCamp}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}
