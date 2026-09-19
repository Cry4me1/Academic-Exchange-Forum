import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailResendLimiter } from "@/lib/rate-limit";
import { z } from "zod";

const emailSchema = z.string().email("请输入有效的邮箱地址");

export async function POST(request: Request) {
    try {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        let email = "";

        // 尝试从请求体解析
        try {
            const body = await request.json();
            if (body && typeof body.email === "string") {
                email = body.email.trim();
            }
        } catch {
            // body 为空时忽略，尝试走 session
        }

        const supabase = await createClient();

        // 如果 body 未提供邮箱，尝试从当前登录会话中获取
        if (!email) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                email = user.email;
            }
        }

        if (!email) {
            return NextResponse.json(
                { error: "无法获取目标邮箱地址，请重新登录或输入邮箱" },
                { status: 400 }
            );
        }

        // 校验邮箱格式
        const parsed = emailSchema.safeParse(email);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "邮箱地址格式不合法" },
                { status: 400 }
            );
        }

        const cleanEmail = parsed.data.toLowerCase();

        // 速率限制检查（按 IP + 邮箱 组合键，60秒一次）
        const rateLimitKey = `resend:${ip}:${cleanEmail}`;
        const { limited, resetIn } = emailResendLimiter.check(rateLimitKey);
        if (limited) {
            const waitSeconds = Math.max(1, Math.ceil(resetIn / 1000));
            return NextResponse.json(
                { error: `验证邮件发送过于频繁，请等待 ${waitSeconds} 秒后再试` },
                { status: 429 }
            );
        }

        // 检查当前会话用户是否其实已经验证成功
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email?.toLowerCase() === cleanEmail && user.email_confirmed_at) {
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: "您的邮箱已完成验证，无需重复发送",
            });
        }

        // 构造重定向回调地址
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const redirectTo = `${origin}/auth/callback?next=/dashboard`;

        // 调用 Supabase Auth Resend API
        const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email: cleanEmail,
            options: {
                emailRedirectTo: redirectTo,
            },
        });

        if (resendError) {
            console.error("[Email Resend API] Supabase error:", resendError);
            return NextResponse.json(
                { error: resendError.message || "发送验证邮件失败，请稍后重试" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "验证邮件已成功发送，请查收收件箱或垃圾邮件箱",
        });

    } catch (error: any) {
        console.error("[Email Resend API] Internal error:", error);
        return NextResponse.json(
            { error: "服务器内部异常，请稍后重试" },
            { status: 500 }
        );
    }
}
