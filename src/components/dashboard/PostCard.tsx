"use client";

import { createShareRecord, toggleBookmarkPost, toggleLikePost } from "@/app/posts/[id]/actions";
import { VipBadge } from "@/components/payments/VipBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/math-text";
import { cleanSummaryText } from "@/lib/extract-text";
import { motion } from "framer-motion";
import {
    Bookmark,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Heart,
    HelpCircle,
    Lock,
    MessageCircle,
    MoreHorizontal,
    Pin,
    Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/context";

// ============================================================
// Types
// ============================================================
export interface PostCardProps {
    id: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
        initials: string;
        special_title?: string | null;
        badges?: string[] | null;
    };
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    likes: number;
    comments: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
    isSolved?: boolean;
    isHelpWanted?: boolean;
    coverImage?: string;
    authorVipLevel?: number;
    isPinned?: boolean;
    isLocked?: boolean;
    collectionNames?: string[];
    collections?: Array<{
        id: string;
        name: string;
        postCount?: number;
        onlyShowLeadPostInFeed?: boolean;
        leadPostId?: string | null;
        isLeadPost?: boolean;
    }>;
    leadCollection?: { id: string; name: string; postCount?: number } | null;
}

// ============================================================
// 主组件
// ============================================================
export function PostCard({
    id,
    author,
    title,
    content,
    tags,
    createdAt,
    likes,
    comments,
    isLiked: initialIsLiked = false,
    isBookmarked: initialIsBookmarked = false,
    isSolved = false,
    isHelpWanted = false,
    coverImage,
    authorVipLevel = 1,
    isPinned = false,
    isLocked = false,
    collectionNames = [],
    collections = [],
    leadCollection: leadCollectionProp,
}: PostCardProps) {
    const { t, isZh } = useI18n();
    const tPost = t.postCard;

    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(likes);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isPending, startTransition] = useTransition();
    const [justLiked, setJustLiked] = useState(false);
    const [justBookmarked, setJustBookmarked] = useState(false);

    // 格式化相对时间
    const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return tPost.justNow;
        if (diffMins < 60) return `${diffMins} ${tPost.minsAgo}`;
        if (diffHours < 24) return `${diffHours} ${tPost.hoursAgo}`;
        if (diffDays < 7) return `${diffDays} ${tPost.daysAgo}`;

        return date.toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "numeric", day: "numeric" });
    };

    // 计算是否为专栏导读文章
    const leadCollection = useMemo(() => {
        if (leadCollectionProp) return leadCollectionProp;
        const found = collections.find((c) => c.isLeadPost || c.onlyShowLeadPostInFeed);
        if (found) {
            return {
                id: found.id,
                name: found.name,
                postCount: found.postCount,
            };
        }
        return null;
    }, [leadCollectionProp, collections]);

    // 清洗正文摘要，过滤泄露的 Markdown 语法符号
    const cleanSummary = useMemo(() => {
        return cleanSummaryText(content);
    }, [content]);

    const finalCollections: Array<{ id?: string; name: string }> = collections.length > 0
        ? collections
        : collectionNames.map((name) => ({ name }));

    const hasCover = !!coverImage;

    // 收纳核心标签：专栏 + 学科标签，统一绝对锁定最多展示 2 个
    const coreLabels = useMemo(() => {
        const labels: Array<{ type: "collection" | "tag"; text: string; id?: string }> = [];
        // 专栏优先（若存在）
        if (finalCollections.length > 0 && finalCollections[0]?.name) {
            const colName = finalCollections[0].name.trim();
            if (colName) {
                labels.push({ type: "collection", text: colName, id: finalCollections[0].id });
            }
        }
        // 然后填充学科标签，总数绝对锁死不超过 2 个
        for (const tag of tags) {
            if (labels.length >= 2) break;
            const cleanTag = typeof tag === "string" ? tag.trim() : "";
            if (cleanTag) {
                labels.push({ type: "tag", text: cleanTag });
            }
        }
        return labels.slice(0, 2);
    }, [finalCollections, tags]);

    // ---- 事件处理 ----
    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        if (newLiked) {
            setJustLiked(true);
            setTimeout(() => setJustLiked(false), 600);
        }

        startTransition(async () => {
            const result = await toggleLikePost(id);
            if (result.error) {
                setIsLiked(!newLiked);
                setLikeCount(newLiked ? likeCount : likeCount + 1);
                toast.error(result.error);
            }
        });
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        if (newBookmarked) {
            setJustBookmarked(true);
            setTimeout(() => setJustBookmarked(false), 700);
        }

        startTransition(async () => {
            const result = await toggleBookmarkPost(id);
            if (result.error) {
                setIsBookmarked(!newBookmarked);
                toast.error(result.error);
            } else {
                toast.success(newBookmarked ? tPost.bookmarked : tPost.unbookmarked);
            }
        });
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/posts/${id}`);
            toast.success(tPost.linkCopied);
            createShareRecord(id, "copy_link");
        } catch {
            toast.error(tPost.copyFailed);
        }
    };

    // ---- 两种卡片模式 ----
    if (hasCover) {
        return <CoverCard />;
    }
    return <TextOnlyCard />;

    // ============================================================
    // 顶部公共作者栏组件（精简：头像 + 昵称 + Lv等级 + 时间）
    // special_title 仅在头像 tooltip 中展示，不再独占视觉行空间
    // ============================================================
    function PostHeader() {
        return (
            <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                {/* 左侧：头像 + 昵称 + 等级 + 时间（严谨单行锁死） */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    <Link href={`/user/${author.id}`} prefetch={false} className="shrink-0 flex items-center gap-1.5">
                        <Avatar className="h-7 w-7 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] shrink-0">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                {author.initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors truncate max-w-[85px] sm:max-w-[130px]">
                            {author.name}
                        </span>
                    </Link>

                    {/* 学者等级徽章：紧随昵称 */}
                    <VipBadge vipLevel={authorVipLevel} size="xs" className="shrink-0" />

                    {/* 点隔断与发布时间 */}
                    <span className="text-zinc-300 dark:text-zinc-700 text-xs select-none shrink-0">·</span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal shrink-0 whitespace-nowrap" suppressHydrationWarning>
                        {formatRelativeTime(createdAt)}
                    </span>
                </div>

                {/* 右侧：更多操作菜单 */}
                <div className="flex items-center shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity border-0 active:scale-90 cursor-pointer"
                                aria-label="更多帖子操作"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs border-0 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_12px_40px_-4px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_12px_40px_-4px_rgba(0,0,0,0.5)]">
                            <DropdownMenuItem>{tPost.report}</DropdownMenuItem>
                            <DropdownMenuItem>{tPost.blockAuthor}</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare}>{tPost.copyLink}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    }

    // ============================================================
    // 标题行：内联置顶/求助/已解决微标记 + 标题文本
    // 状态指示器不再独占一整行，而是以微型图标形式嵌入标题前
    // ============================================================
    function PostTitle() {
        const hasStatusIndicator = isPinned || (isHelpWanted && !isSolved) || isSolved || isLocked;

        return (
            <Link href={`/posts/${id}`} prefetch={false} className="block group/title">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug line-clamp-2 group-hover/title:text-primary transition-colors duration-150">
                    {/* 专栏导读篇内联微标记 */}
                    {leadCollection && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border-0 shadow-[0_0_8px_rgba(14,165,233,0.18)] mr-1.5 align-middle select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            ✦ 专栏导读
                        </span>
                    )}

                    {/* 内联状态微标记：置顶/求助/已解决 */}
                    {hasStatusIndicator && (
                        <span className="inline-flex items-center gap-1 mr-1.5 align-middle">
                            {isPinned && (
                                <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-amber-500/10 dark:bg-amber-400/10 shrink-0" title={tPost.pinned}>
                                    <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400 fill-current" strokeWidth={1.75} />
                                </span>
                            )}
                            {isHelpWanted && !isSolved && (
                                <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-orange-500/10 dark:bg-orange-400/10 shrink-0" title={tPost.helpWanted}>
                                    <HelpCircle className="h-3 w-3 text-orange-500 dark:text-orange-400" strokeWidth={1.75} />
                                </span>
                            )}
                            {isSolved && (
                                <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 shrink-0" title={tPost.solved}>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" strokeWidth={1.75} />
                                </span>
                            )}
                            {isLocked && (
                                <span className="inline-flex items-center justify-center h-[18px] w-[18px] rounded-full bg-zinc-500/10 dark:bg-zinc-400/10 shrink-0" title="评论区锁定">
                                    <Lock className="h-3 w-3 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
                                </span>
                            )}
                        </span>
                    )}
                    <MathText text={title} inlineOnly />
                </h3>
            </Link>
        );
    }

    // ============================================================
    // 底部公共操作栏：互动按钮 + 核心标签（锁定最多2个，防挤压防换行防御）
    // ============================================================
    function PostFooter() {
        return (
            <div className="flex flex-col">
                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md min-w-0 flex-nowrap">
                    {/* 左侧：互动按钮（锁定 shrink-0 绝不被压缩、绝不折行） */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                        <ActionButton
                            icon={<Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} strokeWidth={1.75} />}
                            count={likeCount}
                            active={isLiked}
                            activeColor="text-rose-500 dark:text-rose-400"
                            onClick={handleLike}
                            disabled={isPending}
                            animate={justLiked}
                            particleType="heart"
                        />
                        <Link href={`/posts/${id}#comments`} prefetch={false} className="shrink-0">
                            <ActionButton
                                icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />}
                                count={comments}
                                hoverColor="hover:text-zinc-900 dark:hover:text-zinc-100"
                            />
                        </Link>
                        <ActionButton
                            icon={<Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
                            onClick={handleShare}
                            hoverColor="hover:text-zinc-900 dark:hover:text-zinc-100"
                        />
                    </div>

                    {/* 右侧：核心标签（锁定最多 2 个且限制单个最大宽度 + 省略号） + 收藏按钮 */}
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink justify-end">
                        {/* 核心标签 —— 专栏/学科统一收纳，宽度上限防御 */}
                        {coreLabels.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 min-w-0 overflow-hidden">
                                {coreLabels.map((label, idx) => {
                                    if (label.type === "collection" && label.id) {
                                        return (
                                            <Link
                                                key={`col-${idx}`}
                                                href={`/collections/${label.id}`}
                                                prefetch={false}
                                                onClick={(e) => e.stopPropagation()}
                                                title={label.text}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100/80 dark:bg-zinc-800/60 hover:bg-zinc-200/90 dark:hover:bg-zinc-700/80 text-zinc-500 dark:text-zinc-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-colors max-w-[76px] md:max-w-[88px] lg:max-w-[104px] shrink-0"
                                            >
                                                <BookOpen className="h-2.5 w-2.5 shrink-0" strokeWidth={1.75} />
                                                <span className="truncate">{label.text}</span>
                                            </Link>
                                        );
                                    }
                                    return (
                                        <span
                                            key={`tag-${idx}`}
                                            title={label.text}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100/80 dark:bg-zinc-800/60 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] text-zinc-500 dark:text-zinc-400 max-w-[76px] md:max-w-[88px] lg:max-w-[104px] truncate shrink-0"
                                        >
                                            {label.text}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* 垂直消融分割线 */}
                        {coreLabels.length > 0 && (
                            <div className="hidden sm:block shrink-0 w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5" />
                        )}

                        <div className="shrink-0">
                            <ActionButton
                                icon={<Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} strokeWidth={1.75} />}
                                active={isBookmarked}
                                activeColor="text-amber-500 dark:text-amber-400"
                                onClick={handleBookmark}
                                disabled={isPending}
                                hoverColor="hover:text-zinc-900 dark:hover:text-zinc-100"
                                animate={justBookmarked}
                                particleType="star"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // 1. 有封面图/附件 → 竖版卡片 (CoverCard)
    // 层级：作者信息 → 封面图 → 标题（含内联状态微标记） → 2行摘要 → 底部互动+标签
    // ============================================================
    function CoverCard() {
        return (
            <div className="group rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_12px_36px_-4px_rgba(0,0,0,0.09)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_12px_36px_-4px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div className="p-5">
                    {/* 第一层：作者信息 */}
                    <PostHeader />

                    {/* 封面图 (16:9) */}
                    <Link href={`/posts/${id}`} prefetch={false} className="block group/cover">
                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3.5 border-0 bg-zinc-100 dark:bg-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_8px_-2px_rgba(0,0,0,0.3)]">
                            <Image
                                src={coverImage!}
                                alt={title}
                                fill
                                unoptimized
                                referrerPolicy="no-referrer"
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-cover group-hover/cover:scale-[1.03] transition-transform duration-500 ease-out"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                            />

                            {/* 专栏导读篇专属封面浮光微胶囊标记 */}
                            {leadCollection && (
                                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/60 hover:bg-black/75 text-white backdrop-blur-xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5),0_4px_16px_rgba(0,0,0,0.4)] transition-all select-none">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                                    <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span className="font-semibold text-sky-300">专栏导读</span>
                                    <span className="text-white/90 truncate max-w-[120px]">「{leadCollection.name}」</span>
                                    {(leadCollection as any).postCount ? (
                                        <span className="text-white/70 text-[10px] font-normal">
                                            ({(leadCollection as any).postCount}篇)
                                        </span>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* 第二层：标题（内联状态微标记） */}
                    <PostTitle />

                    {/* 第三层：正文摘要（深度清洗，严格 2 行） */}
                    {cleanSummary && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-1.5 break-words font-normal">
                            {cleanSummary}
                        </p>
                    )}
                </div>

                {/* 第四层：底部互动 + 核心标签 */}
                <PostFooter />
            </div>
        );
    }

    // ============================================================
    // 2. 无图纯文本 → 极简卡片 (TextOnlyCard)
    // 层级：作者信息 → 标题（含内联状态微标记） → 2行摘要 → 底部互动+标签
    // ============================================================
    function TextOnlyCard() {
        return (
            <div className="group rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_12px_36px_-4px_rgba(0,0,0,0.09)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_12px_36px_-4px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div className="p-5">
                    {/* 第一层：作者信息 */}
                    <PostHeader />

                    {/* 第二层：标题（内联状态微标记） */}
                    <PostTitle />

                    {/* 第三层：正文摘要（深度清洗，严格 2 行） */}
                    {cleanSummary && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-1.5 break-words font-normal">
                            {cleanSummary}
                        </p>
                    )}
                </div>

                {/* 第四层：底部互动 + 核心标签 */}
                <PostFooter />
            </div>
        );
    }
}

// ============================================================
// 互动按钮子组件
// ============================================================
interface ActionButtonProps {
    icon: React.ReactNode;
    count?: number;
    active?: boolean;
    activeColor?: string;
    hoverColor?: string;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
    animate?: boolean;
    particleType?: "heart" | "star";
}

// 生成粒子配置
function generateParticles(type: "heart" | "star") {
    const count = type === "heart" ? 6 : 5;
    const colors =
        type === "heart"
            ? ["#ef4444", "#f87171", "#fca5a5", "#fb923c", "#f472b6", "#e879f9"]
            : ["#f59e0b", "#fbbf24", "#fcd34d", "#fb923c", "#f97316"];

    return Array.from({ length: count }, (_, i) => {
        const angle = (360 / count) * i + (Math.random() * 30 - 15);
        const distance = 16 + Math.random() * 12;
        const rad = (angle * Math.PI) / 180;
        return {
            tx: Math.cos(rad) * distance,
            ty: Math.sin(rad) * distance,
            color: colors[i % colors.length],
            size: type === "heart" ? 4 + Math.random() * 2 : 5 + Math.random() * 3,
            delay: i * 0.03,
        };
    });
}

function ActionButton({
    icon,
    count,
    active = false,
    activeColor = "",
    hoverColor = "",
    onClick,
    disabled = false,
    animate = false,
    particleType,
}: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-150 select-none border-0",
                "text-zinc-500 dark:text-zinc-400 hover:bg-white/70 dark:hover:bg-zinc-800/70",
                active ? activeColor : hoverColor,
                disabled && "opacity-50"
            )}
        >
            {/* 粒子爆散层 */}
            {animate && particleType && (
                <span className="absolute inset-0 flex items-center justify-start pl-2 pointer-events-none overflow-visible">
                    {generateParticles(particleType).map((p, i) => (
                        <span
                            key={i}
                            className={particleType === "heart" ? "particle" : "star-particle"}
                            style={{
                                width: p.size,
                                height: p.size,
                                backgroundColor: particleType === "heart" ? p.color : undefined,
                                animationDelay: `${p.delay}s`,
                                "--tx": `${p.tx}px`,
                                "--ty": `${p.ty}px`,
                            } as React.CSSProperties}
                        >
                            {particleType === "star" && (
                                <svg width={p.size} height={p.size} viewBox="0 0 12 12" fill={p.color}>
                                    <path d="M6 0l1.76 3.57L12 4.18 8.82 7.07l.94 4.14L6 9.27 2.24 11.21l.94-4.14L0 4.18l4.24-.61z" />
                                </svg>
                            )}
                        </span>
                    ))}
                </span>
            )}

            <motion.span
                animate={animate ? { scale: [1, 1.3, 0.95, 1.1, 1] } : {}}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="inline-flex"
            >
                {icon}
            </motion.span>
            {count !== undefined && count > 0 && (
                <span className="tabular-nums font-mono text-[11px]">{count}</span>
            )}
        </button>
    );
}
