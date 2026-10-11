"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================
// 查询当前用户积分余额
// ============================================
export async function getMyCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录", balance: 0, totalSpent: 0, totalRecharged: 0, vipLevel: 1 };
    }

    // [新增] 每次获取用户积分时，触发一次“当月奖励检查”
    // 这个操作是懒加载的，RPC 内部会判断如果当月已领取就不再操作
    await supabase.rpc("claim_monthly_bonus");

    const { data, error } = await supabase
        .from("user_credits")
        .select("balance, total_spent, total_recharged")
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        // 如果还没有记录, 返回 0
        return { balance: 0, totalSpent: 0, totalRecharged: 0, vipLevel: 1, scholarLevel: 1 };
    }

    // 获取 profiles 中的学者等级与三维学术数据
    const { data: profile } = await supabase
        .from("profiles")
        .select("vip_level, vip_title, scholar_exp, valid_post_count, total_likes_received, community_contributions_count, duel_wins")
        .eq("id", user.id)
        .single();

    let scholarExp = profile?.scholar_exp ?? 0;
    let validPostCount = profile?.valid_post_count ?? 0;
    let totalLikesReceived = profile?.total_likes_received ?? 0;
    let communityContributionsCount = profile?.community_contributions_count ?? 0;

    // 若数据库字段尚未初始化或全为 0，进行即时聚合计算
    if (scholarExp === 0 && validPostCount === 0 && totalLikesReceived === 0) {
        try {
            // 1. 统计发帖数
            const { count: postCount } = await supabase
                .from("posts")
                .select("id", { count: "exact", head: true })
                .eq("author_id", user.id)
                .eq("is_published", true);

            // 2. 统计主帖点赞与评论点赞
            const { data: userPosts } = await supabase
                .from("posts")
                .select("like_count")
                .eq("author_id", user.id);
            const postLikes = (userPosts || []).reduce((acc, p) => acc + (p.like_count || 0), 0);

            const { data: userComments } = await supabase
                .from("comments")
                .select("like_count, is_accepted")
                .eq("author_id", user.id);
            const commentLikes = (userComments || []).reduce((acc, c) => acc + (c.like_count || 0), 0);
            const acceptedCount = (userComments || []).filter((c) => c.is_accepted).length;

            // 3. 统计同行评审
            const { count: peerReviewCount } = await supabase
                .from("peer_reviews")
                .select("id", { count: "exact", head: true })
                .eq("reviewer_id", user.id);

            const duelWins = profile?.duel_wins || 0;

            validPostCount = postCount || 0;
            totalLikesReceived = postLikes + commentLikes;
            communityContributionsCount = acceptedCount + (peerReviewCount || 0) + duelWins;

            scholarExp = (validPostCount * 15) 
                + (postLikes * 5) 
                + (commentLikes * 3) 
                + (acceptedCount * 30) 
                + ((peerReviewCount || 0) * 25) 
                + (duelWins * 20);

            // 保底当前等级门槛经验，避免出现“等级是最高级 Lv6 但经验条全空为 0”的脱节
            const currentLvl = profile?.vip_level ?? 1;
            const minExpThresholds: Record<number, number> = { 1: 0, 2: 100, 3: 400, 4: 1200, 5: 3000, 6: 8000 };
            if (scholarExp < (minExpThresholds[currentLvl] ?? 0)) {
                scholarExp = Math.max(scholarExp, minExpThresholds[currentLvl] ?? 0);
            }
        } catch (e) {
            console.error("Auto calculate scholar stats error:", e);
        }
    }

    return {
        balance: data.balance,
        totalSpent: data.total_spent,
        totalRecharged: data.total_recharged,
        vipLevel: profile?.vip_level ?? 1,
        scholarLevel: profile?.vip_level ?? 1,
        vipTitle: profile?.vip_title ?? "Lv1",
        scholarExp,
        validPostCount,
        totalLikesReceived,
        communityContributionsCount,
    };
}

// ============================================
// 查询当前用户消费流水
// ============================================
export async function getMyTransactions(limit = 20, offset = 0) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "请先登录", transactions: [] };
    }

    const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, amount, type, description, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("获取流水失败:", error);
        return { error: "获取流水失败", transactions: [] };
    }

    return { transactions: data || [] };
}

// ============================================
// 购买积分（支付渠道尚未接入，fail-closed）
// ============================================
export async function purchaseCredits(
    _planId: string
): Promise<{ error: string; newBalance?: number }> {
    // 支付渠道未接入（CreditRechargeDialog 的购买按钮为 disabled）。
    // 积分发放只能由支付回调 Webhook 以 service_role 调用 add_user_credits 完成，
    // 禁止用户会话直接铸造积分（P0-2 修复后 add_user_credits 仅 service_role 可调用）。
    return { error: "支付功能即将上线，暂不支持直接充值" };
}
