import type { JSONContent } from "novel";

/**
 * 从 JSONContent (Tiptap/Novel 编辑器格式) 递归提取纯文本
 * 保留段落换行，代码块前后添加 ``` 标记以保留格式上下文
 */
export function extractTextFromJSON(content: JSONContent): string {
    const parts: string[] = [];

    function traverse(node: JSONContent) {
        // 文本节点
        if (node.type === "text" && node.text) {
            parts.push(node.text);
            return;
        }

        // 代码块保留格式
        if (node.type === "codeBlock") {
            const lang = (node.attrs?.language as string) || "";
            const code =
                node.content?.map((n) => n.text || "").join("") || "";
            parts.push(`\n\`\`\`${lang}\n${code}\n\`\`\`\n`);
            return;
        }

        // 数学公式保留 LaTeX
        if (
            node.type === "math" ||
            node.type === "mathBlock" ||
            node.type === "mathematics" ||
            node.type === "inlineMath" ||
            node.type === "blockMath"
        ) {
            const latex =
                (node.attrs?.latex as string) ||
                (node.attrs?.math as string) ||
                (node.attrs?.content as string) ||
                "";
            if (latex) {
                parts.push(
                    node.type === "mathBlock" || node.type === "blockMath"
                        ? `\n$$${latex}$$\n`
                        : `$${latex}$`
                );
            }
            return;
        }

        // 图片跳过（审稿不处理图片）
        if (node.type === "image") {
            parts.push("\n[图片]\n");
            return;
        }

        // 段落/标题等块级元素后加换行
        if (
            [
                "paragraph",
                "heading",
                "blockquote",
                "listItem",
                "bulletList",
                "orderedList",
            ].includes(node.type || "")
        ) {
            // 标题前加标记
            if (node.type === "heading") {
                const level = (node.attrs?.level as number) || 1;
                parts.push("\n" + "#".repeat(level) + " ");
            }

            if (node.type === "blockquote") {
                parts.push("\n> ");
            }

            node.content?.forEach(traverse);
            parts.push("\n");
            return;
        }

        // 递归子节点
        node.content?.forEach(traverse);
    }

    traverse(content);
    return parts.join("").trim();
}

/**
 * 通用提取函数，支持对象或字符串格式
 */
export function extractTextFromContent(content: unknown): string {
    if (!content) return "";
    if (typeof content === "string") return content;
    try {
        return extractTextFromJSON(content as JSONContent);
    } catch {
        return "";
    }
}

/**
 * 清洗 Markdown / 富文本标记，生成干净无标记泄露的纯文本摘要
 */
export function cleanSummaryText(rawText: string): string {
    if (!rawText) return "";
    let text = rawText;

    // 1. 过滤 HTML 标签
    text = text.replace(/<[^>]+>/g, " ");

    // 2. 过滤代码块 ```...```
    text = text.replace(/```[\s\S]*?```/g, " ");

    // 3. 过滤行内代码 `...`
    text = text.replace(/`([^`]+)`/g, "$1");

    // 4. 过滤图片与链接 ![alt](url) / [text](url)
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

    // 5. 过滤 Markdown 标题行前缀（如 ## Title -> Title）
    text = text.replace(/^#+\s+/gm, "");
    text = text.replace(/\n#+\s+/g, " ");

    // 6. 过滤引用符号 >
    text = text.replace(/^>\s+/gm, "");
    text = text.replace(/\n>\s+/g, " ");

    // 7. 过滤粗体、斜体、删除线 **text** -> text, *text* -> text, ~~text~~ -> text
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");
    text = text.replace(/~~(.*?)~~/g, "$1");

    // 8. 过滤无序列表与有序列表标记 - item / 1. item
    text = text.replace(/^[\*\-\+]\s+/gm, "");
    text = text.replace(/^\d+\.\s+/gm, "");

    // 9. 过滤水平分割线 --- / ***
    text = text.replace(/^[\*\-_]{3,}$/gm, " ");

    // 10. 处理 LaTeX 块公式 $$...$$ 与行内公式 $...$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, " $1 ");
    text = text.replace(/\$([^\$]+)\$/g, " $1 ");

    // 11. 将多个换行符、制表符、连续空格压缩为单个空格
    text = text.replace(/[\r\n\t]+/g, " ");
    text = text.replace(/\s{2,}/g, " ");

    return text.trim();
}

/**
 * 截断文本到指定字符数，确保不会在单词中间截断
 */
export function truncateText(text: string, maxLength: number = 8000): string {
    if (text.length <= maxLength) return text;

    const truncated = text.slice(0, maxLength);
    // 尝试在最后一个换行符处截断
    const lastNewline = truncated.lastIndexOf("\n");
    const cutPoint = lastNewline > maxLength * 0.8 ? lastNewline : maxLength;

    return (
        truncated.slice(0, cutPoint) +
        "\n\n[注：原文过长，以上为前 " +
        cutPoint +
        " 字符的内容]"
    );
}
