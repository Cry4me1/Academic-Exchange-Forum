"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Tag, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const DEFAULT_ACADEMIC_TAGS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "Economics",
    "Philosophy",
    "AI",
    "Chemistry",
    "Engineering",
];

export interface LiquidTagSelectorProps {
    availableTags?: string[];
    selectedTags: string[];
    onTagToggle: (tag: string) => void;
    maxTags?: number;
    className?: string;
    disabled?: boolean;
}

/**
 * 彻底无边框水滴液态玻璃芯片（带选中柔和天青氛围微光晕）
 *
 * 核心设计：
 * 1. 【无硬边框】：彻底去除显式 border，依靠半透明毛玻璃底色与表面张力光影建立物理形体；
 * 2. 【光随鼠动纯实时反射】：光标移动时，纯白高光在水滴凸透镜上自由游走；
 * 3. 【选中态专属灵动氛围微光晕 (Ambient Aura Glow)】：
 *    - 未选中：静谧冷感磨砂水晶；
 *    - 选中：微浮凸温润水晶白，四周漫射出一圈清澈优雅的天青/微蓝氛围光晕，形成极佳视觉区分度；
 * 4. 【零布局跳动】：尺寸浮点级锁定，切换前后 0 像素物理宽度偏差。
 */
function LiquidGlassPill({
    tag,
    isSelected,
    isDisabledForNew,
    disabled,
    onClick,
    shaking,
}: {
    tag: string;
    isSelected: boolean;
    isDisabledForNew: boolean;
    disabled: boolean;
    onClick: () => void;
    shaking: boolean;
}) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // 原生注入鼠标坐标，120fps 无丢帧响应
    const updateMouseCoords = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const el = buttonRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--mouse-x", `${x}px`);
        el.style.setProperty("--mouse-y", `${y}px`);
    }, []);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        setIsHovered(true);
        updateMouseCoords(e);
    }, [updateMouseCoords]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        updateMouseCoords(e);
    }, [updateMouseCoords]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        const el = buttonRef.current;
        if (el) {
            el.style.setProperty("--mouse-x", "-150px");
            el.style.setProperty("--mouse-y", "-150px");
        }
    }, []);

    return (
        <motion.button
            ref={buttonRef}
            type="button"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.96 }}
            animate={{
                // 选中态轻微悬浮，纯 GPU 合成层变换
                y: isSelected ? -2.5 : 0,
                x: shaking ? [0, -3, 3, -2, 2, 0] : 0,
            }}
            transition={{
                type: "spring",
                stiffness: 420,
                damping: 26,
                mass: 0.8,
            }}
            className={cn(
                // 彻底无硬边框（无 border 类）：依靠圆润水滴形态、通透毛玻璃与极微弱表面反光建立边界
                "group relative inline-flex items-center gap-1.5 px-3.5 h-[32px] rounded-full text-xs font-medium cursor-pointer overflow-hidden outline-none select-none shrink-0 transition-colors duration-200",
                "focus-visible:ring-2 focus-visible:ring-sky-500/30",
                isSelected
                    ? [
                          // 选中态：温润浮凸水滴白 + 弥散天青微光阴影
                          "bg-white/95 dark:bg-white/[0.22]",
                          "text-zinc-950 dark:text-white",
                          "backdrop-blur-xl",
                          // 立体景深与环境光晕融合阴影
                          "shadow-[0_4px_16px_-2px_rgba(56,189,248,0.25),0_1px_3px_rgba(0,0,0,0.06),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)]",
                          "dark:shadow-[0_6px_24px_rgba(56,189,248,0.28),inset_0_1.5px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(56,189,248,0.15)]",
                          "z-10",
                      ]
                    : [
                          // 未选中态：彻底无硬边框的冷感磨砂水晶凝胶
                          "bg-zinc-200/50 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
                          "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100",
                          "backdrop-blur-md",
                          // 纯靠水滴表面张力曲面漫光体现形体，无生硬描边
                          "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),inset_0_-1px_0.5px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.03)]",
                          "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.25)]",
                          isDisabledForNew && "opacity-40 hover:opacity-60 cursor-pointer",
                      ]
            )}
        >
            {/* 1. 【无边界光标纯实时反射】：纯白水银流光，柔和羽化漫射，随鼠标精准移动 */}
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 transition-opacity duration-150",
                    isHovered ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background: `radial-gradient(48px circle at var(--mouse-x, -100px) var(--mouse-y, -100px), rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.1) 45%, transparent 75%)`,
                }}
            />

            {/* 2. 【选中态专属：底层微微的灵动氛围光晕 (Soft Ambient Aura Glow)】
                   外扩漫射的天青色微光晕，一眼清晰区分选中项 */}
            <AnimatePresence>
                {isSelected && (
                    <>
                        {/* 扩散漫射柔光层 */}
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="pointer-events-none absolute -inset-1.5 -z-10 rounded-full blur-md bg-gradient-to-r from-sky-400/30 via-indigo-400/20 to-teal-400/25 dark:from-sky-400/40 dark:via-blue-500/30 dark:to-teal-300/35"
                            aria-hidden="true"
                        />
                        {/* 贴身微亮高光圈 */}
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pointer-events-none absolute -inset-0.5 -z-10 rounded-full blur-xs bg-sky-400/20 dark:bg-sky-400/30"
                            aria-hidden="true"
                        />
                    </>
                )}
            </AnimatePresence>

            {/* 3. 状态图标槽位 (绝对锁定 w-3.5 h-3.5，零位移) */}
            <span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0 z-10 pointer-events-none">
                {isSelected ? (
                    isHovered ? (
                        <motion.span
                            key="cancel"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.12 }}
                            className="text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400"
                        >
                            <X className="w-3 h-3 stroke-[2.5]" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="check"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.12 }}
                            className="text-sky-600 dark:text-sky-400"
                        >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                        </motion.span>
                    )
                ) : (
                    <Plus
                        className={cn(
                            "w-3 h-3 transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110",
                            isDisabledForNew
                                ? "text-zinc-400/50 dark:text-zinc-600"
                                : "text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-200"
                        )}
                        strokeWidth={2}
                    />
                )}
            </span>

            {/* 4. 标签文字：恒定 font-medium */}
            <span className="relative z-10 select-none tracking-tight whitespace-nowrap pointer-events-none">
                {tag}
            </span>
        </motion.button>
    );
}

/**
 * 苹果液态玻璃（Apple Liquid Glass）标签选择器
 */
export function LiquidTagSelector({
    availableTags = DEFAULT_ACADEMIC_TAGS,
    selectedTags,
    onTagToggle,
    maxTags = 3,
    className,
    disabled = false,
}: LiquidTagSelectorProps) {
    const [shakingTag, setShakingTag] = useState<string | null>(null);

    const handleTagClick = (tag: string) => {
        if (disabled) return;

        const isSelected = selectedTags.includes(tag);

        if (!isSelected && selectedTags.length >= maxTags) {
            setShakingTag(tag);
            setTimeout(() => setShakingTag(null), 400);
            toast.warning(`最多只能选择 ${maxTags} 个学科标签`);
            return;
        }

        onTagToggle(tag);
    };

    const isFull = selectedTags.length >= maxTags;

    return (
        <div className={cn("space-y-3 select-none", className)}>
            {/* 顶栏信息：标签标题 + 动态计数 */}
            <div className="flex items-center justify-between h-6">
                <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                        <Tag className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        标签 <span className="text-destructive">*</span>
                    </label>
                </div>

                <div className="flex items-center gap-1.5 text-xs h-6">
                    {isFull ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            已选 {selectedTags.length}/{maxTags} (已满)
                        </span>
                    ) : (
                        <span className="text-[11px] text-muted-foreground font-mono">
                            已选 <span className="font-semibold text-foreground">{selectedTags.length}</span>/{maxTags}
                        </span>
                    )}
                </div>
            </div>

            {/* 辅助说明提示语 */}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                请从下方点击选择 1~{maxTags} 个学科分类（点击直接切换选中状态）
            </p>

            {/* 彻底无边框水滴液态玻璃芯片交互池 */}
            <div className="flex flex-wrap gap-2 pt-1 pb-1 items-center">
                {availableTags.map((tag) => (
                    <LiquidGlassPill
                        key={tag}
                        tag={tag}
                        isSelected={selectedTags.includes(tag)}
                        isDisabledForNew={isFull && !selectedTags.includes(tag)}
                        disabled={disabled}
                        onClick={() => handleTagClick(tag)}
                        shaking={shakingTag === tag}
                    />
                ))}
            </div>
        </div>
    );
}
