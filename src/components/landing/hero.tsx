"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    FlaskConical,
    Sparkles,
    Zap,
    MessageSquare,
    ThumbsUp,
    Eye,
    Compass,
    Tag,
    UserCheck,
    Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserCount } from "@/components/UserCount";
import { MathText } from "@/components/ui/math-text";
import { NeuralBackground } from "./neural-background";
import { FloatingGlyphs } from "./floating-glyphs";
import { Particles } from "@/components/ui/particles";
import { BorderBeam } from "@/components/ui/border-beam";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

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

// 辅助函数：从富文本 JSON 或纯文本中安全提取摘要
function extractSnippet(contentStr?: string): string {
    if (!contentStr) return "探讨前沿学术命题，分享独到研究洞见。";
    try {
        if (contentStr.startsWith("{") || contentStr.startsWith("[")) {
            const parsed = JSON.parse(contentStr);
            const text = getPlainTextFromNode(parsed);
            return text.slice(0, 140) || "探讨前沿学术命题，分享独到研究洞见。";
        }
    } catch {
        // 普通字符串
    }
    return contentStr.replace(/<[^>]*>?/gm, "").slice(0, 140) || "探讨前沿学术命题，分享独到研究洞见。";
}

function getPlainTextFromNode(node: any): string {
    if (!node) return "";
    let text = "";
    if (node.text) text += node.text;
    if (Array.isArray(node.content)) {
        text += node.content.map(getPlainTextFromNode).join(" ");
    } else if (node.content && typeof node.content === "object") {
        text += getPlainTextFromNode(node.content);
    }
    return text;
}

// 3D 悬浮交互视差卡片
function Interactive3DCard({ children }: { children: React.ReactNode }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 180, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 180, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
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
                transformStyle: "preserve-3d",
            }}
            className="relative perspective-1000 transition-all duration-200 ease-out will-change-transform"
        >
            {children}
        </motion.div>
    );
}

// 统计指标项（Linear / Vercel 极简无边框设计）
function StatBadge({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-3.5 px-5 lg:px-6 py-3.5 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-amber-400/10 flex items-center justify-center border border-orange-500/20 dark:border-amber-400/20 text-orange-600 dark:text-amber-400 shadow-xs group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">{value}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{label}</div>
            </div>
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

    // 选中的精选帖子索引
    const [selectedPostIndex, setSelectedPostIndex] = useState(0);

    // 默认学术精选兜底数据（包含树链剖分、量子物理、辛流形）
    const fallbackTopics: HeroPostItem[] = [
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
    ];

    const displayPosts = hotTopics && hotTopics.length > 0 ? hotTopics : fallbackTopics;
    const currentPost = displayPosts[selectedPostIndex] || displayPosts[0];

    const formatCount = (count: number, label: string) => {
        if (count <= 0) return label === "posts" ? "10K+" : "50+";
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
        return `${count}`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1] as const,
            },
        },
    };

    return (
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#fafafc] dark:bg-[#07090e] transition-colors duration-700">
            {/* 顶栏快速切换器 (独立悬浮于 Hero 右上角) */}
            <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
                <LanguageSwitcher variant="toggle" />
            </div>

            {/* === 1. 柔和环境极光与径向渐变光晕 (Radial Ambient Glow) === */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* 顶部中央暖橙与淡紫微弱径向渐变光晕 */}
                <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-gradient-to-b from-amber-500/15 via-purple-500/10 to-transparent blur-[140px] rounded-full dark:from-amber-400/15 dark:via-purple-600/10" />
                {/* 左下紫蓝色光晕 */}
                <div className="absolute top-1/3 -left-[10%] w-[580px] h-[580px] bg-indigo-500/10 dark:bg-indigo-600/12 blur-[150px] rounded-full" />
                {/* 右下暖橙光晕 */}
                <div className="absolute bottom-10 -right-[10%] w-[580px] h-[580px] bg-amber-500/10 dark:bg-orange-600/10 blur-[150px] rounded-full" />
            </div>

            {/* === 2. 神经知识网络 Canvas 动画（鼠标引力互动） === */}
            <NeuralBackground />

            {/* === 3. Magic UI 交互粒子引力层 === */}
            <Particles
                className="absolute inset-0 z-0 pointer-events-none"
                quantity={65}
                ease={70}
                size={0.6}
                color="#f59e0b"
                refresh
            />

            {/* === 4. 浮动 LaTeX 景深学术公式 === */}
            <FloatingGlyphs />

            {/* === 5. 低对比度微网格背景 (Subtle Grid Pattern) === */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* === 6. 主内容区 === */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 lg:py-24">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    
                    {/* 左侧：价值主张与 CTA (7 列) */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="lg:col-span-7 text-center lg:text-left"
                    >
                        {/* 顶部微胶囊：社区广播 + 820 通行码 */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-7"
                        >
                            {/* 实时在线学者广播胶囊 */}
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-xs hover:border-amber-500/40 transition-all duration-300 group cursor-default">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                    {tHero.badgePrefix}
                                    <span className="text-orange-600 dark:text-amber-400 font-bold ml-1">
                                        <UserCount />
                                    </span>
                                    {tHero.badgeSuffix}
                                </span>
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                            </div>

                            {/* 820 邀请码先到先得胶囊 */}
                            <Link
                                href="/invite-820"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-amber-400 border border-orange-500/30 text-xs font-semibold shadow-xs transition-all hover:scale-105"
                            >
                                <span className="text-sm">🎟️</span>
                                <span>{tHero.inviteBanner}</span>
                                <ArrowRight className="w-3 h-3 ml-0.5" />
                            </Link>
                        </motion.div>

                        {/* 品牌 Logo 与品牌名 */}
                        <motion.div
                            variants={itemVariants}
                            className="flex items-center gap-4 mb-4 justify-center lg:justify-start"
                        >
                            <div className="relative p-1 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
                                <Image
                                    src="/logo.png"
                                    alt="Scholarly Logo"
                                    width={56}
                                    height={56}
                                    priority
                                    className="rounded-xl bg-white dark:bg-zinc-950 p-1"
                                />
                            </div>
                            <span className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-900 dark:from-white dark:via-zinc-100 dark:to-zinc-300">
                                Scholarly
                            </span>
                        </motion.div>

                        {/* 主大标题：高对比度排版 */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-[1.15]"
                        >
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 dark:from-amber-300 dark:via-orange-300 dark:to-amber-400">
                                {tHero.subTitle}
                            </span>
                        </motion.h1>

                        {/* 副标语：弱化中性灰，突出学术核心亮点 */}
                        <motion.p
                            variants={itemVariants}
                            className="text-base sm:text-lg max-w-2xl mb-9 leading-relaxed mx-auto lg:mx-0 text-zinc-600 dark:text-zinc-400 font-normal"
                        >
                            {tHero.description}
                        </motion.p>

                        {/* 双操作按钮：主 CTA 与次 CTA */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
                        >
                            <Button
                                asChild
                                size="lg"
                                className="h-12 px-8 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-orange-500/25 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 dark:text-zinc-950 group border-0"
                            >
                                <Link href="/register">
                                    {tHero.exploreBtn}
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-12 px-8 rounded-xl transition-all duration-300 bg-white/80 hover:bg-white text-zinc-800 border-zinc-200/90 shadow-xs dark:bg-zinc-900/60 dark:backdrop-blur-xl dark:border-white/10 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                            >
                                <Link
                                    href={currentPost?.id ? `/posts/${currentPost.id}` : "/dashboard"}
                                    className="flex items-center gap-2"
                                >
                                    <Compass className="w-4 h-4 text-orange-500 dark:text-amber-400" />
                                    {tHero.browseBtn}
                                </Link>
                            </Button>
                        </motion.div>

                        {/* 底部三列数据看板 (Stats Bar) */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-11 inline-flex flex-wrap items-center justify-center lg:justify-start rounded-2xl bg-white/85 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 divide-x divide-zinc-200/80 dark:divide-white/10 shadow-xs"
                        >
                            <StatBadge value={formatCount(postsCount, "posts")} label={tHero.statPosts} icon={BookOpen} />
                            <StatBadge value={formatCount(tagsCount, "tags")} label={tHero.statTags} icon={FlaskConical} />
                            <StatBadge value="99.9%" label={tHero.statUptime} icon={Zap} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧：交互式精选卡片视窗 (5 列，SaaS 极简无边框分段卡片) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.25 }}
                        className="lg:col-span-5 relative"
                    >
                        <Interactive3DCard>
                            <div className="relative rounded-3xl overflow-hidden bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/[0.12] shadow-2xl shadow-zinc-300/40 dark:shadow-black/70">
                                
                                {/* 现代分段指示栏 (Segmented Header Bar，摈弃伪 macOS 圆点) */}
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200/80 dark:border-white/[0.08] bg-zinc-100/60 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                        <span>前沿学术精选</span>
                                    </div>

                                    {/* 分段 Tab 切换器 */}
                                    <div className="flex items-center p-1 rounded-xl bg-zinc-200/70 dark:bg-white/[0.06] text-xs">
                                        {displayPosts.slice(0, 3).map((item, idx) => (
                                            <button
                                                key={item.id || idx}
                                                type="button"
                                                onClick={() => setSelectedPostIndex(idx)}
                                                className={`px-3 py-1 rounded-lg transition-all text-xs font-bold ${
                                                    selectedPostIndex === idx
                                                        ? "bg-white dark:bg-zinc-800 text-orange-600 dark:text-amber-400 shadow-xs"
                                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                                }`}
                                            >
                                                {tHero.featuredTag} {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 视窗学术内容展示 */}
                                <div className="p-6 space-y-4">
                                    {/* 作者与机构信息 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-orange-500/20">
                                                {(currentPost.author?.username || "学者").slice(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                                                    {currentPost.author?.username || tHero.defaultAuthor}
                                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                </div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                                    {currentPost.author?.special_title || tHero.defaultTitle}
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-[11px] font-mono text-orange-600 dark:text-amber-300 font-semibold px-2.5 py-1 rounded-full bg-orange-50 dark:bg-amber-400/10 border border-orange-200 dark:border-amber-400/20">
                                            {tHero.hotPostTag}
                                        </span>
                                    </div>

                                    {/* 学术论文 / 笔记标题 */}
                                    <Link
                                        href={`/posts/${currentPost.id}`}
                                        className="block text-lg font-black text-zinc-900 dark:text-zinc-50 hover:text-orange-600 dark:hover:text-amber-400 transition-colors leading-snug"
                                    >
                                        {currentPost.title}
                                    </Link>

                                    {/* 核心段落与高精度 LaTeX 公式渲染窗 */}
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/10 text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed shadow-inner overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        <MathText text={extractSnippet(currentPost.content)} />
                                    </div>

                                    {/* 学科标签 */}
                                    {currentPost.tags && currentPost.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentPost.tags.slice(0, 3).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08]"
                                                >
                                                    <Tag className="w-2.5 h-2.5 text-orange-500 dark:text-amber-400" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* 底部互动指标与研读全文跳转 */}
                                    <div className="pt-3 border-t border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="w-3.5 h-3.5 text-orange-500" /> {currentPost.like_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> {currentPost.comment_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3.5 h-3.5 text-emerald-500" /> {currentPost.view_count || 0}
                                            </span>
                                        </div>

                                        <Link
                                            href={`/posts/${currentPost.id}`}
                                            className="text-xs font-bold text-orange-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 group"
                                        >
                                            {tHero.readFullPost}
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>

                                </div>

                                {/* Magic UI 3D 卡片流光边框 */}
                                <BorderBeam
                                    size={280}
                                    duration={8}
                                    delay={0}
                                    colorFrom="#f59e0b"
                                    colorTo="#a855f7"
                                    borderWidth={1.5}
                                />
                            </div>
                        </Interactive3DCard>
                    </motion.div>
                </div>
            </div>

            {/* === 7. 底部柔和过渡渐变 === */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafafc] dark:from-[#07090e] to-transparent pointer-events-none" />
        </section>
    );
}
