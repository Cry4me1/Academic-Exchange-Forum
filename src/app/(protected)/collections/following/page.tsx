"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookMarked, Compass, HeartOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { getFollowedCollections, toggleFollowCollection } from "../actions";
import { CollectionCard } from "@/components/collections";
import { Button } from "@/components/ui/button";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function FollowedCollectionsPage() {
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setIsLoading(true);
        try {
            const { collections } = await getFollowedCollections();
            setCollections(collections || []);
        } catch (error) {
            console.error("Failed to load followed collections:", error);
            toast.error("加载关注专栏失败");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnfollow = async (collectionId: string, collectionName: string) => {
        // 乐观从列表中移除
        const prev = [...collections];
        setCollections(collections.filter(c => c.id !== collectionId));

        const result = await toggleFollowCollection(collectionId);
        if (result.error) {
            setCollections(prev);
            toast.error(result.error);
        } else {
            toast(`已取消关注专栏「${collectionName}」`);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-16">
            {/* 顶部 Header - 无边框液态毛玻璃 */}
            <header className="sticky top-0 z-30 border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full border-0 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/60 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all cursor-pointer"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-amber-500/[0.12] text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                                    <BookMarked className="h-4 w-4" />
                                </span>
                                关注专栏
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                共关注 {collections.length} 个学术专栏 · 专栏发布新文章时将实时通知你
                            </p>
                        </div>
                    </div>

                    <Link href="/trending">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-4 gap-1.5 rounded-full border-0 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-200/40 hover:bg-zinc-200/65 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all cursor-pointer"
                        >
                            <Compass className="h-3.5 w-3.5" />
                            发现更多专栏
                        </Button>
                    </Link>
                </div>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
            </header>

            {/* 专栏列表区域 */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">正在加载关注的专栏...</p>
                    </div>
                ) : collections.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {collections.map((col) => (
                            <motion.div
                                key={col.id}
                                variants={itemVariants}
                                className="relative group"
                            >
                                <CollectionCard
                                    id={col.id}
                                    name={col.name}
                                    description={col.description}
                                    coverUrl={col.cover_url}
                                    coverStyle={col.cover_style}
                                    postCount={col.post_count}
                                    isPublic={col.is_public}
                                    updatedAt={col.updated_at}
                                    authorName={col.author?.username || "未知学者"}
                                    showAuthor
                                />

                                {/* 悬浮快捷取关水滴胶囊按钮 */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleUnfollow(col.id, col.name);
                                    }}
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 px-3 rounded-full border-0 text-xs font-medium bg-black/50 hover:bg-red-500/90 text-white backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35),0_4px_12px_rgba(0,0,0,0.25)] gap-1 z-20 cursor-pointer"
                                >
                                    <HeartOff className="h-3.5 w-3.5" />
                                    <span>取消关注</span>
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] max-w-md mx-auto mt-10">
                        <div className="h-14 w-14 rounded-full bg-amber-500/[0.12] flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_rgba(245,158,11,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                            <BookMarked className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1.5">暂无关注的专栏</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            在浏览学者专栏时点击「关注专栏」，后续更新的精彩篇目将第一时间推送到你的通知中心。
                        </p>
                        <Link href="/trending">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Button className="relative overflow-hidden group h-10 px-6 gap-2 rounded-full border-0 font-medium text-sm bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] backdrop-blur-xl transition-all duration-300 cursor-pointer">
                                    <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/45 dark:via-white/85 to-transparent pointer-events-none" />
                                    <Sparkles className="h-4 w-4" />
                                    去发现优质专栏
                                </Button>
                            </motion.div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
