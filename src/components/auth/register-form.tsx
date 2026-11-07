"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DIVIDER_H,
    OBSIDIAN_CTA,
    SERIF_STACK,
} from "@/components/landing/liquid-glass";
import { cn } from "@/lib/utils";
import {
    registerSchema,
    type RegisterFormData,
    usernameRegisterSchema,
    type UsernameRegisterFormData,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Check,
    CheckCircle2,
    GraduationCap,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    RefreshCw,
    Sparkles,
    Ticket,
    User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { TurnstileWidget, type TurnstileWidgetRef } from "./turnstile-widget";

interface InviteCheckState {
    status: "idle" | "checking" | "valid" | "invalid";
    message?: string;
    inviterName?: string;
    rewardCredits?: number;
}

const REGISTER_TABS = [
    { value: "email", label: "邮箱注册" },
    { value: "username", label: "用户名注册" },
] as const;

export function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("email");
    const [renderedAt, setRenderedAt] = useState<number>(0);
    const [registrationMode, setRegistrationMode] =
        useState<string>("INVITE_ONLY");
    const [inviteCheck, setInviteCheck] = useState<InviteCheckState>({
        status: "idle",
    });
    const [submittedEmail, setSubmittedEmail] = useState<string>("");
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [isResending, setIsResending] = useState<boolean>(false);

    const emailTurnstileRef = useRef<TurnstileWidgetRef>(null);
    const usernameTurnstileRef = useRef<TurnstileWidgetRef>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const initialInviteCode =
        searchParams.get("invite") || searchParams.get("ref") || "";

    // 邮箱注册表单
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        control: controlEmail,
        setValue: setValueEmail,
        watch: watchEmail,
        formState: { errors: emailErrors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            turnstileToken: "",
            inviteCode: initialInviteCode,
            honeypot: "",
            renderedAt: 0,
        },
    });

    // 用户名注册表单
    const {
        register: registerUsername,
        handleSubmit: handleSubmitUsername,
        control: controlUsername,
        setValue: setValueUsername,
        watch: watchUsername,
        formState: { errors: usernameErrors },
    } = useForm<UsernameRegisterFormData>({
        resolver: zodResolver(usernameRegisterSchema),
        defaultValues: {
            username: "",
            password: "",
            confirmPassword: "",
            turnstileToken: "",
            inviteCode: initialInviteCode,
            honeypot: "",
            renderedAt: 0,
        },
    });

    // 清理重发倒计时定时器
    useEffect(() => {
        return () => {
            if (resendTimerRef.current) {
                clearInterval(resendTimerRef.current);
            }
        };
    }, []);

    // 实时监测邀请码输入并防抖校验
    const checkInviteCode = useCallback(async (code: string) => {
        const clean = code.trim().toUpperCase();
        if (!clean) {
            setInviteCheck({ status: "idle" });
            return;
        }

        setInviteCheck({ status: "checking" });

        try {
            const res = await fetch(
                `/api/auth/invite/validate?code=${encodeURIComponent(clean)}`
            );
            const data = await res.json();

            if (data.valid) {
                setInviteCheck({
                    status: "valid",
                    message: data.note || "学术邀请码有效",
                    inviterName: data.inviter_name,
                    rewardCredits: data.reward_credits,
                });
            } else {
                setInviteCheck({
                    status: "invalid",
                    message: data.error || "邀请码无效或已失效",
                });
            }
        } catch {
            setInviteCheck({
                status: "invalid",
                message: "邀请码校验网络异常",
            });
        }
    }, []);

    // 监听邀请码变化
    const emailInviteCodeWatch = watchEmail("inviteCode");
    const usernameInviteCodeWatch = watchUsername("inviteCode");
    const currentInviteInput =
        activeTab === "email" ? emailInviteCodeWatch : usernameInviteCodeWatch;

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (currentInviteInput) {
            debounceTimerRef.current = setTimeout(() => {
                checkInviteCode(currentInviteInput);
            }, 450);
        } else {
            setInviteCheck({ status: "idle" });
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [currentInviteInput, checkInviteCode, activeTab]);

    // 初始化：获取系统当前注册策略，若带入初始 invite 则校验
    useEffect(() => {
        setRenderedAt(Date.now());

        async function fetchMode() {
            try {
                const res = await fetch(
                    "/api/auth/invite/validate?getMode=true"
                );
                const data = await res.json();
                if (data.registration_mode) {
                    setRegistrationMode(data.registration_mode);
                }
            } catch (e) {
                console.error("Fetch reg mode error:", e);
            }
        }

        fetchMode();

        if (initialInviteCode) {
            checkInviteCode(initialInviteCode);
        }
    }, [initialInviteCode, checkInviteCode]);

    // 切换 Tab 时重置状态并同步已填写的邀请码
    const onTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        const currentCode =
            (activeTab === "email"
                ? emailInviteCodeWatch
                : usernameInviteCodeWatch) || initialInviteCode;
        if (value === "email") {
            setValueEmail("inviteCode", currentCode);
        } else {
            setValueUsername("inviteCode", currentCode);
        }
        setRenderedAt(Date.now());
    };

    // 邮箱注册提交
    const onEmailSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/email/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                    turnstileToken: data.turnstileToken,
                    inviteCode: data.inviteCode?.trim(),
                    honeypot: data.honeypot,
                    renderedAt: renderedAt || Date.now(),
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "注册失败，请检查填写内容");
                emailTurnstileRef.current?.reset();
                setValueEmail("turnstileToken", "");
                return;
            }

            setSubmittedEmail(data.email);
            setIsSuccess(true);
            toast.success("注册成功！请检查邮箱完成验证");
        } catch {
            setError("网络异常，请稍后重试");
            emailTurnstileRef.current?.reset();
            setValueEmail("turnstileToken", "");
        } finally {
            setIsLoading(false);
        }
    };

    // 重新发送注册邮箱验证邮件
    const handleResendVerificationEmail = async () => {
        if (!submittedEmail || resendCooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            const res = await fetch("/api/auth/email/resend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: submittedEmail }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "发送失败，请稍后重试");
            }

            toast.success(
                "验证邮件已重新发送！请检查您的收件箱或垃圾邮件箱。"
            );
            setResendCooldown(60);
            if (resendTimerRef.current) clearInterval(resendTimerRef.current);
            resendTimerRef.current = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        if (resendTimerRef.current)
                            clearInterval(resendTimerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "请求失败，请稍后重试";
            toast.error(msg);
        } finally {
            setIsResending(false);
        }
    };

    // 统一捕获表单校验错误，防止用户遇到无反馈的伪卡顿
    const onFormValidationError = (
        formErrors: FieldErrors<RegisterFormData | UsernameRegisterFormData>
    ) => {
        const firstKey = Object.keys(
            formErrors
        )[0] as keyof typeof formErrors;
        const firstErr = firstKey ? formErrors[firstKey] : undefined;
        if (firstErr && typeof firstErr.message === "string") {
            toast.error(firstErr.message);
        }
    };

    // 用户名注册提交
    const onUsernameSubmit = async (data: UsernameRegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/username/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: data.username,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                    turnstileToken: data.turnstileToken,
                    inviteCode: data.inviteCode?.trim(),
                    honeypot: data.honeypot,
                    renderedAt: renderedAt || Date.now(),
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "注册时出错，请稍后重试");
                usernameTurnstileRef.current?.reset();
                setValueUsername("turnstileToken", "");
                return;
            }

            toast.success("注册成功！");

            if (result.actionLink) {
                window.location.href = result.actionLink;
            } else {
                router.push("/login?tab=username&registered=true");
            }
        } catch {
            setError("网络异常，请稍后重试");
            usernameTurnstileRef.current?.reset();
            setValueUsername("turnstileToken", "");
        } finally {
            setIsLoading(false);
        }
    };

    const primaryCtaClass = cn(
        OBSIDIAN_CTA,
        "group relative w-full h-11 overflow-hidden rounded-full font-medium cursor-pointer",
        "transition-[transform,background-color,box-shadow,opacity] duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97]"
    );

    const inviteInputGlowClass =
        inviteCheck.status === "valid"
            ? "shadow-[0_0_0_1.5px_rgba(16,185,129,0.38),0_4px_20px_-4px_rgba(16,185,129,0.16),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_1.5px_rgba(16,185,129,0.42),0_4px_20px_-4px_rgba(16,185,129,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.16)]"
            : inviteCheck.status === "invalid"
            ? "shadow-[0_0_0_1.5px_rgba(244,63,94,0.38),0_4px_20px_-4px_rgba(244,63,94,0.16),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_1.5px_rgba(244,63,94,0.42),0_4px_20px_-4px_rgba(244,63,94,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.16)]"
            : "";

    // 邮箱注册成功提示
    if (isSuccess && activeTab === "email") {
        return (
            <div className="text-center space-y-5 py-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_0_20px_rgba(16,185,129,0.16)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                    <h3
                        style={{ fontFamily: SERIF_STACK }}
                        className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                        验证邮件已发送
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                        系统已向您的邮箱发送激活邮件，请点击邮件中的链接完成学者账号激活。
                    </p>
                </div>
                {submittedEmail && (
                    <div className="w-full flex items-center justify-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-0 bg-[rgba(245,158,11,0.12)] text-amber-800 dark:text-amber-300 font-mono text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                            <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{submittedEmail}</span>
                        </div>
                    </div>
                )}
                <div className="space-y-2.5 pt-2">
                    <Button
                        type="button"
                        onClick={handleResendVerificationEmail}
                        disabled={resendCooldown > 0 || isResending}
                        className={primaryCtaClass}
                    >
                        <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/65 dark:via-white/90 to-transparent"
                        />
                        {isResending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>正在重新发送...</span>
                            </>
                        ) : resendCooldown > 0 ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span className="tabular-nums">
                                    {resendCooldown} 秒后可重新发送
                                </span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>重新发送验证邮件</span>
                            </>
                        )}
                    </Button>
                    <Link href="/login" className="block w-full">
                        <Button
                            variant="ghost"
                            className="w-full h-10 rounded-full border-0 text-xs font-medium"
                        >
                            前往登录
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // 关闭注册提示
    if (registrationMode === "CLOSED") {
        return (
            <div className="text-center space-y-5 py-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] text-amber-600 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_0_20px_rgba(245,158,11,0.18)]">
                    <GraduationCap className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                    <h2
                        style={{ fontFamily: SERIF_STACK }}
                        className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                        社区封闭研讨中
                    </h2>
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                        Scholarly 学术论坛当前正处于内测封闭研讨阶段，新用户注册通道暂时关闭。请关注后续开放公告。
                    </p>
                </div>
                <div className="pt-1">
                    <Link href="/login" className="block">
                        <Button
                            variant="outline"
                            className="w-full h-11 rounded-full border-0 font-medium"
                        >
                            返回已有账号登录
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isInviteMandatory =
        registrationMode === "INVITE_ONLY" ||
        (registrationMode === "INVITE_OR_EDU" && activeTab === "username");

    const renderInviteFeedback = () => (
        <>
            {inviteCheck.status === "valid" && (
                <div className="rounded-2xl border-0 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.10] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                        <p className="font-medium">
                            引荐学者：{inviteCheck.inviterName || "官方特邀管理员"}
                        </p>
                        <p className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px] mt-0.5">
                            学术受邀码有效，欢迎入驻 Scholarly
                        </p>
                    </div>
                </div>
            )}
            {inviteCheck.status === "invalid" && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pl-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inviteCheck.message}</span>
                </p>
            )}
        </>
    );

    return (
        <div className="space-y-5">
            {/* 标题与无边框琥珀微光邀请徽章 */}
            <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border-0 text-xs font-medium bg-[rgba(245,158,11,0.12)] text-amber-800 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_0_16px_rgba(245,158,11,0.14)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_0_16px_rgba(245,158,11,0.18)]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                    <span>
                        {registrationMode === "INVITE_ONLY"
                            ? "受邀同行研讨 · 邀请制入驻"
                            : registrationMode === "INVITE_OR_EDU"
                            ? "高校/科研机构直通 · 或凭邀请码入驻"
                            : "Scholarly 学术学者社区"}
                    </span>
                </div>
                <h1
                    style={{ fontFamily: SERIF_STACK }}
                    className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    加入学术社区
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    与同行探讨前沿命题，参与学术思辨与协作推演
                </p>
            </div>

            <Tabs
                defaultValue="email"
                value={activeTab}
                onValueChange={onTabChange}
                className="w-full"
            >
                {/* 双通道水滴胶囊分段切换器（原生集成 Tabs layoutId 流体物理滑块 + 琥珀微光晕） */}
                <TabsList
                    indicatorClassName="shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,1),0_0_14px_rgba(245,158,11,0.12)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.16),0_0_14px_rgba(245,158,11,0.16)]"
                    className="grid w-full grid-cols-2 h-11 p-1 mb-4 bg-zinc-200/50 dark:bg-white/[0.06]"
                >
                    {REGISTER_TABS.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="text-xs sm:text-sm font-medium"
                        >
                            <span>{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Tab 1: 邮箱注册 */}
                <TabsContent value="email" className="space-y-3.5 mt-0">
                    <form
                        onSubmit={handleSubmitEmail(
                            onEmailSubmit,
                            onFormValidationError
                        )}
                        className="space-y-3.5"
                    >
                        {/* 蜜罐陷阱 (Honeypot) */}
                        <div
                            className="hidden pointer-events-none opacity-0 select-none"
                            aria-hidden="true"
                        >
                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                {...registerEmail("honeypot")}
                            />
                        </div>

                        {/* 学术邀请码输入 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <Label
                                    htmlFor="email-reg-invite"
                                    className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    <Ticket className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                                    <span>学术邀请码</span>
                                    {isInviteMandatory ? (
                                        <span className="text-rose-500 text-xs font-medium">
                                            * 必填
                                        </span>
                                    ) : (
                                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">
                                            (高校邮箱可免填)
                                        </span>
                                    )}
                                </Label>
                                <Link
                                    href="/invite-820"
                                    target="_blank"
                                    className="inline-flex items-center gap-0.5 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.12)] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
                                >
                                    <span>获取 820 公开通行码</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="group/field relative">
                                <Ticket className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="email-reg-invite"
                                    type="text"
                                    placeholder={
                                        registrationMode === "INVITE_OR_EDU"
                                            ? "如 SCHOLAR-2026 (.edu 可免填)"
                                            : "请输入 8-16 位学术邀请码"
                                    }
                                    className={cn(
                                        "uppercase font-mono tracking-wider h-11 pl-10 pr-10",
                                        inviteInputGlowClass
                                    )}
                                    {...registerEmail("inviteCode")}
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                                    {inviteCheck.status === "checking" && (
                                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                    )}
                                    {inviteCheck.status === "valid" && (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    )}
                                    {inviteCheck.status === "invalid" && (
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                </div>
                            </div>
                            {renderInviteFeedback()}
                        </div>

                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email-reg-username"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                学者用户名
                            </Label>
                            <div className="group/field relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="email-reg-username"
                                    type="text"
                                    placeholder="设置英文或中文学者标识"
                                    aria-invalid={!!emailErrors.username}
                                    className="pl-10 h-11"
                                    {...registerEmail("username")}
                                />
                            </div>
                            {emailErrors.username && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {emailErrors.username.message}
                                </p>
                            )}
                        </div>

                        {/* 邮箱输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email-reg-email"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                个人邮箱
                            </Label>
                            <div className="group/field relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="email-reg-email"
                                    type="email"
                                    placeholder="your.name@university.edu"
                                    aria-invalid={!!emailErrors.email}
                                    className="pl-10 h-11"
                                    {...registerEmail("email")}
                                />
                            </div>
                            {emailErrors.email && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {emailErrors.email.message}
                                </p>
                            )}
                        </div>

                        {/* 密码输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email-reg-password"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                登录密码
                            </Label>
                            <div className="group/field relative">
                                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="email-reg-password"
                                    type="password"
                                    placeholder="设置登录密码（至少 6 位）"
                                    aria-invalid={!!emailErrors.password}
                                    className="pl-10 h-11"
                                    {...registerEmail("password")}
                                />
                            </div>
                            {emailErrors.password && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {emailErrors.password.message}
                                </p>
                            )}
                        </div>

                        {/* 确认密码输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="email-reg-confirmPassword"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                确认密码
                            </Label>
                            <div className="group/field relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="email-reg-confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    aria-invalid={
                                        !!emailErrors.confirmPassword
                                    }
                                    className="pl-10 h-11"
                                    {...registerEmail("confirmPassword")}
                                />
                            </div>
                            {emailErrors.confirmPassword && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {emailErrors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Cloudflare Turnstile 人机安全验证 */}
                        <Controller
                            name="turnstileToken"
                            control={controlEmail}
                            render={({ field }) => (
                                <TurnstileWidget
                                    ref={emailTurnstileRef}
                                    id="email-turnstile-widget"
                                    label="人机安全验证"
                                    action="register_email"
                                    onTokenChange={(token) =>
                                        field.onChange(token)
                                    }
                                    error={emailErrors.turnstileToken?.message}
                                    disabled={isLoading}
                                />
                            )}
                        />

                        {/* 错误提示 */}
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-2.5 rounded-2xl border-0 bg-rose-500/[0.08] dark:bg-rose-500/[0.12] px-4 py-3 text-xs font-medium text-rose-600 dark:text-rose-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.55)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                <span className="leading-relaxed">{error}</span>
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <div className="pt-1">
                            <Button
                                type="submit"
                                className={primaryCtaClass}
                                disabled={isLoading}
                            >
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/65 dark:via-white/90 to-transparent"
                                />
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>学术身份核验中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>完成受邀入驻</span>
                                        <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                {/* Tab 2: 用户名注册 */}
                <TabsContent value="username" className="space-y-3.5 mt-0">
                    <form
                        onSubmit={handleSubmitUsername(
                            onUsernameSubmit,
                            onFormValidationError
                        )}
                        className="space-y-3.5"
                    >
                        {/* 蜜罐陷阱 (Honeypot) */}
                        <div
                            className="hidden pointer-events-none opacity-0 select-none"
                            aria-hidden="true"
                        >
                            <input
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                {...registerUsername("honeypot")}
                            />
                        </div>

                        {/* 学术邀请码输入 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <Label
                                    htmlFor="uname-reg-invite"
                                    className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"
                                >
                                    <Ticket className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                                    <span>学术邀请码</span>
                                    <span className="text-rose-500 text-xs font-medium">
                                        * 必填
                                    </span>
                                </Label>
                                <Link
                                    href="/invite-820"
                                    target="_blank"
                                    className="inline-flex items-center gap-0.5 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.12)] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
                                >
                                    <span>获取 820 公开通行码</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="group/field relative">
                                <Ticket className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="uname-reg-invite"
                                    type="text"
                                    placeholder="请输入 8-16 位学术邀请码"
                                    className={cn(
                                        "uppercase font-mono tracking-wider h-11 pl-10 pr-10",
                                        inviteInputGlowClass
                                    )}
                                    {...registerUsername("inviteCode")}
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                                    {inviteCheck.status === "checking" && (
                                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                    )}
                                    {inviteCheck.status === "valid" && (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    )}
                                    {inviteCheck.status === "invalid" && (
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                    )}
                                </div>
                            </div>
                            {renderInviteFeedback()}
                        </div>

                        {/* 用户名输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="uname-reg-username"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                学者用户名
                            </Label>
                            <div className="group/field relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="uname-reg-username"
                                    type="text"
                                    placeholder="设置英文或中文学者标识"
                                    aria-invalid={!!usernameErrors.username}
                                    className="pl-10 h-11"
                                    {...registerUsername("username")}
                                />
                            </div>
                            {usernameErrors.username && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {usernameErrors.username.message}
                                </p>
                            )}
                        </div>

                        {/* 密码输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="uname-reg-password"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                设置密码
                            </Label>
                            <div className="group/field relative">
                                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="uname-reg-password"
                                    type="password"
                                    placeholder="设置登录密码（至少 6 位）"
                                    aria-invalid={!!usernameErrors.password}
                                    className="pl-10 h-11"
                                    {...registerUsername("password")}
                                />
                            </div>
                            {usernameErrors.password && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {usernameErrors.password.message}
                                </p>
                            )}
                        </div>

                        {/* 确认密码输入 */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="uname-reg-confirmPassword"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                确认密码
                            </Label>
                            <div className="group/field relative">
                                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="uname-reg-confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    aria-invalid={
                                        !!usernameErrors.confirmPassword
                                    }
                                    className="pl-10 h-11"
                                    {...registerUsername("confirmPassword")}
                                />
                            </div>
                            {usernameErrors.confirmPassword && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 pl-1">
                                    {usernameErrors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Cloudflare Turnstile 人机安全验证 */}
                        <Controller
                            name="turnstileToken"
                            control={controlUsername}
                            render={({ field }) => (
                                <TurnstileWidget
                                    ref={usernameTurnstileRef}
                                    id="username-turnstile-widget"
                                    label="人机安全验证"
                                    action="register_username"
                                    onTokenChange={(token) =>
                                        field.onChange(token)
                                    }
                                    error={
                                        usernameErrors.turnstileToken?.message
                                    }
                                    disabled={isLoading}
                                />
                            )}
                        />

                        {/* 错误提示 */}
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-2.5 rounded-2xl border-0 bg-rose-500/[0.08] dark:bg-rose-500/[0.12] px-4 py-3 text-xs font-medium text-rose-600 dark:text-rose-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.55)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                <span className="leading-relaxed">{error}</span>
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <div className="pt-1">
                            <Button
                                type="submit"
                                className={primaryCtaClass}
                                disabled={isLoading}
                            >
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/65 dark:via-white/90 to-transparent"
                                />
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>学术身份核验中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>受邀立即入驻</span>
                                        <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>

            {/* 服务条款 */}
            <p className="text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                受邀注册即表示您同意恪守本站{" "}
                <Link
                    href="/rules?tab=terms"
                    target="_blank"
                    className="text-amber-700 dark:text-amber-300 hover:underline font-medium"
                >
                    用户协议与隐私条款
                </Link>{" "}
                与{" "}
                <Link
                    href="/rules?tab=guidelines"
                    target="_blank"
                    className="text-amber-700 dark:text-amber-300 hover:underline font-medium"
                >
                    社区公约
                </Link>
            </p>

            {/* 渐变消融内部光缝 */}
            <div className={DIVIDER_H} />

            {/* 登录链接 */}
            <p className="text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                已拥有学者账号？{" "}
                <Link
                    href="/login"
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.10)] hover:bg-[rgba(245,158,11,0.18)] transition-colors"
                >
                    直接登录
                </Link>
            </p>
        </div>
    );
}
