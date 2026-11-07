"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Coins,
    Crown,
    Code2,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    BadgeCheck,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TutorialTaskChecklist, type TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step5CreditsTourProps {
    onPrev: () => void;
    onNext: () => void;
    completedTaskIds: string[];
    onCompleteTask: (taskId: string) => void;
    onCompleteAllTasks: (taskIds: string[]) => void;
}

interface LedgerEntry {
    id: string;
    label: string;
    delta: number;
    time: string;
}

type CardAuraTheme = "crystal" | "amber" | "sky";

const SCHOLAR_TITLES = ["量子拓扑学者", "分布式共识架构师", "特邀同行审稿人"] as const;

export function Step5CreditsTour({
    onPrev,
    onNext,
    completedTaskIds,
    onCompleteTask,
    onCompleteAllTasks,
}: Step5CreditsTourProps) {
    const [balance, setBalance] = useState(240);
    const [ledger, setLedger] = useState<LedgerEntry[]>([
        { id: "init-1", label: "新晋研学者入驻初始激励", delta: 200, time: "入驻当日" },
        { id: "init-2", label: "首次发表含 LaTeX 公式学术帖", delta: 40, time: "10 分钟前" },
    ]);

    // 名片定制状态
    const [vipTier, setVipTier] = useState<1 | 2 | 3>(2);
    const [titleIdx, setTitleIdx] = useState<number>(0);
    const [showDevBadge, setShowDevBadge] = useState<boolean>(true);
    const [auraTheme, setAuraTheme] = useState<CardAuraTheme>("amber");

    const taskDefs = useMemo<TaskItem[]>(
        () => [
            {
                id: "gain-credits",
                title: "1. 体验学术积分 (Credits) 双向生态流转",
                description: "点击下方场景胶囊模拟‘发表长文收益’、‘决斗分润’或‘调用 AI 审稿消耗’，查看实时流水账本。",
                isCompleted: completedTaskIds.includes("gain-credits"),
            },
            {
                id: "vip-badges",
                title: "2. 定制学者荣誉名片与 VIP 光学徽章",
                description: "自由切换认证学术头衔、VIP 等级与名片温润光晕，实时预览个人主页与帖子签名档效果。",
                isCompleted: completedTaskIds.includes("vip-badges"),
            },
        ],
        [completedTaskIds]
    );

    const handleCreditAction = (label: string, delta: number) => {
        if (delta < 0 && balance + delta < 0) {
            toast.error("模拟积分余额不足，请先点击上方获取收益胶囊补充积分");
            return;
        }

        setBalance((prev) => prev + delta);
        setLedger((prev) => [
            {
                id: `tx-${Date.now()}`,
                label,
                delta,
                time: "刚刚",
            },
            ...prev.slice(0, 4),
        ]);
        onCompleteTask("gain-credits");
        toast.success(`${delta > 0 ? `+${delta}` : delta} Credits · ${label}`);
    };

    const markBadgeCustomized = () => {
        onCompleteTask("vip-badges");
    };

    const auraClasses: Record<CardAuraTheme, string> = {
        crystal:
            "bg-white/90 dark:bg-zinc-900/75 shadow-[0_8px_28px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)]",
        amber:
            "bg-amber-500/[0.08] dark:bg-amber-500/[0.1] shadow-[0_8px_28px_-4px_rgba(245,158,11,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)]",
        sky:
            "bg-sky-500/[0.08] dark:bg-sky-500/[0.1] shadow-[0_8px_28px_-4px_rgba(14,165,233,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)]",
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={taskDefs}
                onTaskClick={(id) => {
                    onCompleteTask(id);
                    toast.success("已标记该项积分生态实操完成");
                }}
                onMarkAllDone={() => onCompleteAllTasks(["gain-credits", "vip-badges"])}
                stepTitle="Step 5 · 学术积分流转账本与学者荣誉特权"
                stepBadge="2 项实操体验"
                hintText="Credits 积分串联了优质创作分润、决斗竞猜与多模态 AI 推理调用，形成正向学术激励闭环。"
            />

            {/* 宽幅无边框液态玻璃工作台 */}
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] p-5 sm:p-7 space-y-6">
                {/* 顶栏 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-amber-500/[0.14] text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
                            <Coins className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                积分流转模拟器与名片定制工坊
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                实时体验学术创作激励、算力抵扣与专属荣誉徽章佩戴
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-0 bg-amber-500/[0.14] text-amber-800 dark:text-amber-300 text-xs font-mono font-medium tabular-nums shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_12px_rgba(245,158,11,0.16)]">
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            <span>当前模拟账户：{balance} Credits</span>
                        </div>

                        <Link href="/vip" prefetch={false}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] gap-1 active:scale-[0.97] cursor-pointer"
                            >
                                <span>特权中心</span>
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* 左侧：双向积分场景触发器 + 实时账本流水 */}
                    <div className="lg:col-span-6 p-5 rounded-3xl border-0 bg-zinc-100/75 dark:bg-white/[0.035] space-y-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),inset_0_-1px_0.5px_rgba(255,255,255,0.75)]">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <span>点击触发积分获取与消耗场景</span>
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleCreditAction("发布精选原创学术长文", 50)}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-emerald-500/[0.12] dark:bg-zinc-900/75 dark:hover:bg-emerald-500/[0.16] text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                            >
                                <span className="truncate">发表原创长文</span>
                                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                                    +50
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleCreditAction("论文获同行点赞与收藏", 30)}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-emerald-500/[0.12] dark:bg-zinc-900/75 dark:hover:bg-emerald-500/[0.16] text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                            >
                                <span className="truncate">同行高赞分润</span>
                                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                                    +30
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleCreditAction("学术决斗竞猜获胜奖池", 85)}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-amber-500/[0.14] dark:bg-zinc-900/75 dark:hover:bg-amber-500/[0.16] text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                            >
                                <span className="truncate">决斗竞猜派奖</span>
                                <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 shrink-0 ml-1">
                                    +85
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleCreditAction("调用 DeepSeek 深度审稿", -20)}
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-sky-500/[0.12] dark:bg-zinc-900/75 dark:hover:bg-sky-500/[0.16] text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                            >
                                <span className="truncate">AI 深度审稿</span>
                                <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400 shrink-0 ml-1">
                                    -20
                                </span>
                            </button>
                        </div>

                        {/* 实时透明积分账本明细 */}
                        <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-medium text-zinc-400 px-1">
                                最近积分流转记录
                            </span>
                            <div className="space-y-1.5">
                                {ledger.map((item) => {
                                    const isGain = item.delta > 0;
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl border-0 bg-white/75 dark:bg-zinc-900/60 text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {isGain ? (
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                ) : (
                                                    <ArrowDownRight className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                                )}
                                                <span className="truncate text-zinc-700 dark:text-zinc-200 font-medium">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums">
                                                <span className="text-[10px] text-zinc-400">
                                                    {item.time}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "font-medium",
                                                        isGain
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-sky-600 dark:text-sky-400"
                                                    )}
                                                >
                                                    {isGain ? `+${item.delta}` : item.delta}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 右侧：学者荣誉名片定制工坊 */}
                    <div className="lg:col-span-6 p-5 rounded-3xl border-0 bg-zinc-100/75 dark:bg-white/[0.035] space-y-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),inset_0_-1px_0.5px_rgba(255,255,255,0.75)] flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <Crown className="h-4 w-4 text-amber-500" />
                                    <span>学者荣誉名片实时预览与定制</span>
                                </h4>
                                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border-0 bg-amber-500/[0.14] text-amber-700 dark:text-amber-300">
                                    实时光学渲染
                                </span>
                            </div>

                            {/* 实时名片预览卡 */}
                            <div
                                className={cn(
                                    "p-4 sm:p-5 rounded-3xl border-0 transition-all duration-300 flex items-center gap-4",
                                    auraClasses[auraTheme]
                                )}
                            >
                                <Avatar className="h-14 w-14 border-0 shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)]">
                                    <AvatarFallback className="text-base font-semibold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                                        S
                                    </AvatarFallback>
                                </Avatar>

                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-zinc-950 dark:text-white flex items-center gap-1">
                                            Scholarly 研学者
                                            <BadgeCheck className="h-4 w-4 text-sky-500 shrink-0" />
                                        </span>

                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-0 bg-amber-500/[0.16] text-amber-800 dark:text-amber-300 text-[10px] font-medium">
                                            <Crown className="h-3 w-3 text-amber-500" />
                                            {vipTier === 3 ? "终身荣誉学者" : `VIP ${vipTier} 学术会员`}
                                        </span>

                                        {showDevBadge && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-0 bg-zinc-950/90 text-white dark:bg-white/90 dark:text-zinc-950 text-[10px] font-medium">
                                                <Code2 className="h-2.5 w-2.5" />
                                                核心共建者
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-500/[0.12] px-2.5 py-0.5 rounded-full border-0">
                                            {SCHOLAR_TITLES[titleIdx]}
                                        </span>
                                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                            专注分布式一致性与拓扑量子计算
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 定制控制水滴组 */}
                        <div className="space-y-2.5 pt-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[11px] font-medium text-zinc-500">学术头衔与等级：</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTitleIdx((prev) => (prev + 1) % SCHOLAR_TITLES.length);
                                            markBadgeCustomized();
                                        }}
                                        className="h-7 px-3 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-white dark:bg-zinc-900/75 text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] active:scale-[0.97] cursor-pointer"
                                    >
                                        切换头衔
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVipTier((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
                                            markBadgeCustomized();
                                        }}
                                        className="h-7 px-3 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-white dark:bg-zinc-900/75 text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] active:scale-[0.97] cursor-pointer"
                                    >
                                        切换 VIP 等级
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDevBadge((prev) => !prev);
                                            markBadgeCustomized();
                                        }}
                                        className="h-7 px-3 rounded-full border-0 text-xs font-medium bg-white/85 hover:bg-white dark:bg-zinc-900/75 text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] active:scale-[0.97] cursor-pointer"
                                    >
                                        {showDevBadge ? "隐藏共建标" : "佩戴共建标"}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[11px] font-medium text-zinc-500">名片环境微光晕：</span>
                                <div className="inline-flex items-center gap-1 p-1 rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.06]">
                                    {(
                                        [
                                            { key: "crystal", label: "纯净冰晶" },
                                            { key: "amber", label: "琥珀暖金" },
                                            { key: "sky", label: "天青微光" },
                                        ] as const
                                    ).map((opt) => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => {
                                                setAuraTheme(opt.key);
                                                markBadgeCustomized();
                                            }}
                                            className={cn(
                                                "h-6 px-2.5 rounded-full border-0 text-[11px] font-medium transition-colors cursor-pointer",
                                                auraTheme === opt.key
                                                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs"
                                                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-1">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-full border-0 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>上一步：私信与数据时效</span>
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <span>下一步：AI 同行评审审稿</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
