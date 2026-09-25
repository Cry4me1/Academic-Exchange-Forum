"use client";

import { useState } from "react";
import { useEditor } from "novel";
import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Italic,
    Redo2,
    Sigma,
    Sparkles,
    TextQuote,
    Type,
    Undo2,
    BookOpen,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMathBubbleBar } from "./MobileMathBubbleBar";
import { toast } from "sonner";

export function MobileEditorAccessoryBar() {
    const { editor } = useEditor();
    const [isMathBarOpen, setIsMathBarOpen] = useState(false);

    if (!editor) return null;

    const isH1 = editor.isActive("heading", { level: 1 });
    const isH2 = editor.isActive("heading", { level: 2 });
    const isBold = editor.isActive("bold");
    const isItalic = editor.isActive("italic");
    const isCode = editor.isActive("code");
    const isBlockquote = editor.isActive("blockquote");

    const insertAcademicBlock = (type: "theorem" | "proof", placeholder: string) => {
        editor.chain().focus().insertContent({
            type: "academicBlock",
            attrs: {
                type,
                number: type === "theorem" ? "1.1" : "",
            },
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: placeholder }],
                },
            ],
        }).run();
        toast.success(`已插入${type === "theorem" ? "定理" : "证明"}环境`, { duration: 1500 });
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 select-none">
            {/* LaTeX 数学符号展开条 */}
            <MobileMathBubbleBar
                isOpen={isMathBarOpen}
                onClose={() => setIsMathBarOpen(false)}
            />

            {/* 键盘上方主吸附工具条 */}
            <div className="w-full bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_-8px_24px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_-8px_28px_rgba(0,0,0,0.6)] pb-safe transition-all">
                <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto no-scrollbar touch-pan-x">
                    {/* 撤销 / 重做 */}
                    <div className="flex items-center gap-0.5 shrink-0 pr-1 border-r border-zinc-200/80 dark:border-zinc-800/80">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 border-0 active:scale-90 transition-transform cursor-pointer"
                            aria-label="撤销"
                        >
                            <Undo2 size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 border-0 active:scale-90 transition-transform cursor-pointer"
                            aria-label="重做"
                        >
                            <Redo2 size={15} />
                        </button>
                    </div>

                    {/* AI 续写胶囊 */}
                    <button
                        type="button"
                        onClick={(e) => {
                            editor.chain().focus().run();
                            const rect = e.currentTarget.getBoundingClientRect();
                            window.dispatchEvent(
                                new CustomEvent("trigger-ai-continue", {
                                    detail: {
                                        position: {
                                            top: rect.top - 80,
                                            left: 16,
                                        },
                                    },
                                })
                            );
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0 active:scale-95 transition-transform shrink-0 shadow-xs cursor-pointer"
                    >
                        <Sparkles size={13} className="text-amber-500" />
                        <span>AI续写</span>
                    </button>

                    {/* 标题层级 H1 / H2 */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={cn(
                                "px-2 py-1 rounded-full text-xs font-semibold border-0 active:scale-90 transition-transform cursor-pointer",
                                isH1
                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            H1
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={cn(
                                "px-2 py-1 rounded-full text-xs font-semibold border-0 active:scale-90 transition-transform cursor-pointer",
                                isH2
                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            H2
                        </button>
                    </div>

                    {/* 粗体 / 斜体 / 行内代码 */}
                    <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-zinc-200/80 dark:border-zinc-800/80">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={cn(
                                "p-1.5 rounded-full border-0 active:scale-90 transition-transform cursor-pointer",
                                isBold
                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            aria-label="加粗"
                        >
                            <Bold size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={cn(
                                "p-1.5 rounded-full border-0 active:scale-90 transition-transform cursor-pointer",
                                isItalic
                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            aria-label="斜体"
                        >
                            <Italic size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            className={cn(
                                "p-1.5 rounded-full border-0 active:scale-90 transition-transform cursor-pointer",
                                isCode
                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            )}
                            aria-label="代码"
                        >
                            <Code size={14} />
                        </button>
                    </div>

                    {/* 数学公式气泡开关 */}
                    <button
                        type="button"
                        onClick={() => setIsMathBarOpen(!isMathBarOpen)}
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-0 active:scale-95 transition-all shrink-0 cursor-pointer",
                            isMathBarOpen
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                        )}
                    >
                        <Sigma size={13} />
                        <span>LaTeX公式</span>
                    </button>

                    {/* 学术定理 / 证明 */}
                    <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-zinc-200/80 dark:border-zinc-800/80">
                        <button
                            type="button"
                            onClick={() => insertAcademicBlock("theorem", "在此输入定理内容...")}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border-0 shrink-0 cursor-pointer active:scale-90"
                        >
                            <BookOpen size={12} />
                            <span>定理</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => insertAcademicBlock("proof", "在此输入证明推导步骤...")}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/50 dark:bg-zinc-800/50 border-0 shrink-0 cursor-pointer active:scale-90"
                        >
                            <ShieldCheck size={12} />
                            <span>证明</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
