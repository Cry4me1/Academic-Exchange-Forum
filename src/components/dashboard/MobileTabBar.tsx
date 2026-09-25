"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Flame, Home, LayoutGrid, MessageCircle, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/context";

interface MobileTabBarProps {
    currentUserId?: string | null;
    isDrawerOpen?: boolean;
    onOpenDrawer?: () => void;
    onToggleDrawer?: () => void;
}

export function MobileTabBar({ currentUserId, isDrawerOpen, onOpenDrawer, onToggleDrawer }: MobileTabBarProps) {
    const { t } = useI18n();
    const pathname = usePathname();

    const drawerRoutes = [
        "/leaderboard",
        "/duels",
        "/friends",
        "/favorites",
        "/collections",
        "/updates",
        "/profile",
        "/user",
        "/vip",
        "/settings",
    ];
    const isDrawerRouteActive = drawerRoutes.some((route) => pathname.startsWith(route));

    const tabs = [
        {
            name: t.nav.home,
            href: "/dashboard",
            icon: Home,
            type: "link" as const,
        },
        {
            name: t.nav.trending,
            href: "/trending",
            icon: Flame,
            type: "link" as const,
        },
        {
            name: "",
            href: "/posts/new",
            icon: Plus,
            type: "center" as const,
        },
        {
            name: t.nav.messages,
            href: "/messages",
            icon: MessageCircle,
            type: "link" as const,
        },
        {
            name: "板块",
            href: "#drawer",
            icon: LayoutGrid,
            type: "drawer" as const,
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_-8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_-8px_32px_-4px_rgba(0,0,0,0.5)] pb-safe transition-all select-none">
            <div className="flex items-center justify-around h-14 px-2 relative">
                {tabs.map((tab, idx) => {
                    const isLink = tab.type === "link";
                    const isDrawer = tab.type === "drawer";
                    const isActive = isLink && (pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(`${tab.href}/`)));
                    const Icon = tab.icon;

                    if (tab.type === "center") {
                        return (
                            <div key="center-btn" className="relative -top-3.5 flex flex-col items-center">
                                <Link href={tab.href} aria-label="发起学术研讨">
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className="h-11 w-11 bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/95 dark:text-zinc-950 dark:hover:bg-white rounded-full border-0 shadow-[0_6px_20px_-2px_rgba(0,0,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.45)] dark:shadow-[0_6px_20px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center transition-transform"
                                    >
                                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                                    </motion.div>
                                </Link>
                            </div>
                        );
                    }

                    if (isDrawer) {
                        const isTabActive = Boolean(isDrawerOpen || isDrawerRouteActive);
                        return (
                            <motion.button
                                key="drawer-tab"
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={onToggleDrawer || onOpenDrawer}
                                className="flex flex-col items-center justify-center w-14 h-full gap-0.5 relative border-0 bg-transparent cursor-pointer touch-manipulation select-none"
                                aria-label="展开全部板块"
                            >
                                <Icon
                                    className={cn(
                                        "h-4.5 w-4.5 transition-colors",
                                        isTabActive
                                            ? "text-zinc-950 dark:text-zinc-50"
                                            : "text-zinc-400 dark:text-zinc-500"
                                    )}
                                    strokeWidth={isTabActive ? 2.2 : 1.75}
                                />
                                <span
                                    className={cn(
                                        "text-[10px] font-medium tracking-tight transition-colors",
                                        isTabActive
                                            ? "text-zinc-950 dark:text-zinc-50 font-semibold"
                                            : "text-zinc-400 dark:text-zinc-500 font-medium"
                                    )}
                                >
                                    {tab.name}
                                </span>
                                {isTabActive && (
                                    <motion.div
                                        layoutId="mobile-tab-indicator"
                                        className="absolute -top-1 w-6 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100 shadow-[0_0_6px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                            </motion.button>
                        );
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex flex-col items-center justify-center w-14 h-full gap-0.5 active:scale-95 transition-transform relative"
                        >
                            <Icon
                                className={cn(
                                    "h-4.5 w-4.5 transition-colors",
                                    isActive
                                        ? "text-zinc-950 dark:text-zinc-50 stroke-[2.2]"
                                        : "text-zinc-400 dark:text-zinc-500"
                                )}
                                strokeWidth={isActive ? 2.2 : 1.75}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors tracking-tight",
                                    isActive
                                        ? "text-zinc-950 dark:text-zinc-50 font-semibold"
                                        : "text-zinc-400 dark:text-zinc-500 font-medium"
                                )}
                            >
                                {tab.name}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-tab-indicator"
                                    className="absolute -top-1 w-6 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100 shadow-[0_0_6px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
