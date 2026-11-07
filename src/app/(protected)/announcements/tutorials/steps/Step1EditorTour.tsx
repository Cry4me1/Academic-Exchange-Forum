"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    PenTool,
    ArrowRight,
    Loader2,
    Sigma,
    Layers,
    Code2,
    RotateCcw,
    ExternalLink,
} from "lucide-react";
import { type JSONContent } from "novel";
import { toast } from "sonner";
import { TutorialTaskChecklist, type TaskItem } from "@/components/tutorials/TutorialTaskChecklist";
import { useI18n } from "@/i18n/context";

const NovelEditor = dynamic(() => import("@/components/editor/NovelEditor"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-[360px] text-zinc-400 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            <p className="text-xs font-medium">正在载入真实学术创作台...</p>
        </div>
    ),
});

interface Step1EditorTourProps {
    onNext: () => void;
    completedTaskIds: string[];
    onCompleteTask: (taskId: string) => void;
    onCompleteAllTasks: (taskIds: string[]) => void;
}

const BASE_ACADEMIC_CONTENT: JSONContent = {
    type: "doc",
    content: [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "分布式共识与拓扑量子计算的交叉研究" }],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "欢迎来到 Scholarly 真实学术创作台。本编辑器专为学术交流设计，原生支持 " },
                { type: "text", marks: [{ type: "bold" }], text: "Slash 斜杠菜单 (/)" },
                { type: "text", text: "、" },
                { type: "text", marks: [{ type: "bold" }], text: "LaTeX 矢量公式 ($E=mc^2$)" },
                { type: "text", text: " 以及 " },
                { type: "text", marks: [{ type: "bold" }], text: "学术定理证明块" },
                { type: "text", text: "。" },
            ],
        },
        {
            type: "academicBlock",
            attrs: { type: "theorem", label: "拜占庭容错安全下界定理" },
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "在含有 $n$ 个节点的异步网络中，若存在 $f$ 个拜占庭故障节点，则系统达成一致性的充分必要条件为 $n \\ge 3f + 1$。",
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
                    text: "请直接在下方空白行键入 '/' 唤出学术组件菜单，或点击顶部胶囊一键注入真实公式与证明模板：",
                },
            ],
        },
        {
            type: "paragraph",
            content: [],
        },
    ],
};

interface DocMetrics {
    charCount: number;
    formulaCount: number;
    academicBlockCount: number;
    structureNodeCount: number;
    hasSlashTyped: boolean;
}

function analyzeEditorDoc(doc?: JSONContent): DocMetrics {
    let charCount = 0;
    let formulaCount = 0;
    let academicBlockCount = 0;
    let structureNodeCount = 0;
    let hasSlashTyped = false;

    const formulaRegex = /\$([^$]+)\$/g;

    function walk(node?: JSONContent) {
        if (!node) return;

        if (node.type === "academicBlock") {
            academicBlockCount += 1;
        }
        if (
            node.type === "heading" ||
            node.type === "bulletList" ||
            node.type === "orderedList" ||
            node.type === "taskList" ||
            node.type === "codeBlock" ||
            node.type === "blockquote" ||
            node.type === "table"
        ) {
            structureNodeCount += 1;
        }

        if (typeof node.text === "string") {
            charCount += node.text.replace(/\s+/g, "").length;
            const matches = node.text.match(formulaRegex);
            if (matches) {
                formulaCount += matches.length;
            }
            if (node.text.includes("/")) {
                hasSlashTyped = true;
            }
        }

        if (Array.isArray(node.content)) {
            node.content.forEach(walk);
        }
    }

    walk(doc);
    return {
        charCount,
        formulaCount,
        academicBlockCount,
        structureNodeCount,
        hasSlashTyped,
    };
}

const INITIAL_METRICS = analyzeEditorDoc(BASE_ACADEMIC_CONTENT);

export function Step1EditorTour({
    onNext,
    completedTaskIds,
    onCompleteTask,
    onCompleteAllTasks,
}: Step1EditorTourProps) {
    const { isZh } = useI18n();
    const [editorDoc, setEditorDoc] = useState<JSONContent>(BASE_ACADEMIC_CONTENT);
    const [editorMountKey, setEditorMountKey] = useState<number>(1);
    const latestDocRef = useRef<JSONContent>(BASE_ACADEMIC_CONTENT);
    const [metrics, setMetrics] = useState<DocMetrics>(INITIAL_METRICS);

    const taskDefs = useMemo<TaskItem[]>(
        () => [
            {
                id: "task-slash",
                title: "1. 唤起 Slash 斜杠创作菜单与块结构",
                description: "在编辑器空白行键入 '/' 唤起学术菜单，插入标题、列表或代码块结构。",
                isCompleted: completedTaskIds.includes("task-slash"),
            },
            {
                id: "task-math",
                title: "2. 编写并编译 LaTeX 矢量公式",
                description: "输入如 '$\\nabla \\cdot \\mathbf{E} = \\rho / \\varepsilon_0$' 或点击下方公式胶囊注入。",
                isCompleted: completedTaskIds.includes("task-math"),
            },
            {
                id: "task-academic-block",
                title: "3. 插入学术定理/引理证明框",
                description: "通过斜杠菜单或快捷胶囊插入 Theorem / Lemma / Proof 标准编号证明环境。",
                isCompleted: completedTaskIds.includes("task-academic-block"),
            },
            {
                id: "task-bubble-ai",
                title: "4. 划选文本体验浮动气泡条与 AI 润色",
                description: "用鼠标划选正文中的任意词句，唤出悬浮工具条体验加粗、行内代码或 AI 润色。",
                isCompleted: completedTaskIds.includes("task-bubble-ai"),
            },
        ],
        [completedTaskIds]
    );

    const handleEditorChange = (content: JSONContent) => {
        latestDocRef.current = content;
        const nextMetrics = analyzeEditorDoc(content);
        setMetrics(nextMetrics);

        // 基于真实 AST 节点差异精准识别完成的实操任务
        if (
            nextMetrics.hasSlashTyped ||
            nextMetrics.structureNodeCount > INITIAL_METRICS.structureNodeCount
        ) {
            onCompleteTask("task-slash");
        }
        if (nextMetrics.formulaCount > INITIAL_METRICS.formulaCount) {
            onCompleteTask("task-math");
        }
        if (nextMetrics.academicBlockCount > INITIAL_METRICS.academicBlockCount) {
            onCompleteTask("task-academic-block");
        }
    };

    const handleMouseUpInEditor = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            if (!completedTaskIds.includes("task-bubble-ai")) {
                toast.success("已唤出浮动工具条，可进行排版修饰或 AI 学术润色");
            }
            onCompleteTask("task-bubble-ai");
        }
    };

    const appendNodesToSandbox = (nodes: JSONContent[], taskToMark: string, message: string) => {
        const baseContent = Array.isArray(latestDocRef.current.content)
            ? latestDocRef.current.content.filter(
                  (n, idx, arr) =>
                      !(idx === arr.length - 1 && n.type === "paragraph" && (!n.content || n.content.length === 0))
              )
            : [];

        const nextDoc: JSONContent = {
            type: "doc",
            content: [...baseContent, ...nodes, { type: "paragraph", content: [] }],
        };

        latestDocRef.current = nextDoc;
        setEditorDoc(nextDoc);
        setMetrics(analyzeEditorDoc(nextDoc));
        setEditorMountKey((prev) => prev + 1);
        onCompleteTask(taskToMark);
        toast.success(message);
    };

    const handleInjectFormula = () => {
        appendNodesToSandbox(
            [
                {
                    type: "paragraph",
                    content: [
                        { type: "text", marks: [{ type: "bold" }], text: "含时薛定谔演化方程：" },
                        {
                            type: "text",
                            text: " $i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\left( -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r},t) \\right)\\Psi(\\mathbf{r},t)$",
                        },
                    ],
                },
            ],
            "task-math",
            "已向创作台注入含时薛定谔方程并实时编译 KaTeX 公式"
        );
    };

    const handleInjectLemmaProof = () => {
        appendNodesToSandbox(
            [
                {
                    type: "academicBlock",
                    attrs: { type: "lemma", label: "陈数拓扑不变量量子化引理" },
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: "当布里渊区能带能隙处处非零时，贝里曲率在闭合二维环面上的积分恒为整数倍 $2\\pi C$，其中陈数 $C \\in \\mathbb{Z}$ 对连续绝热微扰保持严格不变。",
                                },
                            ],
                        },
                    ],
                },
            ],
            "task-academic-block",
            "已向创作台注入标准引理证明环境 (Lemma Block)"
        );
    };

    const handleInjectCodeSample = () => {
        appendNodesToSandbox(
            [
                {
                    type: "codeBlock",
                    attrs: { language: "python" },
                    content: [
                        {
                            type: "text",
                            text: "import numpy as np\n\ndef byzantine_quorum(total_nodes: int) -> int:\n    \"\"\"计算异步拜占庭容错最大可容忍故障节点数 f\"\"\"\n    return (total_nodes - 1) // 3",
                        },
                    ],
                },
            ],
            "task-slash",
            "已向创作台注入语法高亮代码块"
        );
    };

    const handleResetSandbox = () => {
        latestDocRef.current = BASE_ACADEMIC_CONTENT;
        setEditorDoc(BASE_ACADEMIC_CONTENT);
        setMetrics(INITIAL_METRICS);
        setEditorMountKey((prev) => prev + 1);
        toast.info("已恢复初始示例文稿");
    };

    const handleTaskClick = (taskId: string) => {
        onCompleteTask(taskId);
        const labelMap: Record<string, string> = {
            "task-slash": "已标记掌握 Slash 斜杠创作菜单",
            "task-math": "已标记掌握 LaTeX 矢量公式输入",
            "task-academic-block": "已标记掌握学术定理证明块",
            "task-bubble-ai": "已标记掌握划选浮动气泡条与 AI 润色",
        };
        toast.success(labelMap[taskId] || "已标记该项任务完成");
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={taskDefs}
                onTaskClick={handleTaskClick}
                onMarkAllDone={() =>
                    onCompleteAllTasks(["task-slash", "task-math", "task-academic-block", "task-bubble-ai"])
                }
                stepTitle="Step 1 · 学术编辑器核心创作实战"
                stepBadge="4 项实操体验"
                hintText="在下方真实编辑器中直接输入 '/' 或 '$公式$' 系统会自动识别并点亮任务，您也可以使用快捷胶囊一键插入示例学术块。"
            />

            {/* 宽幅无边框液态玻璃真实编辑器工作台 */}
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] p-5 sm:p-7 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-sky-500/[0.12] text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                            <PenTool className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Scholarly 学术创作沙盒 (Live NovelEditor)
                                </h3>
                                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border-0 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)]">
                                    1:1 真实引擎
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                原生支持 Markdown、Slash 命令、KaTeX 公式与编号定理证明环境
                            </p>
                        </div>
                    </div>

                    {/* 实时文稿统计胶囊 + 直达真实创作页入口 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border-0 bg-zinc-900/[0.04] dark:bg-white/[0.05] text-[11px] font-mono font-medium tabular-nums text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            <span>{metrics.charCount} 字</span>
                            <span className="w-[1px] h-3 bg-zinc-300/80 dark:bg-zinc-700/80" />
                            <span>{metrics.formulaCount} 公式</span>
                            <span className="w-[1px] h-3 bg-zinc-300/80 dark:bg-zinc-700/80" />
                            <span>{metrics.academicBlockCount} 定理块</span>
                        </div>

                        <Link href="/posts/new" prefetch={false}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] dark:hover:bg-white/[0.09] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] gap-1.5 active:scale-[0.97] cursor-pointer"
                            >
                                <span>{isZh ? "去真实创作台" : "Live Editor"}</span>
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 交互式一键注入模板水滴工具栏 */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mr-0.5">
                            快捷沙盒实验：
                        </span>
                        <button
                            type="button"
                            onClick={handleInjectFormula}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border-0 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-900/[0.045] hover:bg-amber-500/[0.12] hover:text-amber-700 dark:bg-white/[0.06] dark:hover:bg-amber-500/[0.16] dark:hover:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-[transform,background-color,color] duration-150 active:scale-[0.97] cursor-pointer"
                        >
                            <Sigma className="h-3.5 w-3.5 text-amber-500" />
                            <span>注入薛定谔方程</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInjectLemmaProof}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border-0 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-900/[0.045] hover:bg-sky-500/[0.12] hover:text-sky-700 dark:bg-white/[0.06] dark:hover:bg-sky-500/[0.16] dark:hover:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-[transform,background-color,color] duration-150 active:scale-[0.97] cursor-pointer"
                        >
                            <Layers className="h-3.5 w-3.5 text-sky-500" />
                            <span>注入引理证明块</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleInjectCodeSample}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border-0 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-900/[0.045] hover:bg-emerald-500/[0.12] hover:text-emerald-700 dark:bg-white/[0.06] dark:hover:bg-emerald-500/[0.16] dark:hover:text-emerald-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-[transform,background-color,color] duration-150 active:scale-[0.97] cursor-pointer"
                        >
                            <Code2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>注入算法代码块</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleResetSandbox}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-900/[0.03] hover:bg-zinc-900/[0.07] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-[transform,background-color,color] duration-150 active:scale-[0.97] cursor-pointer"
                    >
                        <RotateCcw className="h-3 w-3" />
                        <span>重置示例文稿</span>
                    </button>
                </div>

                {/* 内嵌透光槽：挂载真实 NovelEditor */}
                <div
                    onMouseUp={handleMouseUpInEditor}
                    className="min-h-[440px] rounded-2xl border-0 bg-zinc-100/70 dark:bg-zinc-950/55 p-4 sm:p-6 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),inset_0_-1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                >
                    <NovelEditor
                        key={editorMountKey}
                        initialValue={editorDoc}
                        onChange={handleEditorChange}
                        className="w-full min-h-[400px] bg-transparent border-0"
                    />
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    第 1 步 / 共 6 步 · 学术创作与编辑器
                </span>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] gap-2 transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                >
                    <span>下一步：论文排版与 PDF 导出</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
