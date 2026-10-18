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

/** 有封面图的竖版骨架（与新版 PostCard 物理结构严格 1:1 对齐） */
export function PostCardSkeletonWithCover() {
    return (
        <div className="bg-white/75 dark:bg-zinc-900/60 border-0 rounded-2xl overflow-hidden shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="p-5">
                {/* 头部：作者头像 + 昵称 + 等级 + 发布时间 */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Shimmer className="h-7 w-7 rounded-full shrink-0" />
                        <Shimmer className="h-3.5 w-16 sm:w-24 rounded-full" />
                        <Shimmer className="h-3 w-7 rounded-full" />
                        <Shimmer className="h-3 w-10 rounded-full" />
                    </div>
                    <Shimmer className="h-4 w-4 rounded-full shrink-0 opacity-60" />
                </div>

                {/* 封面图占位 (16:9) */}
                <Shimmer className="w-full aspect-[16/9] rounded-xl mb-3.5" />

                {/* 标题 */}
                <Shimmer className="h-4.5 w-4/5 rounded-full mb-2" />

                {/* 2行纯文本摘要 */}
                <div className="space-y-1.5 mt-1.5">
                    <Shimmer className="h-3.5 w-full rounded-full" />
                    <Shimmer className="h-3.5 w-2/3 rounded-full" />
                </div>
            </div>

            {/* 底栏 */}
            <div className="flex flex-col">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                <div className="flex items-center justify-between px-5 py-2.5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                        <Shimmer className="h-4 w-8 rounded-full" />
                        <Shimmer className="h-4 w-8 rounded-full" />
                        <Shimmer className="h-4 w-5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Shimmer className="h-4 w-16 rounded-full hidden sm:block" />
                        <Shimmer className="h-4 w-5 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 无封面图的紧凑版骨架（与新版 PostCard 物理结构严格 1:1 对齐） */
export function PostCardSkeletonCompact() {
    return (
        <div className="bg-white/75 dark:bg-zinc-900/60 border-0 rounded-2xl overflow-hidden shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="p-5">
                {/* 头部：作者头像 + 昵称 + 等级 + 发布时间 */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Shimmer className="h-7 w-7 rounded-full shrink-0" />
                        <Shimmer className="h-3.5 w-16 sm:w-24 rounded-full" />
                        <Shimmer className="h-3 w-7 rounded-full" />
                        <Shimmer className="h-3 w-10 rounded-full" />
                    </div>
                    <Shimmer className="h-4 w-4 rounded-full shrink-0 opacity-60" />
                </div>

                {/* 标题 */}
                <Shimmer className="h-4.5 w-3/4 rounded-full mb-2" />

                {/* 2行纯文本摘要 */}
                <div className="space-y-1.5 mt-1.5">
                    <Shimmer className="h-3.5 w-full rounded-full" />
                    <Shimmer className="h-3.5 w-5/6 rounded-full" />
                </div>
            </div>

            {/* 底栏 */}
            <div className="flex flex-col">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                <div className="flex items-center justify-between px-5 py-2.5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
                        <Shimmer className="h-4 w-8 rounded-full" />
                        <Shimmer className="h-4 w-8 rounded-full" />
                        <Shimmer className="h-4 w-5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Shimmer className="h-4 w-16 rounded-full hidden sm:block" />
                        <Shimmer className="h-4 w-5 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** 混合骨架列表（模拟真实加载感，左右两列平衡分布） */
export function PostFeedSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 space-y-5">
                <PostCardSkeletonWithCover />
                <PostCardSkeletonCompact />
            </div>
            <div className="hidden md:block flex-1 space-y-5">
                <PostCardSkeletonCompact />
                <PostCardSkeletonWithCover />
            </div>
        </div>
    );
}
