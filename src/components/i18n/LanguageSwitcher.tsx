"use client";

import { useI18n } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
    variant?: "dropdown" | "toggle" | "compact";
    className?: string;
    showLabel?: boolean;
}

export function LanguageSwitcher({
    variant = "dropdown",
    className,
    showLabel = true,
}: LanguageSwitcherProps) {
    const { setLocale, isZh } = useI18n();

    // 药丸切换胶囊形态（Liquid Glass 无边框 + 固定 font-medium 零布局跳动）
    if (variant === "toggle") {
        return (
            <div
                className={cn(
                    "inline-flex items-center rounded-full border-0 p-1 text-xs font-medium bg-zinc-900/[0.04] dark:bg-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]",
                    className
                )}
            >
                <button
                    type="button"
                    onClick={() => setLocale("zh")}
                    className={cn(
                        "rounded-full px-2.5 py-1 font-medium transition-all duration-200 cursor-pointer select-none",
                        isZh
                            ? "bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                >
                    中文
                </button>
                <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={cn(
                        "rounded-full px-2.5 py-1 font-medium transition-all duration-200 cursor-pointer select-none",
                        !isZh
                            ? "bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                >
                    EN
                </button>
            </div>
        );
    }

    // 紧凑型切换形态
    if (variant === "compact") {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocale(isZh ? "en" : "zh")}
                className={cn(
                    "h-8 px-2.5 rounded-full border-0 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all gap-1.5",
                    className
                )}
                title={isZh ? "Switch to English" : "切换为简体中文"}
            >
                <Globe className="h-3.5 w-3.5" />
                <span>{isZh ? "EN" : "中"}</span>
            </Button>
        );
    }

    // 默认下拉菜单形态
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-9 px-3 rounded-full border-0 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-white/80 dark:hover:bg-zinc-800/70 transition-all gap-2 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)]",
                        className
                    )}
                >
                    <Languages className="h-4 w-4 text-primary shrink-0" />
                    {showLabel && (
                        <span className="font-medium">
                            {isZh ? "简体中文" : "English"}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-2xl border-0">
                <DropdownMenuItem
                    onClick={() => setLocale("zh")}
                    className={cn(
                        "flex items-center justify-between rounded-full text-xs font-medium cursor-pointer",
                        isZh && "text-primary"
                    )}
                >
                    <span>简体中文</span>
                    {isZh && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLocale("en")}
                    className={cn(
                        "flex items-center justify-between rounded-full text-xs font-medium cursor-pointer",
                        !isZh && "text-primary"
                    )}
                >
                    <span>English</span>
                    {!isZh && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
