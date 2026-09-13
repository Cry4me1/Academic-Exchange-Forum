"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import hljs from "highlight.js";

interface ChatCodeBlockProps {
    code: string;
    language?: string;
    className?: string;
}

/**
 * 精致代码块渲染组件
 * - 顶部语言 Tag + 一键复制按钮
 * - highlight.js 语法高亮
 * - 等宽字体 + 深色背景
 */
export function ChatCodeBlock({ code, language, className }: ChatCodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    // 语言别名映射
    const normalizeLanguage = (lang?: string): string => {
        if (!lang) return "";
        const map: Record<string, string> = {
            js: "javascript",
            ts: "typescript",
            py: "python",
            rb: "ruby",
            sh: "bash",
            yml: "yaml",
            md: "markdown",
            "c++": "cpp",
            "c#": "csharp",
        };
        const lower = lang.toLowerCase().trim();
        return map[lower] || lower;
    };

    const resolvedLang = normalizeLanguage(language);

    // 显示用的语言名称
    const displayLang = resolvedLang
        ? resolvedLang.charAt(0).toUpperCase() + resolvedLang.slice(1)
        : "Code";

    // highlight.js 高亮
    useEffect(() => {
        if (codeRef.current) {
            // 先清除之前的高亮
            codeRef.current.removeAttribute("data-highlighted");
            codeRef.current.className = resolvedLang ? `language-${resolvedLang}` : "";

            try {
                if (resolvedLang && hljs.getLanguage(resolvedLang)) {
                    const result = hljs.highlight(code, { language: resolvedLang });
                    codeRef.current.innerHTML = result.value;
                } else {
                    const result = hljs.highlightAuto(code);
                    codeRef.current.innerHTML = result.value;
                }
            } catch {
                // fallback: 原始文本
                codeRef.current.textContent = code;
            }
        }
    }, [code, resolvedLang]);

    // 一键复制
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const textarea = document.createElement("textarea");
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [code]);

    return (
        <div
            className={cn(
                "my-2 rounded-2xl overflow-hidden border-0",
                "bg-zinc-950/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_24px_-4px_rgba(0,0,0,0.4)]",
                className
            )}
        >
            {/* 顶部工具栏 */}
            <div className="relative flex items-center justify-between px-4 py-2 bg-zinc-900/80 dark:bg-zinc-900/80 backdrop-blur-md">
                {/* 语言 Tag */}
                <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                    {displayLang}
                </span>

                {/* 复制按钮 */}
                <button
                    onClick={handleCopy}
                    className={cn(
                        "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-all active:scale-95 duration-200",
                        copied
                            ? "text-emerald-400 bg-emerald-500/15 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                    )}
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3" />
                            已复制
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            复制
                        </>
                    )}
                </button>

                {/* 底部消融光缝 */}
                <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent pointer-events-none" />
            </div>

            {/* 代码内容 */}
            <div className="overflow-x-auto">
                <pre className="p-4 text-sm leading-relaxed">
                    <code
                        ref={codeRef}
                        className={resolvedLang ? `language-${resolvedLang}` : ""}
                        style={{ fontFamily: "var(--font-mono)" }}
                    >
                        {code}
                    </code>
                </pre>
            </div>
        </div>
    );
}

/**
 * 从 HTML 字符串中解析代码块
 * 将 <pre><code class="language-xxx"> 转为 ChatCodeBlock 组件
 */
export function parseCodeBlocks(html: string): Array<{
    type: "text" | "code";
    content: string;
    language?: string;
}> {
    if (!html) return [];

    const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
    // 匹配 TipTap 输出的 <pre><code class="language-xxx">...</code></pre>
    const codeBlockRegex =
        /<pre[^>]*>\s*<code(?:\s+class="language-([^"]*)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;

    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(html)) !== null) {
        // 代码块之前的文本
        if (match.index > lastIndex) {
            const textBefore = html.slice(lastIndex, match.index);
            if (textBefore.trim()) {
                parts.push({ type: "text", content: textBefore });
            }
        }

        // 代码块内容（HTML 实体解码）
        const codeContent = match[2]
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ");

        parts.push({
            type: "code",
            content: codeContent,
            language: match[1] || undefined,
        });

        lastIndex = match.index + match[0].length;
    }

    // 剩余文本
    if (lastIndex < html.length) {
        const remaining = html.slice(lastIndex);
        if (remaining.trim()) {
            parts.push({ type: "text", content: remaining });
        }
    }

    // 如果没有匹配到任何代码块，返回整个 HTML 作为 text
    if (parts.length === 0) {
        parts.push({ type: "text", content: html });
    }

    return parts;
}
