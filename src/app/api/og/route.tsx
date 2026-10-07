import { ImageResponse } from "@vercel/og";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "edge";

// 主题配置
const themes = {
    dark: {
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #030712 100%)",
        cardBg: "rgba(255, 255, 255, 0.04)",
        cardBorder: "rgba(255, 255, 255, 0.1)",
        titleColor: "#f8fafc",
        summaryColor: "#94a3b8",
        authorColor: "#e2e8f0",
        accentColor: "#38bdf8",
        tagBg: "rgba(56, 189, 248, 0.15)",
        tagColor: "#7dd3fc",
        subBadgeBg: "rgba(255, 255, 255, 0.1)",
        subBadgeColor: "#cbd5e1",
        dividerColor: "rgba(255, 255, 255, 0.12)",
    },
    light: {
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        cardBg: "rgba(255, 255, 255, 0.8)",
        cardBorder: "rgba(226, 232, 240, 0.8)",
        titleColor: "#0f172a",
        summaryColor: "#475569",
        authorColor: "#1e293b",
        accentColor: "#0284c7",
        tagBg: "rgba(2, 132, 199, 0.1)",
        tagColor: "#0284c7",
        subBadgeBg: "rgba(0, 0, 0, 0.06)",
        subBadgeColor: "#475569",
        dividerColor: "rgba(0, 0, 0, 0.08)",
    },
    academic: {
        background: "linear-gradient(135deg, #071324 0%, #0f2342 50%, #050d1a 100%)",
        cardBg: "rgba(14, 165, 233, 0.05)",
        cardBorder: "rgba(56, 189, 248, 0.15)",
        titleColor: "#ffffff",
        summaryColor: "#93c5fd",
        authorColor: "#e0f2fe",
        accentColor: "#38bdf8",
        tagBg: "rgba(56, 189, 248, 0.2)",
        tagColor: "#bae6fd",
        subBadgeBg: "rgba(56, 189, 248, 0.15)",
        subBadgeColor: "#7dd3fc",
        dividerColor: "rgba(56, 189, 248, 0.15)",
    },
};

/**
 * 在纯文本/OG 环境下将 LaTeX 公式清洗并转化为优雅规范的数学排版
 */
function formatLatexForPlainText(text: string): string {
    if (!text) return "";
    let str = text;

    // 分数 \frac{a}{b} -> (a)/(b)
    str = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
    str = str.replace(/\\frac\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])/g, "($1)/($2)");

    // 常用数学字符映射
    const symbols: Record<string, string> = {
        "\\times": "×",
        "\\div": "÷",
        "\\pm": "±",
        "\\mp": "∓",
        "\\approx": "≈",
        "\\neq": "≠",
        "\\le": "≤",
        "\\leq": "≤",
        "\\ge": "≥",
        "\\geq": "≥",
        "\\infty": "∞",
        "\\pi": "π",
        "\\alpha": "α",
        "\\beta": "β",
        "\\gamma": "γ",
        "\\theta": "θ",
        "\\lambda": "λ",
        "\\sigma": "σ",
        "\\Delta": "Δ",
        "\\sum": "∑",
        "\\prod": "∏",
        "\\int": "∫",
        "\\sqrt": "√",
        "\\in": "∈",
        "\\notin": "∉",
        "\\cdot": "·",
        "\\cdots": "···",
        "\\ldots": "...",
    };

    for (const [k, v] of Object.entries(symbols)) {
        str = str.replaceAll(k, v);
    }

    // 上标转换
    const superscripts: Record<string, string> = {
        "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
        "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
        "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
        "n": "ⁿ", "x": "ˣ", "y": "ʸ", "i": "ⁱ"
    };

    str = str.replace(/\^{([^{}]+)}/g, (_, p1) => {
        return p1.split("").map((c: string) => superscripts[c] || c).join("");
    });
    str = str.replace(/\^([0-9nxy])/g, (_, p1) => superscripts[p1] || `^${p1}`);

    // 下标转换
    const subscripts: Record<string, string> = {
        "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
        "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
        "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
        "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ", "i": "ᵢ", "j": "ⱼ", "k": "ₖ", "n": "ₙ", "m": "ₘ"
    };

    str = str.replace(/_{([^{}]+)}/g, (_, p1) => {
        return p1.split("").map((c: string) => subscripts[c] || c).join("");
    });
    str = str.replace(/_([0-9aeoxijknm])/g, (_, p1) => subscripts[p1] || `_${p1}`);

    // 清理多余的 $ 符号与转义字符
    str = str.replace(/\$+/g, " ");
    str = str.replace(/\\(text|mathrm|mathbf)\{([^}]+)\}/g, "$2");
    str = str.replace(/[{}]/g, "");
    str = str.replace(/\s+/g, " ").trim();

    return str;
}

// 从内容中提取文本
function extractTextFromContent(content: unknown): string {
    if (!content || typeof content !== "object") return "";

    let text = "";
    const traverse = (node: Record<string, unknown>) => {
        if (node.type === "text" && typeof node.text === "string") {
            text += node.text + " ";
        }
        if (
            (node.type === "math" || node.type === "mathematics" || node.type === "inlineMath") &&
            node.attrs
        ) {
            const latex =
                ((node.attrs as Record<string, unknown>).latex as string) ||
                ((node.attrs as Record<string, unknown>).content as string) ||
                "";
            if (latex) text += ` $${latex}$ `;
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };

    const contentObj = content as Record<string, unknown>;
    if (contentObj.content && Array.isArray(contentObj.content)) {
        contentObj.content.forEach(traverse);
    }

    return text.trim().slice(0, 300);
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const themeName = (searchParams.get("theme") || "dark") as keyof typeof themes;

    if (!postId) {
        return new Response("Missing postId parameter", { status: 400 });
    }

    const theme = themes[themeName] || themes.dark;

    try {
        // 获取帖子数据
        const supabase = await createClient();
        const { data: post, error } = await supabase
            .from("posts")
            .select(`
                id,
                title,
                content,
                tags,
                created_at,
                author:profiles!author_id (
                    username,
                    avatar_url,
                    special_title
                )
            `)
            .eq("id", postId)
            .single();

        if (error || !post) {
            return new Response("Post not found", { status: 404 });
        }

        // 提取文本并进行学术排版净化
        const textContent = extractTextFromContent(post.content);
        const formattedTitle = formatLatexForPlainText(post.title);
        const rawSummary = textContent ? textContent.slice(0, 160) : "探讨前沿学术命题，分享独到研究洞见。";
        const formattedSummary = formatLatexForPlainText(rawSummary);

        // 作者信息
        const author = (Array.isArray(post.author) ? post.author[0] : post.author) as {
            username?: string;
            avatar_url?: string;
            special_title?: string;
        } | null;

        const authorName = author?.username || "Scholarly 学者";
        const authorInitials = authorName.slice(0, 2).toUpperCase();
        const tags = (post.tags || []).slice(0, 3);

        const title = formattedTitle.length > 55 ? formattedTitle.slice(0, 52) + "..." : formattedTitle;
        const summary = formattedSummary.length > 100 ? formattedSummary.slice(0, 97) + "..." : formattedSummary;

        // 使用 @vercel/og 的 ImageResponse
        return new ImageResponse(
            (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "54px 64px",
                        background: theme.background,
                        fontFamily: "sans-serif",
                    }}
                >
                    {/* 1. 顶栏：Scholarly 官方品牌 Logo 与学术徽标 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        {/* 左侧品牌区 */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {/* 官方 Logo 造型矢量几何晶体 */}
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "14px",
                                    background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: "14px",
                                    boxShadow: "0 8px 20px rgba(234, 88, 12, 0.35)",
                                }}
                            >
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span
                                        style={{
                                            fontSize: "26px",
                                            fontWeight: 800,
                                            color: theme.titleColor,
                                            letterSpacing: "-0.5px",
                                            marginRight: "10px",
                                        }}
                                    >
                                        Scholarly
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            padding: "3px 10px",
                                            borderRadius: "20px",
                                            background: theme.subBadgeBg,
                                            color: theme.subBadgeColor,
                                            fontWeight: 600,
                                        }}
                                    >
                                        学术交流社区 · 同行研讨
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        color: theme.summaryColor,
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    Academic Research Network
                                </span>
                            </div>
                        </div>

                        {/* 右侧标签 */}
                        {tags.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center" }}>
                                {tags.map((tag: string, i: number) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: "6px 14px",
                                            background: theme.tagBg,
                                            color: theme.tagColor,
                                            borderRadius: "20px",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            marginLeft: "8px",
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 分割线 */}
                    <div
                        style={{
                            width: "100%",
                            height: "1px",
                            background: theme.dividerColor,
                            marginTop: "20px",
                            marginBottom: "20px",
                        }}
                    />

                    {/* 2. 核心学术内容区 */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            justifyContent: "center",
                        }}
                    >
                        {/* 标题 */}
                        <h1
                            style={{
                                fontSize: title.length > 35 ? "38px" : "44px",
                                fontWeight: 800,
                                color: theme.titleColor,
                                lineHeight: 1.25,
                                margin: 0,
                                marginBottom: "16px",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            {title}
                        </h1>

                        {/* 摘要引述框 */}
                        <div
                            style={{
                                display: "flex",
                                padding: "16px 20px",
                                borderRadius: "16px",
                                background: theme.cardBg,
                                border: `1px solid ${theme.cardBorder}`,
                                borderLeft: `4px solid ${theme.accentColor}`,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "19px",
                                    color: theme.summaryColor,
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}
                            >
                                {summary}
                            </p>
                        </div>
                    </div>

                    {/* 分割线 */}
                    <div
                        style={{
                            width: "100%",
                            height: "1px",
                            background: theme.dividerColor,
                            marginTop: "20px",
                            marginBottom: "20px",
                        }}
                    />

                    {/* 3. 底部作者与平台防伪印记 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        {/* 左侧作者名片 */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <div
                                style={{
                                    width: "52px",
                                    height: "52px",
                                    borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${theme.accentColor}, #6366f1)`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#ffffff",
                                    fontSize: "19px",
                                    fontWeight: "bold",
                                    marginRight: "16px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                                }}
                            >
                                {authorInitials}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span
                                        style={{
                                            fontSize: "18px",
                                            fontWeight: 700,
                                            color: theme.authorColor,
                                            marginRight: "8px",
                                        }}
                                    >
                                        {authorName}
                                    </span>
                                    {author?.special_title && (
                                        <span
                                            style={{
                                                fontSize: "11px",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                background: "rgba(168, 85, 247, 0.15)",
                                                color: "#c084fc",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {author.special_title}
                                        </span>
                                    )}
                                </div>
                                <span
                                    style={{
                                        fontSize: "13px",
                                        color: theme.summaryColor,
                                        marginTop: "2px",
                                    }}
                                >
                                    Scholarly 学术论述与同行评议
                                </span>
                            </div>
                        </div>

                        {/* 右侧防伪与访问标识 */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: theme.authorColor,
                                    letterSpacing: "0.5px",
                                }}
                            >
                                SCHOLARLY INSIGHT
                            </span>
                            <span
                                style={{
                                    fontSize: "11px",
                                    color: theme.summaryColor,
                                    fontFamily: "monospace",
                                    marginTop: "2px",
                                }}
                            >
                                ID: {post.id.slice(0, 10)}
                            </span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error("OG image generation error:", error);
        return new Response(`Failed to generate image: ${error}`, { status: 500 });
    }
}
