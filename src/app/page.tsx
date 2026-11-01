import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { CursorFollower } from "@/components/landing/cursor-follower";
import { getCachedLandingShowcase, getCachedStats } from "@/lib/cache";

// 启用 ISR 静态重新验证（60秒），解除对 Cookie 的强依赖，恢复全站与落地页 CDN 边缘 0ms 极速静态缓存
export const revalidate = 60;

export default async function Home() {
  const [stats, showcase] = await Promise.all([
    getCachedStats(),
    getCachedLandingShowcase(),
  ]);

  return (
    <main className="min-h-screen relative">
      {/* 极度丝滑的 Lerp 全局光标跟随特效 */}
      <CursorFollower />

      <Hero
        postsCount={stats.postsCount}
        tagsCount={stats.tagsCount}
        usersCount={stats.usersCount}
        hotTopics={showcase.heroPosts}
      />
      <Features posts={showcase.showcasePosts} />
      <Footer />
    </main>
  );
}
