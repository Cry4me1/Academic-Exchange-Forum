"use client";

import { useUpdateNotification } from "@/hooks/use-update-notification";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bookmark,
    BookMarked,
    Crown,
    Flame,
    Home,
    LogOut,
    MessageSquare,
    Settings,
    Swords,
    Trophy,
    User,
    Users,
    X,
    Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

interface MobileGlassDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId?: string | null;
}

export function MobileGlassDrawer({ isOpen, onClose, currentUserId }: MobileGlassDrawerProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useI18n();
    const { hasNewUpdate, isLoaded, markAsRead } = useUpdateNotification();
    const supabase = createClient();

    const tNav = t.nav;

    // 只有在 pathname 真正发生变更时才自动关闭抽屉
    const prevPathRef = useRef(pathname);
    useEffect(() => {
        if (prevPathRef.current !== pathname) {
            prevPathRef.current = pathname;
            onClose();
        }
    }, [pathname, onClose]);

    // ESC 键关闭支持
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // 打开抽屉时禁止外层滚动
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const navItems = [
        { href: "/dashboard", label: tNav.home, icon: Home },
        { href: "/trending", label: tNav.trending, icon: Flame },
        { href: "/leaderboard", label: tNav.leaderboard, icon: Trophy },
        { href: "/duels", label: tNav.duels, icon: Swords },
        { href: "/messages", label: tNav.messages, icon: MessageSquare },
        { href: "/friends", label: tNav.friends, icon: Users },
        { href: "/favorites", label: tNav.favorites, icon: Bookmark },
        { href: "/collections/following", label: tNav.collections, icon: BookMarked },
        { href: "/updates", label: tNav.updates, icon: Zap, isUpdateLog: true },
        { href: currentUserId ? `/user/${currentUserId}` : "/profile", label: tNav.profile, icon: User },
        { href: "/vip", label: tNav.vip, icon: Crown, isVip: true },
    ];

    const handleLogout = async () => {
        onClose();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex justify-end">
                    {/* 背景环境压暗遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-sm"
                    />

                    {/* Apple Liquid Glass 右滑无边框抽屉面板 */}
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className={cn(
                            "relative z-10 w-[84%] max-w-[320px] h-full flex flex-col",
                            "bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-0",
                            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),-8px_0_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),-8px_0_40px_-6px_rgba(0,0,0,0.7)]",
                            "pt-safe pb-safe"
                        )}
                    >
                        {/* 抽屉头部 */}
                        <div className="flex items-center justify-between px-5 h-16 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    全部学术板块
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-0 cursor-pointer"
                                aria-label="关闭抽屉"
                            >
                                <X className="h-4.5 w-4.5" strokeWidth={2} />
                            </button>
                        </div>

                        {/* 顶部渐变消融微光缝 */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

                        {/* 导航功能列表 */}
                        <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1.5 scrollbar-none">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                                const showHighlight = item.isUpdateLog && hasNewUpdate && isLoaded && !isActive;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => {
                                            if (item.isUpdateLog && hasNewUpdate) {
                                                markAsRead();
                                            }
                                            onClose();
                                        }}
                                        className={cn(
                                            "flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-[13.5px] font-medium transition-all duration-200 border-0 select-none active:scale-[0.98]",
                                            isActive
                                                ? "bg-zinc-950/90 text-white dark:bg-white dark:text-zinc-950 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_4px_14px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                                                : "text-zinc-700 dark:text-zinc-300 hover:bg-white/70 dark:hover:bg-zinc-800/60",
                                            item.isVip && !isActive && "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "h-4.5 w-4.5 shrink-0 transition-colors",
                                                isActive ? "text-white dark:text-zinc-950" : "text-zinc-400 dark:text-zinc-500",
                                                item.isVip && !isActive && "text-amber-500"
                                            )}
                                            strokeWidth={1.75}
                                        />
                                        <span className="truncate flex-1 tracking-tight">{item.label}</span>

                                        {showHighlight && (
                                            <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium shadow-xs">
                                                新
                                            </span>
                                        )}

                                        {item.isVip && (
                                            <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] px-2 py-0.5 rounded-full font-medium tracking-wider">
                                                VIP
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* 底部渐变消融微光缝 */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

                        {/* 抽屉底部操作区 */}
                        <div className="p-4 space-y-2 shrink-0 bg-white/30 dark:bg-zinc-950/30">
                            <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">界面语言</span>
                                <LanguageSwitcher variant="toggle" />
                            </div>

                            <Link
                                href="/settings"
                                onClick={onClose}
                                className="flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors border-0"
                            >
                                <Settings className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                                <span>{tNav.settings}</span>
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors border-0 cursor-pointer text-left"
                            >
                                <LogOut className="h-4 w-4" strokeWidth={1.75} />
                                <span>{tNav.logout}</span>
                            </button>
                        </div>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
