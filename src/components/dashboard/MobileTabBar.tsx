"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Flame, Home, MessageCircle, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/i18n/context";

interface MobileTabBarProps {
    currentUserId: string | null;
}

export function MobileTabBar({ currentUserId }: MobileTabBarProps) {
    const { t } = useI18n();
    const pathname = usePathname();

    const tabs = [
        {
            name: t.nav.home,
            href: "/dashboard",
            icon: Home,
        },
        {
            name: t.nav.trending,
            href: "/trending",
            icon: Flame,
        },
        {
            name: "",
            href: "/posts/new",
            icon: Plus,
            isCenter: true,
        },
        {
            name: t.nav.messages,
            href: "/messages",
            icon: MessageCircle,
        },
        {
            name: t.nav.profile,
            href: currentUserId ? `/user/${currentUserId}` : "/dashboard",
            icon: User,
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-0 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-2xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_-8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_-8px_32px_-4px_rgba(0,0,0,0.4)] pb-safe">
            <div className="flex items-center justify-around h-14 px-2 relative">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                    const Icon = tab.icon;

                    if (tab.isCenter) {
                        return (
                            <div key="center-btn" className="relative -top-4 flex flex-col items-center">
                                <Link href={tab.href}>
                                    <div className="h-10 w-10 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white rounded-full border-0 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center justify-center transform active:scale-95 transition-transform">
                                        <Icon className="h-5 w-5" strokeWidth={2} />
                                    </div>
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex flex-col items-center justify-center w-14 h-full gap-0.5 active:opacity-70 transition-opacity relative"
                        >
                            <Icon
                                className={cn(
                                    "h-4.5 w-4.5 transition-colors",
                                    isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
                                )}
                                strokeWidth={1.75}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    isActive ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-500 font-medium"
                                )}
                            >
                                {tab.name}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-tab-indicator"
                                    className="absolute -top-2 w-6 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
