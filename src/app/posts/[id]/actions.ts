"use server";

// Refresh Server Action manifest ID

import { deleteImages, extractImageUrls } from "@/lib/storage-cleanup";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { moderateCommentContent } from "@/lib/moderation/engine";

// JSONContent 类型定义
interface JSONContentNode {
    type?: string;
    attrs?: Record<string, unknown>;
    content?: JSONContentNode[];
}

// 切换帖子点赞状态
export async function toggleLikePost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已点赞
    const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

    if (existingLike) {
        // 取消点赞
        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("id", existingLike.id);

        if (error) {
            console.error("Unlike error:", error);
            return { error: "取消点赞失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { liked: false };
    } else {
        // 点赞
        const { error } = await supabase
            .from("likes")
            .insert({
                user_id: user.id,
                post_id: postId,
            });

        if (error) {
            console.error("Like error:", error);
            return { error: "点赞失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { liked: true };
    }
}

// 切换评论点赞状态
export async function toggleLikeComment(commentId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已点赞
    const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("comment_id", commentId)
        .single();

    if (existingLike) {
        // 取消点赞
        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("id", existingLike.id);

        if (error) {
            console.error("Unlike comment error:", error);
            return { error: "取消点赞失败" };
        }

        return { liked: false };
    } else {
        // 点赞
        const { error } = await supabase
            .from("likes")
            .insert({
                user_id: user.id,
                comment_id: commentId,
            });

        if (error) {
            console.error("Like comment error:", error);
            return { error: "点赞失败" };
        }

        return { liked: true };
    }
}

// 切换收藏状态
export async function toggleBookmarkPost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 检查是否已收藏
    const { data: existingBookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

    if (existingBookmark) {
        // 取消收藏
        const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("id", existingBookmark.id);

        if (error) {
            console.error("Unbookmark error:", error);
            return { error: "取消收藏失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { bookmarked: false };
    } else {
        // 收藏
        const { error } = await supabase
            .from("bookmarks")
            .insert({
                user_id: user.id,
                post_id: postId,
            });

        if (error) {
            console.error("Bookmark error:", error);
            return { error: "收藏失败" };
        }

        revalidatePath(`/posts/${postId}`);
        return { bookmarked: true };
    }
}

// 记录转发
export async function createShareRecord(postId: string, shareType: "copy_link" | "repost" = "copy_link") {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // 未登录也可以复制链接，只是不记录
        return { success: true };
    }

    const { error } = await supabase
        .from("shares")
        .insert({
            user_id: user.id,
            post_id: postId,
            share_type: shareType,
        });

    if (error) {
        console.error("Share record error:", error);
        // 转发记录失败不影响用户体验
    }

    return { success: true };
}

// 提取评论节点中的所有提及对象
function extractMentionsFromContent(node: any): { id: string; label: string; is_ai?: boolean }[] {
    const mentions: { id: string; label: string; is_ai?: boolean }[] = [];
    if (!node || typeof node !== "object") return mentions;

    if (node.type === "mention") {
        const attrs = node.attrs;
        if (attrs && typeof attrs === "object") {
            const id = typeof attrs.id === "string" ? attrs.id : (attrs.id ? String(attrs.id) : "");
            const label = typeof attrs.label === "string" ? attrs.label : (attrs.label ? String(attrs.label) : "");
            const isAi = Boolean(attrs.is_ai || id === "00000000-0000-0000-0000-0000000000a1" || label === "Scholarly AI");
            if (id) {
                mentions.push({ id, label, is_ai: isAi });
            }
        }
    }

    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            mentions.push(...extractMentionsFromContent(child));
        }
    }
    return mentions;
}

// 提取评论纯文本内容
function extractRawTextFromContent(node: any): string {
    if (!node || typeof node !== "object") return "";
    if (node.text) return String(node.text);
    if (node.type === "mention") return `@${node.attrs?.label || "学者"}`;
    if (Array.isArray(node.content)) {
        return node.content.map(extractRawTextFromContent).join(" ");
    }
    return "";
}

// 创建评论
export async function createComment(data: {
    postId: string;
    parentId?: string | null;
    content: any;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 彻底解构并安全反序列化为服务器原生纯纯 JSON 对象
    let cleanContent: any = data.content;
    if (typeof data.content === "string") {
        try {
            cleanContent = JSON.parse(data.content);
        } catch {
            cleanContent = data.content;
        }
    }

    // 检查用户是否被封禁或禁言
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, is_banned, is_muted, muted_until")
        .eq("id", user.id)
        .single();

    if (profile?.is_banned) {
        return { error: "您的账号已被封禁，无法发表评论" };
    }

    if (profile?.is_muted) {
        const muteExpiry = profile.muted_until ? new Date(profile.muted_until) : null;
        if (!muteExpiry || muteExpiry > new Date()) {
            return { error: "您已被禁言，暂时无法发表评论" };
        }
    }

    // 检测是否有 @Scholarly AI
    const mentions = extractMentionsFromContent(cleanContent);
    const hasAiMention = mentions.some(
        (m) => m.is_ai || m.id === "00000000-0000-0000-0000-0000000000a1" || m.label === "Scholarly AI"
    );

    // 若呼出了 Scholarly AI，前置校验用户积分余额
    if (hasAiMention) {
        const { data: creditData } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", user.id)
            .single();

        const userBalance = creditData?.balance ?? 0;
        if (userBalance < 8) {
            return {
                error: `您的积分不足（当前 ${userBalance} 积分，呼出 Scholarly AI 最低需 8 积分），请先充值或每日签到获取积分。`,
            };
        }
    }

    // 执行 AI + 敏感词评论内容初审
    const moderation = await moderateCommentContent({
        postId: data.postId,
        authorId: user.id,
        content: cleanContent,
    });

    // 若触发直接拦截（违规敏感词或高危严重违规）
    if (moderation.reviewStatus === "rejected") {
        return {
            error: moderation.errorMessage || "评论包含违规内容，已被系统拦截",
            moderation,
        };
    }

    const { data: comment, error } = await supabase
        .from("comments")
        .insert({
            post_id: data.postId,
            author_id: user.id,
            parent_id: data.parentId || null,
            content: cleanContent,
            review_status: moderation.reviewStatus,
            ai_score: moderation.score,
            ai_risk_level: moderation.riskLevel,
            ai_reason: moderation.reason,
            matched_sensitive_words: moderation.matchedSensitiveWords,
        })
        .select(`
            *,
            author:profiles!author_id (
                id,
                username,
                avatar_url
            )
        `)
        .single();

    if (error) {
        console.error("Create comment error:", error);
        return { error: "发表评论失败" };
    }

    // 处理普通用户的 @ 提及通知
    const rawCommentText = extractRawTextFromContent(cleanContent);
    const regularUserMentions = mentions.filter(
        (m) => !m.is_ai && m.id !== user.id && m.id !== "00000000-0000-0000-0000-0000000000a1"
    );

    if (regularUserMentions.length > 0) {
        const { data: postInfo } = await supabase
            .from("posts")
            .select("title")
            .eq("id", data.postId)
            .single();

        const postTitle = postInfo?.title || "学术讨论";
        const snippet = rawCommentText.slice(0, 60);

        // 批量写入通知
        const notifications = regularUserMentions.map((m) => ({
            user_id: m.id,
            type: "mention",
            title: "有人在评论中提及了你",
            content: `${profile?.username || "有学者"} 在《${postTitle}》中提及了你: "${snippet}"`,
            related_id: data.postId,
            from_user_id: user.id,
        }));

        supabase.from("notifications").insert(notifications).then(({ error: notifErr }) => {
            if (notifErr) console.error("发送提及通知失败:", notifErr);
        });
    }

    revalidatePath(`/posts/${data.postId}`);
    return {
        data: comment,
        moderation,
        hasAiMention,
        aiPrompt: rawCommentText,
    };
}

// 删除评论
export async function deleteComment(commentId: string, postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 先获取评论内容，用于提取图片 URL
    const { data: comment } = await supabase
        .from("comments")
        .select("author_id, content")
        .eq("id", commentId)
        .single();

    if (!comment) {
        return { error: "评论不存在" };
    }

    if (comment.author_id !== user.id) {
        return { error: "无权删除此评论" };
    }

    // 提取评论中的所有图片 URL
    const imageUrls = extractImageUrls(comment.content as JSONContentNode);

    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

    if (error) {
        console.error("Delete comment error:", error);
        return { error: "删除评论失败" };
    }

    // 清理评论中的所有图片（异步执行，不阻塞响应）
    if (imageUrls.length > 0) {
        console.log(`[deleteComment] 正在清理评论中的 ${imageUrls.length} 个图片...`);
        deleteImages(imageUrls).catch((err) => {
            console.error("[deleteComment] 清理图片失败:", err);
        });
    }

    revalidatePath(`/posts/${postId}`);
    return { success: true };
}

// 获取当前用户对帖子的互动状态
export async function getPostInteractionStatus(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { isLiked: false, isBookmarked: false };
    }

    const [likeResult, bookmarkResult] = await Promise.all([
        supabase
            .from("likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("post_id", postId)
            .single(),
        supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("post_id", postId)
            .single(),
    ]);

    return {
        isLiked: !!likeResult.data,
        isBookmarked: !!bookmarkResult.data,
    };
}

// 获取当前用户对评论的点赞状态
export async function getCommentLikeStatus(commentIds: string[]) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || commentIds.length === 0) {
        return {};
    }

    const { data: likes } = await supabase
        .from("likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds);

    const likedComments: Record<string, boolean> = {};
    (likes || []).forEach((like) => {
        if (like.comment_id) {
            likedComments[like.comment_id] = true;
        }
    });

    return likedComments;
}

// 评论排序类型
export type CommentSortType = "hot" | "newest" | "oldest";

// 根据排序方式获取评论
export async function getCommentsSorted(
    postId: string,
    sortBy: CommentSortType = "hot"
) {
    const supabase = await createClient();

    let orderColumn: string;
    let ascending: boolean;

    switch (sortBy) {
        case "hot":
            orderColumn = "like_count";
            ascending = false;
            break;
        case "newest":
            orderColumn = "created_at";
            ascending = false;
            break;
        case "oldest":
            orderColumn = "created_at";
            ascending = true;
            break;
    }

    // 获取顶级评论 (按排序方式)
    const { data: topLevelComments } = await supabase
        .from("comments")
        .select(`
            *,
            author:profiles!author_id (
                id, username, avatar_url
            )
        `)
        .eq("post_id", postId)
        .is("parent_id", null)
        .order(orderColumn, { ascending });

    // 获取所有回复 (回复始终按时间升序)
    const { data: replies } = await supabase
        .from("comments")
        .select(`
            *,
            author:profiles!author_id (
                id, username, avatar_url
            )
        `)
        .eq("post_id", postId)
        .not("parent_id", "is", null)
        .order("created_at", { ascending: true });

    // 构建嵌套结构
    const commentMap = new Map();
    topLevelComments?.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });
    replies?.forEach(reply => {
        const parent = commentMap.get(reply.parent_id);
        if (parent) {
            parent.replies.push({ ...reply, replies: [] });
        }
    });

    return Array.from(commentMap.values());
}

// 删除帖子（仅作者可删除）
export async function deletePost(postId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "请先登录" };
    }

    // 验证是否为帖子作者并获取内容
    const { data: post } = await supabase
        .from("posts")
        .select("author_id, content")
        .eq("id", postId)
        .single();

    if (!post) {
        return { error: "帖子不存在" };
    }

    if (post.author_id !== user.id) {
        return { error: "无权删除此帖子" };
    }

    // 提取帖子中的所有图片 URL
    const imageUrls = extractImageUrls(post.content as JSONContentNode);

    // 删除帖子（相关的评论、点赞等会通过 CASCADE 自动删除）
    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

    if (error) {
        console.error("Delete post error:", error);
        return { error: "删除帖子失败" };
    }

    // 清理帖子中的所有图片（异步执行，不阻塞响应）
    if (imageUrls.length > 0) {
        console.log(`[deletePost] 正在清理帖子中的 ${imageUrls.length} 个图片...`);
        deleteImages(imageUrls).catch((err) => {
            console.error("[deletePost] 清理图片失败:", err);
        });
    }

    revalidatePath("/dashboard");
    return { success: true };
}



