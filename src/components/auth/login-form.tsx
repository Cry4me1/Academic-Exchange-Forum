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
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
    loginSchema,
    type LoginFormData,
    usernameLoginSchema,
    type UsernameLoginFormData,
} from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    ArrowRight,
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    HelpCircle,
    KeyRound,
    Loader2,
    Mail,
    User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { RegistrationMode } from "@/lib/invite/service";

const LOGIN_TABS = [
    { value: "magic-link", label: "邮箱链接" },
    { value: "password", label: "账号密码" },
    { value: "username", label: "用户名" },
    { value: "luogu", label: "洛谷登录" },
] as const;

export function LoginForm({
    initialRegistrationMode = "INVITE_ONLY",
}: {
    initialRegistrationMode?: RegistrationMode;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("magic-link");

    // 洛谷登录状态
    const [luoguId, setLuoguId] = useState("");
    const [luoguVerifyCode, setLuoguVerifyCode] = useState("");
    const [isLuoguLoading, setIsLuoguLoading] = useState(false);
    const [luoguError, setLuoguError] = useState<string | null>(null);
    const [showLuoguManual, setShowLuoguManual] = useState(false);
    const [luoguHtml, setLuoguHtml] = useState("");
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (
            tabParam &&
            ["magic-link", "password", "username", "luogu"].includes(tabParam)
        ) {
            setActiveTab(tabParam);
        }

        const registered = searchParams.get("registered");
        if (registered === "true") {
            setActiveTab("username");
            toast.success("账号注册成功，请使用刚设置的用户名和密码登录");
        }

        const errParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        if (errParam) {
            setError(errorDescription || "登录验证失败，请重试");
        }

        const supabase = createClient();

        // 获取重定向目标路径，优先使用 next 参数，否则默认为 /dashboard
        const next = searchParams.get("next") || "/dashboard";

        // 客户端会话自动感知：监听 Auth 状态变化，实时消费 Hash 并写入 Cookie。
        // 使用 window.location.replace 触发整页跳转，确保服务端能携带并识别最新的 Cookie。
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
            console.log(
                `[LoginForm] Auth state changed: ${event}`,
                session ? "Session exists" : "No session"
            );
            if (session) {
                console.log(
                    "[LoginForm] Active session detected via onAuthStateChange, redirecting to:",
                    next
                );
                window.location.replace(next);
            }
        });

        // 兜底立即检查已有会话
        const checkActiveSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (session) {
                console.log(
                    "[LoginForm] Active session detected via getSession, redirecting to:",
                    next
                );
                window.location.replace(next);
            }
        };
        checkActiveSession();

        return () => {
            subscription.unsubscribe();
        };
    }, [searchParams]);

    // 邮箱登录表单（magic-link 和 password 共用）
    const {
        register: registerEmail,
        handleSubmit: handleSubmitEmail,
        formState: { errors: emailErrors },
        reset: resetEmail,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // 用户名登录表单
    const {
        register: registerUsername,
        handleSubmit: handleSubmitUsername,
        formState: { errors: usernameErrors },
        reset: resetUsername,
    } = useForm<UsernameLoginFormData>({
        resolver: zodResolver(usernameLoginSchema),
    });

    // 切换 Tab 时重置表单状态
    const onTabChange = (value: string) => {
        setActiveTab(value);
        setError(null);
        setLuoguError(null);
        resetEmail();
        resetUsername();
        setLuoguId("");
        setLuoguVerifyCode("");
        setShowLuoguManual(false);
        setLuoguHtml("");
    };

    // 洛谷登录第一步：获取登录验证码
    const handleLuoguInit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!luoguId.trim()) {
            setLuoguError("请输入洛谷 UID");
            return;
        }
        if (isNaN(Number(luoguId.trim()))) {
            setLuoguError("洛谷 UID 必须为纯数字");
            return;
        }

        setIsLuoguLoading(true);
        setLuoguError(null);

        try {
            const res = await fetch("/api/auth/luogu/login/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ luoguId: luoguId.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "获取验证码失败");

            setLuoguVerifyCode(data.verificationCode);
            toast.success("登录验证码生成成功！");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "请求出错，请重试";
            setLuoguError(msg);
        } finally {
            setIsLuoguLoading(false);
        }
    };

    // 洛谷登录第二步：验证并登录
    const handleLuoguVerify = async () => {
        setIsLuoguLoading(true);
        setLuoguError(null);

        try {
            const res = await fetch("/api/auth/luogu/login/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    luoguId: luoguId.trim(),
                    luoguHtml:
                        showLuoguManual && luoguHtml.trim()
                            ? luoguHtml.trim()
                            : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "登录验证失败");

            toast.success("验证成功，正在登录...");
            // 重定向至 Supabase 生成的 Magic Link 完成登录会话初始化
            window.location.href = data.actionLink;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "登录失败，请重试";
            setLuoguError(msg);
            setIsLuoguLoading(false);
            if (!showLuoguManual) {
                setShowLuoguManual(true);
            }
        }
    };

    // 邮箱相关登录（magic-link / password）
    const onEmailSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);
        const supabase = createClient();

        try {
            if (activeTab === "magic-link") {
                const siteUrl =
                    process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                const redirectTo = `${siteUrl}/auth/callback?next=/dashboard`;

                const { error: authError } = await supabase.auth.signInWithOtp({
                    email: data.email,
                    options: {
                        emailRedirectTo: redirectTo,
                    },
                });

                if (authError) {
                    throw authError;
                }
                setIsSuccess(true);
            } else {
                const next = searchParams.get("next") || "/dashboard";

                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        identifier: data.email,
                        password: data.password,
                    }),
                });

                const result = await res.json();

                if (!res.ok || !result.success) {
                    setError(result.error || "邮箱/用户名或密码错误");
                    if (result.needsVerification) {
                        toast.error(result.error, {
                            action: {
                                label: "去验证",
                                onClick: () =>
                                    router.push("/pending-verification"),
                            },
                        });
                    }
                    return;
                }

                // 登录成功整页跳转（保证服务端识别最新 Cookie）
                window.location.replace(next);
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : "登录请求出错，请稍后重试";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // 用户名登录
    const onUsernameSubmit = async (data: UsernameLoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const next = searchParams.get("next") || "/dashboard";

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: data.username,
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                setError(result.error || "用户名或密码错误");
                return;
            }

            // 登录成功整页跳转
            window.location.replace(next);
        } catch {
            setError("登录请求出错，请稍后重试");
        } finally {
            setIsLoading(false);
        }
    };

    const primaryCtaClass = cn(
        OBSIDIAN_CTA,
        "group relative w-full h-11 mt-2 overflow-hidden rounded-full font-medium cursor-pointer",
        "transition-[transform,background-color,box-shadow,opacity] duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97]"
    );

    const errorBanner = (message: string) => (
        <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border-0 bg-rose-500/[0.08] dark:bg-rose-500/[0.12] px-4 py-3 text-xs font-medium text-rose-600 dark:text-rose-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.55)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
        >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-relaxed">{message}</span>
        </div>
    );

    if (isSuccess && activeTab === "magic-link") {
        return (
            <div className="text-center space-y-5 py-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_0_20px_rgba(16,185,129,0.16)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                    <h3
                        style={{ fontFamily: SERIF_STACK }}
                        className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                        登录链接已发送
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                        专属免密登录链接已投递至您的收件箱，点击邮件中的按钮即可直接进入工作台。
                    </p>
                </div>
                <div className="pt-1">
                    <Button
                        variant="outline"
                        onClick={() => setIsSuccess(false)}
                        className="h-10 px-6 rounded-full border-0 text-xs font-medium"
                    >
                        返回切换其他登录方式
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 标题区 */}
            <div className="space-y-1.5 text-center">
                <h1
                    style={{ fontFamily: SERIF_STACK }}
                    className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    欢迎回来
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    登录您的 Scholarly 学术账号
                </p>
            </div>

            <Tabs
                defaultValue="magic-link"
                value={activeTab}
                onValueChange={onTabChange}
                className="w-full"
            >
                {/* 四通道水滴胶囊分段切换器（原生集成 Tabs layoutId 流体物理滑块 + 琥珀微光晕） */}
                <TabsList
                    indicatorClassName="shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,1),0_0_14px_rgba(245,158,11,0.12)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.16),0_0_14px_rgba(245,158,11,0.16)]"
                    className="grid w-full grid-cols-4 h-11 p-1 mb-4 bg-zinc-200/50 dark:bg-white/[0.06]"
                >
                    {LOGIN_TABS.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="text-xs px-1 font-medium"
                        >
                            <span className="truncate">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Tab 1: 邮箱链接登录 */}
                <TabsContent value="magic-link" className="space-y-4 mt-0">
                    <form
                        onSubmit={handleSubmitEmail(onEmailSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label
                                htmlFor="magic-email"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                邮箱地址
                            </Label>
                            <div className="group/field relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="magic-email"
                                    type="email"
                                    placeholder="your@university.edu"
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

                        {error && errorBanner(error)}

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
                                    <span>发送中...</span>
                                </>
                            ) : (
                                <>
                                    <span>发送免密登录链接</span>
                                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                                </>
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 2: 账号密码登录 */}
                <TabsContent value="password" className="space-y-4 mt-0">
                    <form
                        onSubmit={handleSubmitEmail(onEmailSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label
                                htmlFor="pwd-email"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                邮箱地址
                            </Label>
                            <div className="group/field relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="pwd-email"
                                    type="email"
                                    placeholder="your@university.edu"
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="pwd-password"
                                    className="text-zinc-800 dark:text-zinc-200"
                                >
                                    密码
                                </Label>
                                <Link
                                    href="/forgot-password"
                                    className="rounded-full px-2 py-0.5 text-xs font-medium text-zinc-500 hover:text-amber-700 hover:bg-[rgba(245,158,11,0.10)] dark:text-zinc-400 dark:hover:text-amber-300 transition-colors"
                                >
                                    忘记密码？
                                </Link>
                            </div>
                            <div className="group/field relative">
                                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="pwd-password"
                                    type="password"
                                    placeholder="请输入密码"
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

                        {error && errorBanner(error)}

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
                                    <span>登录中...</span>
                                </>
                            ) : (
                                <>
                                    <span>登录</span>
                                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                                </>
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 3: 用户名登录 */}
                <TabsContent value="username" className="space-y-4 mt-0">
                    <form
                        onSubmit={handleSubmitUsername(onUsernameSubmit)}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label
                                htmlFor="uname-username"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                学者用户名
                            </Label>
                            <div className="group/field relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="uname-username"
                                    type="text"
                                    placeholder="请输入用户名"
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

                        <div className="space-y-2">
                            <Label
                                htmlFor="uname-password"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                密码
                            </Label>
                            <div className="group/field relative">
                                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                <Input
                                    id="uname-password"
                                    type="password"
                                    placeholder="请输入密码"
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

                        {error && errorBanner(error)}

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
                                    <span>登录中...</span>
                                </>
                            ) : (
                                <>
                                    <span>登录</span>
                                    <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                                </>
                            )}
                        </Button>
                    </form>
                </TabsContent>

                {/* Tab 4: 洛谷登录 */}
                <TabsContent value="luogu" className="space-y-4 mt-0">
                    <form onSubmit={handleLuoguInit} className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="luogu-login-uid"
                                className="text-zinc-800 dark:text-zinc-200"
                            >
                                洛谷 UID (纯数字)
                            </Label>
                            <div className="group/field relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/[0.14] text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                    谷
                                </span>
                                <Input
                                    id="luogu-login-uid"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="例如: 384039"
                                    className="pl-10 h-11 font-mono"
                                    value={luoguId}
                                    onChange={(e) => setLuoguId(e.target.value)}
                                    disabled={
                                        isLuoguLoading || !!luoguVerifyCode
                                    }
                                />
                            </div>
                        </div>

                        {luoguError && errorBanner(luoguError)}

                        {luoguVerifyCode ? (
                            <div className="rounded-2xl border-0 bg-amber-500/[0.08] dark:bg-amber-500/[0.07] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] p-4 space-y-3.5">
                                <h4 className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                    <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>洛谷身份核验步骤</span>
                                </h4>
                                <ol className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2.5 list-decimal list-inside">
                                    <li className="leading-relaxed">
                                        复制您的专属登录验证码：
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <code className="px-3 py-1.5 rounded-full border-0 bg-white/80 dark:bg-zinc-950/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-zinc-900 dark:text-zinc-100 font-mono text-[11px] block flex-1 overflow-x-auto">
                                                {luoguVerifyCode}
                                            </code>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        luoguVerifyCode
                                                    );
                                                    setCopiedCode(true);
                                                    toast.success(
                                                        "登录验证码已复制"
                                                    );
                                                    setTimeout(
                                                        () =>
                                                            setCopiedCode(
                                                                false
                                                            ),
                                                        1800
                                                    );
                                                }}
                                                className="h-7 rounded-full border-0 px-3 text-[11px] font-medium"
                                            >
                                                {copiedCode ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                        <span>已复制</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>复制</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </li>
                                    <li className="leading-relaxed">
                                        前往
                                        <a
                                            href="https://www.luogu.com.cn/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-amber-700 dark:text-amber-300 hover:underline font-medium mx-1"
                                        >
                                            洛谷个人中心
                                        </a>
                                        将验证码临时保存至“个人介绍”。
                                    </li>
                                    <li className="leading-relaxed">
                                        保存完成后，点击下方“验证并登录”。
                                    </li>
                                </ol>

                                <div className="flex gap-2 pt-1 flex-col sm:flex-row">
                                    <Button
                                        type="button"
                                        onClick={handleLuoguVerify}
                                        disabled={isLuoguLoading}
                                        className={cn(
                                            OBSIDIAN_CTA,
                                            "relative flex-1 h-10 overflow-hidden rounded-full text-xs font-medium"
                                        )}
                                    >
                                        <span
                                            aria-hidden
                                            className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 dark:via-white/90 to-transparent"
                                        />
                                        {isLuoguLoading ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span>验证登录中...</span>
                                            </>
                                        ) : (
                                            <span>验证并登录</span>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setLuoguVerifyCode("");
                                            setLuoguError(null);
                                            setShowLuoguManual(false);
                                            setLuoguHtml("");
                                        }}
                                        className="h-10 rounded-full border-0 px-4 text-xs font-medium"
                                        disabled={isLuoguLoading}
                                    >
                                        上一步
                                    </Button>
                                </div>

                                {!showLuoguManual && (
                                    <div className="text-center pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowLuoguManual(true)
                                            }
                                            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                        >
                                            网络受限？切换手动源码验证
                                        </button>
                                    </div>
                                )}

                                {showLuoguManual && (
                                    <div className="mt-2 p-3.5 rounded-2xl border-0 bg-white/60 dark:bg-zinc-950/45 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] space-y-2.5">
                                        <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium flex items-center justify-between gap-2">
                                            <span>
                                                手动网页源码核验模式
                                            </span>
                                            <button
                                                type="button"
                                                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setShowLuoguManual(false);
                                                    setLuoguHtml("");
                                                }}
                                            >
                                                收起
                                            </button>
                                        </div>
                                        <ol className="list-decimal list-inside text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5 leading-relaxed">
                                            <li>
                                                打开洛谷数据页：
                                                <a
                                                    href={`https://www.luogu.com.cn/user/${luoguId.trim()}?_contentOnly=1`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-amber-700 dark:text-amber-300 font-medium hover:underline inline-flex items-center ml-1"
                                                >
                                                    <span>打开数据页面</span>
                                                    <ExternalLink className="h-3 w-3 ml-0.5" />
                                                </a>
                                            </li>
                                            <li>
                                                右键查看网页源代码（或按{" "}
                                                <kbd className="rounded-full border-0 bg-zinc-200/70 dark:bg-white/[0.1] px-2 py-0.5 text-[10px] font-mono">
                                                    Ctrl+U
                                                </kbd>
                                                ）
                                            </li>
                                            <li>
                                                全选复制全部代码并粘贴至下方：
                                            </li>
                                        </ol>
                                        <textarea
                                            className={cn(
                                                "flex min-h-[88px] w-full rounded-2xl border-0 px-3.5 py-2.5 text-base md:text-xs font-mono outline-none transition-all duration-200",
                                                "bg-zinc-200/45 focus-visible:bg-white/90 text-zinc-900 placeholder:text-zinc-400",
                                                "dark:bg-white/[0.05] dark:focus-visible:bg-zinc-900/85 dark:text-zinc-100 dark:placeholder:text-zinc-500",
                                                "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]",
                                                "focus-visible:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:focus-visible:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.2)]",
                                                "disabled:cursor-not-allowed disabled:opacity-50"
                                            )}
                                            placeholder="在此粘贴复制的网页全部源代码..."
                                            value={luoguHtml}
                                            onChange={(e) =>
                                                setLuoguHtml(e.target.value)
                                            }
                                            disabled={isLuoguLoading}
                                            rows={4}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Button
                                type="submit"
                                className={primaryCtaClass}
                                disabled={isLuoguLoading}
                            >
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/65 dark:via-white/90 to-transparent"
                                />
                                {isLuoguLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>生成中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>获取登录验证码</span>
                                        <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </Button>
                        )}
                    </form>
                </TabsContent>
            </Tabs>

            {/* 渐变消融内部光缝 */}
            <div className={DIVIDER_H} />

            {/* 注册引导 */}
            <p className="text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                还没有学者账号？{" "}
                <Link
                    href="/register"
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-amber-700 dark:text-amber-300 bg-[rgba(245,158,11,0.10)] hover:bg-[rgba(245,158,11,0.18)] transition-colors"
                >
                    {initialRegistrationMode === "OPEN" ? "立即注册账号" : "立即受邀注册"}
                </Link>
            </p>
        </div>
    );
}
