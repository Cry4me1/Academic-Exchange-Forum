"use client";

import { Component, type ErrorInfo, type ReactNode, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { EditorContent, EditorRoot, type JSONContent } from "novel";
import katex from "katex";
import { cn } from "@/lib/utils";
import { viewerExtensions } from "./viewer-extensions";
import MathViewerComponent from "./extensions/MathViewerComponent";
import { toast } from "sonner";
import { SieveSequenceViewer, isSieveSequence, parseSieveSequence, type SieveItem } from "@/components/posts/SieveSequenceViewer";
import { TableChartViewer, parseTableData, type ParsedTableData } from "@/components/posts";

// Error boundary to catch Tiptap rendering crashes
class ViewerErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[NovelViewer] Render error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 text-sm">
                    <p className="font-semibold text-orange-600 mb-1">
                        ⚠ 内容渲染出错
                    </p>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {this.state.error?.message}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

interface NovelViewerProps {
    initialValue?: JSONContent | any;
    content?: JSONContent | any;
    className?: string;
    editorClassName?: string;
}

// 辅助函数，判定 LaTeX 是否为函数公式
function checkIsFunction(latex: string) {
    const trimmed = latex.trim();
    const clean = trimmed.replace(/^\$+|\$+$/g, "").trim();
    const lower = clean.toLowerCase();

    const hasXOrTheta = lower.includes("x") || lower.includes("\\theta") || lower.includes("t") || lower.includes("y");
    if (!hasXOrTheta) return { isFunc: false, desmosLatex: "" };

    const invalidKeywords = ["\\sum", "\\int", "\\lim", "\\matrix", "\\frac{d}{dx}", "\\approx", ">", "<", "\\ge", "\\le"];
    const hasInvalid = invalidKeywords.some(keyword => lower.includes(keyword));
    if (hasInvalid) return { isFunc: false, desmosLatex: "" };

    if (clean.includes("=")) {
        return { isFunc: true, desmosLatex: clean };
    } else {
        return { isFunc: true, desmosLatex: `y = ${clean}` };
    }
}

export default function NovelViewer({
    initialValue,
    content,
    className,
    editorClassName,
}: NovelViewerProps) {
    const valueToRender = initialValue || content;
    const containerRef = useRef<HTMLDivElement>(null);
    const [mathPortals, setMathPortals] = useState<{ id: string; element: HTMLElement; latex: string }[]>([]);
    const [sievePortals, setSievePortals] = useState<{
        id: string;
        element: HTMLElement;
        items: SieveItem[];
        label?: string;
    }[]>([]);
    const [tablePortals, setTablePortals] = useState<{
        id: string;
        element: HTMLElement;
        tableData: ParsedTableData;
        tableElement: HTMLElement;
    }[]>([]);

    const serializedValue = JSON.stringify(valueToRender);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isCleanedUp = false;

        const scanAndMount = () => {
            if (isCleanedUp || !container) return;

            const renders = container.querySelectorAll(".Tiptap-mathematics-render");
            const newDesmosPortals: typeof mathPortals = [];
            const newSievePortals: typeof sievePortals = [];
            const newTablePortals: typeof tablePortals = [];

            // 1. 处理公式：Desmos 函数交互 + 独立居中公式悬停复制 + \tag 原生右对齐锁定
            renders.forEach((renderElNode, index) => {
                const renderEl = renderElNode as HTMLElement;

                // 在同级或父节点下寻找原 LaTeX 隐藏编辑节点
                let editorEl = renderEl.previousElementSibling as HTMLElement;
                if (!editorEl || !editorEl.classList.contains("Tiptap-mathematics-editor")) {
                    editorEl = renderEl.parentNode?.querySelector(".Tiptap-mathematics-editor") as HTMLElement;
                }

                let latex = "";
                if (editorEl && editorEl.classList.contains("Tiptap-mathematics-editor")) {
                    latex = editorEl.textContent || "";
                } else {
                    // 尝试从 KaTeX annotation 提取
                    const annotation = renderEl.querySelector('annotation[encoding="application/x-tex"]');
                    if (annotation && annotation.textContent) {
                        latex = annotation.textContent;
                    }
                }

                if (!latex) return;

                // 规范化手动手打编号 (**) -> \tag{**}
                const hasManualTag = /\\(quad|qquad)\s*\(\s*(\*+)\s*\)|\s*\(\s*(\*+)\s*\)$/.test(latex);
                const hasLatexTag = latex.includes("\\tag{");
                const isDisplayOrLong =
                    hasLatexTag ||
                    hasManualTag ||
                    renderEl.classList.contains("Tiptap-mathematics-render--block") ||
                    renderEl.querySelector(".katex-display") !== null ||
                    latex.length > 35;

                let normalizedLatex = latex;
                if (hasManualTag && !hasLatexTag) {
                    normalizedLatex = latex
                        .replace(/\\(quad|qquad)\s*\(\s*(\*+)\s*\)/g, "\\tag{$2}")
                        .replace(/\s*\(\s*(\*+)\s*\)$/g, "\\tag{$1}");
                }

                // 如果包含 \tag 或被标识为独立行公式，确保在 displayMode 下重新渲染以锁定右端
                if ((hasLatexTag || hasManualTag) && !renderEl.dataset.katexRetagged) {
                    try {
                        renderEl.dataset.katexRetagged = "true";
                        katex.render(normalizedLatex, renderEl, {
                            displayMode: true,
                            throwOnError: false,
                            strict: "ignore",
                        });
                        renderEl.classList.add("Tiptap-mathematics-render--block", "w-full", "my-2");
                    } catch (err) {
                        console.warn("[NovelViewer] KaTeX tag render warning:", err);
                    }
                }

                // 挂载 Desmos 交互窗格
                const { isFunc } = checkIsFunction(normalizedLatex);
                if (isFunc) {
                    const sibling = renderEl.nextSibling as HTMLElement;
                    if (!sibling || !sibling.classList?.contains("math-desmos-portal-container")) {
                        const portalEl = document.createElement("span");
                        portalEl.className = "math-desmos-portal-container inline-block align-middle";
                        renderEl.parentNode?.insertBefore(portalEl, renderEl.nextSibling);

                        newDesmosPortals.push({
                            id: `desmos-portal-${index}-${Date.now()}`,
                            element: portalEl,
                            latex: normalizedLatex,
                        });
                    }
                }

                // 支持点击公式直接复制 LaTeX 源码（消灭浮动按钮）
                renderEl.dataset.latexSource = normalizedLatex;
                renderEl.title = "点击复制 LaTeX 公式源码";
                renderEl.classList.add(
                    "cursor-pointer",
                    "transition-all",
                    "duration-150",
                    "hover:bg-zinc-500/5",
                    "dark:hover:bg-zinc-400/10",
                    "active:scale-[0.99]",
                    "rounded-md"
                );
            });

            // 2. 检查并增强「数字筛法微型胶囊网格」演示段落
            const paragraphs = container.querySelectorAll("p");
            paragraphs.forEach((p, pIdx) => {
                if (p.getAttribute("data-sieve-hidden") === "true" || p.dataset.sieveMounted === "true") return;

                const items = parseSieveSequence(p);
                if (items.length < 5) return;

                // 检查是否已经挂载过筛法容器
                const nextEl = p.nextElementSibling as HTMLElement;
                if (nextEl && nextEl.classList?.contains("sieve-portal-container")) {
                    return;
                }

                // 标记已处理，绝不重复生成
                p.dataset.sieveMounted = "true";

                // 上下文前缀嗅探：向上寻找是否有紧邻的 "d = x 时:" 描述
                let label = "筛法数字序列状态演化";
                const prevEl = p.previousElementSibling as HTMLElement;
                if (prevEl && prevEl.textContent) {
                    const prevText = prevEl.textContent.trim();
                    const dMatch = prevText.match(/d\s*=\s*\d+/i);
                    if (dMatch) {
                        label = `$${dMatch[0].replace(/\s+/g, "")}$ 时 筛法序列`;
                    } else if (prevText.includes("希望的状态")) {
                        label = "目标期望状态筛法序列";
                    }
                }

                // 隐藏原原生段落（保留 DOM 用于 SEO 和辅助阅读）
                p.style.display = "none";
                p.setAttribute("data-sieve-hidden", "true");

                const sieveContainer = document.createElement("div");
                sieveContainer.className = "sieve-portal-container";
                p.parentNode?.insertBefore(sieveContainer, p.nextSibling);

                newSievePortals.push({
                    id: `sieve-portal-${pIdx}-${Date.now()}`,
                    element: sieveContainer,
                    items,
                    label,
                });
            });

            // 3. 处理学术数据表格：自动嗅探数值指标列，挂载一键转图表外壳
            const tables = container.querySelectorAll<HTMLTableElement>("table.scholarly-liquid-table, .ProseMirror table");

            tables.forEach((tableEl, tIdx) => {
                if (tableEl.dataset.chartPortalAttached === "true") return;

                const parsed = parseTableData(tableEl);
                if (!parsed) return;

                tableEl.dataset.chartPortalAttached = "true";

                const portalEl = document.createElement("div");
                portalEl.className = "table-chart-portal-container";
                tableEl.parentNode?.insertBefore(portalEl, tableEl);

                newTablePortals.push({
                    id: `table-portal-${tIdx}-${Date.now()}`,
                    element: portalEl,
                    tableData: parsed,
                    tableElement: tableEl,
                });
            });

            if (newDesmosPortals.length > 0) {
                setMathPortals(prev => [...prev, ...newDesmosPortals]);
            }
            if (newSievePortals.length > 0) {
                setSievePortals(prev => [...prev, ...newSievePortals]);
            }
            if (newTablePortals.length > 0) {
                setTablePortals(prev => [...prev, ...newTablePortals]);
            }
        };

        // 绑定点击公式自动复制 LaTeX 源码
        const handleContainerClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest(".Tiptap-mathematics-render") as HTMLElement;
            if (!target || !container.contains(target)) return;

            // 若点击的是 Desmos 互动窗格，不触发公式源码复制
            if ((e.target as HTMLElement)?.closest(".math-desmos-portal-container")) return;

            const latex = target.dataset.latexSource;
            if (latex) {
                navigator.clipboard.writeText(latex).then(() => {
                    // 触觉与视觉微光反馈
                    target.classList.add("ring-1", "ring-emerald-500/40", "bg-emerald-500/10");
                    setTimeout(() => {
                        target.classList.remove("ring-1", "ring-emerald-500/40", "bg-emerald-500/10");
                    }, 350);

                    toast.success("已复制 LaTeX 公式源码", {
                        description: latex.length > 50 ? `${latex.slice(0, 48)}...` : latex,
                        duration: 2000,
                    });
                }).catch(() => {
                    toast.error("复制失败，请检查浏览器剪贴板权限");
                });
            }
        };

        container.addEventListener("click", handleContainerClick);

        // 立即执行与多阶防抖扫描
        scanAndMount();
        const t1 = setTimeout(scanAndMount, 80);
        const t2 = setTimeout(scanAndMount, 300);
        const t3 = setTimeout(scanAndMount, 700);

        // 监听 Tiptap / ProseMirror DOM 异步更新
        const observer = new MutationObserver(() => {
            scanAndMount();
        });

        observer.observe(container, {
            childList: true,
            subtree: true,
        });

        return () => {
            isCleanedUp = true;
            container.removeEventListener("click", handleContainerClick);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            observer.disconnect();

            setMathPortals([]);
            setSievePortals([]);
            setTablePortals([]);

            if (container) {
                // 清理所有动态注入的 portal 容器与恢复被隐藏的文本和表格
                container.querySelectorAll(".math-desmos-portal-container").forEach(el => el.remove());
                container.querySelectorAll(".sieve-portal-container").forEach(el => el.remove());
                container.querySelectorAll(".table-chart-portal-container").forEach(el => el.remove());
                container.querySelectorAll<HTMLTableElement>("table[data-chart-portal-attached='true']").forEach(t => {
                    t.style.display = "";
                    delete t.dataset.chartPortalAttached;
                });
                container.querySelectorAll('p[data-sieve-hidden="true"]').forEach(p => {
                    (p as HTMLElement).style.display = "";
                    p.removeAttribute("data-sieve-hidden");
                    delete (p as HTMLElement).dataset.sieveMounted;
                });
                container.querySelectorAll(".Tiptap-mathematics-render").forEach(el => {
                    delete (el as HTMLElement).dataset.latexSource;
                });
            }
        };
    }, [serializedValue]);

    if (!valueToRender) return null;

    return (
        <div
            ref={containerRef}
            className={cn(
                "novel-viewer-container rich-text-content w-full relative",
                className ?? "bg-background"
            )}
        >
            <ViewerErrorBoundary>
                <EditorRoot>
                    <EditorContent
                        initialContent={valueToRender}
                        extensions={viewerExtensions}
                        immediatelyRender={false}
                        editorProps={{
                            attributes: {
                                class: cn(
                                    "prose dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
                                    editorClassName ?? "prose-lg"
                                ),
                            },
                            editable: () => false,
                        }}
                        className="w-full"
                    />
                </EditorRoot>
            </ViewerErrorBoundary>

            {/* 通过 React Portal 挂载 Desmos 交互窗格与按钮 */}
            {mathPortals.map(portal =>
                createPortal(
                    <MathViewerComponent content={portal.latex} />,
                    portal.element
                )
            )}



            {/* 通过 React Portal 挂载数字筛法微型胶囊网格 */}
            {sievePortals.map(portal =>
                createPortal(
                    <SieveSequenceViewer items={portal.items} label={portal.label} />,
                    portal.element
                )
            )}

            {/* 通过 React Portal 挂载学术数据表格图表可视化外壳 */}
            {tablePortals.map(portal =>
                createPortal(
                    <TableChartViewer
                        tableData={portal.tableData}
                        tableElement={portal.tableElement}
                    />,
                    portal.element
                )
            )}
        </div>
    );
}
