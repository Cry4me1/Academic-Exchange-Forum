"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { bannerGradients } from "@/components/profile/banner-selector";
import { completeOnboarding } from "@/actions/onboarding";
import { ProfileFormData } from "./Step2ProfileQuickStart";
import confetti from "canvas-confetti";
import {
    ArrowLeft,
    Check,
    Loader2,
    Palette,
    Rocket,
    Globe,
    Layers,
    PartyPopper,
    GraduationCap,
    ArrowRight,
    LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { MOTION_SPRINGS } from "@/lib/motion-tokens";
import {
    GLASS,
    PANEL,
    TILE,
    DIVIDER_H,
    REFLEX_GRADIENT,
    REFLEX_LAYER,
    TOP_SEAM,
    SERIF_STACK,
    EASE_SNAPPY,
    trackPointer,
} from "../components/welcome-glass";

interface Step3ThemeStudioProps {
    userId: string;
    profileData: ProfileFormData;
    initialTheme?: string;
    onPrev: () => void;
}

const themeNamesEn: Record<string, string> = {
    default: "Aurora",
    sunset: "Warm Sol",
    ocean: "Deep Blue",
    forest: "Breeze",
    lavender: "Dream",
    midnight: "Deep Space",
    frost: "Ink Frost",
    minimal: "Minimal",
};

/** 完成后自动进入仪表盘的倒计时（秒） */
const AUTO_REDIRECT_SECONDS = 5;

/** 庆祝礼花：低饱和琥珀 / 天青 / 珍珠白，呼应 Liquid Glass 温润光晕 */
const CONFETTI_COLORS = ["#f59e0b", "#fbbf24", "#38bdf8", "#f5f5f4", "#34d399"];

export function Step3ThemeStudio({
    userId: _userId,
    profileData,
    initialTheme = "default",
    onPrev,
}: Step3ThemeStudioProps) {
    const { t, isZh } = useI18n();
    const tStep = t.welcome.step3;

    const [selectedTheme, setSelectedTheme] = useState(initialTheme);
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
    const fireworksTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const router = useRouter();

    const currentGradientObj =
        bannerGradients.find((g) => g.id === selectedTheme) || bannerGradients[0];

    const getThemeName = (gradient: (typeof bannerGradients)[number]) => {
        if (!isZh && themeNamesEn[gradient.id]) {
            return themeNamesEn[gradient.id];
        }
        return gradient.name;
    };

    // 成功后倒计时自动跳转；组件卸载（如用户点击进入教程）时自动清理，避免被强制重定向
    useEffect(() => {
        if (!isSuccess) return;
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isSuccess]);

    useEffect(() => {
        if (isSuccess && countdown === 0) {
            router.push("/dashboard");
            router.refresh();
        }
    }, [isSuccess, countdown, router]);

    // 卸载时停止礼花
    useEffect(() => {
        return () => {
            if (fireworksTimer.current) clearInterval(fireworksTimer.current);
        };
    }, []);

    // 触发盛大多重烟花秀 (Fireworks Cascade)
    const triggerGrandFireworks = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const count = 220;
        const defaults = { origin: { y: 0.65 }, zIndex: 9999, colors: CONFETTI_COLORS };

        function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, { spread: 35, startVelocity: 65 });
        fire(0.2, { spread: 70 });
        fire(0.35, { spread: 120, decay: 0.92, scalar: 1.1 });
        fire(0.1, { spread: 140, startVelocity: 30, decay: 0.94, scalar: 1.3 });
        fire(0.1, { spread: 160, startVelocity: 55 });

        const duration = 2000;
        const animationEnd = Date.now() + duration;

        fireworksTimer.current = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                if (fireworksTimer.current) clearInterval(fireworksTimer.current);
                return;
            }
            const particleCount = 36 * (timeLeft / duration);
            confetti({ particleCount, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: CONFETTI_COLORS, zIndex: 9999 });
            confetti({ particleCount, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: CONFETTI_COLORS, zIndex: 9999 });
        }, 200);
    };

    // 提交完成全部入驻设置
    const handleFinish = async () => {
        setSubmitting(true);
        try {
            const res = await completeOnboarding({
                username: profileData.username,
                avatar_url: profileData.avatar_url,
                gender: profileData.gender,
                country: profileData.country,
                language: profileData.language,
                timezone: profileData.timezone,
                bio: profileData.bio,
                banner_style: selectedTheme,
            });

            if (!res.success) {
                toast.error(res.error || t.common.error);
                setSubmitting(false);
                return;
            }

            setIsSuccess(true);
            triggerGrandFireworks();
            toast.success(tStep.successToast);
        } catch (error: unknown) {
            console.error("完成入驻出错:", error);
            toast.error(t.common.networkError);
            setSubmitting(false);
        }
    };

    const initials = (profileData.username || "U").charAt(0).toUpperCase();

    return (
        <div
            className={cn(
                "fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden bg-[#fafafc] dark:bg-[#07090e]",
                currentGradientObj.class
            )}
        >
            {/* 全局背景氛围高斯光斑（纯白环境光） */}
            <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-white/35 dark:bg-white/[0.06] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-white/25 dark:bg-white/[0.04] rounded-full blur-[110px]" />
            </div>

            {/* 顶栏：返回 + 步骤胶囊 */}
            <header className="relative z-30 mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 pt-5">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || isSuccess}
                    onClick={onPrev}
                    className="group h-9 px-4"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-snappy)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-0.5" />
                    {tStep.backToStep2}
                </Button>

                <div className={cn(GLASS, "hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300")}>
                    <Palette className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                    {tStep.badge}
                </div>
            </header>

            {/* 中央悬浮选择舱 */}
            <main className="relative z-20 flex min-h-[calc(100dvh-76px)] items-center justify-center px-4 sm:px-6 py-8">
                <AnimatePresence mode="wait" initial={false}>
                    {isSuccess ? (
                        /* ============ 成功完成态 ============ */
                        <motion.div
                            key="success-card"
                            initial={{ opacity: 0, transform: "translateY(16px) scale(0.96)" }}
                            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                            transition={MOTION_SPRINGS.panelPop}
                            onMouseMove={trackPointer}
                            className={cn(PANEL, "group/panel w-full max-w-md")}
                        >
                            <span aria-hidden className={TOP_SEAM} />
                            <div aria-hidden className={REFLEX_LAYER} style={{ background: REFLEX_GRADIENT }} />

                            <div className="relative z-10 p-7 sm:p-8 text-center space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, transform: "scale(0.7)" }}
                                    animate={{ opacity: 1, transform: "scale(1)" }}
                                    transition={{ type: "spring", duration: 0.5, bounce: 0.3, delay: 0.12 }}
                                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(245,158,11,0.14)] text-amber-600 dark:text-amber-300 shadow-[0_0_36px_rgba(245,158,11,0.28),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_0_36px_rgba(245,158,11,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                                >
                                    <PartyPopper className="h-7 w-7" />
                                </motion.div>

                                <div className="space-y-2">
                                    <h2
                                        style={{ fontFamily: SERIF_STACK }}
                                        className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 dark:from-amber-200 dark:via-amber-300 dark:to-orange-300"
                                    >
                                        {tStep.welcomeTitle}
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{tStep.welcomeSub}</p>
                                </div>

                                <div className={cn(TILE, "flex items-center gap-3.5 p-3.5 text-left")}>
                                    <Avatar className="size-11 shrink-0 shadow-[0_0_0_3px_rgba(255,255,255,0.9),0_6px_16px_-6px_rgba(0,0,0,0.2)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]">
                                        <AvatarImage src={profileData.avatar_url} alt="头像" className="object-cover" />
                                        <AvatarFallback className="font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {profileData.username || (isZh ? "认证学者" : "Verified Scholar")}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                            {tStep.themeSpace}
                                            {getThemeName(currentGradientObj)}
                                        </p>
                                    </div>
                                    <span aria-hidden className={cn("h-8 w-8 shrink-0 rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]", currentGradientObj.preview)} />
                                </div>

                                <div className="space-y-2.5">
                                    <Button asChild size="lg" className="group w-full h-12">
                                        <Link href="/tutorials">
                                            <GraduationCap className="h-4 w-4" />
                                            {tStep.startTutorialBtn}
                                            <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-snappy)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="w-full h-10">
                                        <Link href="/dashboard">
                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                            {tStep.enterDashboardBtn}
                                        </Link>
                                    </Button>
                                </div>

                                {/* 自动跳转提示（数字等宽，零跳动） */}
                                <p className="text-[11px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500" aria-live="polite">
                                    {tStep.autoRedirect.replace("{s}", String(countdown))}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        /* ============ 主题选择舱 ============ */
                        <motion.div
                            key="theme-studio-card"
                            initial={{ opacity: 0, transform: "translateY(12px) scale(0.98)" }}
                            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                            exit={{ opacity: 0, transform: "translateY(-8px) scale(0.98)", transition: { duration: 0.14, ease: EASE_SNAPPY } }}
                            transition={{ duration: 0.28, ease: EASE_SNAPPY }}
                            onMouseMove={trackPointer}
                            className={cn(PANEL, "group/panel w-full max-w-2xl")}
                        >
                            <span aria-hidden className={TOP_SEAM} />
                            <div aria-hidden className={REFLEX_LAYER} style={{ background: REFLEX_GRADIENT }} />

                            <div className="relative z-10 p-6 sm:p-8 space-y-6">
                                {/* 标题 */}
                                <div className="text-center space-y-2">
                                    <h2
                                        style={{ fontFamily: SERIF_STACK }}
                                        className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                                    >
                                        {tStep.title}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        {tStep.description}
                                    </p>
                                </div>

                                {/* 主题色卡网格 */}
                                <div role="radiogroup" aria-label={tStep.title} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {bannerGradients.map((gradient) => {
                                        const isSelected = selectedTheme === gradient.id;

                                        return (
                                            <button
                                                key={gradient.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => setSelectedTheme(gradient.id)}
                                                className={cn(
                                                    "relative h-20 overflow-hidden rounded-2xl border-0 p-2.5 text-left cursor-pointer outline-none",
                                                    "transition-[transform,box-shadow] duration-200 ease-[var(--ease-out-snappy)] active:scale-[0.97]",
                                                    "focus-visible:ring-[3px] focus-visible:ring-ring/40",
                                                    gradient.preview,
                                                    isSelected
                                                        ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.92),inset_0_1px_1px_rgba(255,255,255,1),0_12px_28px_-8px_rgba(0,0,0,0.32)] -translate-y-0.5"
                                                        : "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.55),0_4px_14px_-6px_rgba(0,0,0,0.18)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5"
                                                )}
                                            >
                                                {/* 顶部玻璃反光 */}
                                                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />

                                                <span className="relative flex h-full flex-col justify-between">
                                                    {/* 选中对勾（绝对定位预留，零布局跳动） */}
                                                    <span className="flex justify-end">
                                                        <span
                                                            aria-hidden
                                                            className={cn(
                                                                "flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)]",
                                                                "transition-[opacity,transform] duration-200 ease-[var(--ease-out-snappy)]",
                                                                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"
                                                            )}
                                                        >
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </span>
                                                    </span>
                                                    <span className="w-fit max-w-full truncate rounded-full bg-white/75 dark:bg-black/35 backdrop-blur-md px-2 py-0.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                                                        {getThemeName(gradient)}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={DIVIDER_H} />

                                {/* 实时学者主页卡片微缩预览 */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between px-1 text-xs">
                                        <span className="flex items-center gap-1.5 font-medium text-zinc-500 dark:text-zinc-400">
                                            <Layers className="h-3.5 w-3.5" />
                                            {tStep.previewCardTitle}
                                        </span>
                                        <span className="font-medium text-amber-700 dark:text-amber-300">
                                            {tStep.currentTheme}
                                            {getThemeName(currentGradientObj)}
                                        </span>
                                    </div>

                                    <div className={cn(TILE, "overflow-hidden")}>
                                        {/* 横幅：主题切换时交叉淡化 */}
                                        <div className="relative h-16">
                                            <AnimatePresence initial={false}>
                                                <motion.div
                                                    key={currentGradientObj.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                                    className={cn("absolute inset-0", currentGradientObj.preview)}
                                                />
                                            </AnimatePresence>
                                            <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                                        </div>

                                        <div className="flex items-end gap-3.5 px-4 pb-4 -mt-7">
                                            <Avatar className="relative size-14 shrink-0 shadow-[0_0_0_3px_rgba(255,255,255,0.95),0_8px_20px_-8px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_3px_rgba(24,24,27,0.9)]">
                                                <AvatarImage src={profileData.avatar_url} alt="头像" className="object-cover" />
                                                <AvatarFallback
                                                    style={{ fontFamily: SERIF_STACK }}
                                                    className="text-xl font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                                >
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0 flex-1 space-y-1 pt-8">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                                        {profileData.username || (isZh ? "学者用户" : "Scholar User")}
                                                    </p>
                                                    {profileData.country && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900/[0.05] dark:bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                                                            <Globe className="h-2.5 w-2.5" />
                                                            {profileData.country}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                    {profileData.bio || tStep.unfilledBio}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 最终提交启动按钮 */}
                                <Button
                                    size="lg"
                                    disabled={submitting}
                                    onClick={handleFinish}
                                    className="group w-full h-12 text-sm"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {tStep.finishingButton}
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-snappy)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5" />
                                            {tStep.finishButton}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
