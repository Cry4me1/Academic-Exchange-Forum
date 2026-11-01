import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { DIVIDER_H, SERIF_STACK } from "@/components/landing/liquid-glass";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1.5 text-center">
                <h1
                    style={{ fontFamily: SERIF_STACK }}
                    className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    找回登录密码
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    输入您绑定的邮箱地址，我们将向您发送安全重置链接
                </p>
            </div>

            <ForgotPasswordForm />

            <div className={DIVIDER_H} />

            <div className="text-center">
                <Link
                    href="/login"
                    className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
                    <span>返回登录</span>
                </Link>
            </div>
        </div>
    );
}
