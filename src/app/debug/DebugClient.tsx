"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Activity, User, Users, AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface DebugClientProps {
    isDev: boolean;
}

export default function DebugClient({ isDev }: DebugClientProps) {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [currentProfile, setCurrentProfile] = useState<any>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const addError = (msg: string) => setErrors((prev) => [...prev, msg]);

    // 生产环境下脱敏邮箱
    const maskEmail = (email?: string | null) => {
        if (!email) return "—";
        if (isDev) return email;
        const [local, domain] = email.split("@");
        if (!domain) return "***";
        return `${local.slice(0, 2)}***@${domain}`;
    };

    useEffect(() => {
        async function runDiagnostics() {
            setLoading(true);
            try {
                // 1. Check Session
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    addError(`Session 诊断异常: ${sessionError.message}`);
                } else {
                    setSession(sessionData.session);
                }

                // 2. Check User
                const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
                if (authError) {
                    addError(`Auth 用户凭证异常: ${authError.message}`);
                }
                setUser(currentUser);

                // 3. Current User Profile
                if (currentUser) {
                    const { data: profile, error: profileErr } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", currentUser.id)
                        .maybeSingle();

                    if (profileErr) {
                        addError(`Profile 查询异常: ${profileErr.message} (代码: ${profileErr.code})`);
                    } else {
                        setCurrentProfile(profile);
                    }
                }

                // 4. Sample Profiles
                const { data: allProfiles, error: dbError } = await supabase
                    .from("profiles")
                    .select("id, email, username, avatar_url, vip_level, reputation_score, created_at")
                    .limit(10);

                if (dbError) {
                    addError(`Profiles 抽样异常: ${dbError.message}`);
                } else {
                    setProfiles(allProfiles || []);
                }
            } catch (err: any) {
                addError(`未知诊断故障: ${err?.message || err}`);
            } finally {
                setLoading(false);
            }
        }

        runDiagnostics();
    }, [supabase, isDev]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* 顶部导航与状态 */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-muted-foreground bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-0 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.6)] hover:text-foreground transition-all duration-300"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        返回学术控制台
                    </Link>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {isDev ? "开发环境调试模式 (Dev Mode)" : "生产环境高权安全沙盒 (Super Admin Only)"}
                    </div>
                </div>

                {/* 标题 */}
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Activity className="w-6 h-6 text-primary" />
                        系统运行态诊断中心
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        实时观测 Supabase Auth 鉴权会话、Profile 关系映射与数据库连接健康状态
                    </p>
                </div>

                {/* 会话状态面板 */}
                <div className="p-6 rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)] space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4 text-sky-500" />
                            Supabase Session 会话状态
                        </h2>
                        {session ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 会话有效
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <XCircle className="w-3.5 h-3.5" /> 无有效会话
                            </span>
                        )}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground break-all">
                        {session ? (
                            <p>过期时间: {new Date(session.expires_at * 1000).toLocaleString()}</p>
                        ) : (
                            <p>当前请求未携带有效认证 Cookie，若已登录请检查跨域策略或刷新凭证。</p>
                        )}
                    </div>
                </div>

                {/* 当前认证学者 Profile 面板 */}
                <div className="p-6 rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)] space-y-4">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-violet-500" />
                        当前学者身份映射 (auth.users → public.profiles)
                    </h2>

                    {user ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="p-3.5 rounded-2xl bg-zinc-500/5 space-y-1">
                                <span className="text-muted-foreground block text-[11px]">Auth User UID</span>
                                <span className="font-semibold text-foreground select-all">{user.id}</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-zinc-500/5 space-y-1">
                                <span className="text-muted-foreground block text-[11px]">Auth Email</span>
                                <span className="font-semibold text-foreground">{maskEmail(user.email)}</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-zinc-500/5 space-y-1">
                                <span className="text-muted-foreground block text-[11px]">Profile Username</span>
                                <span className="font-semibold text-foreground">{currentProfile?.username || "未设置"}</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-zinc-500/5 space-y-1">
                                <span className="text-muted-foreground block text-[11px]">学者等级与声誉</span>
                                <span className="font-semibold text-foreground">
                                    Lv.{currentProfile?.vip_level ?? 1} · 声誉值 {currentProfile?.reputation_score ?? 0}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">当前未处于学者登录态。</p>
                    )}
                </div>

                {/* 错误日志 */}
                {errors.length > 0 && (
                    <div className="p-6 rounded-3xl border-0 bg-rose-500/10 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(244,63,94,0.1),inset_0_1px_0.5px_rgba(255,255,255,0.6)] space-y-2">
                        <h2 className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            诊断发现的异常 ({errors.length})
                        </h2>
                        <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-1 font-mono">
                            {errors.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Profiles 抽样表（生产环境脱敏保护） */}
                <div className="p-6 rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)] space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-500" />
                            数据库 Profiles 活跃连接抽样 (前 10 条)
                        </h2>
                        <span className="text-[11px] text-muted-foreground">
                            {isDev ? "开发全量视图" : "生产隐私脱敏模式"}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-0 text-muted-foreground border-b border-zinc-200/40 dark:border-zinc-800/40">
                                    <th className="py-2.5 px-3 text-left font-medium">学者标识 (UID)</th>
                                    <th className="py-2.5 px-3 text-left font-medium">用户名</th>
                                    <th className="py-2.5 px-3 text-left font-medium">学者邮箱</th>
                                    <th className="py-2.5 px-3 text-right font-medium">等级 / 声誉</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 font-mono">
                                {profiles.map((p) => (
                                    <tr key={p.id} className="hover:bg-zinc-500/5 transition-colors">
                                        <td className="py-2.5 px-3 text-muted-foreground">{p.id.slice(0, 8)}...</td>
                                        <td className="py-2.5 px-3 font-semibold text-foreground">{p.username || "—"}</td>
                                        <td className="py-2.5 px-3 text-muted-foreground">{maskEmail(p.email)}</td>
                                        <td className="py-2.5 px-3 text-right text-foreground font-sans">
                                            Lv.{p.vip_level ?? 1} · {p.reputation_score ?? 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {profiles.length === 0 && !loading && (
                            <p className="text-center py-6 text-xs text-muted-foreground">暂未检索到 profiles 记录</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
