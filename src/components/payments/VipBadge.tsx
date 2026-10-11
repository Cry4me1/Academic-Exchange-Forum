'use client'

import { getScholarLevelByNumber } from '@/lib/vip-utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface VipBadgeProps {
    /** 学者等级数字 (1-6)，直接从 profiles.vip_level 读取 */
    vipLevel: number
    size?: 'xs' | 'sm' | 'md' | 'lg'
    showTitle?: boolean
    className?: string
}

// 等级徽章规范：统一白底，彩字按等级划分，最高级为红色
const levelTextColorStyles: Record<number, { text: string; label: string }> = {
    1: {
        text: 'text-zinc-600',
        label: 'Lv1 · 见习',
    },
    2: {
        text: 'text-emerald-600',
        label: 'Lv2 · 进阶',
    },
    3: {
        text: 'text-sky-600',
        label: 'Lv3 · 资深',
    },
    4: {
        text: 'text-violet-600',
        label: 'Lv4 · 领军',
    },
    5: {
        text: 'text-amber-600',
        label: 'Lv5 · 讲席',
    },
    6: {
        text: 'text-red-600', // 最高级使用红色
        label: 'Lv6 · 院士',
    },
}

// 严密尺寸与高度锁定，确保零布局跳动（Zero Layout Shift）
const sizeConfig = {
    xs: 'h-4 px-1.5 text-[9px] rounded-full font-mono font-bold leading-none',
    sm: 'h-4.5 px-2 text-[10px] rounded-full font-mono font-bold leading-none',
    md: 'h-5 px-2.5 text-[11px] rounded-full font-mono font-bold leading-none',
    lg: 'h-6 px-3 text-xs rounded-full font-mono font-bold leading-none',
}

export function VipBadge({ vipLevel = 1, size = 'sm', showTitle = false, className = '' }: VipBadgeProps) {
    const levelNumber = Math.min(Math.max(Number(vipLevel) || 1, 1), 6)
    const level = getScholarLevelByNumber(levelNumber)
    const style = levelTextColorStyles[levelNumber] || levelTextColorStyles[1]
    const sizeClass = sizeConfig[size] || sizeConfig.sm

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className={cn(
                            'inline-flex items-center justify-center shrink-0 border-0 rounded-full select-none transition-all cursor-help tracking-tight bg-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_1px_3px_rgba(0,0,0,0.12),0_0.5px_1px_rgba(0,0,0,0.06)]',
                            style.text,
                            sizeClass,
                            className
                        )}
                    >
                        <span>Lv.{levelNumber}</span>
                        {showTitle && (
                            <span className="ml-1 font-sans font-medium opacity-90 text-[10px] hidden sm:inline">
                                学者
                            </span>
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    sideOffset={6}
                    className="text-xs border-0 rounded-2xl bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-200 backdrop-blur-2xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] px-3.5 py-2.5 pointer-events-none"
                >
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                            <span className={cn('font-bold', style.text)}>
                                学者等级 · Lv.{levelNumber}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                                {level.minExp} EXP
                            </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            学术产出、同行认可与社区共建阶梯
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// 统一导出学者等级徽章别名
export const ScholarLevelBadge = VipBadge
