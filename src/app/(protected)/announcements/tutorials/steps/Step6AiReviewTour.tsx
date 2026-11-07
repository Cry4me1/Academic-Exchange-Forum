"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import {
    Bot,
    Brain,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    ArrowLeft,
    Award,
    MessageSquareQuote,
    Copy,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TutorialTaskChecklist, type TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step6AiReviewTourProps {
    onPrev: () => void;
    completedTaskIds: string[];
    onCompleteTask: (taskId: string) => void;
    onCompleteAllTasks: (taskIds: string[]) => void;
    onOpenCompleteModal: () => void;
}

const REASONING_STEPS = [
    "1. 解析核心论点：基于一维半导体-超导异质结中的马约拉纳零能模构建高容错非阿贝尔编织逻辑门。",
    "2. 核验哈密顿量：检查 Kitaev 链模型边界态代数关系 $\\{\\gamma_i, \\gamma_j\\} = 2\\delta_{ij}$，确认非平庸拓扑相奇偶校验自洽。",
    "3. 评估实验参数：塞曼分裂阈值 $V_Z > \\sqrt{\\Delta_0^2 + \\mu^2}$ 与诱导超导能隙比值合理，但有限温准粒子中毒需补充量化估算。",
    "4. 生成审稿结论：理论推导完备，矢量公式零跳步，给出 Strong Accept（强烈推荐录用）结论与两条建设性修订建议。",
];

const REVIEW_METRICS = [
    { label: "理论自洽性", score: 9.6 },
    { label: "创新贡献度", score: 9.2 },
    { label: "公式规范度", score: 9.8 },
    { label: "可复现潜力", score: 8.8 },
];

const AUTHOR_REBUTTAL_TEMPLATE = `尊敬的 Reviewer #2：
感谢您对本文非阿贝尔编织门哈密顿量推导的细致审阅与肯定！针对您提出的两点宝贵修订建议，我们已完成如下补充：
1. 【关于有限温准粒子中毒速率】：已在第 4.2 节补充热激发准粒子隧穿速率公式 $\\Gamma_{\\text{qp}} \\propto \\Delta_0 \\exp(-\\Delta_0 / k_B T)$，在稀释制冷机 $T = 20\\text{ mK}$ 工况下，$\\Gamma_{\\text{qp}}^{-1} > 12\\text{ ms}$，远大于单次编织门操作周期（$\\sim 85\\text{ ns}$）。
2. 【关于双栏出版图表排布】：已使用 Scholarly 内置 IEEE/Nature 双栏排版工具重绘相图与保真度收敛曲线。`;

export function Step6AiReviewTour({
    onPrev,
    completedTaskIds,
    onCompleteTask,
    onCompleteAllTasks,
    onOpenCompleteModal,
}: Step6AiReviewTourProps) {
    const [showReasoning, setShowReasoning] = useState(true);
    const [showRebuttal, setShowRebuttal] = useState(false);
    const [copiedRebuttal, setCopiedRebuttal] = useState(false);

    const taskDefs = useMemo<TaskItem[]>(
        () => [
            {
                id: "inspect-reasoning",
                title: "1. 检视 DeepSeek 深度思维链推导过程",
                description: "点击思维链折叠面板，查看 AI 审稿人对算符对易关系与物理边界条件的逐步验算逻辑。",
                isCompleted: completedTaskIds.includes("inspect-reasoning"),
            },
            {
                id: "inspect-review",
                title: "2. 查阅结构化同行评审报告与作者回复信",
                description: "阅读包含 KaTeX 公式核验的四维评审报告，并体验一键生成标准 Author Rebuttal 回复提纲。",
                isCompleted: completedTaskIds.includes("inspect-review"),
            },
            {
                id: "finish-cert",
                title: "3. 点亮‘全能研学者’结业荣誉认证",
                description: "点击右下角结业认证按钮，解锁全部 6 大核心板块勋章并领取结业证书！",
                isCompleted: completedTaskIds.includes("finish-cert"),
            },
        ],
        [completedTaskIds]
    );

    const handleToggleReasoning = () => {
        setShowReasoning((prev) => !prev);
        onCompleteTask("inspect-reasoning");
    };

    const handleToggleRebuttal = () => {
        setShowRebuttal((prev) => !prev);
        onCompleteTask("inspect-review");
        if (!showRebuttal) {
            toast.success("已针对 Reviewer #2 审稿意见生成标准作者回复提纲");
        }
    };

    const handleCopyRebuttal = async () => {
        try {
            await navigator.clipboard.writeText(AUTHOR_REBUTTAL_TEMPLATE);
            setCopiedRebuttal(true);
            toast.success("Author Rebuttal 回复提纲已复制");
            setTimeout(() => setCopiedRebuttal(false), 2000);
        } catch {
            toast.error("复制失败");
        }
    };

    const handleGraduate = () => {
        onCompleteAllTasks(["inspect-reasoning", "inspect-review", "finish-cert"]);
        onOpenCompleteModal();
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={taskDefs}
                onTaskClick={(id) => {
                    onCompleteTask(id);
                    if (id === "finish-cert") onOpenCompleteModal();
                    else toast.success("已标记该项 AI 审稿实操完成");
                }}
                onMarkAllDone={() =>
                    onCompleteAllTasks(["inspect-reasoning", "inspect-review", "finish-cert"])
                }
                stepTitle="Step 6 · 掌握多模态 AI 同行评审系统 (Peer Review)"
                stepBadge="3 项实操体验"
                hintText="发表学术帖子后可随时召唤 Reviewer #2 深度推理模型，获取顶刊级审稿报告并支持公开展示或定向修订。"
            />

            {/* 1:1 无边框液态玻璃 PeerReviewPanel 全景卡片 */}
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden">
                {/* 头部摘要栏 */}
                <div className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-0 bg-sky-500/[0.14] text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] shrink-0">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    AI 同行评审报告 (Reviewer #2 Report)
                                </h3>
                                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border-0 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300">
                                    评审编号 #PR-2026-804
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                DeepSeek 深度数学推理引擎 · 作者已设为公开可见
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/[0.14] px-3.5 py-1.5 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_10px_rgba(16,185,129,0.16)]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Strong Accept · 强烈推荐录用</span>
                    </span>
                </div>

                {/* 消融光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                <div className="p-5 sm:p-7 space-y-5">
                    {/* 四维量化同行评审指标卡 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {REVIEW_METRICS.map((m) => (
                            <div
                                key={m.label}
                                className="p-3.5 rounded-2xl border-0 bg-zinc-900/[0.03] dark:bg-white/[0.035] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] space-y-1.5"
                            >
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-zinc-500 dark:text-zinc-400">{m.label}</span>
                                    <span className="font-mono tabular-nums text-zinc-900 dark:text-white">
                                        {m.score.toFixed(1)}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-zinc-900/[0.07] dark:bg-white/[0.08] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-emerald-500/85 origin-left"
                                        style={{ transform: `scaleX(${m.score / 10})` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 深度思考链推理面板 */}
                    <div className="rounded-2xl border-0 bg-sky-500/[0.06] dark:bg-sky-500/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] overflow-hidden">
                        <button
                            type="button"
                            onClick={handleToggleReasoning}
                            className="w-full flex items-center justify-between px-4 py-3 text-xs text-sky-800 dark:text-sky-200 font-medium hover:bg-sky-500/[0.08] transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-sky-500" />
                                <span>DeepSeek 链式思维验算过程 · 耗时 4.2s（点击切换折叠）</span>
                            </div>
                            {showReasoning ? (
                                <ChevronDown className="h-4 w-4 opacity-70" />
                            ) : (
                                <ChevronRight className="h-4 w-4 opacity-70" />
                            )}
                        </button>

                        {showReasoning && (
                            <div className="px-4 pb-4 pt-1 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-sky-500/20 to-transparent mb-2.5" />
                                {REASONING_STEPS.map((line, i) => (
                                    <p key={i} className="font-mono text-[11.5px]">
                                        <MathText text={line} inlineOnly />
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 正式顶刊级评审正文（原生渲染全部 KaTeX 公式） */}
                    <div
                        onClick={() => onCompleteTask("inspect-review")}
                        className="rounded-3xl border-0 bg-zinc-100/75 dark:bg-zinc-950/50 p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),inset_0_-1px_0.5px_rgba(255,255,255,0.75)] cursor-pointer"
                    >
                        <div className="space-y-1.5">
                            <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                                1. 论文主要贡献与理论创新性
                            </h4>
                            <p>
                                本研究针对拓扑量子计算的退相干瓶颈，基于一维纳米超导异质结中的马约拉纳零能模构建了高容错非阿贝尔编织逻辑门。哈密顿量建模严谨，严格推导了编织群元对应的幺正演化算符，KaTeX 矢量公式推导完整，无逻辑跳步。
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                                2. 详细技术核验意见
                            </h4>
                            <ul className="space-y-1.5 list-disc list-inside">
                                <li>
                                    <MathText
                                        text="【公式 (2.1) 拓扑相边界判定】：化学势条件 $|\mu| < 2t$ 与塞曼阈值 $V_Z > \sqrt{\Delta_0^2 + \mu^2}$ 匹配准确，零能束缚态波函数在导线端点呈严格指数衰减；"
                                        inlineOnly
                                    />
                                </li>
                                <li>
                                    <MathText
                                        text="【局域微扰鲁棒性】：对于局域静电势涨落具备天然拓扑保护，逻辑相干寿命较传统 Transmon 比特提升约 $120\times$。"
                                        inlineOnly
                                    />
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-1.5">
                            <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                                3. 建设性修改建议 (Minor Revision Suggestions)
                            </h4>
                            <ol className="space-y-1 list-decimal list-inside">
                                <li>
                                    <MathText
                                        text="建议在第 4 节补充有限温环境下热激发对准粒子中毒 (Quasiparticle Poisoning) 速率 $\Gamma_{\text{qp}}$ 的量化估算；"
                                        inlineOnly
                                    />
                                </li>
                                <li>
                                    建议在正式定稿前利用本站 <strong>IEEE / Nature 双栏出版工具</strong> 优化相图与保真度图表排布。
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* 交互增强：一键草拟 Author Rebuttal 作者点对点回复信 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleToggleRebuttal}
                                className={cn(
                                    "inline-flex items-center gap-2 h-9 px-4 rounded-full border-0 text-xs font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.97] cursor-pointer",
                                    showRebuttal
                                        ? "bg-amber-500/[0.15] text-amber-800 dark:text-amber-300"
                                        : "bg-zinc-900/[0.045] hover:bg-zinc-900/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]"
                                )}
                            >
                                <MessageSquareQuote className="h-3.5 w-3.5 text-amber-500" />
                                <span>
                                    {showRebuttal
                                        ? "收起 Author Rebuttal 回复提纲"
                                        : "实操互动：针对审稿意见生成 Author Rebuttal 回复信"}
                                </span>
                            </button>

                            {showRebuttal && (
                                <button
                                    type="button"
                                    onClick={handleCopyRebuttal}
                                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border-0 text-xs font-medium bg-zinc-900/[0.045] hover:bg-zinc-900/[0.08] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 active:scale-[0.97] cursor-pointer"
                                >
                                    {copiedRebuttal ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                    <span>{copiedRebuttal ? "已复制提纲" : "复制回复信"}</span>
                                </button>
                            )}
                        </div>

                        {showRebuttal && (
                            <div className="rounded-2xl border-0 bg-amber-500/[0.07] dark:bg-amber-500/[0.09] p-4 text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                                <MathText text={AUTHOR_REBUTTAL_TEMPLATE} inlineOnly />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部结业导航操作条 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-full border-0 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>上一步：积分与特权</span>
                </Button>

                <Button
                    size="lg"
                    onClick={handleGraduate}
                    className="h-12 px-7 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_6px_24px_-2px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.42)] dark:bg-white/95 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_6px_24px_-2px_rgba(255,255,255,0.24),inset_0_1px_1.5px_rgba(255,255,255,1)] gap-2 transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.97] cursor-pointer"
                >
                    <Award className="h-4 w-4 text-amber-400 dark:text-amber-600" />
                    <span>完成实操训练 · 点亮全能研学者证书</span>
                </Button>
            </div>
        </div>
    );
}
