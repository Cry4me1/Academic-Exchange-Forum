"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, Hash, List, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeadingItem } from "./TableOfContents";
import type { PostAcademicMeta } from "@/lib/academic-meta";

interface MobileTocSheetProps {
    isOpen: boolean;
    onClose: () => void;
    headings: HeadingItem[];
    academicMeta?: PostAcademicMeta | null;
}

export function MobileTocSheet({
    isOpen,
    onClose,
    headings,
    academicMeta,
}: MobileTocSheetProps) {
    const [activeTab, setActiveTab] = useState<"headings" | "academic">("headings");

    // 打开时锁定背景滚动
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const scrollToId = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            // 考虑顶部 sticky 栏的高度（约 72px）
            const yOffset = -76;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
        onClose();
    };

    const hasAcademicElements =
        academicMeta && academicMeta.totalAcademicCount > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
                    {/* 半透明环境光晕遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-zinc-950/45 dark:bg-black/65 backdrop-blur-xs"
                    />

                    {/* Apple Liquid Glass 底部向上升起大曲率面板 */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className={cn(
                            "relative z-10 w-full max-h-[75vh] flex flex-col rounded-t-[28px] border-0",
                            "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl",
                            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_-12px_40px_-8px_rgba(0,0,0,0.16)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_-12px_40px_-8px_rgba(0,0,0,0.6)]",
                            "pb-safe select-none"
                        )}
                    >
                        {/* 顶部居中下拉手柄 Handle */}
                        <div className="pt-3 pb-1 flex justify-center shrink-0">
                            <div className="w-10 h-1 rounded-full bg-zinc-300/80 dark:bg-zinc-700/80" />
                        </div>

                        {/* 抽屉头部 */}
                        <div className="flex items-center justify-between px-5 py-2.5 shrink-0">
                            <div className="flex items-center gap-2">
                                <List className="h-4.5 w-4.5 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    学术大纲与索引
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-0"
                            >
                                <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                        </div>

                        {/* 如果存在学术元素，提供微胶囊分类 Tab */}
                        {hasAcademicElements && (
                            <div className="flex gap-2 px-5 py-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("headings")}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border-0 transition-all cursor-pointer",
                                        activeTab === "headings"
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                                            : "bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    章节目录 ({headings.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("academic")}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border-0 transition-all cursor-pointer flex items-center gap-1",
                                        activeTab === "academic"
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                                            : "bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400"
                                    )}
                                >
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    <span>学术组件 ({academicMeta?.totalAcademicCount})</span>
                                </button>
                            </div>
                        )}

                        {/* 渐变消融微光缝 */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0 my-1" />

                        {/* 目录内容滚动区 */}
                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-none">
                            {activeTab === "headings" ? (
                                headings.length > 0 ? (
                                    headings.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => scrollToId(item.id)}
                                            className={cn(
                                                "w-full text-left flex items-center gap-2 py-2 px-2.5 rounded-xl border-0 text-xs font-medium transition-colors select-none active:bg-zinc-100 dark:active:bg-zinc-800/60",
                                                item.level === 1 && "text-zinc-900 dark:text-zinc-100 font-semibold",
                                                item.level === 2 && "pl-5 text-zinc-700 dark:text-zinc-300",
                                                item.level === 3 && "pl-8 text-zinc-500 dark:text-zinc-400 text-[11px]"
                                            )}
                                        >
                                            <Hash className="h-3 w-3 text-zinc-400 shrink-0" strokeWidth={1.5} />
                                            <span className="truncate flex-1">{item.text}</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400/60 shrink-0" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-xs text-zinc-400">
                                        该文章尚未设置标题大纲
                                    </div>
                                )
                            ) : (
                                <div className="space-y-2 py-1">
                                    {[
                                        ...(academicMeta?.theorems || []),
                                        ...(academicMeta?.definitions || []),
                                        ...(academicMeta?.proofs || []),
                                        ...(academicMeta?.others || []),
                                    ].map((el) => (
                                        <button
                                            key={el.id}
                                            type="button"
                                            onClick={() => scrollToId(el.id)}
                                            className="w-full text-left flex items-center gap-2.5 p-2 rounded-xl border-0 bg-zinc-50/60 dark:bg-zinc-800/40 text-xs text-zinc-800 dark:text-zinc-200 active:scale-[0.99] transition-all"
                                        >
                                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                            <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                                                {el.type}:
                                            </span>
                                            <span className="truncate flex-1 text-zinc-600 dark:text-zinc-400">
                                                {el.title || "学术片段"}
                                            </span>
                                            <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
