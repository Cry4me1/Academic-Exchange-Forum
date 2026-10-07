"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, BookCheck, Clock, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostPublishedSyncModalProps {
    open: boolean;
    onClose: () => void;
    postId: string;
    postTitle: string;
    publishedBy?: string;
    isAuthor?: boolean;
}

export function PostPublishedSyncModal({
    open,
    onClose,
    postId,
    postTitle,
    publishedBy,
    isAuthor,
}: PostPublishedSyncModalProps) {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);
    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {
        if (!open) {
            setCountdown(5);
            setIsCancelled(false);
            return;
        }

        if (isCancelled) return;

        if (countdown <= 0) {
            router.push(`/posts/${postId}`);
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [open, countdown, isCancelled, postId, router]);

    const handleJumpNow = () => {
        router.push(`/posts/${postId}`);
    };

    const handleCancelAutoJump = () => {
        setIsCancelled(true);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* 半透明高斯磨砂遮罩背景 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancelAutoJump}
                        className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-md"
                    />

                    {/* Apple Liquid Glass 弹窗主体 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 320 }}
                        className={cn(
                            "relative w-full max-w-lg overflow-hidden rounded-3xl border-0 p-6 md:p-8 z-10",
                            "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl",
                            "shadow-[0_20px_60px_-12px_rgba(0,0,0,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.9)]",
                            "dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.15)]"
                        )}
                    >
                        {/* 顶层菲涅尔环境反光微缝 */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/20 to-transparent" />

                        {/* 关闭/取消自动跳转按钮 */}
                        <button
                            type="button"
                            onClick={handleCancelAutoJump}
                            className="absolute top-5 right-5 h-8 w-8 rounded-full border-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground bg-zinc-100/70 dark:bg-zinc-800/70 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                            title="留在研讨室"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* 动效学术成果徽标 */}
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 1] }}
                                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                    className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(0,0,0,0.06)]"
                                >
                                    <BookCheck className="h-10 w-10 text-foreground" />
                                </motion.div>
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-md">
                                    ✓
                                </span>
                            </div>

                            {/* 标题与发布信息 */}
                            <div className="space-y-1.5 max-w-sm">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>学术研讨成果正式发布</span>
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-foreground pt-1">
                                    {isAuthor ? "你已成功联合发布学术长帖" : "在席同侪已联合发布研讨成果"}
                                </h3>
                                <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                                    {publishedBy ? (
                                        <span>
                                            由学者 <span className="font-semibold text-foreground">{publishedBy}</span> 牵头，与本室在席学者完成联合署名
                                        </span>
                                    ) : (
                                        "本次研讨的推演笔记与洞见已正式同步至学术社区！"
                                    )}
                                </p>
                            </div>

                            {/* 成果卡片微光容器 */}
                            <div className="w-full p-4 rounded-2xl border-0 bg-zinc-100/60 dark:bg-zinc-800/50 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] text-left">
                                <div className="text-[11px] font-medium text-muted-foreground/80 flex items-center gap-1 mb-1">
                                    <Users className="h-3 w-3" />
                                    <span>学术长帖成果：</span>
                                </div>
                                <h4 className="font-semibold text-sm text-foreground tracking-tight line-clamp-2">
                                    《{postTitle || "学术研讨成果"}》
                                </h4>
                            </div>

                            {/* 倒计时微光进度条与提示 */}
                            {!isCancelled && (
                                <div className="w-full space-y-2 pt-1">
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Clock className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                                        <span>
                                            协同视线同步中，<span className="font-bold text-foreground">{countdown}</span> 秒后全员自动前往成果页面...
                                        </span>
                                    </div>
                                    <div className="w-full h-1 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 overflow-hidden">
                                        <motion.div
                                            initial={{ width: "100%" }}
                                            animate={{ width: "0%" }}
                                            transition={{ duration: 5, ease: "linear" }}
                                            className="h-full bg-zinc-950 dark:bg-white rounded-full"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 渐变消融内部光缝 */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-1" />

                            {/* 底部交互胶囊按钮 */}
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 w-full pt-1">
                                <button
                                    type="button"
                                    onClick={handleCancelAutoJump}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 border-0 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                >
                                    留在研讨室
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleJumpNow}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-medium border-0 transition-all bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer"
                                >
                                    <span>立即前往查看成果</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
