"use client";

import { useMessageSound } from "@/hooks/useMessageSound";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";

interface MessageSoundToggleProps {
    className?: string;
    variant?: "icon" | "pill";
}

export function MessageSoundToggle({ className, variant = "icon" }: MessageSoundToggleProps) {
    const { soundEnabled, isLoaded, toggleSound } = useMessageSound();

    if (!isLoaded) {
        return (
            <div className={cn("h-8 w-8 rounded-full bg-zinc-100/50 dark:bg-zinc-800/40 animate-pulse border-0", className)} />
        );
    }

    if (variant === "pill") {
        return (
            <button
                type="button"
                onClick={toggleSound}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-0 transition-all duration-200 active:scale-95 select-none",
                    soundEnabled
                        ? "bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-2px_rgba(0,0,0,0.3)] backdrop-blur-md"
                        : "bg-zinc-100/70 dark:bg-zinc-900/60 text-zinc-400 dark:text-zinc-500 shadow-[inset_0_1px_0.5px_rgba(0,0,0,0.04)] backdrop-blur-md",
                    className
                )}
            >
                {soundEnabled ? (
                    <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>提示音已开启</span>
                    </>
                ) : (
                    <>
                        <VolumeX className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span>提示音已静音</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={toggleSound}
                        aria-label={soundEnabled ? "静音私信提示音" : "开启私信提示音"}
                        className={cn(
                            "relative h-8 w-8 rounded-full flex items-center justify-center border-0 transition-all duration-200 active:scale-95 select-none",
                            soundEnabled
                                ? "bg-white/80 dark:bg-zinc-850/80 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-2px_rgba(0,0,0,0.3)] backdrop-blur-md"
                                : "bg-zinc-100/70 dark:bg-zinc-900/70 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-850 shadow-[inset_0_1px_0.5px_rgba(0,0,0,0.04)] backdrop-blur-md",
                            className
                        )}
                    >
                        {soundEnabled ? (
                            <Volume2 className="h-4 w-4 text-zinc-700 dark:text-zinc-200 transition-colors" />
                        ) : (
                            <VolumeX className="h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-colors" />
                        )}
                        {soundEnabled && (
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs border-0 bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 backdrop-blur-md rounded-full px-3 py-1 shadow-lg">
                    {soundEnabled ? "私信提示音：开启（点击静音）" : "私信提示音：已静音（点击开启）"}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
