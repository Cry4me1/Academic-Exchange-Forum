import { createClient, createPublicClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SCHOLARLY_AI_USER = {
    id: "00000000-0000-0000-0000-0000000000a1",
    username: "Scholarly AI",
    avatar_url: "/scholarly-ai-avatar.jpg",
    bio: "Scholarly 官方学术智能助手，随时为你推导公式、解答学术难题。",
    special_title: "学术智能体",
    vip_level: 6,
    is_verified: true,
    is_ai: true,
    relationship: "ai" as const,
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawQuery = searchParams.get("q") || "";
        const query = rawQuery.trim().toLowerCase();
        const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 30);

        const results: any[] = [];

        // 判定是否匹配 Scholarly AI（支持 fuzzy 关键词）
        const matchesAi =
            !query ||
            "scholarly ai".includes(query) ||
            "scholarlyai".includes(query.replace(/\s+/g, "")) ||
            query.includes("ai") ||
            query.includes("学术") ||
            query.includes("助手") ||
            query.includes("智能") ||
            query.includes("智脑");

        if (matchesAi) {
            results.push(SCHOLARLY_AI_USER);
        }

        // 分支 A：带关键词搜索 -> 使用无 Cookie 负担的 publicClient 单次极速拉取
        if (query) {
            const publicClient = createPublicClient();
            // 在 username, special_title, academic_title, bio 进行多字段模糊匹配
            const filterClause = [
                `username.ilike.%${query}%`,
                `special_title.ilike.%${query}%`,
                `academic_title.ilike.%${query}%`,
                `bio.ilike.%${query}%`,
            ].join(",");

            const { data: profiles, error: searchError } = await publicClient
                .from("profiles")
                .select("id, username, avatar_url, special_title, academic_title, vip_level, is_verified, bio")
                .neq("id", SCHOLARLY_AI_USER.id)
                .or(filterClause)
                .limit(limit);

            if (!searchError && profiles) {
                for (const p of profiles) {
                    results.push({
                        id: p.id,
                        username: (p.username || "学者").trim(),
                        avatar_url: p.avatar_url,
                        special_title: p.special_title,
                        academic_title: p.academic_title,
                        vip_level: p.vip_level,
                        is_verified: p.is_verified,
                        bio: p.bio,
                        is_ai: false,
                        relationship: "user",
                    });
                }
            }

            return NextResponse.json(results, {
                headers: {
                    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
                },
            });
        }

        // 分支 B：空查询（预热或刚打 @），获取当前用户好友 + 活跃学者
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let friendIds: string[] = [];
        if (user) {
            const { data: friendships } = await supabase
                .from("friendships")
                .select("requester_id, addressee_id")
                .eq("status", "accepted")
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
                .limit(20);

            if (friendships) {
                friendIds = friendships.map((f) =>
                    f.requester_id === user.id ? f.addressee_id : f.requester_id
                );
            }
        }

        // 优先好友，其次活跃学者（按声望排序）
        let profilesQuery = supabase
            .from("profiles")
            .select("id, username, avatar_url, special_title, academic_title, vip_level, is_verified, bio")
            .neq("id", SCHOLARLY_AI_USER.id)
            .order("reputation_score", { ascending: false })
            .limit(limit);

        if (user) {
            profilesQuery = profilesQuery.neq("id", user.id);
        }

        const { data: profiles, error: profilesError } = await profilesQuery;

        if (!profilesError && profiles) {
            // 对候选人进行排序：好友优先展示
            const sortedProfiles = [...profiles].sort((a, b) => {
                const aIsFriend = friendIds.includes(a.id) ? 1 : 0;
                const bIsFriend = friendIds.includes(b.id) ? 1 : 0;
                return bIsFriend - aIsFriend;
            });

            for (const p of sortedProfiles) {
                const isFriend = friendIds.includes(p.id);
                results.push({
                    id: p.id,
                    username: (p.username || "学者").trim(),
                    avatar_url: p.avatar_url,
                    special_title: p.special_title,
                    academic_title: p.academic_title,
                    vip_level: p.vip_level,
                    is_verified: p.is_verified,
                    bio: p.bio,
                    is_ai: false,
                    relationship: isFriend ? "friend" : "user",
                });
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("[MentionSearch] Error:", error);
        return NextResponse.json([SCHOLARLY_AI_USER], { status: 200 });
    }
}
