"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    resetPasswordSchema,
    type ResetPasswordFormData,
} from "@/lib/validations/auth";
import { updatePassword } from "@/app/auth/actions";
import { OBSIDIAN_CTA } from "@/components/landing/liquid-glass";
import { cn } from "@/lib/utils";
import { ArrowRight, KeyRound, Loader2, Lock } from "lucide-react";

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

export function ResetPasswordForm() {
    const [isPending, startTransition] = useTransition();

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    function onSubmit(data: ResetPasswordFormData) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("password", data.password);

            const result = await updatePassword(formData);

            if (result?.error) {
                toast.error("重置失败", {
                    description: result.error,
                });
            } else {
                toast.success("密码已重置", {
                    description: "您现在可以使用新密码登录。",
                });
                form.reset();
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-zinc-800 dark:text-zinc-200">
                                新密码
                            </FormLabel>
                            <FormControl>
                                <div className="group/field relative">
                                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                    <Input
                                        type="password"
                                        placeholder="设置至少 6 位新密码"
                                        className="pl-10 h-11"
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-xs pl-1" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-zinc-800 dark:text-zinc-200">
                                确认新密码
                            </FormLabel>
                            <FormControl>
                                <div className="group/field relative">
                                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within/field:text-zinc-700 dark:group-focus-within/field:text-zinc-200" />
                                    <Input
                                        type="password"
                                        placeholder="再次输入新密码"
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
                            <span>保存中...</span>
                        </>
                    ) : (
                        <>
                            <span>确认更新密码</span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
