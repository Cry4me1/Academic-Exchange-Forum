"use client";

import { cleanSummaryText } from "@/lib/extract-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Clock, Heart, MessageCircle, Sparkles, Star, X, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, MouseEvent } from "react";

interface CollectionPostListProps {
    posts: Array<{
        id: string;
        title: string;
        content: string | object;
        tags: string[];
        like_count: number;
        comment_count: number;
        created_at: string;
        position: number;
        is_lead?: boolean;
    }>;
    collectionId: string;
    isAuthor: boolean;
    onlyShowLeadPostInFeed?: boolean;
    onRemove?: (postId: string) => void;
    onReorder?: (postIds: string[]) => void;
    onSetLeadPost?: (postId: string) => void;
}

export function CollectionPostList({ 
    posts: initialPosts, 
    collectionId, 
    isAuthor, 
    onlyShowLeadPostInFeed = false,
    onRemove, 
    onReorder,
    onSetLeadPost,
}: CollectionPostListProps) {
    const [posts, setPosts] = useState(initialPosts);
    const router = useRouter();

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };

    const handleMoveUp = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (index === 0) return;
        const newPosts = [...posts];
        const temp = newPosts[index];
        newPosts[index] = newPosts[index - 1];
        newPosts[index - 1] = temp;
        setPosts(newPosts);
        onReorder?.(newPosts.map(p => p.id));
    };

    const handleMoveDown = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (index === posts.length - 1) return;
        const newPosts = [...posts];
        const temp = newPosts[index];
        newPosts[index] = newPosts[index + 1];
        newPosts[index + 1] = temp;
        setPosts(newPosts);
        onReorder?.(newPosts.map(p => p.id));
    };

    const handleRemove = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        setPosts(posts.filter(p => p.id !== postId));
        onRemove?.(postId);
    };

    const handleSetLead = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        onSetLeadPost?.(postId);
    };

    if (posts.length === 0) {
        return (
            <div className="py-16 text-center border-0 rounded-3xl bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(0,0,0,0.3)]">
                <p className="text-sm text-muted-foreground font-medium">这个专栏还没有添加任何学术文章</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {posts.map((post, index) => {
                    const plainSummary = cleanSummaryText(post.content);
                    const isLead = post.is_lead;
                    
                    return (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            key={post.id}
                            onMouseMove={handleMouseMove}
                            onClick={() => router.push(`/posts/${post.id}`)}
                            className={cn(
                                "group relative overflow-hidden flex flex-col sm:flex-row gap-5 p-5 sm:p-6 rounded-3xl border-0 cursor-pointer backdrop-blur-2xl transition-all duration-300",
                                isLead
                                    ? "bg-white/90 dark:bg-zinc-900/75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.98),0_12px_36px_-4px_rgba(14,165,233,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_12px_36px_-4px_rgba(14,165,233,0.28)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_20px_48px_-6px_rgba(14,165,233,0.25)]"
                                    : "bg-white/80 dark:bg-zinc-900/55 hover:bg-white/92 dark:hover:bg-zinc-900/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_16px_40px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
                            )}
                        >
                            {/* 120fps 光随鼠动物理漫反射层 */}
                            <div 
                                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(450px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.8),transparent_70%)] dark:bg-[radial-gradient(450px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(255,255,255,0.07),transparent_70%)]" 
                            />

                            {/* 章节专属流体编号芯片 */}
                            <div className="flex-shrink-0 flex sm:flex-col items-center justify-between sm:justify-start gap-3 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold font-mono text-base border-0 select-none transition-all duration-300",
                                    isLead
                                        ? "bg-gradient-to-br from-sky-400/25 to-sky-600/15 text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(14,165,233,0.3)]"
                                        : "bg-zinc-200/50 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] group-hover:bg-zinc-200/80 dark:group-hover:bg-white/[0.1] group-hover:scale-105"
                                )}>
                                    {String(index + 1).padStart(2, '0')}
                                </div>

                                {isAuthor && (
                                    <div className="flex sm:flex-col gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full border-0 bg-zinc-200/40 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-muted-foreground hover:text-foreground shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] cursor-pointer"
                                            onClick={(e) => handleMoveUp(e, index)}
                                            disabled={index === 0}
                                            title="上移此篇"
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full border-0 bg-zinc-200/40 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-muted-foreground hover:text-foreground shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] cursor-pointer"
                                            onClick={(e) => handleMoveDown(e, index)}
                                            disabled={index === posts.length - 1}
                                            title="下移此篇"
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* 内容主体 */}
                            <div className="flex-1 min-w-0 relative z-10 flex flex-col justify-between">
                                <div>
                                    {/* 导读文章微胶囊与快捷操作 */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {isLead && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_0_12px_rgba(14,165,233,0.2)] select-none">
                                                <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
                                                <span>专栏导读主篇 · 主页重点展示</span>
                                            </span>
                                        )}

                                        {isAuthor && !isLead && onSetLeadPost && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleSetLead(e, post.id)}
                                                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-zinc-200/40 dark:bg-white/[0.06] hover:bg-sky-500/15 hover:text-sky-600 dark:hover:text-sky-400 text-zinc-600 dark:text-zinc-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                                                title="将本篇设为主页展示的专栏导读篇"
                                            >
                                                <Star className="h-3 w-3" />
                                                <span>设为导读主篇</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* 标题与移出按钮 */}
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                                            <MathText text={post.title} inlineOnly />
                                        </h3>
                                        
                                        {isAuthor && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
                                                onClick={(e) => handleRemove(e, post.id)}
                                                title="从专栏移出"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* 正文摘要 */}
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4 font-normal">
                                        <MathText text={plainSummary.slice(0, 240)} inlineOnly />
                                    </p>
                                </div>

                                {/* 元信息与标签药丸栏 */}
                                <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-transparent">
                                    {/* 消融内部微光缝 */}
                                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent -mt-3 mb-2" />

                                    {/* 标签 */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {post.tags && post.tags.length > 0 ? (
                                            post.tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-200/40 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 border-0 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.1)]"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground/60 italic">学术笔记</span>
                                        )}
                                    </div>

                                    {/* 数据统计胶囊群 */}
                                    <div className="flex items-center gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/35 dark:bg-white/[0.04] text-xs font-medium text-muted-foreground shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.08)]">
                                            <Heart className="h-3 w-3 text-rose-500/80" />
                                            <span>{post.like_count || 0}</span>
                                        </div>

                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/35 dark:bg-white/[0.04] text-xs font-medium text-muted-foreground shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.08)]">
                                            <MessageCircle className="h-3 w-3 text-sky-500/80" />
                                            <span>{post.comment_count || 0}</span>
                                        </div>

                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/35 dark:bg-white/[0.04] text-xs font-medium text-muted-foreground shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.08)]">
                                            <Clock className="h-3 w-3 text-muted-foreground/80" />
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="hidden sm:inline-flex items-center text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all">
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
