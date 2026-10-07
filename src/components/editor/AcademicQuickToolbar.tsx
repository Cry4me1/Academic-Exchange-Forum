"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
    ChevronLeft,
    ChevronRight,
    Bookmark,
    Link2,
    Subtitles,
    FileUp,
    HelpCircle,
    Table as TableIcon,
    Type,
    Check,
    Cpu,
    Binary,
    Box,
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
import { STEPPER_PRESETS } from "./extensions/algorithm-stepper/presets";
import { SOLID_GEOMETRY_PRESETS } from "./extensions/solid-geometry/presets";

interface AcademicQuickToolbarProps {
    className?: string;
    hintRight?: React.ReactNode;
    variant?: "floating" | "docked";
    sticky?: boolean;
}

export default function AcademicQuickToolbar({
    className,
    hintRight,
    variant = "floating",
    sticky = true,
}: AcademicQuickToolbarProps) {
    const { editor } = useEditor();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mdFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [, setForceUpdate] = useState(0);

    // 智能横向平滑滚动机制与两端微光状态
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollStartRef = useRef(0);

    const updateScrollState = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 6);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }, []);

    const scrollByAmount = useCallback((amount: number) => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
        setTimeout(updateScrollState, 250);
    }, [updateScrollState]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        updateScrollState();

        const handleScroll = () => updateScrollState();
        el.addEventListener("scroll", handleScroll, { passive: true });

        const resizeObserver = new ResizeObserver(() => {
            updateScrollState();
        });
        resizeObserver.observe(el);

        // 原生 Wheel 事件：当存在水平溢出时，阻止默认纵向滚屏并智能转换为水平平滑移动
        const handleWheelNative = (e: WheelEvent) => {
            if (el.scrollWidth <= el.clientWidth) return;
            if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
                e.preventDefault();
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                el.scrollLeft += delta;
                updateScrollState();
            }
        };
        el.addEventListener("wheel", handleWheelNative, { passive: false });

        return () => {
            el.removeEventListener("scroll", handleScroll);
            resizeObserver.disconnect();
            el.removeEventListener("wheel", handleWheelNative);
        };
    }, [updateScrollState]);

    // 鼠标在空白区域按下并水平拖拽滑动（类似移动端触控，极度顺滑）
    const handleMouseDownPan = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("input") || target.closest("a") || target.closest("[role='menuitem']")) {
            return;
        }
        if (!scrollContainerRef.current) return;
        isDraggingRef.current = true;
        startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollStartRef.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseMovePan = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.3;
        scrollContainerRef.current.scrollLeft = scrollStartRef.current - walk;
        updateScrollState();
    };

    const handleMouseUpOrLeavePan = () => {
        isDraggingRef.current = false;
    };

    // 订阅编辑器 transaction 与 selectionUpdate 事件，保证工具栏选中态与格式实时响应
    useEffect(() => {
        if (!editor) return;
        const handleUpdate = () => {
            setForceUpdate((v) => v + 1);
        };
        editor.on("transaction", handleUpdate);
        editor.on("selectionUpdate", handleUpdate);
        return () => {
            editor.off("transaction", handleUpdate);
            editor.off("selectionUpdate", handleUpdate);
        };
    }, [editor]);

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

    // 智能健壮的块级元素执行器（自动确保焦点、支持首位/空行智能回退插入、给出用户明确成功反馈）
    const executeInsertBlock = (insertFn: () => boolean | void, tip?: string) => {
        if (!editor) {
            toast.error("协同推演编辑器正在就绪中，请稍候...");
            return;
        }

        try {
            editor.commands.focus();
            const success = insertFn();

            // 如果插入返回 false（例如当前选区无法容纳块级元素或处在特殊不可分割节点）
            if (success === false) {
                // 尝试在末尾聚焦并插入
                editor.chain().focus("end").createParagraphNear().run();
                insertFn();
            }

            if (tip) {
                toast.success(tip, { duration: 1500 });
            }
        } catch (err) {
            console.error("执行插入失败:", err);
            // 极度鲁棒兜底：在文档尾部插入
            try {
                editor.chain().focus("end").run();
                insertFn();
                if (tip) toast.success(tip, { duration: 1500 });
            } catch (fallbackErr) {
                toast.error("插入失败，请尝试在正文空白处点击一下光标");
            }
        }
    };

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
        defaultText: string,
        tip?: string
    ) => {
        executeInsertBlock(() => {
            if (!editor) return false;
            return editor
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
        }, tip);
    };

    // 极度鲁棒的双层表格插入引擎：优先执行扩展 command，若链上未挂载则无缝回退到标准 Node 树构建，100% 成功且绝对不抛 TypeError
    const insertTableSafe = (rows: number, cols: number, label: string) => {
        executeInsertBlock(() => {
            if (!editor) return false;

            // 策略 1: 尝试调用 extension-table 的 insertTable 命令
            try {
                const chain = editor.chain().focus() as any;
                if (typeof chain?.insertTable === "function") {
                    const ok = chain.insertTable({ rows, cols, withHeaderRow: true }).run();
                    if (ok) return true;
                }
            } catch (err) {
                // 忽略命令执行失败，直接进入策略 2 节点树兜底
            }

            // 策略 2: 直接构建 TipTap 标准 Table Schema 节点树（零环境依赖，100% 免疫 undefined）
            const headerCells = [];
            for (let c = 0; c < cols; c++) {
                headerCells.push({
                    type: "tableHeader",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: `列 ${c + 1}` }],
                        },
                    ],
                });
            }
            const tableRows = [{ type: "tableRow", content: headerCells }];

            for (let r = 1; r < rows; r++) {
                const rowCells = [];
                for (let c = 0; c < cols; c++) {
                    rowCells.push({
                        type: "tableCell",
                        content: [
                            {
                                type: "paragraph",
                                content: [],
                            },
                        ],
                    });
                }
                tableRows.push({ type: "tableRow", content: rowCells });
            }

            return editor.chain().focus().insertContent({
                type: "table",
                content: tableRows,
            }).run();
        }, label);
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

    // 动态判断当前光标所在块的标题/文本层级
    const isH1 = editor?.isActive("heading", { level: 1 }) ?? false;
    const isH2 = editor?.isActive("heading", { level: 2 }) ?? false;
    const isH3 = editor?.isActive("heading", { level: 3 }) ?? false;
    const isAnyHeading = isH1 || isH2 || isH3;

    const currentBlockInfo = isH1
        ? { label: "H1", icon: Heading1, active: true }
        : isH2
        ? { label: "H2", icon: Heading2, active: true }
        : isH3
        ? { label: "H3", icon: Heading3, active: true }
        : { label: "正文", icon: Type, active: false };

    const isDocked = variant === "docked";

    return (
        <TooltipProvider delayDuration={200}>
            <div
                className={cn(
                    "hidden md:block w-full transition-all duration-300 select-none",
                    isDocked
                        ? "relative z-20 py-1 px-2.5 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                        : cn(
                            "py-2",
                            sticky ? "sticky top-14 z-30" : "relative z-20",
                            isScrolled
                                ? "bg-background/60 backdrop-blur-md pb-2.5"
                                : "bg-transparent"
                        ),
                    className
                )}
            >
                {/* 滚动容器包装层：支持左右悬浮翻页水滴按键与边缘渐变消融遮罩 */}
                <div className="relative w-full overflow-hidden">
                    {/* 左侧向左滚动遮罩与悬浮水滴翻页按键 */}
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.div
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -6 }}
                                className="absolute left-0 top-0 bottom-0 z-30 flex items-center pr-8 bg-gradient-to-r from-white via-white/85 to-transparent dark:from-zinc-900 dark:via-zinc-900/85 pointer-events-none"
                            >
                                <button
                                    type="button"
                                    onClick={() => scrollByAmount(-220)}
                                    className="pointer-events-auto ml-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.15)] border-0 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="向左滚动查看更多工具"
                                >
                                    <ChevronLeft size={13} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 顶部主工具栏：Apple Liquid Glass 无边框流体透光悬浮胶囊条 */}
                    <div
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDownPan}
                        onMouseMove={handleMouseMovePan}
                        onMouseUp={handleMouseUpOrLeavePan}
                        onMouseLeave={handleMouseUpOrLeavePan}
                        className={cn(
                            "flex items-center gap-1.5 transition-all duration-300 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing",
                            isDocked
                                ? "w-full py-0.5"
                                : cn(
                                    "px-3 py-1.5 rounded-full border-0",
                                    isScrolled
                                        ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.14)]"
                                        : "bg-white/70 hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]"
                                )
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
                    <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.96 }}
                                    onMouseDown={(e) => e.preventDefault()}
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
                                        "relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all select-none cursor-pointer border-0 shrink-0 whitespace-nowrap",
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
                                                className="flex items-center gap-1.5 relative z-10 shrink-0 whitespace-nowrap"
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
                                                <span className="font-mono text-[11px] font-semibold whitespace-nowrap">推演中</span>
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
                                                className="flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                            >
                                                <Sparkles size={12} className="text-zinc-600 dark:text-zinc-400 shrink-0" />
                                                <span className="font-medium whitespace-nowrap">AI 续写</span>
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        editor?.chain().focus().run();
                                        window.dispatchEvent(new CustomEvent("trigger-ai-ask"));
                                    }}
                                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.08] transition-all border-0 cursor-pointer shrink-0"
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
                    <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                        {/* 定理 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => insertAcademicBlock("theorem", "在此输入定理内容...", "已插入定理环境块")}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-all border-0 cursor-pointer shrink-0 whitespace-nowrap"
                                >
                                    <BookOpen size={13} className="text-zinc-600 dark:text-zinc-400 shrink-0" />
                                    <span className="whitespace-nowrap">定理</span>
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => insertAcademicBlock("proof", "在此输入严谨的推导与证明步骤...", "已插入证明折叠推导块")}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-all border-0 cursor-pointer shrink-0 whitespace-nowrap"
                                >
                                    <ShieldCheck size={13} className="text-zinc-600 dark:text-zinc-400 shrink-0" />
                                    <span className="whitespace-nowrap">证明</span>
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => insertAcademicBlock("definition", "在此输入精确的学术定义...", "已插入定义环境块")}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-all border-0 cursor-pointer shrink-0 whitespace-nowrap"
                                >
                                    <FileText size={13} className="text-zinc-600 dark:text-zinc-400 shrink-0" />
                                    <span className="whitespace-nowrap">定义</span>
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] rounded-full transition-all border-0 cursor-pointer shrink-0 whitespace-nowrap"
                                >
                                    <span className="whitespace-nowrap">更多学术</span>
                                    <ChevronDown size={11} className="text-zinc-400 shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                onCloseAutoFocus={(e) => {
                                    e.preventDefault();
                                    editor?.commands.focus();
                                }}
                                className="w-48 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5"
                            >
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    严谨学术环境
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={() => insertAcademicBlock("lemma", "在此输入辅助引理...", "已插入引理环境块")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Layers size={14} className="text-zinc-500" />
                                    <span>引理 (Lemma)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => insertAcademicBlock("proposition", "在此输入命题陈述...", "已插入命题环境块")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Sparkles size={14} className="text-zinc-500" />
                                    <span>命题 (Proposition)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => insertAcademicBlock("corollary", "由上可得以下推论...", "已插入推论环境块")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Workflow size={14} className="text-zinc-500" />
                                    <span>推论 (Corollary)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => insertAcademicBlock("example", "【例】设...", "已插入例题环境块")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Subtitles size={14} className="text-zinc-500" />
                                    <span>例题 (Example)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/60 my-1" />
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    学术标引与旁注
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                             return editor.chain().focus().insertContent({
                                                type: "sidenote",
                                                attrs: { noteNumber: "1", content: "在此输入补充学术说明..." },
                                            }).run();
                                        }, "已插入学术边注");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Bookmark size={14} className="text-zinc-500" />
                                    <span>学术边注 (Sidenote)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "crossRef",
                                                attrs: { label: "式 (1)", targetId: "", refType: "equation" },
                                            }).run();
                                        }, "已插入交叉引用");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Link2 size={14} className="text-zinc-500" />
                                    <span>交叉引用 (CrossRef)</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0" />

                    {/* ---------- 分组 3: 公式、代码与流程图 ---------- */}
                    <div className="flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                        {/* 一体化数学调色板（合并公式模板与数学函数） */}
                        <MathPalette />

                        {/* 代码块 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().toggleCodeBlock().run();
                                        }, editor?.isActive("codeBlock") ? "已退出代码块" : "已插入代码块");
                                    }}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer shrink-0",
                                        editor?.isActive("codeBlock")
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                            : "text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "mermaidBlock",
                                                attrs: {
                                                    content: "graph TD\n    A[开始] --> B{判断}\n    B -->|是| C[执行]\n    B -->|否| D[结束]",
                                                },
                                            }).run();
                                        }, "已插入 Mermaid 流程图/架构图");
                                    }}
                                    className="p-1.5 rounded-full text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-all border-0 cursor-pointer shrink-0"
                                >
                                    <Workflow size={15} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                插入 Mermaid 流程图/架构图
                            </TooltipContent>
                        </Tooltip>

                        {/* 数据表格下拉菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer flex items-center gap-0.5 shrink-0 whitespace-nowrap",
                                        editor?.isActive("table")
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                            : "text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                                    )}
                                    title="插入学术数据表格"
                                >
                                    <TableIcon size={15} className="shrink-0" />
                                    <ChevronDown size={10} className="text-zinc-400 shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                onCloseAutoFocus={(e) => {
                                    e.preventDefault();
                                    editor?.commands.focus();
                                }}
                                className="w-52 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5"
                            >
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    插入学术数据表格
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={() => insertTableSafe(3, 3, "已插入标准数据表 (3×3)")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <TableIcon size={14} className="text-zinc-500" />
                                    <span>标准数据表 (3×3)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "table",
                                                content: [
                                                    {
                                                        type: "tableRow",
                                                        content: [
                                                            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "模型 / 方法" }] }] },
                                                            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "参数量 (M)" }] }] },
                                                            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "准确率 (%)" }] }] },
                                                            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "推理延时 (ms)" }] }] },
                                                        ],
                                                    },
                                                    {
                                                        type: "tableRow",
                                                        content: [
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Baseline" }] }] },
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "25.6" }] }] },
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "76.3" }] }] },
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "12.4" }] }] },
                                                        ],
                                                    },
                                                    {
                                                        type: "tableRow",
                                                        content: [
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Scholarly-Net (Ours)" }] }] },
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "21.2" }] }] },
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "82.5" }] }] },
                                                            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "8.1" }] }] },
                                                        ],
                                                    },
                                                ],
                                            }).run();
                                        }, "已插入评测对比表 (Benchmark)");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Sparkles size={14} className="text-emerald-500" />
                                    <div className="flex flex-col">
                                        <span>评测对比表 (Benchmark)</span>
                                        <span className="text-[10px] text-muted-foreground">支持一键转柱状/折线图</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/60 my-1" />
                                <DropdownMenuItem
                                    onSelect={() => insertTableSafe(4, 4, "已插入大型数据网格 (4×4)")}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <TableIcon size={14} className="text-zinc-500" />
                                    <span>大型数据网格 (4×4)</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 算法推演步进器下拉菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer flex items-center gap-0.5 shrink-0 whitespace-nowrap",
                                        editor?.isActive("algorithmStepper")
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                            : "text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                                    )}
                                    title="插入算法全景时序推演步进器"
                                >
                                    <Cpu size={15} className="shrink-0" />
                                    <ChevronDown size={10} className="text-zinc-400 shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                onCloseAutoFocus={(e) => {
                                    e.preventDefault();
                                    editor?.commands.focus();
                                }}
                                className="w-56 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5"
                            >
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    插入算法与公式时序推演看板
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "algorithmStepper",
                                                attrs: STEPPER_PRESETS["cpp-quicksort"],
                                            }).run();
                                        }, "已插入 C++ 快排时序推演步进器");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Cpu size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>C++ 快速排序双指针分区</span>
                                        <span className="text-[10px] text-muted-foreground">基准选取/双向扫描/原地交换</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "algorithmStepper",
                                                attrs: STEPPER_PRESETS["cpp-binary-search"],
                                            }).run();
                                        }, "已插入 C++ 二分查找时序推演步进器");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Binary size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>C++ 二分查找区间折半</span>
                                        <span className="text-[10px] text-muted-foreground">中点防溢出/区间收缩推演</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "algorithmStepper",
                                                attrs: STEPPER_PRESETS["math-euler"],
                                            }).run();
                                        }, "已插入欧拉恒等式推导看板");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Sigma size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>欧拉恒等式 (e^(iπ)+1=0) 推导</span>
                                        <span className="text-[10px] text-muted-foreground">复指数泰勒级数严密证明</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 3D 立体几何模型插入下拉菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer flex items-center gap-0.5 shrink-0 whitespace-nowrap",
                                        editor?.isActive("solidGeometry")
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                            : "text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                                    )}
                                    title="插入可交互三维立体几何模型"
                                >
                                    <Box size={15} className="shrink-0" />
                                    <ChevronDown size={10} className="text-zinc-400 shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                onCloseAutoFocus={(e) => {
                                    e.preventDefault();
                                    editor?.commands.focus();
                                }}
                                className="w-60 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5"
                            >
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                    插入 3D 立体几何模型
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "solidGeometry",
                                                attrs: SOLID_GEOMETRY_PRESETS["cube-diagonal-section"],
                                            }).run();
                                        }, "已插入正方体与体对角面模型");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Box size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>正方体与体对角面 (ABCD-A₁B₁C₁D₁)</span>
                                        <span className="text-[10px] text-muted-foreground">对角面截面 / 体对角线 / 展开图</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "solidGeometry",
                                                attrs: SOLID_GEOMETRY_PRESETS["tetrahedron-height"],
                                            }).run();
                                        }, "已插入正四面体与空间高线模型");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Box size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>正四面体与空间高线 (P-ABC)</span>
                                        <span className="text-[10px] text-muted-foreground">垂足投影 / 二面角截面推演</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "solidGeometry",
                                                attrs: SOLID_GEOMETRY_PRESETS["prism-cross-section"],
                                            }).run();
                                        }, "已插入直三棱柱与倾斜截面模型");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Box size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>直三棱柱与倾斜截面 (ABC-A₁B₁C₁)</span>
                                        <span className="text-[10px] text-muted-foreground">空间向量法 / 截面交割多边形</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "solidGeometry",
                                                attrs: SOLID_GEOMETRY_PRESETS["cone-axial-section"],
                                            }).run();
                                        }, "已插入圆锥与轴截面模型");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Box size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>圆锥与轴截面 (S-O)</span>
                                        <span className="text-[10px] text-muted-foreground">母线 / 高 / 半径旋转体结构</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        executeInsertBlock(() => {
                                            if (!editor) return false;
                                            return editor.chain().focus().insertContent({
                                                type: "solidGeometry",
                                                attrs: SOLID_GEOMETRY_PRESETS["spatial-coordinates"],
                                            }).run();
                                        }, "已插入空间直角坐标系模型");
                                    }}
                                    className="flex items-center gap-2 cursor-pointer rounded-xl"
                                >
                                    <Box size={14} className="text-zinc-500" />
                                    <div className="flex flex-col">
                                        <span>空间直角坐标系 (O-xyz)</span>
                                        <span className="text-[10px] text-muted-foreground">三维坐标轴 / 空间向量向径与投影</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0" />

                    {/* ---------- 分组 4: 标题与结构排版 ---------- */}
                    <div className="flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                        {/* 标题与正文段落切换下拉菜单 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={cn(
                                        "inline-flex items-center justify-between gap-1 px-2 py-1 text-xs rounded-full transition-all border-0 cursor-pointer min-w-[58px] shrink-0 whitespace-nowrap",
                                        currentBlockInfo.active
                                            ? "bg-zinc-200/80 text-zinc-900 dark:bg-white/20 dark:text-zinc-100 font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] font-medium"
                                    )}
                                    title="切换标题与正文格式"
                                >
                                    <div className="flex items-center gap-1 shrink-0">
                                        <currentBlockInfo.icon size={13} className={currentBlockInfo.active ? "text-primary" : "text-zinc-500 dark:text-zinc-400"} />
                                        <span className="text-[11px] font-medium">{currentBlockInfo.label}</span>
                                    </div>
                                    <ChevronDown size={10} className="text-zinc-400 shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                onCloseAutoFocus={(e) => {
                                    e.preventDefault();
                                    editor?.commands.focus();
                                }}
                                className="w-44 text-xs rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5"
                            >
                                {/* 正文 (普通段落) */}
                                <DropdownMenuItem
                                    onSelect={() => {
                                        editor?.chain().focus().setParagraph().run();
                                    }}
                                    className={cn(
                                        "flex items-center justify-between gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 transition-colors border-0",
                                        !isAnyHeading && "bg-zinc-100 dark:bg-white/10 font-medium text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Type size={14} className={!isAnyHeading ? "text-primary" : "text-zinc-500"} />
                                        <span>正文 (普通文本)</span>
                                    </div>
                                    {!isAnyHeading && <Check size={12} className="text-primary shrink-0" />}
                                </DropdownMenuItem>

                                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-1" />

                                {/* 一级大标题 */}
                                <DropdownMenuItem
                                    onSelect={() => {
                                        editor?.chain().focus().toggleHeading({ level: 1 }).run();
                                    }}
                                    className={cn(
                                        "flex items-center justify-between gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 transition-colors border-0",
                                        isH1 && "bg-zinc-100 dark:bg-white/10 font-medium text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Heading1 size={14} className={isH1 ? "text-primary" : "text-zinc-500"} />
                                        <span className="font-bold">一级大标题 (H1)</span>
                                    </div>
                                    {isH1 && <Check size={12} className="text-primary shrink-0" />}
                                </DropdownMenuItem>

                                {/* 二级中标题 */}
                                <DropdownMenuItem
                                    onSelect={() => {
                                        editor?.chain().focus().toggleHeading({ level: 2 }).run();
                                    }}
                                    className={cn(
                                        "flex items-center justify-between gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 transition-colors border-0",
                                        isH2 && "bg-zinc-100 dark:bg-white/10 font-medium text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Heading2 size={14} className={isH2 ? "text-primary" : "text-zinc-500"} />
                                        <span className="font-semibold">二级中标题 (H2)</span>
                                    </div>
                                    {isH2 && <Check size={12} className="text-primary shrink-0" />}
                                </DropdownMenuItem>

                                {/* 三级小标题 */}
                                <DropdownMenuItem
                                    onSelect={() => {
                                        editor?.chain().focus().toggleHeading({ level: 3 }).run();
                                    }}
                                    className={cn(
                                        "flex items-center justify-between gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 transition-colors border-0",
                                        isH3 && "bg-zinc-100 dark:bg-white/10 font-medium text-primary"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Heading3 size={14} className={isH3 ? "text-primary" : "text-zinc-500"} />
                                        <span>三级小标题 (H3)</span>
                                    </div>
                                    {isH3 && <Check size={12} className="text-primary shrink-0" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 无序列表 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer shrink-0",
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer shrink-0",
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => editor?.chain().focus().toggleTaskList().run()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer shrink-0",
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                    className={cn(
                                        "p-1.5 rounded-full transition-all border-0 cursor-pointer shrink-0",
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
                    <div className="flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] transition-all border-0 cursor-pointer disabled:opacity-50 shrink-0"
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => mdFileInputRef.current?.click()}
                                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/40 dark:hover:bg-white/[0.06] transition-all border-0 cursor-pointer shrink-0"
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
                                            <code className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200">++</code>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* 右侧向右滚动遮罩与悬浮水滴翻页按键 */}
                <AnimatePresence>
                    {canScrollRight && (
                        <motion.div
                            initial={{ opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            className="absolute right-0 top-0 bottom-0 z-30 flex items-center pl-8 bg-gradient-to-l from-white via-white/85 to-transparent dark:from-zinc-900 dark:via-zinc-900/85 pointer-events-none"
                        >
                            <button
                                type="button"
                                onClick={() => scrollByAmount(220)}
                                className="pointer-events-auto mr-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.15)] border-0 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                title="向右滚动查看更多工具"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </TooltipProvider>
    );
}
