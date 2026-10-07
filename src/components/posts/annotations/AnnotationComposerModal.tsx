"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import { AnnotationColor, AnnotationSelectionState } from "./types";
import { cn } from "@/lib/utils";
import { Quote, Send, Sparkles, Eye, Edit3, Loader2 } from "lucide-react";

interface AnnotationComposerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selection: AnnotationSelectionState | null;
    onSubmit: (content: string, color: AnnotationColor) => Promise<void>;
    isSubmitting?: boolean;
}

const COLOR_OPTIONS: {
    color: AnnotationColor;
    name: string;
    description: string;
    dotClass: string;
    activeClass: string;
}[] = [
    {
        color: "amber",
        name: "琥珀金",
        description: "推导 · 释义",
        dotClass: "bg-amber-500",
        activeClass: "ring-2 ring-amber-500/60 bg-amber-500/10 text-amber-900 dark:text-amber-200",
    },
    {
        color: "emerald",
        name: "翡翠绿",
        description: "论据 · 佐证",
        dotClass: "bg-emerald-500",
        activeClass: "ring-2 ring-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    },
    {
        color: "sky",
        name: "天青蓝",
        description: "存疑 · 反例",
        dotClass: "bg-sky-500",
        activeClass: "ring-2 ring-sky-500/60 bg-sky-500/10 text-sky-900 dark:text-sky-200",
    },
    {
        color: "violet",
        name: "幽紫晶",
        description: "猜想 · 延伸",
        dotClass: "bg-purple-500",
        activeClass: "ring-2 ring-purple-500/60 bg-purple-500/10 text-purple-900 dark:text-purple-200",
    },
];

export function AnnotationComposerModal({
    open,
    onOpenChange,
    selection,
    onSubmit,
    isSubmitting = false,
}: AnnotationComposerModalProps) {
    const [content, setContent] = useState("");
    const [selectedColor, setSelectedColor] = useState<AnnotationColor>("amber");
    const [previewMode, setPreviewMode] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        await onSubmit(content.trim(), selectedColor);
        setContent("");
        setPreviewMode(false);
        onOpenChange(false);
    };

    const quoteExcerpt = selection?.anchorText || "";
    const isTruncated = quoteExcerpt.length > 120;
    const displayExcerpt = isTruncated ? `${quoteExcerpt.slice(0, 118)}...` : quoteExcerpt;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "sm:max-w-lg p-0 overflow-hidden border-0 rounded-3xl",
                "bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl",
                "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                "dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
            )}>
                <div className="p-6 pb-5 space-y-4">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                <span className="p-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                添加行间学术批注
                            </DialogTitle>
                            <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-0.5 rounded-full">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(false)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs rounded-full font-medium transition-all",
                                        !previewMode
                                            ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Edit3 className="w-3 h-3 inline-block mr-1" />
                                    编辑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode(true)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs rounded-full font-medium transition-all",
                                        previewMode
                                            ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Eye className="w-3 h-3 inline-block mr-1" />
                                    预览
                                </button>
                            </div>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground">
                            针对正文选段发表同行批注，支持 Markdown 与 LaTeX 公式语法（如 $f(x)=x^2$）。
                        </DialogDescription>
                    </DialogHeader>

                    {/* 引用原文选段预览 */}
                    <div className="relative p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 backdrop-blur-md overflow-hidden">
                        <div className="absolute top-3 left-3 text-muted-foreground/40">
                            <Quote className="w-3.5 h-3.5" />
                        </div>
                        <div className="pl-5 text-xs text-muted-foreground italic leading-relaxed line-clamp-3">
                            <MathText text={displayExcerpt} inlineOnly />
                        </div>
                    </div>

                    {/* 学术意图微光分类选择 */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                            学术研讨分类
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {COLOR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.color}
                                    type="button"
                                    onClick={() => setSelectedColor(opt.color)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-2 rounded-2xl text-center transition-all duration-150 cursor-pointer border-0",
                                        "bg-zinc-100/50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60",
                                        selectedColor === opt.color ? opt.activeClass : "text-muted-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className={cn("w-2 h-2 rounded-full", opt.dotClass)} />
                                        <span className="text-xs font-semibold">{opt.name}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/80">{opt.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 渐变消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 输入主体 */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!previewMode ? (
                            <div className="space-y-1">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="在此输入学术注记、推导补充或质疑反例（支持 $E=mc^2$ 公式语法）..."
                                    rows={4}
                                    autoFocus
                                    className={cn(
                                        "w-full p-3.5 text-xs sm:text-sm rounded-2xl leading-relaxed resize-none",
                                        "bg-zinc-50/70 dark:bg-zinc-950/40 text-foreground",
                                        "placeholder:text-muted-foreground/60 border-0 focus:outline-none",
                                        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
                                        "focus:ring-2 focus:ring-amber-500/30 transition-all"
                                    )}
                                />
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] text-muted-foreground/70">
                                        支持标准 LaTeX 与 Markdown
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/70">
                                        {content.length} 字符
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[110px] p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/40 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-48">
                                {content.trim() ? (
                                    <MathText text={content} />
                                ) : (
                                    <p className="text-muted-foreground/50 italic text-xs">
                                        （暂未输入内容，输入后在此预览排版与公式）
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 底部行动条 */}
                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="h-8 px-4 text-xs rounded-full font-medium text-muted-foreground hover:text-foreground"
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                disabled={!content.trim() || isSubmitting}
                                className={cn(
                                    "h-8 px-5 rounded-full text-xs font-semibold gap-1.5 transition-all duration-200 border-0",
                                    "bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white/90 dark:text-zinc-950 text-white",
                                    "shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)]",
                                    "hover:scale-[1.02] active:scale-[0.98]"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>发布中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        <span>发表学术批注</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
