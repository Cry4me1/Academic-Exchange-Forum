"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { scanSensitiveWords } from "@/lib/moderation/sensitive-words";
import {
    PostAnnotation,
    CreateAnnotationParams,
    AnnotationColor,
} from "@/components/posts/annotations/types";

/**
 * 获取文章下的所有行间批注与微线程回复
 */
export async function getPostAnnotations(postId: string): Promise<PostAnnotation[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("post_annotations")
            .select(`
                *,
                author:profiles!author_id (
                    id,
                    username,
                    avatar_url,
                    bio,
                    vip_level,
                    reputation_score,
                    is_developer,
                    developer_title,
                    special_title,
                    badges,
                    is_verified,
                    auth_provider
                )
            `)
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

        if (error || !data) {
            console.error("[Annotations] Failed to fetch annotations:", error);
            return [];
        }

        // 分组为树状结构（根批注 + 嵌套回复）
        const roots: PostAnnotation[] = [];
        const replyMap = new Map<string, PostAnnotation[]>();

        for (const item of data) {
            const annotation: PostAnnotation = {
                id: item.id,
                post_id: item.post_id,
                author_id: item.author_id,
                parent_id: item.parent_id,
                anchor_text: item.anchor_text,
                anchor_prefix: item.anchor_prefix || "",
                anchor_suffix: item.anchor_suffix || "",
                content: item.content,
                color: (item.color || "amber") as AnnotationColor,
                is_resolved: !!item.is_resolved,
                review_status: item.review_status,
                created_at: item.created_at,
                updated_at: item.updated_at,
                author: item.author,
                replies: [],
            };

            if (item.parent_id) {
                const existing = replyMap.get(item.parent_id) || [];
                existing.push(annotation);
                replyMap.set(item.parent_id, existing);
            } else {
                roots.push(annotation);
            }
        }

        // 将回复挂载至根节点
        for (const root of roots) {
            root.replies = replyMap.get(root.id) || [];
        }

        return roots;
    } catch (err) {
        console.error("[Annotations] Exception in getPostAnnotations:", err);
        return [];
    }
}

/**
 * 发表新的行间批注
 */
export async function createAnnotation(params: CreateAnnotationParams) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "请先登录后再发表批注" };
        }

        // 校验输入
        const trimmedText = params.anchorText?.trim();
        const trimmedContent = params.content?.trim();

        if (!trimmedText) {
            return { error: "划选正文内容不能为空" };
        }
        if (!trimmedContent) {
            return { error: "批注研讨内容不能为空" };
        }

        // 检查用户禁言或封禁状态
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, is_banned, is_muted, muted_until")
            .eq("id", user.id)
            .single();

        if (profile?.is_banned) {
            return { error: "您的账号已被封禁，无法发表批注" };
        }
        if (profile?.is_muted && profile.muted_until && new Date(profile.muted_until) > new Date()) {
            return { error: "您当前处于禁言状态，暂无法发表批注" };
        }

        // 内容敏感词检测
        const sensitiveScan = await scanSensitiveWords(trimmedContent);
        if (sensitiveScan.hasBlock) {
            return {
                error: `批注内容包含敏感关键词（如：${sensitiveScan.matchedBlockWords.slice(0, 3).join("、")}），请调整后重新提交`,
            };
        }

        const insertData = {
            post_id: params.postId,
            author_id: user.id,
            anchor_text: trimmedText,
            anchor_prefix: params.anchorPrefix || "",
            anchor_suffix: params.anchorSuffix || "",
            content: trimmedContent,
            color: params.color || "amber",
            is_resolved: false,
            review_status: "approved",
        };

        const { data, error } = await supabase
            .from("post_annotations")
            .insert(insertData)
            .select(`
                *,
                author:profiles!author_id (
                    id,
                    username,
                    avatar_url,
                    bio,
                    vip_level,
                    reputation_score,
                    is_developer,
                    developer_title,
                    special_title,
                    badges,
                    is_verified,
                    auth_provider
                )
            `)
            .single();

        if (error || !data) {
            console.error("[Annotations] Create error:", error);
            return { error: "创建批注失败，请稍后重试" };
        }

        const annotation: PostAnnotation = {
            ...data,
            color: (data.color || "amber") as AnnotationColor,
            is_resolved: !!data.is_resolved,
            replies: [],
        };

        revalidatePath(`/posts/${params.postId}`);
        return { data: annotation };
    } catch (err) {
        console.error("[Annotations] Exception in createAnnotation:", err);
        return { error: "提交批注时发生异常" };
    }
}

/**
 * 回复已存在的批注微线程
 */
export async function createAnnotationReply(
    annotationId: string,
    postId: string,
    content: string
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "请先登录后再回复" };
        }

        const trimmedContent = content?.trim();
        if (!trimmedContent) {
            return { error: "回复内容不能为空" };
        }

        // 敏感词快速过滤
        const sensitiveScan = await scanSensitiveWords(trimmedContent);
        if (sensitiveScan.hasBlock) {
            return {
                error: `回复内容包含敏感关键词，请调整后重新提交`,
            };
        }

        // 获取根批注的 anchor 信息保持一致
        const { data: parent } = await supabase
            .from("post_annotations")
            .select("anchor_text, anchor_prefix, anchor_suffix, color")
            .eq("id", annotationId)
            .single();

        if (!parent) {
            return { error: "未找到对应的批注主线" };
        }

        const { data, error } = await supabase
            .from("post_annotations")
            .insert({
                post_id: postId,
                author_id: user.id,
                parent_id: annotationId,
                anchor_text: parent.anchor_text,
                anchor_prefix: parent.anchor_prefix,
                anchor_suffix: parent.anchor_suffix,
                content: trimmedContent,
                color: parent.color,
                is_resolved: false,
                review_status: "approved",
            })
            .select(`
                *,
                author:profiles!author_id (
                    id,
                    username,
                    avatar_url,
                    bio,
                    vip_level,
                    reputation_score,
                    is_developer,
                    developer_title,
                    special_title,
                    badges,
                    is_verified,
                    auth_provider
                )
            `)
            .single();

        if (error || !data) {
            console.error("[Annotations] Reply error:", error);
            return { error: "回复失败，请重试" };
        }

        const reply: PostAnnotation = {
            ...data,
            color: (data.color || "amber") as AnnotationColor,
            is_resolved: !!data.is_resolved,
            replies: [],
        };

        revalidatePath(`/posts/${postId}`);
        return { data: reply };
    } catch (err) {
        console.error("[Annotations] Exception in createAnnotationReply:", err);
        return { error: "提交回复时发生错误" };
    }
}

/**
 * 切换批注的“已解决/探讨中”状态
 * 允许批注发起者、文章作者或管理员操作
 */
export async function toggleResolveAnnotation(
    annotationId: string,
    postId: string
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "请先登录" };
        }

        // 获取当前批注信息
        const { data: target } = await supabase
            .from("post_annotations")
            .select("id, author_id, post_id, is_resolved")
            .eq("id", annotationId)
            .single();

        if (!target) {
            return { error: "未找到批注" };
        }

        // 检查权限：批注作者、文章作者或管理员
        const { data: post } = await supabase
            .from("posts")
            .select("author_id")
            .eq("id", postId)
            .single();

        const isPostAuthor = post && post.author_id === user.id;

        let isAdmin = false;
        const { data: adminRole } = await supabase
            .from("admin_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
        isAdmin = !!adminRole;

        // 仅文章主人（作者）或系统管理员具备结题判定权
        if (!isPostAuthor && !isAdmin) {
            return { error: "只有文章主人（原作者）有权将批注标记为已结题" };
        }

        const newResolved = !target.is_resolved;
        const { error: updateError } = await supabase
            .from("post_annotations")
            .update({ is_resolved: newResolved })
            .eq("id", annotationId);

        if (updateError) {
            return { error: "更新状态失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { success: true, is_resolved: newResolved };
    } catch (err) {
        console.error("[Annotations] Exception in toggleResolveAnnotation:", err);
        return { error: "切换状态时出错" };
    }
}

/**
 * 删除批注或回复
 */
export async function deleteAnnotation(
    annotationId: string,
    postId: string
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "请先登录" };
        }

        const { data: target } = await supabase
            .from("post_annotations")
            .select("id, author_id")
            .eq("id", annotationId)
            .single();

        if (!target) {
            return { error: "批注不存在或已删除" };
        }

        const { data: post } = await supabase
            .from("posts")
            .select("author_id")
            .eq("id", postId)
            .single();

        const isPostAuthor = post && post.author_id === user.id;
        const isAnnotationAuthor = target.author_id === user.id;

        const { data: adminRole } = await supabase
            .from("admin_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
        const isAdmin = !!adminRole;

        if (!isPostAuthor && !isAnnotationAuthor && !isAdmin) {
            return { error: "无权删除此批注" };
        }

        const { error: deleteError } = await supabase
            .from("post_annotations")
            .delete()
            .eq("id", annotationId);

        if (deleteError) {
            return { error: "删除批注失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { success: true };
    } catch (err) {
        console.error("[Annotations] Exception in deleteAnnotation:", err);
        return { error: "删除操作发生异常" };
    }
}
