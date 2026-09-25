"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * 全局认证重定向与错误监听器
 * 1. 拦截并友好提示由于旧邮件链接失效、OTP 过期造成的 Supabase 回退错误（如 ?error=access_denied&error_code=otp_expired）
 * 2. 捕获 Supabase 由于未命中 Redirect URLs 回退至根路径的 access_token 会话，并平滑将其重定向到 /dashboard
 */
export function AuthRedirectHandler() {
    const router = useRouter();
    const handledRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || handledRef.current) return;

        const searchParams = new URLSearchParams(window.location.search);
        
        // 解析 Hash 中的参数（如 #error=... 或 #access_token=...）
        const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        // 1. 检查是否存在 Auth 错误（Query 或 Hash 中）
        const error = searchParams.get("error") || hashParams.get("error");
        const errorCode = searchParams.get("error_code") || hashParams.get("error_code");
        const rawErrorDesc = searchParams.get("error_description") || hashParams.get("error_description");

        if (error || errorCode || rawErrorDesc) {
            handledRef.current = true;
            let errorDesc = "";
            if (rawErrorDesc) {
                try {
                    errorDesc = decodeURIComponent(rawErrorDesc.replace(/\+/g, " "));
                } catch {
                    errorDesc = rawErrorDesc;
                }
            }

            let title = "登录验证失败";
            let description = errorDesc || "邮件验证链接无效或已过期，请重试";

            if (errorCode === "otp_expired" || errorDesc.includes("expired") || errorDesc.includes("invalid")) {
                title = "邮件登录链接已过期或失效";
                description = "Supabase 安全机制规定：每次请求新链接都会立即作废旧链接。请务必点击收件箱中【最新一封】邮件中的“Log In”按钮；若仍无法登录，请返回登录页重新发送。";
            }

            toast.error(title, {
                description,
                duration: 9000,
                action: {
                    label: "去登录",
                    onClick: () => router.push("/login"),
                },
            });

            // 清理地址栏中丑陋冗长的错误参数，恢复干净 URL
            window.history.replaceState(null, "", window.location.pathname);
            return;
        }

        // 2. 检查 Hash 中是否有 Supabase 凭据（例如 Implicit flow 回退至根路径）
        const hasAccessToken = hashParams.has("access_token");
        if (hasAccessToken) {
            handledRef.current = true;
            const supabase = createClient();
            
            // 监听认证状态以捕获已从 hash 注入的会话
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
                if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
                    toast.success("验证成功，正在进入学术研讨工作台...");
                    window.location.replace("/dashboard");
                }
            });

            // 兜底立即检查一次已有会话
            supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
                if (data?.session) {
                    window.location.replace("/dashboard");
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [router]);

    return null;
}
