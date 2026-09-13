"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CollectionCover } from "./CollectionCover";
import { getCollectionCoverPreset } from "./CollectionCoverPresets";
import type { CollectionSummary } from "./PostCollectionBanner";

interface PostCollectionSidebarWidgetProps {
    collection: CollectionSummary;
    currentPostId: string;
}

export function PostCollectionSidebarWidget({
    collection,
    currentPostId,
}: PostCollectionSidebarWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const posts = collection.posts || [];
    const preset = getCollectionCoverPreset(collection.cover_style);
    const PresetIcon = preset.icon;

    const currentIdx = posts.findIndex(p => p.id === currentPostId);
    const prevPost = currentIdx > 0 ? posts[currentIdx - 1] : null;
    const nextPost = currentIdx >= 0 && currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

    const displayedPosts = isExpanded ? posts : posts.slice(0, 6);

    return (
        <div className="bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl border-0 rounded-2xl overflow-hidden shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-all">
            {/* Header / Cover Area - 软化原深黑渐变，提升晶体通透感 */}
            <Link href={`/collections/${collection.id}`} className="group block relative">
                <div className="relative h-20 w-full overflow-hidden">
                    <CollectionCover
                        coverUrl={collection.cover_url}
                        coverStyle={collection.cover_style}
                        size="sm"
                        showEmblem={false}
                        showWatermark={false}
                        className="group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* 轻盈微光半透明遮罩（杜绝生硬纯黑） */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-zinc-950/20 to-transparent dark:from-black/75 dark:via-black/35 dark:to-transparent flex flex-col justify-end p-3 text-white backdrop-blur-[0.5px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-white/90 flex items-center gap-1.5">
                                <PresetIcon className="h-3 w-3" style={{ color: preset.accentColor }} />
                                连载专栏
                            </span>
                            <Badge variant="secondary" className="h-4 px-2 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md rounded-full">
                                共 {posts.length || collection.post_count} 篇
                            </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-tight truncate mt-1 group-hover:text-white/90 transition-colors drop-shadow-sm">
                            {collection.name}
                        </h4>
                    </div>
                </div>
            </Link>

            {/* 目录列表 */}
            <div className="p-3">
                <div className="space-y-1">
                    {displayedPosts.map((postItem, idx) => {
                        const isCurrent = postItem.id === currentPostId;
                        return (
                            <Link
                                key={postItem.id}
                                href={`/posts/${postItem.id}`}
                                className={cn(
                                    "flex items-start gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all group/item",
                                    isCurrent
                                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-foreground font-semibold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
                                )}
                            >
                                <span className={cn(
                                    "font-mono text-[11px] shrink-0 mt-0.5",
                                    isCurrent ? "text-primary font-bold" : "text-muted-foreground/50 group-hover/item:text-foreground"
                                )}>
                                    {String(idx + 1).padStart(2, "0")}.
                                </span>

                                <span className="line-clamp-1 flex-1">
                                    {postItem.title}
                                </span>

                                {isCurrent && (
                                    <span className="shrink-0 flex items-center text-[10px] text-primary font-medium">
                                        <Sparkles className="h-3 w-3 mr-0.5" />
                                        阅读中
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* 展开更多章节 */}
                {posts.length > 6 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground gap-1 justify-center rounded-full"
                    >
                        {isExpanded ? (
                            <>
                                <span>收起目录</span>
                                <ChevronUp className="h-3.5 w-3.5" />
                            </>
                        ) : (
                            <>
                                <span>查看全部 {posts.length} 篇目录</span>
                                <ChevronDown className="h-3.5 w-3.5" />
                            </>
                        )}
                    </Button>
                )}

                {/* 上一篇 / 下一篇 快捷跳转 */}
                {(prevPost || nextPost) && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                        {prevPost && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="flex-1 min-w-0 h-8 px-2.5 text-xs justify-center gap-1.5 text-muted-foreground hover:text-primary hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 border-0 rounded-full transition-all shadow-xs"
                            >
                                <Link href={`/posts/${prevPost.id}`} title={`上一篇: ${prevPost.title}`}>
                                    <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                                    <span className="font-medium">上一篇</span>
                                </Link>
                            </Button>
                        )}

                        {nextPost && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="flex-1 min-w-0 h-8 px-2.5 text-xs justify-center gap-1.5 text-muted-foreground hover:text-primary hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 border-0 rounded-full transition-all shadow-xs"
                            >
                                <Link href={`/posts/${nextPost.id}`} title={`下一篇: ${nextPost.title}`}>
                                    <span className="font-medium">下一篇</span>
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostCollectionSidebarWidget;
