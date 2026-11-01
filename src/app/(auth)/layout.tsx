"use client";

import { UserCount } from "@/components/UserCount";
import { FloatingGlyphs } from "@/components/landing/floating-glyphs";
import {
    DIVIDER_V,
    GLASS,
    SERIF_STACK,
    trackPointer,
} from "@/components/landing/liquid-glass";
import { cn } from "@/lib/utils";
import { MotionConfig, motion } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    Lightbulb,
    MessageSquare,
    Sigma,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const FEATURES = [
    {
        icon: MessageSquare,
        title: "专注学术讨论",
        desc: "同行深度研讨与思辨",
    },
    {
        icon: Sigma,
        title: "支持 LaTeX 公式",
        desc: "毫秒级严谨数学排版",
    },
    {
        icon: BookOpen,
        title: "知识沉淀与分享",
        desc: "结构化专栏与双向链接",
    },
    {
        icon: Lightbulb,
        title: "跨学科交流",
        desc: "连接多元前沿研究领域",
    },
] as const;

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MotionConfig reducedMotion="user">
            <div className="relative min-h-screen-dvh flex flex-col justify-between overflow-x-hidden bg-[#fafafc] dark:bg-[#07090e] transition-colors duration-500">
                {/* === 背景层 1：低饱和温润单色环境微光晕 === */}
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 overflow-hidden z-0"
                >
                    <div className="absolute -top-[16%] left-1/2 -translate-x-1/2 w-[880px] h-[480px] rounded-full bg-gradient-to-b from-amber-400/[0.13] via-amber-200/[0.05] to-transparent blur-[140px] dark:from-amber-400/[0.09]" />
                    <div className="absolute top-1/3 -left-[10%] w-[520px] h-[520px] rounded-full bg-sky-400/[0.07] blur-[150px] dark:bg-sky-500/[0.06]" />
                    <div className="absolute -bottom-[12%] -right-[10%] w-[520px] h-[520px] rounded-full bg-amber-400/[0.08] blur-[150px] dark:bg-orange-500/[0.06]" />
                </div>

                {/* === 背景层 2：景深漂浮学术公式（中心径向消融遮罩，避免干扰阅读） === */}
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-0 opacity-85 motion-reduce:hidden [mask-image:radial-gradient(ellipse_58%_54%_at_50%_50%,transparent_28%,black_82%)]"
                >
                    <FloatingGlyphs />
                </div>

                {/* === 顶部悬浮液态玻璃胶囊导航 === */}
                <header className="relative z-30 w-full pt-5 px-4 sm:px-6">
                    <div className="mx-auto flex max-w-6xl items-center justify-between">
                        <Link
                            href="/"
                            className={cn(
                                GLASS,
                                "inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 transition-transform duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97]"
                            )}
                        >
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
                        </Link>

                        <Link
                            href="/"
                            className={cn(
                                GLASS,
                                "group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-white/85 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60 transition-[transform,background-color,color] duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97]"
                            )}
                        >
                            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
                            <span>返回首页</span>
                        </Link>
                    </div>
                </header>

                {/* === 主体双栏光学场 === */}
                <main className="relative z-10 mx-auto flex flex-1 w-full max-w-6xl items-center justify-center px-4 sm:px-6 py-8 lg:py-12">
                    <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-16">
                        {/* 左侧：学术社区价值主张（桌面端呈现） */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.28,
                                ease: [0.23, 1, 0.32, 1],
                            }}
                            className="hidden lg:flex lg:col-span-6 flex-col justify-center"
                        >
                            {/* 实时学者规模胶囊 */}
                            <div className="mb-7 flex items-center">
                                <div
                                    className={cn(
                                        GLASS,
                                        "inline-flex items-center gap-2.5 rounded-full py-1.5 pl-3.5 pr-4"
                                    )}
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping motion-reduce:animate-none rounded-full bg-emerald-400 opacity-60" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    </span>
                                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                        欢迎加入学术社区
                                    </span>
                                    <span aria-hidden className={DIVIDER_V} />
                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                        已有{" "}
                                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                                            <UserCount />
                                        </span>{" "}
                                        位学者在此交流
                                    </span>
                                </div>
                            </div>

                            {/* 学术衬线主标题 */}
                            <h2
                                style={{ fontFamily: SERIF_STACK }}
                                className="text-4xl xl:text-[3.25rem] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.18] mb-5"
                            >
                                <span className="block">让学术交流</span>
                                <span className="relative mt-1 inline-block">
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-[-4%] bottom-[8%] h-[32%] rounded-full bg-[rgba(245,158,11,0.20)] blur-2xl"
                                    />
                                    <span className="relative bg-clip-text text-transparent bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 dark:from-amber-200 dark:via-amber-300 dark:to-orange-300">
                                        更加精彩
                                    </span>
                                </span>
                            </h2>

                            <p className="text-base leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-md mb-9">
                                加入 Scholarly，与全球学者共同探讨前沿话题，在严谨推导、代码实证与同行交流中分享见解。
                            </p>

                            {/* 无边框三层毛玻璃能力矩阵 */}
                            <div className="grid grid-cols-2 gap-3.5 max-w-lg">
                                {FEATURES.map((feature) => (
                                    <div
                                        key={feature.title}
                                        onMouseMove={trackPointer}
                                        className={cn(
                                            GLASS,
                                            "group/feat relative overflow-hidden rounded-2xl p-4 transition-colors duration-200 hover:bg-white/85 dark:hover:bg-zinc-900/65"
                                        )}
                                    >
                                        <div
                                            aria-hidden
                                            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover/feat:opacity-100 dark:[@media(hover:hover)_and_(pointer:fine)]:group-hover/feat:opacity-25"
                                            style={{
                                                background:
                                                    "radial-gradient(160px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.6), transparent 75%)",
                                            }}
                                        />
                                        <div className="relative z-10 flex items-start gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] text-amber-600 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                                                <feature.icon className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                                                    {feature.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                    {feature.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 右侧：主鉴权液态流光毛玻璃面板（零延迟进场，保障即时输入） */}
                        <div className="w-full lg:col-span-6 flex items-center justify-center lg:justify-end">
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    duration: 0.22,
                                    ease: [0.23, 1, 0.32, 1],
                                }}
                                className="relative w-full max-w-[448px]"
                            >
                                {/* 背部层叠折射景深衬底 */}
                                <div
                                    aria-hidden
                                    className="hidden sm:block pointer-events-none absolute inset-x-3 -bottom-3 top-3 rounded-3xl bg-white/35 dark:bg-zinc-900/25 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04)]"
                                />

                                {/* 主玻璃晶体卡片 */}
                                <div
                                    onMouseMove={trackPointer}
                                    className={cn(
                                        "group/card relative overflow-hidden rounded-3xl border-0 p-6 sm:p-8",
                                        "bg-white/78 dark:bg-zinc-900/62 backdrop-blur-2xl",
                                        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.92),0_24px_64px_-12px_rgba(0,0,0,0.09),0_8px_32px_-4px_rgba(0,0,0,0.05)]",
                                        "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_24px_64px_-12px_rgba(0,0,0,0.65)]"
                                    )}
                                >
                                    {/* 顶部极细物理透光光缝 */}
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/25 to-transparent"
                                    />

                                    {/* 120fps 光随鼠动纯物理无色镜面漫射（仅桌面精确指针激活） */}
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:opacity-100 dark:[@media(hover:hover)_and_(pointer:fine)]:group-hover/card:opacity-22"
                                        style={{
                                            background:
                                                "radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.62), transparent 55%)",
                                        }}
                                    />

                                    {/* 表单主体内容 */}
                                    <div className="relative z-10">
                                        {children}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </main>

                {/* 底部轻量留白占脚（保持居中呼吸感） */}
                <footer className="relative z-10 pb-5 px-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span>Scholarly · 严谨 · 开放 · 同行共创</span>
                </footer>
            </div>
        </MotionConfig>
    );
}
