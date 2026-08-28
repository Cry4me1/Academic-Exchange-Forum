"use client";

import { useUpdateNotification } from "@/hooks/use-update-notification";
import {
    Bookmark,
    BookMarked,
    Crown,
    Flame,
    Home,
    MessageSquare,
    Settings,
    Swords,
    Trophy,
    User,
    Users,
    Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

export function MainNav() {
    const pathname = usePathname();
    const { hasNewUpdate, isLoaded, markAsRead } = useUpdateNotification();
    const { t } = useI18n();
    const tNav = t.nav;

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
        { href: "/profile", label: tNav.profile, icon: User },
        { href: "/vip", label: tNav.vip, icon: Crown, isVip: true },
    ] as { href: string; label: string; icon: typeof Home; isUpdateLog?: boolean; isVip?: boolean; isLab?: boolean }[];

    const handleNavClick = (item: typeof navItems[0]) => {
        // 如果点击的是更新日志，标记为已读
        if (item.isUpdateLog && hasNewUpdate) {
            markAsRead();
        }
    };

    return (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const showHighlight = item.isUpdateLog && hasNewUpdate && isLoaded && !isActive;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => handleNavClick(item)}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative select-none",
                            isActive
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50",
                            item.isVip && !isActive && "text-amber-600/90 dark:text-amber-400/90 hover:bg-amber-500/5",
                            item.isVip && isActive && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        )}
                    >
                        <span className="relative flex items-center justify-center shrink-0">
                            <Icon
                                className={cn(
                                    "h-4.5 w-4.5 transition-colors",
                                    isActive
                                        ? "text-zinc-900 dark:text-zinc-100"
                                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300",
                                    item.isVip && "text-amber-500",
                                    showHighlight && "text-amber-500"
                                )}
                                strokeWidth={1.75}
                            />
                            {showHighlight && (
                                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                        </span>

                        <span className="truncate flex-1 tracking-tight">{item.label}</span>

                        {showHighlight && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-medium">
                                新
                            </span>
                        )}

                        {item.isVip && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold tracking-wider">
                                VIP
                            </span>
                        )}
                    </Link>
                );
            })}

            <div className="pt-2 mt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <Link
                    href="/settings"
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-all duration-150"
                >
                    <Settings
                        className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors"
                        strokeWidth={1.75}
                    />
                    <span className="truncate tracking-tight">{tNav.settings}</span>
                </Link>
            </div>
        </nav>
    );
}
