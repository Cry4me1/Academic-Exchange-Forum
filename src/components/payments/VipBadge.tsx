'use client'

import { getVipLevelByNumber } from '@/lib/vip-utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface VipBadgeProps {
    /** VIP 等级数字 (1-6)，直接从数据库 profiles.vip_level 读取 */
    vipLevel: number
    size?: 'xs' | 'sm' | 'md' | 'lg'
    showTitle?: boolean
    className?: string
}

// 克制低饱和度现代配色体系
const levelSubtleStyles: Record<number, { bg: string; text: string; border: string }> = {
    1: {
        bg: 'bg-zinc-100 dark:bg-zinc-800/80',
        text: 'text-zinc-600 dark:text-zinc-400',
        border: 'border-zinc-200/80 dark:border-zinc-700/80',
    },
    2: {
        bg: 'bg-emerald-500/8 dark:bg-emerald-500/15',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/25',
    },
    3: {
        bg: 'bg-blue-500/8 dark:bg-blue-500/15',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/25',
    },
    4: {
        bg: 'bg-purple-500/8 dark:bg-purple-500/15',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500/25',
    },
    5: {
        bg: 'bg-amber-500/8 dark:bg-amber-500/15',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/25',
    },
    6: {
        bg: 'bg-rose-500/8 dark:bg-rose-500/15',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/25',
    },
}

const sizeConfig = {
    xs: 'h-4 px-1.5 text-[9px] rounded-full font-mono font-medium',
    sm: 'h-4.5 px-2 text-[10px] rounded-full font-mono font-medium',
    md: 'h-5 px-2.5 text-[11px] rounded-full font-mono font-medium',
    lg: 'h-6 px-3 text-xs rounded-full font-mono font-medium',
}

export function VipBadge({ vipLevel = 1, size = 'sm', showTitle = false, className = '' }: VipBadgeProps) {
    const levelNumber = Math.min(Math.max(Number(vipLevel) || 1, 1), 6)
    const level = getVipLevelByNumber(levelNumber)
    const style = levelSubtleStyles[levelNumber] || levelSubtleStyles[1]
    const sizeClass = sizeConfig[size] || sizeConfig.sm

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn(
                            'inline-flex items-center justify-center shrink-0 border-0 rounded-full select-none transition-all cursor-help tracking-tight shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]',
                            style.bg,
                            style.text,
                            sizeClass,
                            className
                        )}
                    >
                        <span>LV.{levelNumber}</span>
                        {showTitle && (
                            <span className="ml-1 font-sans font-medium opacity-85 text-[10px] hidden sm:inline">
                                {level.title}
                            </span>
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    sideOffset={6}
                    className="text-xs border-0 rounded-2xl bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-2px_rgba(0,0,0,0.4)] px-3 py-2 pointer-events-none"
                >
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">
                        LV.{levelNumber} · {level.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        学术成就与贡献等级
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
