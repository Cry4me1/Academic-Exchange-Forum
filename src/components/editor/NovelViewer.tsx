"use client";

import { Component, type ErrorInfo, type ReactNode, useRef, useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { EditorContent, EditorRoot, type JSONContent } from "novel";
import katex from "katex";
import { cn } from "@/lib/utils";
import { viewerExtensions } from "./viewer-extensions";
import MathViewerComponent, { checkIsFunction } from "./extensions/MathViewerComponent";
import { LatexFormulaExpandBar } from "./extensions/LatexFormulaExpandBar";
import { toast } from "sonner";
import { SieveSequenceViewer, parseSieveSequence, type SieveItem } from "@/components/posts/SieveSequenceViewer";
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
                <div className="p-4 rounded-2xl border-0 bg-amber-500/10 text-sm shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                    <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
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

/**
 * 严格判定公式是否为独占段落的独立块级公式（Standalone Display Formula）
 * 若所在 <p> 含有任何散文文字（如“记 ... ,其中 t 为自然数”）或存在多个行内公式，一律判定为行内公式，绝不打断行内排版！
 */
function getStandaloneBlockTarget(renderEl: HTMLElement): HTMLElement | null {
    if (
        renderEl.classList.contains("Tiptap-mathematics-render--block") ||
        renderEl.querySelector(".katex-display") !== null
    ) {
        const hostP = renderEl.closest("p");
        if (!hostP) return renderEl;
    }

    const hostP = renderEl.closest("p");
    if (!hostP) {
        return renderEl.classList.contains("Tiptap-mathematics-render--block")
            ? renderEl
            : null;
    }

    // 段落内必须仅包含这唯一一个数学公式节点
    const allMathInP = hostP.querySelectorAll(".Tiptap-mathematics-render");
    if (allMathInP.length !== 1) return null;

    // 检查段落直接子节点中是否存在任何非空白散文文本或其他内联元素
    for (const child of Array.from(hostP.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            const raw = (child.textContent || "").trim();
            // 排除未被剥离的纯 $$ 定界符，若有任何汉字/字母/标点则说明是行内混排段落
            if (raw.replace(/^\$+|\$+$/g, "").trim().length > 0) {
                return null;
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            if (
                el === renderEl ||
                el.contains(renderEl) ||
                el.classList.contains("Tiptap-mathematics-editor") ||
                el.classList.contains("math-desmos-portal-container") ||
                el.tagName === "BR"
            ) {
                continue;
            }
            return null;
        }
    }

    return hostP;
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
    const [expandPortals, setExpandPortals] = useState<{
        id: string;
        element: HTMLElement;
        latex: string;
        formulaElement: HTMLElement;
    }[]>([]);
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

    const serializedValue = useMemo(() => {
        try {
            return JSON.stringify(valueToRender);
        } catch {
            return "";
        }
    }, [valueToRender]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isCleanedUp = false;

        const scanAndMount = () => {
            if (isCleanedUp || !container) return;

            const renders = container.querySelectorAll(".Tiptap-mathematics-render");
            const newDesmosPortals: typeof mathPortals = [];
            const newExpandPortals: typeof expandPortals = [];
            const newSievePortals: typeof sievePortals = [];
            const newTablePortals: typeof tablePortals = [];

            // 1. 处理公式：Desmos 函数交互 + 独立块级长公式推导自适应展开 + 点击复制 + \tag 原生右对齐锁定
            renders.forEach((renderElNode, index) => {
                const renderEl = renderElNode as HTMLElement;

                // 严格只读取紧邻的前置隐藏编辑节点或自身内部的 KaTeX annotation，绝不跨兄弟节点误取父级第一个公式
                const prevSibling = renderEl.previousElementSibling as HTMLElement | null;
                let latex = "";
                if (prevSibling && prevSibling.classList.contains("Tiptap-mathematics-editor")) {
                    latex = prevSibling.textContent || "";
                } else {
                    const annotation = renderEl.querySelector('annotation[encoding="application/x-tex"]');
                    if (annotation && annotation.textContent) {
                        latex = annotation.textContent;
                    }
                }

                if (!latex) return;

                // 规范化手动手打编号 (**) -> \tag{**}
                const hasManualTag = /\\(quad|qquad)\s*\(\s*(\*+)\s*\)|\s*\(\s*(\*+)\s*\)$/.test(latex);
                const hasLatexTag = latex.includes("\\tag{");

                let normalizedLatex = latex;
                if (hasManualTag && !hasLatexTag) {
                    normalizedLatex = latex
                        .replace(/\\(quad|qquad)\s*\(\s*(\*+)\s*\)/g, "\\tag{$2}")
                        .replace(/\s*\(\s*(\*+)\s*\)$/g, "\\tag{$1}");
                }

                const standaloneHost = getStandaloneBlockTarget(renderEl);

                // 仅当公式带 \tag 且本身独占一行（非句中内联混排）时，以 displayMode 渲染右对齐编号
                if ((hasLatexTag || hasManualTag) && standaloneHost && !renderEl.dataset.katexRetagged) {
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

                // 挂载 Desmos 交互窗格（复用 MathViewerComponent 严格函数判定，过滤单个变量如 t / r / s_i）
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

                // 仅对【独占段落的独立块级复杂公式】在段落外部（兄弟层级）挂载展开/精读条，绝不向 <p> 内部注入 <div>！
                const isComplexStandaloneFormula =
                    Boolean(standaloneHost) &&
                    (renderEl.classList.contains("Tiptap-mathematics-render--block") ||
                        renderEl.querySelector(".katex-display") !== null ||
                        normalizedLatex.includes("\\begin{") ||
                        (normalizedLatex.match(/\\\\/g)?.length ?? 0) >= 2 ||
                        normalizedLatex.length >= 120);

                if (
                    isComplexStandaloneFormula &&
                    standaloneHost &&
                    standaloneHost.dataset.expandPortalAttached !== "true"
                ) {
                    standaloneHost.dataset.expandPortalAttached = "true";
                    const expandPortalEl = document.createElement("div");
                    expandPortalEl.className = "math-expand-portal-container w-full";
                    // 插入在块级宿主（如 <p>）之后，严格保持 HTML5 块级同级结构，零干扰 ProseMirror 行内 DOM
                    standaloneHost.parentNode?.insertBefore(expandPortalEl, standaloneHost.nextSibling);

                    newExpandPortals.push({
                        id: `expand-portal-${index}-${Date.now()}`,
                        element: expandPortalEl,
                        latex: normalizedLatex,
                        formulaElement: renderEl,
                    });
                }

                // 支持点击公式直接复制 LaTeX 源码
                renderEl.dataset.latexSource = normalizedLatex;
                renderEl.title = "点击复制 LaTeX 公式源码";
                renderEl.classList.add(
                    "cursor-pointer",
                    "transition-[transform,background-color,box-shadow]",
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

                const nextEl = p.nextElementSibling as HTMLElement;
                if (nextEl && nextEl.classList?.contains("sieve-portal-container")) {
                    return;
                }

                p.dataset.sieveMounted = "true";

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
            if (newExpandPortals.length > 0) {
                setExpandPortals(prev => [...prev, ...newExpandPortals]);
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

            if (
                (e.target as HTMLElement)?.closest(".math-desmos-portal-container") ||
                (e.target as HTMLElement)?.closest(".math-expand-portal-container")
            ) {
                return;
            }

            const latex = target.dataset.latexSource;
            if (latex) {
                navigator.clipboard.writeText(latex).then(() => {
                    target.classList.add(
                        "bg-amber-500/12",
                        "shadow-[0_0_16px_rgba(245,158,11,0.22)]"
                    );
                    setTimeout(() => {
                        target.classList.remove(
                            "bg-amber-500/12",
                            "shadow-[0_0_16px_rgba(245,158,11,0.22)]"
                        );
                    }, 380);

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
        let observerDebounceTimer: NodeJS.Timeout | null = null;
        const observer = new MutationObserver(() => {
            if (observerDebounceTimer) clearTimeout(observerDebounceTimer);
            observerDebounceTimer = setTimeout(() => {
                scanAndMount();
            }, 120);
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
            if (observerDebounceTimer) clearTimeout(observerDebounceTimer);
            observer.disconnect();

            setMathPortals([]);
            setExpandPortals([]);
            setSievePortals([]);
            setTablePortals([]);

            if (container) {
                container.querySelectorAll(".math-desmos-portal-container").forEach(el => el.remove());
                container.querySelectorAll(".math-expand-portal-container").forEach(el => el.remove());
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
                container.querySelectorAll("[data-expand-portal-attached='true']").forEach(el => {
                    delete (el as HTMLElement).dataset.expandPortalAttached;
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
                "novel-viewer-container rich-text-content w-full relative [&_.ProseMirror-selectednode]:!bg-transparent [&_.ProseMirror-selectednode]:!outline-none [&_.ProseMirror-selectednode]:!shadow-none",
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
                                    "prose dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full [&_.ProseMirror-selectednode]:!bg-transparent [&_.ProseMirror-selectednode]:!outline-none [&_.ProseMirror-selectednode]:!shadow-none",
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

            {/* 通过 React Portal 挂载独立块级长公式自适应展开与放大检视条 */}
            {expandPortals.map(portal =>
                createPortal(
                    <LatexFormulaExpandBar
                        latex={portal.latex}
                        formulaElement={portal.formulaElement}
                    />,
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
