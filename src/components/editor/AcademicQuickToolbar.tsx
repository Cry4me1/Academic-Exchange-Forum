"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEditor } from "novel";
import {
    Sparkles,
    MessageSquarePlus,
    BookOpen,
    ShieldCheck,
    FileText,
    Layers,
    Sigma,
    Code,
    Workflow,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    TextQuote,
    ImageIcon,
    ChevronDown,
    Bookmark,
    Link2,
    Subtitles,
    FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { onUpload } from "@/lib/image-upload";
import { toast } from "sonner";
import {
    extractTitleAndContent,
    insertHtmlIntoEditor,
    markdownToTiptapHtml,
} from "@/lib/markdown-parser";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MathSymbolsPopover } from "./MathSymbolsPopover";
import { QuickFormulaPopover } from "./QuickFormulaPopover";

interface AcademicQuickToolbarProps {
    className?: string;
    hintRight?: React.ReactNode;
}

export default function AcademicQuickToolbar({
    className,
    hintRight,
}: AcademicQuickToolbarProps) {
    const { editor } = useEditor();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mdFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // 监听 AI 生成状态，联动工具栏按钮本身呈现高端推演动效
    useEffect(() => {
        const handleStatus = (e: any) => {
            setIsGenerating(Boolean(e?.detail?.isGenerating));
        };

        window.addEventListener("ai-generation-status", handleStatus);
        return () => {
            window.removeEventListener("ai-generation-status", handleStatus);
        };
    }, []);

    // 辅助插入学术环境块
    const insertAcademicBlock = (
        type:
            | "theorem"
            | "proof"
            | "definition"
            | "lemma"
            | "proposition"
            | "corollary"
            | "example",
        defaultText: string
    ) => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .insertContent({
                type: "academicBlock",
                attrs: {
                    academicType: type,
                    title: "",
                    number: "",
                    ...(type === "proof" ? { isFolded: false } : {}),
                },
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: defaultText,
                            },
                        ],
                    },
                ],
            })
            .run();
    };

    // 处理图片上传
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const url = await onUpload(file);
            if (url) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        } catch (error) {
            console.error("上传图片失败:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // 处理 Markdown 文件导入
    const handleMarkdownFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const rawText = await file.text();
            const { title, content } = extractTitleAndContent(rawText);
            if (title) {
                window.dispatchEvent(
                    new CustomEvent("scholarly-title-extracted", { detail: { title } })
                );
            }
            const html = markdownToTiptapHtml(content);
            const isDocEmpty = editor.state.doc.textContent.trim().length === 0;
            insertHtmlIntoEditor(editor.view, html, { replaceSelection: !isDocEmpty });
            toast.success(`已成功导入并解析 Markdown 文件：${file.name}`);
        } catch (error) {
            console.error("导入 Markdown 文件失败:", error);
            toast.error("导入 Markdown 失败，请检查文件格式");
        } finally {
            if (mdFileInputRef.current) {
                mdFileInputRef.current.value = "";
            }
        }
    };

    return (
        <TooltipProvider delayDuration={200}>
            <div className={cn("w-full mb-3 flex flex-col gap-2 select-none", className)}>
                {/* 顶部主工具栏：整合自“/”菜单的高频学术与排版元素 */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-md overflow-x-auto no-scrollbar shadow-xs">
                    {/* 隐藏的原生图片上传 input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* 隐藏的原生 Markdown 导入 input */}
                    <input
                        type="file"
                        ref={mdFileInputRef}
                        onChange={handleMarkdownFileChange}
                        accept=".md,.markdown,.mdown,text/markdown"
                        className="hidden"
                    />

                    {/* ---------- 分组 1: AI 智能创作助手 ---------- */}
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.96 }}
                                    onClick={(e) => {
                                        if (isGenerating) {
                                            // 推演中点击：优雅中止
                                            window.dispatchEvent(new CustomEvent("ai-generation-stop"));
                                            return;
                                        }

                                        editor?.chain().focus().run();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        window.dispatchEvent(
                                            new CustomEvent("trigger-ai-continue", {
                                                detail: {
                                                    position: {
                                                        top: rect.bottom + 8,
                                                        left: Math.max(16, rect.left),
                                                    },
                                                },
                                            })
                                        );
                                    }}
                                    className={cn(
                                        "relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all select-none cursor-pointer",
                                        isGenerating
                                            ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700/60 shadow-[0_0_15px_-3px_rgba(0,0,0,0.25)] dark:shadow-[0_0_15px_-3px_rgba(255,255,255,0.12)]"
                                            : "text-zinc-900 dark:text-zinc-100 bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 border border-zinc-300/80 dark:border-zinc-700/80 shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-600"
                                    )}
                                >
                                    {/* 优雅微流光扫过动效，替代生硬的图标转圈 */}
                                    {isGenerating && (
                                        <motion.div
                                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none"
                                            animate={{ translateX: ["-100%", "200%"] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.8,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    )}

                                    <AnimatePresence mode="wait">
                                        {isGenerating ? (
                                            <motion.div
                                                key="generating"
                                                initial={{ opacity: 0, y: 3 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -3 }}
                                                className="flex items-center gap-1.5 relative z-10"
                                            >
                                                {/* 星芒微呼吸闪烁动效（不转圈，采用典雅的脉冲微缩放与发光律动） */}
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.25, 1],
                                                        opacity: [0.75, 1, 0.75],
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 1.6,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="shrink-0 flex items-center justify-center"
                                                >
                                                    <Sparkles size={12} className="text-amber-400 dark:text-amber-300" />
                                                </motion.div>
                                                <span className="font-mono text-[11px] font-semibold">推演中</span>
                                                {/* 三点极简微呼吸 */}
                                                <span className="flex items-center gap-0.5 ml-0.5">
                                                    <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
                                                    <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse [animation-delay:200ms]" />
                                                    <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse [animation-delay:400ms]" />
                                                </span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="idle"
                                                initial={{ opacity: 0, y: 3 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -3 }}
                                                className="flex items-center gap-1.5"
                                            >
                                                <Sparkles size={12} className="text-zinc-600 dark:text-zinc-400" />
                                                <span className="font-medium">AI 续写</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                {isGenerating ? "AI 正在研读前文并流式推演（点击可中止）" : "结合当前文意让 AI 自动延展续写 (或输入 ++ )"}
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor?.chain().focus().run();
                                        window.dispatchEvent(new CustomEvent("trigger-ai-ask"));
                                    }}
                                    className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50"
                                >
                                    <MessageSquarePlus size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                唤起 AI 智能提问与构思面板
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

                    {/* ---------- 分组 2: 核心学术环境 ---------- */}
                    <div className="flex items-center gap-1">
                        {/* 定理 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => insertAcademicBlock("theorem", "在此输入定理内容...")}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors"
                                >
                                    <BookOpen size={13} className="text-blue-500" />
                                    <span>定理</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入【定理 (Theorem)】学术环境块
                            </TooltipContent>
                        </Tooltip>

                        {/* 证明 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => insertAcademicBlock("proof", "在此输入严谨的推导与证明步骤...")}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <ShieldCheck size={13} className="text-zinc-500" />
                                    <span>证明</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入【证明 (Proof)】折叠推导块与 Q.E.D.
                            </TooltipContent>
                        </Tooltip>

                        {/* 定义 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => insertAcademicBlock("definition", "在此输入精确的学术定义...")}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-colors"
                                >
                                    <FileText size={13} className="text-emerald-500" />
                                    <span>定义</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入【定义 (Definition)】学术环境块
                            </TooltipContent>
                        </Tooltip>

                        {/* 更多学术组件下拉 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-0.5 px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                >
                                    <span>更多学术</span>
                                    <ChevronDown size={11} className="text-zinc-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 text-xs">
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    严谨学术环境
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("lemma", "在此输入辅助引理...")}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Layers size={14} className="text-cyan-500" />
                                    <span>引理 (Lemma)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("proposition", "在此输入命题陈述...")}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Sparkles size={14} className="text-purple-500" />
                                    <span>命题 (Proposition)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("corollary", "由上可得以下推论...")}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Workflow size={14} className="text-amber-500" />
                                    <span>推论 (Corollary)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("example", "【例】设...")}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Subtitles size={14} className="text-indigo-500" />
                                    <span>例题 (Example)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    学术标引与旁注
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        editor?.chain().focus().insertContent({
                                            type: "sidenote",
                                            attrs: { noteNumber: "1", content: "在此输入补充学术说明..." },
                                        }).run();
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Bookmark size={14} className="text-amber-600" />
                                    <span>学术边注 (Sidenote)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        editor?.chain().focus().insertContent({
                                            type: "crossRef",
                                            attrs: { label: "式 (1)", targetId: "", refType: "equation" },
                                        }).run();
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Link2 size={14} className="text-primary" />
                                    <span>交叉引用 (CrossRef)</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

                    {/* ---------- 分组 3: 公式、代码与流程图 ---------- */}
                    <div className="flex items-center gap-0.5">
                        {/* 零基础公式模板与结构助手 (分数、根号、矩阵、经典定理) */}
                        <QuickFormulaPopover />

                        {/* 数学函数与符号快捷面板 (莫比乌斯函数、欧拉函数等) */}
                        <MathSymbolsPopover />

                        {/* 代码块 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor?.chain().focus().toggleCodeBlock().run();
                                    }}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        editor?.isActive("codeBlock")
                                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                                            : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    )}
                                >
                                    <Code size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入代码块（支持语法高亮与行号）
                            </TooltipContent>
                        </Tooltip>

                        {/* Mermaid 流程图 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor?.chain().focus().insertContent({
                                            type: "mermaidBlock",
                                            attrs: {
                                                content: "graph TD\n    A[开始] --> B{判断}\n    B -->|是| C[执行]\n    B -->|否| D[结束]",
                                            },
                                        }).run();
                                    }}
                                    className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
                                >
                                    <Workflow size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入 Mermaid 流程图/架构图
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

                    {/* ---------- 分组 4: 标题与结构排版 ---------- */}
                    <div className="flex items-center gap-0.5">
                        {/* 标题下拉菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "inline-flex items-center gap-1 px-1.5 py-1 text-xs rounded-lg transition-colors",
                                        editor?.isActive("heading")
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <Heading1 size={14} />
                                    <ChevronDown size={10} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-36 text-xs">
                                <DropdownMenuItem
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={cn("flex items-center gap-2 cursor-pointer", editor?.isActive("heading", { level: 1 }) && "font-bold text-primary")}
                                >
                                    <Heading1 size={14} />
                                    <span>一级大标题</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={cn("flex items-center gap-2 cursor-pointer", editor?.isActive("heading", { level: 2 }) && "font-bold text-primary")}
                                >
                                    <Heading2 size={14} />
                                    <span>二级中标题</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                    className={cn("flex items-center gap-2 cursor-pointer", editor?.isActive("heading", { level: 3 }) && "font-bold text-primary")}
                                >
                                    <Heading3 size={14} />
                                    <span>三级小标题</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 无序列表 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        editor?.isActive("bulletList")
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <List size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                无序列表
                            </TooltipContent>
                        </Tooltip>

                        {/* 有序列表 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        editor?.isActive("orderedList")
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <ListOrdered size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                有序列表
                            </TooltipContent>
                        </Tooltip>

                        {/* 待办清单 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleTaskList().run()}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        editor?.isActive("taskList")
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <CheckSquare size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                待办任务列表
                            </TooltipContent>
                        </Tooltip>

                        {/* 引用 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        editor?.isActive("blockquote")
                                            ? "bg-accent text-accent-foreground font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <TextQuote size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                块级引用
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />

                    {/* ---------- 分组 5: 多媒体与文件导入 ---------- */}
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <ImageIcon size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                上传并插入图片 (最大 2MB)
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => mdFileInputRef.current?.click()}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <FileUp size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                导入 Markdown 文件 (.md)
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* 快捷斜杠提示条（精美保留在快捷工具栏的正下方） */}
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/60">
                            /
                        </span>
                        <span>输入斜杠唤起学术环境、公式与代码面板</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        {hintRight || <span>AI 辅助写作可用</span>}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
