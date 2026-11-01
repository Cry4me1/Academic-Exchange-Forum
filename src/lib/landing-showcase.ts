/**
 * Landing 页真实帖子精选管线
 *
 * - 在服务端（unstable_cache 内）执行：从 TipTap 富文本 JSON 中提取纯文本摘要、首个 LaTeX 公式与首个代码块；
 * - 过滤公告 / 版本更新 / 使用指南类帖子，仅保留学术内容；
 * - 仅向客户端下发精简字段，避免把整篇正文序列化进首屏 payload。
 *
 * 本文件为纯函数模块（无服务端依赖），`localizeTag` / `symbolForTags` 也可在客户端组件中复用。
 */

/* ============================================================
 * 类型
 * ============================================================ */

export interface LandingAuthor {
    id?: string;
    username: string;
    avatar_url?: string | null;
    special_title?: string | null;
}

/** Hero 精选卡片所需的精简帖子 */
export interface HeroPostItem {
    id: string;
    title: string;
    /** 已做 LaTeX 安全截断的纯文本摘要（可能为空字符串） */
    snippet: string;
    tags: string[];
    view_count: number;
    comment_count: number;
    like_count: number;
    author: LandingAuthor;
}

/** Features 跑马灯卡片（真实帖子 / 平台能力通用） */
export interface ShowcaseItem {
    id: string;
    href?: string;
    /** 原始标签，客户端通过 localizeTag 本地化 */
    tags: string[];
    title: string;
    /** 导语（平台能力卡片使用） */
    highlight?: string;
    /** 互动数据（真实帖子卡片使用，取代导语行） */
    stats?: { views: number; comments: number };
    /** 展示用块级公式，形如 `$$...$$` */
    latex?: string;
    codeSnippet?: string;
    /** 无公式 / 代码时展示的正文摘录 */
    excerpt?: string;
    /** 学术符号徽标，如 \Sigma */
    symbol: string;
    author: { name: string; institution?: string | null; avatarUrl?: string | null };
}

/** Supabase 查询返回的原始帖子行 */
export interface RawLandingPost {
    id: string;
    title: string | null;
    content: unknown;
    tags: string[] | null;
    view_count: number | null;
    like_count: number | null;
    comment_count: number | null;
    author: unknown;
}

export interface LandingShowcase {
    heroPosts: HeroPostItem[];
    showcasePosts: ShowcaseItem[];
}

/* ============================================================
 * 常量
 * ============================================================ */

const HERO_SNIPPET_MAX = 140;
const EXCERPT_MAX = 120;
const CODE_MAX_LINES = 6;
const CODE_MAX_LINE_WIDTH = 72;
const MIN_BODY_LENGTH = 24;
const MIN_TITLE_WEIGHT = 8;

/** 公告 / 版本更新 / 指南等非学术帖子标题特征 */
const NON_ACADEMIC_TITLE_RE = /公告|更新|升级|指南|版本|征集|上线|预告|一封信|分享贴|^\s*v?\d+(\.\d+)+/i;

/** 求助 / 报错类帖子特征（仅降权，不硬性剔除，确保帖子较少时仍可兜底） */
const HELP_SEEKING_RE = /求助|求救|\bSOS\b/i;

/** C/C++ 等竞赛代码头部样板行（当代码较长时跳过，直达核心数据结构或算法实现） */
const CODE_BOILERPLATE_RE = /^\s*(#include\b|#pragma\b|#define\b|using\s+namespace\b|typedef\b)/;

/** 与 MathText 一致的公式定界符：$$..$$ / \[..\] / \(..\) / $..$ */
const FORMULA_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$\n]+?)\$/g;

const TAG_LABELS_ZH: Record<string, string> = {
    "Computer Science": "计算机科学",
    Mathematics: "数学",
    AI: "人工智能",
    Physics: "物理学",
    Chemistry: "化学",
    Biology: "生物学",
    Economics: "经济学",
    Philosophy: "哲学",
    Engineering: "工程学",
    Statistics: "统计学",
};

const TAG_SYMBOLS: Record<string, string> = {
    Mathematics: "\\Sigma",
    "Computer Science": "\\mathcal{O}",
    AI: "\\nabla",
    Physics: "\\hbar",
    Chemistry: "\\rightleftharpoons",
    Biology: "\\Psi",
    Economics: "\\lambda",
    Statistics: "\\sigma",
};

/* ============================================================
 * 标签工具（客户端可复用）
 * ============================================================ */

/** 学科标签本地化：中文界面下将英文学科名映射为中文，未知标签原样返回 */
export function localizeTag(tag: string, isZh: boolean): string {
    if (!isZh) return tag;
    return TAG_LABELS_ZH[tag] ?? tag;
}

/** 根据首个已知学科挑选符号徽标 */
export function symbolForTags(tags: string[]): string {
    for (const tag of tags) {
        const symbol = TAG_SYMBOLS[tag];
        if (symbol) return symbol;
    }
    return "\\partial";
}

/** 格式化作者头衔：将数据库内部枚举（如 DEVELOPER）转换为符合学术语境的展示文案 */
export function formatAuthorTitle(
    specialTitle: string | null | undefined,
    isZh: boolean,
    fallback: string
): string {
    const trimmed = specialTitle?.trim();
    if (!trimmed) return fallback;
    if (trimmed.toUpperCase() === "DEVELOPER") {
        return isZh ? "平台架构师 · 核心开发者" : "Core Architect";
    }
    if (!isZh && /[\u4e00-\u9fff]/.test(trimmed)) {
        return fallback;
    }
    return trimmed;
}

/* ============================================================
 * 富文本解析
 * ============================================================ */

interface RichNode {
    type?: string;
    text?: string;
    content?: unknown;
}

const BLOCK_SEPARATOR_TYPES = new Set([
    "paragraph",
    "heading",
    "listItem",
    "blockquote",
    "tableCell",
    "tableHeader",
]);

function parseContent(content: unknown): unknown {
    if (typeof content !== "string") return content;
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return JSON.parse(trimmed);
        } catch {
            // 非合法 JSON，按普通字符串处理
        }
    }
    return trimmed;
}

/** 收集正文纯文本（跳过代码块，块级节点之间补空格） */
function collectText(node: unknown, out: string[]): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
        for (const child of node) collectText(child, out);
        return;
    }
    const n = node as RichNode;
    if (n.type === "codeBlock") return;
    if (n.type === "hardBreak") {
        out.push(" ");
        return;
    }
    if (typeof n.text === "string") out.push(n.text);
    if (n.content) collectText(n.content, out);
    if (n.type && BLOCK_SEPARATOR_TYPES.has(n.type)) out.push(" ");
}

function extractPlainText(parsed: unknown): string {
    if (typeof parsed === "string") {
        return parsed.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
    }
    const out: string[] = [];
    collectText(parsed, out);
    return out.join("").replace(/\s+/g, " ").trim();
}

/** 深度优先查找第一个代码块的原始文本 */
function findFirstCodeBlock(node: unknown): string | null {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = findFirstCodeBlock(child);
            if (found) return found;
        }
        return null;
    }
    const n = node as RichNode;
    if (n.type === "codeBlock") {
        const parts: string[] = [];
        const walk = (child: unknown) => {
            if (!child || typeof child !== "object") return;
            if (Array.isArray(child)) {
                child.forEach(walk);
                return;
            }
            const c = child as RichNode;
            if (c.type === "hardBreak") parts.push("\n");
            if (typeof c.text === "string") parts.push(c.text);
            if (c.content) walk(c.content);
        };
        walk(n.content);
        const code = parts.join("");
        // 跳过纯数字样例输入/输出块，仅保留包含标识符的真实代码
        return code.trim() && /[A-Za-z_]/.test(code) ? code : null;
    }
    return findFirstCodeBlock(n.content);
}

/** 代码片段裁剪：去掉首尾空行与竞赛头文件样板，最多 6 行、每行 72 列 */
function trimCode(code: string): string | null {
    const lines = code.replace(/\r/g, "").replace(/\t/g, "    ").split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

    // 若跳过头部样板后仍有充足代码行，则优先展示核心结构体/函数
    let startIdx = 0;
    while (startIdx < lines.length && (!lines[startIdx].trim() || CODE_BOILERPLATE_RE.test(lines[startIdx]))) {
        startIdx++;
    }
    const effective = lines.length - startIdx >= 4 ? lines.slice(startIdx) : lines;

    const picked = effective
        .slice(0, CODE_MAX_LINES)
        .map((line) => (line.length > CODE_MAX_LINE_WIDTH ? `${line.slice(0, CODE_MAX_LINE_WIDTH - 1)}…` : line));
    const result = picked.join("\n");
    return result.replace(/\s/g, "").length >= 16 ? result : null;
}

/** 挑选最具展示性的公式：排除题目数据范围不等式与超高多行矩阵，优先真正的等式/推导 */
function extractFeatureFormula(text: string): string | null {
    let best: string | null = null;
    let bestScore = 0;

    for (const match of text.matchAll(FORMULA_RE)) {
        const body = (match[1] ?? match[2] ?? match[3] ?? match[4] ?? "").trim();
        if (body.length < 6 || body.length > 96) continue;
        if (!/[\\^_=]/.test(body)) continue;
        // 避免超过两行的矩阵/多行公式撑破固定高度展示槽
        if ((body.match(/\\\\/g) || []).length >= 2) continue;

        const hasEquality = /(?<![<>!])=|\\approx|\\equiv|\\cong|\\sim|\\to|\\implies/.test(body);
        const hasMathConstruct =
            /\\frac|\\sum|\\int|\\prod|\\sqrt|\\binom|\\lim|\\partial|\\nabla|\\mathcal|[O\u0398\u03a9]\s*\(|\^/.test(body);
        if (!hasEquality && !hasMathConstruct) continue;
        const isRangeOnly = !hasEquality && /\\le\b|\\leq\b|\\ge\b|\\geq\b|[<>]/.test(body);
        if (isRangeOnly) continue;

        let score = Math.min(body.length, 60);
        if (hasEquality) score += 25;
        if (/\\frac|\\sum|\\int|\\prod|\\sqrt|\\binom|\\lim/.test(body)) score += 20;

        if (score > bestScore) {
            bestScore = score;
            best = body;
        }
    }
    return best ? `$$${best}$$` : null;
}

function countMatches(text: string, re: RegExp): number {
    return (text.match(re) || []).length;
}

/**
 * LaTeX 安全截断：避免把 \( ... \) / \[ ... \] / $$ ... $$ / $ ... $ 从中间切断，
 * 防止摘要中出现半截公式源码。
 */
export function safeTruncate(text: string, max: number): string {
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

/**
 * 标题可读权重：剔除公式片段后，汉字计 2、字母数字计 1。
 * 用于排除纯公式 / 符号标题（如 "μ()"、"1+$2^2$+…"）与过短标题。
 */
function titleWeight(title: string): number {
    const stripped = title.replace(FORMULA_RE, " ");
    let weight = 0;
    for (const ch of stripped) {
        if (/[\u4e00-\u9fff]/.test(ch)) weight += 2;
        else if (/[A-Za-z0-9]/.test(ch)) weight += 1;
    }
    return weight;
}

function normalizeAuthor(raw: unknown): LandingAuthor {
    const obj = (Array.isArray(raw) ? raw[0] : raw) as Partial<LandingAuthor> | null | undefined;
    return {
        id: obj?.id ?? undefined,
        username: obj?.username || "Scholarly",
        avatar_url: obj?.avatar_url ?? null,
        special_title: obj?.special_title ?? null,
    };
}

/* ============================================================
 * 主管线
 * ============================================================ */

interface NormalizedPost {
    id: string;
    title: string;
    tags: string[];
    views: number;
    likes: number;
    comments: number;
    author: LandingAuthor;
    text: string;
    formula: string | null;
    code: string | null;
    score: number;
}

function normalizePost(raw: RawLandingPost): NormalizedPost {
    const parsed = parseContent(raw.content);
    const text = extractPlainText(parsed);
    const codeRaw = typeof parsed === "object" ? findFirstCodeBlock(parsed) : null;
    const views = raw.view_count ?? 0;
    const likes = raw.like_count ?? 0;
    const comments = raw.comment_count ?? 0;

    const title = (raw.title ?? "").trim();
    const helpPenalty =
        HELP_SEEKING_RE.test(title) || HELP_SEEKING_RE.test(text.slice(0, 60)) ? 120 : 0;

    return {
        id: raw.id,
        title,
        tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
        views,
        likes,
        comments,
        author: normalizeAuthor(raw.author),
        text,
        formula: extractFeatureFormula(text),
        code: codeRaw ? trimCode(codeRaw) : null,
        // 与站内 hot 排序口径一致，并对纯求助帖做温和降权以优先呈现完整笔记与推导
        score: views + likes * 5 + comments * 3 - helpPenalty,
    };
}

function toHeroPost(post: NormalizedPost): HeroPostItem {
    return {
        id: post.id,
        title: post.title,
        snippet: post.text ? safeTruncate(post.text, HERO_SNIPPET_MAX) : "",
        tags: post.tags.slice(0, 3),
        view_count: post.views,
        comment_count: post.comments,
        like_count: post.likes,
        author: post.author,
    };
}

function toShowcaseItem(post: NormalizedPost): ShowcaseItem {
    const hasRichWell = Boolean(post.formula || post.code);
    return {
        id: post.id,
        href: `/posts/${post.id}`,
        tags: post.tags.slice(0, 2),
        title: post.title,
        highlight: hasRichWell && post.text ? safeTruncate(post.text, 64) : undefined,
        stats: { views: post.views, comments: post.comments },
        latex: post.formula ?? undefined,
        // 公式优先，其次代码，最后正文摘录
        codeSnippet: !post.formula && post.code ? post.code : undefined,
        excerpt: !hasRichWell && post.text ? safeTruncate(post.text, EXCERPT_MAX) : undefined,
        symbol: symbolForTags(post.tags),
        author: {
            name: post.author.username,
            institution: post.author.special_title,
            avatarUrl: post.author.avatar_url,
        },
    };
}

/**
 * 从真实帖子中挑选 Hero 精选（默认 3 篇）与 Features 跑马灯卡片（默认 8 篇）。
 * 不再使用任何虚构兜底内容：真实数据不足时，返回的数组会相应变短。
 */
export function buildLandingShowcase(
    rawPosts: RawLandingPost[],
    { heroCount = 3, showcaseCount = 8 }: { heroCount?: number; showcaseCount?: number } = {}
): LandingShowcase {
    const academic = rawPosts
        .map(normalizePost)
        .filter((p) => p.title && !NON_ACADEMIC_TITLE_RE.test(p.title) && titleWeight(p.title) >= MIN_TITLE_WEIGHT)
        .sort((a, b) => b.score - a.score);

    // Hero：优先正文充实的帖子，不足时以其余学术帖补齐
    const substantial = academic.filter((p) => p.text.length >= MIN_BODY_LENGTH);
    const heroPicked = substantial.slice(0, heroCount);
    if (heroPicked.length < heroCount) {
        for (const post of academic) {
            if (heroPicked.length >= heroCount) break;
            if (!heroPicked.includes(post)) heroPicked.push(post);
        }
    }

    // Features：与 Hero 错开，内容过少时允许复用 Hero 帖子以保证跑马灯饱满
    const heroIds = new Set(heroPicked.map((p) => p.id));
    let showcasePicked = academic.filter((p) => !heroIds.has(p.id)).slice(0, showcaseCount);
    if (showcasePicked.length < 4) {
        showcasePicked = [...showcasePicked, ...heroPicked].slice(0, showcaseCount);
    }

    return {
        heroPosts: heroPicked.map(toHeroPost),
        showcasePosts: showcasePicked.map(toShowcaseItem),
    };
}
