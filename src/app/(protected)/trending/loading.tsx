import { Skeleton } from "@/components/ui/skeleton";

/**
 * 热门学术页加载骨架屏
 */
export default function TrendingLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full border-0 shadow-sm" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-4 w-52 rounded-full" />
          </div>
        </div>

        {/* 排序 Tabs 滑轨骨架 */}
        <div className="inline-flex items-center p-1 rounded-full border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_4px_16px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_4px_16px_-2px_rgba(0,0,0,0.3)] gap-1">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* 帖子列表骨架屏 */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06),0_8px_32px_-4px_rgba(0,0,0,0.3)] p-5"
            >
              <div className="flex items-start gap-4">
                {/* 排名标骨架 */}
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />

                <div className="flex-1 min-w-0 space-y-3">
                  {/* 分类标签 */}
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>

                  {/* 标题与摘要 */}
                  <Skeleton className="h-5 w-3/4 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-2/3 rounded-full" />

                  {/* 微光渐变消融缝 */}
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-zinc-800/60 to-transparent pt-1" />

                  {/* 底部元数据 */}
                  <div className="flex items-center gap-4 pt-1">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
