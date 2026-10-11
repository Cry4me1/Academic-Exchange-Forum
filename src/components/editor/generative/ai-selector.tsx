"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { useCompletion } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, BrainCircuit, Coins, Lock, Sparkles, Zap } from "lucide-react";
import { useEditor } from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AICompletionCommands from "./ai-completion-command";
import AISelectorCommands from "./ai-selector-commands";
import { AcademicAiStreamCapsule } from "./AcademicAiStreamCapsule";

const MIN_CREDIT_COST = 8;
type ModelMode = "fast" | "thinking";

interface AISelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialOption?: string;
}

// Helper function to get selected text from editor
function getSelectedText(editor: ReturnType<typeof useEditor>["editor"]): string {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
}

export function AISelector({ onOpenChange, initialOption }: AISelectorProps) {
    const { editor } = useEditor();
    const [inputValue, setInputValue] = useState("");
    const [creditBalance, setCreditBalance] = useState<number | null>(null);
    const [userLevel, setUserLevel] = useState<number>(1);
    const [modelMode, setModelMode] = useState<ModelMode>("fast");
    const [showDeduction, setShowDeduction] = useState(false);
    const [deductedAmount, setDeductedAmount] = useState<number>(0);
    const prevBalanceRef = useRef<number | null>(null);

    // 加载积分余额与学者等级
    const refreshCredits = useCallback(async () => {
        const result = await getMyCredits();
        const newBalance = result.balance;
        const level = ("scholarLevel" in result ? (result.scholarLevel as number) : (result as any).vipLevel) || 1;
        setUserLevel(level);

        // 检测是否发生了扣费（余额减少了）
        if (prevBalanceRef.current !== null && newBalance < prevBalanceRef.current) {
            setDeductedAmount(prevBalanceRef.current - newBalance);
            setShowDeduction(true);
            setTimeout(() => setShowDeduction(false), 1800);
        }
        prevBalanceRef.current = newBalance;
        setCreditBalance(newBalance);
    }, []);

    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    // 读取本地偏好
    useEffect(() => {
        try {
            const saved = localStorage.getItem("scholarly_ai_model_mode");
            if (saved === "thinking" && userLevel >= 4) {
                setModelMode("thinking");
            } else if (userLevel < 4) {
                setModelMode("fast");
            }
        } catch {
            // ignore localStorage errors
        }
    }, [userLevel]);

    const { completion, complete, isLoading, error, stop } = useCompletion({
        api: "/api/generate",
        streamProtocol: "text",
        onFinish: () => {
            // AI 调用完成后刷新余额（触发扣费动画）
            refreshCredits();
        },
        onError: (err: Error) => {
            // 拦截 402 积分不足错误
            if (err.message.includes("402") || err.message.includes("INSUFFICIENT_CREDITS") || err.message.includes("NO_CREDIT_RECORD")) {
                toast.error("积分不足，请先充值！AI 调用最低消耗 8 积分。", {
                    action: {
                        label: "去充值",
                        onClick: () => {
                            window.dispatchEvent(new CustomEvent("open-recharge-dialog"));
                        },
                    },
                });
                return;
            }
        },
    });

    // 全局派发 AI 状态变化，供 NovelEditor 外层渲染极简发丝微晕
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("ai-generation-status", {
                detail: { isGenerating: isLoading },
            })
        );
    }, [isLoading]);

    useEffect(() => {
        return () => {
            window.dispatchEvent(
                new CustomEvent("ai-generation-status", {
                    detail: { isGenerating: false },
                })
            );
        };
    }, []);

    // 监听外部打断事件（例如点击工具栏的推演中按钮或按下快捷键）
    useEffect(() => {
        const handleStop = () => {
            stop();
        };
        window.addEventListener("ai-generation-stop", handleStop);
        return () => window.removeEventListener("ai-generation-stop", handleStop);
    }, [stop]);

    // 模式切换与等级特权校验
    const handleSelectMode = (newMode: ModelMode) => {
        if (newMode === "thinking") {
            if (userLevel < 4) {
                toast.info("深度思考推演通道需学者等级达到 Lv4 解锁", {
                    description: `您当前学者等级为 Lv${userLevel}。通过发表高质研讨、积累同行认可与采纳即可晋升！`,
                    action: {
                        label: "查看特权",
                        onClick: () => {
                            window.location.href = "/vip";
                        },
                    },
                });
                return;
            }
            setModelMode("thinking");
            try {
                localStorage.setItem("scholarly_ai_model_mode", "thinking");
            } catch {}
            toast.success("已切换至 DeepSeek 深度思考推理模式 (长思维链推演)");
        } else {
            setModelMode("fast");
            try {
                localStorage.setItem("scholarly_ai_model_mode", "fast");
            } catch {}
        }
    };

    // Handle initialOption execution
    useEffect(() => {
        if (initialOption && !completion && !isLoading && editor) {
            if (initialOption === "continue") {
                let text = getSelectedText(editor) || editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 500), editor.state.selection.from, " ");

                // 防御 1: 若当前光标处无文字，尝试获取编辑器整体文字
                if (!text.trim()) {
                    text = editor.getText();
                }

                // 防御 2: 若编辑器仍为空，尝试获取网页研讨标题作为构思种子
                if (!text.trim()) {
                    const titleInput = document.querySelector('input[placeholder*="研讨标题"]') as HTMLInputElement;
                    if (titleInput?.value?.trim()) {
                        text = `研讨命题：${titleInput.value.trim()}`;
                    }
                }

                // 若完全没有任何可供续写的上下文
                if (!text.trim()) {
                    toast.info("请先输入研讨标题或简述前文，AI 将根据上下文为您严谨推演续写");
                    onOpenChange(false);
                    return;
                }

                complete(text, { body: { option: "continue", thinking: modelMode === "thinking" } });
            }
        }
    }, [initialOption, editor, completion, isLoading, complete, onOpenChange, modelMode]);

    // Handle error display (skip 402 as it's handled by onError)
    useEffect(() => {
        if (error && !error.message.includes("402")) {
            toast.error(error.message);
        }
    }, [error]);

    // 监听斜杠命令触发的事件
    useEffect(() => {
        const handleContinue = () => {
            if (!completion && !isLoading && editor) {
                let text = getSelectedText(editor) || editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 500), editor.state.selection.from, " ");
                if (!text.trim()) text = editor.getText();
                if (!text.trim()) {
                    const titleInput = document.querySelector('input[placeholder*="研讨标题"]') as HTMLInputElement;
                    if (titleInput?.value?.trim()) text = `研讨命题：${titleInput.value.trim()}`;
                }
                if (text.trim()) {
                    complete(text, { body: { option: "continue", thinking: modelMode === "thinking" } });
                }
            }
        };

        window.addEventListener("trigger-ai-continue", handleContinue);
        return () => {
            window.removeEventListener("trigger-ai-continue", handleContinue);
        };
    }, [editor, completion, isLoading, complete, modelMode]);

    const hasCompletion = completion.length > 0;

    if (!editor) return null;

    const handleSubmit = () => {
        const selectedText = getSelectedText(editor);

        if (completion) {
            complete(completion, {
                body: { option: "zap", command: inputValue, thinking: modelMode === "thinking" },
            }).then(() => setInputValue(""));
        } else if (selectedText || inputValue) {
            complete(selectedText || inputValue, {
                body: { option: "zap", command: inputValue, thinking: modelMode === "thinking" },
            }).then(() => setInputValue(""));
        } else {
            toast.error("请先选择文本或输入内容");
        }
    };

    const insufficientCredits = creditBalance !== null && creditBalance < MIN_CREDIT_COST;

    return (
        <Command
            className={cn(
                "overflow-hidden transition-all duration-300 border-0 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_24px_56px_-10px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.12)] rounded-3xl",
                isLoading || hasCompletion ? "w-[400px] sm:w-[480px]" : "w-[360px] sm:w-[410px]"
            )}
        >
            {/* ====== 顶栏：水滴分段模型切换器与研讨积分 ====== */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 select-none">
                {/* 模型模式水滴双联切换胶囊 (Liquid Glass Segmented Capsule) */}
                <div className="relative flex items-center p-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/60 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)]">
                    {/* 极速模式按钮 */}
                    <button
                        type="button"
                        onClick={() => handleSelectMode("fast")}
                        className={cn(
                            "relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-200",
                            modelMode === "fast"
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )}
                    >
                        {modelMode === "fast" && (
                            <motion.div
                                layoutId="ai-model-mode-pill"
                                className="absolute inset-0 rounded-full bg-white dark:bg-zinc-900 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.15)] -z-10"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <Zap className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                        <span>极速撰写</span>
                    </button>

                    {/* 深度推理模式按钮 */}
                    <button
                        type="button"
                        onClick={() => handleSelectMode("thinking")}
                        className={cn(
                            "relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-200",
                            modelMode === "thinking"
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        )}
                        title={userLevel < 4 ? `需学者等级 Lv4 解锁 (当前 Lv${userLevel})` : "DeepSeek 深度思考长思维链"}
                    >
                        {modelMode === "thinking" && (
                            <motion.div
                                layoutId="ai-model-mode-pill"
                                className="absolute inset-0 rounded-full bg-white dark:bg-zinc-900 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.15)] -z-10"
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            />
                        )}
                        <BrainCircuit className={cn(
                            "h-3 w-3",
                            modelMode === "thinking" ? "text-violet-600 dark:text-violet-400" : "text-zinc-400"
                        )} />
                        <span>深度思考</span>

                        {/* 特权标签 / 加锁提示 */}
                        {userLevel < 4 ? (
                            <span className="flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 text-[9px] font-mono text-zinc-500 dark:text-zinc-400">
                                <Lock className="h-2 w-2" />
                                Lv4
                            </span>
                        ) : (
                            <span className="px-1 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/60 text-[9px] font-mono font-semibold text-violet-600 dark:text-violet-400">
                                Lv4+
                            </span>
                        )}
                    </button>
                </div>

                {/* 右侧：研讨积分余额微胶囊 */}
                <div
                    onClick={() => window.dispatchEvent(new CustomEvent("open-recharge-dialog"))}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/40 hover:bg-zinc-200/70 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors relative"
                    title="点击管理/充值研讨积分"
                >
                    <Coins className="h-3 w-3 text-amber-500/90" />
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={creditBalance}
                            initial={{ y: -6, opacity: 0, scale: 0.85 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 6, opacity: 0, scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`text-xs font-semibold tabular-nums font-mono ${
                                insufficientCredits ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                            }`}
                        >
                            {creditBalance !== null ? creditBalance : "..."}
                        </motion.span>
                    </AnimatePresence>

                    {/* 扣费飘字动画 */}
                    <AnimatePresence>
                        {showDeduction && (
                            <motion.span
                                initial={{ opacity: 1, y: 0, x: 2 }}
                                animate={{ opacity: 0, y: -18 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute -top-1.5 right-1 text-[10px] font-bold text-red-500 pointer-events-none whitespace-nowrap font-mono"
                            >
                                -{deductedAmount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 渐变消融微光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* ====== 核心生成与推演动效视图 ====== */}
            {(isLoading || hasCompletion) && (
                <AcademicAiStreamCapsule
                    isLoading={isLoading}
                    completion={completion}
                    onStop={stop}
                    isThinkingMode={modelMode === "thinking"}
                />
            )}

            {/* ====== 完成后的动作或初始输入栏 ====== */}
            {!isLoading && (
                <>
                    {!hasCompletion && (
                        <div className="relative">
                            <CommandInput
                                value={inputValue}
                                onValueChange={setInputValue}
                                autoFocus
                                placeholder={
                                    insufficientCredits
                                        ? "积分不足，请先充值..."
                                        : modelMode === "thinking"
                                            ? "输入学术命题，开启深度长链推演..."
                                            : "让 AI 编辑或生成学术段落..."
                                }
                            />
                            <Button
                                size="icon"
                                className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                onClick={
                                    insufficientCredits
                                        ? () => window.dispatchEvent(new CustomEvent("open-recharge-dialog"))
                                        : handleSubmit
                                }
                                disabled={insufficientCredits && false}
                            >
                                {insufficientCredits ? (
                                    <Coins className="h-3.5 w-3.5 text-amber-300" />
                                ) : (
                                    <ArrowUp className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    )}
                    <CommandList>
                        {hasCompletion ? (
                            <AICompletionCommands
                                onDiscard={() => {
                                    onOpenChange(false);
                                }}
                                completion={completion}
                            />
                        ) : (
                            <AISelectorCommands
                                onSelect={(value, option, command) =>
                                    complete(value, {
                                        body: {
                                            option,
                                            command,
                                            thinking: modelMode === "thinking",
                                        },
                                    })
                                }
                            />
                        )}
                    </CommandList>
                </>
            )}
        </Command>
    );
}
