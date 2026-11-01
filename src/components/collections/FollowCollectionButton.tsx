"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toggleFollowCollection } from "@/app/(protected)/collections/actions";
import { cn } from "@/lib/utils";
import { Heart, HeartOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface FollowCollectionButtonProps {
    collectionId: string;
    initialFollowed: boolean;
    followerCount: number;
    /** 在 Hero 暗色背景上使用的样式变体 */
    variant?: "default" | "hero";
    className?: string;
    onToggle?: (followed: boolean) => void;
}

export function FollowCollectionButton({
    collectionId,
    initialFollowed,
    followerCount,
    variant = "default",
    className,
    onToggle,
}: FollowCollectionButtonProps) {
    const [isFollowed, setIsFollowed] = useState(initialFollowed);
    const [count, setCount] = useState(followerCount);
    const [isHovering, setIsHovering] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        // 乐观更新
        const newFollowed = !isFollowed;
        setIsFollowed(newFollowed);
        setCount((prev) => (newFollowed ? prev + 1 : Math.max(prev - 1, 0)));

        startTransition(async () => {
            const result = await toggleFollowCollection(collectionId);
            if (result.error) {
                // 回滚
                setIsFollowed(!newFollowed);
                setCount((prev) => (newFollowed ? Math.max(prev - 1, 0) : prev + 1));
                toast.error(result.error);
            } else {
                if (newFollowed) {
                    toast.success("已关注专栏，新文章发布时将收到通知");
                } else {
                    toast("已取消关注");
                }
                onToggle?.(newFollowed);
            }
        });
    };

    if (variant === "hero") {
        return (
            <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleToggle}
                disabled={isPending}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={cn(
                    "inline-flex items-center justify-center gap-1.5 h-9 px-5 rounded-full border-0 font-medium text-xs sm:text-sm backdrop-blur-2xl transition-all duration-300 cursor-pointer select-none",
                    isFollowed
                        ? isHovering
                            ? "bg-rose-500/30 text-rose-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4),0_0_20px_rgba(244,63,94,0.35)]"
                            : "bg-white/16 hover:bg-white/24 text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.25)]"
                        : "bg-white/95 hover:bg-white text-zinc-950 shadow-[0_4px_20px_rgba(255,255,255,0.25),inset_0_1px_1.5px_rgba(255,255,255,1)]",
                    className
                )}
            >
                {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFollowed ? (
                    isHovering ? (
                        <HeartOff className="h-3.5 w-3.5 text-rose-300" />
                    ) : (
                        <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                    )
                ) : (
                    <UserPlus className="h-3.5 w-3.5 text-zinc-950" />
                )}
                <span>
                    {isPending
                        ? "处理中..."
                        : isFollowed
                            ? isHovering
                                ? "取消关注"
                                : `已关注 · ${count}`
                            : `关注专栏 · ${count}`}
                </span>
            </motion.button>
        );
    }

    // default variant
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleToggle}
            disabled={isPending}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={cn(
                "inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-full border-0 font-medium text-xs backdrop-blur-xl transition-all duration-300 cursor-pointer select-none",
                isFollowed
                    ? isHovering
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6),0_0_16px_rgba(244,63,94,0.18)]"
                        : "bg-zinc-200/50 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                    : "bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,1)]",
                className
            )}
        >
            {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : isFollowed ? (
                isHovering ? (
                    <HeartOff className="h-3 w-3 text-rose-500" />
                ) : (
                    <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                )
            ) : (
                <UserPlus className="h-3 w-3" />
            )}
            <span>
                {isPending
                    ? "处理中..."
                    : isFollowed
                        ? isHovering
                            ? "取消关注"
                            : `已关注 · ${count}`
                        : `关注 · ${count}`}
            </span>
        </motion.button>
    );
}
