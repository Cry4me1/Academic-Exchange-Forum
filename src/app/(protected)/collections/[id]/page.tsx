"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Eye, FileText, Heart, Settings, Clock, User, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { getCollectionWithPosts, getCollectionFollowStatus, incrementCollectionViewCount, setCollectionLeadPost } from "../actions";
import { CollectionPostList, CreateCollectionDialog, FollowCollectionButton, CollectionCover, getCollectionCoverPreset } from "@/components/collections";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function CollectionDetailPage() {
    const params = useParams();
    const collectionId = params.id as string;
    const router = useRouter();

    const [collection, setCollection] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isManageMode, setIsManageMode] = useState(false);

    useEffect(() => {
        if (!collectionId) return;
        
        const fetchUserAndData = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setCurrentUserId(user.id);
                }

                // 并行加载：专栏数据 + 关注状态 + 记录浏览量
                const [result, followResult] = await Promise.all([
                    getCollectionWithPosts(collectionId),
                    getCollectionFollowStatus(collectionId),
                    incrementCollectionViewCount(collectionId),
                ]);

                if (result.error || !result.collection) {
                    setError(result.error || "专栏不存在");
                } else {
                    setCollection(result.collection);
                    setPosts(result.posts);
                }

                setIsFollowing(followResult.isFollowing);
            } catch (err) {
                console.error(err);
                setError("加载失败");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndData();
    }, [collectionId]);

    const isAuthor = currentUserId === collection?.author_id;

    const handleSetLeadPost = async (postId: string) => {
        try {
            const res = await setCollectionLeadPost(collectionId, postId, true);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("已设为主页展示导读篇");
                setCollection((prev: any) => ({
                    ...prev,
                    only_show_lead_post_in_feed: true,
                    lead_post_id: postId,
                    effective_lead_post_id: postId,
                }));
                setPosts((prev) => prev.map(p => ({
                    ...p,
                    is_lead: p.id === postId
                })));
            }
        } catch {
            toast.error("设置失败，请重试");
        }
    };

    const coverStyle = collection?.cover_style || "preset-academic";
    const preset = getCollectionCoverPreset(coverStyle);
    const PresetIcon = preset.icon;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-100/70 via-background to-zinc-100/40 dark:from-zinc-950 dark:via-background dark:to-zinc-950 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <Skeleton className="w-24 h-8 rounded-full border-0" />
                    <Skeleton className="w-full h-80 rounded-3xl border-0" />
                    <div className="space-y-4 pt-4">
                        <Skeleton className="w-full h-32 rounded-3xl border-0" />
                        <Skeleton className="w-full h-32 rounded-3xl border-0" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-100/70 via-background to-zinc-100/40 dark:from-zinc-950 dark:via-background dark:to-zinc-950 flex flex-col items-center justify-center p-8">
                <div className="rounded-3xl border-0 p-10 text-center bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] max-w-md w-full">
                    <p className="text-lg font-medium text-muted-foreground mb-6">{error}</p>
                    <Button
                        onClick={() => router.back()}
                        className="h-9 px-6 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] backdrop-blur-xl transition-all cursor-pointer"
                    >
                        返回上一页
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-100/70 via-background to-zinc-100/40 dark:from-zinc-950 dark:via-background dark:to-zinc-950 pb-20 relative selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 顶部微弱环境漫反射光晕 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[360px] bg-gradient-to-b from-sky-500/[0.04] via-purple-500/[0.02] to-transparent blur-3xl pointer-events-none" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 relative z-10">
                {/* 顶部轻量快捷返回栏 */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl px-4 py-1.5 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.3)] transition-all cursor-pointer h-8.5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>返回</span>
                    </Button>
                </div>

                {/* 主专栏卡片容器 (个人主页 Banner 范式) */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_40px_-8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_12px_40px_-8px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden"
                >
                    {/* 1. Header: 固定精致比例 Cover 横幅 (h-44 sm:h-52 md:h-56) */}
                    <div className="w-full h-44 sm:h-52 md:h-56 relative transition-all duration-500 overflow-hidden bg-slate-950">
                        <CollectionCover
                            coverUrl={collection.cover_url}
                            coverStyle={collection.cover_style}
                            size="hero"
                            showEmblem={false}
                            showWatermark={false}
                        />

                        {/* 柔和半透明暗光渐变层，轻盈通透 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

                        {/* 优雅网格微纹理叠加 */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

                        {/* 右上角专栏属性徽标胶囊浮层 */}
                        <div className="absolute top-3.5 right-3.5 z-20 flex items-center flex-wrap gap-2">
                            <Badge 
                                variant="secondary" 
                                className="bg-black/35 text-white/95 backdrop-blur-xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)] px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5"
                            >
                                <PresetIcon className="w-3.5 h-3.5" style={{ color: preset.accentColor }} />
                                <span>{preset.name}</span>
                            </Badge>
                            {collection.only_show_lead_post_in_feed ? (
                                <Badge 
                                    variant="secondary" 
                                    className="bg-sky-500/35 text-sky-100 backdrop-blur-xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4),0_0_12px_rgba(14,165,233,0.3)] px-3 py-1 text-xs rounded-full font-medium"
                                >
                                    主页仅展示导读篇
                                </Badge>
                            ) : (
                                <Badge 
                                    variant="secondary" 
                                    className="bg-black/30 text-white/90 backdrop-blur-xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)] px-3 py-1 text-xs rounded-full font-medium"
                                >
                                    主页展示全部篇章
                                </Badge>
                            )}
                            {!collection.is_public && (
                                <Badge 
                                    variant="secondary" 
                                    className="bg-amber-500/35 text-amber-100 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4),0_0_12px_rgba(245,158,11,0.25)] backdrop-blur-xl px-3 py-1 text-xs rounded-full font-medium"
                                >
                                    私密专栏
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* 2. 专栏核心档案信息区 */}
                    <div className="px-5 sm:px-8 pb-7 pt-0">
                        {/* 悬浮重叠微缩徽标与右侧操作按钮栏 */}
                        <div className="flex items-end justify-between gap-4 -mt-10 sm:-mt-12 mb-4">
                            {/* 专栏封面徽标视窗：大曲率圆角，半悬浮重叠，带菲涅尔光晕 */}
                            <div className="relative inline-block shrink-0 select-none">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_32px_-4px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_12px_32px_-4px_rgba(0,0,0,0.5)] ring-4 ring-white/95 dark:ring-zinc-900/95 overflow-hidden bg-white dark:bg-zinc-900 flex items-center justify-center">
                                    {collection.cover_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={collection.cover_url}
                                                alt={collection.name}
                                                fill
                                                sizes="96px"
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: preset.primaryOrb }}>
                                            <PresetIcon className="w-9 h-9 sm:w-11 sm:h-11" style={{ color: preset.accentColor }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 右侧主操作按钮 */}
                            <div className="flex items-center gap-2.5 pb-1">
                                {!isAuthor && currentUserId && (
                                    <FollowCollectionButton
                                        collectionId={collectionId}
                                        initialFollowed={isFollowing}
                                        followerCount={collection.follower_count ?? 0}
                                        variant="default"
                                    />
                                )}

                                {isAuthor && (
                                    <div className="flex items-center gap-2 bg-zinc-100/70 dark:bg-white/[0.06] backdrop-blur-xl p-1 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-3.5 rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-xs font-medium transition-all cursor-pointer"
                                            onClick={() => setIsEditOpen(true)}
                                        >
                                            <Edit className="mr-1.5 h-3.5 w-3.5" />
                                            编辑专栏
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className={
                                                isManageMode 
                                                    ? "h-8 px-3.5 rounded-full border-0 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-medium text-xs shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-all cursor-pointer" 
                                                    : "h-8 px-3.5 rounded-full border-0 bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-xs font-medium transition-all cursor-pointer"
                                            }
                                            onClick={() => setIsManageMode(!isManageMode)}
                                        >
                                            <Settings className="mr-1.5 h-3.5 w-3.5" />
                                            {isManageMode ? "完成管理" : "管理文章"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 标题与描述 */}
                        <div className="space-y-2 mb-4">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                                {collection.name}
                            </h1>
                            {collection.description && (
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl font-normal">
                                    {collection.description}
                                </p>
                            )}
                        </div>

                        {/* 消融内部微光缝 */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-3.5" />

                        {/* 元数据胶囊群 */}
                        <div className="flex items-center flex-wrap gap-2.5">
                            <div className="inline-flex items-center gap-2 bg-zinc-100/70 dark:bg-white/[0.05] px-3.5 py-1.5 rounded-full border-0 text-xs sm:text-sm text-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Avatar className="h-4.5 w-4.5 border-0">
                                    <AvatarImage src={collection.author?.avatar_url || ""} />
                                    <AvatarFallback className="text-[10px]">
                                        <User className="h-3 w-3" />
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{collection.author?.username || '未知学者'}</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-zinc-100/70 dark:bg-white/[0.05] px-3 py-1.5 rounded-full border-0 text-xs text-muted-foreground font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{collection.post_count ?? posts.length} 篇内容</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-zinc-100/70 dark:bg-white/[0.05] px-3 py-1.5 rounded-full border-0 text-xs text-muted-foreground font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{collection.view_count ?? 0} 浏览</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-zinc-100/70 dark:bg-white/[0.05] px-3 py-1.5 rounded-full border-0 text-xs text-muted-foreground font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Heart className="h-3.5 w-3.5 text-rose-500" />
                                <span>{collection.follower_count ?? 0} 关注</span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 bg-zinc-100/70 dark:bg-white/[0.05] px-3 py-1.5 rounded-full border-0 text-xs text-muted-foreground font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Clock className="h-3.5 w-3.5" />
                                <span>更新于 {format(new Date(collection.updated_at), 'yyyy-MM-dd')}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 专栏目录区 */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-sky-500/[0.12] text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                                <FileText className="h-4 w-4" />
                            </span>
                            <span>专栏目录</span>
                            <span className="text-xs text-muted-foreground font-medium px-2.5 py-0.5 rounded-full bg-zinc-200/40 dark:bg-white/[0.05] shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)]">
                                共 {posts.length} 篇
                            </span>
                        </h2>
                        {isAuthor && isManageMode && (
                            <span className="px-3.5 py-1 rounded-full border-0 bg-amber-500/[0.14] text-amber-700 dark:text-amber-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_12px_rgba(245,158,11,0.2)]">
                                管理模式已开启：可使用卡片右侧箭头调整文章次序或移出专栏
                            </span>
                        )}
                    </div>
                    
                    {/* 消融内部微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                    >
                        {posts.length > 0 ? (
                            <CollectionPostList 
                                collectionId={collectionId}
                                posts={posts}
                                isAuthor={isAuthor}
                                onlyShowLeadPostInFeed={collection.only_show_lead_post_in_feed}
                                onSetLeadPost={handleSetLeadPost}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_40px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_12px_40px_-4px_rgba(0,0,0,0.4)]">
                                <div className="w-14 h-14 rounded-full bg-zinc-200/50 dark:bg-white/[0.06] flex items-center justify-center mb-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                    <FileText className="h-6 w-6 text-muted-foreground/60" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1.5">暂无内容</h3>
                                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                                    这个专栏还没有添加任何帖子，你可以在发布新帖或编辑已有帖子时将其归入本专栏。
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Edit Dialog */}
            {isEditOpen && (
                <CreateCollectionDialog 
                    open={isEditOpen} 
                    onOpenChange={setIsEditOpen} 
                    editingCollection={collection}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
