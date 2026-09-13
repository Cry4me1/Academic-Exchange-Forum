"use client";

import { GlobalSearch } from "@/components/dashboard";
import { UserSearchCard, UserSearchCardStats, RecentPostPreview } from "@/components/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useFriends } from "@/hooks/useFriends";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, Heart, Loader2, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

interface SearchResultPost {
    id: string;
    title: string;
    content: string | object;
    tags: string[];
    created_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    author: {
        id: string;
        username: string;
        avatar_url?: string;
    };
}

interface SearchResultUser {
    id: string;
    username: string;
    avatar_url?: string | null;
    bio?: string | null;
    banner_style?: string | null;
    banner_url?: string | null;
    is_developer?: boolean | null;
    developer_title?: string | null;
    vip_level?: number | null;
    special_title?: string | null;
    reputation_score?: number | null;
    stats?: UserSearchCardStats;
    recentPost?: RecentPostPreview | null;
    isFriend?: boolean;
    isFriendPending?: boolean;
}

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

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const [posts, setPosts] = useState<SearchResultPost[]>([]);
    const [users, setUsers] = useState<SearchResultUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "posts" | "users">("all");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

    const supabase = createClient();
    const { isOnline } = usePresenceContext();
    const { sendFriendRequest } = useFriends(currentUserId);

    useEffect(() => {
        async function performSearch() {
            if (!query.trim()) {
                setPosts([]);
                setUsers([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            // 获取当前登录用户
            const { data: { user } } = await supabase.auth.getUser();
            const myId = user?.id || null;
            setCurrentUserId(myId);

            // Fetch posts matching the query
            const { data: postsData, error: postsError } = await supabase
                .from("posts")
                .select(`
                    id, title, content, tags, created_at, view_count, like_count, comment_count,
                    author:profiles!author_id (id, username, avatar_url)
                `)
                .eq("is_published", true)
                .eq("is_hidden", false)
                .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
                .order("created_at", { ascending: false })
                .limit(20);

            if (postsError) {
                console.error("Failed to search posts:", postsError);
            } else if (postsData) {
                setPosts(postsData as unknown as SearchResultPost[]);
            }

            // Fetch users matching the query
            const { data: usersData, error: usersError } = await supabase
                .from("profiles")
                .select(`
                    id, username, avatar_url, bio, banner_style, banner_url,
                    is_developer, developer_title, vip_level, special_title, reputation_score
                `)
                .ilike("username", `%${query}%`)
                .limit(12);

            if (usersError) {
                console.error("Failed to search users:", usersError);
            } else if (usersData && usersData.length > 0) {
                const userIds = usersData.map((u: any) => u.id as string);

                // 查询这批用户的最新帖子与统计
                const [postsCountRes, recentPostsRes, friendshipsRes] = await Promise.all([
                    // 帖子数统计
                    supabase
                        .from("posts")
                        .select("author_id, like_count")
                        .in("author_id", userIds)
                        .eq("is_published", true),
                    // 最近发表的帖子
                    supabase
                        .from("posts")
                        .select("id, title, author_id, created_at")
                        .in("author_id", userIds)
                        .eq("is_published", true)
                        .order("created_at", { ascending: false }),
                    // 好友关系（若已登录）
                    myId
                        ? supabase
                              .from("friendships")
                              .select("requester_id, addressee_id, status")
                              .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)
                        : Promise.resolve({ data: [] }),
                ]);

                // 统计每个用户的帖子数和点赞总数
                const statsMap: Record<string, UserSearchCardStats> = {};
                if (postsCountRes.data) {
                    for (const p of postsCountRes.data as Array<{ author_id: string; like_count: number }>) {
                        if (!statsMap[p.author_id]) {
                            statsMap[p.author_id] = { postsCount: 0, likesCount: 0 };
                        }
                        statsMap[p.author_id].postsCount = (statsMap[p.author_id].postsCount || 0) + 1;
                        statsMap[p.author_id].likesCount = (statsMap[p.author_id].likesCount || 0) + (p.like_count || 0);
                    }
                }

                // 获取每个用户的最新一条帖子
                const recentPostMap: Record<string, RecentPostPreview> = {};
                if (recentPostsRes.data) {
                    for (const p of recentPostsRes.data as Array<{ id: string; title: string; author_id: string; created_at: string }>) {
                        if (!recentPostMap[p.author_id]) {
                            recentPostMap[p.author_id] = {
                                id: p.id,
                                title: p.title,
                                createdAt: p.created_at,
                            };
                        }
                    }
                }

                // 好友关系映射
                const friendMap: Record<string, { isFriend: boolean; isFriendPending: boolean }> = {};
                if (friendshipsRes.data) {
                    for (const f of friendshipsRes.data as Array<{ requester_id: string; addressee_id: string; status: string }>) {
                        const targetId = f.requester_id === myId ? f.addressee_id : f.requester_id;
                        if (f.status === "accepted") {
                            friendMap[targetId] = { isFriend: true, isFriendPending: false };
                        } else if (f.status === "pending") {
                            friendMap[targetId] = { isFriend: false, isFriendPending: true };
                        }
                    }
                }

                const enrichedUsers: SearchResultUser[] = (usersData as any[]).map((u: any) => {
                    const uStats = statsMap[u.id] || { postsCount: 0, likesCount: 0 };
                    return {
                        ...u,
                        stats: {
                            postsCount: uStats.postsCount || 0,
                            likesCount: uStats.likesCount || 0,
                            reputationScore: u.reputation_score ?? 100,
                        },
                        recentPost: recentPostMap[u.id] || null,
                        isFriend: friendMap[u.id]?.isFriend || false,
                        isFriendPending: friendMap[u.id]?.isFriendPending || false,
                    };
                });

                setUsers(enrichedUsers);
            } else {
                setUsers([]);
            }

            setLoading(false);
        }

        performSearch();
    }, [supabase, query]);

    const handleAddFriend = async (targetUserId: string) => {
        if (!currentUserId) {
            toast.error("请先登录后再添加好友");
            return;
        }
        if (targetUserId === currentUserId) {
            toast.error("无法添加自己为好友");
            return;
        }

        setAddingFriendId(targetUserId);
        try {
            const success = await sendFriendRequest(targetUserId);
            if (success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === targetUserId ? { ...u, isFriendPending: true } : u
                    )
                );
                toast.success("好友申请已发送");
            }
        } catch {
            toast.error("发送申请失败，请稍后重试");
        } finally {
            setAddingFriendId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 头部 */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <GlobalSearch className="max-w-md w-full" />
                </div>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {query ? `"${query}" 的搜索结果` : "搜索"}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    找到 {posts.length} 篇帖子，{users.length} 位学者
                </p>
            </div>

            {/* 标签页 (水滴胶囊 + Liquid Glass 纯净光学) */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
                <TabsList className="border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_4px_16px_-2px_rgba(0,0,0,0.3)] p-1 rounded-full h-10">
                    <TabsTrigger value="all" className="rounded-full text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm px-4">综合</TabsTrigger>
                    <TabsTrigger value="posts" className="rounded-full text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm px-4">帖子 ({posts.length})</TabsTrigger>
                    <TabsTrigger value="users" className="rounded-full text-xs sm:text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm px-4">学者 ({users.length})</TabsTrigger>
                </TabsList>
            </Tabs>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (!query.trim()) ? (
                <div className="text-center py-16 border-0 rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-zinc-900/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.3)]">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                        <Search className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">输入关键词进行全站探索</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        你可以搜索学术论文、技术帖子、主题标签或学者昵称
                    </p>
                </div>
            ) : (posts.length === 0 && users.length === 0) ? (
                <div className="text-center py-16 border-0 rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-zinc-900/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.3)]">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                        <Search className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">未找到相关结果</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        尝试使用不同的学术关键词或学者姓名重新搜索
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* 用户卡片网格列表 */}
                    {(activeTab === "all" || activeTab === "users") && users.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {activeTab === "all" && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">学者与成员</h2>
                                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">共 {users.length} 位</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-zinc-300/80 dark:from-zinc-700/80 via-zinc-200/40 to-transparent" />
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map((user) => (
                                    <UserSearchCard
                                        key={user.id}
                                        id={user.id}
                                        name={user.username}
                                        avatarUrl={user.avatar_url}
                                        bio={user.bio}
                                        bannerStyle={user.banner_style}
                                        bannerUrl={user.banner_url}
                                        isDeveloper={user.is_developer}
                                        role={user.developer_title}
                                        vipLevel={user.vip_level}
                                        specialTitle={user.special_title}
                                        isOnline={isOnline(user.id)}
                                        stats={user.stats}
                                        recentPost={user.recentPost}
                                        isFriend={user.isFriend}
                                        isFriendPending={user.isFriendPending}
                                        isAddingFriend={addingFriendId === user.id}
                                        onAddFriend={() => handleAddFriend(user.id)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 帖子部分 */}
                    {(activeTab === "all" || activeTab === "posts") && posts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {activeTab === "all" && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">学术帖子</h2>
                                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">共 {posts.length} 篇</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-zinc-300/80 dark:from-zinc-700/80 via-zinc-200/40 to-transparent" />
                                </div>
                            )}
                            {posts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <div className="rounded-2xl border-0 bg-white/70 hover:bg-white/85 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/75 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(0,0,0,0.4)] transition-all p-4 sm:p-5">
                                        <div className="flex-1 min-w-0">
                                            {/* 标签 (水滴胶囊 + 菲涅尔内高光) */}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {post.tags.slice(0, 3).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-[11px] px-2.5 py-0.5 rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-600 dark:text-zinc-400 font-normal shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.05)]"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <Link href={`/posts/${post.id}`}>
                                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors line-clamp-1 text-sm sm:text-base">
                                                    <MathText text={post.title} inlineOnly />
                                                </h3>
                                            </Link>
                                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                                <MathText text={extractTextFromContent(post.content).substring(0, 150) + "..."} inlineOnly />
                                            </p>

                                            {/* 水平渐变消融微光缝 */}
                                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mt-3 mb-2.5" />

                                            <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                                                <Link
                                                    href={`/user/${post.author?.id}`}
                                                    className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                >
                                                    <Avatar className="h-5 w-5 rounded-full border-0">
                                                        <AvatarImage src={post.author?.avatar_url} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {post.author?.username?.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{post.author?.username}</span>
                                                </Link>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3.5 w-3.5 text-zinc-400" /> {post.view_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="h-3.5 w-3.5 text-zinc-400" /> {post.like_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MessageCircle className="h-3.5 w-3.5 text-zinc-400" /> {post.comment_count || 0}
                                                </span>
                                                <span className="ml-auto flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                                    {new Date(post.created_at).toLocaleDateString("zh-CN")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <SearchResultsContent />
            </Suspense>
        </div>
    );
}
