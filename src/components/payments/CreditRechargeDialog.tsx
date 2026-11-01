'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
    ArrowUpRight,
    Check,
    ChevronDown,
    Clock,
    Cpu,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react'
import { useRef, useState } from 'react'

type AuraTheme = 'sky' | 'amber'

interface PricingPlan {
    id: string
    name: string
    price: number // 实付人民币金额
    credits: number // 获得总积分
    bonus: number // 赠送积分
    tagline: string // 固定高度副文案，保障三卡绝对对齐
    icon: React.ReactNode
    popular?: boolean
    aura: AuraTheme
}

const plans: PricingPlan[] = [
    {
        id: 'basic',
        name: '基础包',
        price: 10,
        credits: 100,
        bonus: 0,
        tagline: '标准兑换基准额度',
        icon: <Zap className="w-4 h-4" strokeWidth={1.85} />,
        aura: 'sky',
    },
    {
        id: 'pro',
        name: '进阶包',
        price: 50,
        credits: 550,
        bonus: 50,
        tagline: '包含赠送 50 积分',
        icon: <Sparkles className="w-4 h-4" strokeWidth={1.85} />,
        popular: true,
        aura: 'sky',
    },
    {
        id: 'scholar',
        name: '学术探索包',
        price: 100,
        credits: 1200,
        bonus: 200,
        tagline: '包含赠送 200 积分',
        icon: <Cpu className="w-4 h-4" strokeWidth={1.85} />,
        aura: 'amber',
    },
]

const auraStyles: Record<
    AuraTheme,
    {
        selectedSurface: string
        ambientOrb: string
        iconPill: string
        iconPillSelected: string
        bonusPill: string
        checkCircle: string
    }
> = {
    sky: {
        selectedSurface:
            'bg-white/95 dark:bg-zinc-800/85 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_12px_32px_-6px_rgba(14,165,233,0.20),0_4px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_14px_34px_-6px_rgba(14,165,233,0.24),0_6px_16px_-4px_rgba(0,0,0,0.5)]',
        ambientOrb: 'bg-sky-500/[0.16] dark:bg-sky-400/[0.14]',
        iconPill:
            'bg-zinc-900/[0.05] text-zinc-600 dark:bg-white/[0.07] dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]',
        iconPillSelected:
            'bg-sky-500/[0.14] text-sky-600 dark:bg-sky-400/[0.16] dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_10px_rgba(14,165,233,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_2px_10px_rgba(14,165,233,0.22)]',
        bonusPill:
            'bg-sky-500/[0.12] text-sky-700 dark:bg-sky-400/[0.14] dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]',
        checkCircle:
            'bg-sky-500 text-white shadow-[0_2px_10px_rgba(14,165,233,0.36),inset_0_1px_0.5px_rgba(255,255,255,0.65)]',
    },
    amber: {
        selectedSurface:
            'bg-white/95 dark:bg-zinc-800/85 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_12px_32px_-6px_rgba(245,158,11,0.22),0_4px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.22),0_14px_34px_-6px_rgba(245,158,11,0.24),0_6px_16px_-4px_rgba(0,0,0,0.5)]',
        ambientOrb: 'bg-amber-500/[0.18] dark:bg-amber-400/[0.14]',
        iconPill:
            'bg-zinc-900/[0.05] text-zinc-600 dark:bg-white/[0.07] dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]',
        iconPillSelected:
            'bg-amber-500/[0.15] text-amber-700 dark:bg-amber-400/[0.16] dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_10px_rgba(245,158,11,0.22)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_2px_10px_rgba(245,158,11,0.22)]',
        bonusPill:
            'bg-amber-500/[0.14] text-amber-700 dark:bg-amber-400/[0.16] dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]',
        checkCircle:
            'bg-amber-500 text-white shadow-[0_2px_10px_rgba(245,158,11,0.38),inset_0_1px_0.5px_rgba(255,255,255,0.65)]',
    },
}

function PlanGlassCard({
    plan,
    isSelected,
    onSelect,
}: {
    plan: PricingPlan
    isSelected: boolean
    onSelect: () => void
}) {
    const reflexRef = useRef<HTMLDivElement>(null)
    const theme = auraStyles[plan.aura]

    // 120fps 光随鼠动物理无色漫反射：仅写入无后代文本节点的独立光学层，避免级联重算
    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
        if (!reflexRef.current) return
        const rect = e.currentTarget.getBoundingClientRect()
        reflexRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
        reflexRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
    }

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={onSelect}
            onPointerMove={handlePointerMove}
            className={cn(
                'group relative flex flex-col text-left rounded-3xl border-0 p-5 overflow-hidden cursor-pointer outline-none select-none',
                'bg-zinc-900/[0.035] dark:bg-white/[0.04] backdrop-blur-xl',
                'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-4px_rgba(0,0,0,0.04)]',
                'dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.10),0_6px_20px_-4px_rgba(0,0,0,0.35)]',
                '[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/75 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.07]',
                'active:scale-[0.98] motion-reduce:active:scale-100',
                'transition-[transform,background-color] duration-150 ease-[var(--ease-out-snappy)]',
                'focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
        >
            {/* 选中态三层物理光学晶体层（仅通过 opacity GPU 合成过渡，零重绘、零布局跳动） */}
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-200 ease-[var(--ease-out-snappy)]',
                    theme.selectedSurface,
                    isSelected ? 'opacity-100' : 'opacity-0'
                )}
            />

            {/* 选中态温润单色环境微光晕 (Ambient Aura Glow) */}
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 ease-[var(--ease-out-snappy)]',
                    theme.ambientOrb,
                    isSelected ? 'opacity-100' : 'opacity-0'
                )}
            />

            {/* 120fps 纯物理无色环境反射层 (Achromatic Mouse Reflex) */}
            <div
                ref={reflexRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
            >
                <div
                    className="absolute inset-0 dark:hidden"
                    style={{
                        background:
                            'radial-gradient(140px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.72), transparent 80%)',
                    }}
                />
                <div
                    className="absolute inset-0 hidden dark:block"
                    style={{
                        background:
                            'radial-gradient(140px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.11), transparent 80%)',
                    }}
                />
            </div>

            {/* 最受欢迎水滴胶囊徽章 */}
            {plan.popular && (
                <span
                    className={cn(
                        'absolute top-4 right-4 z-10 inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-[10px] font-medium leading-4',
                        'bg-amber-500/[0.15] text-amber-700 dark:bg-amber-400/[0.16] dark:text-amber-300',
                        'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_10px_rgba(245,158,11,0.18)]',
                        'dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_2px_10px_rgba(245,158,11,0.20)]'
                    )}
                >
                    最受欢迎
                </span>
            )}

            {/* 卡片主体内容：全状态字重与行高恒定锁死，杜绝 1px 布局跳动 */}
            <div className="relative z-10 flex flex-col h-full w-full">
                {/* 套餐图标与名称 */}
                <div className="flex items-center gap-2 pr-14">
                    <span
                        className={cn(
                            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-0 transition-colors duration-200',
                            isSelected ? theme.iconPillSelected : theme.iconPill
                        )}
                    >
                        {plan.icon}
                    </span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {plan.name}
                    </span>
                </div>

                {/* 价格展示（光学负字距 + 等宽数字） */}
                <div className="mt-4 mb-3 flex items-baseline gap-1">
                    <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                        ¥
                    </span>
                    <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums text-zinc-950 dark:text-white">
                        {plan.price}
                    </span>
                </div>

                {/* 积分与赠礼胶囊 */}
                <div className="flex-1 space-y-2">
                    <div className="text-base font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
                        {plan.credits.toLocaleString()} 积分
                    </div>

                    <div className="min-h-[24px] flex items-center">
                        {plan.bonus > 0 ? (
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium',
                                    theme.bonusPill
                                )}
                            >
                                {plan.tagline}
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium bg-zinc-900/[0.04] text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                {plan.tagline}
                            </span>
                        )}
                    </div>
                </div>

                {/* 底部水滴单选指示器与状态文案 */}
                <div className="mt-5 flex items-center justify-between">
                    <span
                        className={cn(
                            'relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-0 transition-colors duration-200',
                            isSelected
                                ? theme.checkCircle
                                : 'bg-zinc-900/[0.06] dark:bg-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.45),0_1px_0.5px_rgba(255,255,255,0.08)]'
                        )}
                    >
                        <Check
                            className={cn(
                                'w-3.5 h-3.5 transition-[transform,opacity] duration-150 ease-[var(--ease-out-snappy)] motion-reduce:transition-none',
                                isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                            )}
                            strokeWidth={2.5}
                        />
                    </span>

                    <span
                        className={cn(
                            'text-[11px] font-medium transition-colors duration-200',
                            isSelected
                                ? 'text-zinc-700 dark:text-zinc-200'
                                : 'text-zinc-400 dark:text-zinc-500'
                        )}
                    >
                        {isSelected ? '当前已选' : '选择方案'}
                    </span>
                </div>
            </div>
        </button>
    )
}

export function CreditRechargeDialog({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [selectedPlan, setSelectedPlan] = useState<string>('pro')
    const [showTerms, setShowTerms] = useState(false)
    const [agreed, setAgreed] = useState(true)
    const shouldReduceMotion = useReducedMotion()

    const activePlan = plans.find((p) => p.id === selectedPlan) ?? plans[1]

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'sm:max-w-[700px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl border-0 select-none',
                    'bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl text-zinc-900 dark:text-zinc-100',
                    'shadow-[0_24px_64px_-12px_rgba(0,0,0,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)]',
                    'dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.68),inset_0_1px_0.5px_rgba(255,255,255,0.16)]'
                )}
            >
                {/* 顶部菲涅尔物理透光顶缝 */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/25 to-transparent"
                />

                {/* 顶部温润无负担环境漫射天光 */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[420px] rounded-full bg-sky-500/[0.10] dark:bg-sky-400/[0.07] blur-3xl"
                />

                <div className="relative p-6 sm:p-8">
                    {/* 顶部标题区 */}
                    <DialogHeader className="mb-6 text-left pr-10 space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-sky-500/[0.12] dark:bg-sky-400/[0.14] text-sky-600 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16)]">
                                <Sparkles className="w-4.5 h-4.5" strokeWidth={1.85} />
                            </div>
                            <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950 dark:text-white">
                                升级你的学术探索
                            </DialogTitle>
                            <span className="inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium bg-amber-500/[0.14] text-amber-700 dark:bg-amber-400/[0.15] dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_10px_rgba(245,158,11,0.14)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16)]">
                                新用户首月赠 100 积分
                            </span>
                        </div>
                        <DialogDescription className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            获取信用积分以使用 Ask AI 的进阶数据分析、论文解析及长文本推理能力。新用户首月专享 100 积分赠送。
                        </DialogDescription>
                    </DialogHeader>

                    {/* 三档积分方案卡片组 */}
                    <div
                        role="radiogroup"
                        aria-label="积分充值方案"
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
                    >
                        {plans.map((plan) => (
                            <PlanGlassCard
                                key={plan.id}
                                plan={plan}
                                isSelected={selectedPlan === plan.id}
                                onSelect={() => setSelectedPlan(plan.id)}
                            />
                        ))}
                    </div>

                    {/* 渐变消融内部光缝 */}
                    <div className="my-5 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 服务使用条款与退款政策折叠区 */}
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                                type="button"
                                aria-expanded={showTerms}
                                onClick={() => setShowTerms((prev) => !prev)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 h-7 px-3 rounded-full border-0 cursor-pointer outline-none',
                                    'text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                                    'bg-zinc-200/45 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/75 dark:bg-white/[0.05] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.09]',
                                    'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]',
                                    'active:scale-[0.97] motion-reduce:active:scale-100',
                                    'transition-[transform,background-color,color] duration-150 ease-[var(--ease-out-snappy)]',
                                    'focus-visible:ring-2 focus-visible:ring-sky-500/40'
                                )}
                            >
                                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" strokeWidth={1.85} />
                                <span>Scholarly 积分服务使用条款与退款政策</span>
                                <ChevronDown
                                    className={cn(
                                        'w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ease-[var(--ease-out-snappy)] motion-reduce:transition-none',
                                        showTerms && 'rotate-180'
                                    )}
                                    strokeWidth={2}
                                />
                            </button>

                            <a
                                href="/rules?tab=credits"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex items-center gap-1 h-7 px-3 rounded-full border-0',
                                    'text-[11px] font-medium text-sky-600 dark:text-sky-400',
                                    'bg-sky-500/[0.08] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sky-500/[0.14] dark:bg-sky-400/[0.08] dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-sky-400/[0.14]',
                                    'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.10)]',
                                    'active:scale-[0.97] motion-reduce:active:scale-100',
                                    'transition-[transform,background-color] duration-150 ease-[var(--ease-out-snappy)]'
                                )}
                            >
                                <span>查看完整条款</span>
                                <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                            </a>
                        </div>

                        <AnimatePresence initial={false}>
                            {showTerms && (
                                <motion.div
                                    key="credit-terms-panel"
                                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                    transition={
                                        shouldReduceMotion
                                            ? { duration: 0.15 }
                                            : { type: 'spring', duration: 0.32, bounce: 0 }
                                    }
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3">
                                        <div
                                            className={cn(
                                                'p-4 rounded-2xl border-0 max-h-44 overflow-y-auto space-y-2.5 text-[11px] leading-relaxed',
                                                'bg-zinc-900/[0.035] dark:bg-white/[0.04] backdrop-blur-md',
                                                'text-zinc-600 dark:text-zinc-400',
                                                'shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]'
                                            )}
                                        >
                                            <p>
                                                <strong className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    1. 虚拟资产属性：
                                                </strong>
                                                Scholarly 积分属纯数字化虚拟服务凭据，非任何法定货币或金融投资品。
                                                <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    不可转让、不可倒卖、严禁反向提现或任何场外交易
                                                </strong>
                                                。
                                            </p>
                                            <p>
                                                <strong className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    2. 7 天未消费退款机制：
                                                </strong>
                                                充值后 7 个自然日内且积分
                                                <strong className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    完全未产生任何消费或调用
                                                </strong>
                                                ，可联系客服申请原路退款（扣除 0.6% 渠道手续费）。一经产生任何消费或超过 7 天，依据数字化商品属性不予退款。
                                            </p>
                                            <p>
                                                <strong className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    3. 365 天有效期与先进先出：
                                                </strong>
                                                充值积分自到账起 365 个自然日内有效，逾期自动失效。扣费时系统自动遵循先进先出规则，优先消耗最临近到期的积分批次。
                                            </p>
                                            <p>
                                                <strong className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    4. 赠送积分规则：
                                                </strong>
                                                充值套餐附赠积分及社区活动奖励积分属于无偿赠予，不具有现金对价，任何情况下均不支持折现或单独退款。
                                            </p>
                                            <p>
                                                <strong className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    5. AI 学术免责声明：
                                                </strong>
                                                AI 大模型生成的研读分析与学术推导仅供科研参考，不构成同行评审结论或专业建议，学者应自行严谨审慎验证。
                                            </p>
                                            <p>
                                                <strong className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    6. 安全风控与反作弊：
                                                </strong>
                                                严禁利用系统漏洞套现、信用卡恶意套现、洗钱或利用 AI 生成违规内容。违规者将被立即清空积分、终止服务并追究法律责任。
                                            </p>

                                            {/* 内部消融分割光缝 */}
                                            <div className="my-2 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                                            <div className="pt-0.5 text-center">
                                                <a
                                                    href="/rules?tab=credits"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                                                >
                                                    <span>前往法务合规中心阅读《Scholarly 积分服务使用条款》全文</span>
                                                    <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 底部协议确认与黑曜石/白月光核心操作区 */}
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={agreed}
                                    aria-label="同意积分服务使用条款与退款政策"
                                    onClick={() => setAgreed((prev) => !prev)}
                                    className={cn(
                                        'inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-0 cursor-pointer outline-none',
                                        'active:scale-[0.92] motion-reduce:active:scale-100',
                                        'transition-[transform,background-color] duration-150 ease-[var(--ease-out-snappy)]',
                                        'focus-visible:ring-2 focus-visible:ring-sky-500/40',
                                        agreed
                                            ? 'bg-sky-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.32),inset_0_1px_0.5px_rgba(255,255,255,0.65)]'
                                            : 'bg-zinc-900/[0.07] dark:bg-white/[0.10] shadow-[inset_0_1px_2px_rgba(0,0,0,0.10),0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]'
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            'w-3 h-3 transition-[transform,opacity] duration-150 ease-[var(--ease-out-snappy)] motion-reduce:transition-none',
                                            agreed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                                        )}
                                        strokeWidth={2.75}
                                    />
                                </button>

                                <span
                                    onClick={() => setAgreed((prev) => !prev)}
                                    className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 cursor-pointer"
                                >
                                    我已阅读并同意
                                    <a
                                        href="/rules?tab=credits"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 mx-1 underline-offset-2 hover:underline"
                                    >
                                        《Scholarly 积分服务使用条款》
                                    </a>
                                    与退款政策
                                </span>
                            </div>

                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                                已选 {activePlan.name}（¥{activePlan.price} / {activePlan.credits.toLocaleString()} 积分）· 1 元 = 10 积分 · 支持支付宝 / 微信合规支付
                            </p>
                        </div>

                        <Button
                            disabled={true}
                            className={cn(
                                'relative overflow-hidden shrink-0 h-10 px-5 rounded-full border-0 font-medium text-xs sm:text-sm',
                                'bg-zinc-950/85 text-white dark:bg-white/90 dark:text-zinc-950 backdrop-blur-xl',
                                'shadow-[0_4px_16px_-2px_rgba(0,0,0,0.24),inset_0_1px_1px_rgba(255,255,255,0.38)]',
                                'dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.18),inset_0_1px_1.5px_rgba(255,255,255,1)]',
                                'disabled:opacity-65 disabled:cursor-not-allowed gap-1.5'
                            )}
                        >
                            <Clock className="w-3.5 h-3.5 opacity-80" strokeWidth={2} />
                            <span>支付功能即将上线</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
