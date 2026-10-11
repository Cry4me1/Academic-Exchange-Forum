"use client";

import { getMyCredits, getMyTransactions } from "@/app/(protected)/credits/actions";
import { CreditRechargeDialog } from "@/components/payments/CreditRechargeDialog";
import { ScholarLevelBadge } from "@/components/payments/VipBadge";
import { Button } from "@/components/ui/button";
import {
    getScholarLevels,
    loadVipLevelsFromDB,
    getScholarProgress,
    getScholarLevelByNumber,
    type ScholarLevelInfo
} from "@/lib/vip-utils";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
    ArrowLeft,
    Coins,
    History,
    Sparkles,
    Swords,
    TrendingUp,
    Zap,
    FileText,
    Heart,
    Award,
    CheckCircle2,
    Lock,
    Gift,
    ShieldCheck,
    Flame,
    Compass
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

// 动效参数：Apple 标准物理缓动
const stagger = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

const transactionTypeLabels: Record<string, { label: string; icon: typeof Coins }> = {
    signup_bonus: { label: "注册奖励", icon: Sparkles },
    monthly_bonus: { label: "学者月度津贴", icon: Gift },
    purchase: { label: "积分获取", icon: Coins },
    ask_ai_usage: { label: "AI 学术调用", icon: Zap },
    admin_adjustment: { label: "系统调整", icon: TrendingUp },
    duel_fee: { label: "学术对决质押", icon: Swords },
    duel_reward: { label: "学术对决奖励", icon: Award },
};

// 对应 Lv1~Lv6 彩字与微光晕配置（统一白底彩字，最高级 Lv6 为红色）
const LEVEL_ACCENTS: Record<number, { text: string; aura: string; ring: string }> = {
    1: { text: "text-zinc-600", aura: "shadow-zinc-400/10", ring: "ring-zinc-400/20" },
    2: { text: "text-emerald-600", aura: "shadow-emerald-500/15", ring: "ring-emerald-500/20" },
    3: { text: "text-sky-600", aura: "shadow-sky-500/15", ring: "ring-sky-500/20" },
    4: { text: "text-violet-600", aura: "shadow-violet-500/15", ring: "ring-violet-500/20" },
    5: { text: "text-amber-600", aura: "shadow-amber-500/15", ring: "ring-amber-500/20" },
    6: { text: "text-red-600", aura: "shadow-red-500/20", ring: "ring-red-500/30" }, // 最高级红色
};

interface Transaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    metadata: {
        total_tokens?: number;
        duel_id?: string;
    } | null;
    created_at: string;
}

export default function ScholarLevelPage() {
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [balance, setBalance] = useState(0);
    const [vipLevel, setVipLevel] = useState(1);
    const [scholarExp, setScholarExp] = useState(0);
    const [validPosts, setValidPosts] = useState(0);
    const [totalLikes, setTotalLikes] = useState(0);
    const [contributions, setContributions] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [hasClaimedMonthly, setHasClaimedMonthly] = useState(false);
    const [isPendingClaim, startClaimTransition] = useTransition();
    const PAGE_SIZE = 20;

    useEffect(() => {
        const loadData = async () => {
            await loadVipLevelsFromDB();
            const [credits, txResult] = await Promise.all([
                getMyCredits(),
                getMyTransactions(PAGE_SIZE, 0),
            ]);
            setBalance(credits.balance ?? 0);
            setVipLevel(credits.vipLevel ?? 1);
            setScholarExp(credits.scholarExp ?? 0);
            setValidPosts(credits.validPostCount ?? 0);
            setTotalLikes(credits.totalLikesReceived ?? 0);
            setContributions(credits.communityContributionsCount ?? 0);
            
            const txs = (txResult.transactions || []) as Transaction[];
            setTransactions(txs);

            const currentMonthStr = new Date().toISOString().slice(0, 7);
            const claimedThisMonth = txs.some(
                (t) => t.type === "monthly_bonus" && t.created_at.startsWith(currentMonthStr)
            );
            setHasClaimedMonthly(claimedThisMonth);
        };
        loadData();
    }, []);

    const currentLevel = getScholarLevelByNumber(vipLevel);
    const progressData = getScholarProgress(vipLevel, {
        exp: scholarExp,
        posts: validPosts,
        likes: totalLikes,
        contributions: contributions,
    });

    const handleClaimMonthlyBonus = () => {
        startClaimTransition(async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { data, error } = await supabase.rpc("claim_monthly_bonus");
                
                if (error) {
                    toast.error(`领取失败: ${error.message}`);
                    return;
                }
                
                const res = data as any;
                if (!res?.success) {
                    if (res?.reason === "already_claimed") {
                        toast.info("本月学者研讨津贴已领取完毕");
                        setHasClaimedMonthly(true);
                    } else {
                        toast.error("领取津贴失败，请稍后重试");
                    }
                    return;
                }
                
                toast.success(`成功领取本月研讨津贴 +${res.bonus_amount || currentLevel.monthlyBonus} 积分`);
                setBalance(res.new_balance || (balance + currentLevel.monthlyBonus));
                setHasClaimedMonthly(true);
            } catch {
                toast.error("网络异常，无法领取");
            }
        });
    };

    // 3D 视差纯无色光学高光
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const rotateX = useTransform(mouseY, [0, 1], [6, -6]);
    const rotateY = useTransform(mouseX, [0, 1], [-6, 6]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    const currentAccent = LEVEL_ACCENTS[currentLevel.level] || LEVEL_ACCENTS[1];

    return (
        <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative overflow-hidden selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* Apple 纯中性通透环境天光 (Ambient Luminescence) */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-white via-zinc-100/50 dark:from-zinc-800/20 dark:via-zinc-900/10 to-transparent rounded-full blur-[140px] opacity-70" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
                
                {/* 顶部导航 */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-between mb-8"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        返回仪表盘
                    </Link>
                    <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                        Scholar Growth System
                    </span>
                </motion.div>

                {/* 主动效流动容器 */}
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">

                    {/* ===== 顶部 Hero: 学者等级核心视差面板 ===== */}
                    <motion.div variants={fadeUp}>
                        <div className="rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.95),0_16px_48px_-8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_16px_48px_-8px_rgba(0,0,0,0.45)] p-6 sm:p-9 relative overflow-hidden">
                            {/* 顶部物理透光纤细流光缝 */}
                            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white dark:via-zinc-400/30 to-transparent" />

                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                
                                {/* 3D 视差纯中性学者星徽 */}
                                <div
                                    className="relative shrink-0 perspective-[800px] w-28 h-28"
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <motion.div
                                        className="w-full h-full rounded-2xl relative preserve-3d flex items-center justify-center bg-white dark:bg-zinc-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_28px_-4px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_8px_28px_-4px_rgba(0,0,0,0.55)] border-0"
                                        style={{ rotateX, rotateY }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    >
                                        <div className="text-center space-y-1">
                                            <div className={`text-4xl font-black font-mono tracking-tighter ${currentAccent.text}`}>
                                                Lv.{currentLevel.level}
                                            </div>
                                            <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                                                Scholar
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* 学者经验与晋升进度信息 */}
                                <div className="flex-1 text-center md:text-left space-y-4">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                            学者等级 {currentLevel.title}
                                        </h1>
                                        <ScholarLevelBadge vipLevel={currentLevel.level} size="md" />
                                    </div>

                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        累计学术综合经验值{" "}
                                        <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100 text-base">
                                            {scholarExp.toLocaleString()}
                                        </span>{" "}
                                        EXP
                                    </p>

                                    {/* 纯中性流体进度条 */}
                                    {progressData.next ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-zinc-500">
                                                <span>
                                                    距离晋升 <span className="font-semibold text-zinc-800 dark:text-zinc-200">Lv.{progressData.next.level}</span>
                                                </span>
                                                <span className="font-mono">
                                                    还需 {progressData.remainingExp} EXP
                                                </span>
                                            </div>
                                            <div className="h-3 bg-zinc-200/60 dark:bg-zinc-800/70 rounded-full overflow-hidden relative shadow-inner border-0">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressData.expProgress}%` }}
                                                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                                                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 relative"
                                                />
                                            </div>
                                            <p className="text-[10px] font-mono text-zinc-400 text-right">
                                                {progressData.expProgress}%
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-center md:justify-start gap-1.5 py-1">
                                            <CheckCircle2 className="h-4 w-4 text-red-600" />
                                            <span>已荣获全站至高荣誉 · 终身学者等级</span>
                                        </div>
                                    )}
                                </div>

                                {/* 核心 CTA: 月度研讨津贴领取 */}
                                <div className="shrink-0 flex flex-col items-center gap-3">
                                    <Button
                                        onClick={handleClaimMonthlyBonus}
                                        disabled={hasClaimedMonthly || isPendingClaim}
                                        className="h-11 px-6 rounded-full border-0 font-medium text-sm transition-all bg-zinc-950/90 hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
                                    >
                                        <Gift className="h-4 w-4 mr-2" />
                                        {hasClaimedMonthly ? "本月津贴已领" : `领取津贴 (+${currentLevel.monthlyBonus} 积分)`}
                                    </Button>
                                    
                                    <div className="text-center">
                                        <p className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                                            {balance.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-zinc-400">当前研讨积分</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>

                    {/* ===== Bento Grid: 三维学术贡献状态卡片群 ===== */}
                    <motion.div variants={fadeUp} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-zinc-400" />
                                学术成长三维评估
                            </h2>
                            <span className="text-[11px] text-zinc-400 font-mono">
                                Realtime Metrics
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 维度 1: 有效学术发帖 */}
                            <motion.div
                                whileHover={{ y: -3 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="rounded-2xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_24px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_6px_24px_-2px_rgba(0,0,0,0.35)] p-5 space-y-3.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            <FileText className="h-3.5 w-3.5" />
                                        </div>
                                        <span>学术产出 (发帖)</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        PQS ≥ 60
                                    </span>
                                </div>
                                <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {validPosts}{" "}
                                    <span className="text-xs font-normal text-zinc-400 font-sans">篇有效帖</span>
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                                    过滤浅层与灌水讨论，仅高质量学术规范帖计入经验 (+15 EXP/篇)
                                </div>
                            </motion.div>

                            {/* 维度 2: 同行认可 (获赞量) */}
                            <motion.div
                                whileHover={{ y: -3 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="rounded-2xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_24px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_6px_24px_-2px_rgba(0,0,0,0.35)] p-5 space-y-3.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            <Heart className="h-3.5 w-3.5" />
                                        </div>
                                        <span>同行认可 (获赞)</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        全网累计
                                    </span>
                                </div>
                                <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {totalLikes}{" "}
                                    <span className="text-xs font-normal text-zinc-400 font-sans">次赞同</span>
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                                    主帖赞 (+5 EXP) 与学术解答获赞 (+3 EXP) 综合累积
                                </div>
                            </motion.div>

                            {/* 维度 3: 深度社区共建 */}
                            <motion.div
                                whileHover={{ y: -3 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="rounded-2xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_24px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_6px_24px_-2px_rgba(0,0,0,0.35)] p-5 space-y-3.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            <Award className="h-3.5 w-3.5" />
                                        </div>
                                        <span>深度共建贡献</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        核心价值
                                    </span>
                                </div>
                                <div className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    {contributions}{" "}
                                    <span className="text-xs font-normal text-zinc-400 font-sans">项学术共建</span>
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                                    采纳解答 (+30 EXP)、同行评审 (+25 EXP) 与对决胜场 (+20 EXP)
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ===== 等级阶梯特权全览墙 (Lv1 ~ Lv6 纯白底彩字，无多余深暗科技渐变) ===== */}
                    <motion.div variants={fadeUp} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                <Compass className="h-4 w-4 text-zinc-400" />
                                等级阶梯与特权全览
                            </h2>
                            <span className="text-xs text-zinc-400">
                                纯白底 · 阶梯彩字标定
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {getScholarLevels().map((lvl) => {
                                const isCurrent = lvl.level === currentLevel.level;
                                const isUnlocked = lvl.level <= currentLevel.level;
                                const accent = LEVEL_ACCENTS[lvl.level] || LEVEL_ACCENTS[1];

                                return (
                                    <motion.div
                                        key={lvl.level}
                                        whileHover={{ y: -3, scale: 1.01 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        className={`rounded-2xl border-0 p-5 space-y-3.5 relative transition-all ${
                                            isCurrent
                                                ? `bg-white dark:bg-zinc-900 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.95),0_12px_36px_-4px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_-4px_rgba(0,0,0,0.6)] ${accent.ring} ring-2`
                                                : isUnlocked
                                                    ? "bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_-2px_rgba(0,0,0,0.04)]"
                                                    : "bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md opacity-60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-2xl font-black font-mono tracking-tight ${accent.text}`}>
                                                    {lvl.name}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                                                        当前
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-mono font-bold text-zinc-400">
                                                {lvl.minExp === 0 ? "起步" : `${lvl.minExp} EXP`}
                                            </span>
                                        </div>

                                        {/* 门槛指标：渲染标准数学符号 ≥，杜绝 raw $\ge$ */}
                                        <div className="text-[11px] text-zinc-500 space-y-1.5 pt-1">
                                            <div className="flex justify-between items-center">
                                                <span>发帖要求:</span>
                                                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                                    {lvl.minPosts === 0 ? "无限制" : `≥ ${lvl.minPosts} 篇`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>获赞要求:</span>
                                                <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                                    {lvl.minLikes === 0 ? "无限制" : `≥ ${lvl.minLikes} 次`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>每月研讨津贴:</span>
                                                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                    +{lvl.monthlyBonus} 积分
                                                </span>
                                            </div>
                                        </div>

                                        {/* 渐变消融微光缝 */}
                                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                                        {/* 专属特权条目 */}
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
                                                专属特权
                                            </span>
                                            <ul className="space-y-1">
                                                {lvl.perks.map((perk, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5 leading-tight"
                                                    >
                                                        <span className={`text-[10px] font-bold ${accent.text}`}>•</span>
                                                        <span>{perk}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* ===== 积分与津贴历史明细 ===== */}
                    <motion.div variants={fadeUp} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                                <History className="h-4 w-4 text-zinc-400" />
                                学术活动与津贴流水
                            </h2>
                        </div>

                        <div className="rounded-2xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_24px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_6px_24px_-2px_rgba(0,0,0,0.35)] overflow-hidden">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                                {transactions.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-zinc-400">
                                        暂无近期流水明细
                                    </div>
                                ) : (
                                    transactions.map((tx) => {
                                        const meta = transactionTypeLabels[tx.type] || { label: tx.type, icon: Coins };
                                        const IconComp = meta.icon;
                                        const isPositive = tx.amount > 0;

                                        return (
                                            <div
                                                key={tx.id}
                                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500">
                                                    <IconComp className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                        {tx.description}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                                        {meta.label} · {new Date(tx.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                                <div className={`text-xs font-bold font-mono tabular-nums ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}>
                                                    {isPositive ? "+" : ""}{tx.amount}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>

                </motion.div>
            </div>

            {/* 快速充值积分入口 */}
            <CreditRechargeDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
        </div>
    );
}
