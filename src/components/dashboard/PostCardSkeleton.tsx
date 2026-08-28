"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-zinc-200/70 dark:bg-zinc-800/70",
                className
            )}
        />
    );
}

/** 有封面图的竖版骨架 */
export function PostCardSkeletonWithCover() {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 space-y-3.5">
                {/* 头部：作者 + 状态 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Shimmer className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5">
                            <Shimmer className="h-3.5 w-24" />
                            <Shimmer className="h-3 w-14" />
                        </div>
                    </div>
                    <Shimmer className="h-5 w-14 rounded-full" />
                </div>

                {/* 封面图占位 (16:9) */}
                <Shimmer className="w-full aspect-[16/9] rounded-lg" />

                {/* 标题 */}
                <Shimmer className="h-4.5 w-4/5" />

                {/* 摘要 */}
                <div className="space-y-1.5">
                    <Shimmer className="h-3.5 w-full" />
                    <Shimmer className="h-3.5 w-2/3" />
                </div>

                {/* 标签 */}
                <div className="flex gap-1.5 pt-1">
                    <Shimmer className="h-5 w-16 rounded-full" />
                    <Shimmer className="h-5 w-12 rounded-full" />
                </div>
            </div>

            {/* 底栏 */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40">
                <div className="flex gap-4">
                    <Shimmer className="h-4 w-10" />
                    <Shimmer className="h-4 w-10" />
                    <Shimmer className="h-4 w-6" />
                </div>
                <Shimmer className="h-4 w-6" />
            </div>
        </div>
    );
}

/** 无封面图的紧凑版骨架 */
export function PostCardSkeletonCompact() {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-5 space-y-3.5">
                {/* 头部：作者 + 标签 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Shimmer className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5">
                            <Shimmer className="h-3.5 w-24" />
                            <Shimmer className="h-3 w-14" />
                        </div>
                    </div>
                    <Shimmer className="h-5 w-14 rounded-full" />
                </div>

                {/* 标题 */}
                <Shimmer className="h-4.5 w-3/4" />

                {/* 摘要 */}
                <div className="space-y-1.5">
                    <Shimmer className="h-3.5 w-full" />
                    <Shimmer className="h-3.5 w-5/6" />
                </div>

                {/* 标签 */}
                <div className="flex gap-1.5 pt-1">
                    <Shimmer className="h-5 w-14 rounded-full" />
                    <Shimmer className="h-5 w-12 rounded-full" />
                </div>
            </div>

            {/* 底栏 */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40">
                <div className="flex gap-4">
                    <Shimmer className="h-4 w-10" />
                    <Shimmer className="h-4 w-10" />
                    <Shimmer className="h-4 w-6" />
                </div>
                <Shimmer className="h-4 w-6" />
            </div>
        </div>
    );
}

/** 混合骨架列表（模拟真实加载感） */
export function PostFeedSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: count }).map((_, i) =>
                i % 3 === 0 ? (
                    <PostCardSkeletonWithCover key={i} />
                ) : (
                    <PostCardSkeletonCompact key={i} />
                )
            )}
        </div>
    );
}
