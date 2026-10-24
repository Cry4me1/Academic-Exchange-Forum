"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { DIVIDER_H, EASE_OUT_EXPO, GLASS, SERIF_STACK, trackPointer } from "./liquid-glass";

interface ShowcaseItem {
    id: string;
    tag: string;
    title: string;
    highlight: string;
    latex?: string;
    codeSnippet?: string;
    symbol: string; // 学术符号徽标：如 \Sigma, \otimes, \hbar, \nabla, \Omega 等
    author: {
        name: string;
        institution: string;
    };
}

// 第一排卡片（前沿数学、理论物理与核心理论）
const TOP_ITEMS: ShowcaseItem[] = [
    {
        id: "c-top-1",
        tag: "理论物理 · 弦论与全息",
        title: "量子纠缠的引力对偶与全息时空重构",
        highlight: "纠缠熵的几何测度确立了弯曲时空的微观引力机制",
        latex: "$$S_{\\text{EE}} = \\frac{\\text{Area}(\\gamma_A)}{4G_N}$$",
        symbol: "\\hbar",
        author: { name: "沈知远 教授", institution: "高能物理研究所" },
    },
    {
        id: "c-top-2",
        tag: "算法设计 · 树结构",
        title: "树链剖分与重链剖分的动态树路径维护",
        highlight: "通过 DFS 序将树上任意路径投影为 O(log n) 段连续区间",
        codeSnippet: "// 重链剖分二次 DFS 确定轻重链与新线段树标号\nvoid dfs2(int u, int t) {\n    dfn[u] = ++tot, top[u] = t;\n    if (son[u]) dfs2(son[u], t);\n    for (int v : G[u]) if (v != son[u]) dfs2(v, v);\n}",
        symbol: "\\mathcal{O}",
        author: { name: "李承风 算法导师", institution: "算法竞赛研学实验室" },
    },
    {
        id: "c-top-3",
        tag: "微分流形 · 拓扑学",
        title: "紧致辛流形上的弗洛尔同调与相交几何",
        highlight: "辛拓扑不变量揭示了高维哈密顿系统周期轨道的守恒规律",
        latex: "$$HF_*(L_0, L_1) \\cong H_*(L_0 \\cap L_1)$$",
        symbol: "\\Sigma",
        author: { name: "林承宇 博士", institution: "应用数学国际中心" },
    },
    {
        id: "c-top-4",
        tag: "凝聚态物理 · 量子物态",
        title: "分数量子反常霍尔效应在魔角石墨烯中的实现",
        highlight: "无外加磁场条件下实现精确量子化霍尔电阻平台的突破",
        latex: "$$\\sigma_{xy} = \\frac{e^2}{h} \\cdot \\mathcal{C}$$",
        symbol: "\\Omega",
        author: { name: "顾怀安 教授", institution: "量子科学国家重点实验室" },
    },
    {
        id: "c-top-5",
        tag: "大模型理论 · 记忆机制",
        title: "超长上下文注意力剪枝与无损记忆边界",
        highlight: "稀疏注意力掩码在保持困惑度不变的前提下降低 70% 显存消耗",
        codeSnippet: "scores = (Q @ K.T) * (d_k ** -0.5)\nmask_attn = sparse_topk(scores, k=64)\ncontext = softmax(mask_attn, dim=-1) @ V",
        symbol: "\\otimes",
        author: { name: "Dr. Elena Rostova", institution: "Scholarly 智能实验室" },
    },
];

// 第二排卡片（平台学术工具、排版引擎与学术生态）
const BOTTOM_ITEMS: ShowcaseItem[] = [
    {
        id: "c-bot-1",
        tag: "排版引擎 · 实时数学",
        title: "毫秒级 KaTeX 符号公式解析与交互推导",
        highlight: "支持行内与跨行张量公式无缝排版，数学推导清晰可辨",
        latex: "$$\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}$$",
        symbol: "\\nabla",
        author: { name: "KaTeX 核心系统", institution: "Scholarly 排版架构" },
    },
    {
        id: "c-bot-2",
        tag: "天体物理 · 相对论",
        title: "双黑洞并合引力波形的高阶多极矩精确拟合",
        highlight: "通过数值相对论波形库校准引力辐射各向异性能量损耗",
        latex: "$$h_+(t) - i h_\\times(t) = \\sum_{l,m} h_{lm}(t)\\,_{-2}Y_{lm}$$",
        symbol: "\\Psi",
        author: { name: "Marcus Vance", institution: "天体物理观测中心" },
    },
    {
        id: "c-bot-3",
        tag: "知识拓扑 · 文献溯源",
        title: "双向文献反向引用 (Backlinks) 与共引网络",
        highlight: "自动构建跨论文与研讨的学科关联图谱，追溯知识衍生脉络",
        latex: "$$\\text{Similarity}(u, v) = \\frac{|\\Gamma(u) \\cap \\Gamma(v)|}{\\sqrt{|\\Gamma(u)| \\cdot |\\Gamma(v)|}}$$",
        symbol: "\\Delta",
        author: { name: "知识图谱服务", institution: "Scholarly Graph" },
    },
    {
        id: "c-bot-4",
        tag: "算法环境 · 代码高亮",
        title: "50+ 编程语言高亮与沙盒代码片段一键运行",
        highlight: "One Dark 现代暗黑主题与行号对齐，专为算法交流打造",
        codeSnippet: "def kl_divergence(p, q):\n    return torch.sum(p * torch.log(p / (q + 1e-9)), dim=-1)",
        symbol: "\\lambda",
        author: { name: "算法沙盒团队", institution: "Scholarly Sandbox" },
    },
    {
        id: "c-bot-5",
        tag: "声誉体系 · 同行认证",
        title: "基于同行评审与学术贡献度的量化声誉体系",
        highlight: "以严肃学术评价取代娱乐点赞，打造高质量研究者殿堂",
        latex: "$$\\mathcal{R}_{u} = \\sum_{p \\in \\mathcal{P}_u} \\alpha_p \\cdot \\log(1 + \\text{Citations}_p)$$",
        symbol: "\\alpha",
        author: { name: "同行评审仲裁组", institution: "Scholarly Trust" },
    },
];

// 单个学术展示卡片（Liquid Glass 面板 + 鼠标物理漫射）
function AcademicShowcaseCard({ item }: { item: ShowcaseItem }) {
    return (
        <article
            onMouseMove={trackPointer}
            className={cn(
                GLASS,
                "group relative flex h-[380px] w-[290px] sm:w-[330px] shrink-0 select-none flex-col overflow-hidden rounded-3xl p-6",
                "transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1.5",
                "hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_20px_48px_-12px_rgba(0,0,0,0.12),0_0_32px_-6px_rgba(245,158,11,0.22)]",
                "dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_20px_48px_-12px_rgba(0,0,0,0.7),0_0_32px_-6px_rgba(245,158,11,0.18)]"
            )}
        >
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
                    {item.tag}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.04] dark:bg-white/[0.06] text-sm text-zinc-700 dark:text-amber-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:scale-105">
                    <MathText text={`$${item.symbol}$`} />
                </div>
            </div>

            {/* 标题 + 导语（固定行数槽位） */}
            <div className="relative z-10 mt-4 space-y-1.5">
                <h4
                    style={{ fontFamily: SERIF_STACK }}
                    className="line-clamp-2 min-h-[2.8em] text-[17px] font-semibold leading-[1.4] tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    {item.title}
                </h4>
                <p className="line-clamp-2 min-h-[2.9em] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {item.highlight}
                </p>
            </div>

            {/* 核心内容：LaTeX 公式井 / 代码沙盒 */}
            <div className="relative z-10 flex flex-1 items-center py-4">
                {item.latex && (
                    <div className="flex min-h-[92px] w-full items-center justify-center overflow-x-auto rounded-2xl px-3 py-4 bg-zinc-900/[0.03] dark:bg-white/[0.04] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <MathText
                            text={item.latex}
                            className="max-w-full text-xs sm:text-sm text-zinc-800 dark:text-amber-100"
                        />
                    </div>
                )}

                {item.codeSnippet && (
                    <div className="w-full overflow-hidden rounded-2xl p-3.5 bg-zinc-950/90 dark:bg-black/50 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-8px_rgba(0,0,0,0.35)]">
                        <pre className="max-h-[96px] overflow-hidden whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-300">
                            {item.codeSnippet}
                        </pre>
                    </div>
                )}
            </div>

            {/* 底部：署名 + 跳转 */}
            <div className="relative z-10">
                <div className={DIVIDER_H} />
                <div className="flex items-center justify-between pt-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_2px_8px_-2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                            {item.author.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                {item.author.name}
                            </div>
                            <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                                {item.author.institution}
                            </div>
                        </div>
                    </div>

                    <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-300 transition-colors duration-300 group-hover:bg-zinc-950/85 group-hover:text-white group-hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:group-hover:bg-white/90 dark:group-hover:text-zinc-950">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>
        </article>
    );
}

// 雾透渐隐学术打字机（预留最大宽度，切换词语时零布局跳动）
function MistTypewriter() {
    const { isZh } = useI18n();

    const words = isZh
        ? ["探索真理", "沉淀思想", "推导本质", "重构认知", "启迪智慧", "见证突破", "溯源求索", "叩问未知"]
        : ["Rigorous Proof", "Deep Insights", "First Principles", "Breakthroughs", "Pure Reasoning", "Illuminating Wisdom", "Exploring Unknowns"];

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

// 跑马灯行：每项使用右侧 padding 代替 gap，保证 -33.333% 位移首尾精确衔接无跳帧
function MarqueeRow({ items, direction }: { items: ShowcaseItem[]; direction: "left" | "right" }) {
    const list = [...items, ...items, ...items];
    return (
        <div
            className={cn(
                "flex w-max py-4 will-change-transform hover:[animation-play-state:paused]",
                direction === "left" ? "animate-track-left" : "animate-track-right"
            )}
        >
            {list.map((item, idx) => (
                <div key={`${direction}-${item.id}-${idx}`} className="pr-5 sm:pr-6" aria-hidden={idx >= items.length}>
                    <AcademicShowcaseCard item={item} />
                </div>
            ))}
        </div>
    );
}

export function Features() {
    const { t } = useI18n();

    return (
        <section className="relative overflow-hidden bg-[#fafafc] py-24 sm:py-32 text-zinc-900 dark:bg-[#07090e] dark:text-zinc-50 transition-colors duration-700">
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
                className="relative z-10 mx-auto mb-14 max-w-5xl px-6 text-center"
            >
                <div className={cn(GLASS, "mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300")}>
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

            {/* 双行错向无限跑马灯（两端羽化遮罩） */}
            <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <MarqueeRow items={TOP_ITEMS} direction="left" />
                <MarqueeRow items={BOTTOM_ITEMS} direction="right" />
            </div>
        </section>
    );
}
