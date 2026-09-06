"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { VipBadge } from "@/components/payments/VipBadge";
import { cn } from "@/lib/utils";
import { Sparkles, Users, UserCheck, Bot, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface MentionItem {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    special_title?: string;
    academic_title?: string;
    bio?: string;
    vip_level?: number;
    is_verified?: boolean;
    is_ai?: boolean;
    relationship?: "ai" | "friend" | "recent" | "user";
}

interface MentionListProps {
    items: MentionItem[];
    command: (item: MentionItem) => void;
}

export const MentionList = forwardRef<any, MentionListProps>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex((prev) =>
                    props.items.length ? (prev + props.items.length - 1) % props.items.length : 0
                );
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((prev) =>
                    props.items.length ? (prev + 1) % props.items.length : 0
                );
                return true;
            }
            if (event.key === "Enter" || event.key === "Tab") {
                if (props.items.length > 0) {
                    selectItem(selectedIndex);
                    return true;
                }
            }
            return false;
        },
    }));

    if (!props.items || props.items.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="z-50 w-64 overflow-hidden rounded-xl border border-border/70 bg-card/95 p-3 text-center shadow-xl backdrop-blur-xl"
            >
                <p className="text-xs text-muted-foreground">未找到匹配的学者或助手</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="z-50 flex w-72 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10"
        >
            {/* Header / 快捷键提示 */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/40 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-primary" />
                    提及学者或助手
                </span>
                <span className="flex items-center gap-1 text-[10px] opacity-75 font-mono">
                    <span>↑↓ 导航</span>
                    <span className="flex items-center">↵ 选择</span>
                </span>
            </div>

            {/* 滚动列表 */}
            <div className="max-h-[280px] overflow-y-auto p-1 space-y-1 scrollbar-thin scrollbar-thumb-muted">
                {props.items.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const isAi = item.is_ai || item.relationship === "ai" || item.id === "00000000-0000-0000-0000-0000000000a1";
                    const initials = item.username?.slice(0, 2).toUpperCase() || "?";

                    if (isAi) {
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={cn(
                                    "group relative flex w-full select-none items-center gap-2.5 rounded-xl p-2 text-left transition-all duration-150 outline-none",
                                    isSelected
                                        ? "bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 ring-1 ring-purple-500/40 shadow-sm"
                                        : "hover:bg-purple-500/10"
                                )}
                                onClick={() => selectItem(index)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar className="h-8 w-8 ring-2 ring-purple-500/30">
                                        <AvatarImage src={item.avatar_url} alt={item.username} />
                                        <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-indigo-600 text-white text-xs">
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 ring-2 ring-background"></span>
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-xs text-foreground truncate group-hover:text-purple-400 transition-colors">
                                            {item.username}
                                        </span>
                                        <span className="flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-semibold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                            <Sparkles className="h-2.5 w-2.5" />
                                            AI 智脑
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            常驻在线
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        随时待命 · 学术答疑 · 8积分起
                                    </p>
                                </div>

                                {isSelected && (
                                    <CornerDownLeft className="h-3 w-3 text-purple-400 flex-shrink-0 animate-in fade-in" />
                                )}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={cn(
                                "flex w-full select-none items-center gap-2.5 rounded-xl p-2 text-left transition-all duration-150 outline-none",
                                isSelected
                                    ? "bg-accent text-accent-foreground ring-1 ring-border/50"
                                    : "hover:bg-muted/50"
                            )}
                            onClick={() => selectItem(index)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={item.avatar_url} alt={item.username} />
                                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-xs text-foreground truncate">
                                        {item.username}
                                    </span>
                                    {item.is_verified && <VerifiedBadge size="sm" />}
                                    {item.vip_level && item.vip_level > 0 && (
                                        <VipBadge vipLevel={item.vip_level} size="xs" />
                                    )}
                                    {item.relationship === "friend" && (
                                        <span className="inline-flex items-center gap-0.5 px-1 rounded text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <UserCheck className="h-2.5 w-2.5" />
                                            好友
                                        </span>
                                    )}
                                </div>
                                {(item.special_title || item.academic_title || item.bio) && (
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                        {item.special_title || item.academic_title || item.bio}
                                    </p>
                                )}
                            </div>

                            {isSelected && (
                                <CornerDownLeft className="h-3 w-3 text-muted-foreground flex-shrink-0 animate-in fade-in" />
                            )}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
});

MentionList.displayName = "MentionList";
