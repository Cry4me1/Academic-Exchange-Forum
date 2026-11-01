"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Coins,
  Swords,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  Ticket,
  FileCheck,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  X,
} from "lucide-react";
import { useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "仪表盘", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "审核工作台", href: "/admin/review", icon: <FileCheck className="h-4 w-4" /> },
  { label: "敏感词库", href: "/admin/sensitive-words", icon: <ShieldAlert className="h-4 w-4" /> },
  { label: "内容管理", href: "/admin/posts", icon: <FileText className="h-4 w-4" /> },
  { label: "用户管理", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "举报处理", href: "/admin/reports", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "积分管理", href: "/admin/credits", icon: <Coins className="h-4 w-4" /> },
  { label: "邀请码管理", href: "/admin/invites", icon: <Ticket className="h-4 w-4" /> },
  { label: "对决管理", href: "/admin/duels", icon: <Swords className="h-4 w-4" /> },
  { label: "公告管理", href: "/admin/announcements", icon: <Megaphone className="h-4 w-4" /> },
  { label: "AI 审核日志", href: "/admin/logs/moderation", icon: <Sparkles className="h-4 w-4" /> },
  { label: "操作日志", href: "/admin/logs", icon: <ScrollText className="h-4 w-4" /> },
  { label: "系统设置", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
];

interface AdminMobileNavProps {
  role: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminMobileNav({ open, onOpenChange }: AdminMobileNavProps) {
  const pathname = usePathname();

  // Close when navigating
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        onClick={() => onOpenChange(false)}
      />

      {/* Floating Glass Drawer */}
      <div className="fixed inset-y-3 left-3 z-50 flex w-72 flex-col rounded-3xl border-0 bg-white/88 dark:bg-zinc-900/88 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.65),inset_0_1px_0.5px_rgba(255,255,255,0.14)] md:hidden animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border-0 bg-zinc-950/85 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.38)]">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Scholarly
              </div>
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                管理控制台
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-zinc-200/45 hover:bg-zinc-200/75 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/admin/logs" &&
                pathname.startsWith(item.href)) ||
              (item.href === "/admin/logs" && pathname === "/admin/logs");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-full border-0 px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-sky-500/[0.13] dark:bg-sky-400/[0.14] text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_12px_rgba(14,165,233,0.18)]"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

        {/* Back to site */}
        <div className="p-3">
          <Link
            href="/dashboard"
            className="flex h-9 items-center gap-2 rounded-full border-0 px-3.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/65 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>返回主站</span>
          </Link>
        </div>
      </div>
    </>
  );
}
