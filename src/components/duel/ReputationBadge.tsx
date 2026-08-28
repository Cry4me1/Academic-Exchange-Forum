"use client";

import { motion } from "framer-motion";
import { Trophy, Swords, TrendingUp, Shield, Code2, Sparkles, Infinity } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReputationBadgeProps {
    score: number;
    wins?: number;
    losses?: number;
    size?: "sm" | "md" | "lg";
    showStats?: boolean;
    isDeveloper?: boolean;
    developerTitle?: string;
}

// 开发者等级阈值（用于判断是否为开发者账户）
const DEVELOPER_SCORE_THRESHOLD = 99999;

// 检查是否为开发者
function checkIsDeveloper(score: number, explicitDeveloper?: boolean): boolean {
    return explicitDeveloper === true || score >= DEVELOPER_SCORE_THRESHOLD;
}

// 紧凑克制低饱和度现代配色体系
function getRank(score: number, isDeveloper?: boolean): { name: string; color: string; bgColor: string; borderColor: string; icon: string; isDev?: boolean } {
    // 开发者特殊段位
    if (checkIsDeveloper(score, isDeveloper)) {
        return {
            name: "系统开发者",
            color: "text-zinc-700 dark:text-zinc-300",
            bgColor: "bg-zinc-100/90 dark:bg-zinc-800/90",
            borderColor: "border-zinc-200/80 dark:border-zinc-700/80",
            icon: "⚡",
            isDev: true
        };
    }
    if (score >= 500) {
        return { name: "学术泰斗", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-500/8 dark:bg-amber-500/15", borderColor: "border-amber-500/25", icon: "👑" };
    } else if (score >= 300) {
        return { name: "资深学者", color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-500/8 dark:bg-purple-500/15", borderColor: "border-purple-500/25", icon: "🎓" };
    } else if (score >= 200) {
        return { name: "知名研究员", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-500/8 dark:bg-blue-500/15", borderColor: "border-blue-500/25", icon: "📚" };
    } else if (score >= 150) {
        return { name: "助理研究员", color: "text-cyan-700 dark:text-cyan-400", bgColor: "bg-cyan-500/8 dark:bg-cyan-500/15", borderColor: "border-cyan-500/25", icon: "🔬" };
    } else if (score >= 100) {
        return { name: "学术新秀", color: "text-emerald-700 dark:text-emerald-400", bgColor: "bg-emerald-500/8 dark:bg-emerald-500/15", borderColor: "border-emerald-500/25", icon: "🌱" };
    } else if (score >= 50) {
        return { name: "求知学徒", color: "text-zinc-600 dark:text-zinc-400", bgColor: "bg-zinc-100 dark:bg-zinc-800/60", borderColor: "border-zinc-200/80 dark:border-zinc-700/80", icon: "📖" };
    } else {
        return { name: "论坛新人", color: "text-zinc-500 dark:text-zinc-400", bgColor: "bg-zinc-100/60 dark:bg-zinc-800/40", borderColor: "border-zinc-200/60 dark:border-zinc-800/60", icon: "👤" };
    }
}

export function ReputationBadge({
    score,
    wins = 0,
    losses = 0,
    size = "md",
    showStats = false,
    isDeveloper,
    developerTitle,
}: ReputationBadgeProps) {
    const rank = getRank(score, isDeveloper);
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const isDevMode = rank.isDev;

    const sizeClasses = {
        sm: "h-5 px-2 text-[11px] rounded-full gap-1",
        md: "h-6 px-2.5 text-xs rounded-full gap-1.5",
        lg: "h-7 px-3 text-xs rounded-full gap-1.5",
    };

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-3.5 w-3.5",
        lg: "h-4 w-4",
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={`inline-flex items-center font-medium cursor-help border select-none transition-all shadow-2xs
                            ${rank.bgColor} ${rank.color} ${rank.borderColor} ${sizeClasses[size]}`}
                    >
                        <Shield className={`${iconSizes[size]} shrink-0 opacity-70`} strokeWidth={1.75} />
                        <span className="font-mono font-semibold tabular-nums">
                            {isDevMode ? "∞" : score}
                        </span>
                    </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-64 p-0">
                    <div className="p-4 space-y-3">
                        {/* 段位标题 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isDevMode ? (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center">
                                        <Code2 className="h-5 w-5 text-white" />
                                    </div>
                                ) : (
                                    <div className={`h-9 w-9 rounded-lg ${rank.bgColor} ${rank.borderColor} border flex items-center justify-center`}>
                                        <Shield className={`h-5 w-5 ${rank.color}`} />
                                    </div>
                                )}
                                <div>
                                    {isDevMode ? (
                                        <p className="font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                                            {developerTitle || rank.name}
                                        </p>
                                    ) : (
                                        <p className={`font-bold ${rank.color}`}>{rank.name}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {isDevMode ? '开发者特权' : '信誉积分'}
                                    </p>
                                </div>
                            </div>
                            {isDevMode ? (
                                <div className="flex items-center gap-1">
                                    <Infinity className="h-6 w-6 text-fuchsia-500" />
                                </div>
                            ) : (
                                <div className={`text-2xl font-bold ${rank.color}`}>{score}</div>
                            )}
                        </div>

                        {/* 开发者特殊标识 */}
                        {isDevMode && (
                            <>
                                <div className="h-px bg-gradient-to-r from-violet-500/50 via-fuchsia-500/50 to-pink-500/50" />
                                <div className="flex items-center gap-2 text-sm">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <span className="text-muted-foreground">信誉分永久保护</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="h-4 w-4 text-emerald-500" />
                                    <span className="text-muted-foreground">免疫决斗惩罚</span>
                                </div>
                            </>
                        )}

                        {/* 决斗统计 */}
                        {showStats && (wins > 0 || losses > 0) && (
                            <>
                                <div className="h-px bg-border" />
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1 text-green-500">
                                            <Trophy className="h-4 w-4" />
                                            <span className="font-bold">{wins}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">胜场</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1 text-red-500">
                                            <Swords className="h-4 w-4" />
                                            <span className="font-bold">{losses}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">败场</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1 text-blue-500">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="font-bold">{winRate}%</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">胜率</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 积分说明 */}
                        <div className="h-px bg-border" />
                        <p className="text-xs text-muted-foreground">
                            {isDevMode
                                ? '感谢开发者为社区所做的贡献！'
                                : '通过学术决斗赢取积分，提升你的学术段位！'
                            }
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// 紧凑版信誉展示（用于列表项）
export function ReputationBadgeCompact({ score, isDeveloper }: { score: number; isDeveloper?: boolean }) {
    const rank = getRank(score, isDeveloper);
    const isDevMode = rank.isDev;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={`inline-flex items-center gap-1 h-4.5 px-1.5 rounded-full text-[10px] font-mono font-semibold cursor-help border select-none shadow-2xs
                            ${rank.bgColor} ${rank.color} ${rank.borderColor}`}
                    >
                        <Shield className="h-2.5 w-2.5 opacity-70" strokeWidth={1.75} />
                        <span>{isDevMode ? "∞" : score}</span>
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    {isDevMode ? (
                        <p className="font-semibold text-current">系统开发者 · 信誉分 ∞</p>
                    ) : (
                        <p className="font-semibold text-current">{rank.name} · 信誉分 {score}</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
