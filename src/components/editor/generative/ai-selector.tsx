"use client";

import { getMyCredits } from "@/app/(protected)/credits/actions";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { useCompletion } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Coins } from "lucide-react";
import { useEditor } from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AICompletionCommands from "./ai-completion-command";
import AISelectorCommands from "./ai-selector-commands";
import { AcademicAiStreamCapsule } from "./AcademicAiStreamCapsule";

const MIN_CREDIT_COST = 8;

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
    const [showDeduction, setShowDeduction] = useState(false);
    const [deductedAmount, setDeductedAmount] = useState<number>(0);
    const prevBalanceRef = useRef<number | null>(null);

    // 加载积分余额
    const refreshCredits = useCallback(async () => {
        const result = await getMyCredits();
        const newBalance = result.balance;
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

                complete(text, { body: { option: "continue" } });
            }
        }
    }, [initialOption, editor, completion, isLoading, complete, onOpenChange]);

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
                    complete(text, { body: { option: "continue" } });
                }
            }
        };

        window.addEventListener("trigger-ai-continue", handleContinue);
        return () => {
            window.removeEventListener("trigger-ai-continue", handleContinue);
        };
    }, [editor, completion, isLoading, complete]);

    const hasCompletion = completion.length > 0;

    if (!editor) return null;

    const handleSubmit = () => {
        const selectedText = getSelectedText(editor);

        if (completion) {
            complete(completion, {
                body: { option: "zap", command: inputValue },
            }).then(() => setInputValue(""));
        } else if (selectedText || inputValue) {
            complete(selectedText || inputValue, {
                body: { option: "zap", command: inputValue },
            }).then(() => setInputValue(""));
        } else {
            toast.error("请先选择文本或输入内容");
        }
    };

    const insufficientCredits = creditBalance !== null && creditBalance < MIN_CREDIT_COST;

    return (
        <Command
            className={cn(
                "overflow-hidden transition-all duration-300 border border-zinc-200/80 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl",
                isLoading || hasCompletion ? "w-[380px] sm:w-[440px]" : "w-[350px]"
            )}
        >
            {/* ====== 积分与模型状态栏 ====== */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 dark:bg-emerald-400/80" />
                    <span className="font-sans font-medium text-zinc-700 dark:text-zinc-300">DeepSeek 智述</span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-400">起消 {MIN_CREDIT_COST} 积分</span>
                </div>
                <div className="flex items-center gap-1.5 relative">
                    <Coins className="h-3.5 w-3.5 text-amber-500/90" />
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={creditBalance}
                            initial={{ y: -8, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 8, opacity: 0, scale: 0.8 }}
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
                                initial={{ opacity: 1, y: 0, x: 4 }}
                                animate={{ opacity: 0, y: -20 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute -top-1 right-0 text-[10px] font-bold text-red-500 pointer-events-none whitespace-nowrap font-mono"
                            >
                                -{deductedAmount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ====== 核心生成与推演动效视图 ====== */}
            {(isLoading || hasCompletion) && (
                <AcademicAiStreamCapsule
                    isLoading={isLoading}
                    completion={completion}
                    onStop={stop}
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
                            <AISelectorCommands onSelect={(value, option, command) => complete(value, { body: { option, command } })} />
                        )}
                    </CommandList>
                </>
            )}
        </Command>
    );
}
