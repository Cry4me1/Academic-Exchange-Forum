"use client";

import { useI18n } from "@/i18n/context";
import { Locale } from "@/i18n/types";
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
    const { locale, setLocale, isZh } = useI18n();

    // 药丸切换胶囊形态
    if (variant === "toggle") {
        return (
            <div
                className={cn(
                    "inline-flex items-center p-1 bg-muted/60 dark:bg-card/60 backdrop-blur-md rounded-full border border-border/50 text-xs font-semibold shadow-xs",
                    className
                )}
            >
                <button
                    type="button"
                    onClick={() => setLocale("zh")}
                    className={cn(
                        "px-3 py-1 rounded-full transition-all duration-200 cursor-pointer select-none",
                        isZh
                            ? "bg-background text-primary shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    中文
                </button>
                <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={cn(
                        "px-3 py-1 rounded-full transition-all duration-200 cursor-pointer select-none",
                        !isZh
                            ? "bg-background text-primary shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
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
                    "h-8 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all gap-1.5",
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
                        "h-9 px-3 rounded-full text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-all gap-2 border border-border/40 bg-background/50 backdrop-blur-xs",
                        className
                    )}
                >
                    <Languages className="h-4 w-4 text-primary shrink-0" />
                    {showLabel && (
                        <span className="font-semibold">
                            {isZh ? "简体中文" : "English"}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                    onClick={() => setLocale("zh")}
                    className={cn(
                        "flex items-center justify-between text-xs cursor-pointer",
                        isZh && "font-bold text-primary"
                    )}
                >
                    <span>简体中文</span>
                    {isZh && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLocale("en")}
                    className={cn(
                        "flex items-center justify-between text-xs cursor-pointer",
                        !isZh && "font-bold text-primary"
                    )}
                >
                    <span>English</span>
                    {!isZh && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
