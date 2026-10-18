"use client";

import { getPosts } from "@/app/(protected)/posts/actions";
import { AnimatePresence, motion } from "framer-motion";
import { extractTextFromContent } from "@/lib/extract-text";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FeedFilter } from "./FeedTabs";
import { PostCard } from "./PostCard";
import { PostCardSkeletonCompact, PostFeedSkeleton } from "./PostCardSkeleton";
import { useI18n } from "@/i18n/context";

// ====================
// Types
// ====================
interface PostData {
    id: string;
    title: string;
    content: object | string;
    tags: string[];
    cover_image?: string | null;
    view_count: number;
    like_count: number;
    comment_count: number;
    bookmark_count: number;
    share_count: number;
    is_solved: boolean;
    is_help_wanted: boolean;
    is_pinned: boolean;
    is_locked?: boolean;
    created_at: string;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
        special_title?: string | null;
        badges?: string[] | null;
    };
    isLiked: boolean;
    isBookmarked: boolean;
    authorVipLevel: number;
    collections?: Array<{ 
        id: string; 
        name: string;
        postCount?: number;
        onlyShowLeadPostInFeed?: boolean;
        leadPostId?: string | null;
        isLeadPost?: boolean;
    }>;
}

interface PostFeedProps {
    filter: FeedFilter;
    initialPosts?: PostData[];
}

const PAGE_SIZE = 12;

// ====================
// 动画变体
// ====================
const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: (i % 6) * 0.04,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};

// ====================
// 主组件
// ====================
export function PostFeed({ filter, initialPosts = [] }: PostFeedProps) {
    const { t, isZh } = useI18n();
    const [posts, setPosts] = useState<PostData[]>(initialPosts);
    const [isLoading, setIsLoading] = useState(initialPosts.length === 0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE || initialPosts.length === 0);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const isFirstMount = useRef(true);

    // 响应式检测：小于 768px 使用单列流，保持时间序列线性
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 使用 ref 持有最新的可变状态，避免 IntersectionObserver 闭包陷阱
    const pageRef = useRef(page);
    const hasMoreRef = useRef(hasMore);
    const isLoadingMoreRef = useRef(false);
    const filterRef = useRef(filter);
    const observerRef = useRef<IntersectionObserver | null>(null);

    pageRef.current = page;
    hasMoreRef.current = hasMore;
    filterRef.current = filter;

    // 初始加载 & filter 变化时重新加载
    useEffect(() => {
        // 关键性能优化：首次挂载且有服务端预取数据时，直接跳过客户端发起的请求
        if (isFirstMount.current) {
            isFirstMount.current = false;
            if (initialPosts.length > 0 && filter === "latest") {
                return;
            }
        }

        setIsLoading(true);
        setPage(1);
        setHasMore(true);
        pageRef.current = 1;
        hasMoreRef.current = true;
        isLoadingMoreRef.current = false;

        startTransition(async () => {
            const result = await getPosts({ filter, limit: PAGE_SIZE, page: 1 });
            const newPosts = result.posts as PostData[];
            setPosts(newPosts);
            const more = newPosts.length >= PAGE_SIZE;
            setHasMore(more);
            hasMoreRef.current = more;
            setIsLoading(false);
        });
    }, [filter]);

    // 加载更多
    const loadMore = useCallback(async () => {
        if (isLoadingMoreRef.current || !hasMoreRef.current) return;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        const nextPage = pageRef.current + 1;

        const result = await getPosts({ filter: filterRef.current, limit: PAGE_SIZE, page: nextPage });
        const newPosts = result.posts as PostData[];

        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        pageRef.current = nextPage;

        const more = newPosts.length >= PAGE_SIZE;
        setHasMore(more);
        hasMoreRef.current = more;

        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
    }, []);

    // 清理 observer
    useEffect(() => {
        return () => {
            observerRef.current?.disconnect();
        };
    }, []);

    // 绑定 IntersectionObserver
    const loadMoreRef = useCallback(
        (node: HTMLDivElement | null) => {
            observerRef.current?.disconnect();
            if (!node) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
                        loadMore();
                    }
                },
                { rootMargin: "300px" }
            );

            observer.observe(node);
            observerRef.current = observer;
        },
        [loadMore]
    );

    // ============================================================
    // 双列高度平衡贪心分列算法（Greedy Height Balancing）
    // 解决 react-masonry-css 纯轮流分配导致的大图扎堆和严重高低差
    // ============================================================
    const { leftCol, rightCol } = useMemo(() => {
        const left: { post: PostData; originalIndex: number }[] = [];
        const right: { post: PostData; originalIndex: number }[] = [];
        let leftHeight = 0;
        let rightHeight = 0;

        posts.forEach((post, idx) => {
            // 估算卡片真实物理高度：封面图约 240px，摘要与标题约 130~170px
            const hasCover = !!post.cover_image;
            const textLen = typeof post.content === "string" ? post.content.length : 100;
            const estimatedHeight = (hasCover ? 240 : 0) + (textLen > 80 ? 165 : 130);

            if (leftHeight <= rightHeight) {
                left.push({ post, originalIndex: idx });
                leftHeight += estimatedHeight + 20; // 20 为 gap-5
            } else {
                right.push({ post, originalIndex: idx });
                rightHeight += estimatedHeight + 20;
            }
        });

        return { leftCol: left, rightCol: right };
    }, [posts]);

    // 渲染卡片单项封装
    const renderCard = (post: PostData, index: number) => (
        <motion.div
            key={post.id}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
        >
            <PostCard
                id={post.id}
                author={{
                    id: post.author.id,
                    name: post.author.username || (isZh ? "学者" : "Scholar"),
                    avatar: post.author.avatar_url,
                    initials: (post.author.username || "?").slice(0, 2).toUpperCase(),
                    special_title: post.author.special_title,
                    badges: post.author.badges,
                }}
                title={post.title}
                content={extractTextFromContent(post.content)}
                coverImage={post.cover_image || undefined}
                tags={post.tags}
                createdAt={new Date(post.created_at)}
                likes={post.like_count}
                comments={post.comment_count}
                isLiked={post.isLiked}
                isBookmarked={post.isBookmarked}
                isSolved={post.is_solved}
                isHelpWanted={post.is_help_wanted}
                authorVipLevel={post.authorVipLevel}
                isPinned={post.is_pinned}
                isLocked={post.is_locked}
                collections={post.collections}
            />
        </motion.div>
    );

    // ---- 加载态 ----
    if (isLoading || isPending) {
        return <PostFeedSkeleton count={4} />;
    }

    // ---- 空态 ----
    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mb-5">
                    <svg
                        className="h-12 w-12 text-muted-foreground/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">
                    {t.dashboardComponents.postsEmpty}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    {filter === "following"
                        ? (isZh ? "关注更多学者来查看他们的动态" : "Follow more scholars to view their research feeds")
                        : t.dashboardComponents.postsEmptyDesc}
                </p>
            </div>
        );
    }

    // ---- 主列表 ----
    return (
        <div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={filter}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    {isMobile ? (
                        /* 移动端：单列线性时间流 */
                        <div className="space-y-5">
                            {posts.map((post, i) => renderCard(post, i))}
                            {/* 骨架屏无缝作为末项，零空档 */}
                            {isLoadingMore && <PostCardSkeletonCompact />}
                        </div>
                    ) : (
                        /* 桌面端：智能平衡双列瀑布流 */
                        <div className="flex gap-5 items-start">
                            {/* 左列 */}
                            <div className="flex-1 min-w-0 space-y-5">
                                {leftCol.map(({ post, originalIndex }) => renderCard(post, originalIndex))}
                                {/* 骨架屏直接挂载到列底部，绝对不会出现断档和悬空空洞 */}
                                {isLoadingMore && <PostCardSkeletonCompact />}
                            </div>

                            {/* 右列 */}
                            <div className="flex-1 min-w-0 space-y-5">
                                {rightCol.map(({ post, originalIndex }) => renderCard(post, originalIndex))}
                                {/* 骨架屏直接挂载到列底部，绝对不会出现断档和悬空空洞 */}
                                {isLoadingMore && <PostCardSkeletonCompact />}
                            </div>
                        </div>
                    )}

                    {/* 加载更多触发哨兵（微高度，不产生视觉空白） */}
                    <div ref={loadMoreRef} className="h-6 w-full -mt-2 pointer-events-none" />

                    {/* 没有更多内容提示 */}
                    {!hasMore && posts.length >= PAGE_SIZE && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8 font-medium tracking-wide">
                            — {t.dashboardComponents.noMore} —
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
