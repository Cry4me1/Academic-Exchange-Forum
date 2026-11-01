"use client";

import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
    ChevronDown,
    Hash,
    MoreHorizontal,
    Trash2,
    Check,
} from "lucide-react";
import { useCallback, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    ACADEMIC_TYPE_CONFIG,
    AcademicType,
} from "./academic-block";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CopyMorphButton } from "@/components/ui/copy-morph-button";
import { MOTION_EASINGS } from "@/lib/motion-tokens";
import { toast } from "sonner";

export function AcademicBlockComponent({
    node,
    updateAttributes,
    editor,
    deleteNode,
}: NodeViewProps) {
    const prefersReducedMotion = useReducedMotion();
    const isEditable = editor.isEditable;
    const academicType = (node.attrs.academicType as AcademicType) || "theorem";
    const title = node.attrs.title || "";
    const number = node.attrs.number || "";
    const isFolded = Boolean(node.attrs.isFolded);
    const academicId =
        node.attrs.academicId ||
        `academic-${academicType}-${Math.random().toString(36).substring(2, 8)}`;

    const [isEditingHeader, setIsEditingHeader] = useState(false);

    const config =
        ACADEMIC_TYPE_CONFIG[academicType] || ACADEMIC_TYPE_CONFIG.theorem;

    // 切换折叠状态
    const toggleFold = useCallback(() => {
        updateAttributes({ isFolded: !isFolded });
    }, [isFolded, updateAttributes]);

    const refAnchorText = `@${academicType}:${number || title || "1"}`;

    const isProof = academicType === "proof";

    return (
        <NodeViewWrapper
            id={academicId}
            data-academic-id={academicId}
            data-academic-type={academicType}
            className={cn(
                "academic-block-wrapper my-5 rounded-2xl border-0 overflow-hidden relative group/academic",
                "bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl",
                "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                "dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.1)]",
                config.bgClass
            )}
        >
            {/* 顶部标题栏 */}
            <div
                className={cn(
                    "academic-header flex items-center justify-between px-4 py-2.5 select-none bg-white/45 dark:bg-white/[0.03] backdrop-blur-md transition-colors duration-150",
                    isProof && "cursor-pointer [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/40 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.06]"
                )}
                onClick={isProof ? toggleFold : undefined}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* 折叠切换图标 (旋转微交互取代生硬条件销毁重建) */}
                    {isProof && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFold();
                            }}
                            className="inline-flex h-6 w-6 items-center justify-center -ml-1 text-muted-foreground hover:text-foreground rounded-full active:scale-[0.94] transition-[transform,color,background-color] duration-150 cursor-pointer"
                            title={isFolded ? "展开证明" : "折叠证明"}
                        >
                            <ChevronDown
                                className={cn(
                                    "w-4 h-4 text-slate-500 transition-transform duration-200 ease-[var(--ease-out-snappy)]",
                                    isFolded && "-rotate-90"
                                )}
                            />
                        </button>
                    )}

                    {/* 类型水滴徽章 */}
                    <span
                        className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full border-0 text-xs font-medium tracking-wide shrink-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)]",
                            config.badgeBg
                        )}
                    >
                        {config.label}
                    </span>

                    {/* 编号与名称 */}
                    <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                        {number ? (
                            <span className={cn("font-semibold", config.badgeText)}>
                                {number}
                            </span>
                        ) : null}

                        {title ? (
                            <span className="text-foreground/90 font-medium tracking-tight">
                                ({title})
                            </span>
                        ) : null}

                        {!number && !title && (
                            <span className="text-muted-foreground/70 text-xs italic">
                                {config.enLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* 操作工具栏 */}
                <div
                    className="flex items-center gap-1 shrink-0 ml-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 复制交叉引用 ID（微模糊融合） */}
                    <div className="opacity-100 sm:opacity-0 sm:group-hover/academic:opacity-100 transition-opacity duration-150">
                        <CopyMorphButton
                            valueToCopy={refAnchorText}
                            onCopied={() =>
                                toast.success(`已复制交叉引用代码: ${refAnchorText}`)
                            }
                            surface="ghost"
                            auraTone="amber"
                            iconClassName="w-3.5 h-3.5"
                            title="复制引用代号"
                        />
                    </div>

                    {/* 编辑态专属配置菜单 */}
                    {isEditable && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-2xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.16),inset_0_1px_0.5px_rgba(255,255,255,0.85)]"
                            >
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                    切换学术环境
                                </DropdownMenuLabel>
                                {(
                                    Object.keys(
                                        ACADEMIC_TYPE_CONFIG
                                    ) as AcademicType[]
                                ).map((typeKey) => {
                                    const itemConfig = ACADEMIC_TYPE_CONFIG[typeKey];
                                    return (
                                        <DropdownMenuItem
                                            key={typeKey}
                                            onClick={() =>
                                                updateAttributes({
                                                    academicType: typeKey,
                                                })
                                            }
                                            className={cn(
                                                "text-xs flex items-center justify-between rounded-xl cursor-pointer",
                                                academicType === typeKey &&
                                                    "font-medium text-primary"
                                            )}
                                        >
                                            <span>
                                                {itemConfig.label} ({itemConfig.enLabel})
                                            </span>
                                            {academicType === typeKey && (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() =>
                                        setIsEditingHeader(!isEditingHeader)
                                    }
                                    className="text-xs rounded-xl cursor-pointer"
                                >
                                    <Hash className="w-3.5 h-3.5 mr-2" />
                                    {isEditingHeader
                                        ? "收起属性设置"
                                        : "设置编号与名称"}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => deleteNode()}
                                    className="text-xs text-destructive focus:text-destructive rounded-xl cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    删除学术块
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* 渐变消融内部微光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 编辑态：属性编辑折叠面板 */}
            <AnimatePresence initial={false}>
                {isEditable && isEditingHeader && (
                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: MOTION_EASINGS.snappy }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-2.5 bg-white/50 dark:bg-zinc-900/50 flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <label className="text-muted-foreground font-medium">
                                    编号:
                                </label>
                                <input
                                    type="text"
                                    value={number}
                                    placeholder="如: 1.1 或 3"
                                    onChange={(e) =>
                                        updateAttributes({ number: e.target.value })
                                    }
                                    className="h-7 w-24 px-3 rounded-full border-0 bg-zinc-100/90 dark:bg-zinc-800/90 text-foreground text-xs shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus:outline-hidden focus:ring-2 focus:ring-sky-500/30"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                                <label className="text-muted-foreground font-medium">
                                    名称:
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    placeholder="如: 费马大定理 或 均值不等式"
                                    onChange={(e) =>
                                        updateAttributes({ title: e.target.value })
                                    }
                                    className="h-7 flex-1 px-3 rounded-full border-0 bg-zinc-100/90 dark:bg-zinc-800/90 text-foreground text-xs shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus:outline-hidden focus:ring-2 focus:ring-sky-500/30"
                                />
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 内容区域 (带强劲曲线自适应折叠动效与 NodeViewContent) */}
            <AnimatePresence initial={false}>
                {!isFolded && (
                    <motion.div
                        initial={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, height: 0 }
                        }
                        animate={
                            prefersReducedMotion
                                ? { opacity: 1 }
                                : { opacity: 1, height: "auto" }
                        }
                        exit={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, height: 0 }
                        }
                        transition={
                            prefersReducedMotion
                                ? { duration: 0.1 }
                                : { duration: 0.22, ease: MOTION_EASINGS.snappy }
                        }
                        className="overflow-hidden"
                    >
                        <div className="p-4 relative">
                            {/* 富文本嵌套渲染槽位 */}
                            <NodeViewContent className="academic-block-inner prose dark:prose-invert max-w-none focus:outline-hidden text-foreground leading-relaxed" />

                            {/* 证明块结尾：经典学术 Q.E.D. 印章 */}
                            {isProof && (
                                <div className="flex items-center justify-end gap-1.5 mt-4 pt-2 text-xs font-mono text-muted-foreground/80 select-none">
                                    <span className="italic font-serif">
                                        Q.E.D.
                                    </span>
                                    <span
                                        className="inline-block w-2.5 h-2.5 bg-foreground/70 dark:bg-foreground/60 rounded-2xs"
                                        title="证明完毕 (Quod Erat Demonstrandum)"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 当被折叠时显示的提示条 */}
            {isFolded && (
                <div
                    onClick={toggleFold}
                    className="px-4 py-2.5 text-xs text-muted-foreground/80 italic cursor-pointer [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/35 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.04] transition-colors duration-150 flex items-center justify-between select-none"
                >
                    <span>证明推导过程已折叠（点击展开完整推导步骤）</span>
                    <span className="font-serif text-[11px]">Q.E.D. ∎</span>
                </div>
            )}
        </NodeViewWrapper>
    );
}

export default AcademicBlockComponent;
