"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    Braces,
    Compass,
    Eye,
    FlaskConical,
    MessageSquare,
    PenLine,
    Radio,
    Sigma,
    ThumbsUp,
    UserCheck,
    Workflow,
} from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { FloatingGlyphs } from "./floating-glyphs";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { cn } from "@/lib/utils";
import {
    formatAuthorTitle,
    localizeTag,
    type HeroPostItem,
} from "@/lib/landing-showcase";
import { DIVIDER_H, DIVIDER_V, GLASS, OBSIDIAN_CTA, SERIF_STACK } from "./liquid-glass";

export type { HeroPostItem };

const DEFAULT_SNIPPET_ZH = "探讨前沿学术命题，分享严谨推导与研究洞见。";
const DEFAULT_SNIPPET_EN = "Exploring frontier research inquiries with rigorous derivations and peer insights.";
const AUTO_ROTATE_MS = 7000;
const MIN_DISPLAY_USERS = 50;

function formatCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}`;
}

/* ============================================================
 * 作者头像：优先真实头像，加载失败或缺失时回退为琥珀首字母徽章
 * ============================================================ */
function HeroAuthorAvatar({
    avatarUrl,
    username,
}: {
    avatarUrl?: string | null;
    username: string;
}) {
    const [failed, setFailed] = useState(false);

    if (avatarUrl && !failed) {
        return (
            <Image
                src={avatarUrl}
                alt={username}
                width={40}
                height={40}
                onError={() => setFailed(true)}
                className="h-10 w-10 shrink-0 rounded-full border-0 object-cover bg-zinc-100 dark:bg-zinc-800 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_12px_-2px_rgba(0,0,0,0.12)]"
            />
        );
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(245,158,11,0.35)]">
            {(username || "S").slice(0, 1).toUpperCase()}
        </div>
    );
}

/* ============================================================
 * 3D 视差卡片 + 120fps 鼠标物理漫射（DOM 原生写入 CSS 变量）
 * ============================================================ */
function Interactive3DCard({ children }: { children: React.ReactNode }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 180, damping: 22 });
    const mouseYSpring = useSpring(y, { stiffness: 180, damping: 22 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 直接修改 DOM CSS 变量，绕过 React 渲染，保证光斑 120fps 跟随
        el.style.setProperty("--mouse-x", `${mouseX}px`);
        el.style.setProperty("--mouse-y", `${mouseY}px`);

        x.set(mouseX / rect.width - 0.5);
        y.set(mouseY / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
            }}
            className="group relative will-change-transform"
        >
            {children}
        </motion.div>
    );
}

/* ============================================================
 * 能力 / 数据胶囊
 * ============================================================ */
function CapabilityPill({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string;
}) {
    return (
        <div
            className={cn(
                GLASS,
                "inline-flex items-center gap-2 rounded-full pl-2 pr-4 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"
            )}
        >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] text-amber-600 dark:text-amber-300">
                <Icon className="h-3.5 w-3.5" />
            </span>
            {value && (
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {value}
                </span>
            )}
            <span>{label}</span>
        </div>
    );
}

const CONTAINER_VARIANTS = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.04 },
    },
};

const ITEM_VARIANTS = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
    },
};

interface HeroProps {
    postsCount?: number;
    tagsCount?: number;
    usersCount?: number;
    isAuthenticated?: boolean;
    hotTopics?: HeroPostItem[];
}

export function Hero({
    postsCount = 0,
    tagsCount = 0,
    usersCount = 0,
    isAuthenticated = false,
    hotTopics = [],
}: HeroProps) {
    const { t, isZh } = useI18n();
    const tHero = t.hero;

    const [selectedPostIndex, setSelectedPostIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // 仅展示来自数据库的真实学术热帖，不掺入任何虚构专家或假帖子
    const displayPosts = hotTopics.slice(0, 3);
    const safeIndex = selectedPostIndex < displayPosts.length ? selectedPostIndex : 0;
    const currentPost = displayPosts[safeIndex] ?? null;
    const postHref = currentPost ? `/posts/${currentPost.id}` : "/dashboard";

    const primaryHref = isAuthenticated ? "/dashboard" : "/register";
    const primaryLabel = isAuthenticated ? tHero.enterWorkspaceBtn : tHero.exploreBtn;

    // 精选卡片自动轮播（鼠标悬停或键盘聚焦时暂停）
    const goNext = useCallback(() => {
        if (displayPosts.length < 2) return;
        setSelectedPostIndex((i) => (i + 1) % displayPosts.length);
    }, [displayPosts.length]);

    useEffect(() => {
        if (isPaused || displayPosts.length < 2) return;
        const timer = window.setInterval(goNext, AUTO_ROTATE_MS);
        return () => window.clearInterval(timer);
    }, [isPaused, displayPosts.length, goNext]);

    return (
        <section className="relative min-h-[86vh] 2xl:min-h-[84vh] flex items-center justify-center overflow-hidden bg-[#fafafc] dark:bg-[#07090e] transition-colors duration-700">
            {/* === 顶部玻璃胶囊导航 === */}
            <nav className="absolute top-5 inset-x-0 z-30">
                <div className="mx-auto flex max-w-7xl 2xl:max-w-[88rem] items-center justify-between px-6">
                    <Link
                        href="/"
                        className={cn(
                            GLASS,
                            "inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4"
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

                    <div
                        suppressHydrationWarning
                        className={cn(
                            GLASS,
                            "inline-flex items-center gap-1 rounded-full p-1"
                        )}
                    >
                        {isAuthenticated ? (
                            <Link
                                href="/dashboard"
                                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:bg-white/80 dark:text-zinc-200 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                            >
                                {tHero.navWorkspace}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-white/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    {tHero.navExplore}
                                </Link>
                                <Link
                                    href="/login"
                                    className="rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-white/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    {tHero.navLogin}
                                </Link>
                            </>
                        )}
                        <span aria-hidden className={DIVIDER_V} />
                        <LanguageSwitcher variant="toggle" className="p-0.5" />
                    </div>
                </div>
            </nav>

            {/* === 背景层 1：柔和环境光晕（低饱和、单色温润） === */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[960px] h-[540px] rounded-full bg-gradient-to-b from-amber-400/[0.14] via-amber-200/[0.06] to-transparent blur-[140px] dark:from-amber-400/[0.10]" />
                <div className="absolute top-1/3 -left-[12%] w-[560px] h-[560px] rounded-full bg-sky-400/[0.07] blur-[160px] dark:bg-sky-500/[0.06]" />
                <div className="absolute bottom-0 -right-[12%] w-[560px] h-[560px] rounded-full bg-amber-400/[0.08] blur-[160px] dark:bg-orange-500/[0.06]" />
            </div>

            {/* === 背景层 2：景深 LaTeX 公式（中心径向遮罩，四周公式清晰柔和） === */}
            <div className="absolute inset-0 pointer-events-none opacity-90 [mask-image:radial-gradient(ellipse_54%_50%_at_50%_50%,transparent_24%,black_76%)]">
                <FloatingGlyphs />
            </div>

            {/* === 主内容区 === */}
            <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[88rem] mx-auto px-6 pt-28 pb-16 lg:pt-32 lg:pb-20">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-12 2xl:gap-16 items-center">
                    {/* 左侧：价值主张与 CTA */}
                    <motion.div
                        variants={CONTAINER_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-7 text-center lg:text-left"
                    >
                        {/* 社区广播（服务端直出，零数字跳变） */}
                        <motion.div
                            variants={ITEM_VARIANTS}
                            className="mb-8 flex justify-center lg:justify-start"
                        >
                            <div
                                className={cn(
                                    GLASS,
                                    "inline-flex flex-wrap items-center justify-center gap-2 rounded-full px-3.5 py-1.5"
                                )}
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping motion-reduce:animate-none rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    {usersCount >= MIN_DISPLAY_USERS ? (
                                        <>
                                            {tHero.badgePrefix}
                                            <span className="mx-0.5 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                                                {usersCount.toLocaleString()}
                                            </span>
                                            {tHero.badgeSuffix}
                                        </>
                                    ) : (
                                        tHero.badgeFallback
                                    )}
                                </span>
                            </div>
                        </motion.div>

                        {/* 主标题：两行衬线排版，仅关键词施以琥珀微光 */}
                        <motion.h1
                            variants={ITEM_VARIANTS}
                            style={{ fontFamily: SERIF_STACK }}
                            className={cn(
                                "mb-6 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance",
                                isZh
                                    ? "text-5xl sm:text-6xl lg:text-[4.25rem] 2xl:text-[4.75rem] leading-[1.16]"
                                    : "text-4xl sm:text-5xl lg:text-6xl 2xl:text-[4.25rem] leading-[1.1]"
                            )}
                        >
                            <span className="block">{tHero.titleLead}</span>
                            <span className="relative mt-1 inline-block">
                                <span
                                    aria-hidden
                                    className="absolute inset-x-[-4%] bottom-[6%] h-[34%] rounded-full bg-[rgba(245,158,11,0.22)] blur-2xl"
                                />
                                <span className="relative bg-clip-text text-transparent bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 dark:from-amber-200 dark:via-amber-300 dark:to-orange-300">
                                    {tHero.titleAccent}
                                </span>
                            </span>
                        </motion.h1>

                        {/* 副标语 */}
                        <motion.p
                            variants={ITEM_VARIANTS}
                            className="mx-auto lg:mx-0 mb-10 max-w-xl 2xl:max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-500 dark:text-zinc-400 text-pretty"
                        >
                            {tHero.description}
                        </motion.p>

                        {/* 主次 CTA */}
                        <motion.div
                            variants={ITEM_VARIANTS}
                            className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start"
                        >
                            <motion.div
                                whileHover={{ y: -1.5 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                            >
                                <Link
                                    href={primaryHref}
                                    className={cn(
                                        OBSIDIAN_CTA,
                                        "group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full px-7 text-sm font-medium transition-colors"
                                    )}
                                >
                                    {/* 极细物理透光顶缝 */}
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-x-5 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
                                    />
                                    {primaryLabel}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -1.5 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                            >
                                <Link
                                    href={postHref}
                                    className={cn(
                                        GLASS,
                                        "inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-medium text-zinc-800 hover:bg-white/90 dark:text-zinc-200 dark:hover:bg-zinc-800/60 transition-colors"
                                    )}
                                >
                                    <Compass className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                                    {tHero.browseBtn}
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* 能力胶囊：数据量达标才展示统计值，能力文案保持严谨如实 */}
                        <motion.div
                            variants={ITEM_VARIANTS}
                            className="mt-11 flex flex-wrap items-center justify-center lg:justify-start gap-2.5"
                        >
                            {postsCount >= 500 && (
                                <CapabilityPill
                                    icon={BookOpen}
                                    value={formatCount(postsCount)}
                                    label={tHero.statPosts}
                                />
                            )}
                            {tagsCount >= 20 && (
                                <CapabilityPill
                                    icon={FlaskConical}
                                    value={formatCount(tagsCount)}
                                    label={tHero.statTags}
                                />
                            )}
                            <CapabilityPill icon={Sigma} label={tHero.capLatex} />
                            <CapabilityPill icon={Workflow} label={tHero.capMermaid} />
                            <CapabilityPill icon={Braces} label={tHero.capCode} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧：层叠景深真实精选卡片 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-5 relative mx-auto w-full max-w-lg lg:max-w-none"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                    >
                        {/* 背后错位虚化的幽灵卡片，营造层叠纵深 */}
                        <div
                            aria-hidden
                            className="absolute inset-0 translate-x-5 translate-y-6 rotate-[3deg] scale-[0.96] rounded-3xl bg-white/45 dark:bg-zinc-900/30 backdrop-blur-xl blur-[1px] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_8px_32px_-4px_rgba(0,0,0,0.05)]"
                        />
                        <div
                            aria-hidden
                            className="absolute inset-0 -translate-x-4 translate-y-10 -rotate-[2deg] scale-[0.9] rounded-3xl bg-white/30 dark:bg-zinc-900/20 backdrop-blur-lg blur-[2px] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04)]"
                        />

                        <Interactive3DCard>
                            <div
                                className={cn(
                                    "relative overflow-hidden rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl",
                                    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_24px_64px_-12px_rgba(0,0,0,0.12),0_8px_32px_-4px_rgba(0,0,0,0.06)]",
                                    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_24px_64px_-12px_rgba(0,0,0,0.7)]"
                                )}
                            >
                                {/* 鼠标跟随的无色镜面反射光斑 */}
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:group-hover:opacity-30"
                                    style={{
                                        background:
                                            "radial-gradient(420px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.65), transparent 45%)",
                                    }}
                                />

                                {/* 头部：标签 + 分段胶囊切换器 */}
                                <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                        <Radio className="h-3.5 w-3.5 text-emerald-500" />
                                        <span>{tHero.featuredHeader}</span>
                                    </div>

                                    {displayPosts.length > 1 && (
                                        <div className="flex items-center gap-0.5 rounded-full p-1 bg-zinc-900/[0.04] dark:bg-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                            {displayPosts.map((item, idx) => {
                                                const active = safeIndex === idx;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setSelectedPostIndex(idx)}
                                                        className={cn(
                                                            "relative rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                                            active
                                                                ? "text-amber-700 dark:text-amber-300"
                                                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                                        )}
                                                    >
                                                        {active && (
                                                            <motion.span
                                                                layoutId="hero-featured-pill"
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 420,
                                                                    damping: 32,
                                                                }}
                                                                className="absolute inset-0 rounded-full bg-white dark:bg-zinc-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9),0_0_14px_rgba(245,158,11,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_0_14px_rgba(245,158,11,0.22)]"
                                                            />
                                                        )}
                                                        <span className="relative">
                                                            {tHero.featuredTag} {idx + 1}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="relative z-10 px-6">
                                    <div className={DIVIDER_H} />
                                </div>

                                {/* 内容区：固定高度槽位，切换时零布局跳动 */}
                                <div className="relative z-10 p-6">
                                    {currentPost ? (
                                        <>
                                            <AnimatePresence mode="wait" initial={false}>
                                                <motion.div
                                                    key={currentPost.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{
                                                        duration: 0.28,
                                                        ease: [0.22, 1, 0.36, 1],
                                                    }}
                                                    className="space-y-4"
                                                >
                                                    {/* 作者 */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <HeroAuthorAvatar
                                                                avatarUrl={currentPost.author.avatar_url}
                                                                username={
                                                                    currentPost.author.username ||
                                                                    tHero.defaultAuthor
                                                                }
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                                                    <span className="truncate">
                                                                        {currentPost.author.username ||
                                                                            tHero.defaultAuthor}
                                                                    </span>
                                                                    <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                                </div>
                                                                <div className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                                                    {formatAuthorTitle(
                                                                        currentPost.author.special_title,
                                                                        isZh,
                                                                        tHero.defaultTitle
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.12)] shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                                                            {tHero.hotPostTag}
                                                        </span>
                                                    </div>

                                                    {/* 标题（固定两行槽位，支持行内数学公式渲染） */}
                                                    <Link
                                                        href={postHref}
                                                        style={{ fontFamily: SERIF_STACK }}
                                                        className="block min-h-[3.2rem] text-lg font-semibold leading-[1.4] text-zinc-900 dark:text-zinc-50 line-clamp-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                                                    >
                                                        <MathText text={currentPost.title} inlineOnly />
                                                    </Link>

                                                    {/* LaTeX 摘要窗（固定高度） */}
                                                    <div className="h-[8rem] overflow-hidden rounded-2xl p-4 bg-zinc-900/[0.03] dark:bg-white/[0.04] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                                                        <div className="line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                            <MathText
                                                                text={
                                                                    currentPost.snippet ||
                                                                    (isZh
                                                                        ? DEFAULT_SNIPPET_ZH
                                                                        : DEFAULT_SNIPPET_EN)
                                                                }
                                                                inlineOnly
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* 学科标签（固定单行，随语言切换本地化） */}
                                                    <div className="flex h-6 flex-wrap gap-1.5 overflow-hidden">
                                                        {currentPost.tags.slice(0, 3).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-900/[0.04] dark:bg-white/[0.06]"
                                                            >
                                                                # {localizeTag(tag, isZh)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>

                                            <div className={cn(DIVIDER_H, "mt-5")} />

                                            {/* 底部互动指标（仅渲染大于 0 的指标，避免展示尴尬的 0 计数） */}
                                            <div className="flex items-center justify-between pt-4">
                                                <div className="flex items-center gap-4 text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                                                    {currentPost.like_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <ThumbsUp className="h-3.5 w-3.5" />
                                                            {currentPost.like_count}
                                                        </span>
                                                    )}
                                                    {currentPost.comment_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3.5 w-3.5" />
                                                            {currentPost.comment_count}
                                                        </span>
                                                    )}
                                                    {currentPost.view_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3.5 w-3.5" />
                                                            {currentPost.view_count}
                                                        </span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={postHref}
                                                    className="group inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-[rgba(245,158,11,0.12)] transition-colors"
                                                >
                                                    {tHero.readFullPost}
                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        /* 空库诚实态：不伪造任何学者或文章 */
                                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] text-amber-600 dark:text-amber-300">
                                                <PenLine className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3
                                                    style={{ fontFamily: SERIF_STACK }}
                                                    className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                                                >
                                                    {isZh ? "虚位以待首篇研讨" : "Awaiting First Inquiry"}
                                                </h3>
                                                <p className="max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                    {isZh
                                                        ? "发布包含公式推导、算法笔记或学科见解的帖子，即可在此精选呈现。"
                                                        : "Publish notes, derivations, or research insights to feature here."}
                                                </p>
                                            </div>
                                            <Link
                                                href="/posts/new"
                                                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.12)] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
                                            >
                                                {isZh ? "撰写学术笔记" : "Write First Post"}
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Interactive3DCard>
                    </motion.div>
                </div>
            </div>

            {/* 底部柔和过渡 */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#fafafc] dark:from-[#07090e] to-transparent pointer-events-none" />
        </section>
    );
}
