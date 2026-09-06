import { DOMParser as ProseMirrorDOMParser, Schema } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { marked } from "marked";

export interface MarkdownParseResult {
    title?: string;
    content: string;
    html: string;
}

/**
 * 判断纯文本是否包含显著的 Markdown 语法特征
 */
export function isMarkdownText(text: string): boolean {
    if (!text || typeof text !== "string") return false;

    const trimmed = text.trim();
    if (!trimmed) return false;

    // 块级特征评分
    let score = 0;

    // 1. 标题语法 (# 标题)
    if (/^#{1,6}\s+.+$/m.test(trimmed)) score += 3;

    // 2. 围栏代码块 (```lang ... ```)
    if (/^```[a-zA-Z0-9_-]*\n[\s\S]*?\n```$/m.test(trimmed)) score += 4;

    // 3. LaTeX 块级公式 ($$ ... $$) 或行内公式 ($...$)
    if (/\$\$[\s\S]*?\$\$/.test(trimmed)) score += 3;
    if (/\$[^$\n]{1,80}\$/.test(trimmed)) score += 2;

    // 4. 学术环境/引用 (> [!THEOREM] 或 > 引用)
    if (/^>\s*\[!(THEOREM|LEMMA|DEFINITION|PROPOSITION|COROLLARY|PROOF|EXAMPLE|REMARK)\]/im.test(trimmed)) score += 4;
    if (/^>\s+.+$/m.test(trimmed)) score += 2;

    // 5. 列表语法 (- item, * item, 1. item)
    const listMatches = trimmed.match(/^(\*|-|\+|\d+\.)\s+.+$/gm);
    if (listMatches && listMatches.length >= 2) {
        score += 3; // 多个列表项为强特征
    } else if (listMatches && listMatches.length === 1) {
        score += 2;
    }

    // 6. 待办任务清单 (- [ ] task)
    if (/^[-*]\s+\[[ xX]\]\s+.+$/m.test(trimmed)) score += 3;

    // 7. 表格语法 (| 列1 | 列2 |)
    if (/\|.+\|[\r\n]+\|[-:\s|]+\|/m.test(trimmed)) score += 3;

    // 8. 常见行内修饰 (加粗/链接/图片)
    if (/\*\*[^*\n]+\*\*/.test(trimmed)) score += 1;
    if (/!\[.*?\]\(.*?\)/.test(trimmed)) score += 2;
    if (/\[.*?\]\(https?:\/\/.*?\)/.test(trimmed)) score += 1;

    // 阈值：得分达到 3 分及以上，判定为 Markdown
    return score >= 3;
}

/**
 * 从 Markdown 源码中提取首行一级标题或 Frontmatter 标题
 */
export function extractTitleAndContent(rawMarkdown: string): { title?: string; content: string } {
    if (!rawMarkdown) return { content: "" };

    let text = rawMarkdown.replace(/\r\n/g, "\n");
    let extractedTitle: string | undefined = undefined;

    // 1. 匹配 YAML Frontmatter (如 --- \n title: 标题 \n ---)
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (frontmatterMatch) {
        const yamlContent = frontmatterMatch[1];
        const titleMatch = yamlContent.match(/^title:\s*["']?([^"'\n]+)["']?$/m);
        if (titleMatch) {
            extractedTitle = titleMatch[1].trim();
        }
        text = text.slice(frontmatterMatch[0].length);
    }

    // 2. 若未从 Frontmatter 提取，则检查正文前几行是否有 # 一级标题
    if (!extractedTitle) {
        const lines = text.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // 跳过空行

            const heading1Match = line.match(/^#\s+(.+)$/);
            if (heading1Match) {
                extractedTitle = heading1Match[1].trim();
                // 从正文中移除这一行一级大标题，保持正文紧凑清爽
                lines.splice(i, 1);
                text = lines.join("\n");
                break;
            } else {
                // 如果遇到的第一行非空文字不是一级标题，则不强行提取标题
                break;
            }
        }
    }

    return {
        title: extractedTitle,
        content: text.trim(),
    };
}

/**
 * 将学术 Markdown 文本安全转换为符合 Scholarly Tiptap 规范的 HTML 结构
 */
export function markdownToTiptapHtml(markdown: string): string {
    if (!markdown) return "";

    // 1. 预处理数学公式：保护公式字符（如 _、*、^、\）不被 markdown 引擎误当成斜体/粗体解析
    const mathBlocks: string[] = [];
    let processed = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
        const token = `XMATHBLOCKTOKEN${mathBlocks.length}END`;
        mathBlocks.push(`$$${formula}$$`);
        return token;
    });

    const inlineMath: string[] = [];
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, formula) => {
        const token = `XINLINEMATHTOKEN${inlineMath.length}END`;
        inlineMath.push(`$${formula}$`);
        return token;
    });

    // 2. 调用 marked 进行 GFM 标准转换
    let html = marked.parse(processed, {
        gfm: true,
        breaks: false,
    }) as string;

    // 3. 还原数学公式
    inlineMath.forEach((math, i) => {
        html = html.replace(`XINLINEMATHTOKEN${i}END`, () => math);
    });
    mathBlocks.forEach((math, i) => {
        html = html.replace(`XMATHBLOCKTOKEN${i}END`, () => math);
    });

    // 4. 将 mermaid 代码块转换为 Tiptap MermaidBlock 节点 DOM 结构
    html = html.replace(
        /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
        (_match, code) => {
            const decoded = code
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
            const escaped = decoded.replace(/"/g, "&quot;");
            return `<div data-type="mermaid-block" data-content="${escaped}"></div>`;
        }
    );

    // 5. 将 GitHub 风格学术 Callout (> [!THEOREM] ...) 映射为 AcademicBlock 节点 DOM
    html = html.replace(
        /<blockquote>\s*<p>\s*\[!(THEOREM|LEMMA|DEFINITION|PROPOSITION|COROLLARY|PROOF|EXAMPLE|REMARK)\](?:\s+([^\n<]+))?\s*(?:<br>|\n)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
        (_match, type, title, body) => {
            const academicType = type.toLowerCase();
            const safeTitle = (title || "").trim().replace(/"/g, "&quot;");
            return `<div data-type="academic-block" data-academic-type="${academicType}" data-academic-title="${safeTitle}"><p>${body.trim()}</p></div>`;
        }
    );

    // 6. 将任务列表转为 Tiptap TaskList 与 TaskItem 节点规范
    html = html.replace(/<ul>\s*(<li>\s*<input[^>]*type="checkbox"[^>]*>[\s\S]*?<\/li>\s*)+<\/ul>/g, (taskListMatch) => {
        let converted = taskListMatch.replace(/<ul>/g, '<ul data-type="taskList">');
        converted = converted.replace(/<li>\s*<input([^>]*)type="checkbox"([^>]*)>([\s\S]*?)<\/li>/g, (_itemMatch, before, after, content) => {
            const checked = (before + after).includes("checked") ? "true" : "false";
            return `<li data-type="taskItem" data-checked="${checked}"><p>${content.trim()}</p></li>`;
        });
        return converted;
    });

    return html;
}

/**
 * 将解析好的 HTML 作为 ProseMirror 节点切片注入编辑器
 */
export function insertHtmlIntoEditor(
    view: EditorView,
    html: string,
    options: { replaceSelection?: boolean } = { replaceSelection: true }
): boolean {
    if (!view || !html) return false;

    try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        const parser = ProseMirrorDOMParser.fromSchema(view.state.schema as Schema);
        const slice = parser.parseSlice(tempDiv);

        if (options.replaceSelection) {
            const tr = view.state.tr.replaceSelection(slice);
            view.dispatch(tr.scrollIntoView());
        } else {
            const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, slice.content);
            view.dispatch(tr.scrollIntoView());
        }

        return true;
    } catch (err) {
        console.error("[insertHtmlIntoEditor] 注入编辑器节点失败:", err);
        return false;
    }
}
