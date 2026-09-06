"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Sparkles, 
    ArrowUpRight, 
    Quote
} from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { useI18n } from "@/i18n/context";

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
        avatarGrad: string;
    };
    accentColor: string;
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
        author: {
            name: "沈知远 教授",
            institution: "高能物理研究所",
            avatarGrad: "from-amber-400 to-orange-600",
        },
        accentColor: "#f59e0b",
    },
    {
        id: "c-top-2",
        tag: "算法设计 · 树结构",
        title: "树链剖分与重链剖分的动态树路径维护",
        highlight: "通过 DFS 序将树上任意路径投影为 O(log n) 段连续区间",
        codeSnippet: "// 重链剖分二次 DFS 确定轻重链与新线段树标号\nvoid dfs2(int u, int t) {\n    dfn[u] = ++tot, top[u] = t;\n    if (son[u]) dfs2(son[u], t);\n    for (int v : G[u]) if (v != son[u]) dfs2(v, v);\n}",
        symbol: "\\mathcal{O}",
        author: {
            name: "李承风 算法导师",
            institution: "算法竞赛研学实验室",
            avatarGrad: "from-emerald-400 to-teal-600",
        },
        accentColor: "#10b981",
    },
    {
        id: "c-top-3",
        tag: "微分流形 · 拓扑学",
        title: "紧致辛流形上的弗洛尔同调与相交几何",
        highlight: "辛拓扑不变量揭示了高维哈密顿系统周期轨道的守恒规律",
        latex: "$$HF_*(L_0, L_1) \\cong H_*(L_0 \\cap L_1)$$",
        symbol: "\\Sigma",
        author: {
            name: "林承宇 博士",
            institution: "应用数学国际中心",
            avatarGrad: "from-cyan-400 to-blue-600",
        },
        accentColor: "#06b6d4",
    },
    {
        id: "c-top-4",
        tag: "凝聚态物理 · 量子物态",
        title: "分数量子反常霍尔效应在魔角石墨烯中的实现",
        highlight: "无外加磁场条件下实现精确量子化霍尔电阻平台的突破",
        latex: "$$\\sigma_{xy} = \\frac{e^2}{h} \\cdot \\mathcal{C}$$",
        symbol: "\\Omega",
        author: {
            name: "顾怀安 教授",
            institution: "量子科学国家重点实验室",
            avatarGrad: "from-purple-400 to-indigo-600",
        },
        accentColor: "#a855f7",
    },
    {
        id: "c-top-5",
        tag: "大模型理论 · 记忆机制",
        title: "超长上下文注意力剪枝与无损记忆边界",
        highlight: "稀疏注意力掩码在保持困惑度不变的前提下降低 70% 显存消耗",
        codeSnippet: "scores = (Q @ K.T) * (d_k ** -0.5)\nmask_attn = sparse_topk(scores, k=64)\ncontext = softmax(mask_attn, dim=-1) @ V",
        symbol: "\\otimes",
        author: {
            name: "Dr. Elena Rostova",
            institution: "Scholarly 智能实验室",
            avatarGrad: "from-rose-400 to-pink-600",
        },
        accentColor: "#f43f5e",
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
        author: {
            name: "KaTeX 核心系统",
            institution: "Scholarly 排版架构",
            avatarGrad: "from-amber-400 to-yellow-600",
        },
        accentColor: "#f59e0b",
    },
    {
        id: "c-bot-2",
        tag: "天体物理 · 相对论",
        title: "双黑洞并合引力波形的高阶多极矩精确拟合",
        highlight: "通过数值相对论波形库校准引力辐射各向异性能量损耗",
        latex: "$$h_+(t) - i h_\\times(t) = \\sum_{l,m} h_{lm}(t)\\,_{-2}Y_{lm}$$",
        symbol: "\\Psi",
        author: {
            name: "Marcus Vance",
            institution: "天体物理观测中心",
            avatarGrad: "from-rose-400 to-red-600",
        },
        accentColor: "#ef4444",
    },
    {
        id: "c-bot-3",
        tag: "知识拓扑 · 文献溯源",
        title: "双向文献反向引用 (Backlinks) 与共引网络",
        highlight: "自动构建跨论文与研讨的学科关联图谱，追溯知识衍生脉络",
        latex: "$$\\text{Similarity}(u, v) = \\frac{|\\Gamma(u) \\cap \\Gamma(v)|}{\\sqrt{|\\Gamma(u)| \\cdot |\\Gamma(v)|}}$$",
        symbol: "\\Delta",
        author: {
            name: "知识图谱服务",
            institution: "Scholarly Graph",
            avatarGrad: "from-cyan-400 to-indigo-600",
        },
        accentColor: "#06b6d4",
    },
    {
        id: "c-bot-4",
        tag: "算法环境 · 代码高亮",
        title: "50+ 编程语言高亮与沙盒代码片段一键运行",
        highlight: "One Dark 现代暗黑主题与行号对齐，专为算法交流打造",
        codeSnippet: "def kl_divergence(p, q):\n    return torch.sum(p * torch.log(p / (q + 1e-9)), dim=-1)",
        symbol: "\\lambda",
        author: {
            name: "算法沙盒团队",
            institution: "Scholarly Sandbox",
            avatarGrad: "from-emerald-400 to-green-600",
        },
        accentColor: "#10b981",
    },
    {
        id: "c-bot-5",
        tag: "声誉体系 · 同行认证",
        title: "基于同行评审与学术贡献度的量化声誉体系",
        highlight: "以严肃学术评价取代娱乐点赞，打造高质量研究者殿堂",
        latex: "$$\\mathcal{R}_{u} = \\sum_{p \\in \\mathcal{P}_u} \\alpha_p \\cdot \\log(1 + \\text{Citations}_p)$$",
        symbol: "\\alpha",
        author: {
            name: "同行评审仲裁组",
            institution: "Scholarly Trust",
            avatarGrad: "from-purple-400 to-amber-500",
        },
        accentColor: "#a855f7",
    },
];

// 单个高端学术展示卡片 (Showcase Card)
function AcademicShowcaseCard({ item }: { item: ShowcaseItem }) {
    return (
        <div className="relative group shrink-0 w-[290px] sm:w-[330px] h-[370px] rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden bg-white/90 dark:bg-zinc-900/85 backdrop-blur-md border border-zinc-200/80 dark:border-white/10 hover:border-orange-500/80 dark:hover:border-amber-400/80 shadow-lg dark:shadow-2xl dark:shadow-black/70 transition-all duration-300 select-none hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/10">
            {/* 顶角弱光晕 */}
            <div
                className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-15 dark:opacity-25 group-hover:opacity-35 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundColor: item.accentColor }}
            />

            {/* 卡片头部：学科分类胶囊 + 学术符号徽标 */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-amber-300 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-amber-400/10 border border-orange-200/80 dark:border-amber-400/20 shadow-2xs">
                        {item.tag}
                    </span>
                    {/* 学术符号徽标 */}
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center border border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-amber-300 group-hover:scale-105 transition-transform shadow-2xs font-serif font-bold text-sm">
                        <MathText text={`$${item.symbol}$`} />
                    </div>
                </div>

                {/* 卡片标题：加粗学术议题，限定 2 行 */}
                <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 leading-snug tracking-tight group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors line-clamp-2">
                    {item.title}
                </h4>
            </div>

            {/* 核心内容展示区（LaTeX 公式盒 vs 代码沙盒） */}
            <div className="relative z-10 my-auto py-1">
                {item.latex && (
                    <div className="py-3 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-white/10 text-center text-zinc-900 dark:text-zinc-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden my-1 shadow-inner flex items-center justify-center">
                        <MathText text={item.latex} className="text-xs sm:text-sm text-zinc-900 dark:text-amber-200 font-serif font-bold max-w-full" />
                    </div>
                )}

                {item.codeSnippet && (
                    <div className="p-3 rounded-xl bg-zinc-950 text-zinc-200 border border-zinc-800 font-mono text-[11px] leading-relaxed overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden my-1 shadow-inner">
                        <pre className="whitespace-pre-wrap font-medium text-emerald-400">{item.codeSnippet}</pre>
                    </div>
                )}

                {!item.latex && !item.codeSnippet && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed my-1 font-normal">
                        <Quote className="w-3.5 h-3.5 text-orange-500 dark:text-amber-400 inline mr-1 opacity-80" />
                        {item.highlight}
                    </div>
                )}
            </div>

            {/* 卡片底部：学者/实验室署名与跳转箭头 */}
            <div className="relative z-10 pt-3 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.author.avatarGrad} flex items-center justify-center text-white font-extrabold text-xs ring-2 ring-orange-400/30 shrink-0 shadow-xs`}>
                        {item.author.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-amber-300 transition-colors truncate">
                            {item.author.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                            {item.author.institution}
                        </div>
                    </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-amber-300 group-hover:bg-orange-500 group-hover:text-white dark:group-hover:bg-amber-400 dark:group-hover:text-zinc-950 transition-all duration-200 shrink-0 ml-2">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
}

// 具有轻柔雾透渐隐意境的学术打字机组件
function MistTypewriter() {
    const { isZh } = useI18n();

    const wordsZh = [
        "探索真理",
        "沉淀思想",
        "推导本质",
        "重构认知",
        "启迪智慧",
        "见证突破",
        "溯源求索",
        "叩问未知",
    ];

    const wordsEn = [
        "Rigorous Proof",
        "Deep Insights",
        "First Principles",
        "Breakthroughs",
        "Pure Reasoning",
        "Illuminating Wisdom",
        "Exploring Unknowns",
    ];

    const words = isZh ? wordsZh : wordsEn;

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3600);
        return () => clearInterval(timer);
    }, [words.length]);

    const currentWord = words[index] || words[0];

    return (
        <span className="inline-flex items-center text-left">
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentWord}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.08,
                            },
                        },
                        exit: {
                            opacity: 0,
                            filter: "blur(12px)",
                            y: -8,
                            scale: 1.04,
                            transition: {
                                duration: 0.55,
                                ease: [0.4, 0, 0.2, 1],
                            },
                        },
                    }}
                    className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-amber-600 dark:from-amber-300 dark:via-orange-300 dark:to-amber-400 inline-block font-black ml-2"
                >
                    {currentWord.split("").map((char, i) => (
                        <motion.span
                            key={i}
                            variants={{
                                hidden: {
                                    opacity: 0,
                                    filter: "blur(8px)",
                                    y: 8,
                                    scale: 0.92,
                                },
                                visible: {
                                    opacity: 1,
                                    filter: "blur(0px)",
                                    y: 0,
                                    scale: 1,
                                    transition: {
                                        duration: 0.45,
                                        ease: [0.22, 1, 0.36, 1],
                                    },
                                },
                            }}
                            className="inline-block"
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

export function Features() {
    const { t } = useI18n();
    const topRowList = [...TOP_ITEMS, ...TOP_ITEMS, ...TOP_ITEMS];
    const bottomRowList = [...BOTTOM_ITEMS, ...BOTTOM_ITEMS, ...BOTTOM_ITEMS];

    return (
        <section className="relative py-24 sm:py-28 overflow-hidden bg-[#fafafc] dark:bg-[#07090e] text-zinc-900 dark:text-zinc-50 transition-colors duration-700">
            {/* === 1. 多层环境光晕 === */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/10 via-purple-500/10 to-transparent blur-[140px] rounded-full dark:from-amber-400/10 dark:via-purple-600/10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 dark:bg-orange-600/10 blur-[150px] rounded-full" />
            </div>

            {/* === 2. 精细微网格线 === */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* === 3. 标题区 === */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 max-w-5xl mx-auto px-6 text-center mb-14"
            >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 dark:bg-zinc-900/80 text-orange-600 dark:text-amber-300 border border-zinc-200/80 dark:border-white/10 mb-4 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {t.landing.panoramaBadge}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-zinc-900 dark:text-zinc-50 flex flex-wrap items-center justify-center">
                    <span>{t.landing.evolutionTitle}</span>
                    <MistTypewriter />
                </h2>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
                    {t.landing.evolutionSubtitle}
                </p>
            </motion.div>

            {/* === 4. 双行错向无限跑马灯 (Dual-row Infinite Marquee) === */}
            <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                {/* 左右两侧渐变羽化遮罩 (兜底) */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#fafafc] dark:from-[#07090e] to-transparent z-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#fafafc] dark:from-[#07090e] to-transparent z-20" />

                {/* 第一行：向左滚动 */}
                <div className="flex gap-5 sm:gap-6 py-2.5 w-max animate-track-left hover:[animation-play-state:paused] will-change-transform">
                    {topRowList.map((item, idx) => (
                        <div key={`top-${item.id}-${idx}`}>
                            <AcademicShowcaseCard item={item} />
                        </div>
                    ))}
                </div>

                {/* 第二行：向右滚动 */}
                <div className="flex gap-5 sm:gap-6 py-2.5 w-max animate-track-right hover:[animation-play-state:paused] will-change-transform mt-3">
                    {bottomRowList.map((item, idx) => (
                        <div key={`bot-${item.id}-${idx}`}>
                            <AcademicShowcaseCard item={item} />
                        </div>
                    ))}
                </div>
            </div>

            {/* === 5. GPU 加速关键帧定义 === */}
            <style jsx>{`
                @keyframes smooth-marquee-left {
                    0% {
                        transform: translate3d(0, 0, 0);
                    }
                    100% {
                        transform: translate3d(-33.333%, 0, 0);
                    }
                }

                @keyframes smooth-marquee-right {
                    0% {
                        transform: translate3d(-33.333%, 0, 0);
                    }
                    100% {
                        transform: translate3d(0, 0, 0);
                    }
                }

                .animate-track-left {
                    animation: smooth-marquee-left 48s linear infinite;
                }

                .animate-track-right {
                    animation: smooth-marquee-right 52s linear infinite;
                }
            `}</style>
        </section>
    );
}
