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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80 pb-safe">
            <div className="flex items-center justify-around h-14 px-2 relative">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                    const Icon = tab.icon;

                    if (tab.isCenter) {
                        return (
                            <div key="center-btn" className="relative -top-4 flex flex-col items-center">
                                <Link href={tab.href}>
                                    <div className="h-10 w-10 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-full shadow-md flex items-center justify-center transform active:scale-95 transition-transform border border-zinc-700 dark:border-zinc-300">
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
                                    isActive ? "text-zinc-900 dark:text-zinc-100 font-semibold" : "text-zinc-400 dark:text-zinc-500"
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
