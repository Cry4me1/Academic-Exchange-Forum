"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/context";

interface TagData {
    name: string;
    count: number;
    heat: "hot" | "warm" | "normal";
}

const heatStyles = {
    hot: "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_-1px_rgba(244,63,94,0.12)] hover:bg-rose-500/20",
    warm: "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_-1px_rgba(245,158,11,0.12)] hover:bg-amber-500/20",
    normal: "bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] hover:bg-white/85 dark:hover:bg-zinc-800/85",
};

export function TagCloud() {
    const { t, isZh } = useI18n();
    const [tags, setTags] = useState<TagData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTags() {
            const supabase = createClient();

            // 获取所有帖子的标签
            const { data: posts } = await supabase
                .from("posts")
                .select("tags")
                .eq("is_published", true);

            if (posts) {
                // 统计标签出现次数
                const tagCounts: Record<string, number> = {};
                posts.forEach((post: any) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        post.tags.forEach((tag: string) => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                    }
                });

                // 转换为数组并排序
                const sortedTags = Object.entries(tagCounts)
                    .map(([name, count]) => ({
                        name,
                        count,
                        heat: (count >= 10 ? "hot" : count >= 5 ? "warm" : "normal") as TagData["heat"],
                    }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                setTags(sortedTags);
            }

            setLoading(false);
        }

        fetchTags();
    }, []);

    return (
        <div className="rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl p-4 sm:p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mb-3.5">
                <TrendingUp className="h-4 w-4 text-zinc-700 dark:text-zinc-300" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    {t.dashboardComponents.trendingTags}
                </h3>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" strokeWidth={1.75} />
                </div>
            ) : tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <Link key={tag.name} href={`/trending?tag=${encodeURIComponent(tag.name)}`}>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-0 transition-all duration-150 cursor-pointer backdrop-blur-md select-none ${heatStyles[tag.heat]}`}
                            >
                                <span>{tag.name}</span>
                                <span className="font-mono text-[10px] opacity-60 tabular-nums">
                                    {tag.count >= 1000 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">
                    {isZh ? "暂无热门话题" : "No trending topics yet"}
                </p>
            )}
        </div>
    );
}
