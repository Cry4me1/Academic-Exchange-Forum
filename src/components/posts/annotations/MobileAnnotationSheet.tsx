"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { MarginNotesPanel } from "./MarginNotesPanel";
import { PostAnnotation } from "./types";
import { cn } from "@/lib/utils";

interface MobileAnnotationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    annotations: PostAnnotation[];
    activeAnnotationId: string | null;
    onSelectAnnotation: (id: string) => void;
    onScrollToAnchor: (annotation: PostAnnotation) => void;
    onReply: (annotationId: string, content: string) => Promise<void>;
    onToggleResolve: (annotationId: string) => Promise<void>;
    onDelete: (annotationId: string) => Promise<void>;
    currentUserId?: string;
    isPostAuthor?: boolean;
}

export function MobileAnnotationSheet({
    isOpen,
    onClose,
    annotations,
    activeAnnotationId,
    onSelectAnnotation,
    onScrollToAnchor,
    onReply,
    onToggleResolve,
    onDelete,
    currentUserId,
    isPostAuthor,
}: MobileAnnotationSheetProps) {
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
                    {/* 半透明环境微光遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* 底部液态玻璃抽屉面板 */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className={cn(
                            "relative z-10 w-full max-h-[82vh] flex flex-col",
                            "rounded-t-3xl border-0",
                            "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl",
                            "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                            "dark:shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                        )}
                    >
                        {/* 顶部手柄条与关闭按钮 */}
                        <div className="flex items-center justify-between px-5 pt-3.5 pb-2 shrink-0">
                            {/* 居中流体手柄 */}
                            <div className="flex-1 flex justify-center pl-7">
                                <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600/80" />
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 内容滚动区 */}
                        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-1">
                            <MarginNotesPanel
                                annotations={annotations}
                                activeAnnotationId={activeAnnotationId}
                                onSelectAnnotation={onSelectAnnotation}
                                onScrollToAnchor={(a) => {
                                    onScrollToAnchor(a);
                                    onClose();
                                }}
                                onReply={onReply}
                                onToggleResolve={onToggleResolve}
                                onDelete={onDelete}
                                currentUserId={currentUserId}
                                isPostAuthor={isPostAuthor}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
