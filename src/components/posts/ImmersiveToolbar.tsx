"use client";

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { ArrowLeft, Keyboard, Minimize2 } from "lucide-react";
import Link from "next/link";

interface ImmersiveToolbarProps {
    /** 阅读进度 0-100 */
    progress: number;
    /** 退出沉浸模式 */
    onExit: () => void;
}

export function ImmersiveToolbar({ progress, onExit }: ImmersiveToolbarProps) {
    const safeProgress = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50 pointer-events-auto"
            role="toolbar"
            aria-label="沉浸阅读工具栏"
        >
            {/* 顶端微细阅读进度轨 */}
            <div className="h-[2px] bg-zinc-200/40 dark:bg-zinc-800/40" role="progressbar" aria-valuenow={Math.round(safeProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="阅读进度">
                <div
                    className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full transition-all duration-150 ease-out will-change-[width]"
                    style={{ width: `${safeProgress}%` }}
                />
            </div>

            {/* Apple Liquid Glass 无边框液态流光毛玻璃浮动工具条 */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white/75 dark:bg-zinc-900/65 backdrop-blur-2xl border-0 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                <Link href="/dashboard">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground rounded-full px-3 h-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs font-medium">返回仪表盘</span>
                    </Button>
                </Link>

                {/* 中央阅读进度药丸 */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/70 dark:bg-zinc-800/60 shadow-2xs backdrop-blur-sm">
                    <span className="text-[11px] text-muted-foreground font-medium">专注阅读</span>
                    <div className="w-[1px] h-2.5 bg-gradient-to-b from-transparent via-zinc-300 dark:via-zinc-700 to-transparent mx-0.5" />
                    <span className="text-xs text-foreground tabular-nums font-semibold">
                        {Math.round(safeProgress)}%
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* 快捷键提示 */}
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                            >
                                <Keyboard className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs p-3 rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl shadow-xl">
                            <div className="space-y-1.5 text-foreground">
                                <p className="flex items-center gap-2">
                                    <kbd className="inline-block px-1.5 py-0.5 bg-muted rounded-full text-[10px] font-mono font-semibold">Esc</kbd>
                                    <span className="text-xs">退出专注模式</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <kbd className="inline-block px-1.5 py-0.5 bg-muted rounded-full text-[10px] font-mono font-semibold">Ctrl+Shift+F</kbd>
                                    <span className="text-xs">切换专注模式</span>
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>

                    {/* 退出按钮：水滴胶囊样式 */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onExit}
                        className="gap-1.5 text-muted-foreground hover:text-foreground rounded-full px-3 h-8 text-xs font-medium hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                    >
                        <Minimize2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">退出专注</span>
                    </Button>
                </div>
            </div>

            {/* 渐变消融下沿微光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
        </motion.div>
    );
}

export default ImmersiveToolbar;
