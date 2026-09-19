"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import {
    AiFeatureCard,
    AnnouncementCard,
    CreditRechargeDialog,
    DashboardTutorialBanner,
    FeedTabs,
    FriendsList,
    GlobalSearch,
    MainNav,
    MobileTabBar,
    PostFeed,
    QuickPostButton,
    StoryBanner,
    TagCloud,
    WelcomeModal,
    type FeedFilter
} from "@/components/dashboard";
import { NotificationCenter } from "@/components/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
    Coins,
    LogOut,
    Settings,
    User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

// === 服务端预获取数据的 Props 类型 ===
export interface DashboardInitialData {
    user: {
        id: string;
        username: string | null;
        email: string | null;
        avatar_url: string | null;
        created_at: string;
    };
    creditBalance: number;
    initialPosts?: any[];
}

// 积分紧凑格式化辅助函数
function formatCredits(num: number | null): string {
    if (num === null || num === undefined) return "...";
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B+ pts`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M pts`;
    if (num >= 10_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}k pts`;
    if (num >= 1_000) return `${num.toLocaleString()} pts`;
    return `${num} pts`;
}

// 动画变体
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const slideInLeft = {
    hidden: { opacity: 0, x: -16 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const slideInRight = {
    hidden: { opacity: 0, x: 16 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    },
};

interface DashboardClientProps {
    initialData: DashboardInitialData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
    const { t } = useI18n();
    const tNav = t.nav;

    const [activeTab, setActiveTab] = useState<FeedFilter>("latest");
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    // 使用服务端预获取的数据作为初始值，不再客户端重复请求
    const [creditBalance, setCreditBalance] = useState<number | null>(initialData.creditBalance);

    const currentUserId = initialData.user.id;
    const currentUser = {
        username: initialData.user.username,
        email: initialData.user.email,
        avatar_url: initialData.user.avatar_url,
    };
    const userCreatedAt = initialData.user.created_at;

    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    // 充值弹窗关闭时刷新余额
    const handleRechargeOpenChange = async (open: boolean) => {
        setIsRechargeOpen(open);
        if (!open) {
            const credits = await getMyCredits();
            setCreditBalance(credits.balance);
        }
    };

    // 全局事件: AI 积分不足时打开充值弹窗
    useEffect(() => {
        const handler = () => setIsRechargeOpen(true);
        window.addEventListener("open-recharge-dialog", handler);
        return () => window.removeEventListener("open-recharge-dialog", handler);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/40 text-foreground antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-50 border-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-[inset_0_-1px_0.5px_rgba(255,255,255,0.85),0_4px_24px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_-1px_0.5px_rgba(255,255,255,0.08),0_4px_24px_-2px_rgba(0,0,0,0.3)]">
                <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-10">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="flex items-center gap-2.5 group">
                                <Image 
                                    src="/logo.png" 
                                    alt="Scholarly Logo" 
                                    width={30} 
                                    height={30} 
                                    unoptimized
                                    className="rounded-xl object-cover border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] transition-transform group-hover:scale-105" 
                                />
                                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Scholarly
                                </span>
                            </Link>
                        </div>

                        {/* 桌面端搜索栏 */}
                        <div className="hidden md:flex flex-1 max-w-lg mx-10">
                            <GlobalSearch className="w-full" />
                        </div>

                        {/* 右侧操作区 */}
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            {/* 语言切换器 */}
                            <div className="hidden sm:block">
                                <LanguageSwitcher variant="toggle" />
                            </div>

                            {/* 通知中心 */}
                            <NotificationCenter currentUserId={currentUserId} />

                            {/* 积分余额精致微胶囊 */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => setIsRechargeOpen(true)}
                                            className="hidden sm:inline-flex items-center gap-1.5 h-8.5 px-3 rounded-full border-0 bg-amber-500/10 hover:bg-amber-500/18 text-amber-700 dark:text-amber-400 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_-1px_rgba(245,158,11,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-1px_rgba(245,158,11,0.2)] transition-all duration-150 cursor-pointer select-none"
                                        >
                                            <Coins className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
                                            <span className="text-xs font-semibold font-mono tabular-nums">
                                                {formatCredits(creditBalance)}
                                            </span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="bottom"
                                        sideOffset={8}
                                        className="text-xs border-0 rounded-2xl bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-2px_rgba(0,0,0,0.4)] px-3 py-2 z-50 pointer-events-none"
                                    >
                                        <p className="font-medium text-zinc-800 dark:text-zinc-100">当前学术积分: <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{creditBalance !== null ? creditBalance.toLocaleString() : '...'}</span></p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">点击快捷充值积分</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* 用户菜单 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8.5 w-8.5 rounded-full p-0 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.3)]">
                                        <Avatar className="h-8.5 w-8.5">
                                            <AvatarImage src={currentUser?.avatar_url || ""} alt="用户头像" />
                                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                                                {(currentUser?.username || currentUser?.email || "U").charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 text-xs border-0 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_12px_40px_-4px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_12px_40px_-4px_rgba(0,0,0,0.5)]">
                                    <DropdownMenuLabel className="font-normal py-2">
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{currentUser?.username || "当前学者"}</p>
                                            <p className="text-[11px] text-zinc-400 truncate">{currentUser?.email || "user@example.com"}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`/user/${currentUserId}`} className="cursor-pointer">
                                            <User className="mr-2 h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                            {tNav.profile}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings/profile" className="cursor-pointer">
                                            <Settings className="mr-2 h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                            {tNav.settings}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <div className="sm:hidden px-2 py-1.5">
                                        <LanguageSwitcher variant="toggle" />
                                    </div>
                                    <DropdownMenuSeparator className="sm:hidden" />
                                    <DropdownMenuItem
                                        className="text-rose-600 focus:text-rose-600 cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
                                        {tNav.logout}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* 充值弹窗 */}
                <CreditRechargeDialog isOpen={isRechargeOpen} onOpenChange={handleRechargeOpenChange} />
            </header>

            {/* 主内容区域 - 间距留白更加宽大舒适 */}
            <main className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-10 py-8">
                <div className="flex gap-8 items-start">
                    {/* 左侧栏 - 桌面端显示，宽度增至 72 (288px) */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <motion.div
                            variants={slideInLeft}
                            initial="hidden"
                            animate="visible"
                            className="sticky top-24 space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1.5 scrollbar-hidden"
                        >
                            {/* 主导航 */}
                            <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border-0 p-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
                                <MainNav />
                            </div>

                            {/* 好友列表 */}
                            <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border-0 p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
                                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2.5 px-1 tracking-tight">
                                    好友动态
                                </h3>
                                <Suspense fallback={<div className="h-28 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/40 animate-pulse border-0" />}>
                                    <FriendsList currentUserId={currentUserId} />
                                </Suspense>
                            </div>
                        </motion.div>
                    </aside>

                    {/* 中间栏 - 主要信息流 */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 min-w-0"
                    >
                        {/* 移动端搜索栏 */}
                        <div className="md:hidden mb-5">
                            <GlobalSearch />
                        </div>

                        {/* Mobile/Tablet only: 右侧卡片下移展示 */}
                        <div className="xl:hidden space-y-5 mb-6">
                            <QuickPostButton />
                            <AnnouncementCard />
                            <AiFeatureCard />
                            <TagCloud />
                        </div>

                        {/* 新手实操训练营微光引导条 */}
                        <DashboardTutorialBanner />

                        {/* 动态横幅 StoryBanner */}
                        <motion.div variants={fadeInUp} className="mb-6">
                            <StoryBanner />
                        </motion.div>

                        {/* Tabs 筛选器 */}
                        <motion.div variants={fadeInUp} className="mb-6 sticky top-20 z-30 bg-zinc-50/70 dark:bg-zinc-950/70 backdrop-blur-xl py-1.5">
                            <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
                        </motion.div>

                        {/* 帖子列表 */}
                        <motion.div variants={fadeInUp}>
                            <PostFeed filter={activeTab} initialPosts={initialData.initialPosts} />
                        </motion.div>
                    </motion.div>

                    {/* 右侧栏 - 桌面端显示，宽度 340px */}
                    <aside className="hidden xl:block w-[340px] shrink-0">
                        <motion.div
                            variants={slideInRight}
                            initial="hidden"
                            animate="visible"
                            className="sticky top-24 space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1.5 scrollbar-hidden"
                        >
                            {/* 快速发帖 */}
                            <motion.div variants={itemVariants}>
                                <QuickPostButton />
                            </motion.div>

                            {/* 公告卡片 */}
                            <motion.div variants={itemVariants}>
                                <Suspense fallback={<div className="h-40 rounded-2xl bg-white/40 dark:bg-zinc-900/30 animate-pulse border-0" />}>
                                    <AnnouncementCard />
                                </Suspense>
                            </motion.div>

                            {/* AI Feature Announcement */}
                            <motion.div variants={itemVariants}>
                                <AiFeatureCard />
                            </motion.div>

                            {/* 热门话题 */}
                            <motion.div variants={itemVariants}>
                                <Suspense fallback={<div className="h-32 rounded-2xl bg-white/40 dark:bg-zinc-900/30 animate-pulse border-0" />}>
                                    <TagCloud />
                                </Suspense>
                            </motion.div>
                        </motion.div>
                    </aside>
                </div>
            </main>

            {/* 移动端底部 Tab Bar */}
            <MobileTabBar currentUserId={currentUserId} />

            {/* 欢迎弹窗 / 正式版通知 */}
            <WelcomeModal userCreatedAt={userCreatedAt} />
        </div>
    );
}
