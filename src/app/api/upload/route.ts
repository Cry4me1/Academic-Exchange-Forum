import crypto from "crypto";
import { auditSingleImageBase64 } from "@/lib/moderation/image-moderator";
import { deleteFromR2, isR2Configured, isR2Url, uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        // 1. 验证用户身份
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "未授权，请先登录" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const uploadType = (formData.get("type") as string) || "content_image"; // "cover" | "content_image"

        if (!file) {
            return NextResponse.json(
                { error: "未找到文件" },
                { status: 400 }
            );
        }

        // 2. 验证文件大小
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `图片大小不能超过 5MB，当前大小：${(file.size / 1024 / 1024).toFixed(2)}MB` },
                { status: 400 }
            );
        }

        // 3. 验证文件类型
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "不支持的文件类型，请上传 JPEG、PNG、GIF 或 WebP 格式的图片" },
                { status: 400 }
            );
        }

        // 4. 读取二进制 Buffer 并计算 SHA-256 哈希与 Base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");
        const base64Data = buffer.toString("base64");

        // 5. 接入百度 AI 图像内容安全审核
        const startTime = Date.now();
        const auditResult = await auditSingleImageBase64(base64Data);
        const latencyMs = Date.now() - startTime;

        let finalAction: "auto_approved" | "auto_pending" | "auto_rejected" = "auto_approved";
        let riskLevel: "safe" | "sensitive" | "dangerous" = "safe";
        let score = auditResult.score ?? 100;
        let reason = auditResult.violationReason || "百度AI图片审核合规";

        if (auditResult.isDangerous) {
            finalAction = "auto_rejected";
            riskLevel = "dangerous";
            score = auditResult.score || 20;
            reason = auditResult.violationReason || "图片包含违规内容（涉嫌色情/暴力/政治敏感等）";
        } else if (auditResult.isSensitive) {
            finalAction = "auto_pending";
            riskLevel = "sensitive";
            score = auditResult.score || 60;
            reason = auditResult.violationReason || "图片疑似存在敏感违规风险";
        } else {
            finalAction = "auto_approved";
            riskLevel = "safe";
            score = 100;
            reason = auditResult.violationReason || "百度AI图片审核合规";
        }

        // 6. 【核心强制】所有百度图片审核结果 100% 写入 content_moderation_logs 审计日志
        const isCover = uploadType === "cover";
        const detectedTags = isCover
            ? ["post_cover", "image_upload"]
            : ["post_content_image", "image_upload"];
        const prefix = isCover ? "[帖子封面] " : "[帖子正文配图] ";

        try {
            await supabase.from("content_moderation_logs").insert({
                post_id: null,
                comment_id: null,
                author_id: user.id,
                content_hash: contentHash,
                model_name: "baidu-image-censor",
                score: score,
                risk_level: riskLevel,
                reason: `${prefix}${reason}`,
                detected_tags: detectedTags,
                matched_sensitive_words: [],
                final_action: finalAction,
                cost_tokens: 0,
                latency_ms: latencyMs,
                is_cached: false,
            });
        } catch (logErr) {
            console.error("[UploadRoute] 写入图片审核审计日志异常:", logErr);
        }

        // 7. 若未通过百度 AI 安全审核，坚决拦截并阻断上传存储
        if (finalAction !== "auto_approved") {
            return NextResponse.json(
                { error: `图片未通过安全审核：${reason}，已被系统拦截。` },
                { status: 400 }
            );
        }

        // 8. 审核通过：上传到 R2 或 Supabase Storage
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        if (isR2Configured()) {
            const uint8Array = new Uint8Array(arrayBuffer);
            const publicUrl = await uploadToR2(uint8Array, fileName, file.type);
            return NextResponse.json({ url: publicUrl });
        } else {
            // 降级：使用 Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("post-images")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("post-images")
                .getPublicUrl(fileName);

            return NextResponse.json({ url: publicUrl });
        }
    } catch (error) {
        console.error("上传失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "上传失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 验证用户身份
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "未授权" },
                { status: 401 }
            );
        }

        const { url } = await request.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "未提供有效的 URL" },
                { status: 400 }
            );
        }

        // 根据 URL 类型删除
        if (isR2Url(url)) {
            await deleteFromR2(url);
            return NextResponse.json({ success: true });
        } else if (url.includes(".supabase.co/storage")) {
            // Supabase Storage 删除
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.indexOf('post-images');

            if (bucketIndex === -1) {
                return NextResponse.json(
                    { error: "URL 不属于 post-images 存储桶" },
                    { status: 400 }
                );
            }

            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            if (!filePath) {
                return NextResponse.json(
                    { error: "无法从 URL 提取文件路径" },
                    { status: 400 }
                );
            }

            const { error } = await supabase.storage
                .from('post-images')
                .remove([filePath]);

            if (error) {
                throw error;
            }

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: "未知的 URL 格式" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("删除失败:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "删除失败" },
            { status: 500 }
        );
    }
}
