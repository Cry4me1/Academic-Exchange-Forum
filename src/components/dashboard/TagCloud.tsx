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
    hot: "bg-rose-500/8 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15",
    warm: "bg-amber-500/8 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
    normal: "bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60",
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
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs backdrop-blur-md">
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
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 cursor-pointer ${heatStyles[tag.heat]}`}
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
