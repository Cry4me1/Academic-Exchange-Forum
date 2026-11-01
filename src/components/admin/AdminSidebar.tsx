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
  ChevronLeft,
  ChevronRight,
  FileCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  minRole?: string;
}

const navItems: NavItem[] = [
  {
    label: "仪表盘",
    href: "/admin",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "审核工作台",
    href: "/admin/review",
    icon: <FileCheck className="h-4 w-4" />,
  },
  {
    label: "敏感词库",
    href: "/admin/sensitive-words",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    label: "内容管理",
    href: "/admin/posts",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "用户管理",
    href: "/admin/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "举报处理",
    href: "/admin/reports",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    label: "积分管理",
    href: "/admin/credits",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    label: "邀请码管理",
    href: "/admin/invites",
    icon: <Ticket className="h-4 w-4" />,
    minRole: "super_admin",
  },
  {
    label: "对决管理",
    href: "/admin/duels",
    icon: <Swords className="h-4 w-4" />,
  },
  {
    label: "公告管理",
    href: "/admin/announcements",
    icon: <Megaphone className="h-4 w-4" />,
  },
  {
    label: "AI 审核日志",
    href: "/admin/logs/moderation",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: "操作日志",
    href: "/admin/logs",
    icon: <ScrollText className="h-4 w-4" />,
  },
  {
    label: "系统设置",
    href: "/admin/settings",
    icon: <Settings className="h-4 w-4" />,
    minRole: "super_admin",
  },
];

const roleLabels: Record<string, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  moderator: "审核员",
  analyst: "分析员",
};

const roleAuraStyles: Record<string, string> = {
  super_admin:
    "bg-amber-500/[0.14] text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_12px_rgba(245,158,11,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_12px_rgba(245,158,11,0.2)]",
  admin:
    "bg-sky-500/[0.14] text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_12px_rgba(14,165,233,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_12px_rgba(14,165,233,0.2)]",
  moderator:
    "bg-emerald-500/[0.14] text-emerald-700 dark:text-emerald-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_12px_rgba(16,185,129,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_12px_rgba(16,185,129,0.2)]",
  analyst:
    "bg-zinc-500/[0.12] text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]",
};

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="hidden md:flex py-3 pl-3 shrink-0 z-20">
        <aside
          className={cn(
            "relative flex flex-col rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/55 backdrop-blur-2xl transition-all duration-300 ease-in-out",
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.45)]",
            collapsed ? "w-[74px]" : "w-[252px]"
          )}
        >
          {/* Logo & Title */}
          <div
            className={cn(
              "flex items-center gap-3 px-4 h-16",
              collapsed && "justify-center px-2"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-0 bg-zinc-950/85 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,1)]">
              <Shield className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  Scholarly
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  管理控制台
                </span>
              </div>
            )}
          </div>

          {/* 渐变消融内部光缝 */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {/* Role Badge */}
          {!collapsed && (
            <div className="px-4 pt-3 pb-1">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border-0 px-3.5 py-1.5 backdrop-blur-xl",
                  roleAuraStyles[role] ?? roleAuraStyles.analyst
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 animate-pulse shrink-0" />
                <span className="text-xs font-medium truncate">
                  {roleLabels[role] ?? role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  item.href !== "/admin/logs" &&
                  pathname.startsWith(item.href)) ||
                (item.href === "/admin/logs" && pathname === "/admin/logs");

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-full border-0 px-3.5 py-2.5 text-sm font-medium transition-all duration-300 select-none",
                    isActive
                      ? "bg-sky-500/[0.13] dark:bg-sky-400/[0.14] text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_12px_rgba(14,165,233,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_2px_14px_rgba(14,165,233,0.22)]"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]",
                    collapsed && "justify-center px-0 h-10 w-10 mx-auto"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive
                        ? "text-sky-600 dark:text-sky-300"
                        : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="rounded-full border-0 px-3 py-1.5 text-xs font-medium bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>

          {/* 渐变消融内部光缝 */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {/* Collapse & Back to Site */}
          <div className="p-3 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full h-9 rounded-full border-0 font-medium text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.06] transition-all",
                collapsed ? "justify-center px-0" : "justify-start px-3.5"
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2 shrink-0" />
                  <span>收起菜单</span>
                </>
              )}
            </Button>

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className="flex h-9 w-full items-center justify-center rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="rounded-full border-0 px-3 py-1.5 text-xs font-medium bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)]"
                >
                  返回主站
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard"
                className="flex h-9 items-center gap-2 rounded-full border-0 px-3.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-all"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>返回主站</span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </TooltipProvider>
  );
}
