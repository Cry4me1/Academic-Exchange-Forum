"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Crown,
    Eye,
    Heart,
    MessageCircle,
    PenSquare,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

// ============================
// Types
// ============================
interface TrendingPost {
    id: string;
    title: string;
    like_count: number;
    comment_count: number;
    view_count: number;
    author: {
        username: string;
        avatar_url?: string;
    };
}

interface WeeklyTopPoster {
    id: string;
    username: string;
    avatar_url?: string;
    post_count: number;
}

type SlideItem =
    | { type: "trending"; data: TrendingPost }
    | { type: "topPoster"; data: WeeklyTopPoster }
    | { type: "emptyWeekly" };

// ============================
// 主组件
// ============================
export function StoryBanner() {
    const { isZh } = useI18n();
    const [slides, setSlides] = useState<SlideItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // 获取数据
    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();

            // 计算本周一 00:00 (UTC)
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Sun
            const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - mondayOffset);
            monday.setHours(0, 0, 0, 0);
            const weekStart = monday.toISOString();

            const [trendingResult, weeklyPostsResult] = await Promise.all([
                supabase
                    .from("posts")
                    .select("id, title, like_count, comment_count, view_count, author:profiles!author_id(username, avatar_url)")
                    .eq("is_published", true)
                    .order("like_count", { ascending: false })
                    .limit(6),
                supabase
                    .from("posts")
                    .select("author_id, author:profiles!author_id(id, username, avatar_url)")
                    .eq("is_published", true)
                    .gte("created_at", weekStart),
            ]);

            const items: SlideItem[] = [];

            // 热门/精选帖子 slides
            const trending = (trendingResult.data || []) as unknown as TrendingPost[];
            trending.forEach((post) => {
                items.push({ type: "trending", data: post });
            });

            // 本周发帖排行
            const weeklyPosts = weeklyPostsResult.data || [];
            if (weeklyPosts.length > 0) {
                // 按 author_id 聚合
                const authorMap = new Map<string, { author: any; count: number }>();
                weeklyPosts.forEach((p: any) => {
                    const aid = p.author_id;
                    if (!aid) return;
                    const existing = authorMap.get(aid);
                    if (existing) {
                        existing.count++;
                    } else {
                        authorMap.set(aid, { author: p.author, count: 1 });
                    }
                });

                // 排序取前3
                const topPosters = Array.from(authorMap.entries())
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 3);

                topPosters.forEach(([, val]) => {
                    const a = val.author;
                    items.push({
                        type: "topPoster",
                        data: {
                            id: a?.id || "",
                            username: a?.username || (isZh ? "未知学者" : "Unknown Scholar"),
                            avatar_url: a?.avatar_url,
                            post_count: val.count,
                        },
                    });
                });
            } else {
                // 本周无人发帖 → 空态卡片
                items.push({ type: "emptyWeekly" });
            }

            setSlides(items);
            setLoading(false);
        }

        fetchData();
    }, [isZh]);

    // 滚动控制与状态更新
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateScrollState, { passive: true });
        window.addEventListener("resize", updateScrollState);

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollBy({ left: e.deltaY, behavior: "smooth" });
            }
        };
        el.addEventListener("wheel", handleWheel, { passive: false });

        updateScrollState();
        return () => {
            el.removeEventListener("scroll", updateScrollState);
            window.removeEventListener("resize", updateScrollState);
            el.removeEventListener("wheel", handleWheel);
        };
    }, [updateScrollState, loading]);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        // 每次平滑滑动单张或两张卡片步长（252px 为卡片宽 240px + gap 12px）
        const scrollAmount = 252;
        el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    };

    if (loading) {
        return (
            <div className="space-y-2.5">
                {/* 顶栏骨架 */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse border-0" />
                        <div className="h-4 w-24 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse border-0" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-7 w-7 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border-0" />
                        <div className="h-7 w-7 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border-0" />
                    </div>
                </div>
                {/* 卡片骨架 */}
                <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse shrink-0 w-60 h-28 rounded-2xl bg-white/70 dark:bg-zinc-800/40 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]" />
                    ))}
                </div>
            </div>
        );
    }

    if (slides.length === 0) return null;

    return (
        <div className="space-y-2.5">
            {/* 顶栏：清晰语义“社区焦点” + 水滴胶囊快捷翻页器 */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" strokeWidth={1.75} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            {isZh ? "社区焦点" : "Community Focus"}
                        </h2>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal hidden sm:inline">
                            {isZh ? "精选导读 · 前沿研讨与活跃学者" : "Curated Digest · Trends & Active Scholars"}
                        </span>
                    </div>
                </div>

                {/* 顶栏水滴胶囊翻页按钮组 */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={cn(
                            "h-7 w-7 rounded-full border-0 flex items-center justify-center transition-all duration-150 select-none",
                            canScrollLeft
                                ? "bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-1px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                                : "opacity-30 cursor-not-allowed bg-zinc-100/50 dark:bg-zinc-800/30 text-zinc-400"
                        )}
                        aria-label="向左滚动焦点卡片"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={cn(
                            "h-7 w-7 rounded-full border-0 flex items-center justify-center transition-all duration-150 select-none",
                            canScrollRight
                                ? "bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-1px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                        : "opacity-30 cursor-not-allowed bg-zinc-100/50 dark:bg-zinc-800/30 text-zinc-400"
                        )}
                        aria-label="向右滚动焦点卡片"
                    >
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* 轮播区域主体 */}
            <div className="relative group/banner">
                {/* 左侧平滑渐隐遮罩（Gradient Mask） */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-1 w-16 sm:w-20 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 via-zinc-50/70 dark:via-zinc-950/70 to-transparent pointer-events-none z-10 rounded-l-2xl" />
                )}

                {/* 右侧平滑渐隐遮罩（Gradient Mask），消除第 4 张卡片 1/5 截断的排版溢出错觉 */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-1 w-20 sm:w-28 bg-gradient-to-l from-zinc-50 dark:from-zinc-950 via-zinc-50/70 dark:via-zinc-950/70 to-transparent pointer-events-none z-10 rounded-r-2xl" />
                )}

                {/* 滚动容器 */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hidden scroll-smooth pb-1"
                >
                    {slides.map((slide, i) => (
                        <motion.div
                            key={`${slide.type}-${i}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                            className="shrink-0"
                        >
                            {slide.type === "trending" && <TrendingSlide post={slide.data} isZh={isZh} />}
                            {slide.type === "topPoster" && <TopPosterSlide user={slide.data} isZh={isZh} />}
                            {slide.type === "emptyWeekly" && <EmptyWeeklySlide isZh={isZh} />}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================
// Slide 子组件
// ============================

function TrendingSlide({ post, isZh }: { post: TrendingPost; isZh: boolean }) {
    return (
        <Link href={`/posts/${post.id}`} prefetch={false}>
            <div className="w-60 h-28 rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_24px_-4px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_12px_28px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_12px_28px_-4px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-150 group/slide">
                {/* 顶栏：精选导读标签（彻底避免与下方“热门”Tab重复） */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" strokeWidth={1.75} />
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 tracking-wider">
                            {isZh ? "精选导读" : "Curated"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="h-4.5 w-4.5 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] shrink-0">
                            <AvatarImage src={post.author?.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">
                                {(post.author?.username || "?")[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                            {post.author?.username}
                        </span>
                    </div>
                </div>

                {/* 标题 */}
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 group-hover/slide:text-primary transition-colors">
                    {post.title}
                </p>

                {/* 统计 */}
                <div className="flex items-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                        <Heart className="h-2.5 w-2.5" strokeWidth={1.75} /> {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <MessageCircle className="h-2.5 w-2.5" strokeWidth={1.75} /> {post.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5" strokeWidth={1.75} /> {post.view_count}
                    </span>
                </div>
            </div>
        </Link>
    );
}

function TopPosterSlide({ user, isZh }: { user: WeeklyTopPoster; isZh: boolean }) {
    const displayName = user.username || (isZh ? "学者" : "Scholar");
    return (
        <Link href={`/user/${user.id}`} prefetch={false}>
            <div className="w-48 h-28 rounded-2xl border-0 bg-amber-500/8 dark:bg-amber-500/10 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_8px_24px_-4px_rgba(245,158,11,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-4px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_12px_28px_-4px_rgba(245,158,11,0.14)] hover:-translate-y-0.5 p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-150">
                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Crown className="h-3 w-3" strokeWidth={1.75} /> {isZh ? "本周之星" : "Weekly Star"}
                </div>
                <Avatar className="h-8 w-8 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                    <AvatarImage src={user.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-xs">
                        {displayName[0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">{displayName}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                        {isZh ? `本周 ${user.post_count} 篇成果` : `${user.post_count} papers this week`}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function EmptyWeeklySlide({ isZh }: { isZh: boolean }) {
    return (
        <div className="w-52 h-28 rounded-2xl border-0 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] p-3.5 flex flex-col items-center justify-center gap-1.5">
            <div className="h-7 w-7 rounded-full bg-white/70 dark:bg-zinc-800 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
            </div>
            <div className="text-center">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {isZh ? "本周之星虚位以待" : "Weekly Star Awaiting"}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
                    <PenSquare className="h-2.5 w-2.5" strokeWidth={1.75} />
                    {isZh ? "发帖即有机会上榜" : "Publish a post to join"}
                </p>
            </div>
        </div>
    );
}

