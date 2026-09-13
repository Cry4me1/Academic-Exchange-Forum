"use server";

import crypto from "crypto";
import { auditSingleImageBase64 } from "@/lib/moderation/image-moderator";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface BannerUploadResponse {
  success: boolean;
  bannerUrl?: string;
  error?: string;
  reason?: string;
  riskLevel?: string;
}

/**
 * 上传个人主页 Banner 并接入百度 AI 图像安全审核
 * 核心规则：每一次百度图片审核的结果均全量记录至 content_moderation_logs 审计日志
 */
export async function uploadAndAuditBannerAction(
  formData: FormData
): Promise<BannerUploadResponse> {
  const supabase = await createClient();

  // 1. 验证用户登录状态
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "您尚未登录，请先登录后再进行操作。" };
  }

  // 2. 校验文件有效性
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "未检测到上传的图片文件。" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `图片大小不能超过 5MB，当前大小为 ${(file.size / 1024 / 1024).toFixed(2)}MB。`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "仅支持 JPEG、PNG、WebP 或 GIF 格式的图片。",
    };
  }

  try {
    // 3. 读取二进制 Buffer 并计算 SHA-256 哈希
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const base64Data = buffer.toString("base64");

    // 4. 调用百度图片安全审核
    const startTime = Date.now();
    const auditResult = await auditSingleImageBase64(base64Data);
    const latencyMs = Date.now() - startTime;

    // 5. 判定风险等级与处置动作
    let finalAction: "auto_approved" | "auto_pending" | "auto_rejected" = "auto_approved";
    let riskLevel: "safe" | "sensitive" | "dangerous" = "safe";
    let score = auditResult.score ?? 100;
    let reason = auditResult.violationReason || "百度AI图片审核合规";

    if (auditResult.isDangerous) {
      finalAction = "auto_rejected";
      riskLevel = "dangerous";
      score = auditResult.score || 20;
      reason = auditResult.violationReason || "图片包含严重违规内容（涉嫌色情/暴力/政治等）";
    } else if (auditResult.isSensitive) {
      finalAction = "auto_pending";
      riskLevel = "sensitive";
      score = auditResult.score || 60;
      reason = auditResult.violationReason || "图片疑似存在敏感合规风险";
    } else {
      finalAction = "auto_approved";
      riskLevel = "safe";
      score = 100;
      reason = auditResult.violationReason || "百度AI图片审核合规";
    }

    // 6. 【核心强制】所有百度图片审核的结果都要加到 AI 审核日志里面
    try {
      await supabase.from("content_moderation_logs").insert({
        post_id: null,
        comment_id: null,
        author_id: user.id,
        content_hash: contentHash,
        model_name: "baidu-image-censor",
        score: score,
        risk_level: riskLevel,
        reason: reason,
        detected_tags: ["banner", "profile_banner"],
        matched_sensitive_words: [],
        final_action: finalAction,
        cost_tokens: 0,
        latency_ms: latencyMs,
        is_cached: false,
      });
    } catch (logErr) {
      console.error("[ProfileBanner] 写入审核审计日志异常:", logErr);
    }

    // 7. 若未通过安全审核，坚决拦截并不予保存
    if (finalAction !== "auto_approved") {
      return {
        success: false,
        error: `图片未通过百度 AI 安全审核：${reason}`,
        reason,
        riskLevel,
      };
    }

    // 8. 审核通过：安全持久化至 Supabase Storage
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `banner-${user.id}-${Date.now()}.${fileExt}`;

    let publicUrl: string | null = null;

    // 优先使用专门的 banners 存储桶
    const { error: uploadBannersError } = await supabase.storage
      .from("banners")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (!uploadBannersError) {
      const { data } = supabase.storage.from("banners").getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    } else {
      console.warn("[ProfileBanner] 上传至 banners 桶失败，尝试降级上传至 avatars 桶:", uploadBannersError.message);
      const { error: uploadAvatarsError } = await supabase.storage
        .from("avatars")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadAvatarsError) {
        throw new Error(`存储桶保存失败: ${uploadAvatarsError.message}`);
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    }

    if (!publicUrl) {
      throw new Error("未能获取图片存储公开访问地址。");
    }

    // 9. 更新用户的 profile.banner_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        banner_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`更新用户档案失败: ${updateError.message}`);
    }

    // 10. 重新验证页面缓存以实现无感无刷新展示
    revalidatePath(`/user/${user.id}`);
    revalidatePath(`/settings/profile`);

    return {
      success: true,
      bannerUrl: publicUrl,
      reason,
      riskLevel,
    };
  } catch (err: any) {
    console.error("[ProfileBanner] Banner 处理异常:", err);
    return {
      success: false,
      error: err.message || "上传过程中发生系统异常，请稍后重试。",
    };
  }
}

/**
 * 移除自定义 Banner 图片，恢复为预设学术渐变色彩
 */
export async function removeProfileBannerAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "未授权" };
  }

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        banner_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    revalidatePath(`/user/${user.id}`);
    revalidatePath(`/settings/profile`);

    return { success: true };
  } catch (err: any) {
    console.error("[ProfileBanner] 移除 Banner 失败:", err);
    return { success: false, error: err.message || "恢复默认封面失败" };
  }
}
