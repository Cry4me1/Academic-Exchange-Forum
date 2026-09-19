"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    ShieldAlert,
    MailCheck,
    RefreshCw,
    Loader2,
    ArrowRight,
    Home,
    LogOut,
    CheckCircle2,
    Mail,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

interface PendingVerificationClientProps {
    email: string;
}

export function PendingVerificationClient({ email }: PendingVerificationClientProps) {
    const router = useRouter();
    const supabase = createClient();

    const [isResending, setIsResending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 清理倒计时定时器
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // 启动 60 秒重发冷却倒计时
    const startCooldown = (seconds = 60) => {
        setCooldown(seconds);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // 重新发送验证邮件
    const handleResendEmail = async () => {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            const res = await fetch("/api/auth/email/resend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "发送失败，请稍后重试");
            }

            if (data.alreadyVerified) {
                toast.success("您的邮箱已通过验证，正在进入平台...");
                router.push("/dashboard");
                router.refresh();
                return;
            }

            toast.success("验证邮件已重新发送！请检查您的收件箱或垃圾邮件箱。");
            startCooldown(60);
        } catch (error: any) {
            toast.error(error.message || "请求失败，请稍后重试");
        } finally {
            setIsResending(false);
        }
    };

    // 检查邮箱验证状态
    const handleCheckVerification = async () => {
        if (isChecking) return;

        setIsChecking(true);
        try {
            // 重新刷新获取当前用户信息
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                throw error;
            }

            if (user?.email_confirmed_at) {
                toast.success("邮箱验证成功！正在进入 Scholarly 学术社区...");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.info("尚未检测到邮箱确认状态。若已点击邮件链接，请稍等数秒后重试。");
            }
        } catch (error: any) {
            toast.error(error.message || "状态检查失败，请稍后重试");
        } finally {
            setIsChecking(false);
        }
    };

    // 退出当前登录
    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            toast.success("已成功退出登录");
            router.push("/login");
            router.refresh();
        } catch (err: any) {
            toast.error("退出登录失败: " + err.message);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950/80">
            {/* 背景光学漫反射光晕 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[100px]" />
            </div>

            {/* 主卡片：Apple Liquid Glass 无边框设计规范 */}
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 max-w-md w-full rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/75 backdrop-blur-2xl shadow-[0_12px_40px_-6px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-8 flex flex-col items-center text-center space-y-6"
            >
                {/* 顶部微光图标徽章 */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-amber-500/15 dark:bg-amber-400/10 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                        <MailCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
                        <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* 标题与描述 */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        请验证您的邮箱
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        Scholarly 是高规格学术学者社区，需要先激活邮箱后方可开启研讨与使用全部功能。
                    </p>
                </div>

                {/* 当前目标邮箱胶囊 */}
                <div className="w-full flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-0 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-mono text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)] max-w-full truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">{email || "您的注册邮箱"}</span>
                    </div>
                </div>

                {/* 提示信息框：圆角与液态微光 */}
                <div className="w-full rounded-2xl border-0 bg-zinc-100/70 dark:bg-zinc-800/40 p-4 text-left space-y-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Info className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>未收到验证邮件？</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                        系统已发送激活邮件。请检查您的垃圾邮件箱或订阅拦截。如仍未收到，可通过下方按钮重新发送。
                    </p>
                </div>

                {/* 核心行动按钮区 */}
                <div className="w-full space-y-3 pt-1">
                    {/* 行动点 1：我已完成验证，进入平台（黑曜石液态玻璃 CTA） */}
                    <Button
                        onClick={handleCheckVerification}
                        disabled={isChecking}
                        className="w-full h-11 rounded-full text-sm font-medium border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-current" />
                                <span>核验验证状态中...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>我已完成验证，进入平台</span>
                                <ArrowRight className="w-4 h-4 opacity-70" />
                            </>
                        )}
                    </Button>

                    {/* 行动点 2：重新发送验证邮件（流光渐变胶囊） */}
                    <Button
                        onClick={handleResendEmail}
                        disabled={isResending || cooldown > 0}
                        className="w-full h-11 rounded-full text-sm font-medium border-0 text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-amber-500 dark:to-orange-500 dark:text-slate-950 shadow-[0_4px_16px_-2px_rgba(245,158,11,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isResending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>发送验证邮件中...</span>
                            </>
                        ) : cooldown > 0 ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>{cooldown} 秒后可重新发送</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                <span>重新发送验证邮件</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* 渐变消融微光分割缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 底部次级操作区 */}
                <div className="w-full flex items-center justify-between gap-3 pt-1">
                    <Button
                        variant="ghost"
                        className="flex-1 h-9 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 border-0 transition-colors"
                        asChild
                    >
                        <Link href="/">
                            <Home className="w-3.5 h-3.5 mr-1.5" />
                            <span>返回首页</span>
                        </Link>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="flex-1 h-9 rounded-full text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-0 transition-colors"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <LogOut className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        <span>退出登录</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
