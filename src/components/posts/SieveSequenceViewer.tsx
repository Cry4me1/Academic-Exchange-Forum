"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import katex from "katex";

export interface SieveItem {
    num: number;
    raw: string;
    level: 0 | 1 | 2 | 3; // 0: 未筛, 1: 筛到1次 (), 2: 筛到2次 [], 3: 筛到3次 {} / 复合筛
}

interface SieveSequenceViewerProps {
    rawText?: string;
    items?: SieveItem[];
    className?: string;
    label?: string;
}

/**
 * 从可能包含 KaTeX 公式和普通文本的 DOM 元素中提取干净的原始文本，杜绝 MathML 导致的字符重复
 */
export function extractCleanTextFromElement(el: HTMLElement): string {
    if (!el) return "";
    let text = "";

    el.childNodes.forEach((node) => {
        if (node.nodeType === 3) {
            // 普通文本节点
            text += " " + (node.textContent || "") + " ";
        } else if (node.nodeType === 1) {
            const childEl = node as HTMLElement;
            // 避免读取已挂载的筛法容器
            if (childEl.classList.contains("sieve-portal-container")) return;

            // 如果是 KaTeX 数学公式渲染节点
            if (
                childEl.classList.contains("Tiptap-mathematics-render") ||
                childEl.classList.contains("katex") ||
                childEl.querySelector(".katex")
            ) {
                // 优先读取 LaTeX 原始公式 annotation，避开 MathML 和 HTML 双重渲染重复
                const annotation = childEl.querySelector('annotation[encoding="application/x-tex"]');
                if (annotation && annotation.textContent) {
                    text += " " + annotation.textContent + " ";
                } else {
                    const editor =
                        childEl.querySelector(".Tiptap-mathematics-editor") ||
                        (childEl.previousElementSibling?.classList.contains("Tiptap-mathematics-editor")
                            ? childEl.previousElementSibling
                            : null);
                    if (editor && editor.textContent) {
                        text += " " + editor.textContent + " ";
                    } else {
                        const htmlPart = childEl.querySelector(".katex-html");
                        text += " " + (htmlPart ? htmlPart.textContent : childEl.textContent) + " ";
                    }
                }
            } else if (childEl.tagName === "CODE") {
                text += " " + (childEl.textContent || "") + " ";
            } else {
                text += " " + extractCleanTextFromElement(childEl) + " ";
            }
        }
    });

    return text;
}

/**
 * 识别一个 token 是否属于筛法数字项，并提取层级和纯数字
 */
export function parseSieveToken(token: string): SieveItem | null {
    if (!token || typeof token !== "string") return null;
    const trimmed = token.trim();
    if (!trimmed) return null;

    // 检查是否符合筛法数字格式：由若干括号包裹纯数字
    const numMatch = trimmed.match(/\d+/);
    if (!numMatch) return null;

    // 必须仅由括号和数字构成（允许嵌套如 ({12}), [{12}]）
    if (!/^[\(\[\{]*\d+[\)\]\}]*$/.test(trimmed)) {
        return null;
    }

    const num = parseInt(numMatch[0], 10);
    if (isNaN(num)) return null;

    let level: 0 | 1 | 2 | 3 = 0;
    if (trimmed.includes("{") || trimmed.includes("}")) {
        level = 3; // 筛 3 次或花括号复合
    } else if (trimmed.includes("[") || trimmed.includes("]")) {
        level = 2; // 筛 2 次或中括号
    } else if (trimmed.includes("(") || trimmed.includes(")")) {
        level = 1; // 筛 1 次或小括号
    }

    return { num, level, raw: trimmed };
}

/**
 * 解析并严格验证筛法数字序列
 * 铁律约束（彻底杜绝将算法题样例、测试数据、坐标误判为筛法）：
 * 1. 序列必须包含至少 2 个以上带有筛标记（即括号 ()、[]、{}）的数字项；
 * 2. 序列中的数字必须是单调递增连续自然数（如 1, 2, 3, 4, 5, 6...，每项等于前项 + 1）；
 * 3. 序列长度必须 >= 5。
 */
export function parseSieveSequence(input: string | HTMLElement): SieveItem[] {
    const rawText =
        typeof input === "string" ? input : extractCleanTextFromElement(input);

    if (!rawText || typeof rawText !== "string") return [];

    // 清洗 LaTeX 反斜杠（如 \{12\} -> {12}）和可能存在的美元符号
    const cleaned = rawText.replace(/\\/g, "").replace(/\$/g, "");
    const tokens = cleaned.match(/[\(\[\{]*\d+[\)\]\}]*/g) || [];
    if (tokens.length < 5) return [];

    const items: SieveItem[] = [];
    let bracketCount = 0;

    for (const token of tokens) {
        const parsed = parseSieveToken(token);
        if (!parsed) continue;

        if (parsed.level > 0) {
            bracketCount++;
        }
        items.push(parsed);
    }

    // 约束 1：必须包含至少 2 个以上带有筛标记的括号数字（严禁误伤纯数字算法样例）
    if (bracketCount < 2) return [];

    // 约束 2：总项数至少为 5
    if (items.length < 5) return [];

    // 约束 3：数字必须严格连续递增（1, 2, 3, 4... 每步 +1）
    for (let i = 1; i < items.length; i++) {
        if (items[i].num !== items[i - 1].num + 1) {
            return []; // 任何不连续序列直接拒绝
        }
    }

    return items;
}

/**
 * 判断一段文本或 DOM 元素是否为合格的筛法演示序列
 */
export function isSieveSequence(input: string | HTMLElement): boolean {
    const items = parseSieveSequence(input);
    return items.length >= 5;
}

/**
 * 渲染包含 LaTeX 行内公式（如 $d=2$）的标题文本
 */
function renderMathLabel(labelStr?: string) {
    if (!labelStr) return <span>筛法数字序列状态演化</span>;

    if (!labelStr.includes("$")) {
        return <span>{labelStr}</span>;
    }

    const parts = labelStr.split(/(\$[^\$]+\$)/g);
    return (
        <span className="inline-flex items-center gap-1">
            {parts.map((part, idx) => {
                if (part.startsWith("$") && part.endsWith("$")) {
                    const formula = part.slice(1, -1).trim();
                    try {
                        const html = katex.renderToString(formula, {
                            displayMode: false,
                            throwOnError: false,
                        });
                        return (
                            <span
                                key={idx}
                                dangerouslySetInnerHTML={{ __html: html }}
                                className="inline-block align-baseline [&_.katex]:text-foreground/90 font-serif text-xs"
                            />
                        );
                    } catch {
                        return <span key={idx}>{part}</span>;
                    }
                }
                return <span key={idx}>{part}</span>;
            })}
        </span>
    );
}

export function SieveSequenceViewer({
    rawText,
    items: initialItems,
    className,
    label,
}: SieveSequenceViewerProps) {
    const items = useMemo(() => {
        if (initialItems && initialItems.length > 0) return initialItems;
        if (rawText) return parseSieveSequence(rawText);
        return [];
    }, [initialItems, rawText]);

    if (items.length === 0) return null;

    return (
        <div
            className={cn(
                "my-5 p-3.5 sm:p-4 rounded-2xl border-0 select-none",
                "bg-zinc-100/75 dark:bg-zinc-900/60 backdrop-blur-xl",
                "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)]",
                "transition-all duration-300",
                className
            )}
        >
            {/* 顶栏信息与学术图例指示 */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-foreground/85">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {renderMathLabel(label)}
                </div>

                {/* Apple 极简光学图例 */}
                <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />
                        未筛
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                        筛 1 次 ()
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-violet-500 inline-block shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                        筛 2 次 []
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                        筛 3+ 次 &#123;&#125;
                    </span>
                </div>
            </div>

            {/* 横向平滑微型胶囊网格轨道 */}
            <div className="overflow-x-auto scrollbar-none py-1.5 -mx-1 px-1">
                <div className="flex items-center gap-2 min-w-max">
                    {items.map((item, idx) => {
                        let levelStyles =
                            "bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_-1px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)]";
                        let tooltipText = `数字 ${item.num} (未被筛到)`;

                        if (item.level === 1) {
                            levelStyles =
                                "bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold shadow-[0_2px_10px_-2px_rgba(245,158,11,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.85)]";
                            tooltipText = `数字 ${item.num}: 被筛到 1 次 (${item.raw})`;
                        } else if (item.level === 2) {
                            levelStyles =
                                "bg-violet-500/20 text-violet-800 dark:text-violet-200 font-bold shadow-[0_2px_10px_-2px_rgba(139,92,246,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.85)]";
                            tooltipText = `数字 ${item.num}: 被筛到 2 次 (${item.raw})`;
                        } else if (item.level === 3) {
                            levelStyles =
                                "bg-rose-500/25 text-rose-800 dark:text-rose-200 font-bold shadow-[0_2px_12px_-2px_rgba(244,63,94,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.85)] ring-1 ring-rose-500/30";
                            tooltipText = `数字 ${item.num}: 被筛到 3+ 次 / 复合覆盖 (${item.raw})`;
                        }

                        return (
                            <div
                                key={`${item.num}-${idx}`}
                                title={tooltipText}
                                className={cn(
                                    "min-w-[2.5rem] h-9 px-2.5 rounded-full flex items-center justify-center relative",
                                    "font-mono text-xs transition-all duration-150 ease-out hover:scale-115 active:scale-95 cursor-default select-none",
                                    levelStyles
                                )}
                            >
                                <span className="tabular-nums tracking-tight">{item.num}</span>
                                {item.raw !== String(item.num) && (
                                    <span className="sr-only">({item.raw})</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default SieveSequenceViewer;
