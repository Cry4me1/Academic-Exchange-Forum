"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { getCollectionCoverPreset } from "./CollectionCoverPresets";
import type { CollectionSummary } from "./PostCollectionBanner";

interface PostCollectionFooterNavProps {
    collection: CollectionSummary;
    currentPostId: string;
    className?: string;
}

export function PostCollectionFooterNav({
    collection,
    currentPostId,
    className,
}: PostCollectionFooterNavProps) {
    const posts = collection.posts || [];
    if (posts.length <= 1) return null;

    const preset = getCollectionCoverPreset(collection.cover_style);
    const PresetIcon = preset.icon;

    const currentIdx = posts.findIndex((p) => p.id === currentPostId);
    const prevPost = currentIdx > 0 ? posts[currentIdx - 1] : null;
    const nextPost = currentIdx >= 0 && currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

    if (!prevPost && !nextPost) return null;

    // 是否是专栏导读篇
    const isCurrentLead =
        !!collection.only_show_lead_post_in_feed &&
        (collection.lead_post_id ? collection.lead_post_id === currentPostId : currentIdx === 0);

    const isPrevLead =
        !!collection.only_show_lead_post_in_feed &&
        prevPost &&
        (collection.lead_post_id ? collection.lead_post_id === prevPost.id : currentIdx - 1 === 0);

    const isNextLead =
        !!collection.only_show_lead_post_in_feed &&
        nextPost &&
        (collection.lead_post_id ? collection.lead_post_id === nextPost.id : currentIdx + 1 === 0);

    return (
        <section className={cn("mt-12 mb-10", className)} aria-label="专栏连载导航">
            {/* 渐变消融顶部光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-6" />

            {/* 专栏连载导读头 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-full bg-primary/10 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                        <PresetIcon className="w-4 h-4" style={{ color: preset.accentColor }} />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">本文收录于专栏</span>
                            <Link
                                href={`/collections/${collection.id}`}
                                className="text-sm font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                                「{collection.name}」
                            </Link>
                        </div>
                        {isCurrentLead && (
                            <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>您刚阅读完本专栏主页导读篇，请翻阅下方章节继续探索</span>
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-full border-0 bg-zinc-100/60 dark:bg-zinc-800/50 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                >
                    <Link href={`/collections/${collection.id}`}>
                        <Layers className="h-3.5 w-3.5" />
                        <span>查看全部章节 ({posts.length} 篇)</span>
                    </Link>
                </Button>
            </div>

            {/* 前后篇双向导读卡 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {prevPost ? (
                    <Link
                        href={`/posts/${prevPost.id}`}
                        className="group flex flex-col justify-between p-4 rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_12px_36px_-4px_rgba(0,0,0,0.09)] transition-all text-left"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium mb-2">
                            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>上一篇</span>
                            {isPrevLead ? (
                                <Badge
                                    variant="secondary"
                                    className="h-4 px-2 text-[10px] ml-auto bg-sky-500/15 text-sky-700 dark:text-sky-300 border-0 rounded-full font-semibold"
                                >
                                    ✦ 专栏导读主篇
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="h-4 px-1.5 text-[10px] ml-auto bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border-0 rounded-full font-medium"
                                >
                                    第 {currentIdx} 篇
                                </Badge>
                            )}
                        </div>
                        <h5 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {prevPost.title}
                        </h5>
                    </Link>
                ) : (
                    <div className="hidden sm:flex flex-col justify-center p-4 rounded-2xl border-0 bg-zinc-100/40 dark:bg-zinc-900/30 text-muted-foreground/60 text-xs shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.04)]">
                        已是专栏的第一篇
                    </div>
                )}

                {nextPost ? (
                    <Link
                        href={`/posts/${nextPost.id}`}
                        className="group flex flex-col justify-between p-4 rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_12px_36px_-4px_rgba(0,0,0,0.09)] transition-all text-right sm:text-right"
                    >
                        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium mb-2">
                            {isNextLead ? (
                                <Badge
                                    variant="secondary"
                                    className="h-4 px-2 text-[10px] mr-auto bg-sky-500/15 text-sky-700 dark:text-sky-300 border-0 rounded-full font-semibold"
                                >
                                    ✦ 专栏导读主篇
                                </Badge>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="h-4 px-1.5 text-[10px] mr-auto bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border-0 rounded-full font-medium"
                                >
                                    第 {currentIdx + 2} 篇
                                </Badge>
                            )}
                            <span>下一篇</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <h5 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {nextPost.title}
                        </h5>
                    </Link>
                ) : (
                    <div className="hidden sm:flex flex-col justify-center p-4 rounded-2xl border-0 bg-zinc-100/40 dark:bg-zinc-900/30 text-muted-foreground/60 text-xs text-right shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.04)]">
                        已是专栏的最新篇章
                    </div>
                )}
            </div>
        </section>
    );
}

