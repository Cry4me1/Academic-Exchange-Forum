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
    HelpCircle,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { MathPalette } from "./MathPalette";

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
    const [isScrolled, setIsScrolled] = useState(false);

    // 监听窗口滚动，以在吸顶时无缝呈现柔和阴影与背景毛玻璃
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 30);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
            <div
                className={cn(
                    "w-full sticky top-14 z-30 py-2 transition-all duration-300 select-none",
                    isScrolled
                        ? "bg-background/60 backdrop-blur-md pb-2.5"
                        : "bg-transparent",
                    className
                )}
            >
                {/* 顶部主工具栏：Apple Liquid Glass 无边框流体透光悬浮胶囊条 */}
                <div
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 transition-all duration-300 overflow-x-auto no-scrollbar",
                        isScrolled
                            ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.14)]"
                            : "bg-white/70 hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]"
                    )}
                >
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
                                        "relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all select-none cursor-pointer border-0",
                                        isGenerating
                                            ? "bg-zinc-950/90 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                                            : "text-zinc-800 dark:text-zinc-200 bg-zinc-200/45 hover:bg-zinc-200/75 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]"
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
                                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.08] transition-all border-0 cursor-pointer"
                                >
                                    <MessageSquarePlus size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                唤起 AI 智能提问与构思面板
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0" />

                    {/* ---------- 分组 2: 核心学术环境 ---------- */}
                    <div className="flex items-center gap-1">
                        {/* 定理 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => insertAcademicBlock("theorem", "在此输入定理内容...")}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] transition-all border-0 cursor-pointer"
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
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-white/[0.08] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] transition-all border-0 cursor-pointer"
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
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] transition-all border-0 cursor-pointer"
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
                                    className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] rounded-full transition-all border-0 cursor-pointer"
                                >
                                    <span>更多学术</span>
                                    <ChevronDown size={11} className="text-zinc-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5">
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    严谨学术环境
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("lemma", "在此输入辅助引理...")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Layers size={14} className="text-cyan-500" />
                                    <span>引理 (Lemma)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("proposition", "在此输入命题陈述...")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Sparkles size={14} className="text-purple-500" />
                                    <span>命题 (Proposition)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("corollary", "由上可得以下推论...")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Workflow size={14} className="text-amber-500" />
                                    <span>推论 (Corollary)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => insertAcademicBlock("example", "【例】设...")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Subtitles size={14} className="text-indigo-500" />
                                    <span>例题 (Example)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/60 my-1" />
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

                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0" />

                    {/* ---------- 分组 3: 公式、代码与流程图 ---------- */}
                    <div className="flex items-center gap-0.5">
                        {/* 一体化数学调色板（合并公式模板与数学函数） */}
                        <MathPalette />

                        {/* 代码块 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor?.chain().focus().toggleCodeBlock().run();
                                    }}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer",
                                        editor?.isActive("codeBlock")
                                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
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
                                    className="p-1.5 rounded-full text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20 transition-all border-0 cursor-pointer"
                                >
                                    <Workflow size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入 Mermaid 流程图/架构图
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0" />

                    {/* ---------- 分组 4: 标题与结构排版 ---------- */}
                    <div className="flex items-center gap-0.5">
                        {/* 标题下拉菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all border-0 cursor-pointer",
                                        editor?.isActive("heading")
                                            ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/20 dark:text-zinc-100 font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06]"
                                    )}
                                >
                                    <Heading1 size={14} />
                                    <ChevronDown size={10} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-36 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5">
                                <DropdownMenuItem
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={cn("flex items-center gap-2 cursor-pointer rounded-xl", editor?.isActive("heading", { level: 1 }) && "font-bold text-primary")}
                                >
                                    <Heading1 size={14} />
                                    <span>一级大标题</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={cn("flex items-center gap-2 cursor-pointer rounded-xl", editor?.isActive("heading", { level: 2 }) && "font-bold text-primary")}
                                >
                                    <Heading2 size={14} />
                                    <span>二级中标题</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                    className={cn("flex items-center gap-2 cursor-pointer rounded-xl", editor?.isActive("heading", { level: 3 }) && "font-bold text-primary")}
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
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer",
                                        editor?.isActive("bulletList")
                                            ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/20 dark:text-zinc-100 font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06]"
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
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer",
                                        editor?.isActive("orderedList")
                                            ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/20 dark:text-zinc-100 font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06]"
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
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer",
                                        editor?.isActive("taskList")
                                            ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/20 dark:text-zinc-100 font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06]"
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
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer",
                                        editor?.isActive("blockquote")
                                            ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/20 dark:text-zinc-100 font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06]"
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

                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0" />

                    {/* ---------- 分组 5: 多媒体与文件导入 ---------- */}
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] transition-all border-0 cursor-pointer disabled:opacity-50"
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
                                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] transition-all border-0 cursor-pointer"
                                >
                                    <FileUp size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                导入 Markdown 文件 (.md)
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* ---------- 分组 6: 右侧快捷指令徽标与速查弹窗（收敛视觉噪音） ---------- */}
                    <div className="ml-auto flex items-center gap-2 shrink-0 pl-1">
                        {hintRight && (
                            <div className="hidden xl:flex items-center text-zinc-400 text-xs font-normal">
                                {hintRight}
                            </div>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.08] transition-all cursor-pointer border-0"
                                >
                                    <kbd className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/80 font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                                        /
                                    </kbd>
                                    <span className="hidden sm:inline text-[11px]">快捷指令</span>
                                    <HelpCircle className="w-3 h-3 text-zinc-400" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80 p-4 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/60 pb-2">
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            学术与排版快捷指令
                                        </span>
                                        <span className="text-[10px] font-mono bg-zinc-200/50 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">输入 / 唤起</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        在正文任意新行输入 <kbd className="font-mono bg-zinc-200/60 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-full border-0 text-foreground">/</kbd> 即可直接弹出命令列表，亦可使用以下常用快捷语法：
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-200/35 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                            <span className="text-zinc-600 dark:text-zinc-400">行内公式</span>
                                            <code className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">$E=mc^2$</code>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-200/35 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                            <span className="text-zinc-600 dark:text-zinc-400">独立公式块</span>
                                            <code className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">$$</code>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-200/35 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                            <span className="text-zinc-600 dark:text-zinc-400">学术定理块</span>
                                            <code className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">/theorem</code>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-200/35 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                            <span className="text-zinc-600 dark:text-zinc-400">证明折叠块</span>
                                            <code className="font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400">/proof</code>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-200/35 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                            <span className="text-zinc-600 dark:text-zinc-400">流程图/架构</span>
                                            <code className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">/mermaid</code>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-200/35 dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                            <span className="text-zinc-600 dark:text-zinc-400">AI 智能续写</span>
                                            <code className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">++</code>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
