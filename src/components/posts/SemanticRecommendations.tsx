"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, Eye, Heart, MessageCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RecommendedPost {
    id: string;
    title: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    similarity: number;
    common_concepts?: string[]; // 共同概念词条
}

interface SemanticRecommendationsProps {
    postId: string;
    className?: string;
}

export function SemanticRecommendations({ postId, className }: SemanticRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<RecommendedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                const res = await fetch(`/api/posts/${postId}/recommendations?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data);
                }
            } catch (err) {
                console.error("Failed to fetch recommendations:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRecommendations();
    }, [postId]);

    if (loading) {
        return (
            <div
                className={cn(
                    "p-4 rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl",
                    "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)]",
                    className
                )}
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-zinc-500 animate-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">AI 推荐</span>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse space-y-1.5">
                            <div className="h-3.5 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-full w-full" />
                            <div className="h-2.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                "p-4 rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl relative overflow-hidden",
                "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)]",
                className
            )}
        >
            {/* 顶栏微光标题 */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400">
                    <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-semibold text-xs text-foreground">AI 语义推荐</h3>
            </div>

            <ul className="space-y-1">
                {recommendations.map((rec, index) => (
                    <motion.li
                        key={rec.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                    >
                        <Link
                            href={`/posts/${rec.id}`}
                            className="group/item block px-2.5 py-2 rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-all duration-200"
                        >
                            <p className="text-xs text-muted-foreground/90 group-hover/item:text-foreground transition-colors line-clamp-2 mb-1.5 leading-relaxed">
                                {rec.title}
                            </p>

                            {/* 低饱和浅灰中性标签，仅悬停时适度高亮，让视觉重心保留在正文 */}
                            {rec.common_concepts && rec.common_concepts.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                    {rec.common_concepts.map((concept, cIdx) => (
                                        <span
                                            key={cIdx}
                                            className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-normal border-0 transition-colors group-hover/item:bg-zinc-200/80 dark:group-hover/item:bg-zinc-700/80 group-hover/item:text-foreground"
                                        >
                                            # {concept}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                                <span className="inline-flex items-center gap-1 font-medium">
                                    <TrendingUp className="h-3 w-3 opacity-70" />
                                    {Math.round(rec.similarity * 100)}%
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                    <Eye className="h-3 w-3 opacity-70" />
                                    {rec.view_count}
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                    <Heart className="h-3 w-3 opacity-70" />
                                    {rec.like_count}
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                    <MessageCircle className="h-3 w-3 opacity-70" />
                                    {rec.comment_count}
                                </span>
                            </div>
                        </Link>
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );
}

export default SemanticRecommendations;
