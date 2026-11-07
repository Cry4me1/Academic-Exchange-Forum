"use server";

import { createClient } from "@/lib/supabase/server";

export interface PostRevisionListItem {
    id: string;
    revision_number: number;
    title: string;
    tags: string[];
    edit_summary: string | null;
    created_at: string;
    editor: {
        id: string;
        username: string;
        avatar_url: string | null;
    } | null;
}

export interface PostRevision extends PostRevisionListItem {
    content: object;
}

/**
 * 内部校验函数：验证用户是否具备查看该帖历史版本的权限
 * 规则：帖子原作者本人、系统管理员、或达到学者等级 Lv3 及以上
 */
async function verifyRevisionAccess(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            allowed: false,
            error: "需要登录并达到学者等级 Lv3 及以上方可追溯对比帖子历史版本",
            code: "REQUIRES_SCHOLAR_LV3" as const,
            userLevel: 1,
        };
    }

    const [{ data: post }, { data: profile }, { data: adminRole }] = await Promise.all([
        supabase.from("posts").select("author_id").eq("id", postId).maybeSingle(),
        supabase.from("profiles").select("vip_level").eq("id", user.id).maybeSingle(),
        supabase.from("admin_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);

    const isPostAuthor = !!post && post.author_id === user.id;
    const isAdmin = !!adminRole;
    const userLevel = profile?.vip_level ?? 1;

    if (!isPostAuthor && !isAdmin && userLevel < 3) {
        return {
            allowed: false,
            error: `帖子历史版本追溯对比需学者等级达到 Lv3 解锁（您当前为 Lv${userLevel}）`,
            code: "REQUIRES_SCHOLAR_LV3" as const,
            userLevel,
        };
    }

    return { allowed: true, supabase, userLevel };
}

// 获取帖子的所有历史版本列表
export async function getPostRevisions(postId: string) {
    const access = await verifyRevisionAccess(postId);
    if (!access.allowed || !access.supabase) {
        return { error: access.error, code: access.code, userLevel: access.userLevel };
    }

    const { data, error } = await access.supabase
        .from("post_revisions")
        .select(
            `
      id,
      revision_number,
      title,
      tags,
      edit_summary,
      created_at,
      editor:profiles!editor_id (
        id,
        username,
        avatar_url
      )
    `
        )
        .eq("post_id", postId)
        .order("revision_number", { ascending: false });

    if (error) {
        console.error("Get revisions error:", error);
        return { error: "获取历史版本失败" };
    }

    // 处理 Supabase 返回的数据格式（editor 可能是数组）
    const formattedData = (data || []).map((item: any) => ({
        ...item,
        editor: Array.isArray(item.editor) ? item.editor[0] : item.editor,
    })) as PostRevisionListItem[];

    return { data: formattedData };
}

// 获取单个版本的完整内容
export async function getRevisionContent(revisionId: string) {
    const supabase = await createClient();

    const { data: revMeta } = await supabase
        .from("post_revisions")
        .select("post_id")
        .eq("id", revisionId)
        .maybeSingle();

    if (revMeta?.post_id) {
        const access = await verifyRevisionAccess(revMeta.post_id);
        if (!access.allowed) {
            return { error: access.error, code: access.code };
        }
    }

    const { data, error } = await supabase
        .from("post_revisions")
        .select("*")
        .eq("id", revisionId)
        .single();

    if (error) {
        console.error("Get revision content error:", error);
        return { error: "获取版本内容失败" };
    }

    return { data };
}

// 获取两个版本的内容用于对比
export async function getRevisionDiff(postId: string, revisionNumber: number) {
    const access = await verifyRevisionAccess(postId);
    if (!access.allowed || !access.supabase) {
        return { error: access.error, code: access.code };
    }

    const supabase = access.supabase;

    // 获取指定版本
    const { data: oldRevision, error: oldError } = await supabase
        .from("post_revisions")
        .select("*")
        .eq("post_id", postId)
        .eq("revision_number", revisionNumber)
        .single();

    if (oldError) {
        console.error("Get old revision error:", oldError);
        return { error: "获取历史版本失败" };
    }

    // 获取下一个版本
    const { data: newRevision } = await supabase
        .from("post_revisions")
        .select("*")
        .eq("post_id", postId)
        .eq("revision_number", revisionNumber + 1)
        .single();

    // 如果没有下一个版本，获取当前帖子内容
    if (!newRevision) {
        const { data: currentPost, error: postError } = await supabase
            .from("posts")
            .select("title, content, tags, updated_at")
            .eq("id", postId)
            .single();

        if (postError) {
            console.error("Get current post error:", postError);
            return { error: "获取当前版本失败" };
        }

        return {
            data: {
                old: oldRevision,
                new: {
                    ...currentPost,
                    revision_number: revisionNumber + 1,
                    is_current: true,
                    created_at: currentPost.updated_at,
                },
            },
        };
    }

    return {
        data: {
            old: oldRevision,
            new: newRevision,
        },
    };
}

// 获取帖子的版本数量
export async function getRevisionCount(postId: string) {
    const supabase = await createClient();

    const { count, error } = await supabase
        .from("post_revisions")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

    if (error) {
        return { count: 0 };
    }

    return { count: count || 0 };
}
