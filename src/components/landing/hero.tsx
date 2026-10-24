"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
    Radio,
    Sigma,
    ThumbsUp,
    Ticket,
    UserCheck,
    Workflow,
} from "lucide-react";
import { UserCount } from "@/components/UserCount";
import { MathText } from "@/components/ui/math-text";
import { FloatingGlyphs } from "./floating-glyphs";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { DIVIDER_H, DIVIDER_V, GLASS, OBSIDIAN_CTA, SERIF_STACK } from "./liquid-glass";

export interface HeroPostItem {
    id: string;
    title: string;
    content?: string;
    tags?: string[];
    created_at?: string;
    view_count?: number;
    comment_count: number;
    like_count: number;
    author?: {
        id?: string;
        username?: string;
        avatar_url?: string | null;
        special_title?: string;
    };
}

const DEFAULT_SNIPPET = "探讨前沿学术命题，分享独到研究洞见。";
const SNIPPET_MAX = 140;
const AUTO_ROTATE_MS = 7000;

/* ============================================================
 * 内容处理工具
 * ============================================================ */

function getPlainTextFromNode(node: unknown): string {
    if (!node || typeof node !== "object") return "";
    const n = node as { text?: string; content?: unknown };
    let text = n.text ?? "";
    if (Array.isArray(n.content)) {
        text += n.content.map(getPlainTextFromNode).join(" ");
    } else if (n.content && typeof n.content === "object") {
        text += getPlainTextFromNode(n.content);
    }
    return text;
}

/** 从富文本 JSON / HTML / 纯文本中提取原始纯文本（不做截断，不做兜底） */
function extractRawText(contentStr?: string): string {
    if (!contentStr) return "";
    const trimmed = contentStr.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return getPlainTextFromNode(JSON.parse(trimmed)).replace(/\s+/g, " ").trim();
        } catch {
            // 非合法 JSON，按普通字符串处理
        }
    }
    return trimmed.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

function countMatches(text: string, re: RegExp): number {
    return (text.match(re) || []).length;
}

/**
 * LaTeX 安全截断：避免把 \( ... \) / \[ ... \] / $$ ... $$ / $ ... $ 从中间切断，
 * 防止摘要中出现半截公式源码。
 */
function safeTruncate(text: string, max = SNIPPET_MAX): string {
    if (text.length <= max) return text;
    let cut = text.slice(0, max);

    if (countMatches(cut, /\\\(/g) > countMatches(cut, /\\\)/g)) {
        cut = cut.slice(0, cut.lastIndexOf("\\("));
    }
    if (countMatches(cut, /\\\[/g) > countMatches(cut, /\\\]/g)) {
        cut = cut.slice(0, cut.lastIndexOf("\\["));
    }
    if (countMatches(cut, /\$\$/g) % 2 === 1) {
        cut = cut.slice(0, cut.lastIndexOf("$$"));
    }
    const singleDollars = countMatches(cut.replace(/\$\$/g, ""), /\$/g);
    if (singleDollars % 2 === 1) {
        cut = cut.slice(0, cut.lastIndexOf("$"));
    }

    return `${cut.trimEnd()}…`;
}

function extractSnippet(contentStr?: string): string {
    const raw = extractRawText(contentStr);
    return raw ? safeTruncate(raw) : DEFAULT_SNIPPET;
}

/**
 * 首页展示质量门槛：标题需包含足够的可读字符（排除纯公式/符号标题，如 "μ()"），
 * 且正文摘要具备一定长度。
 */
function isPresentable(post: HeroPostItem): boolean {
    const readableTitle = (post.title ?? "").replace(/[\\$(){}\[\]^_\s.,，。·:：;；!！?？\-—'"`~]/g, "");
    if (readableTitle.length < 6) return false;
    return extractRawText(post.content).length >= 24;
}

function formatCount(count: number): string {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}`;
}

/* ============================================================
 * 3D 视差卡片 + 120fps 鼠标物理漫射（DOM 原生写入 CSS 变量）
 * ============================================================ */
function Interactive3DCard({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
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

        if (disabled) return;
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
function CapabilityPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
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
            {value && <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</span>}
            <span>{label}</span>
        </div>
    );
}

interface HeroProps {
    postsCount?: number;
    tagsCount?: number;
    hotTopics?: HeroPostItem[];
}

export function Hero({ postsCount = 0, tagsCount = 0, hotTopics = [] }: HeroProps) {
    const { t, isZh } = useI18n();
    const tHero = t.hero;

    const [selectedPostIndex, setSelectedPostIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // 精心撰写的学术兜底内容（树链剖分、量子物理、辛流形）
    const fallbackTopics: HeroPostItem[] = useMemo(
        () => [
            {
                id: "algo-hld",
                title: isZh ? "树链剖分学习笔记：重链剖分与动态树路径维护" : "Heavy-Light Decomposition: Tree Path Queries and Dynamic Tree Maintenance",
                content: isZh ? "通过 DFS 序将树上路径映射为连续线段，证明任意两点间路径至多跨越 \\(O(\\log n)\\) 条重链，结合线段树实现 \\(O(\\log^2 n)\\) 区间修改与查询。" : "Maps tree paths into contiguous DFS order intervals, proving at most \\(O(\\log n)\\) heavy chains between any nodes, achieving \\(O(\\log^2 n)\\) path updates.",
                tags: isZh ? ["算法设计", "树链剖分", "数据结构"] : ["Algorithms", "HLD", "Data Structures"],
                comment_count: 32,
                like_count: 128,
                view_count: 940,
                author: {
                    username: "Turing_Scholar",
                    special_title: isZh ? "特级算法研究员 · ACM-ICPC" : "Senior Algorithm Fellow",
                },
            },
            {
                id: "physics-1",
                title: isZh ? "关于拓扑绝缘体在超低温下的量子反常霍尔效应研究" : "Quantum Anomalous Hall Effect in Topological Insulators at Millikelvin Temperatures",
                content: isZh ? "实验证实了在无外加强磁场条件下，磁性掺杂拓扑绝缘体薄膜表现出精确量子化的霍尔电阻平台 \\(\\sigma_{xy} = e^2/h\\)。" : "Experimental observation confirms quantized Hall resistance \\(\\sigma_{xy} = e^2/h\\) in magnetically doped topological insulators without external field.",
                tags: isZh ? ["量子物理", "凝聚态", "拓扑"] : ["Quantum", "Condensed Matter", "Topology"],
                comment_count: 18,
                like_count: 64,
                view_count: 520,
                author: {
                    username: "quantum_physicist",
                    special_title: isZh ? "国家杰青 · 高能物理所" : "Senior Fellow · IHEP",
                },
            },
            {
                id: "math-3",
                title: isZh ? "高维紧致辛流形上的弗洛尔同调与全曲率积分" : "Floer Homology and Total Curvature Integrals on Compact Symplectic Manifolds",
                content: isZh ? "结合高斯-博内定理 \\(\\chi(M) = \\frac{1}{2\\pi}\\int_M K\\,dA\\)，给出了非退化辛流形相交数的上同调精确刻画。" : "By synthesizing Gauss-Bonnet theorem \\(\\chi(M) = \\frac{1}{2\\pi}\\int_M K\\,dA\\), establishes intersection homology invariants.",
                tags: isZh ? ["微分几何", "流形", "拓扑"] : ["Differential Geometry", "Manifold", "Topology"],
                comment_count: 14,
                like_count: 47,
                view_count: 360,
                author: {
                    username: "topologist",
                    special_title: isZh ? "应用数学研究员" : "Pure Math Researcher",
                },
            },
        ],
        [isZh]
    );

    // 真实热帖优先，经质量门槛过滤后不足 3 条时以兜底内容补齐
    const displayPosts = useMemo(() => {
        const curated = (hotTopics ?? []).filter(isPresentable).slice(0, 3);
        if (curated.length >= 3) return curated;
        return [...curated, ...fallbackTopics].slice(0, 3);
    }, [hotTopics, fallbackTopics]);

    const safeIndex = selectedPostIndex < displayPosts.length ? selectedPostIndex : 0;
    const currentPost = displayPosts[safeIndex];
    const isFallbackPost = fallbackTopics.some((p) => p.id === currentPost.id);
    const postHref = isFallbackPost ? "/dashboard" : `/posts/${currentPost.id}`;

    // 精选卡片自动轮播（悬停暂停，尊重减弱动效偏好）
    const goNext = useCallback(() => {
        setSelectedPostIndex((i) => (i + 1) % displayPosts.length);
    }, [displayPosts.length]);

    useEffect(() => {
        if (isPaused || displayPosts.length < 2) return;
        const timer = window.setInterval(goNext, AUTO_ROTATE_MS);
        return () => window.clearInterval(timer);
    }, [isPaused, displayPosts.length, goNext]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.09, delayChildren: 0.05 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 18 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
        },
    };

    return (
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#fafafc] dark:bg-[#07090e] transition-colors duration-700">
            {/* === 顶部玻璃胶囊导航 === */}
            <nav className="absolute top-5 inset-x-0 z-30">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
                    <Link
                        href="/"
                        className={cn(GLASS, "inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4")}
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

                    <div className={cn(GLASS, "inline-flex items-center gap-1 rounded-full p-1")}>
                        <Link
                            href="/dashboard"
                            className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-white/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                        >
                            {tHero.navExplore ?? (isZh ? "探索" : "Explore")}
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-white/80 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                        >
                            {tHero.navLogin ?? (isZh ? "登录" : "Sign In")}
                        </Link>
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

            {/* === 背景层 2：景深 LaTeX 公式（中心径向遮罩，避免干扰主内容） === */}
            <div className="absolute inset-0 pointer-events-none opacity-70 [mask-image:radial-gradient(ellipse_at_center,transparent_28%,black_78%)]">
                <FloatingGlyphs />
            </div>

            {/* === 主内容区 === */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-36 lg:pb-28">
                <div className="grid lg:grid-cols-12 gap-14 lg:gap-12 items-center">
                    {/* 左侧：价值主张与 CTA */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-7 text-center lg:text-left"
                    >
                        {/* 社区广播 + 820 通行码（合并为单枚胶囊） */}
                        <motion.div variants={itemVariants} className="mb-8 flex justify-center lg:justify-start">
                            <div className={cn(GLASS, "inline-flex flex-wrap items-center justify-center gap-2 rounded-full py-1.5 pl-3.5 pr-1.5")}>
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    {tHero.badgePrefix}
                                    <span className="mx-0.5 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                                        <UserCount />
                                    </span>
                                    {tHero.badgeSuffix}
                                </span>
                                <span aria-hidden className={DIVIDER_V} />
                                <Link
                                    href="/invite-820"
                                    className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.12)] hover:bg-[rgba(245,158,11,0.2)] shadow-[0_0_16px_rgba(245,158,11,0.18)] transition-colors"
                                >
                                    <Ticket className="h-3.5 w-3.5" />
                                    {tHero.inviteBanner}
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </motion.div>

                        {/* 主标题：两行衬线排版，仅关键词施以琥珀微光 */}
                        <motion.h1
                            variants={itemVariants}
                            style={{ fontFamily: SERIF_STACK }}
                            className={cn(
                                "mb-6 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance",
                                isZh
                                    ? "text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.18]"
                                    : "text-4xl sm:text-5xl lg:text-6xl leading-[1.1]"
                            )}
                        >
                            <span className="block">{tHero.titleLead ?? (isZh ? "纯粹 · 严谨 · 灵动" : "Pure · Rigorous · Dynamic")}</span>
                            <span className="relative mt-1 inline-block">
                                <span
                                    aria-hidden
                                    className="absolute inset-x-[-4%] bottom-[6%] h-[34%] rounded-full bg-[rgba(245,158,11,0.22)] blur-2xl"
                                />
                                <span className="relative bg-clip-text text-transparent bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 dark:from-amber-200 dark:via-amber-300 dark:to-orange-300">
                                    {tHero.titleAccent ?? (isZh ? "学术殿堂" : "Academic Sanctuary")}
                                </span>
                            </span>
                        </motion.h1>

                        {/* 副标语 */}
                        <motion.p
                            variants={itemVariants}
                            className="mx-auto lg:mx-0 mb-10 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-500 dark:text-zinc-400 text-pretty"
                        >
                            {tHero.description}
                        </motion.p>

                        {/* 主次 CTA */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start"
                        >
                            <motion.div
                                whileHover={{ y: -1.5 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                            >
                                <Link
                                    href="/register"
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
                                    {tHero.exploreBtn}
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

                        {/* 能力胶囊：数据量足够时才展示数字，避免小数字削弱可信度 */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-2.5"
                        >
                            {postsCount >= 500 && (
                                <CapabilityPill icon={BookOpen} value={formatCount(postsCount)} label={tHero.statPosts} />
                            )}
                            {tagsCount >= 20 && (
                                <CapabilityPill icon={FlaskConical} value={formatCount(tagsCount)} label={tHero.statTags} />
                            )}
                            <CapabilityPill icon={Sigma} label={tHero.capLatex ?? (isZh ? "LaTeX 原生排版" : "Native LaTeX")} />
                            <CapabilityPill icon={Workflow} label={tHero.capMermaid ?? (isZh ? "Mermaid 拓扑图谱" : "Mermaid Diagrams")} />
                            <CapabilityPill icon={Braces} label={tHero.capCode ?? (isZh ? "多语言代码高亮" : "Code Highlighting")} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧：层叠景深精选卡片 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-5 relative mx-auto w-full max-w-lg lg:max-w-none"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
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
                                        <span>{tHero.featuredHeader ?? (isZh ? "前沿学术精选" : "Frontier Picks")}</span>
                                    </div>

                                    <div className="flex items-center gap-0.5 rounded-full p-1 bg-zinc-900/[0.04] dark:bg-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                        {displayPosts.map((item, idx) => {
                                            const active = safeIndex === idx;
                                            return (
                                                <button
                                                    key={item.id || idx}
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
                                                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
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
                                </div>

                                <div className="relative z-10 px-6">
                                    <div className={DIVIDER_H} />
                                </div>

                                {/* 内容区：固定高度槽位，切换时零布局跳动 */}
                                <div className="relative z-10 p-6">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={currentPost.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                            className="space-y-4"
                                        >
                                            {/* 作者 */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_4px_12px_-2px_rgba(245,158,11,0.35)]">
                                                        {(currentPost.author?.username || "学者").slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                                            {currentPost.author?.username || tHero.defaultAuthor}
                                                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                        </div>
                                                        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                                            {currentPost.author?.special_title || tHero.defaultTitle}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="rounded-full px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.12)] shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                                                    {tHero.hotPostTag}
                                                </span>
                                            </div>

                                            {/* 标题（固定两行槽位） */}
                                            <Link
                                                href={postHref}
                                                style={{ fontFamily: SERIF_STACK }}
                                                className="block min-h-[3.2rem] text-lg font-semibold leading-[1.4] text-zinc-900 dark:text-zinc-50 line-clamp-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                                            >
                                                {currentPost.title}
                                            </Link>

                                            {/* LaTeX 摘要窗（固定高度） */}
                                            <div className="h-[8rem] overflow-hidden rounded-2xl p-4 bg-zinc-900/[0.03] dark:bg-white/[0.04] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                                                <div className="line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                                                    <MathText text={extractSnippet(currentPost.content)} />
                                                </div>
                                            </div>

                                            {/* 学科标签（固定单行） */}
                                            <div className="flex h-6 flex-wrap gap-1.5 overflow-hidden">
                                                {(currentPost.tags ?? []).slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-900/[0.04] dark:bg-white/[0.06]"
                                                    >
                                                        # {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    <div className={cn(DIVIDER_H, "mt-5")} />

                                    {/* 底部互动指标 */}
                                    <div className="flex items-center justify-between pt-4">
                                        <div className="flex items-center gap-4 text-xs font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3.5 w-3.5" /> {currentPost.like_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="h-3.5 w-3.5" /> {currentPost.comment_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3.5 w-3.5" /> {currentPost.view_count || 0}
                                            </span>
                                        </div>

                                        <Link
                                            href={postHref}
                                            className="group inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-[rgba(245,158,11,0.12)] transition-colors"
                                        >
                                            {tHero.readFullPost}
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Interactive3DCard>
                    </motion.div>
                </div>
            </div>

            {/* 底部柔和过渡 */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafafc] dark:from-[#07090e] to-transparent pointer-events-none" />
        </section>
    );
}
