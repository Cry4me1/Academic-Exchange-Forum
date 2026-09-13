"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VipBadge } from "@/components/payments/VipBadge";
import { bannerGradients } from "@/components/profile/banner-selector";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Clock,
    Code2,
    FileText,
    Loader2,
    UserCheck,
    UserPlus,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo } from "react";

export interface UserSearchCardStats {
    /** 帖子数量 */
    postsCount?: number;
    /** 获得点赞总数 */
    likesCount?: number;
    /** 学术声望/信誉积分 */
    reputationScore?: number;
}

export interface RecentPostPreview {
    id: string;
    title: string;
    createdAt?: string;
}

export interface UserSearchCardProps {
    /** 用户唯一标识 */
    id: string;
    /** 显示名称/学者昵称 */
    name: string;
    /** 头像图片 URL */
    avatarUrl?: string | null;
    /** 封面主题样式 ID 或自定义 Tailwind 渐变 class */
    bannerStyle?: string | null;
    /** 封面大图 URL（优先级高于渐变） */
    bannerUrl?: string | null;
    /** 开发者/系统角色头衔 */
    role?: string | null;
    /** 是否为开发者 */
    isDeveloper?: boolean | null;
    /** VIP 等级 (1-6) */
    vipLevel?: number | null;
    /** 专属头衔/特殊称号 */
    specialTitle?: string | null;
    /** 是否在线 */
    isOnline?: boolean;
    /** 个人简介 */
    bio?: string | null;
    /** 社区学术统计数据面板 */
    stats?: UserSearchCardStats;
    /** 近期帖子简报 */
    recentPost?: RecentPostPreview | null;
    /** 是否已是好友 */
    isFriend?: boolean;
    /** 是否好友请求已发送 */
    isFriendPending?: boolean;
    /** 是否正在处理加好友动作 */
    isAddingFriend?: boolean;
    /** 添加好友点击回调 */
    onAddFriend?: (userId: string, e: React.MouseEvent) => void | Promise<void>;
    /** 点击查看主页回调（默认使用 Link 导航） */
    onProfileClick?: (userId: string) => void;
    /** 点击近期帖子回调 */
    onRecentPostClick?: (postId: string, e: React.MouseEvent) => void;
    /** 自定义外部容器 class */
    className?: string;
}

export function UserSearchCard({
    id,
    name,
    avatarUrl,
    bannerStyle = "default",
    bannerUrl,
    role,
    isDeveloper = false,
    vipLevel,
    specialTitle,
    isOnline = false,
    bio,
    stats = { postsCount: 0, likesCount: 0, reputationScore: 100 },
    recentPost,
    isFriend = false,
    isFriendPending = false,
    isAddingFriend = false,
    onAddFriend,
    onProfileClick,
    onRecentPostClick,
    className,
}: UserSearchCardProps) {
    const initials = (name || "学者").charAt(0).toUpperCase();

    // 解析当前用户的封面渐变
    const bannerGradientClass = useMemo(() => {
        if (bannerStyle) {
            const found = bannerGradients.find((g) => g.id === bannerStyle);
            if (found) return found.class;
        }
        return bannerGradients[0].class;
    }, [bannerStyle]);

    const handleAddFriendClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onAddFriend && !isFriend && !isFriendPending && !isAddingFriend) {
            onAddFriend(id, e);
        }
    };

    const handleRecentPostClick = (e: React.MouseEvent) => {
        if (!recentPost) return;
        if (onRecentPostClick) {
            e.preventDefault();
            e.stopPropagation();
            onRecentPostClick(recentPost.id, e);
        }
    };

    // 120fps 光随鼠动物理漫射计算
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
                // 彻底无边框化 + 三层物理光学表现
                "group relative overflow-hidden rounded-3xl border-0",
                "bg-white/70 hover:bg-white/80 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/75",
                "backdrop-blur-xl backdrop-saturate-150",
                "shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)]",
                "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.45)]",
                "transition-all duration-300 flex flex-col justify-between text-left",
                className
            )}
        >
            {/* 光随鼠动物理高光反射层 (Mouse Reflex) */}
            <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                style={{
                    background:
                        "radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.22), transparent 80%)",
                }}
            />

            {/* 1. 顶部封面横幅 (Banner) */}
            <div className="relative w-full h-24 sm:h-28 overflow-hidden rounded-t-3xl">
                {bannerUrl ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                        style={{ backgroundImage: `url(${bannerUrl})` }}
                    >
                        {/* 柔和暗微光层确保操作按钮与整体视觉统一 */}
                        <div className="absolute inset-0 bg-black/15 backdrop-blur-[0.5px]" />
                    </div>
                ) : (
                    <div
                        className={cn(
                            "absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105",
                            bannerGradientClass
                        )}
                    />
                )}

                {/* 网格微纹理装饰 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

                {/* 右上角水滴胶囊加好友 / 关系操作按钮 (无边框 + 菲涅尔内高光) */}
                <div className="absolute top-2.5 right-2.5 z-20">
                    {isFriend ? (
                        <div
                            title="已是学术好友"
                            className="w-8 h-8 rounded-full border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.3)] select-none"
                        >
                            <UserCheck className="h-3.5 w-3.5" />
                        </div>
                    ) : isFriendPending ? (
                        <div
                            title="好友申请已发送"
                            className="w-8 h-8 rounded-full border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.3)] select-none"
                        >
                            <Clock className="h-3.5 w-3.5" />
                        </div>
                    ) : (
                        <motion.button
                            type="button"
                            onClick={handleAddFriendClick}
                            disabled={isAddingFriend}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            title="申请添加好友"
                            className="w-8 h-8 rounded-full border-0 bg-white/75 hover:bg-white/95 dark:bg-black/55 dark:hover:bg-black/80 backdrop-blur-xl flex items-center justify-center text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.4)] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isAddingFriend ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <UserPlus className="h-3.5 w-3.5" />
                            )}
                        </motion.button>
                    )}
                </div>
            </div>

            {/* 2. 头像与卡片主体信息区 */}
            <div className="px-4.5 pb-4.5 pt-0 flex-1 flex flex-col justify-between relative z-10">
                <div>
                    {/* 半悬浮跨越 Banner 头像与在线指示灯 */}
                    <div className="flex items-end justify-between -mt-9 sm:-mt-10 mb-2.5">
                        <div className="relative inline-block">
                            <Avatar className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl ring-4 ring-white/90 dark:ring-zinc-900/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] bg-zinc-100 dark:bg-zinc-800 shrink-0 select-none border-0">
                                <AvatarImage src={avatarUrl || ""} alt={name} className="object-cover" />
                                <AvatarFallback className="text-xl sm:text-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            {/* 在线状态指示小水滴 */}
                            <span
                                title={isOnline ? "当前在线" : "离线"}
                                className={cn(
                                    "absolute -bottom-0.5 -right-0.5 z-20 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-2xs transition-colors",
                                    isOnline
                                        ? "h-4 w-4 bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                        : "h-3.5 w-3.5 bg-zinc-400 dark:bg-zinc-500"
                                )}
                            >
                                {isOnline && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 animate-pulse" />
                                )}
                            </span>
                        </div>
                    </div>

                    {/* 用户昵称与头衔徽章 */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate max-w-[160px] sm:max-w-[190px]">
                                {name}
                            </h3>

                            {/* 开发者徽章 (水滴胶囊 + 菲涅尔内高光) */}
                            {isDeveloper ? (
                                <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-mono font-medium border-0 bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] shrink-0">
                                    <Code2 className="h-2.5 w-2.5 text-zinc-500" />
                                    <span>{role || "DEVELOPER"}</span>
                                </span>
                            ) : specialTitle ? (
                                <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium border-0 bg-violet-500/15 dark:bg-violet-500/25 backdrop-blur-md text-violet-700 dark:text-violet-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] shrink-0">
                                    {specialTitle}
                                </span>
                            ) : vipLevel ? (
                                <VipBadge vipLevel={vipLevel} size="xs" className="shrink-0" />
                            ) : null}
                        </div>

                        {/* 个人简介 (单行截断) */}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-relaxed">
                            {bio || "潜心学术探索，暂无个人简介"}
                        </p>
                    </div>

                    {/* 3. 内嵌通透数据与近期帖子面板 (Stats & Recent Post - Liquid Glass 优化) */}
                    <div className="rounded-2xl border-0 bg-white/45 dark:bg-zinc-800/35 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_2px_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06),0_2px_12px_-2px_rgba(0,0,0,0.2)] p-2.5 sm:p-3 mt-3 space-y-2">
                        {/* 社区学术数据面板 (采用渐变消融微光缝替代硬 divide-x) */}
                        <div className="flex items-center justify-between text-center">
                            <div className="flex-1 px-1">
                                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                    {stats.postsCount ?? 0}
                                </div>
                                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                                    帖子
                                </div>
                            </div>

                            {/* 垂直渐变消融微光缝 */}
                            <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent shrink-0" />

                            <div className="flex-1 px-1">
                                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                    {stats.likesCount ?? 0}
                                </div>
                                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                                    获赞
                                </div>
                            </div>

                            {/* 垂直渐变消融微光缝 */}
                            <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent shrink-0" />

                            <div className="flex-1 px-1">
                                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                    {stats.reputationScore ?? 100}
                                </div>
                                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium">
                                    学术声望
                                </div>
                            </div>
                        </div>

                        {/* 水平渐变消融微光缝 */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-700/60 to-transparent" />

                        {/* 近期帖子摘要条目 */}
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0 px-0.5">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                            {recentPost ? (
                                <Link
                                    href={`/posts/${recentPost.id}`}
                                    onClick={handleRecentPostClick}
                                    className="truncate hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex-1"
                                    title={recentPost.title}
                                >
                                    {recentPost.title}
                                </Link>
                            ) : (
                                <span className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                                    暂无近期发表动态
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. 底部行动按钮：黑曜石液态玻璃与白月光晶体 CTA (含触觉微弹) */}
                <div className="mt-3.5">
                    {onProfileClick ? (
                        <motion.button
                            type="button"
                            onClick={() => onProfileClick(id)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white/90 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium h-9 flex items-center justify-center gap-1.5 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.85)] transition-all cursor-pointer"
                        >
                            <span>进入主页</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </motion.button>
                    ) : (
                        <Link href={`/user/${id}`} className="block w-full">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white/90 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium h-9 flex items-center justify-center gap-1.5 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.85)] transition-all"
                            >
                                <span>进入主页</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </motion.div>
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
