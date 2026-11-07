"use client";

import {
    PenTool,
    BookOpen,
    Swords,
    MessageSquare,
    Coins,
    ShieldAlert,
    CheckCircle2,
    Sparkles,
    GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TutorialModuleMeta {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    badge: string;
}

export const tutorialModules: TutorialModuleMeta[] = [
    {
        id: "editor",
        title: "1. 学术编辑器实战",
        subtitle: "Slash命令 · LaTeX公式 · 定理块",
        icon: PenTool,
        badge: "核心写作",
    },
    {
        id: "publication",
        title: "2. 论文排版与导出",
        subtitle: "Nature双栏 · TOC脉冲 · PDF导出",
        icon: BookOpen,
        badge: "出版级",
    },
    {
        id: "duels",
        title: "3. 学术决斗竞技场",
        subtitle: "1v1切磋 · LP下注 · 同行评议",
        icon: Swords,
        badge: "竞技模式",
    },
    {
        id: "messages",
        title: "4. 私信与数据时效",
        subtitle: "实时私聊 · 7天附件自动清理",
        icon: MessageSquare,
        badge: "即时研讨",
    },
    {
        id: "credits",
        title: "5. 积分与学者特权",
        subtitle: "Credits流转 · VIP荣誉名片",
        icon: Coins,
        badge: "社区生态",
    },
    {
        id: "moderation",
        title: "6. 多模态 AI 审稿",
        subtitle: "深度推理 · 同行评审报告",
        icon: ShieldAlert,
        badge: "智能评审",
    },
];

interface TutorialProgressSidebarProps {
    currentModuleId: string;
    onSelectModule: (id: string) => void;
    completedModuleIds: string[];
}

export function TutorialProgressSidebar({
    currentModuleId,
    onSelectModule,
    completedModuleIds,
}: TutorialProgressSidebarProps) {
    const totalCount = tutorialModules.length;
    const completedCount = completedModuleIds.length;
    const isAllCompleted = completedCount >= totalCount;

    return (
        <div className="w-full space-y-4">
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl p-4 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-zinc-950/90 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">研学者实训进度</h3>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">完成实操点亮专属勋章</p>
                        </div>
                    </div>
                    <span className="font-mono text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-200 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-2.5 py-0.5 rounded-full border-0">
                        {completedCount} / {totalCount}
                    </span>
                </div>

                <div className="w-full h-1.5 rounded-full border-0 bg-zinc-900/[0.06] dark:bg-white/[0.08] overflow-hidden">
                    <div
                        className="h-full bg-emerald-500/85 transition-transform duration-300 origin-left rounded-full"
                        style={{ transform: `scaleX(${totalCount > 0 ? completedCount / totalCount : 0})` }}
                    />
                </div>

                {isAllCompleted && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/12 px-3 py-1 rounded-full border-0">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        恭喜！已通关全部 6 大实操实训
                    </div>
                )}
            </div>

            <div className="space-y-1.5">
                {tutorialModules.map((mod) => {
                    const isSelected = currentModuleId === mod.id;
                    const isCompleted = completedModuleIds.includes(mod.id);
                    const Icon = mod.icon;

                    return (
                        <button
                            key={mod.id}
                            type="button"
                            onClick={() => onSelectModule(mod.id)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 p-3 rounded-2xl border-0 text-left transition-[transform,background-color,box-shadow] duration-150 group cursor-pointer active:scale-[0.98]",
                                isSelected
                                    ? "bg-white/95 dark:bg-zinc-800/90 text-zinc-950 dark:text-white shadow-[0_4px_20px_-2px_rgba(14,165,233,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)]"
                                    : "bg-white/55 hover:bg-white/80 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/65 text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                            )}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 transition-colors",
                                        isSelected
                                            ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                            : "bg-zinc-900/[0.05] dark:bg-white/[0.07] text-zinc-500 dark:text-zinc-400"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium truncate leading-tight">
                                        {mod.title}
                                    </p>
                                    <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                                        {mod.subtitle}
                                    </p>
                                </div>
                            </div>

                            {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border-0 bg-zinc-900/[0.045] dark:bg-white/[0.06] text-zinc-500 shrink-0">
                                    {mod.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
