"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Award,
    BookOpen,
    Calendar,
    ChevronRight,
    ExternalLink,
    FileText,
    Heart,
    MessageSquare,
    Plus,
    Sparkles,
    Users,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LabOutputPost {
    id: string;
    title: string;
    tags?: string[];
    view_count?: number;
    like_count?: number;
    comment_count?: number;
    created_at: string;
    author_id: string;
    author?: {
        id: string;
        username?: string;
        avatar_url?: string;
    };
    post_co_authors?: {
        id: string;
        role: string;
        contribution_summary?: string;
        user?: {
            id: string;
            username?: string;
            avatar_url?: string;
        };
    }[];
}

interface LabOutputsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomName: string;
    outputs: LabOutputPost[];
    isLoading?: boolean;
    onMountAsReference?: (post: LabOutputPost) => void;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const roleMap: Record<string, string> = {
    co_author: "共同作者",
    contributor: "主要贡献者",
    annotator: "评阅/批注",
};

export function LabOutputsDialog({
    open,
    onOpenChange,
    roomName,
    outputs,
    isLoading,
    onMountAsReference,
}: LabOutputsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                {/* 顶层菲涅尔反光层 */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent" />

                {/* 头部标题 */}
                <div className="p-6 pb-4">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] shrink-0">
                                <Award className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold font-title text-foreground tracking-tight flex items-center gap-2">
                                    <span>实验室学术成果展厅</span>
                                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                        共 {outputs.length} 篇产出
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                                    记录本研讨空间由同侪学者协同推导、论证并联合署名公开发布的学术成果
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 成果列表区域 */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {isLoading ? (
                        <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                            <Sparkles className="h-6 w-6 mx-auto animate-pulse text-zinc-500" />
                            <p>正在同步实验室成果档案...</p>
                        </div>
                    ) : outputs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-3xl bg-zinc-50/70 dark:bg-zinc-900/40 backdrop-blur-xl border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            {/* 双层高光液态微光环 */}
                            <div className="w-16 h-16 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 p-1 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] mb-4">
                                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
                                    <Award className="h-7 w-7 text-zinc-800 dark:text-zinc-200" />
                                </div>
                            </div>
                            <h4 className="font-semibold text-sm text-foreground tracking-tight">暂未联合发布学术成果</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
                                当同侪们在右侧协同推导区完成严谨论证后，点击顶栏
                                <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/80 font-medium text-foreground text-[11px] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                    成果联合署名发帖
                                </span>
                                即可将研讨笔记一键发布至全站学术社区并归档于此。
                            </p>
                        </div>
                    ) : (
                        outputs.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative overflow-hidden rounded-2xl border-0 p-4 transition-all duration-200 bg-white/60 dark:bg-zinc-800/45 hover:bg-white/85 dark:hover:bg-zinc-800/70 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1 min-w-0">
                                            <Link
                                                href={`/posts/${post.id}`}
                                                target="_blank"
                                                className="block font-semibold text-sm sm:text-base text-foreground hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors truncate tracking-tight"
                                            >
                                                {post.title}
                                            </Link>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-zinc-400" />
                                                    {formatDate(post.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="h-3 w-3 text-zinc-500" />
                                                    {post.like_count ?? 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3 text-zinc-500" />
                                                    {post.comment_count ?? 0}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {onMountAsReference && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => onMountAsReference(post)}
                                                                className="h-8 px-2.5 rounded-full border-0 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-zinc-100/70 dark:bg-zinc-800/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                                            >
                                                                <BookOpen className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                                                                <span className="hidden sm:inline">挂载共读</span>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom" className="text-xs">
                                                            将此成果作为共读文献引入左栏，开启二期研讨
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}

                                            <Link href={`/posts/${post.id}`} target="_blank">
                                                <button
                                                    type="button"
                                                    className="h-8 px-3 rounded-full border-0 inline-flex items-center gap-1 text-xs font-medium text-white bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white/90 dark:text-zinc-950 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                                                >
                                                    <span>查看长帖</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* 标签 */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            {post.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100/80 dark:bg-zinc-800/80 text-muted-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* 共同作者阵列 */}
                                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium">署名作者：</span>
                                            <div className="flex items-center -space-x-1.5">
                                                {/* 主作者 */}
                                                <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/70 px-2 py-0.5 rounded-full mr-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                                    <Avatar className="h-4 w-4 rounded-full border-0">
                                                        <AvatarImage src={post.author?.avatar_url} />
                                                        <AvatarFallback className="text-[8px] bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                                                            {(post.author?.username || "主").slice(0, 1)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[11px] font-medium text-foreground">
                                                        {post.author?.username || "主要作者"}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-600 dark:text-zinc-400 font-medium">(第一作者)</span>
                                                </div>

                                                {/* 协同共创作者 */}
                                                {post.post_co_authors && post.post_co_authors.length > 0 && (
                                                    post.post_co_authors.map((ca) => (
                                                        <div
                                                            key={ca.id}
                                                            title={`${ca.user?.username || "学者"} (${roleMap[ca.role] || ca.role})`}
                                                            className="flex items-center"
                                                        >
                                                            <Avatar className="h-5 w-5 rounded-full ring-2 ring-background border-0 shadow-sm">
                                                                <AvatarImage src={ca.user?.avatar_url} />
                                                                <AvatarFallback className="text-[8px] bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold">
                                                                    {(ca.user?.username || "协").slice(0, 1)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
