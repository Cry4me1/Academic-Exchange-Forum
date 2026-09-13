"use client";

import { useState } from "react";
import Link from "next/link";
import { MathText } from "@/components/ui/math-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flame, TrendingUp, Clock, Heart, MessageCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";

export interface TrendingPost {
    id: string;
    title: string;
    content: string | object;
    tags: string[];
    created_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    hotScore?: number;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
    };
}

// 标签颜色映射
const tagColors: Record<string, string> = {
    "Computer Science": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Mathematics: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    AI: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Physics: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Biology: "bg-green-500/10 text-green-600 dark:text-green-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Chemistry: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Economics: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Philosophy: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    Engineering: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
    default: "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]",
};

// 从 JSON 内容中提取文本
function extractTextFromContent(content: string | object): string {
    if (typeof content === "string") {
        return content.replace(/<[^>]*>/g, "");
    }
    try {
        const jsonContent = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
        if (jsonContent.content) {
            const texts: string[] = [];
            for (const node of jsonContent.content) {
                if (node.content) {
                    for (const child of node.content) {
                        if (child.text) {
                            texts.push(child.text);
                        }
                    }
                }
            }
            return texts.join(" ").slice(0, 200);
        }
    } catch {
        // ignore
    }
    return "";
}

interface TrendingClientProps {
    initialPosts: TrendingPost[];
}

export default function TrendingClient({ initialPosts }: TrendingClientProps) {
    const [posts, setPosts] = useState<TrendingPost[]>(initialPosts);
    const [sortBy, setSortBy] = useState<"hot" | "views" | "likes">("hot");

    // 切换排序时重新排序已有数据（客户端排序，无需再次查询）
    const handleSortChange = (newSort: string) => {
        const sort = newSort as "hot" | "views" | "likes";
        setSortBy(sort);

        const sorted = [...initialPosts];
        if (sort === "hot") {
            sorted.sort((a, b) => {
                const scoreA = (a.view_count || 0) * 1 + (a.like_count || 0) * 5 + (a.comment_count || 0) * 3;
                const scoreB = (b.view_count || 0) * 1 + (b.like_count || 0) * 5 + (b.comment_count || 0) * 3;
                return scoreB - scoreA;
            });
        } else if (sort === "views") {
            sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        } else if (sort === "likes") {
            sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        }
        setPosts(sorted);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 relative selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 现代通透背景微光 */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-gradient-to-b from-zinc-200/40 via-zinc-100/20 to-transparent dark:from-zinc-800/20 dark:via-zinc-900/10 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -top-32 right-1/4 w-96 h-96 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 头部 */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.3)] hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Flame className="h-6 w-6 text-orange-500 fill-orange-500/20" />
                            热门学术
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            发现最受欢迎的学术讨论与前沿探索
                        </p>
                    </div>
                </div>

                {/* 排序选项 */}
                <Tabs value={sortBy} onValueChange={handleSortChange} className="mb-6">
                    <TabsList className="h-auto p-1.5 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.2)] flex gap-1 w-fit">
                        <TabsTrigger
                            value="hot"
                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>热度</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="views"
                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>浏览量</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="likes"
                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Heart className="h-3.5 w-3.5" />
                            <span>点赞数</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* 帖子列表 — 数据已由服务端预获取，无加载状态 */}
                {posts.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {posts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.3 }}
                            >
                                <div className="group relative rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_12px_40px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_12px_40px_-6px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5">
                                    <div className="flex items-start gap-4">
                                        {/* 排名 */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono border-0 select-none ${
                                            index === 0
                                                ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-[0_2px_10px_rgba(249,115,22,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                                : index === 1
                                                ? "bg-gradient-to-br from-slate-300 via-zinc-400 to-zinc-500 text-white shadow-[0_2px_10px_rgba(161,161,170,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                                : index === 2
                                                ? "bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white shadow-[0_2px_10px_rgba(180,83,9,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.4)]"
                                                : "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                                        }`}>
                                            {index + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* 标签 */}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {post.tags.slice(0, 2).map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                            className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${tagColors[tag] || tagColors.default}`}
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <Link href={`/posts/${post.id}`}>
                                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1 text-sm sm:text-base leading-snug">
                                                    <MathText text={post.title} inlineOnly />
                                                </h3>
                                            </Link>
                                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                <MathText text={extractTextFromContent(post.content).substring(0, 150) + "..."} inlineOnly />
                                            </p>

                                            {/* 渐变消融微光缝 */}
                                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mt-3.5 mb-2.5" />

                                            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                                <Link
                                                    href={`/user/${post.author?.id}`}
                                                    className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                >
                                                    <Avatar className="h-5 w-5 border-0 rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                                                        <AvatarImage src={post.author?.avatar_url} />
                                                        <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                            {post.author?.username?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{post.author?.username}</span>
                                                </Link>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3 text-zinc-400" /> {post.view_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="h-3 w-3 text-zinc-400" /> {post.like_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="h-3 w-3 text-zinc-400" /> {post.comment_count || 0}
                                                </span>
                                                <span className="ml-auto flex items-center gap-1 text-zinc-400">
                                                    <Clock className="h-3 w-3" />
                                                    {post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN") : "未知时间"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-16 border-0 rounded-3xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_-4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.2)]">
                        <Flame className="h-12 w-12 mx-auto text-zinc-400 dark:text-zinc-500 mb-4" />
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">暂无热门帖子</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            快来发布第一篇学术讨论吧！
                        </p>
                        <Link href="/posts/new">
                            <Button className="mt-5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] px-5 py-2 text-xs font-medium cursor-pointer transition-all active:scale-[0.97]">
                                发布讨论
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
