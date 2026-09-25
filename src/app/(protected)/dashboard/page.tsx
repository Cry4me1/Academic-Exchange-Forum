import { createClient } from "@/lib/supabase/server";
import { getPosts } from "@/app/(protected)/posts/actions";
import DashboardClient from "./DashboardClient";
import type { DashboardInitialData } from "./DashboardClient";

// 服务端帖子拉取超时上限（毫秒）：
// 若跨海连接或冷启动超过此时间，立即安全熔断降级为空数组，避免拖慢 SSR 甚至引发网关 502 报错
const POSTS_SSR_TIMEOUT_MS = 1200;

export default async function DashboardPage() {
    let supabase;
    let user = null;

    try {
        supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
    } catch (authError) {
        console.warn("[DashboardPage] 获取用户会话异常:", authError);
    }

    // 若未获取到有效用户会话，返回安全初始状态（保护中间件已做重定向拦截，此为双重保险）
    if (!user || !supabase) {
        return (
            <DashboardClient
                initialData={{
                    user: { id: "", username: null, email: null, avatar_url: null, created_at: new Date().toISOString() },
                    creditBalance: 0,
                    initialPosts: [],
                }}
            />
        );
    }

    let profile: any = null;
    let creditBalance = 0;
    let initialPosts: any[] = [];

    try {
        // 安全超时熔断：若 1.2 秒内未完成，直接降级为空，由客户端异步骨架屏继续平滑加载
        const fetchPostsWithTimeout = Promise.race([
            getPosts({ filter: "latest", limit: 12, page: 1 }),
            new Promise<{ posts: any[] }>((resolve) =>
                setTimeout(() => resolve({ posts: [] }), POSTS_SSR_TIMEOUT_MS)
            ),
        ]).catch((err) => {
            console.warn("[DashboardPage] getPosts SSR 降级:", err);
            return { posts: [] };
        });

        const [profileRes, creditsRes, postsRes] = await Promise.all([
            supabase
                .from("profiles")
                .select("username, email, avatar_url")
                .eq("id", user.id)
                .maybeSingle(),
            supabase
                .from("user_credits")
                .select("balance")
                .eq("user_id", user.id)
                .maybeSingle(),
            fetchPostsWithTimeout,
        ]);

        profile = profileRes?.data || null;
        creditBalance = creditsRes?.data?.balance ?? 0;
        initialPosts = (postsRes?.posts || []) as any[];
    } catch (queryError) {
        console.warn("[DashboardPage] 服务端预取数据异常，降级回退:", queryError);
    }

    // 如果 profile 尚未初始化，自动安全补全
    if (!profile) {
        const newProfile = {
            id: user.id,
            email: user.email || null,
            username: user.email?.split("@")[0] || "User",
            avatar_url: "",
        };
        try {
            await supabase.from("profiles").insert([newProfile]).maybeSingle();
        } catch {
            // 忽略并发插入可能带来的冲突
        }
        profile = newProfile;
    }

    const initialData: DashboardInitialData = {
        user: {
            id: user.id,
            username: profile.username,
            email: profile.email,
            avatar_url: profile.avatar_url,
            created_at: user.created_at,
        },
        creditBalance,
        initialPosts,
    };

    return <DashboardClient initialData={initialData} />;
}
