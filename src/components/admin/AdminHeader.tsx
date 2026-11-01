"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  LogOut,
  User,
  ExternalLink,
  AlertTriangle,
  FileText,
  Users,
  ScrollText,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

interface AdminHeaderProps {
  user: {
    id: string;
    role: string;
    fullName: string;
    avatarUrl: string | null;
    email: string;
  };
}

const pageTitles: Record<string, string> = {
  "/admin": "仪表盘",
  "/admin/review": "审核工作台",
  "/admin/sensitive-words": "敏感词库",
  "/admin/users": "用户管理",
  "/admin/posts": "内容管理",
  "/admin/reports": "举报处理",
  "/admin/credits": "积分管理",
  "/admin/invites": "邀请码管理",
  "/admin/duels": "对决管理",
  "/admin/announcements": "公告管理",
  "/admin/logs/moderation": "AI 审核日志",
  "/admin/logs": "操作日志",
  "/admin/settings": "系统设置",
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchPendingReports = useCallback(async () => {
    try {
      const supabase = createClient();
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingReports(count ?? 0);
    } catch {
      // 静默失败
    }
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    fetchPendingReports();
  }, [fetchPendingReports]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  const currentTitle =
    Object.entries(pageTitles).find(([path]) => pathname === path)?.[1] ??
    "管理后台";

  return (
    <div className="sticky top-0 z-30 px-4 pt-3 md:px-6">
      <header className="flex h-16 items-center gap-4 rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/55 backdrop-blur-2xl px-4 md:px-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] transition-all">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 rounded-full border-0 bg-zinc-200/40 hover:bg-zinc-200/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Navigation Sheet */}
        {mobileMenuOpen && (
          <AdminMobileNav
            role={user.role}
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
          />
        )}

        {/* Page Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            {currentTitle}
          </h1>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:block">
            Scholarly 管理控制台
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* View Site */}
          <Link href="/dashboard" target="_blank">
            <Button
              variant="ghost"
              size="icon"
              title="访问主站"
              className="hidden sm:flex h-9 w-9 rounded-full border-0 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/65 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title="切换主题"
            className="h-9 w-9 rounded-full border-0 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/65 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full border-0 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/65 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all"
              >
                <Bell className="h-4 w-4" />
                {pendingReports > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full border-0 bg-rose-500 text-[9px] font-semibold text-white flex items-center justify-center shadow-[0_2px_8px_rgba(244,63,94,0.45)]">
                    {pendingReports > 9 ? "9+" : pendingReports}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 rounded-3xl border-0 p-2 bg-white/88 dark:bg-zinc-900/88 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
            >
              <div className="px-3.5 py-2.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  通知中心
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  管理后台快捷入口
                </p>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-1" />
              <div className="space-y-1">
                {/* 待处理举报 */}
                <Link
                  href="/admin/reports?status=pending"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/12 text-rose-500">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      待处理举报
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {pendingReports > 0
                        ? `${pendingReports} 条举报等待审核`
                        : "暂无待处理举报"}
                    </p>
                  </div>
                  {pendingReports > 0 && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  )}
                </Link>

                {/* 用户管理 */}
                <Link
                  href="/admin/users"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/12 text-sky-600 dark:text-sky-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      用户管理
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      查看和管理用户
                    </p>
                  </div>
                </Link>

                {/* 内容管理 */}
                <Link
                  href="/admin/posts"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      内容管理
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      审核帖子内容
                    </p>
                  </div>
                </Link>

                {/* 操作日志 */}
                <Link
                  href="/admin/logs"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400">
                    <ScrollText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      操作日志
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      查看管理操作记录
                    </p>
                  </div>
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* 垂直渐变消融光缝 */}
          <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5 shrink-0 hidden sm:block" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-1.5 pr-3.5 h-9 rounded-full border-0 bg-zinc-200/35 hover:bg-zinc-200/65 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium">
                    {user.fullName?.charAt(0) ?? "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 hidden sm:block">
                  {user.fullName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl border-0 p-1.5 bg-white/88 dark:bg-zinc-900/88 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {user.email}
                </p>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-1" />
              <DropdownMenuItem
                asChild
                className="rounded-full font-medium text-xs px-3 py-2 cursor-pointer focus:bg-zinc-900/[0.05] dark:focus:bg-white/[0.07]"
              >
                <Link href={`/user/${user.id}`}>
                  <User className="mr-2 h-4 w-4" />
                  查看个人主页
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-full font-medium text-xs px-3 py-2 cursor-pointer focus:bg-zinc-900/[0.05] dark:focus:bg-white/[0.07]"
              >
                <Link href="/dashboard">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  返回主站
                </Link>
              </DropdownMenuItem>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-1" />
              <DropdownMenuItem className="rounded-full font-medium text-xs px-3 py-2 text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
}
