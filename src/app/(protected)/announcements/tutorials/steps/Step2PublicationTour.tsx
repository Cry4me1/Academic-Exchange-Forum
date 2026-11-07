"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { MathText } from "@/components/ui/math-text";
import {
    BookOpen,
    Printer,
    Columns2,
    AlignJustify,
    ArrowLeft,
    ArrowRight,
    ListTree,
    Sparkles,
    Loader2,
    Copy,
    Check,
    FileText,
    ChevronRight,
} from "lucide-react";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TutorialTaskChecklist, type TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

const NovelViewer = dynamic(() => import("@/components/editor/NovelViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[320px] text-zinc-400 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            <p className="text-xs font-medium">正在渲染出版级论文版面...</p>
        </div>
    ),
});

interface Step2PublicationTourProps {
    onPrev: () => void;
    onNext: () => void;
    completedTaskIds: string[];
    onCompleteTask: (taskId: string) => void;
    onCompleteAllTasks: (taskIds: string[]) => void;
}

const SAMPLE_PUBLICATION_CONTENT: JSONContent = {
    type: "doc",
    content: [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "1. 拓扑保护哈密顿量与零能束缚态构建" }],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "拓扑量子计算依托非阿贝尔任意子的编织统计特性，在物理层面对局域退相干噪声具备内在抑制能力。考虑一维强自旋轨道耦合半导体纳米线与 s 波超导体异质结，其有效 Kitaev 链哈密顿量可表述为 $H_{\\text{eff}} = -\\mu \\sum_j c_j^\\dagger c_j - \\sum_j (t c_j^\\dagger c_{j+1} + \\Delta c_j c_{j+1} + \\text{h.c.})$。",
                },
            ],
        },
        {
            type: "academicBlock",
            attrs: { type: "lemma", label: "马约拉纳零能模存在性判据" },
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "在纳米超导导线两端，当外加塞曼分裂能满足 $V_Z > \\sqrt{\\Delta_0^2 + \\mu^2}$ 时，系统跨越拓扑相变临界点进入非平庸态，导线两端各局域化一个自厄米零能马约拉纳算符 $\\gamma_1 = \\gamma_1^\\dagger$。",
                        },
                    ],
                },
            ],
        },
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "2. 非阿贝尔任意子编织门与容错保真度" }],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "通过构建 T 型纳米线网络并绝热调控局域化学势闸门，可在实空间无接触交换成对马约拉纳零能模，从而在简并基态流形上精确执行单比特 Clifford 逻辑门演化。",
                },
            ],
        },
        {
            type: "academicBlock",
            attrs: { type: "theorem", label: "非阿贝尔编织门退相干抑制上界" },
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "设导线长度为 $L$、超导相干长度为 $\\xi$，在低温极限 $k_B T \\ll \\Delta_0$ 下，零能模波函数交叠导致的能级劈裂满足 $\\delta E \\propto e^{-L/\\xi}$，逻辑门非保真度随空间尺度呈指数级收敛。",
                        },
                    ],
                },
            ],
        },
        {
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "实验仿真表明，当 $L / \\xi \\ge 8.5$ 时，逻辑量子比特相干寿命较传统超导 Transmon 提升超过两个数量级，验证了容错拓扑量子存储器的工程可行性。",
                },
            ],
        },
    ],
};

interface TocTargetItem {
    id: string;
    label: string;
    badge: string;
    kind: "heading" | "lemma" | "theorem";
    selectorIndex: number;
}

const TOC_ITEMS: TocTargetItem[] = [
    {
        id: "toc-sec-1",
        label: "1. 拓扑保护哈密顿量与零能束缚态",
        badge: "章节 §1",
        kind: "heading",
        selectorIndex: 0,
    },
    {
        id: "toc-lemma-1",
        label: "马约拉纳零能模存在性判据",
        badge: "引理 1",
        kind: "lemma",
        selectorIndex: 0,
    },
    {
        id: "toc-sec-2",
        label: "2. 非阿贝尔任意子编织门与保真度",
        badge: "章节 §2",
        kind: "heading",
        selectorIndex: 1,
    },
    {
        id: "toc-thm-2",
        label: "非阿贝尔编织门退相干抑制上界",
        badge: "定理 2",
        kind: "theorem",
        selectorIndex: 1,
    },
];

const BIBTEX_SNIPPET = `@article{scholarly_2026_topological,
  title   = {基于拓扑超导量子比特的高容错逻辑门实现},
  author  = {Scholarly 量子拓扑研究组},
  journal = {Scholarly Academic Preprint},
  year    = {2026},
  volume  = {2},
  url     = {https://scholarly.wiki/announcements/tutorials?step=2}
}`;

export function Step2PublicationTour({
    onPrev,
    onNext,
    completedTaskIds,
    onCompleteTask,
    onCompleteAllTasks,
}: Step2PublicationTourProps) {
    const [isTwoColumn, setIsTwoColumn] = useState(false);
    const [activeTocId, setActiveTocId] = useState<string>("toc-sec-1");
    const [pulseNotice, setPulseNotice] = useState<string | null>(null);
    const [showExportDialog, setShowExportDialog] = useState(false);

    // PDF 预印本导出配置状态
    const [exportLayout, setExportLayout] = useState<"single" | "double">("double");
    const [includeSynopsis, setIncludeSynopsis] = useState(true);
    const [includeBibtex, setIncludeBibtex] = useState(true);
    const [copiedBibtex, setCopiedBibtex] = useState(false);

    const viewerWrapperRef = useRef<HTMLDivElement>(null);

    const taskDefs = useMemo<TaskItem[]>(
        () => [
            {
                id: "switch-column",
                title: "1. 切换出版级 Nature / IEEE 双栏排版",
                description: "点击阅读器右上角切换胶囊，观察论文在宽幅预印本与紧凑顶刊双栏版面间无缝重排。",
                isCompleted: completedTaskIds.includes("switch-column"),
            },
            {
                id: "toc-jump",
                title: "2. 体验智能 TOC 目录定位与要素脉冲",
                description: "点击右侧智能目录中的‘引理 1’或‘定理 2’，平滑定位至正文对应要素并触发微光脉冲。",
                isCompleted: completedTaskIds.includes("toc-jump"),
            },
            {
                id: "pdf-dialog",
                title: "3. 体验学术 PDF 预印本预览与 BibTeX 引用",
                description: "点击‘导出学术 PDF’打开预印本工作台，实时预览 A4 单双栏版面、复制 BibTeX 或调起打印。",
                isCompleted: completedTaskIds.includes("pdf-dialog"),
            },
        ],
        [completedTaskIds]
    );

    const handleSetColumn = (twoCol: boolean) => {
        setIsTwoColumn(twoCol);
        onCompleteTask("switch-column");
    };

    const handleTocNavigate = (item: TocTargetItem) => {
        setActiveTocId(item.id);
        onCompleteTask("toc-jump");
        setPulseNotice(`已精准定位至「${item.badge} · ${item.label}」`);

        const container = viewerWrapperRef.current;
        if (!container) return;

        let targetEl: HTMLElement | null = null;
        if (item.kind === "heading") {
            const headings = container.querySelectorAll<HTMLElement>("h2, h3");
            targetEl = headings[item.selectorIndex] || null;
        } else {
            const blocks = container.querySelectorAll<HTMLElement>(
                ".academic-block-wrapper, [data-type='academicBlock'], blockquote"
            );
            targetEl = blocks[item.selectorIndex] || blocks[0] || null;
        }

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            targetEl.animate(
                [
                    { boxShadow: "0 0 0 0px rgba(14, 165, 233, 0)", backgroundColor: "rgba(14, 165, 233, 0.14)" },
                    { boxShadow: "0 0 0 6px rgba(14, 165, 233, 0.22)", backgroundColor: "rgba(14, 165, 233, 0.08)" },
                    { boxShadow: "0 0 0 0px rgba(14, 165, 233, 0)", backgroundColor: "transparent" },
                ],
                { duration: 1100, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
            );
        }
    };

    const handleOpenExport = () => {
        setShowExportDialog(true);
        onCompleteTask("pdf-dialog");
    };

    const handleCopyBibtex = async () => {
        try {
            await navigator.clipboard.writeText(BIBTEX_SNIPPET);
            setCopiedBibtex(true);
            toast.success("BibTeX 引用代码已复制到剪贴板");
            setTimeout(() => setCopiedBibtex(false), 2000);
        } catch {
            toast.error("复制失败，请手动选中复制");
        }
    };

    const handleTriggerSandboxPrint = () => {
        const printWin = window.open("", "_blank", "width=900,height=760");
        if (!printWin) {
            toast.error("打印预览窗口被浏览器拦截，请允许弹窗后重试");
            return;
        }

        const colCss =
            exportLayout === "double"
                ? "column-count: 2; column-gap: 28px; text-align: justify;"
                : "max-width: 680px; margin: 0 auto;";

        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>基于拓扑超导量子比特的高容错逻辑门实现 - Scholarly Preprint</title>
<style>
  body { font-family: "Times New Roman", "Songti SC", "SimSun", serif; color: #18181b; margin: 0; padding: 36px 44px; line-height: 1.72; }
  header { display: flex; justify-content: space-between; font-family: system-ui, sans-serif; font-size: 11px; letter-spacing: 0.08em; color: #52525b; padding-bottom: 10px; margin-bottom: 24px; border-bottom: 1px solid #d4d4d8; }
  h1 { font-size: 22px; text-align: center; margin: 0 0 8px; }
  .meta { text-align: center; font-size: 12px; color: #52525b; margin-bottom: 22px; font-family: system-ui, sans-serif; }
  .synopsis { background: #f4f4f5; border-radius: 10px; padding: 12px 16px; font-size: 12px; margin-bottom: 22px; font-family: system-ui, sans-serif; }
  .content { ${colCss} font-size: 13.5px; }
  h2 { font-size: 15px; margin: 18px 0 8px; break-after: avoid; }
  .thm { background: #fafafa; padding: 10px 14px; border-radius: 8px; margin: 12px 0; break-inside: avoid; }
  pre { background: #f4f4f5; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto; margin-top: 24px; }
</style>
</head>
<body>
  <header>
    <span>SCHOLARLY PREPRINT · ISSN 2834-920X</span>
    <span>${exportLayout === "double" ? "IEEE / NATURE DUAL-COLUMN" : "ARXIV SINGLE-COLUMN"} · 2026</span>
  </header>
  <h1>基于拓扑超导量子比特的高容错逻辑门实现</h1>
  <div class="meta">Scholarly 量子拓扑研究组 · 认证学术预印本 · Tags: Quantum Computing, Topology</div>
  ${
      includeSynopsis
          ? `<div class="synopsis"><strong>学术要素速览：</strong>本文包含 2 个核心章节、1 个严格引理（马约拉纳零能模存在性判据）与 1 个核心定理（非阿贝尔编织门退相干抑制上界）。</div>`
          : ""
  }
  <div class="content">
    <h2>1. 拓扑保护哈密顿量与零能束缚态构建</h2>
    <p>拓扑量子计算依托非阿贝尔任意子的编织统计特性，在物理层面对局域退相干噪声具备内在抑制能力。考虑一维强自旋轨道耦合半导体纳米线与 s 波超导体异质结系统。</p>
    <div class="thm"><strong>引理 1（马约拉纳零能模存在性判据）：</strong>当外加塞曼分裂能满足阈值判据时，系统进入拓扑非平庸态，导线两端各局域化一个零能马约拉纳束缚态。</div>
    <h2>2. 非阿贝尔任意子编织门与容错保真度</h2>
    <p>通过构建 T 型纳米线网络并绝热调控局域化学势闸门，可在实空间无接触交换成对马约拉纳零能模，从而在简并基态流形上精确执行单比特 Clifford 逻辑门演化。</p>
    <div class="thm"><strong>定理 2（非阿贝尔编织门退相干抑制上界）：</strong>在低温极限下，零能模波函数交叠导致的能级劈裂随导线长度呈指数衰减，逻辑量子比特相干寿命提升超过两个数量级。</div>
  </div>
  ${includeBibtex ? `<pre>${BIBTEX_SNIPPET}</pre>` : ""}
  <script>window.onload = () => { setTimeout(() => window.print(), 250); };</script>
</body>
</html>`;

        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        toast.success("已调起标准学术预印本打印与 PDF 导出流");
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={taskDefs}
                onTaskClick={(id) => {
                    onCompleteTask(id);
                    toast.success("已标记该项排版实操完成");
                }}
                onMarkAllDone={() =>
                    onCompleteAllTasks(["switch-column", "toc-jump", "pdf-dialog"])
                }
                stepTitle="Step 2 · 顶刊双栏排版、智能 TOC 与预印本导出"
                stepBadge="3 项实操体验"
                hintText="点击右上角切换单栏/Nature双栏排版，点击右侧目录条目平滑定位至对应定理并触发天青微光脉冲。"
            />

            {/* 宽幅无边框液态玻璃阅读器全景工作台 */}
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] p-5 sm:p-7 space-y-5">
                {/* 顶栏操作坞 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-sky-500/[0.12] text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                学术出版阅读引擎 (Live NovelViewer + 智能目录)
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                基于拓扑超导量子比特的高容错逻辑门实现 · Scholarly 量子拓扑研究组
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* 单双栏水滴分段切换器（零布局跳动） */}
                        <div className="inline-flex items-center rounded-full border-0 p-1 bg-zinc-900/[0.045] dark:bg-white/[0.06] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.05)]">
                            <button
                                type="button"
                                onClick={() => handleSetColumn(false)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 h-7 px-3 rounded-full border-0 text-xs font-medium transition-[background-color,color,box-shadow] duration-150 cursor-pointer select-none",
                                    !isTwoColumn
                                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)]"
                                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                )}
                            >
                                <AlignJustify className="h-3.5 w-3.5" />
                                <span>单栏预印本</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetColumn(true)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 h-7 px-3 rounded-full border-0 text-xs font-medium transition-[background-color,color,box-shadow] duration-150 cursor-pointer select-none",
                                    isTwoColumn
                                        ? "bg-white dark:bg-zinc-800 text-sky-700 dark:text-sky-300 shadow-[0_2px_8px_-2px_rgba(14,165,233,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.9)]"
                                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                )}
                            >
                                <Columns2 className="h-3.5 w-3.5" />
                                <span>Nature 双栏</span>
                            </button>
                        </div>

                        {/* 导出学术 PDF 黑曜石胶囊按钮 */}
                        <Button
                            size="sm"
                            onClick={handleOpenExport}
                            className="h-9 px-4 rounded-full border-0 text-xs font-medium gap-1.5 bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.38)] active:scale-[0.97] cursor-pointer"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>导出学术 PDF</span>
                        </Button>
                    </div>
                </div>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 主体双栏黄金比例：左侧阅读器 + 右侧智能 TOC 要素导航 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* 左侧出版级阅读画布 */}
                    <div
                        ref={viewerWrapperRef}
                        className="lg:col-span-8 rounded-2xl border-0 bg-zinc-100/70 dark:bg-zinc-950/55 p-5 sm:p-7 min-h-[390px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),inset_0_-1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                    >
                        <div
                            className={cn(
                                "transition-all duration-200",
                                isTwoColumn ? "md:columns-2 md:gap-7 [&_h2]:break-after-avoid" : "max-w-3xl mx-auto"
                            )}
                        >
                            <NovelViewer content={SAMPLE_PUBLICATION_CONTENT} />
                        </div>
                    </div>

                    {/* 右侧真实联动智能学术目录 (Smart Academic TOC) */}
                    <aside className="lg:col-span-4 rounded-2xl border-0 bg-white/75 dark:bg-white/[0.04] backdrop-blur-xl p-4 space-y-3.5 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                <ListTree className="h-4 w-4 text-sky-500" />
                                <span>智能章节与定理目录</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border-0 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300">
                                点击脉冲定位
                            </span>
                        </div>

                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                        <div className="space-y-1.5">
                            {TOC_ITEMS.map((item) => {
                                const isActive = activeTocId === item.id;
                                const isAcademicBlock = item.kind !== "heading";

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleTocNavigate(item)}
                                        className={cn(
                                            "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border-0 text-left text-xs font-medium transition-[transform,background-color,color,box-shadow] duration-150 cursor-pointer active:scale-[0.98]",
                                            isActive
                                                ? "bg-sky-500/[0.12] text-sky-800 dark:text-sky-200 shadow-[0_2px_12px_rgba(14,165,233,0.16),inset_0_1px_0.5px_rgba(255,255,255,0.85)]"
                                                : "bg-zinc-900/[0.025] hover:bg-zinc-900/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.07] text-zinc-600 dark:text-zinc-300"
                                        )}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.2 rounded-full border-0 font-medium",
                                                        isAcademicBlock
                                                            ? "bg-amber-500/[0.15] text-amber-700 dark:text-amber-300"
                                                            : "bg-zinc-900/[0.06] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300"
                                                    )}
                                                >
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <p className="truncate leading-snug">{item.label}</p>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                    </button>
                                );
                            })}
                        </div>

                        {pulseNotice && (
                            <div className="rounded-2xl border-0 bg-emerald-500/[0.1] px-3 py-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{pulseNotice}</span>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-1">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-full border-0 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.09] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>上一步：学术编辑器</span>
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <span>下一步：学术决斗竞技场</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            {/* 内置零 404 沙盒级 A4 学术预印本配置与实时预览弹窗 */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent className="max-w-2xl p-6 sm:p-7 rounded-3xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.14)] space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-sky-500/[0.12] text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-base sm:text-lg font-semibold text-zinc-950 dark:text-white">
                                导出标准学术预印本 PDF 与 BibTeX
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                实时预览 A4 顶刊版式，自动生成页眉、定理要素速览框与标准文献引用代码
                            </DialogDescription>
                        </div>
                    </div>

                    {/* 版式与学术要素开关 */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border-0 p-1 bg-zinc-900/[0.05] dark:bg-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => setExportLayout("single")}
                                className={cn(
                                    "h-8 px-3.5 rounded-full border-0 text-xs font-medium transition-all cursor-pointer",
                                    exportLayout === "single"
                                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                )}
                            >
                                arXiv 单栏版式
                            </button>
                            <button
                                type="button"
                                onClick={() => setExportLayout("double")}
                                className={cn(
                                    "h-8 px-3.5 rounded-full border-0 text-xs font-medium transition-all cursor-pointer",
                                    exportLayout === "double"
                                        ? "bg-white dark:bg-zinc-800 text-sky-700 dark:text-sky-300 shadow-[0_2px_8px_rgba(14,165,233,0.18)]"
                                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                )}
                            >
                                IEEE / Nature 双栏
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIncludeSynopsis(!includeSynopsis)}
                                className={cn(
                                    "h-8 px-3 rounded-full border-0 text-xs font-medium transition-colors cursor-pointer",
                                    includeSynopsis
                                        ? "bg-emerald-500/[0.14] text-emerald-700 dark:text-emerald-300"
                                        : "bg-zinc-900/[0.04] dark:bg-white/[0.05] text-zinc-500"
                                )}
                            >
                                {includeSynopsis ? "✓ 含要素统计" : "不含要素统计"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIncludeBibtex(!includeBibtex)}
                                className={cn(
                                    "h-8 px-3 rounded-full border-0 text-xs font-medium transition-colors cursor-pointer",
                                    includeBibtex
                                        ? "bg-amber-500/[0.14] text-amber-700 dark:text-amber-300"
                                        : "bg-zinc-900/[0.04] dark:bg-white/[0.05] text-zinc-500"
                                )}
                            >
                                {includeBibtex ? "✓ 含 BibTeX" : "不含 BibTeX"}
                            </button>
                        </div>
                    </div>

                    {/* 1:1 实时仿真 A4 纸张缩略预览 */}
                    <div className="rounded-2xl border-0 bg-white dark:bg-zinc-950 p-5 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06),0_4px_20px_rgba(0,0,0,0.04)] max-h-[290px] overflow-y-auto space-y-3 font-serif">
                        <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-wider text-zinc-400 pb-2">
                            <span>SCHOLARLY PREPRINT · ISSN 2834-920X</span>
                            <span>{exportLayout === "double" ? "DUAL-COLUMN" : "SINGLE-COLUMN"}</span>
                        </div>
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent" />
                        <div className="text-center space-y-0.5">
                            <h4 className="text-sm font-semibold">基于拓扑超导量子比特的高容错逻辑门实现</h4>
                            <p className="text-[11px] font-sans text-zinc-500">
                                Scholarly 量子拓扑研究组 · 2026
                            </p>
                        </div>
                        {includeSynopsis && (
                            <div className="rounded-xl bg-zinc-100/90 dark:bg-white/[0.05] px-3 py-2 text-[11px] font-sans text-zinc-600 dark:text-zinc-300">
                                学术要素速览：共包含 1 个严格引理、1 个核心定理及完整矢量公式推导。
                            </div>
                        )}
                        <div
                            className={cn(
                                "text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300",
                                exportLayout === "double" ? "sm:columns-2 sm:gap-5" : ""
                            )}
                        >
                            <p className="mb-2">
                                <strong>§1 拓扑哈密顿量：</strong>
                                <MathText
                                    text="当塞曼能满足 $V_Z > \sqrt{\Delta_0^2 + \mu^2}$ 时，导线端点存在局域马约拉纳零能模 $\gamma_1 = \gamma_1^\dagger$。"
                                    inlineOnly
                                />
                            </p>
                            <p>
                                <strong>§2 编织保真度：</strong>
                                <MathText
                                    text="在低温极限 $k_B T \ll \Delta_0$ 下，能级劈裂 $\delta E \propto e^{-L/\xi}$，逻辑门非保真度呈指数级收敛。"
                                    inlineOnly
                                />
                            </p>
                        </div>
                        {includeBibtex && (
                            <pre className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-3 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 overflow-x-auto">
                                {BIBTEX_SNIPPET}
                            </pre>
                        )}
                    </div>

                    {/* 弹窗底部动作栏 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyBibtex}
                            className="h-9 px-4 rounded-full border-0 text-xs font-medium bg-zinc-900/[0.05] hover:bg-zinc-900/[0.09] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] gap-1.5 active:scale-[0.97] cursor-pointer"
                        >
                            {copiedBibtex ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>{copiedBibtex ? "已复制 BibTeX" : "复制 BibTeX 引用"}</span>
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowExportDialog(false)}
                                className="h-9 px-4 rounded-full border-0 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white active:scale-[0.97] cursor-pointer"
                            >
                                关闭
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleTriggerSandboxPrint}
                                className="h-9 px-5 rounded-full border-0 text-xs font-medium gap-1.5 bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/92 dark:text-zinc-950 shadow-[0_4px_14px_rgba(0,0,0,0.24),inset_0_1px_1px_rgba(255,255,255,0.38)] active:scale-[0.97] cursor-pointer"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>调起打印 / 另存为 PDF</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
