"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import { Button } from "@/components/ui/button";
import { extractTextFromJSON, truncateText } from "@/lib/extract-text";
import { formatCredits } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bot,
    Brain,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Coins,
    FileSearch,
    Sparkles,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Scale,
    Cpu,
} from "lucide-react";
import type { JSONContent } from "novel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { savePeerReview, togglePeerReviewVisibility, getPeerReview } from "../../app/(protected)/posts/actions";

const MIN_REVIEW_CREDIT_COST = 15;

interface PeerReviewPanelProps {
    content: JSONContent | undefined;
    title: string;
    tags: string[];
    postId?: string;
    isAuthor: boolean;
}

export default function PeerReviewPanel({
    content,
    title,
    tags,
    postId,
    isAuthor,
}: PeerReviewPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number | null>(null);
    const [showReasoning, setShowReasoning] = useState(false);
    const [showDeduction, setShowDeduction] = useState(false);
    const [deductedAmount, setDeductedAmount] = useState<number>(0);
    const prevBalanceRef = useRef<number | null>(null);

    // 数据库加载与公开状态
    const [isPublic, setIsPublic] = useState(false);
    const [isLoadingDb, setIsLoadingDb] = useState(true);

    // 加载积分余额
    const refreshCredits = useCallback(async () => {
        const result = await getMyCredits();
        const newBalance = result.balance;
        if (
            prevBalanceRef.current !== null &&
            newBalance < prevBalanceRef.current
        ) {
            setDeductedAmount(prevBalanceRef.current - newBalance);
            setShowDeduction(true);
            setTimeout(() => setShowDeduction(false), 3000);
        }
        prevBalanceRef.current = newBalance;
        setCreditBalance(newBalance);
    }, []);

    useEffect(() => {
        if (isExpanded && isAuthor) {
            refreshCredits();
        }
    }, [isExpanded, isAuthor, refreshCredits]);

    // 初始化时从 localStorage 恢复数据 (仅作者防丢失备用，且忽略通用占位符标题)
    const [initialMessages] = useState(() => {
        if (typeof window !== "undefined" && title && title !== "输入研讨标题..." && isAuthor) {
            try {
                const cacheKey = postId ? `peer-review-post-${postId}` : `peer-review-title-${title}`;
                const saved = localStorage.getItem(cacheKey);
                if (saved) return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse cached peer review", e);
            }
        }
        return [];
    });

    // useChat (AI SDK v6)
    const { messages, sendMessage, status, setMessages } = useChat({
        id: "peer-review",
        messages: initialMessages,
        transport: new DefaultChatTransport({
            api: "/api/ai/peer-review",
        }),
        onFinish: async ({ message }) => {
            refreshCredits();

            // 生成完后自动保存到数据库
            let reasoning = "";
            let review = "";
            if (message.parts) {
                for (const part of message.parts) {
                    if (part.type === "reasoning") {
                        reasoning += part.text || "";
                    } else if (part.type === "text") {
                        review += part.text || "";
                    }
                }
            } else {
                review = (message as any).content || "";
            }

            if (review && postId) {
                try {
                    await savePeerReview(postId, reasoning, review);
                    if (typeof window !== "undefined" && title) {
                        localStorage.removeItem(`peer-review-${title}`);
                    }
                } catch (e) {
                    console.error("Auto save peer review failed", e);
                }
            }
        },
        onError: (err: Error) => {
            if (
                err.message.includes("402") ||
                err.message.includes("INSUFFICIENT_CREDITS")
            ) {
                toast.error(
                    `积分不足，同行评审最低消耗 ${MIN_REVIEW_CREDIT_COST} 积分。`,
                    {
                        action: {
                            label: "去充值",
                            onClick: () => {
                                window.dispatchEvent(
                                    new CustomEvent("open-recharge-dialog")
                                );
                            },
                        },
                    }
                );
                return;
            }
            toast.error("评审失败：" + err.message);
        },
    });

    // 从数据库加载已有的评审结果
    useEffect(() => {
        const loadDbReview = async () => {
            if (!postId) {
                setIsLoadingDb(false);
                return;
            }
            setIsLoadingDb(true);
            try {
                const res = await getPeerReview(postId);
                if (res?.data) {
                    const dbMessages = [
                        {
                            id: "peer-review-database",
                            role: "assistant" as const,
                            content: res.data.review_content,
                            parts: [
                                { type: "reasoning" as const, text: res.data.reasoning_content || "" },
                                { type: "text" as const, text: res.data.review_content || "" }
                            ]
                        }
                    ];
                    setMessages(dbMessages);
                    setIsPublic(res.data.is_public);
                    setIsExpanded(true);
                } else {
                    setMessages([]);
                }
            } catch (error) {
                console.error("加载持久化同行评审失败", error);
            } finally {
                setIsLoadingDb(false);
            }
        };

        loadDbReview();
    }, [postId, setMessages]);

    // 每次 messages 更新时同步到 localStorage (仅作者有权操作，跳过占位符)
    useEffect(() => {
        if (typeof window !== "undefined" && title && title !== "输入研讨标题..." && isAuthor) {
            const cacheKey = postId ? `peer-review-post-${postId}` : `peer-review-title-${title}`;
            if (messages.length > 0) {
                localStorage.setItem(cacheKey, JSON.stringify(messages));
            } else if (messages.length === 0) {
                localStorage.removeItem(cacheKey);
            }
        }
    }, [messages, title, postId, isAuthor]);

    // 从 assistant 消息的 parts 中提取推理和正文
    const assistantMsg = messages.find((m) => m.role === "assistant");

    const { reasoningText, reviewText } = useMemo(() => {
        if (!assistantMsg?.parts) return { reasoningText: "", reviewText: "" };

        let reasoning = "";
        let review = "";

        for (const part of assistantMsg.parts) {
            if (part.type === "reasoning") {
                reasoning += part.text || "";
            } else if (part.type === "text") {
                review += part.text || "";
            }
        }

        return { reasoningText: reasoning, reviewText: review };
    }, [assistantMsg]);

    // 状态检测
    const isActive = status === "submitted" || status === "streaming";
    const hasStarted = messages.length > 0;
    const isWritingReview = isActive && !!reviewText;
    const hasResult = status === "ready" && !!reviewText;

    const handleStartReview = async () => {
        if (!content) {
            toast.error("请先输入文章内容");
            return;
        }

        if (tags.length === 0) {
            toast.error("请至少选择一个标签");
            return;
        }

        const plainText = extractTextFromJSON(content);

        if (!plainText || plainText.length < 50) {
            toast.error("内容太短，至少需要 50 个字符才能进行评审");
            return;
        }

        const truncatedContent = truncateText(plainText, 8000);

        // 清除之前的评审并展开
        setMessages([]);
        setShowReasoning(false);
        setIsExpanded(true);

        // 发送评审请求
        await sendMessage(
            { text: "请评审以下文章" },
            {
                body: {
                    content: truncatedContent,
                    title,
                    tags,
                },
            }
        );
    };

    if (isLoadingDb) {
        return (
            <div className="rounded-2xl border border-violet-200/60 dark:border-violet-950/40 p-4 bg-violet-50/20 dark:bg-violet-950/10 flex items-center justify-center gap-2 h-14">
                <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
                <span className="text-xs text-muted-foreground">正在加载学术评审数据...</span>
            </div>
        );
    }

    if (!isAuthor && messages.length === 0) {
        return null;
    }

    const insufficientCredits =
        creditBalance !== null && creditBalance < MIN_REVIEW_CREDIT_COST;

    return (
        <div className="rounded-2xl border border-violet-200/80 dark:border-violet-900/50 bg-gradient-to-br from-violet-50/50 via-white to-zinc-50/50 dark:from-violet-950/20 dark:via-zinc-900/60 dark:to-zinc-950/40 backdrop-blur-sm shadow-xs overflow-hidden transition-all">
            {/* 头部摘要栏 */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsExpanded(!isExpanded)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsExpanded(!isExpanded);
                        }
                    }}
                    className="flex items-start gap-3 text-left cursor-pointer select-none group flex-1"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/80 border border-violet-200/70 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Bot className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                {isAuthor ? "AI 同行评审" : "AI 同行评审 (作者已公开)"}
                                <span className="text-[11px] font-normal text-muted-foreground font-mono">
                                    Reviewer #2 · DeepSeek
                                </span>
                            </h3>
                            {hasResult && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    评审完成
                                </span>
                            )}
                        </div>

                        {/* 评审维度能力小药丸 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100/70 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/30">
                                <Scale className="w-2.5 h-2.5" />
                                论证自洽性
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30">
                                <Cpu className="w-2.5 h-2.5" />
                                算法与边界
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                学术规范
                            </span>
                        </div>
                    </div>
                </div>

                {/* 右侧控制：折叠切换与紧凑操作按钮 */}
                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    {isAuthor && !hasStarted && !isActive && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartReview();
                            }}
                            disabled={Boolean(insufficientCredits)}
                            className="h-8 px-3.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs gap-1.5 transition-all"
                        >
                            <FileSearch className="h-3.5 w-3.5" strokeWidth={1.75} />
                            发起初审
                        </Button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-violet-100/40 dark:hover:bg-violet-950/40 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                        )}
                    </button>
                </div>
            </div>

            {/* 展开内容 */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-violet-200/60 dark:border-violet-900/40">
                            {/* 积分与资费状态栏（仅作者可见） */}
                            {isAuthor && (
                                <div className="flex items-center justify-between px-5 py-2.5 bg-violet-50/40 dark:bg-violet-950/20 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                                        <span>
                                            单次消耗提示：<strong className="text-violet-700 dark:text-violet-300">≥ {MIN_REVIEW_CREDIT_COST} 积分</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 relative">
                                        <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                        <span className="text-muted-foreground text-[11px]">当前余额:</span>
                                        <AnimatePresence mode="popLayout">
                                            <motion.span
                                                key={creditBalance}
                                                initial={{ y: -6, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 6, opacity: 0 }}
                                                className={`font-semibold font-mono tabular-nums ${
                                                    insufficientCredits ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                                                }`}
                                            >
                                                {creditBalance !== null ? `${formatCredits(creditBalance)} 积分` : "加载中..."}
                                            </motion.span>
                                        </AnimatePresence>
                                        {/* 扣费飘字 */}
                                        <AnimatePresence>
                                            {showDeduction && (
                                                <motion.span
                                                    initial={{ opacity: 1, y: 0, x: 4 }}
                                                    animate={{ opacity: 0, y: -20 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 2, ease: "easeOut" }}
                                                    className="absolute -top-2 right-0 text-[11px] font-bold text-red-500 pointer-events-none whitespace-nowrap"
                                                >
                                                    -{deductedAmount}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* ====== 未开始状态下的详细引导（仅作者可见） ====== */}
                            {isAuthor && !hasStarted && !isActive && (
                                <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        基于学术论文标准自动检测研究脉络、公式严谨性与潜在缺陷。建议在正文编写超过 50 字后执行。
                                    </p>
                                    {insufficientCredits ? (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                window.dispatchEvent(
                                                    new CustomEvent("open-recharge-dialog")
                                                )
                                            }
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10 shrink-0 h-8"
                                        >
                                            <Coins className="h-3.5 w-3.5" />
                                            余额不足，去充值
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={handleStartReview}
                                            size="sm"
                                            className="h-8 px-4 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs gap-1.5 shrink-0"
                                        >
                                            <FileSearch className="h-3.5 w-3.5" />
                                            开始评审 (≥15 积分)
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* ====== 思考与深度推理状态 ====== */}
                            {isActive && !reviewText && (
                                <div className="px-5 py-6">
                                    <div className="flex flex-col items-center gap-3.5">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.08, 1],
                                                opacity: [0.8, 1, 0.8],
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-800/80 text-violet-600 dark:text-violet-400"
                                        >
                                            <Brain className="h-6 w-6 animate-pulse" strokeWidth={1.75} />
                                        </motion.div>
                                        <div className="text-center space-y-1">
                                            <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
                                                Reviewer #2 正在进行深度推理
                                                <motion.span
                                                    animate={{ opacity: [0, 1, 0] }}
                                                    transition={{ duration: 1.2, repeat: Infinity }}
                                                >
                                                    ...
                                                </motion.span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                正在推演学术论据自洽性，请稍候
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ====== 评审结果展示区 ====== */}
                            {(reviewText || (hasResult && reasoningText)) && (
                                <div className="border-t border-violet-200/50 dark:border-violet-900/30">
                                    {/* 深度思考过程折叠 */}
                                    {reasoningText && (
                                        <div className="border-b border-border/40">
                                            <button
                                                type="button"
                                                onClick={() => setShowReasoning(!showReasoning)}
                                                className="w-full flex items-center gap-2 px-5 py-2 text-xs text-muted-foreground hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-colors"
                                            >
                                                <Brain className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                                <span className="font-medium">查看思维链推演 (CoT)</span>
                                                <span className="text-violet-500/70 text-[11px]">
                                                    ({reasoningText.length} 字)
                                                </span>
                                                {showReasoning ? (
                                                    <ChevronDown className="h-3.5 w-3.5 ml-auto shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {showReasoning && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="max-h-[260px] overflow-y-auto px-5 py-3 bg-violet-500/5 border-t border-violet-500/10">
                                                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed break-words">
                                                                {reasoningText}
                                                            </pre>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* 评审正文 Markdown */}
                                    <div className="max-h-[460px] overflow-y-auto px-5 py-4">
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-table:text-xs prose-td:border prose-th:border prose-table:border-collapse prose-th:p-2 prose-td:p-2 prose-th:bg-muted/40">
                                            <Markdown remarkPlugins={[remarkGfm]}>{reviewText}</Markdown>
                                        </div>
                                    </div>

                                    {/* 正在生成流式状态 */}
                                    {isWritingReview && (
                                        <div className="flex items-center gap-2 px-5 py-2 border-t border-border/30 bg-muted/10">
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="w-1.5 h-1.5 rounded-full bg-violet-500"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                正在流式生成学术评审意见...
                                            </span>
                                        </div>
                                    )}

                                    {/* 公开/隐藏评审切换（仅作者可见） */}
                                    {hasResult && isAuthor && postId && (
                                        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/40 bg-muted/10">
                                            <div className="text-left pr-4">
                                                <p className="text-xs font-semibold text-foreground">公开此审稿报告</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    开启后，读者可在文章正文末尾查阅 Reviewer #2 评审意见
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const newStatus = !isPublic;
                                                    setIsPublic(newStatus);
                                                    const res = await togglePeerReviewVisibility(postId, newStatus);
                                                    if (res.error) {
                                                        setIsPublic(!newStatus);
                                                        toast.error(res.error);
                                                    } else {
                                                        toast.success(newStatus ? "已将报告设为公开" : "已将报告设为私密");
                                                    }
                                                }}
                                                className={cn(
                                                    "relative w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0",
                                                    isPublic ? "bg-violet-600" : "bg-muted-foreground/30"
                                                )}
                                            >
                                                <motion.div
                                                    layout
                                                    className="w-4 h-4 rounded-full bg-background shadow-xs"
                                                    animate={{ x: isPublic ? 16 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        </div>
                                    )}

                                    {/* 重新评审入口（仅作者可见） */}
                                    {hasResult && isAuthor && (
                                        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/40 bg-violet-50/20 dark:bg-violet-950/10">
                                            <span className="text-[11px] text-muted-foreground">
                                                如已根据意见修改正文，可重新触发评审
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleStartReview}
                                                className="h-7 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-100/50"
                                            >
                                                重新发起评审
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

