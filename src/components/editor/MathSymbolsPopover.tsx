"use client";

import React, { useState, useMemo } from "react";
import { useEditor } from "novel";
import { Variable, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/math-text";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MathSymbolItem {
    id: string;
    name: string;
    category: "numberTheory" | "analysis" | "sets";
    latex: string;
    description: string;
    keywords: string[];
}

export const MATH_SYMBOLS: MathSymbolItem[] = [
    // 数论核心函数
    {
        id: "mobius",
        name: "莫比乌斯函数",
        category: "numberTheory",
        latex: "\\mu(n)",
        description: "数论反演核心：无平方因子为(-1)^k，否则为0",
        keywords: ["mobius", "mobiwusi", "mu", "莫比乌斯", "数论"],
    },
    {
        id: "euler-phi",
        name: "欧拉函数",
        category: "numberTheory",
        latex: "\\varphi(n)",
        description: "小于等于n且与n互质的正整数个数",
        keywords: ["euler", "phi", "oula", "欧拉", "互质"],
    },
    {
        id: "riemann-zeta",
        name: "黎曼 Zeta 函数",
        category: "numberTheory",
        latex: "\\zeta(s)",
        description: "解析数论核心：\\sum_{n=1}^\\infty n^{-s}",
        keywords: ["riemann", "zeta", "liman", "黎曼", "zeta函数"],
    },
    {
        id: "divisor-count",
        name: "约数个数函数",
        category: "numberTheory",
        latex: "d(n)",
        description: "n的正因数个数，常用符号 d(n) 或 \\tau(n)",
        keywords: ["divisor", "tau", "yueshu", "约数", "因数"],
    },
    {
        id: "divisor-sum",
        name: "约数和函数",
        category: "numberTheory",
        latex: "\\sigma(n)",
        description: "n的所有正因数之和，推广形式 \\sigma_k(n)",
        keywords: ["sigma", "yueshuhe", "约数和"],
    },
    {
        id: "mangoldt",
        name: "冯·芒戈尔特函数",
        category: "numberTheory",
        latex: "\\Lambda(n)",
        description: "当n=p^k时为ln p，其余情况为0",
        keywords: ["mangoldt", "lambda", "manggeerte", "芒戈尔特"],
    },
    {
        id: "legendre",
        name: "勒让德符号",
        category: "numberTheory",
        latex: "\\left(\\frac{a}{p}\\right)",
        description: "二次剩余判别符号，若a是模p二次剩余则为1",
        keywords: ["legendre", "jacobi", "lerangde", "勒让德", "二次剩余"],
    },
    {
        id: "dirichlet-char",
        name: "狄利克雷特征",
        category: "numberTheory",
        latex: "\\chi(n)",
        description: "模m的完全积性周期算术函数",
        keywords: ["dirichlet", "chi", "dilikeli", "狄利克雷"],
    },

    // 分析与微积分特殊函数
    {
        id: "gamma",
        name: "伽马函数",
        category: "analysis",
        latex: "\\Gamma(z)",
        description: "复数域上阶乘的解析延拓：\\Gamma(n)=(n-1)!",
        keywords: ["gamma", "jiama", "伽马", "阶乘"],
    },
    {
        id: "dirac-delta",
        name: "狄拉克 Delta",
        category: "analysis",
        latex: "\\delta(x)",
        description: "广义函数/冲激函数，积分为1",
        keywords: ["dirac", "delta", "dilake", "狄拉克", "冲激"],
    },
    {
        id: "binomial",
        name: "二项式系数",
        category: "analysis",
        latex: "\\binom{n}{k}",
        description: "从n个元素中选取k个的组合数",
        keywords: ["binomial", "combination", "erxiangshi", "二项式", "组合数"],
    },
    {
        id: "summation",
        name: "求和式",
        category: "analysis",
        latex: "\\sum_{i=1}^{n}",
        description: "离散变量累加求和记号",
        keywords: ["sum", "qiuhe", "求和", "sigma"],
    },
    {
        id: "product",
        name: "连乘积",
        category: "analysis",
        latex: "\\prod_{i=1}^{n}",
        description: "离散序列累乘记号",
        keywords: ["prod", "product", "liancheng", "连乘"],
    },
    {
        id: "integral",
        name: "定积分",
        category: "analysis",
        latex: "\\int_{a}^{b} f(x)\\,dx",
        description: "黎曼/勒贝格定积分式",
        keywords: ["integral", "jifen", "积分"],
    },
    {
        id: "limit",
        name: "极限式",
        category: "analysis",
        latex: "\\lim_{x \\to 0}",
        description: "自变量趋向特定值时的极限",
        keywords: ["limit", "jixian", "极限"],
    },

    // 常用学术集合与逻辑
    {
        id: "real-set",
        name: "实数集",
        category: "sets",
        latex: "\\mathbb{R}",
        description: "全体实数集合",
        keywords: ["real", "set", "shishu", "实数"],
    },
    {
        id: "complex-set",
        name: "复数集",
        category: "sets",
        latex: "\\mathbb{C}",
        description: "全体复数集合",
        keywords: ["complex", "fushu", "复数"],
    },
    {
        id: "integer-set",
        name: "整数集",
        category: "sets",
        latex: "\\mathbb{Z}",
        description: "全体正负整数及零集合",
        keywords: ["integer", "zhengshu", "整数"],
    },
    {
        id: "natural-set",
        name: "自然数集",
        category: "sets",
        latex: "\\mathbb{N}",
        description: "全体非负整数/正整数集合",
        keywords: ["natural", "ziranshu", "自然数"],
    },
    {
        id: "forall-exists",
        name: "全称与存在量词",
        category: "sets",
        latex: "\\forall x \\in S, \\; \\exists y",
        description: "任意与存在数学命题表述",
        keywords: ["forall", "exists", "liangci", "量词", "全称", "存在"],
    },
];

const CATEGORIES = [
    { id: "all", label: "全部" },
    { id: "numberTheory", label: "数论函数" },
    { id: "analysis", label: "分析与特殊" },
    { id: "sets", label: "集合与逻辑" },
];

export function MathSymbolsPopover() {
    const { editor } = useEditor();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    // 过滤数学符号
    const filteredSymbols = useMemo(() => {
        return MATH_SYMBOLS.filter((item) => {
            const matchesCategory =
                activeCategory === "all" || item.category === activeCategory;
            if (!matchesCategory) return false;

            if (!search.trim()) return true;

            const q = search.toLowerCase().trim();
            return (
                item.name.toLowerCase().includes(q) ||
                item.latex.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.keywords.some((k) => k.toLowerCase().includes(q))
            );
        });
    }, [search, activeCategory]);

    // 插入符号到编辑器
    const handleInsert = (item: MathSymbolItem) => {
        if (!editor) return;

        // 统一包裹为行内数学公式语法
        const formulaContent = `$${item.latex}$ `;
        editor.chain().focus().insertContent(formulaContent).run();

        toast.success(`已插入 ${item.name}`, {
            description: `$${item.latex}$`,
            duration: 1500,
        });

        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all",
                                open
                                    ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200"
                                    : "text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-transparent hover:border-violet-200 dark:hover:border-violet-800/60"
                            )}
                        >
                            <Variable size={13} className="text-violet-500" />
                            <span>数学函数</span>
                        </button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    一键插入莫比乌斯函数、欧拉函数、Zeta 函数等数论与数学符号
                </TooltipContent>
            </Tooltip>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-[360px] sm:w-[420px] p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-xl space-y-3 z-50"
            >
                {/* 顶部标题与搜索框 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            <Sparkles size={13} className="text-violet-500" />
                            <span>数学函数与符号面板</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                            点击直接插入 LaTeX 公式
                        </span>
                    </div>

                    <div className="relative">
                        <Search
                            size={13}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="搜索函数名、符号如：莫比乌斯、欧拉、mu、zeta..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 dark:bg-zinc-900/80 border border-border/70 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-muted-foreground"
                            autoFocus
                        />
                    </div>

                    {/* 分类切换 Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-2 py-0.5 text-[11px] rounded-md transition-colors whitespace-nowrap shrink-0",
                                    activeCategory === cat.id
                                        ? "bg-violet-600 text-white font-medium shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 符号列表区域 */}
                <div className="max-h-[280px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {filteredSymbols.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            未匹配到数学函数或符号
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {filteredSymbols.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleInsert(item)}
                                    className="flex items-center gap-2.5 p-2 rounded-xl border border-border/50 hover:border-violet-300 dark:hover:border-violet-700 bg-muted/20 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 text-left transition-all group"
                                >
                                    {/* 真实的 KaTeX 公式预览渲染 */}
                                    <div className="w-12 h-10 shrink-0 rounded-lg bg-background border border-border/60 flex items-center justify-center text-sm font-serif overflow-hidden group-hover:scale-105 transition-transform text-violet-700 dark:text-violet-300">
                                        <MathText text={`$${item.latex}$`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                                {item.name}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate">
                                            {item.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
