"use client";

import { CollectionCard } from "@/components/collections";
import { ReputationBadge } from "@/components/duel/ReputationBadge";
import { VipBadge } from "@/components/payments/VipBadge";
import { BannerSelector, bannerGradients } from "@/components/profile/banner-selector";
import { FallingEffectController } from "@/components/profile/falling-effect-controller";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useFriends } from "@/hooks/useFriends";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    Bookmark,
    BookMarked,
    BookOpen,
    Calendar,
    Code2,
    Globe,
    Heart,
    Loader2,
    MapPin,
    MessageCircle,
    Pencil,
    Shield,
    Swords,
    UserCheck,
    UserPlus,
    VolumeX
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MathText } from "@/components/ui/math-text";
import { extractImageUrls } from "@/lib/moderation/utils";

interface UserProfile {
    id: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    gender: string | null;
    bio: string | null;
    country: string | null;
    language: string | null;
    created_at: string | null;
    reputation_score: number | null;
    duel_wins: number | null;
    duel_losses: number | null;
    is_developer: boolean | null;
    developer_title: string | null;
    banner_style: string | null;
    banner_url: string | null;
    vip_level: number | null;
    is_banned: boolean | null;
    is_muted: boolean | null;
    muted_until: string | null;
    special_title: string | null;
    badges: string[] | null;
    falling_effect: string | null;
}

interface Post {
    id: string;
    title: string;
    content: string | object;
    cover_image?: string | null;
    created_at: string;
    like_count: number;
    comment_count: number;
    review_status?: string;
    reviewer_note?: string;
    ai_reason?: string;
    is_published?: boolean;
    author?: {
        id: string;
        username: string | null;
        avatar_url?: string | null;
        is_developer?: boolean | null;
        developer_title?: string | null;
    };
}

interface LikedPost extends Post {
    liked_at: string;
}

interface BookmarkedPost extends Post {
    bookmarked_at: string;
}

interface UserCollection {
    id: string;
    name: string;
    description: string | null;
    cover_url: string | null;
    cover_style: string;
    is_public: boolean;
    post_count: number;
    updated_at: string;
}

const genderLabels: Record<string, string> = {
    male: "男",
    female: "女",
    other: "其他",
    private: "未公开",
};

/**
 * 深度清洗内容中的所有 Markdown / HTML / LaTeX 语法，提供干净整洁的纯文本摘要
 */
function cleanMarkdownText(content: string | object): string {
    if (!content) return "";
    let rawText = "";

    if (typeof content === "object") {
        try {
            const extractFromNodes = (nodes: any[]): string[] => {
                const results: string[] = [];
                for (const node of nodes) {
                    if (node.text) results.push(node.text);
                    if (node.content && Array.isArray(node.content)) {
                        results.push(...extractFromNodes(node.content));
                    }
                }
                return results;
            };
            const jsonContent = content as { content?: any[] };
            if (jsonContent.content && Array.isArray(jsonContent.content)) {
                rawText = extractFromNodes(jsonContent.content).join(" ");
            } else {
                rawText = JSON.stringify(content);
            }
        } catch {
            rawText = String(content);
        }
    } else {
        rawText = String(content);
    }

    return rawText
        // 去除 HTML 标签
        .replace(/<[^>]*>/g, " ")
        // 去除代码块
        .replace(/```[\s\S]*?```/g, " ")
        // 去除行内代码
        .replace(/`([^`]+)`/g, "$1")
        // 去除 LaTeX 块公式
        .replace(/\$\$[\s\S]*?\$\$/g, " ")
        .replace(/\\\[[\s\S]*?\\\]/g, " ")
        // 去除 LaTeX 行内公式
        .replace(/\$([^$]+)\$/g, "$1")
        .replace(/\\\((.*?)\\\)/g, "$1")
        // 去除图片和链接
        .replace(/!\[(.*?)\]\([^)]*\)/g, "$1")
        .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
        // 去除 Markdown 标题
        .replace(/^#{1,6}\s+/gm, "")
        // 去除加粗、斜体与删除线
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/~~(.*?)~~/g, "$1")
        // 去除引用符
        .replace(/^>\s+/gm, "")
        // 去除列表标识符
        .replace(/^[\s]*[-+*]\s+/gm, "")
        .replace(/^[\s]*\d+\.\s+/gm, "")
        // 去除分割线
        .replace(/^[-*_]{3,}\s*$/gm, "")
        // 压缩连续空格
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * 智能获取帖子封面图：
 * 1. 优先读取 cover_image 字段
 * 2. 降级解析 content 中的第一张图片（支持 Novel/TipTap JSON 节点与 Markdown/HTML 图片）
 */
function getPostCover(post: Post): string | null {
    if (post.cover_image && typeof post.cover_image === "string" && post.cover_image.trim()) {
        return post.cover_image.trim();
    }
    if (!post.content) return null;

    // 1. TipTap / Novel JSON 内容提取
    if (typeof post.content === "object") {
        try {
            const urls = extractImageUrls(post.content);
            if (urls.length > 0 && urls[0]) return urls[0];
        } catch {
            // ignore
        }
    }

    // 2. 字符串格式提取 (Markdown 或 HTML)
    if (typeof post.content === "string") {
        const mdMatch = post.content.match(/!\[.*?\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/);
        if (mdMatch && mdMatch[1]) return mdMatch[1];
        const htmlMatch = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (htmlMatch && htmlMatch[1]) return htmlMatch[1];
    }

    return null;
}

/**
 * Apple Liquid Glass 封面图微缩视窗组件
 * 具备菲涅尔表面微光、暗光弥散柔投影与破图优雅容错（零布局跳动）
 */
function PostCoverThumbnail({ src, alt }: { src: string; alt: string }) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return null;
    }

    return (
        <div className="relative shrink-0 block overflow-hidden rounded-xl border-0 bg-zinc-100 dark:bg-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_8px_-2px_rgba(0,0,0,0.3)] group/cover w-24 h-20 sm:w-40 sm:h-26 md:w-48 md:h-30 aspect-[16/10]">
            <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 640px) 96px, (max-width: 768px) 160px, 192px"
                className="object-cover group-hover/cover:scale-105 transition-transform duration-500 ease-out"
                unoptimized
                referrerPolicy="no-referrer"
                onError={() => setHasError(true)}
            />
            {/* Apple 表面张力菲涅尔内高光 */}
            <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]" />
        </div>
    );
}

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
    const [collections, setCollections] = useState<UserCollection[]>([]);
    const [followedCollections, setFollowedCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOnline, currentUserId: contextUserId } = usePresenceContext();
    const [currentUserId, setCurrentUserId] = useState<string | null>(contextUserId || null);
    const [isFriend, setIsFriend] = useState(false);
    const [friendRequestSent, setFriendRequestSent] = useState(false);
    const [activeTab, setActiveTab] = useState("posts");
    const [bannerStyle, setBannerStyle] = useState("default");
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);

    const supabase = createClient();
    const { sendFriendRequest } = useFriends(currentUserId);

    useEffect(() => {
        if (contextUserId) {
            setCurrentUserId(contextUserId);
        }
    }, [contextUserId]);

    useEffect(() => {
        let isMounted = true;
        async function loadData() {
            setLoading(true);
            let activeUserId = contextUserId;
            // 获取当前登录用户
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    activeUserId = user.id;
                    if (isMounted) {
                        setCurrentUserId(user.id);
                    }
                }
            } catch (err) {
                console.warn("Failed to load user in profile:", err);
            }
            if (!isMounted) return;

            // 获取目标用户的 Profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (profileError) {
                console.error("Failed to load profile:", profileError);
            } else {
                setProfile(profileData);
                if (profileData.banner_style) {
                    setBannerStyle(profileData.banner_style);
                }
                if (profileData.banner_url) {
                    setBannerUrl(profileData.banner_url);
                }
            }

            const isOwner = Boolean(
                activeUserId && (activeUserId === userId || (profileData && activeUserId === profileData.id))
            );

            // 获取该用户发布的帖子
            let postsQuery = supabase
                .from("posts")
                .select(`
                    id,
                    title,
                    content,
                    cover_image,
                    created_at,
                    like_count,
                    comment_count,
                    author_id,
                    is_published,
                    is_pinned,
                    review_status,
                    reviewer_note,
                    ai_reason
                `)
                .eq("author_id", userId);

            // 如果不是本人查看，仅展示已发布且审核通过的帖子
            if (!isOwner) {
                postsQuery = postsQuery.eq("is_published", true).eq("review_status", "approved");
            }

            const { data: postsData } = await postsQuery
                .order("is_pinned", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(30);

            if (postsData && profileData) {
                const postsWithAuthor = postsData.map((post: any) => ({
                    ...post,
                    author: {
                        id: profileData.id,
                        username: profileData.username,
                        avatar_url: profileData.avatar_url,
                        is_developer: profileData.is_developer,
                        developer_title: profileData.developer_title,
                    },
                }));
                setPosts(postsWithAuthor);
            }

            // 获取该用户点赞的帖子
            const { data: likesData } = await supabase
                .from("likes")
                .select(`
                    created_at,
                    post:posts!inner (
                        id,
                        title,
                        content,
                        cover_image,
                        created_at,
                        like_count,
                        comment_count,
                        author_id,
                        author:profiles!author_id (
                            id,
                            username,
                            avatar_url,
                            is_developer,
                            developer_title
                        )
                    )
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (likesData) {
                const likedPostsList = likesData
                    .filter((item: any) => item.post)
                    .map((item: any) => {
                        const postData = item.post as unknown as Post;
                        return {
                            ...postData,
                            liked_at: item.created_at,
                        };
                    });
                setLikedPosts(likedPostsList);
            }

            // 如果是自己的主页，获取收藏的帖子与关注的专栏
            if (isOwner) {
                const { data: bookmarksData } = await supabase
                    .from("bookmarks")
                    .select(`
                        created_at,
                        post:posts!inner (
                            id,
                            title,
                            content,
                            cover_image,
                            created_at,
                            like_count,
                            comment_count,
                            author_id,
                            author:profiles!author_id (
                                id,
                                username,
                                avatar_url,
                                is_developer,
                                developer_title
                            )
                        )
                    `)
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (bookmarksData) {
                    const bookmarkedPostsList = bookmarksData
                        .filter((item: any) => item.post)
                        .map((item: any) => {
                            const postData = item.post as unknown as Post;
                            return {
                                ...postData,
                                bookmarked_at: item.created_at,
                            };
                        });
                    setBookmarkedPosts(bookmarkedPostsList);
                }

                // 获取自己关注的专栏
                const { data: followRows } = await supabase
                    .from("collection_follows")
                    .select("collection_id, created_at")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false });

                if (followRows && followRows.length > 0) {
                    const followIds = followRows.map((f: any) => f.collection_id);
                    const { data: followCols } = await supabase
                        .from("collections")
                        .select(`
                            id, name, description, cover_url, cover_style,
                            is_public, post_count, updated_at,
                            author:profiles!author_id (id, username, avatar_url)
                        `)
                        .in("id", followIds);

                    if (followCols) {
                        const timeMap = new Map<string, string>(
                            followRows.map((f: any) => [f.collection_id as string, f.created_at as string])
                        );
                        const sorted = followCols.sort((a: any, b: any) => {
                            const tA = timeMap.get(a.id) || "";
                            const tB = timeMap.get(b.id) || "";
                            return tB.localeCompare(tA);
                        });
                        setFollowedCollections(sorted);
                    }
                }
            }

            // 获取专栏
            const { data: collectionsData } = await supabase
                .from("collections")
                .select("id, name, description, cover_url, cover_style, is_public, post_count, updated_at")
                .eq("author_id", userId)
                .eq("is_public", true)
                .order("updated_at", { ascending: false });

            if (collectionsData) {
                setCollections(collectionsData);
            }

            // 如果是本人，同时加载私有专栏
            if (isOwner) {
                const { data: privateCollections } = await supabase
                    .from("collections")
                    .select("id, name, description, cover_url, cover_style, is_public, post_count, updated_at")
                    .eq("author_id", userId)
                    .eq("is_public", false)
                    .order("updated_at", { ascending: false });

                if (privateCollections && privateCollections.length > 0) {
                    setCollections(prev => [...prev, ...privateCollections]);
                }
            }

            // 检查好友关系（仅在查看他人主页时检查）
            if (activeUserId && !isOwner) {
                const { data: friendshipData } = await supabase
                    .from("friendships")
                    .select("status")
                    .or(`and(requester_id.eq.${activeUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${activeUserId})`)
                    .maybeSingle();

                if (friendshipData) {
                    if (friendshipData.status === "accepted") {
                        setIsFriend(true);
                    } else if (friendshipData.status === "pending") {
                        setFriendRequestSent(true);
                    }
                }
            }

            if (isMounted) {
                setLoading(false);
            }
        }

        if (userId) {
            loadData();
        }

        return () => {
            isMounted = false;
        };
    }, [userId, supabase, contextUserId]);

    const handleAddFriend = async () => {
        if (!currentUserId || !userId) return;
        const success = await sendFriendRequest(userId);
        if (success) {
            setFriendRequestSent(true);
        }
    };

    const currentBannerGradient = useMemo(() => {
        return bannerGradients.find(g => g.id === bannerStyle)?.class || bannerGradients[0].class;
    }, [bannerStyle]);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
                <span className="text-xs text-zinc-400">正在加载学者主页...</span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <Shield className="h-6 w-6 text-zinc-400" />
                </div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">未找到该学者档案</h1>
                <p className="text-xs text-zinc-500 mb-5 max-w-sm">该用户可能已注销或地址有误，请核对后再试。</p>
                <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.06)] px-4 py-1.5 font-medium cursor-pointer transition-all active:scale-[0.97]">
                        返回学术主页
                    </Button>
                </Link>
            </div>
        );
    }

    const displayName = profile.username || profile.email?.split("@")[0] || "未知学者";
    const initials = displayName.charAt(0).toUpperCase();
    const isOwnProfile = Boolean(
        currentUserId && (currentUserId === userId || (profile && currentUserId === profile.id))
    );

    // 渲染帖子 Feed 卡片
    const renderPostCard = (post: Post, extraInfo?: { label: string; time: string }) => {
        const isRejected = isOwnProfile && post.review_status === "rejected";
        const isPending = isOwnProfile && post.review_status === "pending";
        const postLink = isRejected ? `/posts/${post.id}/edit` : `/posts/${post.id}`;
        const cleanExcerpt = cleanMarkdownText(post.content);
        const coverUrl = getPostCover(post);

        return (
            <div
                key={post.id}
                className="group relative rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_12px_40px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_12px_40px_-6px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5"
            >
                <div className="flex items-start justify-between gap-3.5 sm:gap-5">
                    {/* 左侧主体内容区 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5">
                        {/* 标题与状态标识 */}
                        <div className="flex items-start justify-between gap-3">
                            <Link href={postLink} className="flex-1 group/title">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors line-clamp-1 text-sm sm:text-base leading-snug">
                                    <MathText text={post.title} inlineOnly />
                                </h3>
                            </Link>
                            {isPending && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_0_8px_rgba(245,158,11,0.15)] text-[11px] font-medium shrink-0 rounded-full px-2.5 py-0.5">
                                    待审核
                                </Badge>
                            )}
                            {isRejected && (
                                <Link href={`/posts/${post.id}/edit`}>
                                    <Badge variant="destructive" className="text-[11px] shrink-0 hover:bg-destructive/90 transition-colors cursor-pointer flex items-center gap-1 rounded-full px-2.5 py-0.5 border-0 shadow-xs font-medium">
                                        <Pencil className="h-3 w-3" />
                                        <span>需修改</span>
                                    </Badge>
                                </Link>
                            )}
                        </div>

                        {/* 驳回原因提示条 */}
                        {isRejected && (
                            <div className="p-3 rounded-xl bg-red-500/8 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-xs text-red-600 dark:text-red-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-start gap-2 flex-1">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                                    <div className="leading-relaxed">
                                        <span className="font-semibold">驳回原因：</span>
                                        <span>{post.reviewer_note || post.ai_reason || "未符合学术交流规范"}</span>
                                    </div>
                                </div>
                                <Link href={`/posts/${post.id}/edit`} className="self-end sm:self-center">
                                    <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5 shrink-0 shadow-xs font-medium rounded-full border-0 px-3 cursor-pointer">
                                        <Pencil className="h-3 w-3" />
                                        前往修改
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* 摘要文本（Markdown 语法深度清洗） */}
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {cleanExcerpt || "暂无文字摘要..."}
                        </p>

                        {/* 底部元信息栏 */}
                        <div className="pt-2">
                            {/* 渐变消融微光缝 */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-2" />
                            <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {post.author && post.author.id !== userId && (
                                        <>
                                            <Link href={`/user/${post.author.id}`} className="font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                {post.author.username || "学者"}
                                            </Link>
                                            <span>·</span>
                                        </>
                                    )}
                                    <span>{new Date(post.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })}</span>
                                    {extraInfo && (
                                        <>
                                            <span>·</span>
                                            <span>{extraInfo.label}于 {new Date(extraInfo.time).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                        <Heart className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{post.like_count || 0}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                        <MessageCircle className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{post.comment_count || 0}</span>
                                    </span>
                                    {isOwnProfile && !isRejected && (
                                        <Link
                                            href={`/posts/${post.id}/edit`}
                                            className="ml-1 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                        >
                                            <Pencil className="h-3 w-3" />
                                            <span>编辑</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧封面图视窗 */}
                    {coverUrl && (
                        <Link href={postLink} className="shrink-0 group/cover">
                            <PostCoverThumbnail src={coverUrl} alt={post.title} />
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 relative selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 现代通透背景微光 */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-gradient-to-b from-zinc-200/40 via-zinc-100/20 to-transparent dark:from-zinc-800/20 dark:via-zinc-900/10 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute -top-32 left-1/4 w-96 h-96 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl" />
                <div className="absolute -top-32 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* 居中版心容器 (收敛至 max-w-4xl) */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
                {/* 顶部轻量快捷返回与四季视效微光控制栏 */}
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl px-3.5 py-1.5 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>返回广场</span>
                    </Link>

                    {/* 四季自然飘落 (樱花/细雨/落叶/初雪) 视效控制器 */}
                    <FallingEffectController
                        targetUserFallingEffect={profile.falling_effect}
                        isOwnProfile={isOwnProfile}
                        targetUserId={profile.id}
                        targetUserName={displayName}
                        onEffectChange={(newEffect) => {
                            setProfile((prev) => (prev ? { ...prev, falling_effect: newEffect } : prev));
                        }}
                    />
                </div>

                {/* 主档案卡片容器 */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_40px_-8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_12px_40px_-8px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden"
                >
                    {/* 1. Header 层次化：固定比例 Cover 横幅 */}
                    <div className={cn("w-full h-44 sm:h-52 relative transition-all duration-500 overflow-hidden", !bannerUrl && currentBannerGradient)}>
                        {/* 自定义图片横幅图层 */}
                        {bannerUrl && (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                                style={{ backgroundImage: `url(${bannerUrl})` }}
                            >
                                {/* 柔和暗微光渐变层保证网格与文字可读性 */}
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
                            </div>
                        )}

                        {/* 优雅网格纹理叠加 */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

                        {/* 右下角轻量半透明「更换封面」按钮 */}
                        {isOwnProfile && (
                            <div className="absolute bottom-3 right-3 z-10">
                                <BannerSelector
                                    currentStyle={bannerStyle}
                                    currentBannerUrl={bannerUrl}
                                    onStyleChange={setBannerStyle}
                                    onBannerUrlChange={(url) => {
                                        setBannerUrl(url);
                                        setProfile((prev) => (prev ? { ...prev, banner_url: url } : prev));
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* 封禁/禁言状态条 */}
                    {profile.is_banned && (
                        <div className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                            <Ban className="h-4 w-4 shrink-0" />
                            <span>该用户已被系统封禁限制</span>
                        </div>
                    )}
                    {!profile.is_banned && profile.is_muted && (
                        <div className="flex items-center gap-2 px-6 py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                            <VolumeX className="h-4 w-4 shrink-0" />
                            <span>该用户处于禁言状态</span>
                            {profile.muted_until && (
                                <span className="opacity-75">
                                    （至 {new Date(profile.muted_until).toLocaleString("zh-CN")}）
                                </span>
                            )}
                        </div>
                    )}

                    {/* 用户核心信息区域 */}
                    <div className="px-5 sm:px-7 pb-6 pt-0">
                        {/* 悬浮重叠头像与右侧主操作按钮 */}
                        <div className="flex items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
                            {/* 头像：半重叠悬浮，带水滴流体曲率与柔和投影，以及在线状态指示灯 */}
                            <div className="relative inline-block shrink-0 select-none">
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_-4px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_8px_24px_-4px_rgba(0,0,0,0.5)] ring-4 ring-white/90 dark:ring-zinc-900/90 bg-zinc-100 dark:bg-zinc-800 backdrop-blur-md">
                                    <AvatarImage src={profile.avatar_url || ""} alt={displayName} className="object-cover rounded-3xl" />
                                    <AvatarFallback className="text-3xl sm:text-4xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-3xl">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                {/* 在线状态指示小圆点 */}
                                <span
                                    title={isOnline(profile.id) ? "当前在线" : "离线"}
                                    className={cn(
                                        "absolute -bottom-1 -right-1 z-20 rounded-full ring-3 ring-white dark:ring-zinc-900 transition-all",
                                        isOnline(profile.id)
                                            ? "h-5 w-5 bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            : "h-4 w-4 bg-zinc-400 dark:bg-zinc-500"
                                    )}
                                >
                                    {isOnline(profile.id) && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 animate-pulse" />
                                    )}
                                </span>
                            </div>

                            {/* 交互操作区 */}
                            <div className="flex items-center gap-2 shrink-0 pb-1">
                                {!isOwnProfile && currentUserId && (
                                    <>
                                        {isFriend ? (
                                            <Link href={`/messages?user=${userId}`}>
                                                <Button size="sm" className="h-8 px-4 text-xs font-medium rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)] gap-1.5 transition-all active:scale-[0.97] cursor-pointer">
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    <span>发送私信</span>
                                                </Button>
                                            </Link>
                                        ) : friendRequestSent ? (
                                            <Button disabled variant="outline" size="sm" className="h-8 px-4 text-xs font-medium rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-400 gap-1.5">
                                                <UserCheck className="h-3.5 w-3.5" />
                                                <span>已发好友申请</span>
                                            </Button>
                                        ) : (
                                            <Button onClick={handleAddFriend} size="sm" className="h-8 px-4 text-xs font-medium rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)] gap-1.5 transition-all active:scale-[0.97] cursor-pointer">
                                                <UserPlus className="h-3.5 w-3.5" />
                                                <span>添加好友</span>
                                            </Button>
                                        )}
                                    </>
                                )}

                                {isOwnProfile && (
                                    <Link href="/settings/profile">
                                        <Button variant="ghost" size="sm" className="h-8 px-3.5 text-xs font-medium rounded-full border-0 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_8px_-1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_2px_8px_-1px_rgba(0,0,0,0.3)] gap-1.5 transition-all active:scale-[0.97] cursor-pointer">
                                            <Pencil className="h-3.5 w-3.5" />
                                            <span>编辑个人资料</span>
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* 昵称与高权重 Badge */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {displayName}
                                </h1>

                                {/* 单个高权重角色 Badge */}
                                {profile.is_developer ? (
                                    <span className="inline-flex items-center gap-1 h-5 px-2.5 rounded-full text-[11px] font-medium bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_1px_4px_rgba(0,0,0,0.3)] shrink-0">
                                        <Code2 className="h-3 w-3 text-zinc-500" strokeWidth={2} />
                                        <span>{profile.developer_title || "系统开发者"}</span>
                                    </span>
                                ) : profile.special_title ? (
                                    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-medium bg-violet-500/15 dark:bg-violet-500/25 text-violet-700 dark:text-violet-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_0_8px_rgba(139,92,246,0.15)] shrink-0">
                                        {profile.special_title}
                                    </span>
                                ) : (
                                    <VipBadge vipLevel={profile.vip_level || 1} size="sm" showTitle className="shrink-0" />
                                )}

                                {/* 信誉积分微徽章 */}
                                {profile.reputation_score !== null && (
                                    <ReputationBadge
                                        score={profile.reputation_score}
                                        wins={profile.duel_wins || 0}
                                        losses={profile.duel_losses || 0}
                                        size="sm"
                                        showStats={false}
                                        isDeveloper={profile.is_developer || undefined}
                                        developerTitle={profile.developer_title || undefined}
                                    />
                                )}
                            </div>

                            {/* 简介 (Bio) */}
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl pt-1">
                                {profile.bio || "该学者潜心治学，暂未填写个性简介。"}
                            </p>
                        </div>

                        {/* 横向排布的 Lucide 元信息 Meta 标签 */}
                        <div className="mt-4 pt-3 space-y-3">
                            {/* 渐变消融微光缝 */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                                {profile.gender && profile.gender !== "private" && (
                                    <span className="inline-flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                        <span>{genderLabels[profile.gender] || profile.gender}</span>
                                    </span>
                                )}
                                {profile.country && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{profile.country}</span>
                                    </span>
                                )}
                                {profile.language && (
                                    <span className="inline-flex items-center gap-1">
                                        <Globe className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{profile.language === "zh" ? "中文" : profile.language === "en" ? "English" : profile.language}</span>
                                    </span>
                                )}
                                {profile.created_at && (
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{new Date(profile.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long" })} 加入社区</span>
                                    </span>
                                )}
                                {(profile.duel_wins || 0) + (profile.duel_losses || 0) > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <Swords className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>学术辩论 {profile.duel_wins || 0} 胜 / {profile.duel_losses || 0} 负</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 荣誉勋章与细致角色标签 */}
                        {profile.badges && profile.badges.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-1">
                                {profile.badges.map((badge, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-normal bg-zinc-100/80 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. 现代化 Tabs 切换栏与 Post Feed 列表 */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
                    className="space-y-4"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        {/* 现代化 TabsList 切换条 */}
                        <div className="pb-2">
                            <TabsList className="h-auto p-1.5 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.2)] flex flex-wrap gap-1 w-full sm:w-auto justify-start">
                                <TabsTrigger
                                    value="posts"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>帖子</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                                        {posts.length}
                                    </span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="collections"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>专栏</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                                        {collections.length}
                                    </span>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="likes"
                                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Heart className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>点赞</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                                        {likedPosts.length}
                                    </span>
                                </TabsTrigger>

                                {isOwnProfile && (
                                    <>
                                        <TabsTrigger
                                            value="bookmarks"
                                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
                                            <span>收藏</span>
                                            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                                                {bookmarkedPosts.length}
                                            </span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="followed_collections"
                                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800/90 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.15)] text-zinc-600 dark:text-zinc-400 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <BookMarked className="h-3.5 w-3.5 text-zinc-400" />
                                            <span>关注专栏</span>
                                            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-medium bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300">
                                                {followedCollections.length}
                                            </span>
                                        </TabsTrigger>
                                    </>
                                )}
                            </TabsList>
                        </div>

                        {/* 3. 帖子内容列表 */}
                        <TabsContent value="posts" className="pt-2">
                            {posts.length > 0 ? (
                                <div className="space-y-3">
                                    {posts.map((post) => renderPostCard(post))}
                                </div>
                            ) : (
                                <div className="text-center py-14 border-0 rounded-3xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_-4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.2)]">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                                        <Pencil className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">暂无发布的学术帖子</p>
                                    {isOwnProfile && (
                                        <Link href="/posts/new">
                                            <Button variant="outline" size="sm" className="mt-3 text-xs rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.06)] px-4 py-1.5 font-medium cursor-pointer transition-all active:scale-[0.97]">
                                                发布第一篇学术讨论
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* 专栏列表 */}
                        <TabsContent value="collections" className="pt-2">
                            {collections.length > 0 ? (
                                <div className="space-y-4">
                                    {isOwnProfile && (
                                        <div className="flex justify-end">
                                            <Link href="/collections/manage">
                                                <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.06)] px-4 py-1.5 font-medium cursor-pointer transition-all active:scale-[0.97]">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    <span>管理我的专栏</span>
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {collections.map((col) => (
                                            <CollectionCard
                                                key={col.id}
                                                id={col.id}
                                                name={col.name}
                                                description={col.description}
                                                coverUrl={col.cover_url}
                                                coverStyle={col.cover_style}
                                                postCount={col.post_count}
                                                isPublic={col.is_public}
                                                updatedAt={col.updated_at}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-14 border-0 rounded-3xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_-4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.2)]">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">
                                        {isOwnProfile ? "您还没有创建任何学术专栏" : "该学者暂未创建学术专栏"}
                                    </p>
                                    {isOwnProfile && (
                                        <Link href="/collections/manage">
                                            <Button variant="outline" size="sm" className="mt-3 text-xs rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.06)] px-4 py-1.5 font-medium cursor-pointer transition-all active:scale-[0.97]">
                                                创建第一个专栏
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* 点赞列表 */}
                        <TabsContent value="likes" className="pt-2">
                            {likedPosts.length > 0 ? (
                                <div className="space-y-3">
                                    {likedPosts.map((post) =>
                                        renderPostCard(post, { label: "赞过", time: post.liked_at })
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-14 border-0 rounded-3xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_-4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.2)]">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                                        <Heart className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">暂无点赞的帖子</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* 收藏列表 (本人) */}
                        {isOwnProfile && (
                            <>
                                <TabsContent value="bookmarks" className="pt-2">
                                    {bookmarkedPosts.length > 0 ? (
                                        <div className="space-y-3">
                                            {bookmarkedPosts.map((post) =>
                                                renderPostCard(post, { label: "收藏", time: post.bookmarked_at })
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-14 border-0 rounded-3xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_-4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.2)]">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                                                <Bookmark className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs text-zinc-500 font-medium">暂无收藏的帖子</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="followed_collections" className="pt-2">
                                    {followedCollections.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {followedCollections.map((col) => (
                                                <CollectionCard
                                                    key={col.id}
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
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-14 border-0 rounded-3xl bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_8px_32px_-4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.2)]">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-400">
                                                <BookMarked className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs text-zinc-500 font-medium">还没有关注任何学术专栏</p>
                                            <Link href="/trending">
                                                <Button variant="outline" size="sm" className="mt-3 text-xs rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-1px_rgba(0,0,0,0.06)] px-4 py-1.5 font-medium cursor-pointer transition-all active:scale-[0.97]">
                                                    探索热门学术专栏
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </motion.div>
            </div>
        </div>
    );
}
