"use client";

import { useState } from "react";
import { Bookmark, Heart, List, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MobileArticleBottomBarProps {
    isLiked: boolean;
    likeCount: number;
    isBookmarked: boolean;
    commentCount: number;
    onLike: (e: React.MouseEvent) => void;
    onBookmark: (e: React.MouseEvent) => void;
    onOpenToc: () => void;
    onShare: () => void;
    onCommentClick: () => void;
}

export function MobileArticleBottomBar({
    isLiked,
    likeCount,
    isBookmarked,
    commentCount,
    onLike,
    onBookmark,
    onOpenToc,
    onShare,
    onCommentClick,
}: MobileArticleBottomBarProps) {
    const [tapHeart, setTapHeart] = useState(false);

    const handleHeartClick = (e: React.MouseEvent) => {
        setTapHeart(true);
        setTimeout(() => setTapHeart(false), 500);
        onLike(e);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_-8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_-8px_32px_-4px_rgba(0,0,0,0.5)] pb-safe transition-all select-none">
            <div className="flex items-center justify-between h-13 px-3.5 gap-2.5">
                {/* 快捷发表学术评论输入胶囊 */}
                <button
                    type="button"
                    onClick={onCommentClick}
                    className="flex-1 h-8.5 px-3.5 rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-900/80 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all cursor-pointer"
                >
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">写下你的学术见解...</span>
                </button>

                {/* 互动胶囊组 */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* 点赞 */}
                    <button
                        type="button"
                        onClick={handleHeartClick}
                        className={cn(
                            "flex items-center gap-1 h-8.5 px-2.5 rounded-full border-0 transition-all active:scale-90 cursor-pointer",
                            isLiked
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        )}
                        aria-label="点赞"
                    >
                        <motion.div
                            animate={tapHeart ? { scale: [1, 1.4, 0.9, 1] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            <Heart
                                className={cn("h-4 w-4", isLiked && "fill-current")}
                                strokeWidth={isLiked ? 2 : 1.75}
                            />
                        </motion.div>
                        <span className="text-[11px] font-mono tabular-nums font-medium">
                            {likeCount}
                        </span>
                    </button>

                    {/* 收藏 */}
                    <button
                        type="button"
                        onClick={onBookmark}
                        className={cn(
                            "flex items-center justify-center h-8.5 w-8.5 rounded-full border-0 transition-all active:scale-90 cursor-pointer",
                            isBookmarked
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        )}
                        aria-label="收藏"
                    >
                        <Bookmark
                            className={cn("h-4 w-4", isBookmarked && "fill-current")}
                            strokeWidth={isBookmarked ? 2 : 1.75}
                        />
                    </button>

                    {/* 目录 */}
                    <button
                        type="button"
                        onClick={onOpenToc}
                        className="flex items-center justify-center h-8.5 w-8.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-0 active:scale-90 transition-all cursor-pointer"
                        title="查看大纲目录"
                        aria-label="查看大纲目录"
                    >
                        <List className="h-4 w-4" strokeWidth={1.8} />
                    </button>

                    {/* 分享 */}
                    <button
                        type="button"
                        onClick={onShare}
                        className="flex items-center justify-center h-8.5 w-8.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-0 active:scale-90 transition-all cursor-pointer"
                        title="分享卡片"
                        aria-label="分享卡片"
                    >
                        <Share2 className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                </div>
            </div>
        </div>
    );
}
