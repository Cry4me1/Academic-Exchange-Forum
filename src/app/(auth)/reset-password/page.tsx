import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SERIF_STACK } from "@/components/landing/liquid-glass";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-medium bg-[rgba(245,158,11,0.12)] text-amber-800 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                    <span>安全验证已通过</span>
                </div>
                <h1
                    style={{ fontFamily: SERIF_STACK }}
                    className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    设置新密码
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    请为您的学者账号设定新的安全登录密码
                </p>
            </div>

            <ResetPasswordForm />
        </div>
    );
}
