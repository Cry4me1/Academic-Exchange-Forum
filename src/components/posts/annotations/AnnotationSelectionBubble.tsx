"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnnotationSelectionState } from "./types";

interface AnnotationSelectionBubbleProps {
    containerRef: React.RefObject<HTMLElement | null>;
    onAnnotate: (state: AnnotationSelectionState) => void;
    disabled?: boolean;
}

export function AnnotationSelectionBubble({
    containerRef,
    onAnnotate,
    disabled = false,
}: AnnotationSelectionBubbleProps) {
    const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
    const [currentSelection, setCurrentSelection] = useState<AnnotationSelectionState | null>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (disabled) {
            setBubblePos(null);
            setCurrentSelection(null);
            return;
        }

        const handleSelectionChange = () => {
            const container = containerRef.current;
            if (!container) return;

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || !selection.rangeCount) {
                setBubblePos(null);
                setCurrentSelection(null);
                return;
            }

            const range = selection.getRangeAt(0);

            // 提取干净选区文本（自动剥离 KaTeX MathML、隐藏编辑区与 Desmos portal 脏数据）
            let rawText = "";
            try {
                const fragment = range.cloneContents();
                fragment.querySelectorAll(
                    ".katex-mathml, .Tiptap-mathematics-editor, .math-desmos-portal-container, annotation"
                ).forEach((el) => el.remove());

                const text = fragment.textContent || "";
                rawText = text
                    .replace(/[\u{1D400}-\u{1D7FF}]/gu, "")
                    .replace(/[\r\n\t]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
            } catch {
                rawText = selection.toString().trim();
            }

            if (!rawText) {
                rawText = selection.toString().trim();
            }

            // 忽略过短（小于2个字符）或过长的无意义选择
            if (rawText.length < 2 || rawText.length > 1500) {
                setBubblePos(null);
                setCurrentSelection(null);
                return;
            }

            // 确保划选节点位于文章正文容器内部
            if (
                !container.contains(range.commonAncestorContainer) &&
                container !== range.commonAncestorContainer
            ) {
                setBubblePos(null);
                setCurrentSelection(null);
                return;
            }

            // 避免在交互按钮、输入框中触发划线
            const startElement = range.startContainer.parentElement;
            if (
                startElement?.closest("button") ||
                startElement?.closest("input") ||
                startElement?.closest("textarea") ||
                startElement?.closest(".math-desmos-portal-container")
            ) {
                setBubblePos(null);
                setCurrentSelection(null);
                return;
            }

            const rect = range.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) {
                setBubblePos(null);
                return;
            }

            // 嗅探前置与后置上下文（各取 36 个字符辅助模糊定位）
            let prefix = "";
            let suffix = "";
            try {
                const fullText = container.textContent || "";
                const textIndex = fullText.indexOf(rawText);
                if (textIndex !== -1) {
                    prefix = fullText.slice(Math.max(0, textIndex - 36), textIndex).trim();
                    suffix = fullText.slice(textIndex + rawText.length, textIndex + rawText.length + 36).trim();
                }
            } catch {
                // Ignore context extraction error
            }

            const selectionState: AnnotationSelectionState = {
                anchorText: rawText,
                anchorPrefix: prefix,
                anchorSuffix: suffix,
                rect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                },
            };

            setCurrentSelection(selectionState);

            // 计算气泡位置：居中悬浮于选区顶部上方
            setBubblePos({
                top: rect.top - 46,
                left: rect.left + rect.width / 2,
            });
        };

        const handleMouseUp = () => {
            // 微延迟确保选区在浏览器中稳定计算
            setTimeout(handleSelectionChange, 20);
        };

        const handleScroll = () => {
            // 滚动时如果已有气泡，实时隐藏或重新校验
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && containerRef.current) {
                try {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    setBubblePos({
                        top: rect.top - 46,
                        left: rect.left + rect.width / 2,
                    });
                } catch {
                    setBubblePos(null);
                }
            } else {
                setBubblePos(null);
            }
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        document.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
            document.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("scroll", handleScroll);
        };
    }, [containerRef, disabled]);

    const handleAnnotateClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (currentSelection) {
            onAnnotate(currentSelection);
            setBubblePos(null);
            // 清理浏览器划线高亮，恢复自然视口
            window.getSelection()?.removeAllRanges();
        }
    };

    return (
        <AnimatePresence>
            {bubblePos && currentSelection && (
                <motion.div
                    ref={bubbleRef}
                    initial={{ opacity: 0, scale: 0.88, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: "fixed",
                        top: `${bubblePos.top}px`,
                        left: `${bubblePos.left}px`,
                        transform: "translateX(-50%)",
                        zIndex: 9999,
                    }}
                    className="pointer-events-auto"
                >
                    <button
                        type="button"
                        onClick={handleAnnotateClick}
                        className={cn(
                            "flex items-center gap-1.5 h-8 px-3.5 rounded-full select-none cursor-pointer",
                            "bg-zinc-950/85 dark:bg-zinc-900/90 text-white font-medium text-xs",
                            "backdrop-blur-xl border-0",
                            "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.38),inset_0_1px_0.5px_rgba(255,255,255,0.45)]",
                            "hover:scale-105 active:scale-95 transition-all duration-150",
                            "focus:outline-none ring-0"
                        )}
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>添加批注</span>
                        <Sparkles className="w-3 h-3 text-amber-300/80 shrink-0 ml-0.5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
