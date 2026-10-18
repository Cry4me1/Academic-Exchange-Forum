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

export interface CleanSummaryOptions {
    /** 是否彻底去除 URL（替换为空格），默认为 false 即替换为简短平台标记 🔗 Badge */
    stripUrls?: boolean;
    /** 是否保留 LaTeX 数学公式标记 $（供富公式分享卡片使用），默认为 false */
    preserveMath?: boolean;
}

/**
 * 将裸露的长 URL 转换为语义化的简短文本标记（如 🔗 GitHub、🔗 arXiv 等）
 * 消除长链接造成的异常断行、字符挤压以及视觉噪声
 */
export function formatUrlBadge(rawUrl: string): string {
    let cleanUrl = rawUrl;
    let leading = "";
    let trailing = "";

    // 剥离可能存在的开头括号或引号（若外部直接传入裸串）
    const leadMatch = cleanUrl.match(/^([(\[{<“‘"']+)(.*)$/);
    if (leadMatch) {
        leading = leadMatch[1];
        cleanUrl = leadMatch[2];
    }

    // 剥离常见的英文和中文尾部标点符号（如末尾句号、逗号、问号、感叹号、引号等）
    const punctMatch = cleanUrl.match(/^(.*?)([.,:;!?'"”’，。！？]+)$/);
    if (punctMatch) {
        cleanUrl = punctMatch[1];
        trailing = punctMatch[2] + trailing;
    }

    // 处理结尾括号：如果外部多了一个未匹配的闭括号，则剥离到 trailing
    while (cleanUrl.endsWith(")") || cleanUrl.endsWith("）")) {
        const openCount = (cleanUrl.match(/\(/g) || []).length;
        const closeCount = (cleanUrl.match(/\)/g) || []).length;
        if (closeCount > openCount || cleanUrl.endsWith("）")) {
            trailing = cleanUrl.slice(-1) + trailing;
            cleanUrl = cleanUrl.slice(0, -1);
        } else {
            break;
        }
    }

    try {
        const parsed = new URL(cleanUrl);
        const host = parsed.hostname.toLowerCase();
        let label = "网页链接";

        if (host === "github.com" || host.endsWith(".github.com")) label = "GitHub";
        else if (host === "arxiv.org" || host.endsWith(".arxiv.org")) label = "arXiv";
        else if (host === "huggingface.co" || host.endsWith(".huggingface.co")) label = "Hugging Face";
        else if (host === "bilibili.com" || host.endsWith(".bilibili.com")) label = "Bilibili";
        else if (host === "zhihu.com" || host.endsWith(".zhihu.com")) label = "知乎";
        else if (host === "luogu.com.cn" || host.endsWith(".luogu.com.cn")) label = "洛谷";
        else if (host === "wikipedia.org" || host.endsWith(".wikipedia.org")) label = "维基百科";
        else if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") label = "YouTube";
        else if (host === "x.com" || host === "twitter.com") label = "X";
        else if (host === "gitlab.com" || host.endsWith(".gitlab.com")) label = "GitLab";
        else if (host === "gitee.com" || host.endsWith(".gitee.com")) label = "Gitee";
        else if (host === "scholar.google.com") label = "Google Scholar";
        else if (host === "paperswithcode.com" || host.endsWith(".paperswithcode.com")) label = "Papers with Code";
        else if (host === "openreview.net" || host.endsWith(".openreview.net")) label = "OpenReview";
        else if (host === "doi.org" || host.endsWith(".doi.org")) label = "DOI";

        return `${leading} 🔗 ${label} ${trailing}`;
    } catch {
        return `${leading} 🔗 链接 ${trailing}`;
    }
}

/**
 * 清洗 Markdown / 富文本标记，生成干净无标记泄露的纯文本摘要
 * - 过滤 HTML 标签、代码块、列表标记、标题符号等
 * - 清洗裸露的 http/https 长链接，将其替换为优雅简短的平台文本标记（如 🔗 GitHub）
 * - 支持字符串输入或 Novel/Tiptap JSONContent 对象
 */
export function cleanSummaryText(
    content: unknown,
    options?: CleanSummaryOptions
): string {
    if (!content) return "";
    let text = typeof content === "string" ? content : extractTextFromContent(content);

    // 0. 将 Markdown 自动链接 <http...> 与方括号包裹的裸链接 [http...] 转换为普通 URL
    text = text.replace(/<(https?:\/\/[^>]+)>/g, "$1");
    text = text.replace(/\[(https?:\/\/[^\]]+)\]/g, "$1");

    // 1. 过滤 HTML 标签
    text = text.replace(/<[^>]+>/g, " ");

    // 2. 过滤代码块 ```...```
    text = text.replace(/```[\s\S]*?```/g, " ");

    // 3. 过滤行内代码 `...`
    text = text.replace(/`([^`]+)`/g, "$1");

    // 4. 过滤图片与链接 ![alt](url) / [text](url)
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

    // 5. 过滤或清洗裸露的 http/https 长链接
    const urlRegex = /https?:\/\/[a-zA-Z0-9\-._~:/?#@!$&'()*+,;=%]+/g;
    if (options?.stripUrls) {
        text = text.replace(urlRegex, " ");
    } else {
        text = text.replace(urlRegex, (matched) => formatUrlBadge(matched));
    }

    // 6. 过滤 Markdown 标题行前缀（如 ## Title -> Title）
    text = text.replace(/^#+\s+/gm, "");
    text = text.replace(/\n#+\s+/g, " ");

    // 7. 过滤引用符号 >
    text = text.replace(/^>\s+/gm, "");
    text = text.replace(/\n>\s+/g, " ");

    // 8. 过滤粗体、斜体、删除线 **text** -> text, *text* -> text, ~~text~~ -> text
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");
    text = text.replace(/~~(.*?)~~/g, "$1");

    // 9. 过滤无序列表与有序列表标记 - item / 1. item
    text = text.replace(/^[\*\-\+]\s+/gm, "");
    text = text.replace(/^\d+\.\s+/gm, "");

    // 10. 过滤水平分割线 --- / ***
    text = text.replace(/^[\*\-_]{3,}$/gm, " ");

    // 11. 处理 LaTeX 块公式 $$...$$ 与行内公式 $...$
    if (!options?.preserveMath) {
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, " $1 ");
        text = text.replace(/\$([^\$]+)\$/g, " $1 ");
    }

    // 12. 将多个换行符、制表符、连续空格压缩为单个空格
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
