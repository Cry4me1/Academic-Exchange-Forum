"use client";

import { useUpdateNotification } from "@/hooks/use-update-notification";
import {
    BookMarked,
    Flame,
    FlaskConical,
    Home,
    Swords,
    Trophy,
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

    // ── 社区探索 ──
    const exploreItems = [
        { href: "/dashboard", label: tNav.home, icon: Home },
        { href: "/trending", label: tNav.trending, icon: Flame },
        { href: "/leaderboard", label: tNav.leaderboard, icon: Trophy },
        { href: "/duels", label: tNav.duels, icon: Swords },
        { href: "/lab", label: tNav.lab, icon: FlaskConical, isLab: true },
    ] as const;

    // ── 我的空间 ──
    const spaceItems = [
        { href: "/friends", label: tNav.friends, icon: Users },
        { href: "/collections/following", label: tNav.collections, icon: BookMarked },
        { href: "/updates", label: tNav.updates, icon: Zap, isUpdateLog: true },
    ] as const;

    const handleNavClick = (item: { isUpdateLog?: boolean }) => {
        if (item.isUpdateLog && hasNewUpdate) {
            markAsRead();
        }
    };

    const renderNavItem = (item: {
        href: string;
        label: string;
        icon: typeof Home;
        isLab?: boolean;
        isUpdateLog?: boolean;
    }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const showUpdateDot = item.isUpdateLog && hasNewUpdate && isLoaded && !isActive;

        return (
            <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => handleNavClick(item)}
                className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 relative select-none border-0",
                    isActive
                        ? "bg-white/90 dark:bg-zinc-800/90 text-zinc-950 dark:text-zinc-50 shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_2px_8px_-1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-1px_rgba(0,0,0,0.4)] backdrop-blur-md font-medium"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/40 font-medium",
                    // 仅「共创实验室」保留唯一特殊强调色
                    item.isLab && !isActive && "text-violet-600/90 dark:text-violet-400/90 hover:bg-violet-500/10",
                    item.isLab && isActive && "bg-violet-500/15 text-violet-700 dark:text-violet-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_-1px_rgba(124,58,237,0.15)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_2px_8px_-1px_rgba(124,58,237,0.25)]"
                )}
            >
                <span className="relative flex items-center justify-center shrink-0">
                    <Icon
                        className={cn(
                            "h-4.5 w-4.5 transition-colors",
                            isActive
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300",
                            item.isLab && "text-violet-500"
                        )}
                        strokeWidth={1.75}
                    />
                    {/* 更新日志新内容圆点（克制：仅一个微小圆点，无色彩爆炸） */}
                    {showUpdateDot && (
                        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
                    )}
                </span>

                <span className="truncate flex-1 tracking-tight">{item.label}</span>

                {/* 仅「共创实验室」保留徽标 */}
                {item.isLab && (
                    <span className="text-[10px] bg-violet-500/15 text-violet-700 dark:text-violet-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] px-1.5 py-0.2 rounded-full font-medium tracking-tight">
                        实时
                    </span>
                )}
            </Link>
        );
    };

    return (
        <nav className="space-y-1">
            {/* 社区探索分组 */}
            <div className="px-2.5 pt-1 pb-1">
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">
                    社区探索
                </span>
            </div>
            {exploreItems.map(renderNavItem)}

            {/* 渐变消融分割微光缝 */}
            <div className="my-2 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 我的空间分组 */}
            <div className="px-2.5 pb-1">
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">
                    我的空间
                </span>
            </div>
            {spaceItems.map(renderNavItem)}
        </nav>
    );
}
