"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Check, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface BannerPreset {
    id: string;
    name: string;
    class: string;
    preview: string;
}

export const bannerGradients: BannerPreset[] = [
    {
        id: "default",
        name: "极光微澜",
        class: "bg-gradient-to-tr from-indigo-500/20 via-sky-500/15 to-purple-500/25 dark:from-indigo-950/60 dark:via-sky-950/40 dark:to-purple-950/60",
        preview: "bg-gradient-to-tr from-indigo-400 via-sky-300 to-purple-400"
    },
    {
        id: "sunset",
        name: "暖阳暮色",
        class: "bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-rose-500/20 dark:from-amber-950/60 dark:via-orange-950/40 dark:to-rose-950/60",
        preview: "bg-gradient-to-tr from-amber-400 via-orange-300 to-rose-400"
    },
    {
        id: "ocean",
        name: "蔚蓝星海",
        class: "bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-teal-500/20 dark:from-cyan-950/60 dark:via-blue-950/40 dark:to-teal-950/60",
        preview: "bg-gradient-to-tr from-cyan-400 via-blue-300 to-teal-400"
    },
    {
        id: "forest",
        name: "翠林幽谷",
        class: "bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-green-500/20 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-green-950/60",
        preview: "bg-gradient-to-tr from-emerald-400 via-teal-300 to-green-400"
    },
    {
        id: "lavender",
        name: "梦幻紫罗兰",
        class: "bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/15 to-pink-500/20 dark:from-fuchsia-950/60 dark:via-purple-950/40 dark:to-pink-950/60",
        preview: "bg-gradient-to-tr from-fuchsia-400 via-purple-300 to-pink-400"
    },
    {
        id: "midnight",
        name: "暗夜星芒",
        class: "bg-gradient-to-tr from-zinc-800/80 via-slate-900/90 to-zinc-950 dark:from-zinc-900 dark:via-slate-950 dark:to-black",
        preview: "bg-gradient-to-tr from-zinc-700 via-slate-800 to-zinc-950"
    },
    {
        id: "minimal",
        name: "银灰极简",
        class: "bg-gradient-to-tr from-zinc-200/50 via-zinc-100/40 to-slate-200/60 dark:from-zinc-800/40 dark:via-zinc-900/40 dark:to-slate-900/50",
        preview: "bg-gradient-to-tr from-zinc-300 via-zinc-200 to-slate-300"
    }
];

interface BannerSelectorProps {
    currentStyle: string;
    onStyleChange: (style: string) => void;
    className?: string;
}

export function BannerSelector({ currentStyle, onStyleChange, className }: BannerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSelect = async (gradientId: string) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未登录");

            const { error } = await supabase
                .from("profiles")
                .update({ banner_style: gradientId })
                .eq("id", user.id);

            if (error) throw error;

            onStyleChange(gradientId);
            toast.success("封面背景已更新");
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to update banner:", error);
            toast.error("更新封面失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 px-3 text-xs font-medium backdrop-blur-xl bg-white/75 hover:bg-white/90 dark:bg-zinc-950/70 dark:hover:bg-zinc-950/85 text-zinc-800 dark:text-zinc-200 border-0 rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_4px_16px_-2px_rgba(0,0,0,0.4)] transition-all flex items-center gap-1.5 cursor-pointer",
                        className
                    )}
                >
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>更换封面</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3.5 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_12px_40px_-6px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_12px_40px_-6px_rgba(0,0,0,0.5)] rounded-2xl" align="end">
                <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1">
                        <h4 className="font-medium text-xs text-zinc-900 dark:text-zinc-100">选择封面主题</h4>
                        <span className="text-[10px] text-zinc-400">自适应明暗模式</span>
                    </div>
                    {/* 渐变消融微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {bannerGradients.map((gradient) => {
                            const isSelected = currentStyle === gradient.id;
                            return (
                                <button
                                    key={gradient.id}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleSelect(gradient.id)}
                                    className={cn(
                                        "group relative h-14 rounded-xl overflow-hidden border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 text-left",
                                        gradient.preview,
                                        isSelected && "ring-2 ring-zinc-900/90 dark:ring-white/90 shadow-[0_0_12px_rgba(0,0,0,0.15)]"
                                    )}
                                >
                                    {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-zinc-950/80 dark:bg-white/95 text-white dark:text-zinc-950 flex items-center justify-center shadow-xs backdrop-blur-sm">
                                            <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                                        </div>
                                    )}
                                    <span className="absolute bottom-0 inset-x-0 py-0.5 px-1.5 text-[10px] bg-black/40 backdrop-blur-md text-white font-medium truncate">
                                        {gradient.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
