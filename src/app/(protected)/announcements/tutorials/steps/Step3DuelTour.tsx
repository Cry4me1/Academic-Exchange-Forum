"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathText } from "@/components/ui/math-text";
import {
    Swords,
    Send,
    BookOpen,
    Eye,
    EyeOff,
    ShieldAlert,
    Coins,
    ArrowLeft,
    ArrowRight,
    Brain,
    Sparkles,
    AlertTriangle,
    RotateCcw,
    ExternalLink,
} from "lucide-react";
import { ReputationBadge } from "@/components/duel/ReputationBadge";
import { DuelScoreCard } from "@/components/duel/DuelScoreCard";
import { SpectatorBadge } from "@/components/duel/SpectatorBadge";
import { DanmakuOverlay, type DanmakuMessage } from "@/components/duel/DanmakuOverlay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TutorialTaskChecklist, type TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step3DuelTourProps {
    onPrev: () => void;
    onNext: () => void;
    completedTaskIds: string[];
    onCompleteTask: (taskId: string) => void;
    onCompleteAllTasks: (taskIds: string[]) => void;
}

const PRESET_DANMAKUS: string[] = [
    "数学推导太严谨了，k=7 确实是 20 个样本下的全局最优！",
    "不可逆性与主体性直击要害，正方怎么回应？",
    "前 37% 样本只观察不决策，若完美伴侣在前 7 个出现怎么办？",
    "支持动态贝叶斯更新！先验分布已知时阈值可以显著前移",
    "算力对冲的是盲目试错成本，而非消解情感本身",
];

const QUICK_DANMAKU_CHIPS = [
    "1/e 最优停止法则无懈可击！",
    "亲密关系不满足独立同分布假设",
    "期待引入贝叶斯先验修正模型",
];

type Round2SimulationMode = "idle" | "rigorous" | "fallacy";

export function Step3DuelTour({
    onPrev,
    onNext,
    completedTaskIds,
    onCompleteTask,
    onCompleteAllTasks,
}: Step3DuelTourProps) {
    const [danmakuVisible, setDanmakuVisible] = useState(true);
    const [danmakuInput, setDanmakuInput] = useState("");
    const [latestDanmaku, setLatestDanmaku] = useState<DanmakuMessage | null>(null);

    // 观战下注状态
    const [betSide, setBetSide] = useState<"challenger" | "opponent">("challenger");
    const [betAmount, setBetAmount] = useState("100");
    const [totalStaked, setTotalStaked] = useState(0);
    const [userReputation, setUserReputation] = useState(1500);

    // 第 2 回合互动模拟状态
    const [round2Mode, setRound2Mode] = useState<Round2SimulationMode>("idle");

    const baseChallengerScore = 10;
    const opponentScore = 6;
    const challengerScore =
        round2Mode === "rigorous"
            ? baseChallengerScore + 11
            : round2Mode === "fallacy"
            ? baseChallengerScore - 3
            : baseChallengerScore;
    const challengerLp = round2Mode === "fallacy" ? 85 : 100;
    const opponentLp = 100;

    const currentOdds = betSide === "challenger" ? 1.85 : 2.1;
    const parsedBet = Math.max(0, parseInt(betAmount || "0", 10) || 0);
    const estimatedPayout = Math.round(parsedBet * currentOdds);

    const taskDefs = useMemo<TaskItem[]>(
        () => [
            {
                id: "task-bet",
                title: "1. 体验观战声望质押 (LP 下注竞猜)",
                description: "选择支持正方或反方学者，点击快捷筹码并确认质押，查看实时赔率与预计收益。",
                isCompleted: completedTaskIds.includes("task-bet"),
            },
            {
                id: "task-danmaku",
                title: "2. 发射实时学术观战弹幕",
                description: "输入学术见解或点击快捷观点胶囊，体验多轨道实时飘屏弹幕研讨。",
                isCompleted: completedTaskIds.includes("task-danmaku"),
            },
            {
                id: "task-inspect-round",
                title: "3. 体验第 2 回合交锋与 AI 裁判谬误判分",
                description: "查阅第 1 回合实录，并在底部亲手触发第 2 回合‘严谨引证 vs 逻辑谬误’实时裁决。",
                isCompleted: completedTaskIds.includes("task-inspect-round"),
            },
        ],
        [completedTaskIds]
    );

    useEffect(() => {
        const interval = setInterval(() => {
            if (!danmakuVisible) return;
            const randomText = PRESET_DANMAKUS[Math.floor(Math.random() * PRESET_DANMAKUS.length)];
            const roles: Array<"challenger" | "opponent" | "spectator"> = [
                "challenger",
                "opponent",
                "spectator",
            ];
            const role = roles[Math.floor(Math.random() * roles.length)];

            setLatestDanmaku({
                id: `danmaku-${Date.now()}-${Math.random()}`,
                text: randomText,
                userId: "spectator-bot",
                username:
                    role === "challenger"
                        ? "概率论研究员"
                        : role === "opponent"
                        ? "伦理学学者"
                        : "围观学者",
                positionColor: role,
            });
        }, 3600);

        return () => clearInterval(interval);
    }, [danmakuVisible]);

    const sendDanmakuText = (rawText: string) => {
        const trimmed = rawText.trim();
        if (!trimmed) return;

        setLatestDanmaku({
            id: `danmaku-me-${Date.now()}`,
            text: trimmed,
            userId: "me",
            username: "我 (研学者)",
            positionColor: betSide,
        });
        setDanmakuInput("");
        onCompleteTask("task-danmaku");
        toast.success("学术弹幕已实时推送至决斗观战席");
    };

    const handleConfirmBet = () => {
        if (parsedBet <= 0) {
            toast.error("请输入大于 0 的有效质押积分数");
            return;
        }
        if (parsedBet > userReputation) {
            toast.error(`可用钱包余额不足（当前剩余 ${userReputation} LP）`);
            return;
        }

        setUserReputation((prev) => prev - parsedBet);
        setTotalStaked((prev) => prev + parsedBet);
        onCompleteTask("task-bet");
        toast.success(
            `质押成功！已投入 ${parsedBet} LP 支持${
                betSide === "challenger" ? "正方（算力派）" : "反方（主体派）"
            }，预计获胜返还 ${estimatedPayout} LP`
        );
    };

    const handleSimulateRound2 = (mode: "rigorous" | "fallacy") => {
        setRound2Mode(mode);
        onCompleteTask("task-inspect-round");
        if (mode === "rigorous") {
            toast.success("AI 裁判裁决完成：严谨贝叶斯修正引证获评 +11 分！");
        } else {
            toast.warning("AI 裁判触发逻辑谬误拦截：检测到稻草人谬误，扣除 15 LP 护盾与 3 分！");
        }
    };

    const mockSpectators = [
        { username: "李院士", avatar_url: "" },
        { username: "张教授", avatar_url: "" },
        { username: "王研究员", avatar_url: "" },
        { username: "概率探索者", avatar_url: "" },
    ];

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={taskDefs}
                onTaskClick={(id) => {
                    onCompleteTask(id);
                    toast.success("已标记该项决斗实操完成");
                }}
                onMarkAllDone={() =>
                    onCompleteAllTasks(["task-bet", "task-danmaku", "task-inspect-round"])
                }
                stepTitle="Step 3 · 学术决斗竞技场全景实战 (Duel Arena)"
                stepBadge="3 项实操体验"
                hintText="还原平台真实 1v1 学术辩论交锋，支持 LP 赔率竞猜、多轨弹幕互动与 AI 裁判逻辑谬误实时判分。"
            />

            {/* 决斗竞技场无边框液态玻璃全景舱 */}
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden">
                {/* 顶栏：状态胶囊、观战头像列与真实大厅传送门 */}
                <div className="px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-0 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>进行中 · 第 2/3 回合交锋</span>
                        </span>
                        <SpectatorBadge spectators={mockSpectators} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setDanmakuVisible(!danmakuVisible)}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border-0 text-xs font-medium bg-zinc-900/[0.045] hover:bg-zinc-900/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                        >
                            {danmakuVisible ? (
                                <Eye className="h-3.5 w-3.5 text-sky-500" />
                            ) : (
                                <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                            )}
                            <span>{danmakuVisible ? "弹幕已开启" : "弹幕已静默"}</span>
                        </button>

                        <Link href="/duels" prefetch={false}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] gap-1.5 active:scale-[0.97] cursor-pointer"
                            >
                                <span>前往决斗大厅</span>
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                <div className="p-5 sm:p-7 space-y-6 relative overflow-hidden">
                    {/* 顶部弹幕舞台 + 辩题标题 */}
                    <div className="relative min-h-[128px] pointer-events-none">
                        <DanmakuOverlay newDanmaku={latestDanmaku} visible={danmakuVisible} />
                        <div className="text-center space-y-1.5 max-w-2xl mx-auto pt-2">
                            <span className="text-[11px] font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                DUEL #D0552765 · 跨学科概率与伦理思辨
                            </span>
                            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                                北山的风吹不到南山尾
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                <MathText
                                    text="核心交锋：最优停止策略 ($k = \lfloor n/e \rfloor = 7$) vs 亲密关系的不可逆性与主体性"
                                    inlineOnly
                                />
                            </p>
                        </div>
                    </div>

                    {/* 1v1 对决比分水晶台 */}
                    <div className="rounded-3xl border-0 bg-zinc-100/75 dark:bg-white/[0.035] p-5 sm:p-6 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),inset_0_-1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.06)]">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            {/* 正方 */}
                            <div className="flex-1 w-full text-center space-y-2.5">
                                <Avatar className="h-15 w-15 mx-auto border-0 shadow-[0_0_0_3px_rgba(14,165,233,0.25),0_6px_16px_rgba(14,165,233,0.18)]">
                                    <AvatarFallback className="bg-sky-500/15 text-sky-700 dark:text-sky-300 text-sm font-semibold">
                                        测1
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                        测试1 · 概率决策组
                                    </p>
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full border-0 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300 text-xs font-medium">
                                        正方：幸福需要最优算力
                                    </span>
                                </div>

                                <div className="flex justify-center">
                                    <ReputationBadge score={110} wins={1} losses={0} size="sm" showStats />
                                </div>

                                {/* LP 逻辑值护盾条 */}
                                <div className="max-w-[220px] mx-auto space-y-1">
                                    <div className="flex justify-between text-[11px] font-medium text-zinc-500 tabular-nums">
                                        <span className="flex items-center gap-1">
                                            <ShieldAlert className="h-3 w-3 text-sky-500" />
                                            逻辑护盾 LP
                                        </span>
                                        <span
                                            className={cn(
                                                "font-mono",
                                                challengerLp < 100
                                                    ? "text-rose-500"
                                                    : "text-emerald-600 dark:text-emerald-400"
                                            )}
                                        >
                                            {challengerLp} / 100
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-zinc-900/[0.08] dark:bg-white/[0.08] overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-transform duration-300 origin-left",
                                                challengerLp < 100 ? "bg-rose-500" : "bg-sky-500"
                                            )}
                                            style={{ transform: `scaleX(${challengerLp / 100})` }}
                                        />
                                    </div>
                                </div>

                                <p className="text-2xl sm:text-3xl font-semibold text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                                    {challengerScore} 分
                                </p>
                            </div>

                            {/* 中央双剑徽记 */}
                            <div className="flex flex-col items-center px-2">
                                <div className="h-11 w-11 rounded-full border-0 bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)]">
                                    <Swords className="h-5 w-5" />
                                </div>
                                <span className="text-[11px] font-mono font-medium text-zinc-400 mt-1.5">
                                    VS
                                </span>
                            </div>

                            {/* 反方 */}
                            <div className="flex-1 w-full text-center space-y-2.5">
                                <Avatar className="h-15 w-15 mx-auto border-0 shadow-[0_0_0_3px_rgba(244,63,94,0.25),0_6px_16px_rgba(244,63,94,0.16)]">
                                    <AvatarFallback className="bg-rose-500/15 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                                        测2
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                        测试2 · 现象学思辨组
                                    </p>
                                    <span className="inline-flex items-center px-3 py-0.5 rounded-full border-0 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300 text-xs font-medium">
                                        反方：反对亲密关系算法化
                                    </span>
                                </div>

                                <div className="flex justify-center">
                                    <ReputationBadge score={95} wins={0} losses={1} size="sm" showStats />
                                </div>

                                <div className="max-w-[220px] mx-auto space-y-1">
                                    <div className="flex justify-between text-[11px] font-medium text-zinc-500 tabular-nums">
                                        <span className="flex items-center gap-1">
                                            <ShieldAlert className="h-3 w-3 text-rose-500" />
                                            逻辑护盾 LP
                                        </span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                            {opponentLp} / 100
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-zinc-900/[0.08] dark:bg-white/[0.08] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-rose-500 transition-transform duration-300 origin-left"
                                            style={{ transform: `scaleX(${opponentLp / 100})` }}
                                        />
                                    </div>
                                </div>

                                <p className="text-2xl sm:text-3xl font-semibold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                                    {opponentScore} 分
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 观战学者 LP 质押模拟器 */}
                    <div className="p-4 sm:p-5 rounded-3xl border-0 bg-amber-500/[0.07] dark:bg-amber-500/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Coins className="h-4 w-4 text-amber-500" />
                                <h4 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    观战学者声望质押竞猜 (Spectator LP Pool)
                                </h4>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                                {totalStaked > 0 && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        已质押：{totalStaked} LP
                                    </span>
                                )}
                                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                                    可用余额：<strong className="text-amber-600 dark:text-amber-400">{userReputation} LP</strong>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                            {/* 选择阵营胶囊 */}
                            <div className="lg:col-span-5 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBetSide("challenger")}
                                    className={cn(
                                        "h-9 px-3 rounded-full border-0 text-xs font-medium transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.97] cursor-pointer",
                                        betSide === "challenger"
                                            ? "bg-sky-600 text-white shadow-[0_4px_14px_rgba(14,165,233,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.45)]"
                                            : "bg-white/75 dark:bg-white/[0.06] text-sky-700 dark:text-sky-300"
                                    )}
                                >
                                    支持正方 · 1.85x
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBetSide("opponent")}
                                    className={cn(
                                        "h-9 px-3 rounded-full border-0 text-xs font-medium transition-[transform,background-color,color,box-shadow] duration-150 active:scale-[0.97] cursor-pointer",
                                        betSide === "opponent"
                                            ? "bg-rose-600 text-white shadow-[0_4px_14px_rgba(244,63,94,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.45)]"
                                            : "bg-white/75 dark:bg-white/[0.06] text-rose-700 dark:text-rose-300"
                                    )}
                                >
                                    支持反方 · 2.10x
                                </button>
                            </div>

                            {/* 快捷筹码 + 输入药丸 + 确认按钮 */}
                            <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
                                {[50, 100, 250].map((chip) => (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => setBetAmount(String(chip))}
                                        className={cn(
                                            "h-8 px-3 rounded-full border-0 text-xs font-mono font-medium tabular-nums transition-colors cursor-pointer active:scale-[0.96]",
                                            betAmount === String(chip)
                                                ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                                                : "bg-white/70 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 hover:bg-white"
                                        )}
                                    >
                                        {chip}
                                    </button>
                                ))}

                                <Input
                                    type="number"
                                    min={10}
                                    max={userReputation}
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    placeholder="LP"
                                    className="h-9 w-24 rounded-full border-0 bg-white/85 dark:bg-zinc-900/80 text-xs font-mono tabular-nums text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                                />

                                <Button
                                    size="sm"
                                    onClick={handleConfirmBet}
                                    className="flex-1 min-w-[140px] h-9 px-4 rounded-full border-0 text-xs font-medium bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/92 dark:text-zinc-950 shadow-[0_4px_14px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.38)] active:scale-[0.97] cursor-pointer"
                                >
                                    <span>
                                        确认质押 (预计 +{estimatedPayout} LP)
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 实时弹幕发射舱 + 快捷学术观点胶囊 */}
                    <div className="p-3.5 rounded-3xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] space-y-2.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-2">
                            <Input
                                value={danmakuInput}
                                onChange={(e) => setDanmakuInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") sendDanmakuText(danmakuInput);
                                }}
                                placeholder="输入实时学术弹幕参与观战研讨..."
                                className="h-9 rounded-full border-0 bg-white/85 dark:bg-zinc-900/80 px-4 text-xs shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                            />
                            <Button
                                size="sm"
                                onClick={() => sendDanmakuText(danmakuInput)}
                                className="h-9 px-4 rounded-full border-0 text-xs font-medium gap-1.5 bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/92 dark:text-zinc-950 shrink-0 active:scale-[0.97] cursor-pointer"
                            >
                                <Send className="h-3.5 w-3.5" />
                                <span>发射弹幕</span>
                            </Button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pl-1">
                            <span className="text-[11px] font-medium text-zinc-400">一键观点：</span>
                            {QUICK_DANMAKU_CHIPS.map((chip) => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => sendDanmakuText(chip)}
                                    className="px-2.5 py-1 rounded-full border-0 text-[11px] font-medium bg-white/75 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.11] text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] transition-[transform,background-color] duration-150 active:scale-[0.97] cursor-pointer"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 辩论回合实录 + 第 2 回合互动裁决模拟器 */}
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-sky-500" />
                                <span>辩论交锋记录与 AI 裁判同行评议</span>
                            </h3>
                            <span className="text-[11px] font-mono font-medium text-zinc-400 tabular-nums">
                                {round2Mode === "idle" ? "1 / 3 回合已裁决" : "2 / 3 回合已裁决"}
                            </span>
                        </div>

                        {/* 第 1 回合：正方立论（含真实 KaTeX 数学公式渲染） */}
                        <div
                            onClick={() => onCompleteTask("task-inspect-round")}
                            className="rounded-3xl border-0 bg-sky-500/[0.05] dark:bg-sky-500/[0.06] p-4 sm:p-5 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] cursor-pointer"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border-0">
                                        <AvatarFallback className="bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold">
                                            测1
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                                测试1
                                            </span>
                                            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border-0 bg-sky-500/15 text-sky-700 dark:text-sky-300">
                                                正方 · 第 1 回合立论
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <DuelScoreCard
                                    evidenceScore={5}
                                    citationScore={3}
                                    logicScore={2}
                                    fallacyPenalty={0}
                                    totalScore={10}
                                    hasFallacy={false}
                                    analysis="基于秘书问题的最优停止推导完整严谨。"
                                />
                            </div>

                            <div className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed space-y-2">
                                <p className="font-medium text-sky-700 dark:text-sky-300">
                                    <MathText
                                        text="“爱情需要心动，但幸福需要算力。我方支持在样本空间 $n=20$ 下采用 $k=7$ 的最优停止策略。”"
                                        inlineOnly
                                    />
                                </p>
                                <MathText
                                    as="div"
                                    text="前 $k$ 个样本仅做基准观测，从第 $k+1$ 个开始选取首个优于历史极值的伴侣，命中全局最优的概率为：$$P(k) = \frac{k}{n}\sum_{i=k}^{n-1}\frac{1}{i} \approx \frac{k}{20}\ln\left(\frac{20}{k}\right)$$令一阶导数为零可得 $x^* = 20/e \approx 7.36$，取整即为 $k=7$（胜率约 $37.9\%$）。苏格拉底麦田困境本质是信息不对称下的序列决策问题！"
                                />
                            </div>

                            <div className="p-2.5 rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/60 text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                <Brain className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                <span>AI 裁判评语：概率建模清晰，求导极值验证准确，论据扎实（悬停右上角分数胶囊可查看细项得分）。</span>
                            </div>
                        </div>

                        {/* 第 1 回合：反方驳论 */}
                        <div
                            onClick={() => onCompleteTask("task-inspect-round")}
                            className="rounded-3xl border-0 bg-rose-500/[0.05] dark:bg-rose-500/[0.06] p-4 sm:p-5 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] cursor-pointer"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border-0">
                                        <AvatarFallback className="bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                                            测2
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                            测试2
                                        </span>
                                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border-0 bg-rose-500/15 text-rose-700 dark:text-rose-300">
                                            反方 · 第 1 回合驳论
                                        </span>
                                    </div>
                                </div>

                                <DuelScoreCard
                                    evidenceScore={3}
                                    citationScore={1}
                                    logicScore={2}
                                    fallacyPenalty={0}
                                    totalScore={6}
                                    hasFallacy={false}
                                    analysis="精准指出经典秘书问题不可撤回假设在人类情感中的局限。"
                                />
                            </div>

                            <div className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed space-y-2">
                                <p className="font-medium text-rose-700 dark:text-rose-300">
                                    “把爱人抽象为独立同分布样本，是数学家最浪漫的误解；将前 7 人设为纯垫脚石，则违背了康德人是目的而非手段的伦理准则。”
                                </p>
                                <p>
                                    <MathText
                                        text="经典秘书问题假设观测过程零情感沉没成本且单向不可逆。但若灵魂共振恰发生在 $i \le 7$ 阶段，机械执行‘只看不选’将直接以 $35\%$ 概率错失真爱！"
                                        inlineOnly
                                    />
                                </p>
                            </div>
                        </div>

                        {/* 第 2 回合互动沙盒：亲手体验严谨辩论 vs 逻辑谬误判罚 */}
                        {round2Mode === "idle" ? (
                            <div className="p-5 rounded-3xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] space-y-3 text-center">
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <span>第 2 回合实操体验：请代表正方选择一种回应策略，观察 AI 裁判如何判分</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleSimulateRound2("rigorous")}
                                        className="h-9 px-4 rounded-full border-0 text-xs font-medium bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/92 dark:text-zinc-950 shadow-[0_4px_14px_rgba(0,0,0,0.2)] gap-1.5 active:scale-[0.97] cursor-pointer"
                                    >
                                        <Brain className="h-3.5 w-3.5 text-sky-400 dark:text-sky-600" />
                                        <span>出招 A：提交贝叶斯先验修正模型 (+高分引证)</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSimulateRound2("fallacy")}
                                        className="h-9 px-4 rounded-full border-0 text-xs font-medium bg-rose-500/[0.12] hover:bg-rose-500/[0.18] text-rose-700 dark:text-rose-300 gap-1.5 active:scale-[0.97] cursor-pointer"
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        <span>出招 B：测试稻草人逻辑谬误 (触发扣 LP 警报)</span>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "rounded-3xl border-0 p-4 sm:p-5 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                                    round2Mode === "rigorous"
                                        ? "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1]"
                                        : "bg-rose-500/[0.09] dark:bg-rose-500/[0.11]"
                                )}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                            第 2 回合模拟裁决结果
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setRound2Mode("idle")}
                                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-0 text-[11px] font-medium bg-white/75 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 cursor-pointer active:scale-[0.96]"
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            <span>换一种出招重试</span>
                                        </button>
                                    </div>

                                    {round2Mode === "rigorous" ? (
                                        <DuelScoreCard
                                            evidenceScore={5}
                                            citationScore={4}
                                            logicScore={2}
                                            fallacyPenalty={0}
                                            totalScore={11}
                                            hasFallacy={false}
                                            analysis="引入 Gilbert & Mosteller (1966) 全信息模型有效化解前7人冷血质疑。"
                                        />
                                    ) : (
                                        <DuelScoreCard
                                            evidenceScore={1}
                                            citationScore={0}
                                            logicScore={1}
                                            fallacyPenalty={5}
                                            totalScore={-3}
                                            hasFallacy={true}
                                            fallacyType="稻草人谬误 (Strawman Fallacy)"
                                            analysis="曲解反方主体性论点为盲目冲动，触发逻辑护盾惩罚 -15 LP。"
                                        />
                                    )}
                                </div>

                                <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed">
                                    {round2Mode === "rigorous" ? (
                                        <MathText
                                            text="正方引入 Gilbert-Mosteller 全信息贝叶斯修正：当主体拥有内在效用先验分布 $F(u)$ 时，无需机械跳过前 7 人，而是采用动态分位阈值 $\tau_i$，一旦早期样本满足 $u_i > \tau_i$ 即可立即双向奔赴。AI 裁判判定引证严密，总分升至 21 分！"
                                            inlineOnly
                                        />
                                    ) : (
                                        "“反方反对算法，难道是主张闭着眼睛随便抓一个人闪婚吗？” —— AI 裁判实时识别出【稻草人谬误】，自动扣除 5 分谬误罚分与 15 点逻辑护盾 LP（当一方 LP 归零将直接触发学术破防判负）！"
                                    )}
                                </p>
                            </div>
                        )}
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
                    <span>上一步：论文排版</span>
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <span>下一步：私信与数据时效</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
