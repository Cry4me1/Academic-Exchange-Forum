import { marked } from "marked";
import { generateJSON } from "@tiptap/html";
import { StarterKit } from "@tiptap/starter-kit";
import type { JSONContent } from "novel";

/**
 * 论坛数学公式安全转换：
 * 论坛数学渲染引擎基于单美元符号 $...$。
 * 严格将所有的 $$ ... $$（包含单行或多行块级公式）标准化为单 $ ... $，
 * 消除双美元符号导致的 KaTeX 正则错乱与无法渲染问题。
 */
export function sanitizeLatex(text: string): string {
    if (!text || typeof text !== "string") return "";

    // 1. 将 $$ ... $$（支持跨行匹配）替换为 $ ... $
    let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        const clean = math.trim().replace(/\n+/g, " ");
        return `$${clean}$`;
    });

    // 2. 移除公式两端可能意外残留的双美元符号残余
    result = result.replace(/\${3,}/g, "$");

    return result;
}

/**
 * 将 Markdown 字符串编译转换为完整的 TipTap JSONContent AST 结构
 * 支持 heading (h1-h6), bulletList, orderedList, blockquote, codeBlock,
 * 以及行内 marks: bold, italic, strike, code，并保留单美元 KaTeX 公式供前端插件渲染。
 */
export function markdownToTipTap(markdown: string): JSONContent {
    if (!markdown || typeof markdown !== "string") {
        return { type: "doc", content: [{ type: "paragraph" }] };
    }

    // 1. 清洗公式格式
    const cleanMarkdown = sanitizeLatex(markdown);

    try {
        // 2. 使用 marked 编译为标准化 HTML
        marked.setOptions({
            gfm: true,
            breaks: true,
        });
        const html = marked.parse(cleanMarkdown) as string;

        // 3. 将 HTML 转换为标准的 TipTap JSONContent
        const json = generateJSON(html, [StarterKit]);
        return json;
    } catch (error) {
        console.error("[markdownToTipTap] 转换失败，回退基础分段:", error);
        // 回退逻辑
        return {
            type: "doc",
            content: cleanMarkdown.split("\n\n").map((para) => ({
                type: "paragraph",
                content: [{ type: "text", text: para.trim() }],
            })),
        };
    }
}

/**
 * 递归从 TipTap 节点树中逆向提取纯 Markdown 文本
 * （用于将存入数据库的未解析 markdown 节点自愈还原）
 */
export function docToMarkdown(node: any): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (node.text) return node.text;

    const children = Array.isArray(node.content)
        ? node.content.map(docToMarkdown).join("")
        : "";

    switch (node.type) {
        case "heading": {
            const lvl = "#".repeat(node.attrs?.level || 2);
            return `\n\n${lvl} ${children.trim()}\n\n`;
        }
        case "paragraph":
            return `${children}\n\n`;
        case "codeBlock": {
            const lang = node.attrs?.language || "";
            return `\n\`\`\`${lang}\n${children}\n\`\`\`\n\n`;
        }
        case "blockquote":
            return `\n> ${children.trim()}\n\n`;
        case "bulletList":
        case "orderedList":
            return `\n${children}\n`;
        case "listItem":
            return `- ${children.trim()}\n`;
        default:
            return children;
    }
}

/**
 * 检测 TipTap doc 是否包含未被富文本解析的原始 Markdown 标记
 * （例如由于旧版接口直接将整行 text: "- **插入**: ..." 存入段落中）
 */
export function isUnparsedMarkdownDoc(doc: any): boolean {
    if (!doc || typeof doc !== "object") return false;
    let hasMarkers = false;

    function walk(node: any) {
        if (!node || hasMarkers) return;
        if (node.text && typeof node.text === "string") {
            const txt = node.text;
            // 检测 **加粗**、行首列表标记、引用块标记、或 $$ 公式
            if (
                /\*\*[^*]+\*\*/.test(txt) ||
                /^[-*]\s+/m.test(txt) ||
                /^\d+\.\s+/m.test(txt) ||
                /^>\s+/m.test(txt) ||
                /\$\$/.test(txt)
            ) {
                hasMarkers = true;
                return;
            }
        }
        if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
                walk(child);
            }
        }
    }

    walk(doc);
    return hasMarkers;
}

/**
 * 前端自愈与安全解析器：
 * 保证传入 NovelViewer 的内容始终是经过完整富文本 AST 解析与 LaTeX 规范化的结构
 */
export function ensureTipTapContent(content: any): JSONContent {
    if (!content) {
        return { type: "doc", content: [{ type: "paragraph" }] };
    }

    // 1. 如果是纯字符串
    if (typeof content === "string") {
        try {
            const parsed = JSON.parse(content);
            return ensureTipTapContent(parsed);
        } catch {
            // 纯 Markdown 字符串，直接转 TipTap
            return markdownToTipTap(content);
        }
    }

    // 2. 如果是对象
    if (typeof content === "object") {
        // 如果是包含未解析 Markdown 语法的旧版 doc，进行自愈提取并重新编译
        if (isUnparsedMarkdownDoc(content)) {
            const rawMd = docToMarkdown(content);
            return markdownToTipTap(rawMd);
        }

        // 如果已经是解析过的 doc，确保其中的公式没有 $$
        const jsonStr = JSON.stringify(content);
        if (jsonStr.includes("$$")) {
            const sanitizedStr = sanitizeLatex(jsonStr);
            try {
                return JSON.parse(sanitizedStr);
            } catch {
                return content;
            }
        }

        return content;
    }

    return { type: "doc", content: [{ type: "paragraph" }] };
}
