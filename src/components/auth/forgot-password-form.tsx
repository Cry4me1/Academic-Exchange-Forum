"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from "@/lib/validations/auth";
import { forgotPassword } from "@/app/auth/actions";
import { OBSIDIAN_CTA, SERIF_STACK } from "@/components/landing/liquid-glass";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [sentEmail, setSentEmail] = useState<string | null>(null);

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    function onSubmit(data: ForgotPasswordFormData) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("email", data.email);

            const result = await forgotPassword(formData);

            if (result?.error) {
                toast.error("发送失败", {
                    description: result.error,
                });
            } else {
                toast.success("邮件已发送", {
                    description: "请查收您的邮箱以重置密码。",
                });
                setSentEmail(data.email);
                form.reset();
            }
        });
    }

    if (sentEmail) {
        return (
            <div className="text-center space-y-4 py-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_0_20px_rgba(16,185,129,0.16)]">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                    <h3
                        style={{ fontFamily: SERIF_STACK }}
                        className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                        重置链接已投递
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        请前往{" "}
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                            {sentEmail}
                        </span>{" "}
                        查收邮件并完成密码重置。
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSentEmail(null)}
                    className="h-9 px-5 rounded-full border-0 text-xs font-medium"
                >
                    更换其他邮箱重发
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-zinc-800 dark:text-zinc-200">
                                邮箱地址
                            </FormLabel>
                            <FormControl>
                                <div className="group/field relative">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                    <Input
                                        type="email"
                                        placeholder="your@university.edu"
                                        className="pl-10 h-11"
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-xs pl-1" />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    disabled={isPending}
                    className={cn(
                        OBSIDIAN_CTA,
                        "group relative w-full h-11 mt-1 overflow-hidden rounded-full font-medium cursor-pointer"
                    )}
                >
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/65 dark:via-white/90 to-transparent"
                    />
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>发送中...</span>
                        </>
                    ) : (
                        <>
                            <span>发送重置链接</span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
