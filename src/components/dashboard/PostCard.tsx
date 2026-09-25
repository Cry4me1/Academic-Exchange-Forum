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
    collectionNames?: string[];
    collections?: Array<{ id: string; name: string }>;
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
    collectionNames = [],
    collections = [],
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

    // 清洗正文摘要，过滤泄露的 Markdown 语法符号
    const cleanSummary = useMemo(() => {
        return cleanSummaryText(content);
    }, [content]);

    const finalCollections: Array<{ id?: string; name: string }> = collections.length > 0
        ? collections
        : collectionNames.map(name => ({ name }));

    const hasCover = !!coverImage;

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
    // ============================================================
    // 顶部公共作者栏组件
    // ============================================================
    function PostHeader() {
        return (
            <div className="flex items-center justify-between gap-2.5 mb-3.5">
                {/* 左侧：头像 + 昵称 + 身份徽章 + 日期（自然横向排列，严格抗折行） */}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <Link href={`/user/${author.id}`} prefetch={false} className="shrink-0 flex items-center gap-2 min-w-0">
                        <Avatar className="h-7.5 w-7.5 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] shrink-0">
                            <AvatarImage src={author.avatar} alt={author.name} />
                            <AvatarFallback className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                {author.initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-[130px]">
                            {author.name}
                        </span>
                    </Link>

                    {/* 身份徽章 - 低饱和度中性微胶囊 */}
                    {author.special_title && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] shrink-0">
                            {author.special_title}
                        </span>
                    )}

                    {/* LV.X 徽章 */}
                    <VipBadge vipLevel={authorVipLevel} size="sm" className="shrink-0" />

                    {/* 点隔断与发布时间 */}
                    <span className="text-zinc-300 dark:text-zinc-700 text-xs select-none shrink-0">·</span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal shrink-0 whitespace-nowrap" suppressHydrationWarning>
                        {formatRelativeTime(createdAt)}
                    </span>
                </div>

                {/* 右侧：所属专栏 / 置顶徽标 / 操作菜单 */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* 所属专栏指示徽章 */}
                    {finalCollections.length > 0 && (
                        <Link
                            href={`/collections/${finalCollections[0].id || ''}`}
                            prefetch={false}
                            onClick={(e) => e.stopPropagation()}
                            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 text-zinc-600 dark:text-zinc-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-colors max-w-[110px]"
                        >
                            <BookOpen className="h-2.5 w-2.5 text-zinc-400" strokeWidth={1.75} />
                            <span className="truncate">{finalCollections[0].name}</span>
                        </Link>
                    )}

                    {/* 置顶/已解决/求助徽标 */}
                    {isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            <Pin className="h-2.5 w-2.5 text-zinc-500" strokeWidth={1.75} /> {tPost.pinned}
                        </span>
                    )}
                    {isSolved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={1.75} /> {tPost.solved}
                        </span>
                    )}
                    {isHelpWanted && !isSolved && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            <HelpCircle className="h-2.5 w-2.5" strokeWidth={1.75} /> {tPost.helpWanted}
                        </span>
                    )}

                    {/* 更多操作 */}
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
    // 底部公共操作栏组件
    // ============================================================
    function PostFooter() {
        return (
            <div className="flex flex-col">
                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                <div className="flex items-center justify-between px-5 py-2.5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                    <div className="flex items-center gap-3.5">
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
                        <Link href={`/posts/${id}#comments`} prefetch={false}>
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
        );
    }

    // ============================================================
    // 1. 有封面图/附件 → 竖版卡片 (CoverCard)
    // ============================================================
    function CoverCard() {
        return (
            <div className="group rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_12px_36px_-4px_rgba(0,0,0,0.09)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_12px_36px_-4px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div className="p-5">
                    {/* 顶部作者栏 */}
                    <PostHeader />

                    {/* 图片视窗容器 (16:9 固定比例，微弱内描边，悬停微缩放) */}
                    <Link href={`/posts/${id}`} prefetch={false} className="block">
                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3.5 border-0 bg-zinc-100 dark:bg-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_8px_-2px_rgba(0,0,0,0.3)]">
                            <Image
                                src={coverImage!}
                                alt={title}
                                fill
                                unoptimized
                                referrerPolicy="no-referrer"
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQyNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                            />
                        </div>
                    </Link>

                    {/* 标题 */}
                    <Link href={`/posts/${id}`} prefetch={false} className="block group/title">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug line-clamp-2 group-hover/title:text-primary transition-colors duration-150">
                            <MathText text={title} inlineOnly />
                        </h3>
                    </Link>

                    {/* 正文摘要 (深度清洗无标记纯文本，严格最多 2 行) */}
                    {cleanSummary && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-1.5 break-words font-normal">
                            {cleanSummary}
                        </p>
                    )}

                    {/* 学科/分类 Tag (统一为水滴胶囊) */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            {tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100/80 dark:bg-zinc-800/60 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] text-zinc-600 dark:text-zinc-400 transition-colors"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* 底部交互栏 */}
                <PostFooter />
            </div>
        );
    }

    // ============================================================
    // 2. 无图纯文本 → 极简卡片 (TextOnlyCard)
    // ============================================================
    function TextOnlyCard() {
        return (
            <div className="group rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_12px_36px_-4px_rgba(0,0,0,0.09)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_12px_36px_-4px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div className="p-5">
                    {/* 顶部作者栏 */}
                    <PostHeader />

                    {/* 标题 */}
                    <Link href={`/posts/${id}`} prefetch={false} className="block group/title">
                        <h3 className="text-base sm:text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug line-clamp-2 group-hover/title:text-primary transition-colors duration-150">
                            <MathText text={title} inlineOnly />
                        </h3>
                    </Link>

                    {/* 正文摘要 (深度清洗无标记纯文本，严格最多 2 行，宽裕呼吸行高) */}
                    {cleanSummary && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-1.5 break-words font-normal">
                            {cleanSummary}
                        </p>
                    )}

                    {/* 学科/分类 Tag (统一为水滴胶囊) */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                            {tags.slice(0, 3).map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100/80 dark:bg-zinc-800/60 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] text-zinc-600 dark:text-zinc-400 transition-colors"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* 底部交互栏 */}
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
