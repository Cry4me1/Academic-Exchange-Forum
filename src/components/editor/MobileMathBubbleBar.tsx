"use client";

import { useEditor } from "novel";
import { toast } from "sonner";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface MobileMathBubbleBarProps {
    isOpen: boolean;
    onClose: () => void;
}

// 移动端学术最常用 LaTeX 快捷符号与模板
const MATH_TEMPLATES = [
    { label: "x²", code: "$x^2$", desc: "上标" },
    { label: "x₁", code: "$x_1$", desc: "下标" },
    { label: "a/b", code: "$\\frac{a}{b}$", desc: "分式" },
    { label: "√x", code: "$\\sqrt{x}$", desc: "根号" },
    { label: "∑", code: "$\\sum_{i=1}^{n}$", desc: "求和" },
    { label: "∫", code: "$\\int_{a}^{b} f(x) dx$", desc: "定积分" },
    { label: "lim", code: "$\\lim_{x \\to \\infty}$", desc: "极限" },
    { label: "α", code: "$\\alpha$", desc: "Alpha" },
    { label: "β", code: "$\\beta$", desc: "Beta" },
    { label: "θ", code: "$\\theta$", desc: "Theta" },
    { label: "λ", code: "$\\lambda$", desc: "Lambda" },
    { label: "π", code: "$\\pi$", desc: "Pi" },
    { label: "≤", code: "$\\le$", desc: "小于等于" },
    { label: "≥", code: "$\\ge$", desc: "大于等于" },
    { label: "≠", code: "$\\neq$", desc: "不等于" },
    { label: "∈", code: "$\\in$", desc: "属于" },
    { label: "→", code: "$\\to$", desc: "推导指向" },
    { label: "∞", code: "$\\infty$", desc: "无穷大" },
];

export function MobileMathBubbleBar({ isOpen, onClose }: MobileMathBubbleBarProps) {
    const { editor } = useEditor();

    if (!isOpen || !editor) return null;

    const handleInsert = (code: string) => {
        editor.chain().focus().insertContent(code).run();
        toast.success(`已插入公式模板`, { duration: 1500 });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_-4px_16px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_-4px_20px_rgba(0,0,0,0.5)] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x select-none"
            >
                <div className="flex items-center gap-1 shrink-0 pr-1 border-r border-zinc-200/80 dark:border-zinc-800/80">
                    <span className="text-[10px] font-semibold text-zinc-500 font-mono">LaTeX</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 border-0 cursor-pointer"
                    >
                        <X size={12} />
                    </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {MATH_TEMPLATES.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => handleInsert(item.code)}
                            className="px-2 py-1 rounded-lg text-xs font-mono font-medium bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-0 active:scale-90 transition-transform cursor-pointer shrink-0 shadow-xs"
                            title={item.desc}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
