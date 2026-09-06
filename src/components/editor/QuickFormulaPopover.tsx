"use client";

import React, { useState, useMemo } from "react";
import { useEditor } from "novel";
import { Sigma, Search, Sparkles, BookOpen, Layers, Grid3X3, Divide } from "lucide-react";
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

export interface FormulaTemplate {
    id: string;
    name: string;
    category: "structure" | "calculus" | "matrix" | "classic" | "symbols";
    latexPreview: string;
    template: string;
    description: string;
    keywords: string[];
}

export const FORMULA_TEMPLATES: FormulaTemplate[] = [
    // ---------- 1. 常用初等结构（适合完全不懂 LaTeX 的新手） ----------
    {
        id: "fraction",
        name: "分数",
        category: "structure",
        latexPreview: "\\frac{a}{b}",
        template: "\\frac{分子}{分母}",
        description: "上下结构分数，点击后双击修改“分子”和“分母”",
        keywords: ["fenshu", "fraction", "分数", "除法", "比值"],
    },
    {
        id: "sqrt",
        name: "二次根号",
        category: "structure",
        latexPreview: "\\sqrt{x}",
        template: "\\sqrt{x}",
        description: "标准平方根号",
        keywords: ["genhao", "sqrt", "root", "根号", "开方"],
    },
    {
        id: "n-sqrt",
        name: "n 次方根",
        category: "structure",
        latexPreview: "\\sqrt[n]{x}",
        template: "\\sqrt[次数]{被开方数}",
        description: "带开方次数的根号",
        keywords: ["genhao", "nsqrt", "n次方根", "开方"],
    },
    {
        id: "superscript",
        name: "幂次方 / 上标",
        category: "structure",
        latexPreview: "x^n",
        template: "{底数}^{指数}",
        description: "上标指数，如平方、n次方",
        keywords: ["shangbiao", "power", "cifang", "上标", "幂", "次方"],
    },
    {
        id: "subscript",
        name: "角标 / 下标",
        category: "structure",
        latexPreview: "x_i",
        template: "{变量}_{下标}",
        description: "序列或变量序号下标，如 x_1, x_i",
        keywords: ["xiabiao", "sub", "下标", "角标", "索引"],
    },
    {
        id: "sub-super",
        name: "上下标组合",
        category: "structure",
        latexPreview: "x_i^2",
        template: "{变量}_{下标}^{指数}",
        description: "同时包含下标与幂指数",
        keywords: ["shangxiabiao", "subsuper", "上下标"],
    },
    {
        id: "abs",
        name: "绝对值",
        category: "structure",
        latexPreview: "|x|",
        template: "|x|",
        description: "数值或变量的绝对值",
        keywords: ["jueduizhi", "abs", "绝对值", "模"],
    },
    {
        id: "norm",
        name: "向量范数",
        category: "structure",
        latexPreview: "\\|\\mathbf{x}\\|",
        template: "\\|\\mathbf{x}\\|",
        description: "双竖线范数记号",
        keywords: ["fanshu", "norm", "范数", "模长"],
    },

    // ---------- 2. 微积分与分析结构 ----------
    {
        id: "definite-integral",
        name: "定积分",
        category: "calculus",
        latexPreview: "\\int_{a}^{b} f(x)\\,dx",
        template: "\\int_{a}^{b} f(x)\\,dx",
        description: "带上下限的定积分式",
        keywords: ["jifen", "integral", "定积分", "积分"],
    },
    {
        id: "indefinite-integral",
        name: "不定积分",
        category: "calculus",
        latexPreview: "\\int f(x)\\,dx",
        template: "\\int f(x)\\,dx",
        description: "不带区间的原函数不定积分",
        keywords: ["budingjifen", "integral", "不定积分"],
    },
    {
        id: "summation",
        name: "求和式 (累加)",
        category: "calculus",
        latexPreview: "\\sum_{i=1}^{n} a_i",
        template: "\\sum_{i=1}^{n} a_i",
        description: "从 1 到 n 的求和式记号",
        keywords: ["qiuhe", "sum", "sigma", "求和", "累加"],
    },
    {
        id: "product",
        name: "连乘积 (累乘)",
        category: "calculus",
        latexPreview: "\\prod_{i=1}^{n} x_i",
        template: "\\prod_{i=1}^{n} x_i",
        description: "从 1 到 n 的累乘积记号",
        keywords: ["liancheng", "product", "连乘", "乘积"],
    },
    {
        id: "limit",
        name: "极限",
        category: "calculus",
        latexPreview: "\\lim_{x \\to 0} \\frac{\\sin x}{x}",
        template: "\\lim_{x \\to 0} f(x)",
        description: "自变量趋向特定值时的极限式",
        keywords: ["jixian", "limit", "极限"],
    },
    {
        id: "partial-derivative",
        name: "偏导数",
        category: "calculus",
        latexPreview: "\\frac{\\partial f}{\\partial x}",
        template: "\\frac{\\partial f}{\\partial x}",
        description: "多元函数偏导数记号",
        keywords: ["piandao", "partial", "偏导", "导数"],
    },

    // ---------- 3. 矩阵与方程组 ----------
    {
        id: "cases-system",
        name: "方程组 / 分段函数",
        category: "matrix",
        latexPreview: "\\begin{cases} x+1 & x > 0 \\\\ x-1 & x \\le 0 \\end{cases}",
        template: "\\begin{cases} 表达式1, & 条件1 \\\\ 表达式2, & 条件2 \\end{cases}",
        description: "左大括号的分段函数或联合方程组",
        keywords: ["fangchengzu", "fenduan", "cases", "分段函数", "方程组"],
    },
    {
        id: "matrix-2x2",
        name: "2×2 矩阵",
        category: "matrix",
        latexPreview: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        template: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        description: "圆括号二阶二维矩阵",
        keywords: ["juzhen", "matrix", "2x2", "矩阵"],
    },
    {
        id: "matrix-3x3",
        name: "3×3 矩阵",
        category: "matrix",
        latexPreview: "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}",
        template: "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}",
        description: "圆括号三阶三维矩阵",
        keywords: ["juzhen", "matrix", "3x3", "三阶矩阵"],
    },
    {
        id: "determinant",
        name: "行列式",
        category: "matrix",
        latexPreview: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",
        template: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",
        description: "竖线方阵行列式记号",
        keywords: ["hanglieshi", "det", "行列式"],
    },
    {
        id: "column-vector",
        name: "列向量",
        category: "matrix",
        latexPreview: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix}",
        template: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix}",
        description: "多维列向量格式",
        keywords: ["xiangliang", "vector", "向量", "列向量"],
    },

    // ---------- 4. 经典科学公式（一键整套插入） ----------
    {
        id: "quadratic-formula",
        name: "一元二次求根公式",
        category: "classic",
        latexPreview: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        template: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        description: "一元二次方程 ax^2+bx+c=0 的通用解析解",
        keywords: ["qiugen", "quadratic", "求根公式", "二次方程"],
    },
    {
        id: "pythagoras",
        name: "勾股定理",
        category: "classic",
        latexPreview: "a^2 + b^2 = c^2",
        template: "a^2 + b^2 = c^2",
        description: "直角三角形三边平方关系",
        keywords: ["gougu", "pythagoras", "勾股定理", "直角三角形"],
    },
    {
        id: "normal-distribution",
        name: "高斯正态分布密度函数",
        category: "classic",
        latexPreview: "f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
        template: "f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
        description: "概率论标准正态分布概率密度",
        keywords: ["zhengtai", "gaussian", "normal", "正态分布", "高斯分布"],
    },
    {
        id: "euler-identity",
        name: "欧拉恒等式",
        category: "classic",
        latexPreview: "e^{i\\pi} + 1 = 0",
        template: "e^{i\\pi} + 1 = 0",
        description: "数学中最优美的五个常数关系式",
        keywords: ["oula", "euler", "欧拉公式", "欧拉恒等式"],
    },
    {
        id: "bayes-theorem",
        name: "贝叶斯条件概率公式",
        category: "classic",
        latexPreview: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        template: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        description: "条件概率推断与先验后验转换核心公式",
        keywords: ["beiyesi", "bayes", "贝叶斯", "条件概率"],
    },
    {
        id: "cauchy-schwarz",
        name: "柯西-施瓦茨不等式",
        category: "classic",
        latexPreview: "\\left(\\sum_{i=1}^n a_i b_i\\right)^2 \\le \\left(\\sum_{i=1}^n a_i^2\\right) \\left(\\sum_{i=1}^n b_i^2\\right)",
        template: "\\left(\\sum_{i=1}^n a_i b_i\\right)^2 \\le \\left(\\sum_{i=1}^n a_i^2\\right) \\left(\\sum_{i=1}^n b_i^2\\right)",
        description: "内积空间中最基本的不等式",
        keywords: ["kexi", "cauchy", "schwarz", "柯西不等式"],
    },
    {
        id: "taylor-series",
        name: "泰勒级数展开式",
        category: "classic",
        latexPreview: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
        template: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
        description: "光滑函数在点 a 处的多项式逼近展开",
        keywords: ["taile", "taylor", "泰勒级数", "泰勒展开"],
    },
];

// 快捷常用希腊与数学符号单字符表
const QUICK_SYMBOLS = [
    { label: "α", latex: "\\alpha" },
    { label: "β", latex: "\\beta" },
    { label: "γ", latex: "\\gamma" },
    { label: "θ", latex: "\\theta" },
    { label: "λ", latex: "\\lambda" },
    { label: "π", latex: "\\pi" },
    { label: "σ", latex: "\\sigma" },
    { label: "ω", latex: "\\omega" },
    { label: "Δ", latex: "\\Delta" },
    { label: "Ω", latex: "\\Omega" },
    { label: "∞", latex: "\\infty" },
    { label: "±", latex: "\\pm" },
    { label: "×", latex: "\\times" },
    { label: "÷", latex: "\\div" },
    { label: "≠", latex: "\\neq" },
    { label: "≈", latex: "\\approx" },
    { label: "≤", latex: "\\le" },
    { label: "≥", latex: "\\ge" },
    { label: "∈", latex: "\\in" },
    { label: "∉", latex: "\\notin" },
];

const CATEGORIES = [
    { id: "all", label: "全部模板" },
    { id: "structure", label: "基础结构 (分数/根号/幂)" },
    { id: "calculus", label: "微积分与求和" },
    { id: "matrix", label: "矩阵与方程组" },
    { id: "classic", label: "经典定理公式" },
];

export function QuickFormulaPopover() {
    const { editor } = useEditor();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    // 过滤模板
    const filteredTemplates = useMemo(() => {
        return FORMULA_TEMPLATES.filter((item) => {
            const matchesCategory =
                activeCategory === "all" || item.category === activeCategory;
            if (!matchesCategory) return false;

            if (!search.trim()) return true;

            const q = search.toLowerCase().trim();
            return (
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.keywords.some((k) => k.toLowerCase().includes(q))
            );
        });
    }, [search, activeCategory]);

    // 插入公式
    const handleInsertFormula = (item: FormulaTemplate) => {
        if (!editor) return;

        const content = `$${item.template}$ `;
        editor.chain().focus().insertContent(content).run();

        toast.success(`已插入公式模板：${item.name}`, {
            description: "已采用标准 LaTeX 格式，双击括号内的文字可直接替换",
            duration: 2000,
        });

        setOpen(false);
    };

    // 插入单个小符号
    const handleInsertSymbol = (symbol: { label: string; latex: string }) => {
        if (!editor) return;

        editor.chain().focus().insertContent(`$${symbol.latex}$ `).run();

        toast.success(`已插入符号 ${symbol.label}`, {
            duration: 1000,
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg transition-all",
                                open
                                    ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                                    : "text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60"
                            )}
                        >
                            <Sigma size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <span>公式模板</span>
                        </button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    无需学习 LaTeX，一键插入分数、根号、矩阵、求和与经典定理公式
                </TooltipContent>
            </Tooltip>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-[380px] sm:w-[480px] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl space-y-3 z-50"
            >
                {/* 顶部标题与新手引导提示 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            <Sparkles size={14} className="text-indigo-500" />
                            <span>零基础公式模板与可视化助手</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            即点即插 · 自动排版
                        </span>
                    </div>

                    {/* 搜索框 */}
                    <div className="relative">
                        <Search
                            size={13}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="搜索公式，如：分数、根号、求根公式、矩阵、求和..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 dark:bg-zinc-900/80 border border-border/70 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-muted-foreground"
                            autoFocus
                        />
                    </div>

                    {/* 常用希腊字母与运算符快速条 */}
                    <div className="pt-1 pb-0.5">
                        <div className="text-[10px] text-muted-foreground mb-1 flex items-center justify-between">
                            <span>常用符号快速点选：</span>
                            <span className="text-[9px]">点按直接写入</span>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                            {QUICK_SYMBOLS.map((s) => (
                                <button
                                    key={s.label}
                                    type="button"
                                    onClick={() => handleInsertSymbol(s)}
                                    title={`插入 ${s.label}`}
                                    className="w-6 h-6 shrink-0 rounded-md bg-muted/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-xs font-serif flex items-center justify-center border border-border/40 hover:border-indigo-300 transition-colors"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 分类切换 Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-border/40">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] rounded-lg transition-colors whitespace-nowrap shrink-0",
                                    activeCategory === cat.id
                                        ? "bg-indigo-600 text-white font-medium shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 公式卡片网格列表 */}
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {filteredTemplates.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            未匹配到相关公式，可尝试搜索“分数”、“根号”、“矩阵”等
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredTemplates.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleInsertFormula(item)}
                                    className="flex flex-col p-2 rounded-xl border border-border/60 hover:border-indigo-300 dark:hover:border-indigo-700 bg-muted/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition-all group relative overflow-hidden"
                                >
                                    {/* 顶部标题与分类微标 */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                            {item.name}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-mono bg-background/80 px-1 py-0.2 rounded border border-border/40">
                                            点击插入
                                        </span>
                                    </div>

                                    {/* 公式真实渲染区域 */}
                                    <div className="h-12 w-full rounded-lg bg-background border border-border/60 flex items-center justify-center p-1 font-serif text-sm text-indigo-950 dark:text-indigo-200 overflow-hidden group-hover:scale-[1.01] transition-transform">
                                        <MathText text={`$${item.latexPreview}$`} />
                                    </div>

                                    {/* 底部中文操作提示 */}
                                    <p className="mt-1.5 text-[10px] text-muted-foreground truncate">
                                        {item.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 底部新手小贴士 */}
                <div className="px-2 py-1.5 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>💡 提示：插入后可直接把“分子/分母”等汉字改为你的数字</span>
                    <span className="font-mono text-[9px] text-indigo-500">KaTeX 实时渲染</span>
                </div>
            </PopoverContent>
        </Popover>
    );
}
