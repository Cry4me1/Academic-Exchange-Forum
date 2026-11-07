"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { StepIndicator } from "./components/StepIndicator";
import { Step1Guidelines } from "./steps/Step1Guidelines";
import { Step2ProfileQuickStart, ProfileFormData } from "./steps/Step2ProfileQuickStart";
import { Step3ThemeStudio } from "./steps/Step3ThemeStudio";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { GLASS, SERIF_STACK, EASE_SNAPPY } from "./components/welcome-glass";

interface WelcomeClientProps {
    userId: string;
    email: string;
    initialData: {
        username: string;
        avatar_url: string;
        gender: string;
        country: string;
        language: string;
        timezone: string;
        bio: string;
        banner_style: string;
        onboarding_completed: boolean;
        terms_accepted_at: string | null;
        onboarding_step: number;
    };
}

/** 步骤切换：方向感知的横向位移（前进自右入，后退自左入） */
const stepVariants = {
    enter: (direction: number) => ({ opacity: 0, transform: `translateX(${direction * 16}px)` }),
    center: { opacity: 1, transform: "translateX(0px)" },
    exit: (direction: number) => ({ opacity: 0, transform: `translateX(${direction * -16}px)` }),
};

export function WelcomeClient({ userId, email, initialData }: WelcomeClientProps) {
    const { t } = useI18n();

    // 初始步骤决策：若已签公约且未完成全部，进入 Step 2，否则进入 Step 1
    const initialStepNumber = initialData.terms_accepted_at ? Math.min(Math.max(initialData.onboarding_step, 2), 3) : 1;
    const [step, setStep] = useState<number>(initialStepNumber);
    const [direction, setDirection] = useState<number>(1);
    const isFirstRender = useRef(true);

    // 暂存用户设置的档案数据
    const [profileData, setProfileData] = useState<ProfileFormData>({
        username: initialData.username || (email ? email.split("@")[0] : ""),
        avatar_url: initialData.avatar_url || "",
        gender: initialData.gender || "",
        country: initialData.country || "中国",
        language: initialData.language || "zh",
        timezone: initialData.timezone || "Asia/Shanghai",
        bio: initialData.bio || "",
    });

    const [bannerStyle] = useState<string>(initialData.banner_style || "default");

    // 步骤切换后回到顶部：避免用户在长条款底部点击后，新步骤出现在视口中段
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, [step]);

    const goTo = (next: number) => {
        setDirection(next > step ? 1 : -1);
        setStep(next);
    };

    // 步骤1完成 -> 步骤2
    const handleStep1Complete = () => goTo(2);

    // 步骤2完成 -> 步骤3
    const handleStep2Complete = (data: ProfileFormData) => {
        setProfileData(data);
        goTo(3);
    };

    // 回退到步骤1
    const handleBackToStep1 = () => goTo(1);

    // 回退到步骤2
    const handleBackToStep2 = () => goTo(2);

    // 如果处于步骤 3：直接渲染全屏沉浸式干净主页与悬浮窗
    if (step === 3) {
        return (
            <MotionConfig reducedMotion="user">
                <Step3ThemeStudio
                    userId={userId}
                    profileData={profileData}
                    initialTheme={bannerStyle}
                    onPrev={handleBackToStep2}
                />
            </MotionConfig>
        );
    }

    return (
        <MotionConfig reducedMotion="user">
            <div className="relative min-h-screen-dvh flex flex-col overflow-x-hidden bg-[#fafafc] dark:bg-[#07090e]">
                {/* 背景：低饱和温润单色环境微光晕 */}
                <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
                    <div className="absolute -top-[16%] left-1/2 -translate-x-1/2 w-[880px] h-[480px] rounded-full bg-gradient-to-b from-amber-400/[0.12] via-amber-200/[0.05] to-transparent blur-[140px] dark:from-amber-400/[0.08]" />
                    <div className="absolute top-1/3 -left-[12%] w-[520px] h-[520px] rounded-full bg-sky-400/[0.07] blur-[150px] dark:bg-sky-500/[0.05]" />
                    <div className="absolute -bottom-[12%] -right-[10%] w-[520px] h-[520px] rounded-full bg-amber-400/[0.07] blur-[150px] dark:bg-orange-500/[0.05]" />
                </div>

                {/* 顶部悬浮胶囊栏：品牌 + 语言切换 */}
                <header className="relative z-30 w-full pt-5 px-4 sm:px-6">
                    <div className="mx-auto flex max-w-4xl items-center justify-between">
                        <div className={cn(GLASS, "inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4")}>
                            <Image
                                src="/logo.png"
                                alt="Scholarly Logo"
                                width={28}
                                height={28}
                                priority
                                className="rounded-full bg-white dark:bg-zinc-950"
                            />
                            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                                Scholarly
                            </span>
                        </div>
                        <LanguageSwitcher variant="toggle" />
                    </div>
                </header>

                <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 pt-8 sm:pt-10 pb-6">
                    {/* 欢迎标题（学术衬线） */}
                    <motion.div
                        initial={{ opacity: 0, transform: "translateY(8px)" }}
                        animate={{ opacity: 1, transform: "translateY(0px)" }}
                        transition={{ duration: 0.28, ease: EASE_SNAPPY }}
                        className="text-center"
                    >
                        <h1
                            style={{ fontFamily: SERIF_STACK }}
                            className="text-3xl sm:text-[2.6rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.2]"
                        >
                            {t.welcome.mainTitle}
                            <span className="relative inline-block">
                                <span
                                    aria-hidden
                                    className="absolute inset-x-[-4%] bottom-[6%] h-[34%] rounded-full bg-[rgba(245,158,11,0.20)] blur-2xl"
                                />
                                <span className="relative bg-clip-text text-transparent bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 dark:from-amber-200 dark:via-amber-300 dark:to-orange-300">
                                    {t.welcome.titleHighlight}
                                </span>
                            </span>
                        </h1>
                        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                            {t.welcome.subTitle}
                        </p>
                    </motion.div>

                    {/* 步骤指示胶囊 */}
                    <div className="mt-7">
                        <StepIndicator currentStep={step} />
                    </div>

                    {/* 步骤内容切换区域 */}
                    <div className="mt-8">
                        <AnimatePresence mode="wait" custom={direction} initial={false}>
                            <motion.div
                                key={`step-${step}`}
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.24, ease: EASE_SNAPPY }}
                            >
                                {step === 1 && <Step1Guidelines onNext={handleStep1Complete} />}
                                {step === 2 && (
                                    <Step2ProfileQuickStart
                                        userId={userId}
                                        initialData={profileData}
                                        onPrev={handleBackToStep1}
                                        onNext={handleStep2Complete}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* 页面极简底栏 */}
                <footer className="relative z-10 pb-6 px-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                    {t.welcome.footer}
                </footer>
            </div>
        </MotionConfig>
    );
}
