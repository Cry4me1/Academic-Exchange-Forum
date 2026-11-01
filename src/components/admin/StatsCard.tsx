"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  gradient?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = "from-sky-500/10 to-cyan-500/10",
  className,
}: StatsCardProps) {
  const trendDirection = trend
    ? trend.value > 0
      ? "up"
      : trend.value < 0
        ? "down"
        : "neutral"
    : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border-0 p-5 backdrop-blur-2xl transition-all duration-300",
        "bg-white/75 hover:bg-white/85 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)]",
        "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* 120fps 纯物理无色环境反射 (浅色模式) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          background:
            "radial-gradient(160px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.65), transparent 80%)",
        }}
      />
      {/* 120fps 纯物理无色环境反射 (深色模式) */}
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:block"
        style={{
          background:
            "radial-gradient(160px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.10), transparent 80%)",
        }}
      />

      {/* 柔和单色微光晕底衬 */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-40 blur-2xl transition-all duration-500 group-hover:opacity-70",
          gradient
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && trendDirection && (
            <div className="flex items-center gap-2 pt-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {trend.label}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border-0 px-2 py-0.5 text-[10px] font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]",
                  trendDirection === "up" &&
                    "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
                  trendDirection === "down" &&
                    "bg-rose-500/12 text-rose-600 dark:text-rose-400",
                  trendDirection === "neutral" &&
                    "bg-zinc-500/12 text-zinc-600 dark:text-zinc-400"
                )}
              >
                {trendDirection === "up" && (
                  <TrendingUp className="h-3 w-3" />
                )}
                {trendDirection === "down" && (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendDirection === "neutral" && (
                  <Minus className="h-3 w-3" />
                )}
                {trend.value > 0 ? "+" : ""}
                {trend.value}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-0 bg-gradient-to-br backdrop-blur-md transition-transform duration-300 group-hover:scale-105",
            "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
