"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronRight, FolderPlus, Layers } from "lucide-react";
import Link from "next/link";
import { getCollectionCoverPreset } from "./CollectionCoverPresets";

export interface CollectionSummary {
    id: string;
    name: string;
    description?: string | null;
    cover_url?: string | null;
    cover_style?: string;
    post_count: number;
    position?: number;
    only_show_lead_post_in_feed?: boolean;
    lead_post_id?: string | null;
    posts?: Array<{
        id: string;
        title: string;
        position: number;
        created_at: string;
    }>;
}

interface PostCollectionBannerProps {
    collections: CollectionSummary[];
    currentPostId: string;
    isAuthor?: boolean;
    onManageCollections?: () => void;
    className?: string;
}

export function PostCollectionBanner({
    collections,
    currentPostId,
    isAuthor = false,
    onManageCollections,
    className,
}: PostCollectionBannerProps) {
    if (!collections || collections.length === 0) {
        if (!isAuthor) return null;
        return (
            <div className={cn("mb-4", className)}>
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onManageCollections}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-white/70 hover:bg-white/90 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 backdrop-blur-xl text-muted-foreground hover:text-foreground border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_0_16px_rgba(14,165,233,0.18)] transition-all duration-200 group cursor-pointer"
                >
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.1)]">
                        <FolderPlus className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                    </span>
                    <span>本文尚未加入专栏 · 点击归入你的学术专栏开启连载目录</span>
                </motion.button>
            </div>
        );
    }

    const primaryCol = collections[0];
    const preset = getCollectionCoverPreset(primaryCol.cover_style);
    const PresetIcon = preset.icon;

    // 计算当前文章在专栏中的序号
    let currentIdx = -1;
    let totalCount = primaryCol.post_count || 0;
    const posts = primaryCol.posts || [];
    if (posts.length > 0) {
        currentIdx = posts.findIndex((p) => p.id === currentPostId);
        totalCount = posts.length;
    }

    // 是否为专栏导读文章
    const isLeadPost =
        !!primaryCol.only_show_lead_post_in_feed &&
        (primaryCol.lead_post_id ? primaryCol.lead_post_id === currentPostId : currentIdx === 0);

    // 如果是导读篇：呈现专属 Apple Liquid Glass 展台面板
    if (isLeadPost) {
        return (
            <div
                className={cn(
                    "mb-6 rounded-3xl border-0 p-4 sm:p-5 backdrop-blur-2xl transition-all",
                    "bg-gradient-to-br from-white/80 via-white/60 to-sky-50/40 dark:from-zinc-900/75 dark:via-zinc-900/60 dark:to-sky-950/20",
                    "shadow-[0_8px_32px_-4px_rgba(14,165,233,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_-4px_rgba(14,165,233,0.2),inset_0_1px_1px_rgba(255,255,255,0.12)]",
                    className
                )}
            >
                {/* 顶部标签行与操作 */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center flex-wrap gap-2">
                        {/* 醒目导读主篇微光胶囊 */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_0_12px_rgba(14,165,233,0.22)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_0_12px_rgba(14,165,233,0.35)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            ✦ 专栏导读主篇
                        </span>

                        <span className="text-xs text-muted-foreground font-medium">
                            系列总入口 · 收录于
                        </span>

                        <Link
                            href={`/collections/${primaryCol.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors group/title"
                        >
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.15)]">
                                <PresetIcon className="w-3.5 h-3.5" style={{ color: preset.accentColor }} />
                            </span>
                            <span className="underline-offset-4 group-hover/title:underline truncate max-w-[240px]">
                                「{primaryCol.name}」
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2.5 py-0.5 text-[11px] bg-black/5 dark:bg-white/10 text-foreground/80 border-0 rounded-full font-medium shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.08)]">
                            连载共 {totalCount} 篇
                        </span>

                        {isAuthor && onManageCollections && (
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onManageCollections}
                                className="inline-flex items-center gap-1 h-6 text-[11px] px-2.5 text-muted-foreground hover:text-foreground rounded-full border-0 bg-white/70 hover:bg-white/90 dark:bg-zinc-800/60 dark:hover:bg-zinc-800/80 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] cursor-pointer transition-all"
                                title="调整导读与专栏设置"
                            >
                                <FolderPlus className="h-3 w-3 text-primary/70" />
                                <span>设置</span>
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* 导读提示文案 */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                    作者已将本文设为该专栏在主页展示的唯一导读入口。专栏其他篇章已收拢聚合，您可通过右侧边栏或文末的专栏目录依次翻阅完整系列内容。
                </p>
            </div>
        );
    }

    // 常规模式：普通专栏收录胶囊 (Apple Liquid Glass 无边框水滴流光形态)
    return (
        <div className={cn("flex flex-wrap items-center gap-2.5 mb-4", className)}>
            <motion.div
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
            >
                <Link
                    href={`/collections/${primaryCol.id}`}
                    className="group/col inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border-0 bg-white/75 hover:bg-white/95 dark:bg-zinc-900/65 dark:hover:bg-zinc-900/85 backdrop-blur-xl text-foreground/90 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.35)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_0_16px_rgba(14,165,233,0.18)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_0_18px_rgba(14,165,233,0.25)]"
                >
                    <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.15)]">
                            <PresetIcon className="w-3.5 h-3.5" style={{ color: preset.accentColor }} />
                        </span>
                        <span className="text-muted-foreground/90 font-medium">收录于专栏</span>
                        <span className="text-foreground group-hover/col:text-primary font-bold transition-colors truncate max-w-[220px]">
                            「{primaryCol.name}」
                        </span>
                    </span>

                    {currentIdx !== -1 && (
                        <>
                            <span className="w-[1px] h-3 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5 shrink-0" />
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground dark:text-zinc-300 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.08)]">
                                第 {currentIdx + 1}/{totalCount} 篇
                            </span>
                        </>
                    )}

                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover/col:translate-x-0.5 group-hover/col:text-primary transition-all duration-200" />
                </Link>
            </motion.div>

            {/* 如果收录于更多专栏 */}
            {collections.length > 1 && (
                <div className="flex items-center gap-1.5">
                    {collections.slice(1).map((col) => (
                        <motion.div
                            key={col.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link href={`/collections/${col.id}`}>
                                <span className="inline-flex items-center gap-1 text-xs font-medium h-7 px-3 rounded-full border-0 bg-white/60 dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-900/70 backdrop-blur-md text-muted-foreground hover:text-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] transition-all">
                                    <Layers className="h-3 w-3 text-primary/70" />
                                    <span>{col.name}</span>
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* 作者快速管理按钮 */}
            {isAuthor && onManageCollections && (
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onManageCollections}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border-0 cursor-pointer transition-all duration-200 bg-white/70 hover:bg-white/90 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/85 backdrop-blur-xl text-muted-foreground hover:text-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_12px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_0_12px_rgba(14,165,233,0.15)] group/manage"
                    title="管理所属专栏"
                >
                    <FolderPlus className="h-3.5 w-3.5 text-primary/70 group-hover/manage:text-primary transition-colors" />
                    <span>调整</span>
                </motion.button>
            )}
        </div>
    );
}
