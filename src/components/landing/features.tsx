"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpRight, Eye, MessageSquare } from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import {
    formatAuthorTitle,
    localizeTag,
    type ShowcaseItem,
} from "@/lib/landing-showcase";
import { DIVIDER_H, EASE_OUT_EXPO, GLASS, SERIF_STACK, trackPointer } from "./liquid-glass";

const MIN_TRACK_ITEMS = 6;

/** 第二排：真实平台核心能力（每一张卡片均对应真实路由与已上线能力） */
function buildCapabilityItems(isZh: boolean): ShowcaseItem[] {
    return [
        {
            id: "cap-katex",
            href: "/dashboard",
            tags: [isZh ? "排版引擎 · 实时数学" : "Typesetting · Live Math"],
            title: isZh
                ? "毫秒级 KaTeX 符号公式解析与交互推导"
                : "Millisecond KaTeX Formula Parsing & Live Derivation",
            highlight: isZh
                ? "原生支持行内与跨行张量公式排版，搭配符号面板即写即显"
                : "Seamless inline and block tensor typesetting with interactive symbol palette",
            latex: "$$\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}$$",
            symbol: "\\nabla",
            author: {
                name: isZh ? "KaTeX 排版引擎" : "KaTeX Engine",
                institution: "Scholarly Typesetting",
            },
        },
        {
            id: "cap-sandbox",
            href: "/lab/sandbox",
            tags: [isZh ? "计算实验室 · 代码环境" : "Compute Lab · Sandbox"],
            title: isZh
                ? "50+ 语言语法高亮与 Python 在线计算沙盒"
                : "50+ Language Highlighting & Python Compute Sandbox",
            highlight: isZh
                ? "One Dark 代码高亮搭配 Python 实验沙盒与结果缓存复现"
                : "One Dark syntax highlighting paired with reproducible Python execution",
            codeSnippet:
                "def kl_divergence(p, q):\n    ratio = np.clip(p / (q + 1e-9), 1e-9, None)\n    return float(np.sum(p * np.log(ratio)))",
            symbol: "\\lambda",
            author: {
                name: isZh ? "计算实验室" : "Compute Sandbox",
                institution: "Scholarly Lab",
            },
        },
        {
            id: "cap-backlinks",
            href: "/trending",
            tags: [isZh ? "知识拓扑 · 文献脉络" : "Knowledge Graph · Backlinks"],
            title: isZh
                ? "双向文章反向引用 (Backlinks) 与知识关联"
                : "Bidirectional Backlinks & Knowledge Graph",
            highlight: isZh
                ? "通过 [[WikiLink]] 自动织就跨帖子与专栏的学科引用网络"
                : "Automatically weaves cross-post citation graphs via [[WikiLink]] references",
            latex: "$$\\text{Sim}(u, v) = \\frac{|\\Gamma(u) \\cap \\Gamma(v)|}{\\sqrt{|\\Gamma(u)| \\cdot |\\Gamma(v)|}}$$",
            symbol: "\\Delta",
            author: {
                name: isZh ? "织网知识图谱" : "Knowledge Graph",
                institution: "Scholarly Graph",
            },
        },
        {
            id: "cap-duel",
            href: "/duels",
            tags: [isZh ? "学术决斗场 · 同行声誉" : "Academic Duels · Reputation"],
            title: isZh
                ? "围绕命题展开严谨交锋的学术决斗与声誉体系"
                : "Structured Proposition Duels & Peer Reputation",
            highlight: isZh
                ? "以有据可查的逻辑辩难与同行评审沉淀真实学术声誉"
                : "Cultivates verifiable scholarly reputation through structured peer debate",
            latex: "$$\\mathcal{R}_{u} = \\sum_{p \\in \\mathcal{P}_u} \\alpha_p \\cdot \\log(1 + w_p)$$",
            symbol: "\\alpha",
            author: {
                name: isZh ? "学术决斗仲裁组" : "Duel Arbitration",
                institution: "Scholarly Duels",
            },
        },
        {
            id: "cap-interactive",
            href: "/lab",
            tags: [isZh ? "交互教具 · 可视化推演" : "Interactive · Visualization"],
            title: isZh
                ? "交互式算法步进器与三维立体几何实时画板"
                : "Interactive Algorithm Stepper & 3D Solid Geometry",
            highlight: isZh
                ? "在文章内单步追踪指针变量变化，自由旋转剖视三维几何体"
                : "Step through pointer state transitions and inspect 3D geometry inline",
            latex: "$$V - E + F = \\chi(\\mathcal{M}) = 2$$",
            symbol: "\\Omega",
            author: {
                name: isZh ? "交互推演引擎" : "Interactive Engine",
                institution: "Scholarly Studio",
            },
        },
    ];
}

function CardAuthorAvatar({
    avatarUrl,
    name,
}: {
    avatarUrl?: string | null;
    name: string;
}) {
    const [failed, setFailed] = useState(false);

    if (avatarUrl && !failed) {
        return (
            <Image
                src={avatarUrl}
                alt={name}
                width={32}
                height={32}
                onError={() => setFailed(true)}
                className="h-8 w-8 shrink-0 rounded-full border-0 object-cover bg-zinc-100 dark:bg-zinc-800 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.12)]"
            />
        );
    }

    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_2px_8px_-2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
            {name.slice(0, 1).toUpperCase()}
        </div>
    );
}

// 单个学术展示卡片（Liquid Glass 面板 + 鼠标物理漫射 + 真实路由跳转）
function AcademicShowcaseCard({
    item,
    isDuplicate,
}: {
    item: ShowcaseItem;
    isDuplicate?: boolean;
}) {
    const { t, isZh } = useI18n();

    const tagLabel =
        item.tags.length > 0
            ? item.tags.map((tag) => localizeTag(tag, isZh)).join(" · ")
            : isZh
              ? "学术研讨"
              : "Academic";

    const authorSubtitle = formatAuthorTitle(
        item.author.institution,
        isZh,
        t.hero.defaultTitle
    );

    const cardBody = (
        <>
            {/* 鼠标跟随的无色镜面反射 */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:group-hover:opacity-25"
                style={{
                    background:
                        "radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.7), transparent 45%)",
                }}
            />

            {/* 头部：学科胶囊 + 符号徽标 */}
            <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="truncate rounded-full px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.10)]">
                    {tagLabel}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.04] dark:bg-white/[0.06] text-sm text-zinc-700 dark:text-amber-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:scale-105">
                    <MathText text={`$${item.symbol}$`} />
                </div>
            </div>

            {/* 标题 + 导语（固定行数槽位） */}
            <div className="relative z-10 mt-4 space-y-1.5">
                <h3
                    style={{ fontFamily: SERIF_STACK }}
                    className="line-clamp-2 min-h-[2.8em] text-[17px] font-semibold leading-[1.4] tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors"
                >
                    <MathText text={item.title} inlineOnly />
                </h3>

                <div className="line-clamp-2 min-h-[2.9em] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {item.highlight ? (
                        <MathText text={item.highlight} inlineOnly />
                    ) : item.stats ? (
                        <span className="inline-flex items-center gap-3 tabular-nums text-zinc-400 dark:text-zinc-500">
                            {item.stats.views > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> {item.stats.views}
                                </span>
                            )}
                            {item.stats.comments > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> {item.stats.comments}
                                </span>
                            )}
                            <span>{isZh ? "社区真实研讨帖" : "Community Post"}</span>
                        </span>
                    ) : null}
                </div>
            </div>

            {/* 核心内容：LaTeX 公式井 / 代码沙盒 / 真实正文摘录 */}
            <div className="relative z-10 flex flex-1 items-center py-4">
                {item.latex ? (
                    <div className="flex min-h-[96px] max-h-[108px] w-full items-center justify-center overflow-hidden rounded-2xl px-3 py-3.5 bg-zinc-900/[0.03] dark:bg-white/[0.04] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                        <MathText
                            text={item.latex}
                            className="max-w-full overflow-x-auto text-xs sm:text-sm text-zinc-800 dark:text-amber-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        />
                    </div>
                ) : item.codeSnippet ? (
                    <div className="w-full overflow-hidden rounded-2xl p-3.5 bg-zinc-950/90 dark:bg-black/50 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-8px_rgba(0,0,0,0.35)]">
                        <pre className="max-h-[92px] overflow-hidden whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-300">
                            {item.codeSnippet}
                        </pre>
                    </div>
                ) : (
                    <div className="flex min-h-[96px] max-h-[108px] w-full items-center rounded-2xl p-3.5 bg-zinc-900/[0.03] dark:bg-white/[0.04] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                        <p className="line-clamp-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                            <MathText
                                text={
                                    item.excerpt ||
                                    (isZh
                                        ? "点击进入阅读完整推导与讨论。"
                                        : "Click to read the full derivation and discussion.")
                                }
                                inlineOnly
                            />
                        </p>
                    </div>
                )}
            </div>

            {/* 底部：真实署名 + 跳转指示 */}
            <div className="relative z-10">
                <div className={DIVIDER_H} />
                <div className="flex items-center justify-between pt-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <CardAuthorAvatar
                            avatarUrl={item.author.avatarUrl}
                            name={item.author.name}
                        />
                        <div className="min-w-0">
                            <div className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                {item.author.name}
                            </div>
                            <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                {authorSubtitle}
                            </div>
                        </div>
                    </div>

                    {item.href && (
                        <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-300 transition-colors duration-300 group-hover:bg-zinc-950/85 group-hover:text-white group-hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:group-hover:bg-white/90 dark:group-hover:text-zinc-950">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const cardClassName = cn(
        GLASS,
        "group relative flex h-[380px] w-[290px] sm:w-[330px] shrink-0 select-none flex-col overflow-hidden rounded-3xl p-6",
        "transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1.5",
        "hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_20px_48px_-12px_rgba(0,0,0,0.12),0_0_32px_-6px_rgba(245,158,11,0.22)]",
        "dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_20px_48px_-12px_rgba(0,0,0,0.7),0_0_32px_-6px_rgba(245,158,11,0.18)]"
    );

    if (item.href) {
        return (
            <Link
                href={item.href}
                tabIndex={isDuplicate ? -1 : undefined}
                onMouseMove={trackPointer}
                className={cardClassName}
            >
                {cardBody}
            </Link>
        );
    }

    return (
        <article onMouseMove={trackPointer} className={cardClassName}>
            {cardBody}
        </article>
    );
}

// 雾透渐隐学术打字机（预留最大宽度，切换词语时零布局跳动，且 SSR / 客户端首帧渲染结构完全一致）
function MistTypewriter() {
    const { isZh } = useI18n();

    const words = isZh
        ? ["探索真理", "沉淀思想", "推导本质", "重构认知", "启迪智慧", "见证突破", "溯源求索", "叩问未知"]
        : [
              "Rigorous Proof",
              "Deep Insights",
              "First Principles",
              "Breakthroughs",
              "Pure Reasoning",
              "Illuminating Wisdom",
              "Exploring Unknowns",
          ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [isZh]);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3600);
        return () => clearInterval(timer);
    }, [words.length]);

    const currentWord = words[index] || words[0];

    return (
        <span className="relative ml-2 inline-grid justify-items-start align-baseline">
            {/* 隐形占位：所有候选词叠放于同一格，撑出最大宽度 */}
            {words.map((w) => (
                <span key={w} aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
                    {w}
                </span>
            ))}

            {/* 琥珀微光晕 */}
            <span
                aria-hidden
                className="pointer-events-none col-start-1 row-start-1 self-end mb-[8%] h-[34%] w-full rounded-full bg-[rgba(245,158,11,0.22)] blur-2xl"
            />

            <span className="col-start-1 row-start-1 whitespace-nowrap text-amber-600 dark:text-amber-300">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={currentWord}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.07 } },
                            exit: {
                                opacity: 0,
                                filter: "blur(10px)",
                                y: -6,
                                transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                            },
                        }}
                        className="inline-block"
                    >
                        {currentWord.split("").map((char, i) => (
                            <motion.span
                                key={i}
                                variants={{
                                    hidden: { opacity: 0, filter: "blur(8px)", y: 8 },
                                    visible: {
                                        opacity: 1,
                                        filter: "blur(0px)",
                                        y: 0,
                                        transition: { duration: 0.45, ease: EASE_OUT_EXPO },
                                    },
                                }}
                                className="inline-block whitespace-pre"
                            >
                                {char}
                            </motion.span>
                        ))}
                    </motion.span>
                </AnimatePresence>
            </span>
        </span>
    );
}

// 跑马灯行：保证单周期不少于 MIN_TRACK_ITEMS 张卡片以铺满超宽屏，并以 3 倍拷贝精确匹配 -33.3333% 位移
function MarqueeRow({
    items,
    direction,
}: {
    items: ShowcaseItem[];
    direction: "left" | "right";
}) {
    const baseItems = useMemo(() => {
        if (items.length === 0) return [];
        const padded: ShowcaseItem[] = [];
        while (padded.length < MIN_TRACK_ITEMS) {
            padded.push(...items);
        }
        return padded;
    }, [items]);

    if (baseItems.length === 0) return null;

    const list = [...baseItems, ...baseItems, ...baseItems];

    return (
        <div
            className={cn(
                "flex w-max py-4 will-change-transform hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]",
                direction === "left" ? "animate-track-left" : "animate-track-right"
            )}
        >
            {list.map((item, idx) => {
                const isDuplicate = idx >= items.length;
                return (
                    <div
                        key={`${direction}-${item.id}-${idx}`}
                        className="pr-5 sm:pr-6"
                        aria-hidden={isDuplicate}
                    >
                        <AcademicShowcaseCard item={item} isDuplicate={isDuplicate} />
                    </div>
                );
            })}
        </div>
    );
}

interface FeaturesProps {
    posts?: ShowcaseItem[];
}

export function Features({ posts = [] }: FeaturesProps) {
    const { t, isZh } = useI18n();
    const capabilityItems = useMemo(() => buildCapabilityItems(isZh), [isZh]);

    return (
        <section className="relative overflow-hidden bg-[#fafafc] py-20 sm:py-24 text-zinc-900 dark:bg-[#07090e] dark:text-zinc-50 transition-colors duration-700">
            {/* 柔和环境光晕（低饱和单色） */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-[480px] w-[960px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-400/[0.10] via-amber-200/[0.04] to-transparent blur-[140px] dark:from-amber-400/[0.08]" />
                <div className="absolute bottom-0 -left-[10%] h-[480px] w-[480px] rounded-full bg-sky-400/[0.06] blur-[160px] dark:bg-sky-500/[0.05]" />
                <div className="absolute bottom-0 -right-[10%] h-[480px] w-[480px] rounded-full bg-amber-400/[0.07] blur-[160px] dark:bg-orange-500/[0.05]" />
            </div>

            {/* 顶部消融光缝：与 Hero 的视觉分隔 */}
            <div className="absolute inset-x-0 top-0 mx-auto max-w-5xl px-6">
                <div className={DIVIDER_H} />
            </div>

            {/* 标题区 */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                className="relative z-10 mx-auto mb-12 max-w-5xl px-6 text-center"
            >
                <div
                    className={cn(
                        GLASS,
                        "mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300"
                    )}
                >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {t.landing.panoramaBadge}
                </div>
                <h2
                    style={{ fontFamily: SERIF_STACK }}
                    className="mb-5 flex flex-wrap items-center justify-center text-3xl font-semibold leading-[1.25] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl md:text-5xl"
                >
                    <span>{t.landing.evolutionTitle}</span>
                    <MistTypewriter />
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg text-pretty">
                    {t.landing.evolutionSubtitle}
                </p>
            </motion.div>

            {/* 双行错向无限跑马灯：上排展示站内真实学术帖子，下排展示平台真实核心能力 */}
            <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                {posts.length > 0 && <MarqueeRow items={posts} direction="left" />}
                <MarqueeRow items={capabilityItems} direction="right" />
            </div>
        </section>
    );
}
