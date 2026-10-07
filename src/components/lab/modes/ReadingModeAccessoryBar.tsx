"use client";

import {
    FileCheck2,
    Maximize2,
    Minimize2,
    Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ReadingModeAccessoryBarProps {
    isFullScreenReader: boolean;
    onToggleFullScreenReader: () => void;
    fontSizeLevel: "normal" | "large" | "xlarge";
    onChangeFontSize: (level: "normal" | "large" | "xlarge") => void;
    onInjectTemplate: (templateType: "critique" | "summary") => void;
    activeScholarCount: number;
}

export function ReadingModeAccessoryBar({
    isFullScreenReader,
    onToggleFullScreenReader,
    fontSizeLevel,
    onChangeFontSize,
    onInjectTemplate,
    activeScholarCount,
}: ReadingModeAccessoryBarProps) {
    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md border-0 overflow-x-auto no-scrollbar gap-3 select-none">
                {/* 左侧：视线同步与同读者感知 */}
                <div className="flex items-center gap-2 shrink-0">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 text-foreground text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] cursor-default whitespace-nowrap">
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[11px] font-medium tracking-tight">视口同步</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            当前已开启学者多端视口滚动同频广播
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100/50 dark:bg-zinc-800/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)] cursor-default whitespace-nowrap">
                                <Users className="h-3 w-3 shrink-0 text-zinc-400" />
                                <span className="text-[11px]">{activeScholarCount} 位学者在读</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            研讨室共读视角 · 正在同频研读此文献
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* 右侧：排版与辅助操作胶囊群 */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* 字号学术适读调节 */}
                    <div className="flex items-center p-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] shrink-0">
                        {(["normal", "large", "xlarge"] as const).map((level) => {
                            const label = level === "normal" ? "标准" : level === "large" ? "大字" : "超大";
                            const isActive = fontSizeLevel === level;
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => onChangeFontSize(level)}
                                    className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border-0 cursor-pointer whitespace-nowrap",
                                        isActive
                                            ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm shadow-black/5"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* 注入论文评议研讨模板 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => onInjectTemplate("critique")}
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-0 text-xs font-medium text-foreground bg-zinc-100/90 hover:bg-zinc-200/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] whitespace-nowrap active:scale-95"
                            >
                                <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                                <span>评议模板</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            在右侧协同笔记中注入研读评议提纲
                        </TooltipContent>
                    </Tooltip>

                    {/* 纯享全屏阅读切换 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={onToggleFullScreenReader}
                                className={cn(
                                    "shrink-0 rounded-full border-0 inline-flex items-center justify-center transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] active:scale-95",
                                    isFullScreenReader
                                        ? "h-7 px-2.5 gap-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium"
                                        : "h-7 w-7 text-muted-foreground hover:text-foreground bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
                                )}
                            >
                                {isFullScreenReader ? (
                                    <>
                                        <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                                        <span className="text-[11px] font-medium hidden sm:inline">退出全屏</span>
                                    </>
                                ) : (
                                    <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                                )}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            {isFullScreenReader ? "退出沉浸全屏阅读 (ESC)" : "沉浸全屏阅读文献"}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
            {/* 底端消融内部光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-zinc-800/60 to-transparent shrink-0" />
        </TooltipProvider>
    );
}
