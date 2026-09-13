import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard 加载骨架屏
 * 利用 React Suspense Streaming SSR，用户在数据到达前先看到布局轮廓
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/40 text-foreground antialiased">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-50 border-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-[inset_0_-1px_0.5px_rgba(255,255,255,0.85),0_4px_24px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_-1px_0.5px_rgba(255,255,255,0.08),0_4px_24px_-2px_rgba(0,0,0,0.3)]">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7.5 w-7.5 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-9 w-64 rounded-full hidden md:block" />
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8.5 w-8.5 rounded-full" />
              <Skeleton className="h-8.5 w-24 rounded-full hidden sm:block" />
              <Skeleton className="h-8.5 w-8.5 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区骨架 */}
      <main className="max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-10 py-8">
        <div className="flex gap-8 items-start">
          {/* 左侧栏骨架 */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-5">
            <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border-0 p-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-full" />
              ))}
            </div>
            <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border-0 p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-3">
              <Skeleton className="h-4 w-20 rounded-full" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </aside>

          {/* 中间内容骨架 */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Banner 骨架 */}
            <Skeleton className="h-28 w-full rounded-2xl" />

            {/* Tabs 骨架 */}
            <div className="h-11 w-full bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl rounded-full p-1 flex gap-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
              {[1, 2, 3, 4, 5].map((tab) => (
                <Skeleton key={tab} className="h-full flex-1 rounded-full" />
              ))}
            </div>

            {/* 帖子卡片骨架 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white/75 dark:bg-zinc-900/60 rounded-2xl border-0 p-5 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7.5 w-7.5 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-2/3 rounded-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧栏骨架 */}
          <aside className="hidden xl:block w-[340px] shrink-0 space-y-5">
            <Skeleton className="h-10 w-full rounded-full" />
            <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border-0 p-4 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <div className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border-0 p-4 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_8px_32px_-4px_rgba(0,0,0,0.4)]">
              <Skeleton className="h-4 w-20 rounded-full" />
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
