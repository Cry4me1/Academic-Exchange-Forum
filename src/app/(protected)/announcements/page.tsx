import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Bell, Rocket, Sparkles, Wrench, Megaphone, ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic"; // ⚡ 强制动态渲染，打碎 Next.js 在公告页面的服务端静态预编译缓存

const categoryStyles: Record<string, { icon: LucideIcon; label: string; color: string; iconBg: string }> = {
  update: {
    icon: Rocket,
    label: "版本更新",
    color: "text-sky-600 dark:text-sky-400",
    iconBg: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  },
  activity: {
    icon: Sparkles,
    label: "活动通知",
    color: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
  },
  system: {
    icon: Megaphone,
    label: "系统通知",
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
  maintenance: {
    icon: Wrench,
    label: "维护通知",
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  },
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data: announcements } = await supabase
    .from("system_announcements")
    .select(`
      *,
      creator:profiles!system_announcements_created_by_fkey(username)
    `)
    .eq("is_active", true)
    .lte("start_time", now)
    .order("start_time", { ascending: false });

  // Filter out ended announcements
  const validData = announcements?.filter((a) => !a.end_time || a.end_time > now) || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border-0 bg-white/75 dark:bg-zinc-900/55 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_4px_16px_-2px_rgba(0,0,0,0.35)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">全部公告</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Scholarly 平台的系统通知、活动与版本更新</p>
          </div>
        </div>

        {/* 跳转至更新日志 (Updates) 的水滴流光便捷通道 */}
        <Link href="/updates">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full border-0 px-4 h-9 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl text-xs sm:text-sm font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_4px_16px_-2px_rgba(0,0,0,0.35)] hover:bg-white dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer"
          >
            <Rocket className="h-3.5 w-3.5 text-sky-500" />
            <span>查看完整更新日志</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {validData.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
            <Bell className="h-11 w-11 mx-auto text-muted-foreground/45 mb-4" />
            <h3 className="text-lg font-medium text-foreground">暂无公告</h3>
            <p className="text-sm text-muted-foreground mt-1">暂时没有需要展示的公告信息</p>
          </div>
        ) : (
          validData.map((announcement) => {
            const style = categoryStyles[announcement.category] || categoryStyles.system;
            const Icon = style.icon;
            const isNew = new Date().getTime() - new Date(announcement.start_time).getTime() < 3 * 24 * 60 * 60 * 1000;

            let href = `/announcements/${announcement.id}`;
            if (
              announcement.title.includes("v1.0.0") ||
              announcement.title.includes("v1.1.0") ||
              announcement.title.includes("v1.1.5") ||
              announcement.title.includes("v1.1.6") ||
              announcement.title.includes("v1.1.7") ||
              announcement.title.includes("v1.1.8") ||
              announcement.title.includes("v1.1.9") ||
              announcement.title.includes("v2.0.0") ||
              announcement.category === "update"
            ) {
              href = "/updates";
            } else if (announcement.title.includes("上线啦")) {
              href = "/announcements/launch-2026";
            } else if (announcement.title.includes("新手教程指南")) {
              href = "/announcements/tutorials";
            }

            return (
              <Link key={announcement.id} href={href} className="block group">
                <article className="rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/50 hover:bg-white/90 dark:hover:bg-zinc-900/75 backdrop-blur-xl p-5 sm:p-6 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_8px_32px_-4px_rgba(0,0,0,0.4)] transition-all duration-200">
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`h-11 w-11 shrink-0 rounded-2xl border-0 ${style.iconBg} flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 bg-zinc-500/[0.06] dark:bg-white/[0.05] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] ${style.color}`}
                        >
                          {style.label}
                        </span>
                        {isNew && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border-0 bg-rose-500/12 text-rose-600 dark:text-rose-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)]">
                            NEW
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto sm:ml-2 font-mono">
                          {format(new Date(announcement.start_time), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        {announcement.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {announcement.content}
                      </p>
                    </div>

                    <div className="hidden sm:flex shrink-0 items-center justify-center h-9 w-9 rounded-full border-0 bg-zinc-500/[0.05] dark:bg-white/[0.05] group-hover:bg-sky-500/12 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] transition-colors">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
                    </div>
                  </div>
                </article>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
