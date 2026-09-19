import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import type { DashboardInitialData } from "./DashboardClient";

/**
 * Dashboard 服务端页面
 * 在 Vercel Edge (东京) 上预获取用户数据，避免客户端跨海请求
 * 
 * 性能提升:
 *   之前: 用户浏览器(中国) → Supabase(东京) × 3次 = 300-900ms
 *   现在: Vercel Edge(东京) → Supabase(东京) × 2次 = 10-30ms (同区域)
 */
export default async function DashboardPage() {
    const supabase = await createClient();

    // 仅获取一次用户会话
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return <DashboardClient initialData={{
            user: { id: "", username: null, email: null, avatar_url: null, created_at: new Date().toISOString() },
            creditBalance: 0
        }} />;
    }

    // 仅发起一次紧凑的并行查询，避免串行执行 4 次往返和耗时的 monthly_bonus RPC
    const [profileRes, creditsRes] = await Promise.all([
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
    };

    return <DashboardClient initialData={initialData} />;
}
