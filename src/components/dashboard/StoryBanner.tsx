"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Crown,
    Eye,
    Flame,
    Heart,
    MessageCircle,
    PenSquare,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
                    .limit(5),
                supabase
                    .from("posts")
                    .select("author_id, author:profiles!author_id(id, username, avatar_url)")
                    .eq("is_published", true)
                    .gte("created_at", weekStart),
            ]);

            const items: SlideItem[] = [];

            // 热门帖子 slides
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
                            username: a?.username || "未知学者",
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
    }, []);

    // 滚动控制
    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateScrollState, { passive: true });
        updateScrollState();
        return () => el.removeEventListener("scroll", updateScrollState);
    }, [updateScrollState, loading]);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
    };

    if (loading) {
        return (
            <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse shrink-0 w-60 h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/60" />
                ))}
            </div>
        );
    }

    if (slides.length === 0) return null;

    return (
        <div className="relative group/banner">
            {/* 左箭头 */}
            {canScrollLeft && (
                <button
                    type="button"
                    onClick={() => scroll("left")}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity hover:scale-105"
                >
                    <ChevronLeft className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" strokeWidth={1.75} />
                </button>
            )}

            {/* 右箭头 */}
            {canScrollRight && (
                <button
                    type="button"
                    onClick={() => scroll("right")}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity hover:scale-105"
                >
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" strokeWidth={1.75} />
                </button>
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
                        {slide.type === "trending" && <TrendingSlide post={slide.data} />}
                        {slide.type === "topPoster" && <TopPosterSlide user={slide.data} />}
                        {slide.type === "emptyWeekly" && <EmptyWeeklySlide />}
                    </motion.div>
                ))}
            </div>

            {/* 右侧渐变遮罩 */}
            {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            )}
        </div>
    );
}

// ============================
// Slide 子组件
// ============================

function TrendingSlide({ post }: { post: TrendingPost }) {
    return (
        <Link href={`/posts/${post.id}`}>
            <div className="w-60 h-28 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 group/slide">
                {/* 顶栏 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" strokeWidth={1.75} />
                        <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">热门</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Avatar className="h-4.5 w-4.5 border border-zinc-200/80 dark:border-zinc-700 shrink-0">
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
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 group-hover/slide:text-primary transition-colors">
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

function TopPosterSlide({ user }: { user: WeeklyTopPoster }) {
    const displayName = user.username || "学者";
    return (
        <Link href={`/user/${user.id}`}>
            <div className="w-48 h-28 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-amber-500/30 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Crown className="h-3 w-3" strokeWidth={1.75} /> 本周之星
                </div>
                <Avatar className="h-8 w-8 border border-amber-500/30">
                    <AvatarImage src={user.avatar_url || ""} alt={displayName} />
                    <AvatarFallback className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                        {displayName[0].toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">{displayName}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">本周 {user.post_count} 篇成果</p>
                </div>
            </div>
        </Link>
    );
}

function EmptyWeeklySlide() {
    return (
        <div className="w-52 h-28 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3.5 flex flex-col items-center justify-center gap-1.5">
            <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
            </div>
            <div className="text-center">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">本周之星虚位以待</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
                    <PenSquare className="h-2.5 w-2.5" strokeWidth={1.75} /> 发帖即有机会上榜
                </p>
            </div>
        </div>
    );
}
