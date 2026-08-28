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
    xs: 'h-4 px-1 text-[9px] rounded font-mono font-semibold',
    sm: 'h-4.5 px-1.5 text-[10px] rounded font-mono font-semibold',
    md: 'h-5 px-2 text-[11px] rounded-md font-mono font-semibold',
    lg: 'h-6 px-2.5 text-xs rounded-md font-mono font-semibold',
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
                            'inline-flex items-center justify-center shrink-0 border select-none transition-all cursor-help tracking-tight shadow-2xs',
                            style.bg,
                            style.text,
                            style.border,
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
                <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold text-current">
                        LV.{levelNumber} · {level.title}
                    </p>
                    <p className="text-[10px] opacity-75 mt-0.5">
                        学术成就与贡献等级
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
