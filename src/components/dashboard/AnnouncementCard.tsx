"use client";

import { Bell, ChevronRight, Rocket, Sparkles, Wrench, Megaphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { useI18n } from "@/i18n/context";

// Map categories to icons and low-saturation backgrounds
const categoryStyles: Record<string, { icon: any; bg: string; text: string }> = {
    update: { icon: Rocket, bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
    activity: { icon: Sparkles, bg: "bg-purple-500/10 dark:bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
    system: { icon: Megaphone, bg: "bg-zinc-500/10 dark:bg-zinc-500/15", text: "text-zinc-600 dark:text-zinc-400" },
    maintenance: { icon: Wrench, bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
};

export function AnnouncementCard() {
    const { t, isZh } = useI18n();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const now = new Date().toISOString();
            
            const { data, error } = await supabase
                .from("system_announcements")
                .select("*")
                .eq("is_active", true)
                .lte("start_time", now)
                .order("start_time", { ascending: false })
                .limit(3);

            if (!error && data) {
                const validData = data.filter((a: any) => !a.end_time || a.end_time > now);
                setAnnouncements(validData);
            }
            setLoading(false);
        };

        fetchAnnouncements();
    }, [supabase]);

    if (loading) {
        return (
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 animate-pulse shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="space-y-3">
                    <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
                    <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
                </div>
            </div>
        );
    }

    if (announcements.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 p-4 sm:p-5 shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-zinc-700 dark:text-zinc-300" strokeWidth={1.75} />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {t.dashboardComponents.announcement}
                    </h3>
                </div>
                <Link 
                    href="/announcements" 
                    className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-0.5"
                >
                    {t.dashboardComponents.viewMore} <ChevronRight className="h-3 w-3" strokeWidth={1.75} />
                </Link>
            </div>

            <div className="space-y-2.5">
                {announcements.map((announcement) => {
                    const style = categoryStyles[announcement.category] || categoryStyles.system;
                    const Icon = style.icon;
                    const dateStr = new Date(announcement.start_time).toLocaleDateString(isZh ? "zh-CN" : "en-US", { month: "numeric", day: "numeric" });
                    const isNew = (new Date().getTime() - new Date(announcement.start_time).getTime()) < 3 * 24 * 60 * 60 * 1000;

                    let href = `/announcements/${announcement.id}`;
                    if (announcement.title.includes("v1.0.0") || announcement.title.includes("v1.1.0") || announcement.title.includes("v1.1.5") || announcement.title.includes("v1.1.6") || announcement.title.includes("v1.1.7") || announcement.category === "update") href = "/updates";
                    else if (announcement.title.includes("上线啦")) href = "/announcements/launch-2026";
                    else if (announcement.title.includes("新手教程指南")) href = "/announcements/tutorials";

                    return (
                        <Link key={announcement.id} href={href} className="block group">
                            <div className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 transition-all duration-150">
                                <div className="flex items-start gap-2.5">
                                    <div className={`h-7 w-7 rounded-md ${style.bg} ${style.text} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors truncate">
                                                {announcement.title}
                                            </h4>
                                            {isNew && (
                                                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded shrink-0">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 leading-normal font-normal">
                                            {announcement.content}
                                        </p>
                                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-200/40 dark:border-zinc-700/40 text-[11px] text-zinc-400 dark:text-zinc-500">
                                            <span>{dateStr}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-primary flex items-center gap-0.5 transition-colors">
                                                {isZh ? "详情" : "Details"} <ChevronRight className="h-2.5 w-2.5" strokeWidth={1.75} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
