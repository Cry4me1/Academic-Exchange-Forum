"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { moderatePostContent } from "@/lib/moderation/engine";
import { sendPendingReviewEmail } from "@/lib/email";
import { syncPostLinks } from "@/lib/post-links";
import { generatePostEmbedding } from "@/lib/post-embed";
import { extractAcademicMeta } from "@/lib/academic-meta";

// ============================================
// 研究室 CRUD
// ============================================

export async function createLabRoom(formData: {
    name: string;
    description?: string;
    room_type: "reading" | "whiteboard" | "hybrid";
    max_members: number;
    access_code?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const insertData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || null,
        room_type: formData.room_type,
        max_members: formData.max_members,
        created_by: user.id,
    };

    // 如有访问码，保存访问密码凭证
    if (formData.access_code?.trim()) {
        insertData.access_code_hash = formData.access_code.trim();
    }

    const { data, error } = await supabase
        .from("lab_rooms")
        .insert(insertData)
        .select("id")
        .single();

    if (error || !data) {
        console.error("创建研究室失败:", error);
        return { error: "创建研究室失败，请重试" };
    }

    // 将创建者自动加入成员列表，并赋予 owner 权限
    const { error: memberError } = await supabase
        .from("lab_members")
        .insert({
            room_id: data.id,
            user_id: user.id,
            role: "owner",
        });

    if (memberError) {
        console.error("初始化研究室创建者身份失败:", memberError);
    }

    revalidatePath("/lab");
    return { data };
}

export async function getMyLabRooms() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录", data: [] };

    // 获取当前用户作为成员参与的所有房间 IDs
    const { data: membershipRows } = await supabase
        .from("lab_members")
        .select("room_id")
        .eq("user_id", user.id);

    const joinedRoomIds = (membershipRows || []).map((m) => m.room_id);

    let query = supabase
        .from("lab_rooms")
        .select(`
            *,
            lab_members(count),
            lab_post_links(count)
        `)
        .order("updated_at", { ascending: false });

    if (joinedRoomIds.length > 0) {
        query = query.or(`created_by.eq.${user.id},id.in.(${joinedRoomIds.join(",")})`);
    } else {
        query = query.eq("created_by", user.id);
    }

    const { data, error } = await query;

    if (error) {
        console.error("获取研究室列表失败:", error);
        return { error: "获取列表失败", data: [] };
    }

    // 统计各房间产出的学术长帖成果数量
    const roomIds = (data || []).map((r) => r.id);
    const outputCounts: Record<string, number> = {};

    if (roomIds.length > 0) {
        try {
            const { data: directOutputs } = await supabase
                .from("posts")
                .select("id, origin_lab_room_id")
                .in("origin_lab_room_id", roomIds)
                .eq("is_published", true);

            (directOutputs || []).forEach((item: any) => {
                if (item.origin_lab_room_id) {
                    outputCounts[item.origin_lab_room_id] = (outputCounts[item.origin_lab_room_id] || 0) + 1;
                }
            });
        } catch (e) {
            console.warn("查询 posts.origin_lab_room_id 异常（可能迁移未完成）:", e);
        }

        // 兼容从 post_co_authors 中检索关联的房间成果
        try {
            const { data: coAuthorOutputs } = await supabase
                .from("post_co_authors")
                .select("post_id, lab_room_id")
                .in("lab_room_id", roomIds);

            const seenPostRoom = new Set<string>();
            (coAuthorOutputs || []).forEach((ca: any) => {
                const key = `${ca.lab_room_id}_${ca.post_id}`;
                if (ca.lab_room_id && !seenPostRoom.has(key)) {
                    seenPostRoom.add(key);
                    if (!outputCounts[ca.lab_room_id]) {
                        outputCounts[ca.lab_room_id] = 1;
                    }
                }
            });
        } catch (e) {
            console.warn("查询 post_co_authors.lab_room_id 异常:", e);
        }
    }

    const enrichedData = (data || []).map((room) => ({
        ...room,
        output_count: outputCounts[room.id] || 0,
    }));

    return { data: enrichedData };
}

export async function getLabRoom(roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { data, error } = await supabase
        .from("lab_rooms")
        .select(`
            *,
            lab_members(
                id,
                role,
                joined_at,
                last_seen_at,
                user:profiles(id, username, avatar_url)
            ),
            lab_post_links(
                id,
                sort_order,
                created_at,
                post:posts!post_id(id, title, content, tags, author_id, like_count, comment_count, created_at,
                    author:profiles!author_id(id, username, avatar_url)
                )
            )
        `)
        .eq("id", roomId)
        .maybeSingle();

    if (error) {
        console.error("获取研究室详情失败:", error.message || error, error.details || "");
        return { error: error.message || "获取研究室详情失败" };
    }

    if (!data) {
        return { data: null };
    }

    return { data };
}

export async function deleteLabRoom(roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { error } = await supabase
        .from("lab_rooms")
        .delete()
        .eq("id", roomId);

    if (error) {
        console.error("删除研究室失败:", error);
        return { error: "删除失败，仅创建者可删除" };
    }

    revalidatePath("/lab");
    return { success: true };
}

export async function joinLabRoom(roomId: string, accessCode?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 检查房间是否存在并获取访问码
    const { data: room, error: roomError } = await supabase
        .from("lab_rooms")
        .select("id, access_code_hash, max_members")
        .eq("id", roomId)
        .maybeSingle();

    if (roomError || !room) {
        return { error: "研究室不存在" };
    }

    // 验证访问码
    if (room.access_code_hash && room.access_code_hash !== accessCode) {
        return { error: "访问码不正确" };
    }

    // 检查人数上限
    const { count } = await supabase
        .from("lab_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId);

    if (count && count >= room.max_members) {
        return { error: "研究室已满" };
    }

    // 加入
    const { error } = await supabase
        .from("lab_members")
        .insert({
            room_id: roomId,
            user_id: user.id,
            role: "editor",
        });

    if (error) {
        if (error.code === "23505") {
            return { error: "你已经是该研究室成员" };
        }
        console.error("加入研究室失败:", error);
        return { error: "加入失败，请重试" };
    }

    revalidatePath("/lab");
    revalidatePath(`/lab/${roomId}`);
    return { success: true };
}

// ============================================
// 帖子关联
// ============================================

export async function searchPostsForRoom(query: string, roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录", data: [] };

    // 获取已关联的帖子 IDs
    const { data: linked } = await supabase
        .from("lab_post_links")
        .select("post_id")
        .eq("room_id", roomId);

    const linkedIds = linked?.map((l) => l.post_id) || [];

    // 搜索帖子
    let queryBuilder = supabase
        .from("posts")
        .select("id, title, tags, like_count, comment_count, created_at, author:profiles!author_id(id, username, avatar_url)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);

    if (query.trim()) {
        queryBuilder = queryBuilder.ilike("title", `%${query}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
        console.error("搜索帖子失败:", error.message || error);
        return { error: "搜索失败", data: [] };
    }

    // 过滤掉已关联的
    const filtered = (data || []).filter((p) => !linkedIds.includes(p.id));
    return { data: filtered };
}

export async function addPostToRoom(roomId: string, postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 获取当前排序最大值
    const { data: existing } = await supabase
        .from("lab_post_links")
        .select("sort_order")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data: insertedLink, error } = await supabase
        .from("lab_post_links")
        .insert({
            room_id: roomId,
            post_id: postId,
            added_by: user.id,
            sort_order: nextOrder,
        })
        .select(`
            id,
            sort_order,
            created_at,
            post:posts!post_id(id, title, content, tags, author_id, like_count, comment_count, created_at,
                author:profiles!author_id(id, username, avatar_url)
            )
        `)
        .single();

    if (error) {
        if (error.code === "23505") {
            return { error: "该帖子已添加" };
        }
        console.error("添加帖子失败:", error);
        return { error: "添加失败" };
    }

    revalidatePath(`/lab/${roomId}`);
    return { success: true, data: insertedLink };
}

export async function removePostFromRoom(roomId: string, postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { error } = await supabase
        .from("lab_post_links")
        .delete()
        .eq("room_id", roomId)
        .eq("post_id", postId);

    if (error) {
        console.error("移除帖子失败:", error);
        return { error: "移除失败" };
    }

    revalidatePath(`/lab/${roomId}`);
    return { success: true };
}

// ============================================
// 共创发帖
// ============================================

export async function publishCoPost(data: {
    roomId: string;
    title: string;
    tags: string[];
    content: object;
    coAuthors: {
        userId: string;
        role: "co_author" | "contributor" | "annotator";
        contributionSummary?: string;
    }[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    // 1. 检查发帖用户是否被封禁或禁言
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, email, is_banned, is_muted, muted_until")
        .eq("id", user.id)
        .single();

    if (profile?.is_banned) {
        return { error: "您的账号已被封禁，无法发布研讨成果" };
    }

    if (profile?.is_muted) {
        const muteExpiry = profile.muted_until ? new Date(profile.muted_until) : null;
        if (!muteExpiry || muteExpiry > new Date()) {
            return { error: "您已被禁言，暂时无法发布研讨成果" };
        }
    }

    // 2. 执行敏感词 + AI 内容安全审核
    const moderation = await moderatePostContent({
        authorId: user.id,
        title: data.title,
        content: data.content,
        tags: data.tags,
    });

    // 若触发平台直接拦截（违规敏感词或高危严重违规）
    if (moderation.reviewStatus === "rejected") {
        return {
            error: moderation.errorMessage || "研讨成果未通过平台内容安全规范审核，请修改后重试",
            moderation,
        };
    }

    const isApproved = moderation.reviewStatus === "approved";
    const academicMeta = extractAcademicMeta(data.content);

    // 3. 构建帖子落库数据（包含完整审核与学术元数据）
    const insertPayload: Record<string, any> = {
        title: data.title,
        content: data.content,
        tags: data.tags,
        author_id: user.id,
        is_published: isApproved,
        review_status: moderation.reviewStatus,
        ai_score: moderation.score,
        ai_risk_level: moderation.riskLevel,
        ai_reason: moderation.reason,
        ai_suggested_tags: moderation.suggestedTags,
        matched_sensitive_words: moderation.matchedSensitiveWords,
        academic_meta: academicMeta,
        theorem_count: academicMeta.totalAcademicCount,
        origin_lab_room_id: data.roomId,
    };

    let post: any = null;
    let postError: any = null;

    const res = await supabase
        .from("posts")
        .insert(insertPayload)
        .select("id, title, review_status, ai_score, ai_risk_level")
        .single();

    if (res.error && res.error.message?.includes("origin_lab_room_id")) {
        // 兼容降级：若数据库尚未执行对应迁移，则忽略该字段写入
        delete insertPayload.origin_lab_room_id;
        const retryRes = await supabase
            .from("posts")
            .insert(insertPayload)
            .select("id, title, review_status, ai_score, ai_risk_level")
            .single();
        post = retryRes.data;
        postError = retryRes.error;
    } else {
        post = res.data;
        postError = res.error;
    }

    if (postError || !post) {
        console.error("创建共创帖子失败:", postError);
        return { error: "发布失败，请重试" };
    }

    // 4. 插入共创者，登记 lab_room_id
    if (data.coAuthors.length > 0) {
        const coAuthorRows = data.coAuthors.map((ca) => ({
            post_id: post.id,
            user_id: ca.userId,
            role: ca.role,
            contribution_summary: ca.contributionSummary || null,
            lab_room_id: data.roomId,
        }));

        const { error: caError } = await supabase
            .from("post_co_authors")
            .insert(coAuthorRows);

        if (caError) {
            console.error("插入共创者失败:", caError);
            // 帖子已创建，不回滚，仅记录提示
        }
    }

    // 5. 若进入人工待审队列 (pending)，发送邮件通知管理员
    if (post?.id && moderation.reviewStatus === "pending") {
        sendPendingReviewEmail({
            postId: post.id,
            title: data.title,
            content: data.content,
            tags: data.tags,
            author: {
                id: user.id,
                username: profile?.username,
                email: profile?.email || user.email,
            },
            moderation: {
                score: moderation.score,
                riskLevel: moderation.riskLevel,
                reason: moderation.reason,
                suggestedTags: moderation.suggestedTags,
                matchedSensitiveWords: moderation.matchedSensitiveWords,
                latencyMs: moderation.latencyMs,
            },
        }).catch((mailErr) => {
            console.error("[publishCoPost] 发送待人工审核通知邮件失败:", mailErr);
        });
    }

    // 6. 审核通过时，同步双向链接与生成 Embedding 向量
    if (post?.id && isApproved) {
        await syncPostLinks(supabase, post.id, data.content).catch((err) => {
            console.error("[publishCoPost] 同步双向链接失败:", err);
        });
        await generatePostEmbedding(post.id).catch((err) => {
            console.error("[publishCoPost] 同步生成 Embedding 向量失败:", err);
        });
    }

    revalidatePath("/dashboard");
    revalidatePath("/lab");
    revalidatePath(`/lab/${data.roomId}`);
    return {
        data: {
            id: post.id,
            title: post.title,
            review_status: moderation.reviewStatus,
            ai_score: moderation.score,
            ai_risk_level: moderation.riskLevel,
        },
        moderation,
    };
}


// ============================================
// 实验室产出成果检索
// ============================================

export async function getLabOutputs(roomId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录", data: [] };

    const postIds: string[] = [];

    // 1. 通过 origin_lab_room_id 查询
    try {
        const { data: directPosts } = await supabase
            .from("posts")
            .select("id")
            .eq("origin_lab_room_id", roomId)
            .eq("is_published", true);

        if (directPosts) {
            postIds.push(...directPosts.map((p) => p.id));
        }
    } catch (e) {
        console.warn("查询 origin_lab_room_id 异常:", e);
    }

    // 2. 兼容从 post_co_authors 中补全
    try {
        const { data: coAuthorPosts } = await supabase
            .from("post_co_authors")
            .select("post_id")
            .eq("lab_room_id", roomId);

        if (coAuthorPosts) {
            postIds.push(...coAuthorPosts.map((p) => p.post_id));
        }
    } catch (e) {
        console.warn("查询 post_co_authors.lab_room_id 异常:", e);
    }

    const uniquePostIds = Array.from(new Set(postIds));
    if (uniquePostIds.length === 0) {
        return { data: [] };
    }

    // 3. 详细查询学术成果元数据
    const { data: posts, error } = await supabase
        .from("posts")
        .select(`
            id,
            title,
            tags,
            view_count,
            like_count,
            comment_count,
            created_at,
            author_id,
            author:profiles!author_id(id, username, avatar_url),
            post_co_authors(
                id,
                role,
                contribution_summary,
                user:profiles!user_id(id, username, avatar_url)
            )
        `)
        .in("id", uniquePostIds)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("获取实验室成果失败:", error);
        return { error: "获取实验室成果失败", data: [] };
    }

    return { data: posts || [] };
}

// ============================================
// 研讨室模式热切换
// ============================================

export async function updateLabRoomType(roomId: string, roomType: "reading" | "whiteboard" | "hybrid") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { data: member } = await supabase
        .from("lab_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();

    const { data: room } = await supabase
        .from("lab_rooms")
        .select("created_by")
        .eq("id", roomId)
        .maybeSingle();

    const isAuthorized = room?.created_by === user.id || member?.role === "owner" || member?.role === "admin";
    if (!isAuthorized) {
        return { error: "无权更改研讨室模式" };
    }

    const { error } = await supabase
        .from("lab_rooms")
        .update({ room_type: roomType, updated_at: new Date().toISOString() })
        .eq("id", roomId);

    if (error) {
        console.error("更新研讨室模式失败:", error);
        return { error: "更新失败，请重试" };
    }

    revalidatePath(`/lab/${roomId}`);
    revalidatePath("/lab");
    return { success: true };
}
