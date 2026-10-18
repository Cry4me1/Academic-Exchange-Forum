"use client";

import { cleanSummaryText } from "@/lib/extract-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Clock, Heart, MessageCircle, Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newPosts = [...posts];
        const temp = newPosts[index];
        newPosts[index] = newPosts[index - 1];
        newPosts[index - 1] = temp;
        setPosts(newPosts);
        onReorder?.(newPosts.map(p => p.id));
    };

    const handleMoveDown = (index: number) => {
        if (index === posts.length - 1) return;
        const newPosts = [...posts];
        const temp = newPosts[index];
        newPosts[index] = newPosts[index + 1];
        newPosts[index + 1] = temp;
        setPosts(newPosts);
        onReorder?.(newPosts.map(p => p.id));
    };

    const handleRemove = (postId: string) => {
        setPosts(posts.filter(p => p.id !== postId));
        onRemove?.(postId);
    };

    if (posts.length === 0) {
        return (
            <div className="py-12 text-center border-0 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/40 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]">
                <p className="text-sm text-muted-foreground">这个专栏还没有添加任何内容</p>
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            key={post.id}
                            className={cn(
                                "group relative flex gap-4 p-4 rounded-2xl border-0 backdrop-blur-xl transition-all duration-300",
                                isLead
                                    ? "bg-white/85 dark:bg-zinc-900/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_4px_24px_-4px_rgba(14,165,233,0.15)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_24px_-4px_rgba(14,165,233,0.25)]"
                                    : "bg-white/70 dark:bg-zinc-900/60 hover:bg-white/85 dark:hover:bg-zinc-900/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_4px_16px_-4px_rgba(0,0,0,0.3)]"
                            )}
                        >
                            {/* Chapter Number */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold font-serif text-base border-0 select-none transition-all",
                                    isLead
                                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_0_12px_rgba(14,165,233,0.2)]"
                                        : "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                                )}>
                                    {index + 1}
                                </div>
                                {isAuthor && (
                                    <div className="flex flex-col gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === posts.length - 1}
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* 导读文章微胶囊与作者快捷设置 */}
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    {isLead && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 dark:bg-sky-400/10 text-sky-700 dark:text-sky-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_0_10px_rgba(14,165,233,0.16)] select-none">
                                            <Sparkles className="h-3 w-3 text-sky-500" />
                                            <span>专栏导读主篇 · 主页展示</span>
                                        </span>
                                    )}

                                    {isAuthor && !isLead && onSetLeadPost && (
                                        <button
                                            type="button"
                                            onClick={() => onSetLeadPost(post.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-sky-500/10 hover:text-sky-600 text-zinc-600 dark:text-zinc-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                                            title="将本篇设为主页展示的专栏导读篇"
                                        >
                                            <Star className="h-3 w-3" />
                                            <span>设为导读主篇</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex justify-between items-start gap-4">
                                    <Link href={`/posts/${post.id}`} className="block w-full">
                                        <h4 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                                            <MathText text={post.title} inlineOnly />
                                        </h4>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                                            <MathText text={plainSummary.slice(0, 240)} inlineOnly />
                                        </p>
                                    </Link>
                                    {isAuthor && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            onClick={() => handleRemove(post.id)}
                                            title="从专栏移出"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {post.tags?.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium bg-secondary/50 border-0 rounded-full">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                        <div className="flex items-center gap-1">
                                            <Heart className="h-3.5 w-3.5" />
                                            <span>{post.like_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle className="h-3.5 w-3.5" />
                                            <span>{post.comment_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2 pl-2">
                                            <span className="text-zinc-300 dark:text-zinc-700 select-none">·</span>
                                            <Clock className="h-3.5 w-3.5 ml-1" />
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
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
