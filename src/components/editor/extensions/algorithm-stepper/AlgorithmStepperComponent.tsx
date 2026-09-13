"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Pause,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    Copy,
    Check,
    Edit3,
    Trash2,
    Plus,
    Code2,
    Sigma,
    Binary,
    Activity,
    Layers,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import {
    AlgorithmStep,
    AlgorithmStepperAttrs,
} from "./algorithm-stepper-types";
import { STEPPER_PRESETS } from "./presets";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function AlgorithmStepperComponent({
    node,
    updateAttributes,
    editor,
    deleteNode,
}: NodeViewProps) {
    const isEditable = editor.isEditable;
    const defaultPreset = STEPPER_PRESETS["cpp-quicksort"];

    // 挂载状态（确保 SSR 安全 Portal）
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // 节点属性持久化
    const title = (node.attrs.title as string) || defaultPreset.title;
    const subtitle = (node.attrs.subtitle as string) || defaultPreset.subtitle;
    const steps = (node.attrs.steps as AlgorithmStep[])?.length > 0
        ? (node.attrs.steps as AlgorithmStep[])
        : defaultPreset.steps;

    // 当前活跃步骤
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copiedFormula, setCopiedFormula] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // 作者端编辑模态框
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState<AlgorithmStepperAttrs>({
        title,
        subtitle,
        steps: JSON.parse(JSON.stringify(steps)),
    });
    const [editingStepIndex, setEditingStepIndex] = useState(0);

    const activeStep: AlgorithmStep = steps[activeIndex] || steps[0];

    // 多态判断当前步骤的形态
    const hasFormula = Boolean(activeStep?.formula && activeStep.formula.trim().length > 0);
    const hasCode = Boolean(activeStep?.codeSnippet?.code && activeStep.codeSnippet.code.trim().length > 0);
    const isPureMath = hasFormula && !hasCode;
    const isCodeMode = hasCode && !hasFormula;

    // 全屏时背景页面防滚动
    useEffect(() => {
        if (!isFullscreen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isFullscreen]);

    // 自动播放定时器（2.6秒递进步进）
    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => {
                if (prev >= steps.length - 1) {
                    return 0;
                }
                return prev + 1;
            });
        }, 2600);
        return () => clearInterval(timer);
    }, [isPlaying, steps.length]);

    // 键盘操作
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (isFullscreen) {
                if (e.key === "ArrowRight" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev > 0 ? prev - 1 : steps.length - 1));
                } else if (e.key === "Escape") {
                    setIsFullscreen(false);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen, steps.length]);

    const nextStep = () => {
        if (activeIndex < steps.length - 1) {
            setActiveIndex((prev) => prev + 1);
        } else {
            setActiveIndex(0);
        }
    };

    const prevStep = () => {
        if (activeIndex > 0) {
            setActiveIndex((prev) => prev - 1);
        } else {
            setActiveIndex(steps.length - 1);
        }
    };

    // 复制 LaTeX
    const handleCopyFormula = (latex?: string) => {
        if (!latex) return;
        navigator.clipboard.writeText(latex);
        setCopiedFormula(true);
        toast.success("LaTeX 数学公式已复制");
        setTimeout(() => setCopiedFormula(false), 2000);
    };

    // 复制代码
    const handleCopyCode = (code?: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        toast.success("算法代码已复制");
        setTimeout(() => setCopiedCode(false), 2000);
    };

    // 渲染 KaTeX
    const renderedFormula = useMemo(() => {
        if (!activeStep?.formula) return null;
        try {
            return katex.renderToString(activeStep.formula, {
                displayMode: true,
                throwOnError: false,
            });
        } catch {
            return null;
        }
    }, [activeStep?.formula]);

    // 切换预设
    const applyPreset = (presetKey: string) => {
        const p = STEPPER_PRESETS[presetKey];
        if (!p) return;
        updateAttributes({
            title: p.title,
            subtitle: p.subtitle,
            presetKey: p.presetKey,
            steps: p.steps,
        });
        setActiveIndex(0);
        setIsPlaying(false);
        toast.success(`已切换至【${p.title.slice(0, 18)}...】`);
    };

    // 保存编辑
    const handleSaveEdit = () => {
        updateAttributes({
            title: editForm.title,
            subtitle: editForm.subtitle,
            steps: editForm.steps,
        });
        setIsEditDialogOpen(false);
        setActiveIndex(0);
        toast.success("推演步骤已更新");
    };

    // 核心渲染函数：统一服务于行内与全屏剧场视界
    const renderCardContent = (isModal: boolean) => (
        <>
            {/* 顶层无色环境微光反射 */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-indigo-400/10 dark:bg-purple-500/10 blur-3xl pointer-events-none" />

            {/* 1. 顶部标题栏 */}
            <div className={cn(
                "relative shrink-0 flex items-center justify-between gap-4",
                isModal ? "px-6 sm:px-8 py-4" : "px-6 py-4"
            )}>
                <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] shrink-0",
                        isPureMath
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    )}>
                        {isPureMath ? <Sigma size={13} /> : <Code2 size={13} />}
                        {isPureMath ? "数学公式严密推导" : "经典算法单步推演"}
                    </span>
                    <div className="min-w-0 flex flex-col">
                        <h3 className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* 右侧操作区 */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* 预设模板菜单 */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border-0 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer font-medium"
                                title="切换算法与公式模板"
                            >
                                <Layers size={13} className="text-sky-500" />
                                <span className="hidden sm:inline">常用模板</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[80] w-56 text-xs rounded-2xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-xl p-1.5">
                            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                经典算法与公式推演模板
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => applyPreset("cpp-quicksort")}
                                className="flex items-center gap-2 cursor-pointer rounded-xl"
                            >
                                <Code2 size={14} className="text-sky-500" />
                                <span>C++ 快速排序双指针分区</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => applyPreset("cpp-binary-search")}
                                className="flex items-center gap-2 cursor-pointer rounded-xl"
                            >
                                <Binary size={14} className="text-emerald-500" />
                                <span>C++ 二分查找区间折半</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => applyPreset("math-euler")}
                                className="flex items-center gap-2 cursor-pointer rounded-xl"
                            >
                                <Sigma size={14} className="text-purple-500" />
                                <span>欧拉恒等式 (e^(iπ)+1=0) 推导</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* 作者端编辑步骤 */}
                    {isEditable && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditForm({
                                    title,
                                    subtitle,
                                    steps: JSON.parse(JSON.stringify(steps)),
                                });
                                setEditingStepIndex(0);
                                setIsEditDialogOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border-0 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer font-medium"
                            title="编辑阶段与步骤"
                        >
                            <Edit3 size={13} className="text-amber-500" />
                            <span className="hidden sm:inline">编辑步骤</span>
                        </button>
                    )}

                    {/* 全屏 / 退出全屏控制 */}
                    {isModal ? (
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border-0 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer font-medium shadow-xs"
                            title="退出全屏演示 (ESC)"
                        >
                            <Minimize2 size={13} className="text-sky-500" />
                            <span>退出全屏</span>
                            <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-muted-foreground font-semibold">ESC</kbd>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(true)}
                            className="p-1.5 rounded-full border-0 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer"
                            title="全屏演示推演"
                        >
                            <Maximize2 size={14} />
                        </button>
                    )}

                    {/* 删除（仅行内编辑态显示） */}
                    {!isModal && isEditable && (
                        <button
                            type="button"
                            onClick={deleteNode}
                            className="p-1.5 rounded-full border-0 text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="删除组件"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* 渐变消融微光缝 */}
            <div className="shrink-0 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 2. 时序流光胶囊轨道 (Timeline Capsule Track) */}
            <div className={cn(
                "relative shrink-0 overflow-x-auto no-scrollbar bg-zinc-50/50 dark:bg-zinc-950/30",
                isModal ? "px-6 sm:px-8 py-3" : "px-6 py-3"
            )}>
                <div className="flex items-center gap-2 min-w-max">
                    {steps.map((step, idx) => {
                        const isPast = idx < activeIndex;
                        const isCurrent = idx === activeIndex;

                        return (
                            <React.Fragment key={step.id || idx}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveIndex(idx);
                                        setIsPlaying(false);
                                    }}
                                    className={cn(
                                        "group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all duration-300 border-0 cursor-pointer font-medium",
                                        isCurrent
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[0_4px_16px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                                            : isPast
                                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15"
                                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-white/5"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-transform",
                                            isCurrent
                                                ? "bg-white/20 dark:bg-black/20 text-current scale-105"
                                                : isPast
                                                ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                                        )}
                                    >
                                        {isPast ? <Check size={11} className="stroke-[2.5]" /> : `0${idx + 1}`}
                                    </span>
                                    <span className="truncate max-w-[140px] md:max-w-[180px]">
                                        {step.badge || step.title}
                                    </span>
                                </button>

                                {idx < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "w-4 h-[2px] rounded-full transition-colors duration-300",
                                            idx < activeIndex
                                                ? "bg-sky-500/60 dark:bg-sky-400/60"
                                                : "bg-zinc-200 dark:bg-zinc-800"
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* 渐变消融微光缝 */}
            <div className="shrink-0 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 3. 多态联动主舞台 (Polymorphic Stage) */}
            <div className={cn(
                isModal
                    ? "flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col justify-center"
                    : "p-6"
            )}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep?.id || activeIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className={isModal ? "my-auto w-full" : undefined}
                    >
                        {/* 形态 1：纯数学公式推导视图 (Pure Math Derivation) */}
                        {isPureMath && (
                            <div className="max-w-3xl mx-auto flex flex-col gap-5 py-2">
                                {/* 阶段标题与徽标 */}
                                <div className="flex items-center justify-between gap-2 border-b border-zinc-200/50 dark:border-zinc-800/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                            STAGE 0{activeIndex + 1}
                                        </span>
                                        <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                            {activeStep.title}
                                        </span>
                                    </div>
                                    {activeStep.badge && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300">
                                            {activeStep.badge}
                                        </span>
                                    )}
                                </div>

                                {/* 宽幅居中公式剧场卡片 */}
                                <div className={cn(
                                    "relative group rounded-3xl border-0 bg-gradient-to-b from-purple-500/5 to-transparent dark:from-purple-500/10 bg-zinc-100/60 dark:bg-zinc-800/30 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col items-center justify-center",
                                    isModal ? "p-10 min-h-[200px]" : "p-8 min-h-[160px]"
                                )}>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyFormula(activeStep.formula)}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm transition-all cursor-pointer"
                                        title="复制 LaTeX 源码"
                                    >
                                        {copiedFormula ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                    </button>

                                    <div
                                        className={cn(
                                            "overflow-x-auto max-w-full text-center text-zinc-900 dark:text-zinc-100 font-serif leading-relaxed py-2",
                                            isModal ? "text-xl md:text-2xl" : "text-lg md:text-xl"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: renderedFormula || activeStep.formula || "" }}
                                    />
                                </div>

                                {/* 严密数学推导与依据阐述 */}
                                <div className="p-4 rounded-2xl border-0 bg-zinc-100/50 dark:bg-zinc-800/30 backdrop-blur-xl">
                                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        数学变换依据与分析 (Mathematical Rationale)
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-serif">
                                        {activeStep.explanation}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 形态 2：C++ / 经典算法推演视图 (C++ Algorithm Debugger) */}
                        {isCodeMode && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                {/* 左侧：变量监视池与数组切片状态 (5 列) */}
                                <div className="lg:col-span-5 flex flex-col gap-4">
                                    <div className="rounded-2xl border-0 p-5 bg-zinc-100/70 dark:bg-zinc-800/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between h-full min-h-[280px]">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                                                    STEP 0{activeIndex + 1}
                                                </span>
                                                {activeStep.badge && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200">
                                                        {activeStep.badge}
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4 leading-snug">
                                                {activeStep.title}
                                            </h4>

                                            {/* 数组状态可视化卡片 */}
                                            {activeStep.arrayState && (
                                                <div className="mb-4 p-3.5 rounded-2xl bg-white/85 dark:bg-zinc-900/85 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                                    <div className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                        <Binary size={12} className="text-sky-500" />
                                                        <span>{activeStep.arrayState.label || "数组内存切片状态"}</span>
                                                    </div>

                                                    {/* 数组格子序列 */}
                                                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                                                        {activeStep.arrayState.items.map((val, cellIdx) => {
                                                            const isHighlighted = activeStep.arrayState?.highlightIndices?.includes(cellIdx);
                                                            const pointerLabel = activeStep.arrayState?.pointerLabels?.[cellIdx];

                                                            return (
                                                                <div key={cellIdx} className="flex flex-col items-center gap-1">
                                                                    <div
                                                                        className={cn(
                                                                            "w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs",
                                                                            isHighlighted
                                                                                ? "bg-sky-500 text-white scale-105 shadow-[0_2px_8px_rgba(14,165,233,0.35)]"
                                                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                                                        )}
                                                                    >
                                                                        {val}
                                                                    </div>
                                                                    <span className="text-[9px] font-mono text-zinc-400 select-none">
                                                                        [{cellIdx}]
                                                                    </span>
                                                                    {pointerLabel && (
                                                                        <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                                                                            {pointerLabel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 变量监视看板 (Variable Watcher) */}
                                            {activeStep.variables && activeStep.variables.length > 0 && (
                                                <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 shadow-xs">
                                                    <div className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                        <Activity size={12} className="text-emerald-500" />
                                                        <span>当前内存变量跟踪 (Variable Watcher)</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {activeStep.variables.map((v, vIdx) => (
                                                            <div
                                                                key={vIdx}
                                                                className={cn(
                                                                    "px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center justify-between transition-colors",
                                                                    v.changed
                                                                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold"
                                                                        : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
                                                                )}
                                                            >
                                                                <span className="opacity-75">{v.name}:</span>
                                                                <span className="font-bold">{v.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 右侧：C++ 语法微距高亮代码与原理 (7 列) */}
                                <div className="lg:col-span-7 flex flex-col gap-4">
                                    {/* C++ 代码卡片 */}
                                    <div className="relative group rounded-2xl border-0 overflow-hidden bg-[#1e1e24] dark:bg-[#141418] text-[#e2e8f0] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)]">
                                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[11px] text-zinc-400 font-mono">
                                            <div className="flex items-center gap-2">
                                                <Code2 size={13} className="text-sky-400" />
                                                <span>{activeStep.codeSnippet?.language?.toUpperCase() || "C++"}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(activeStep.codeSnippet?.code)}
                                                className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
                                                title="复制代码"
                                            >
                                                {copiedCode ? (
                                                    <>
                                                        <Check size={11} className="text-emerald-400" />
                                                        <span className="text-[10px] text-emerald-400 font-sans">已复制</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={11} />
                                                        <span className="text-[10px] font-sans">复制代码</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className={cn(
                                            "p-3.5 font-mono text-xs overflow-x-auto leading-relaxed",
                                            isModal ? "max-h-[360px] overflow-y-auto" : ""
                                        )}>
                                            {activeStep.codeSnippet?.code.split("\n").map((line, lineIdx) => {
                                                const lineNum = lineIdx + 1;
                                                const isHighlighted = activeStep.codeSnippet?.highlightLines?.includes(lineNum);

                                                return (
                                                    <div
                                                        key={lineIdx}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded transition-colors flex items-start gap-3",
                                                            isHighlighted
                                                                ? "bg-sky-500/20 text-white font-medium shadow-[inset_2px_0_0_#38bdf8]"
                                                                : "text-zinc-400/80 hover:text-zinc-300"
                                                        )}
                                                    >
                                                        <span className="text-[10px] opacity-40 select-none w-4 text-right shrink-0">
                                                            {lineNum}
                                                        </span>
                                                        <span className="flex-1 whitespace-pre">{line}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 步骤原理解析 */}
                                    <div className="p-4 rounded-2xl border-0 bg-zinc-100/50 dark:bg-zinc-800/30 backdrop-blur-xl">
                                        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                            循环不变量与单步原理分析 (Step Logic)
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {activeStep.explanation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 形态 3：双模复合视图 */}
                        {!isPureMath && !isCodeMode && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 flex flex-col gap-3">
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        {activeStep.title}
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 text-center">
                                        <div
                                            className="overflow-x-auto py-1 text-zinc-900 dark:text-zinc-100 font-serif"
                                            dangerouslySetInnerHTML={{ __html: renderedFormula || activeStep.formula || "" }}
                                        />
                                    </div>
                                </div>
                                <div className="lg:col-span-7 flex flex-col gap-3">
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {activeStep.explanation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 渐变消融微光缝 */}
            <div className="shrink-0 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 4. 底部微光控制底盘 (Control Deck) */}
            <div className={cn(
                "shrink-0 flex items-center justify-between gap-4 bg-zinc-50/80 dark:bg-zinc-950/60",
                isModal ? "mt-auto px-6 sm:px-8 py-4" : "px-6 py-3.5"
            )}>
                <button
                    type="button"
                    onClick={() => {
                        prevStep();
                        setIsPlaying(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border-0 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
                >
                    <ChevronLeft size={14} />
                    <span>上一阶段</span>
                </button>

                {/* 中央播放/暂停与进度指示 */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0",
                            isPlaying
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                                : isPureMath
                                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
                                : "bg-sky-500 text-white hover:bg-sky-600 shadow-[0_4px_12px_rgba(14,165,233,0.3)]"
                        )}
                    >
                        {isPlaying ? (
                            <>
                                <Pause size={12} className="fill-current" />
                                <span>暂停推演</span>
                            </>
                        ) : (
                            <>
                                <Play size={12} className="fill-current" />
                                <span>自动推演</span>
                            </>
                        )}
                    </button>

                    <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                        0{activeIndex + 1} / 0{steps.length} 步 · {Math.round(((activeIndex + 1) / steps.length) * 100)}%
                    </span>

                    {/* 全屏模式下的键盘快捷提示微胶囊 */}
                    {isModal && (
                        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-white/5 font-mono">
                            ← / → 翻页 · 空格播放 · ESC 退出
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        nextStep();
                        setIsPlaying(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border-0 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
                >
                    <span>下一阶段</span>
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* 底部充能微进度指示条 */}
            <div className={cn(
                "shrink-0 w-full bg-zinc-200/50 dark:bg-zinc-800/50 overflow-hidden",
                isModal ? "h-1.5" : "h-1"
            )}>
                <motion.div
                    className={cn(
                        "h-full",
                        isPureMath
                            ? "bg-gradient-to-r from-purple-400 to-indigo-400"
                            : "bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400"
                    )}
                    animate={{
                        width: `${((activeIndex + 1) / steps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                />
            </div>
        </>
    );

    return (
        <NodeViewWrapper className="scholarly-algorithm-stepper-wrapper my-8 select-none">
            {/* 行内视图卡片：Apple Liquid Glass 无边框流体毛玻璃 */}
            {isFullscreen ? (
                /* 全屏时文内显示的优雅占位微岛，防止布局塌陷并提供快捷召回 */
                <div className="relative overflow-hidden rounded-3xl border-0 w-full p-8 text-center bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl flex flex-col items-center justify-center gap-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]">
                    <div className="p-3 rounded-full bg-sky-500/10 text-sky-500">
                        <Maximize2 size={22} />
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        当前推演已展开至全屏沉浸剧场
                    </div>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        你正在无干扰的全屏视界中进行单步推演演示。按 ESC 键或点击下方按钮即可收起。
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="mt-1 px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 cursor-pointer transition-all shadow-sm"
                    >
                        收起并返回正文
                    </button>
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-3xl border-0 w-full flex flex-col transition-all duration-300 bg-white/80 dark:bg-zinc-900/75 backdrop-blur-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_20px_50px_-8px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                    {renderCardContent(false)}
                </div>
            )}

            {/* 全屏沉浸演示剧场 (Theater Presentation Mode)：通过 Portal 挂载到 body，彻底消除四周泄漏与底部空白 */}
            {mounted && isFullscreen && createPortal(
                <div
                    className="fixed inset-0 z-[60] bg-zinc-950/75 dark:bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200 select-none"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div
                        className="relative w-full max-w-5xl h-[88vh] max-h-[860px] flex flex-col rounded-3xl border-0 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.15)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {renderCardContent(true)}
                    </div>
                </div>,
                document.body
            )}

            {/* 作者端编辑弹窗 (Dialog) */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="z-[80] max-w-2xl text-xs rounded-3xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Edit3 size={16} className="text-sky-500" />
                            编辑算法与公式推演步骤
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-muted-foreground mb-1">推演总标题</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-muted-foreground mb-1">副标题 / 说明</label>
                                <input
                                    type="text"
                                    value={editForm.subtitle || ""}
                                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background"
                                />
                            </div>
                        </div>

                        {/* 步骤标签列表 */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {editForm.steps.map((s, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setEditingStepIndex(idx)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors border-0 cursor-pointer",
                                        editingStepIndex === idx
                                            ? "bg-sky-500 text-white"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    )}
                                >
                                    步骤 0{idx + 1}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    const newStep: AlgorithmStep = {
                                        id: `step-${Date.now()}`,
                                        title: "新增推演步骤",
                                        badge: "New Step",
                                        explanation: "输入本步骤的学术推演原理...",
                                    };
                                    setEditForm({
                                        ...editForm,
                                        steps: [...editForm.steps, newStep],
                                    });
                                    setEditingStepIndex(editForm.steps.length);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-0 cursor-pointer shrink-0"
                            >
                                <Plus size={12} />
                                <span>加一步</span>
                            </button>
                        </div>

                        {/* 单步编辑 */}
                        {editForm.steps[editingStepIndex] && (
                            <div className="space-y-3 p-3.5 rounded-2xl bg-muted/40 border border-zinc-200/50 dark:border-zinc-800/50">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">步骤名称</label>
                                        <input
                                            type="text"
                                            value={editForm.steps[editingStepIndex].title}
                                            onChange={(e) => {
                                                const updated = [...editForm.steps];
                                                updated[editingStepIndex].title = e.target.value;
                                                setEditForm({ ...editForm, steps: updated });
                                            }}
                                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">徽标胶囊 (Badge)</label>
                                        <input
                                            type="text"
                                            value={editForm.steps[editingStepIndex].badge}
                                            onChange={(e) => {
                                                const updated = [...editForm.steps];
                                                updated[editingStepIndex].badge = e.target.value;
                                                setEditForm({ ...editForm, steps: updated });
                                            }}
                                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                        LaTeX 数学公式 (纯公式推导模式必填，留空则为代码模式)
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.steps[editingStepIndex].formula || ""}
                                        onChange={(e) => {
                                            const updated = [...editForm.steps];
                                            updated[editingStepIndex].formula = e.target.value;
                                            setEditForm({ ...editForm, steps: updated });
                                        }}
                                        placeholder="例如：e^{ix} = \cos x + i \sin x"
                                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                        C++ / 算法代码切片 (纯代码模式必填，留空则为纯公式模式)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editForm.steps[editingStepIndex].codeSnippet?.code || ""}
                                        onChange={(e) => {
                                            const updated = [...editForm.steps];
                                            updated[editingStepIndex].codeSnippet = {
                                                language: "cpp",
                                                code: e.target.value,
                                                highlightLines: [1],
                                            };
                                            setEditForm({ ...editForm, steps: updated });
                                        }}
                                        placeholder="// 例如：std::swap(arr[i], arr[j]);"
                                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">学术原理与变换依据 (Explanation)</label>
                                    <textarea
                                        rows={2}
                                        value={editForm.steps[editingStepIndex].explanation}
                                        onChange={(e) => {
                                            const updated = [...editForm.steps];
                                            updated[editingStepIndex].explanation = e.target.value;
                                            setEditForm({ ...editForm, steps: updated });
                                        }}
                                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background"
                                    />
                                </div>

                                {editForm.steps.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = editForm.steps.filter((_, i) => i !== editingStepIndex);
                                            setEditForm({ ...editForm, steps: updated });
                                            setEditingStepIndex(Math.max(0, editingStepIndex - 1));
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={12} />
                                        <span>删除此步骤</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsEditDialogOpen(false)}
                            className="px-4 py-1.5 rounded-full text-xs font-medium border-0 bg-muted hover:bg-muted/80 cursor-pointer"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold border-0 bg-sky-500 text-white hover:bg-sky-600 shadow-md cursor-pointer"
                        >
                            保存并应用
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </NodeViewWrapper>
    );
}
