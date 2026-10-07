import Link from "next/link";
import { Compass, FlaskConical, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="relative min-h-[85vh] w-full flex items-center justify-center p-4 overflow-hidden">
            {/* 灵动环境光晕背景 */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-70 animate-pulse" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl opacity-50" />

            {/* Apple Liquid Glass 无边框曲面质感卡片 */}
            <div className="relative z-10 w-full max-w-lg p-8 sm:p-10 rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.85)] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] text-center flex flex-col items-center">
                {/* 漂浮图标胶囊 */}
                <div className="h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-6 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                    <Compass className="h-8 w-8 animate-spin [animation-duration:12s]" />
                </div>

                {/* 状态徽标 */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium border-0 bg-zinc-100/80 dark:bg-zinc-800/80 text-muted-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    404 · 坐标未匹配
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
                    学术空间坐标已偏移
                </h1>

                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-8">
                    您请求的研究室、文献或页面可能已被解散、移动或暂时不存在。请核对访问地址或通过下方指引返回。
                </p>

                {/* 渐变消融微光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-8" />

                {/* 物理光感导航胶囊群 */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                    <Link
                        href="/lab"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all active:scale-[0.98]"
                    >
                        <FlaskConical className="h-4 w-4" />
                        共创实验室
                    </Link>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-foreground bg-white/70 dark:bg-zinc-800/70 hover:bg-white/90 dark:hover:bg-zinc-800/90 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                    >
                        <Home className="h-4 w-4" />
                        返回广场
                    </Link>
                </div>
            </div>
        </div>
    );
}
