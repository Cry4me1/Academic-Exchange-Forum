'use client'

import { purchaseCredits } from '@/app/(protected)/credits/actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Check, Cpu, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface PricingPlan {
    id: string
    name: string
    price: number // 实付人民币金额
    credits: number // 获得积分
    bonus: number // 赠送积分
    icon: React.ReactNode
    popular?: boolean
    gradient: string
}

const plans: PricingPlan[] = [
    {
        id: 'basic',
        name: '基础包',
        price: 10,
        credits: 100,
        bonus: 0,
        icon: <Zap className="w-5 h-5" />,
        gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
        id: 'pro',
        name: '进阶包',
        price: 50,
        credits: 550,
        bonus: 50,
        icon: <Sparkles className="w-5 h-5" />,
        popular: true,
        gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
        id: 'scholar',
        name: '学术探索包',
        price: 100,
        credits: 1200,
        bonus: 200,
        icon: <Cpu className="w-5 h-5" />,
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
]

export function CreditRechargeDialog({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [selectedPlan, setSelectedPlan] = useState<string>('pro')
    const [isLoading, setIsLoading] = useState(false)
    const [showTerms, setShowTerms] = useState(false)

    const handlePurchase = async () => {
        setIsLoading(true)

        try {
            const result = await purchaseCredits(selectedPlan)

            if (result.error) {
                toast.error(result.error)
                setIsLoading(false)
                return
            }

            // 购买成功
            toast.success(`购买成功！当前余额: ${result.newBalance?.toLocaleString()} 积分`)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#d946ef', '#f59e0b', '#3b82f6'],
            })
            onOpenChange(false)
        } catch (err) {
            toast.error('购买失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] border-none bg-zinc-950 text-white p-0 overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                {/* 顶部绚丽背景光晕 */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/30 to-transparent -z-10 blur-3xl pointer-events-none" />

                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-bold flex items-center gap-2 text-white">
                            <Sparkles className="text-purple-400 w-6 h-6" />
                            升级你的学术探索
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base mt-2">
                            获取信用积分以使用 Ask AI 的进阶数据分析、论文解析及长文本推理能力。
                            新用户首月专享 100 积分赠送。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <motion.div
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 p-5 overflow-hidden
                  ${selectedPlan === plan.id
                                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                                    }`}
                            >
                                {/* 选中态渐变底色 */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-50 pointer-events-none`} />

                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        最受欢迎
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-2 text-zinc-200">
                                        <span className="text-purple-400">{plan.icon}</span>
                                        <span className="font-semibold">{plan.name}</span>
                                    </div>

                                    <div className="mt-2 mb-4">
                                        <span className="text-3xl font-bold">¥{plan.price}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="text-xl font-bold text-white mb-1">
                                            {plan.credits} 积分
                                        </div>
                                        {plan.bonus > 0 && (
                                            <div className="text-sm font-medium text-purple-400">
                                                包含赠送的 {plan.bonus} 积分
                                            </div>
                                        )}
                                    </div>

                                    {/* 选中的标识圈 */}
                                    <div className={`mt-4 w-6 h-6 rounded-full flex items-center justify-center border-2 
                    ${selectedPlan === plan.id ? 'border-purple-500 bg-purple-500' : 'border-zinc-600'}`}>
                                        {selectedPlan === plan.id && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 渐变消融分割微光缝 */}
                    <div className="my-5 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-800/80 to-transparent" />

                    {/* 使用条款 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={() => setShowTerms(!showTerms)}
                                className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Scholarly 积分服务使用条款与退款政策</span>
                                <motion.span
                                    animate={{ rotate: showTerms ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-block text-[10px] text-zinc-500"
                                >▾</motion.span>
                            </button>

                            <a
                                href="/rules?tab=credits"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 hover:underline underline-offset-2"
                            >
                                <span>查看完整条款</span>
                                <span>↗</span>
                            </a>
                        </div>

                        {showTerms && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] text-[11px] text-zinc-400 leading-relaxed space-y-2.5 max-h-48 overflow-y-auto pr-2 scrollbar-thin"
                            >
                                <p>
                                    <strong className="text-zinc-200">1. 虚拟资产属性：</strong>
                                    Scholarly 积分属纯数字化虚拟服务凭据，非任何法定货币或金融投资品。<strong>不可转让、不可倒卖、严禁反向提现或任何场外交易</strong>。
                                </p>
                                <p>
                                    <strong className="text-zinc-200">2. 7 天未消费退款机制：</strong>
                                    充值后 7 个自然日内且积分<strong>完全未产生任何消费或调用</strong>，可联系客服申请原路退款（扣除 0.6% 渠道手续费）。一经产生任何消费或超过 7 天，依据数字化商品属性不予退款。
                                </p>
                                <p>
                                    <strong className="text-zinc-200">3. 365 天有效期与先进先出：</strong>
                                    充值积分自到账起 365 个自然日内有效，逾期自动失效。扣费时系统自动遵循先进先出规则，优先消耗最临近到期的积分批次。
                                </p>
                                <p>
                                    <strong className="text-zinc-200">4. 赠送积分规则：</strong>
                                    充值套餐附赠积分及社区活动奖励积分属于无偿赠予，不具有现金对价，任何情况下均不支持折现或单独退款。
                                </p>
                                <p>
                                    <strong className="text-zinc-200">5. AI 学术免责声明：</strong>
                                    AI 大模型生成的研读分析与学术推导仅供科研参考，不构成同行评审结论或专业建议，学者应自行严谨审慎验证。
                                </p>
                                <p>
                                    <strong className="text-zinc-200">6. 安全风控与反作弊：</strong>
                                    严禁利用系统漏洞套现、信用卡恶意套现、洗钱或利用 AI 生成违规内容。违规者将被立即清空积分、终止服务并追究法律责任。
                                </p>
                                <div className="pt-1.5 border-t border-zinc-800/40 text-center">
                                    <a
                                        href="/rules?tab=credits"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-purple-400 hover:text-purple-300 font-medium hover:underline"
                                    >
                                        前往法务合规中心阅读《Scholarly 积分服务使用条款》全文 ↗
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                        <div className="text-xs text-zinc-500 leading-relaxed">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={true}
                                    readOnly
                                    className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-0 cursor-default"
                                />
                                <span className="text-zinc-400 text-[11px]">
                                    我已阅读并同意
                                    <a
                                        href="/rules?tab=credits"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-400 hover:underline mx-1"
                                    >
                                        《Scholarly 积分服务使用条款》
                                    </a>
                                    与退款政策
                                </span>
                            </label>
                            <p className="text-[11px] text-zinc-500 mt-1">
                                兑换比例：1 元人民币 = 10 积分。支持支付宝/微信合规支付。
                            </p>
                        </div>
                        <Button
                            disabled={true}
                            className="bg-zinc-800 text-zinc-400 border-0 rounded-full min-w-[130px] h-11 text-sm font-medium cursor-not-allowed opacity-75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                        >
                            支付功能即将上线
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
