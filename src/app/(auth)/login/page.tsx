import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getRegistrationMode } from "@/lib/invite/service";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
    const registrationMode = await getRegistrationMode();

    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[340px] text-zinc-500 dark:text-zinc-400 gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)]">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-300" />
                    </span>
                    <span className="text-xs font-medium">正在加载登录通道...</span>
                </div>
            }
        >
            <LoginForm initialRegistrationMode={registrationMode} />
        </Suspense>
    );
}
