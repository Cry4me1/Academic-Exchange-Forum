/**
 * Math Palette 一体化数据层
 * 合并原 QuickFormulaPopover 和 MathSymbolsPopover 中的所有公式、函数、符号数据
 * 按四区 Tab 重新分类，每条记录同时携带中文名、拼音、LaTeX 关键词用于三模态搜索
 */

// ─────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────

export type PaletteTab = "basics" | "functions" | "symbols" | "matrix";

export interface MathPaletteItem {
    id: string;
    name: string;
    tab: PaletteTab;
    latex: string;        // KaTeX 预览用
    template: string;     // 插入到编辑器的模板（可含占位符）
    description: string;
    /** 搜索关键词：中文名、拼音、LaTeX 指令、英文别名 */
    keywords: string[];
    /** 模板中第一个可替换占位参数的正则/字符串标记（用于选中文本自动填充） */
    slotTarget?: string;
}

export interface QuickSymbol {
    label: string;
    latex: string;
    keywords: string[];
}

// ─────────────────────────────────────────────────────────
// Tab 定义
// ─────────────────────────────────────────────────────────

export const PALETTE_TABS: { id: PaletteTab; label: string }[] = [
    { id: "basics", label: "基础模板" },
    { id: "functions", label: "高阶函数" },
    { id: "symbols", label: "希腊 / 微积分" },
    { id: "matrix", label: "矩阵与方程" },
];

// ─────────────────────────────────────────────────────────
// 键帽符号快捷栏
// ─────────────────────────────────────────────────────────

export const QUICK_SYMBOLS: QuickSymbol[] = [
    { label: "α", latex: "\\alpha", keywords: ["alpha", "a", "阿尔法"] },
    { label: "β", latex: "\\beta", keywords: ["beta", "b", "贝塔"] },
    { label: "γ", latex: "\\gamma", keywords: ["gamma", "g", "伽马"] },
    { label: "θ", latex: "\\theta", keywords: ["theta", "t", "西塔"] },
    { label: "λ", latex: "\\lambda", keywords: ["lambda", "l", "兰姆达"] },
    { label: "π", latex: "\\pi", keywords: ["pi", "p", "圆周率"] },
    { label: "σ", latex: "\\sigma", keywords: ["sigma", "s"] },
    { label: "ω", latex: "\\omega", keywords: ["omega", "o", "欧米伽"] },
    { label: "Δ", latex: "\\Delta", keywords: ["delta", "d", "三角"] },
    { label: "Ω", latex: "\\Omega", keywords: ["omega", "o", "大欧米伽"] },
    { label: "∞", latex: "\\infty", keywords: ["infinity", "wuqiong", "无穷"] },
    { label: "±", latex: "\\pm", keywords: ["pm", "plusminus", "正负"] },
    { label: "×", latex: "\\times", keywords: ["times", "cheng", "乘"] },
    { label: "÷", latex: "\\div", keywords: ["div", "chu", "除"] },
    { label: "≠", latex: "\\neq", keywords: ["neq", "budeng", "不等"] },
    { label: "≈", latex: "\\approx", keywords: ["approx", "jinsi", "近似"] },
    { label: "≤", latex: "\\le", keywords: ["le", "xiaodeng", "小于等于"] },
    { label: "≥", latex: "\\ge", keywords: ["ge", "dadeng", "大于等于"] },
    { label: "∈", latex: "\\in", keywords: ["in", "shuyu", "属于"] },
    { label: "∉", latex: "\\notin", keywords: ["notin", "bushuyu", "不属于"] },
    { label: "∂", latex: "\\partial", keywords: ["partial", "piandao", "偏导"] },
    { label: "∇", latex: "\\nabla", keywords: ["nabla", "tidu", "梯度"] },
    { label: "∫", latex: "\\int", keywords: ["int", "jifen", "积分"] },
    { label: "∑", latex: "\\sum", keywords: ["sum", "qiuhe", "求和"] },
];

// ─────────────────────────────────────────────────────────
// 全量公式/函数/符号条目
// ─────────────────────────────────────────────────────────

export const MATH_PALETTE_ITEMS: MathPaletteItem[] = [
    // ══════════════════════════════════════════════════════
    // Tab 1: 基础模板 (basics)
    // ══════════════════════════════════════════════════════
    {
        id: "fraction",
        name: "分数",
        tab: "basics",
        latex: "\\frac{a}{b}",
        template: "\\frac{分子}{分母}",
        description: "上下结构分数",
        keywords: ["fenshu", "fraction", "frac", "分数", "除法", "比值"],
        slotTarget: "分子",
    },
    {
        id: "sqrt",
        name: "二次根号",
        tab: "basics",
        latex: "\\sqrt{x}",
        template: "\\sqrt{x}",
        description: "标准平方根号",
        keywords: ["genhao", "sqrt", "root", "根号", "开方"],
        slotTarget: "x",
    },
    {
        id: "n-sqrt",
        name: "n 次方根",
        tab: "basics",
        latex: "\\sqrt[n]{x}",
        template: "\\sqrt[次数]{被开方数}",
        description: "带开方次数的根号",
        keywords: ["genhao", "nsqrt", "n次方根", "开方", "root"],
        slotTarget: "被开方数",
    },
    {
        id: "superscript",
        name: "幂次方 / 上标",
        tab: "basics",
        latex: "x^n",
        template: "{底数}^{指数}",
        description: "上标指数，如平方、n 次方",
        keywords: ["shangbiao", "power", "cifang", "上标", "幂", "次方", "superscript"],
        slotTarget: "底数",
    },
    {
        id: "subscript",
        name: "角标 / 下标",
        tab: "basics",
        latex: "x_i",
        template: "{变量}_{下标}",
        description: "序列或变量序号下标",
        keywords: ["xiabiao", "sub", "下标", "角标", "索引", "subscript"],
        slotTarget: "变量",
    },
    {
        id: "sub-super",
        name: "上下标组合",
        tab: "basics",
        latex: "x_i^2",
        template: "{变量}_{下标}^{指数}",
        description: "同时包含下标与幂指数",
        keywords: ["shangxiabiao", "subsuper", "上下标"],
        slotTarget: "变量",
    },
    {
        id: "abs",
        name: "绝对值",
        tab: "basics",
        latex: "|x|",
        template: "|x|",
        description: "数值或变量的绝对值",
        keywords: ["jueduizhi", "abs", "绝对值", "模"],
        slotTarget: "x",
    },
    {
        id: "norm",
        name: "向量范数",
        tab: "basics",
        latex: "\\|\\mathbf{x}\\|",
        template: "\\|\\mathbf{x}\\|",
        description: "双竖线范数记号",
        keywords: ["fanshu", "norm", "范数", "模长"],
    },
    {
        id: "binomial",
        name: "二项式系数",
        tab: "basics",
        latex: "\\binom{n}{k}",
        template: "\\binom{n}{k}",
        description: "从 n 个元素中选取 k 个的组合数",
        keywords: ["binomial", "combination", "erxiangshi", "二项式", "组合数", "binom"],
    },
    // 经典定理公式（仍放在基础模板）
    {
        id: "quadratic-formula",
        name: "一元二次求根公式",
        tab: "basics",
        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        template: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        description: "ax²+bx+c=0 的通用解析解",
        keywords: ["qiugen", "quadratic", "求根公式", "二次方程"],
    },
    {
        id: "pythagoras",
        name: "勾股定理",
        tab: "basics",
        latex: "a^2 + b^2 = c^2",
        template: "a^2 + b^2 = c^2",
        description: "直角三角形三边平方关系",
        keywords: ["gougu", "pythagoras", "勾股定理", "直角三角形"],
    },
    {
        id: "normal-distribution",
        name: "高斯正态分布",
        tab: "basics",
        latex: "f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
        template: "f(x) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
        description: "正态分布概率密度函数",
        keywords: ["zhengtai", "gaussian", "normal", "正态分布", "高斯分布"],
    },
    {
        id: "euler-identity",
        name: "欧拉恒等式",
        tab: "basics",
        latex: "e^{i\\pi} + 1 = 0",
        template: "e^{i\\pi} + 1 = 0",
        description: "五个常数的优美关系式",
        keywords: ["oula", "euler", "欧拉公式", "欧拉恒等式"],
    },
    {
        id: "bayes-theorem",
        name: "贝叶斯公式",
        tab: "basics",
        latex: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        template: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        description: "条件概率推断核心公式",
        keywords: ["beiyesi", "bayes", "贝叶斯", "条件概率"],
    },
    {
        id: "cauchy-schwarz",
        name: "柯西-施瓦茨不等式",
        tab: "basics",
        latex: "\\left(\\sum_{i=1}^n a_i b_i\\right)^2 \\le \\left(\\sum_{i=1}^n a_i^2\\right) \\left(\\sum_{i=1}^n b_i^2\\right)",
        template: "\\left(\\sum_{i=1}^n a_i b_i\\right)^2 \\le \\left(\\sum_{i=1}^n a_i^2\\right) \\left(\\sum_{i=1}^n b_i^2\\right)",
        description: "内积空间中最基本的不等式",
        keywords: ["kexi", "cauchy", "schwarz", "柯西不等式"],
    },
    {
        id: "taylor-series",
        name: "泰勒级数展开式",
        tab: "basics",
        latex: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
        template: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
        description: "光滑函数在点 a 处的展开",
        keywords: ["taile", "taylor", "泰勒级数", "泰勒展开"],
    },

    // ══════════════════════════════════════════════════════
    // Tab 2: 高阶函数 (functions)
    // ══════════════════════════════════════════════════════
    {
        id: "mobius",
        name: "莫比乌斯函数",
        tab: "functions",
        latex: "\\mu(n)",
        template: "\\mu(n)",
        description: "数论反演核心函数",
        keywords: ["mobius", "mobiwusi", "mu", "莫比乌斯", "数论"],
    },
    {
        id: "euler-phi",
        name: "欧拉函数",
        tab: "functions",
        latex: "\\varphi(n)",
        template: "\\varphi(n)",
        description: "小于等于 n 且与 n 互质的正整数个数",
        keywords: ["euler", "phi", "oula", "欧拉", "互质", "varphi"],
    },
    {
        id: "riemann-zeta",
        name: "黎曼 Zeta 函数",
        tab: "functions",
        latex: "\\zeta(s)",
        template: "\\zeta(s)",
        description: "解析数论核心",
        keywords: ["riemann", "zeta", "liman", "黎曼", "zeta函数"],
    },
    {
        id: "divisor-count",
        name: "约数个数函数",
        tab: "functions",
        latex: "d(n)",
        template: "d(n)",
        description: "n 的正因数个数",
        keywords: ["divisor", "tau", "yueshu", "约数", "因数"],
    },
    {
        id: "divisor-sum",
        name: "约数和函数",
        tab: "functions",
        latex: "\\sigma(n)",
        template: "\\sigma(n)",
        description: "n 的所有正因数之和",
        keywords: ["sigma", "yueshuhe", "约数和"],
    },
    {
        id: "mangoldt",
        name: "冯·芒戈尔特函数",
        tab: "functions",
        latex: "\\Lambda(n)",
        template: "\\Lambda(n)",
        description: "当 n=p^k 时为 ln p，否则为 0",
        keywords: ["mangoldt", "lambda", "manggeerte", "芒戈尔特", "Lambda"],
    },
    {
        id: "legendre",
        name: "勒让德符号",
        tab: "functions",
        latex: "\\left(\\frac{a}{p}\\right)",
        template: "\\left(\\frac{a}{p}\\right)",
        description: "二次剩余判别符号",
        keywords: ["legendre", "jacobi", "lerangde", "勒让德", "二次剩余"],
    },
    {
        id: "dirichlet-char",
        name: "狄利克雷特征",
        tab: "functions",
        latex: "\\chi(n)",
        template: "\\chi(n)",
        description: "模 m 的完全积性周期算术函数",
        keywords: ["dirichlet", "chi", "dilikeli", "狄利克雷"],
    },
    {
        id: "gamma-func",
        name: "伽马函数",
        tab: "functions",
        latex: "\\Gamma(z)",
        template: "\\Gamma(z)",
        description: "复数域阶乘的解析延拓",
        keywords: ["gamma", "jiama", "伽马", "阶乘", "Gamma"],
    },
    {
        id: "dirac-delta",
        name: "狄拉克 Delta",
        tab: "functions",
        latex: "\\delta(x)",
        template: "\\delta(x)",
        description: "广义函数/冲激函数",
        keywords: ["dirac", "delta", "dilake", "狄拉克", "冲激"],
    },

    // ══════════════════════════════════════════════════════
    // Tab 3: 希腊 / 微积分符号 (symbols)
    // ══════════════════════════════════════════════════════
    {
        id: "definite-integral",
        name: "定积分",
        tab: "symbols",
        latex: "\\int_{a}^{b} f(x)\\,dx",
        template: "\\int_{a}^{b} f(x)\\,dx",
        description: "带上下限的定积分式",
        keywords: ["jifen", "integral", "定积分", "积分", "int"],
    },
    {
        id: "indefinite-integral",
        name: "不定积分",
        tab: "symbols",
        latex: "\\int f(x)\\,dx",
        template: "\\int f(x)\\,dx",
        description: "原函数不定积分",
        keywords: ["budingjifen", "integral", "不定积分"],
    },
    {
        id: "summation",
        name: "求和式 (Σ)",
        tab: "symbols",
        latex: "\\sum_{i=1}^{n} a_i",
        template: "\\sum_{i=1}^{n} a_i",
        description: "从 1 到 n 的求和记号",
        keywords: ["qiuhe", "sum", "sigma", "求和", "累加"],
    },
    {
        id: "product",
        name: "连乘积 (Π)",
        tab: "symbols",
        latex: "\\prod_{i=1}^{n} x_i",
        template: "\\prod_{i=1}^{n} x_i",
        description: "从 1 到 n 的累乘积记号",
        keywords: ["liancheng", "product", "连乘", "乘积", "prod"],
    },
    {
        id: "limit",
        name: "极限",
        tab: "symbols",
        latex: "\\lim_{x \\to 0} \\frac{\\sin x}{x}",
        template: "\\lim_{x \\to 0} f(x)",
        description: "自变量趋向特定值时的极限",
        keywords: ["jixian", "limit", "极限", "lim"],
    },
    {
        id: "partial-derivative",
        name: "偏导数",
        tab: "symbols",
        latex: "\\frac{\\partial f}{\\partial x}",
        template: "\\frac{\\partial f}{\\partial x}",
        description: "多元函数偏导数",
        keywords: ["piandao", "partial", "偏导", "导数"],
    },
    // 集合与逻辑符号
    {
        id: "real-set",
        name: "实数集 ℝ",
        tab: "symbols",
        latex: "\\mathbb{R}",
        template: "\\mathbb{R}",
        description: "全体实数集合",
        keywords: ["real", "set", "shishu", "实数", "mathbb"],
    },
    {
        id: "complex-set",
        name: "复数集 ℂ",
        tab: "symbols",
        latex: "\\mathbb{C}",
        template: "\\mathbb{C}",
        description: "全体复数集合",
        keywords: ["complex", "fushu", "复数"],
    },
    {
        id: "integer-set",
        name: "整数集 ℤ",
        tab: "symbols",
        latex: "\\mathbb{Z}",
        template: "\\mathbb{Z}",
        description: "全体正负整数及零",
        keywords: ["integer", "zhengshu", "整数"],
    },
    {
        id: "natural-set",
        name: "自然数集 ℕ",
        tab: "symbols",
        latex: "\\mathbb{N}",
        template: "\\mathbb{N}",
        description: "全体非负整数集合",
        keywords: ["natural", "ziranshu", "自然数"],
    },
    {
        id: "forall-exists",
        name: "全称与存在量词",
        tab: "symbols",
        latex: "\\forall x \\in S, \\; \\exists y",
        template: "\\forall x \\in S, \\; \\exists y",
        description: "任意与存在命题表述",
        keywords: ["forall", "exists", "liangci", "量词", "全称", "存在"],
    },

    // ══════════════════════════════════════════════════════
    // Tab 4: 矩阵与方程 (matrix)
    // ══════════════════════════════════════════════════════
    {
        id: "cases-system",
        name: "方程组 / 分段函数",
        tab: "matrix",
        latex: "\\begin{cases} x+1 & x > 0 \\\\ x-1 & x \\le 0 \\end{cases}",
        template: "\\begin{cases} 表达式1, & 条件1 \\\\ 表达式2, & 条件2 \\end{cases}",
        description: "左大括号分段/方程组",
        keywords: ["fangchengzu", "fenduan", "cases", "分段函数", "方程组"],
    },
    {
        id: "matrix-2x2",
        name: "2×2 矩阵",
        tab: "matrix",
        latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        template: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        description: "圆括号二阶矩阵",
        keywords: ["juzhen", "matrix", "2x2", "矩阵", "pmatrix"],
    },
    {
        id: "matrix-3x3",
        name: "3×3 矩阵",
        tab: "matrix",
        latex: "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}",
        template: "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}",
        description: "圆括号三阶矩阵",
        keywords: ["juzhen", "matrix", "3x3", "三阶矩阵"],
    },
    {
        id: "determinant",
        name: "行列式",
        tab: "matrix",
        latex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",
        template: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",
        description: "竖线方阵行列式",
        keywords: ["hanglieshi", "det", "行列式", "vmatrix"],
    },
    {
        id: "column-vector",
        name: "列向量",
        tab: "matrix",
        latex: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix}",
        template: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\end{pmatrix}",
        description: "多维列向量格式",
        keywords: ["xiangliang", "vector", "向量", "列向量"],
    },
    {
        id: "bracket-matrix",
        name: "方括号矩阵",
        tab: "matrix",
        latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
        template: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
        description: "方括号二阶矩阵",
        keywords: ["juzhen", "matrix", "bmatrix", "方括号矩阵"],
    },
    {
        id: "augmented-matrix",
        name: "增广矩阵",
        tab: "matrix",
        latex: "\\left(\\begin{array}{cc|c} 1 & 0 & a \\\\ 0 & 1 & b \\end{array}\\right)",
        template: "\\left(\\begin{array}{cc|c} 1 & 0 & a \\\\ 0 & 1 & b \\end{array}\\right)",
        description: "线性方程组的增广矩阵",
        keywords: ["zengguang", "augmented", "增广矩阵", "线性方程"],
    },
    {
        id: "identity-matrix",
        name: "单位矩阵",
        tab: "matrix",
        latex: "I_n = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}",
        template: "I_n = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}",
        description: "n 阶单位矩阵",
        keywords: ["danwei", "identity", "单位矩阵", "In"],
    },
];
