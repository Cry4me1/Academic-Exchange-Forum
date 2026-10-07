"use client";

import { useEffect, useRef } from "react";
import { PostAnnotation, AnnotationColor } from "./types";

interface UseAnnotationHighlighterProps {
    containerRef: React.RefObject<HTMLElement | null>;
    annotations: PostAnnotation[];
    activeAnnotationId: string | null;
    onSelectAnnotation: (id: string) => void;
}

const COLOR_CLASSES: Record<AnnotationColor, string> = {
    amber: "bg-amber-400/25 dark:bg-amber-400/30 hover:bg-amber-400/40 dark:hover:bg-amber-400/45 border-b-2 border-amber-500/80 dark:border-amber-400/90",
    emerald: "bg-emerald-400/25 dark:bg-emerald-400/30 hover:bg-emerald-400/40 dark:hover:bg-emerald-400/45 border-b-2 border-emerald-500/80 dark:border-emerald-400/90",
    sky: "bg-sky-400/25 dark:bg-sky-400/30 hover:bg-sky-400/40 dark:hover:bg-sky-400/45 border-b-2 border-sky-500/80 dark:border-sky-400/90",
    violet: "bg-purple-400/25 dark:bg-purple-400/30 hover:bg-purple-400/40 dark:hover:bg-purple-400/45 border-b-2 border-purple-500/80 dark:border-purple-400/90",
};

/**
 * 从可能包含 KaTeX/MathML/换行的原始 anchor_text 中提取干净的自然语言搜索短语列表
 */
export function extractCleanSearchPhrases(rawText: string): string[] {
    if (!rawText) return [];

    // 1. 过滤掉 LaTeX 标记 ($...$ 或 \[...\] 或 \(...\))、数学斜体 Unicode 符号与换行
    const stripped = rawText
        .replace(/\\\$[^$]*\\\$/g, " ")
        .replace(/\$[^$]*\$/g, " ")
        .replace(/\\\[[\s\S]*?\\\]/g, " ")
        .replace(/\\\([\s\S]*?\\\)/g, " ")
        .replace(/[\u{1D400}-\u{1D7FF}]/gu, " ")
        .replace(/[\r\n\t]+/g, " ");

    const results: string[] = [];

    // 整段清理后的文本
    const cleanedFull = stripped.replace(/[\s\u00A0]+/g, " ").trim();
    if (cleanedFull.length >= 4) {
        results.push(cleanedFull);
    }

    // 2. 按中文标点符号、句子分隔符切分
    const phrases = stripped
        .split(/[,，。！？；;:\(\)（）\n\r]+/)
        .map((p) => p.replace(/[\s\u00A0]+/g, " ").trim())
        .filter((p) => p.length >= 3);

    results.push(...phrases);

    // 3. 排序：最长、最具唯一性的短语排在最前面
    const unique = Array.from(new Set(results));
    unique.sort((a, b) => b.length - a.length);
    return unique;
}

/**
 * 智能文本段落模糊寻址器（用于段落定位 Fallback）
 */
export function findElementContainingText(
    container: HTMLElement,
    targetText: string
): HTMLElement | null {
    if (!container || !targetText) return null;

    // 优先选择最内层的段落、标题、列表项、引用块
    const candidates = Array.from(
        container.querySelectorAll<HTMLElement>(
            "p, h1, h2, h3, h4, h5, h6, li, blockquote, tr, td"
        )
    ).filter((el) => {
        return (
            !el.closest(".math-desmos-portal-container") &&
            !el.closest(".sieve-portal-container") &&
            !el.closest(".annotation-bubble-wrapper")
        );
    });

    const searchTargets = [
        targetText.replace(/[\s\u00A0]+/g, " ").trim(),
        ...extractCleanSearchPhrases(targetText),
    ].filter((t) => t.length >= 3);

    for (const search of searchTargets) {
        // 寻找所有包含此搜索词的候选元素
        const matches = candidates.filter((el) => {
            const text = (el.textContent || "").replace(/[\s\u00A0]+/g, " ");
            return text.includes(search);
        });

        if (matches.length > 0) {
            // 选择 textContent 最短的那个元素（确保是最精确的最内层段落节点，避免选到庞大的父容器）
            matches.sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0));
            return matches[0];
        }
    }

    // 兜底：如果上面的选择器未匹配到（例如直接写在未被 p 包裹的行内或 div 中），进行叶子 div 搜索
    const allDivs = Array.from(container.querySelectorAll<HTMLElement>("div")).filter((d) => {
        return d.querySelectorAll("div, p").length === 0;
    });

    for (const search of searchTargets) {
        const matches = allDivs.filter((el) => {
            const text = (el.textContent || "").replace(/[\s\u00A0]+/g, " ");
            return text.includes(search);
        });
        if (matches.length > 0) {
            matches.sort((a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0));
            return matches[0];
        }
    }

    return null;
}

/**
 * 创建批注高亮 mark DOM 节点
 */
function createMarkElement(
    annotation: PostAnnotation,
    onSelect: (id: string) => void
): HTMLElement {
    const colorClass = COLOR_CLASSES[annotation.color] || COLOR_CLASSES.amber;
    const mark = document.createElement("mark");
    mark.className = `scholarly-annotation-mark ${colorClass} rounded-xs px-0.5 cursor-pointer transition-all duration-150 text-inherit`;
    mark.dataset.annotationId = annotation.id;
    mark.dataset.color = annotation.color;
    mark.title = `[${annotation.author.username} 批注]: ${annotation.content.slice(0, 40)}... (点击查看详情)`;

    mark.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(annotation.id);
    });

    return mark;
}

/**
 * 清理容器内所有批注 mark 标签并合并相邻文本节点
 */
function cleanHighlighter(container: HTMLElement | null) {
    if (!container) return;

    const marks = container.querySelectorAll<HTMLElement>("mark.scholarly-annotation-mark");
    marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (parent) {
            while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
            }
            parent.removeChild(mark);
            parent.normalize();
        }
    });
}

/**
 * 在容器中为一个批注挂载高亮
 */
function highlightAnnotation(
    container: HTMLElement,
    annotation: PostAnnotation,
    onSelect: (id: string) => void
): boolean {
    const rawTarget = annotation.anchor_text;
    if (!rawTarget) return false;

    // 获取搜索短语列表（先完整清理文本，后独特长短句）
    const phrases = extractCleanSearchPhrases(rawTarget);
    const searchTargets = [
        rawTarget.replace(/[\s\u00A0]+/g, " ").trim(),
        ...phrases,
    ].filter(Boolean);

    // 搜索容器内的所有段落块
    const blocks = container.querySelectorAll<HTMLElement>(
        ".ProseMirror > *, .novel-viewer-container p, .novel-viewer-container h1, .novel-viewer-container h2, .novel-viewer-container h3, .novel-viewer-container h4, .novel-viewer-container li, .novel-viewer-container blockquote, p, h1, h2, h3, h4, li, blockquote"
    );

    for (const cleanTarget of searchTargets) {
        if (cleanTarget.length < 3) continue;

        for (const block of blocks) {
            if (
                block.closest(".math-desmos-portal-container") ||
                block.closest(".sieve-portal-container")
            ) {
                continue;
            }

            const blockText = (block.textContent || "").replace(/[\s\u00A0]+/g, " ");
            const matchIdx = blockText.indexOf(cleanTarget);
            if (matchIdx === -1) continue;

            // 收集块内文本节点
            const textNodes: Text[] = [];
            const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    const p = node.parentElement;
                    if (
                        p?.closest(".scholarly-annotation-mark") ||
                        p?.closest("button") ||
                        p?.closest(".math-desmos-portal-container")
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                },
            });

            let tNode = walker.nextNode();
            while (tNode) {
                textNodes.push(tNode as Text);
                tNode = walker.nextNode();
            }

            if (textNodes.length === 0) continue;

            // 1. 在单个文本节点内提取挂载
            for (const tn of textNodes) {
                const tnText = (tn.nodeValue || "").replace(/\u00A0/g, " ");
                const idx = tnText.indexOf(cleanTarget);

                if (idx !== -1) {
                    try {
                        const range = document.createRange();
                        range.setStart(tn, idx);
                        range.setEnd(tn, idx + cleanTarget.length);

                        const extracted = range.extractContents();
                        const mark = createMarkElement(annotation, onSelect);
                        mark.appendChild(extracted);
                        range.insertNode(mark);
                        return true;
                    } catch (err) {
                        console.warn("[AnnotationHighlighter] single node extract error:", err);
                    }
                }
            }

            // 2. 跨多文本节点匹配
            let cumulative = 0;
            const nodeMap: { node: Text; start: number; end: number }[] = [];
            for (const tn of textNodes) {
                const text = (tn.nodeValue || "").replace(/\u00A0/g, " ");
                nodeMap.push({
                    node: tn,
                    start: cumulative,
                    end: cumulative + text.length,
                });
                cumulative += text.length;
            }

            const startChar = matchIdx;
            const endChar = matchIdx + cleanTarget.length;

            const startEntry = nodeMap.find((m) => startChar >= m.start && startChar < m.end);
            const endEntry = nodeMap.find((m) => endChar > m.start && endChar <= m.end);

            if (startEntry && endEntry) {
                try {
                    const range = document.createRange();
                    range.setStart(startEntry.node, Math.max(0, startChar - startEntry.start));
                    range.setEnd(endEntry.node, Math.min(endEntry.node.length, endChar - endEntry.start));

                    const extracted = range.extractContents();
                    const mark = createMarkElement(annotation, onSelect);
                    mark.appendChild(extracted);
                    range.insertNode(mark);
                    return true;
                } catch (err) {
                    console.warn("[AnnotationHighlighter] cross node extract error:", err);
                }
            }
        }
    }

    return false;
}

/**
 * 非侵入式 DOM 行间批注高亮挂载引擎
 */
export function useAnnotationHighlighter({
    containerRef,
    annotations,
    activeAnnotationId,
    onSelectAnnotation,
}: UseAnnotationHighlighterProps) {
    const onSelectRef = useRef(onSelectAnnotation);
    onSelectRef.current = onSelectAnnotation;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !annotations || annotations.length === 0) {
            cleanHighlighter(container);
            return;
        }

        let isCleanedUp = false;
        let isApplying = false;

        const applyHighlights = () => {
            if (isCleanedUp || isApplying || !container) return;
            isApplying = true;

            try {
                // 1. 先安全还原已有 mark 节点
                cleanHighlighter(container);

                // 2. 遍历批注并在 DOM 中寻找匹配文本节点
                for (const annotation of annotations) {
                    highlightAnnotation(
                        container,
                        annotation,
                        (id) => onSelectRef.current(id)
                    );
                }

                // 3. 为当前激活的批注添加呼吸聚焦状态
                if (activeAnnotationId) {
                    const activeMarks = container.querySelectorAll<HTMLElement>(
                        `mark[data-annotation-id="${activeAnnotationId}"]`
                    );
                    activeMarks.forEach((mark) => {
                        mark.classList.add("ring-2", "ring-primary/50", "bg-opacity-50");
                    });
                }
            } finally {
                isApplying = false;
            }
        };

        // 阶梯式延迟适配 NovelViewer / Tiptap 异步挂载
        applyHighlights();
        const t1 = setTimeout(applyHighlights, 100);
        const t2 = setTimeout(applyHighlights, 300);
        const t3 = setTimeout(applyHighlights, 700);
        const t4 = setTimeout(applyHighlights, 1500);

        // 监听容器内部异步 DOM 变动（当 Novel 完成渲染时自动触发高亮）
        let observerDebounce: NodeJS.Timeout | null = null;
        const observer = new MutationObserver((mutations) => {
            if (isApplying || isCleanedUp) return;

            const hasExternalChanges = mutations.some((m) => {
                return Array.from(m.addedNodes).some((n) => {
                    if (n.nodeType === Node.ELEMENT_NODE) {
                        return !(n as HTMLElement).classList?.contains("scholarly-annotation-mark");
                    }
                    return true;
                });
            });

            if (hasExternalChanges) {
                if (observerDebounce) clearTimeout(observerDebounce);
                observerDebounce = setTimeout(applyHighlights, 180);
            }
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
        });

        return () => {
            isCleanedUp = true;
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            if (observerDebounce) clearTimeout(observerDebounce);
            observer.disconnect();
            cleanHighlighter(container);
        };
    }, [containerRef, annotations, activeAnnotationId]);
}
