"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface BacklinkItem {
    id: string;
    title: string;
    created_at: string;
    author: {
        username: string;
        avatar_url?: string;
    };
}

interface BacklinksProps {
    backlinks: BacklinkItem[];
    className?: string;
}

export function Backlinks({ backlinks, className }: BacklinksProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (backlinks.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "relative rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/65 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.35)] overflow-hidden",
                className
            )}
        >
            {/* 顶部消融光带 */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

            {/* 标题栏 */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-sky-500/10 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.1)]">
                        <Link2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                        反向引用
                    </span>
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-2 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 text-xs font-semibold shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.1)]">
                        {backlinks.length}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {/* 引用列表 */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-1">
                            {backlinks.map((link, index) => (
                                <motion.div
                                    key={link.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.05,
                                        duration: 0.3,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <Link
                                        href={`/posts/${link.id}`}
                                        className="group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-white/80 dark:hover:bg-zinc-800/60 shadow-none hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-all duration-200 border-0"
                                    >
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage
                                                src={link.author.avatar_url}
                                                alt={link.author.username}
                                            />
                                            <AvatarFallback className="text-[10px] bg-muted">
                                                {link.author.username?.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                                                {link.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                @{link.author.username} · {new Date(link.created_at).toLocaleDateString("zh-CN")}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
