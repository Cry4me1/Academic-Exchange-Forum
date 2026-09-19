import { createClient } from "@/lib/supabase/server";
import { getPosts } from "@/app/(protected)/posts/actions";
import DashboardClient from "./DashboardClient";
import type { DashboardInitialData } from "./DashboardClient";

export default async function DashboardPage() {
    const supabase = await createClient();

    // 仅获取一次用户会话
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return <DashboardClient initialData={{
            user: { id: "", username: null, email: null, avatar_url: null, created_at: new Date().toISOString() },
            creditBalance: 0,
            initialPosts: [],
        }} />;
    }

    // 服务端同域极速并行获取：个人资料 + 积分 + 首屏首批帖子！
    // 客户端直接直出帖子，彻底消灭客户端发起耗时 2.6 秒的 POST /dashboard 请求！
    const [profileRes, creditsRes, postsRes] = await Promise.all([
        supabase
            .from("profiles")
            .select("username, email, avatar_url")
            .eq("id", user.id)
            .single(),
        supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", user.id)
            .single(),
        getPosts({ filter: "latest", limit: 12, page: 1 }).catch(() => ({ posts: [] })),
    ]);

    let profile = profileRes.data;

    // 如果 profile 尚未初始化，自动补全
    if (!profile) {
        const newProfile = {
            id: user.id,
            email: user.email || null,
            username: user.email?.split("@")[0] || "User",
            avatar_url: "",
        };
        await supabase.from("profiles").insert([newProfile]);
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
        creditBalance: creditsRes.data?.balance ?? 0,
        initialPosts: (postsRes.posts || []) as any[],
    };

    return <DashboardClient initialData={initialData} />;
}
