import { cookies } from "next/headers";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { CursorFollower } from "@/components/landing/cursor-follower";
import { getCachedLandingShowcase, getCachedStats } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * 轻量判定当前访客是否已登录：
 * - 匿名访客无 sb- Cookie，0ms 直接返回 false，不触发任何额外鉴权网络请求；
 * - 携带会话 Cookie 时通过 Supabase SSR Client 校验真实登录态。
 */
async function resolveIsAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith("sb-"));
    if (!hasAuthCookie) return false;

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}

export default async function Home() {
  const [stats, showcase, isAuthenticated] = await Promise.all([
    getCachedStats(),
    getCachedLandingShowcase(),
    resolveIsAuthenticated(),
  ]);

  return (
    <main className="min-h-screen relative">
      {/* 极度丝滑的 Lerp 全局光标跟随特效 */}
      <CursorFollower />

      <Hero
        postsCount={stats.postsCount}
        tagsCount={stats.tagsCount}
        usersCount={stats.usersCount}
        isAuthenticated={isAuthenticated}
        hotTopics={showcase.heroPosts}
      />
      <Features posts={showcase.showcasePosts} />
      <Footer isAuthenticated={isAuthenticated} />
    </main>
  );
}
