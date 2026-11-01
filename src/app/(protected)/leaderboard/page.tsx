"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Bookmark,
    Crown,
    FileText,
    Flame,
    Heart,
    Lock,
    Medal,
    Trophy,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type MouseEvent } from "react";
import {
    getContributionLeaderboard,
    getWeeklyBookmarkLeaderboard,
    getWeeklyLikeLeaderboard,
    type LeaderboardEntry,
} from "./actions";

// ============================================================
// 确定性种子随机数（避免 SSR 水合不匹配）
// ============================================================
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

const EMBER_COLORS = ["#f59e0b", "#fb923c", "#fbbf24", "#fde68a"];

// 预计算粒子数据，确保服务端/客户端一致
const EMBER_PARTICLES = Array.from({ length: 18 }).map((_, i) => {
    const s = (n: number) => seededRandom(i * 7 + n + 42);
    return {
        width: s(0) * 3.5 + 1.5,
        height: s(1) * 3.5 + 1.5,
        left: s(2) * 100,
        bottom: s(3) * 24,
        color: EMBER_COLORS[Math.floor(s(4) * 4)],
        delay: s(5) * 5,
        duration: 4 + s(6) * 4,
        opacity: s(7) * 0.55 + 0.15,
    };
});

// ============================================================
// 120fps 光随鼠动 DOM CSS 变量注入（零重渲染）
// ============================================================
function handleCardMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}

// ============================================================
// 双模通透光学氛围背景（Light 温润琥珀微光 / Dark 深邃暖金与轻盈星火）
// ============================================================
function OpticalAtmosphereBackground() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* 顶部天光漫射层（与 TrendingClient 保持统一光学节奏） */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[440px] bg-gradient-to-b from-zinc-200/40 via-zinc-100/20 to-transparent dark:from-zinc-800/20 dark:via-zinc-900/10 dark:to-transparent blur-3xl opacity-75" />

            {/* 左上温润琥珀微光晕 */}
            <div className="absolute -top-32 left-1/4 w-96 h-96 bg-amber-500/[0.07] dark:bg-amber-500/[0.12] rounded-full blur-3xl" />

            {/* 右上暖橙微光晕 */}
            <div className="absolute -top-32 right-1/4 w-96 h-96 bg-orange-500/[0.06] dark:bg-orange-500/[0.10] rounded-full blur-3xl" />

            {/* 底部荣耀暖金环境漫射 */}
            <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[680px] h-[320px] bg-amber-400/[0.06] dark:bg-amber-600/[0.12] rounded-full blur-3xl animate-flame-sway" />

            {/* 轻盈星火粒子（Dark 模式清晰星火，Light 模式极柔微尘，仅客户端渲染避免水合差异） */}
            {mounted &&
                EMBER_PARTICLES.map((p, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full animate-ember-rise opacity-25 dark:opacity-100"
                        style={{
                            width: `${p.width}px`,
                            height: `${p.height}px`,
                            left: `${p.left}%`,
                            bottom: `${p.bottom}%`,
                            background: `radial-gradient(circle, ${p.color}, transparent)`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                        }}
                    />
                ))}
        </div>
    );
}

// ============================================================
// 榜一 · 王者卡片（琥珀金微光晕 + 120fps 纯白物理漫反射）
// ============================================================
function TopChampionCard({
    entry,
    label,
    icon: Icon,
}: {
    entry: LeaderboardEntry;
    label: string;
    icon: React.ElementType;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8"
        >
            {/* 单色温润琥珀金环境微光晕（Ambient Aura Glow） */}
            <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-amber-500/[0.12] dark:bg-amber-500/[0.18] blur-2xl" />

            <div
                onMouseMove={handleCardMouseMove}
                className="group relative rounded-3xl border-0 bg-white/80 hover:bg-white/90 dark:bg-zinc-900/55 dark:hover:bg-zinc-900/65 backdrop-blur-2xl overflow-hidden p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_40px_-6px_rgba(245,158,11,0.18),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_12px_40px_-6px_rgba(245,158,11,0.22),0_8px_32px_-4px_rgba(0,0,0,0.45)] transition-all duration-300"
            >
                {/* 120fps 光随鼠动纯白无色物理漫射层 */}
                <div
                    className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 dark:group-hover:opacity-35 transition-opacity duration-300"
                    style={{
                        background:
                            "radial-gradient(280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.6), transparent 80%)",
                    }}
                />

                {/* 顶部菲涅尔渐变消融微光缝 */}
                <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 dark:via-amber-400/40 to-transparent" />

                <div className="relative z-10 flex flex-col items-center pt-3">
                    {/* 皇冠微浮动画 */}
                    <motion.div
                        className="mb-2.5"
                        animate={{ y: [0, -5, 0], rotate: [0, 2.5, -2.5, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Crown className="h-9 w-9 text-amber-500 dark:text-amber-400 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]" />
                    </motion.div>

                    {/* 头像与琥珀柔光晕 */}
                    <div className="relative mb-4">
                        <div className="pointer-events-none absolute -inset-2.5 rounded-full bg-amber-400/25 dark:bg-amber-500/25 blur-md" />
                        <Avatar className="relative h-24 w-24 rounded-full border-0 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.32),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_24px_-4px_rgba(245,158,11,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.25)] z-10">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback className="text-2xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-200 font-bold">
                                {entry.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* 锁定徽章胶囊 */}
                        {entry.isLocked && (
                            <motion.div
                                className="absolute -top-1 -right-1 z-20 bg-amber-500 text-white rounded-full border-0 p-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{
                                    duration: 2.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Lock className="h-3.5 w-3.5" />
                            </motion.div>
                        )}
                    </div>

                    {/* 用户名 */}
                    <Link href={`/user/${entry.userId}`}>
                        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 hover:text-amber-600 dark:hover:text-amber-300 transition-colors">
                            {entry.username}
                        </h3>
                    </Link>

                    {/* 锁定标签水滴胶囊 */}
                    {entry.isLocked && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-2 flex items-center gap-1.5 rounded-full border-0 bg-amber-500/[0.14] dark:bg-amber-500/[0.18] px-3.5 py-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_10px_rgba(245,158,11,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_10px_rgba(245,158,11,0.22)]"
                        >
                            <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 tracking-wide">
                                项目开发者
                            </span>
                        </motion.div>
                    )}

                    {/* 渐变消融内部光缝 */}
                    <div className="h-[1px] w-48 max-w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-4" />

                    {/* 分数 */}
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                        <span className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums">
                            {entry.score.toLocaleString()}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                            {label}
                        </span>
                    </div>

                    {/* 排名标识胶囊 */}
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border-0 bg-amber-500/[0.12] dark:bg-amber-500/[0.16] px-3.5 py-1 text-amber-700 dark:text-amber-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                        <Trophy className="h-3.5 w-3.5" />
                        <span>至高无上 · 第一名</span>
                    </div>
                </div>

                {/* 底部渐变消融光缝 */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 dark:via-amber-500/35 to-transparent" />
            </div>
        </motion.div>
    );
}

// ============================================================
// 二三名 · 卡片（月光银 / 暖铜单色微光晕 + 120fps 纯白物理漫射）
// ============================================================
function RunnerUpCard({
    entry,
    position,
    label,
    icon: Icon,
}: {
    entry: LeaderboardEntry;
    position: 2 | 3;
    label: string;
    icon: React.ElementType;
}) {
    const isSecond = position === 2;

    // 单色温润微光晕：第二名月光银 (Slate/Silver)，第三名暖铜 (Warm Copper/Bronze)
    const auraClass = isSecond
        ? "bg-slate-400/[0.14] dark:bg-slate-400/[0.12]"
        : "bg-amber-600/[0.12] dark:bg-amber-600/[0.16]";

    const cardShadowClass = isSecond
        ? "shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_10px_32px_-6px_rgba(148,163,184,0.20),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_10px_32px_-6px_rgba(148,163,184,0.16),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
        : "shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_10px_32px_-6px_rgba(217,119,6,0.16),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_10px_32px_-6px_rgba(180,83,9,0.22),0_8px_32px_-4px_rgba(0,0,0,0.4)]";

    const pillClass = isSecond
        ? "bg-slate-500/[0.12] dark:bg-slate-400/[0.14] text-slate-700 dark:text-slate-300"
        : "bg-amber-700/[0.12] dark:bg-amber-600/[0.18] text-amber-800 dark:text-amber-300";

    const medalColor = isSecond
        ? "text-slate-500 dark:text-slate-300"
        : "text-amber-700 dark:text-amber-500";

    const avatarFallbackClass = isSecond
        ? "bg-slate-500/15 dark:bg-slate-400/20 text-slate-700 dark:text-slate-200"
        : "bg-amber-700/15 dark:bg-amber-600/20 text-amber-800 dark:text-amber-200";

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.6,
                delay: position === 2 ? 0.15 : 0.28,
                ease: [0.16, 1, 0.3, 1],
            }}
            className="relative"
        >
            {/* 悬浮时浮现的单色温润微光晕 */}
            <div
                className={`pointer-events-none absolute -inset-2 rounded-3xl ${auraClass} blur-xl opacity-60 transition-opacity duration-500`}
            />

            <div
                onMouseMove={handleCardMouseMove}
                className={`group relative rounded-3xl border-0 bg-white/75 hover:bg-white/88 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/62 backdrop-blur-2xl overflow-hidden p-5 sm:p-6 ${cardShadowClass} hover:-translate-y-0.5 transition-all duration-300`}
            >
                {/* 120fps 光随鼠动纯白无色物理漫射层 */}
                <div
                    className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 dark:group-hover:opacity-35 transition-opacity duration-300"
                    style={{
                        background:
                            "radial-gradient(220px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.55), transparent 80%)",
                    }}
                />

                {/* 排名奖章角标 */}
                <div className="absolute top-4 right-4 z-10">
                    <Medal className={`h-5 w-5 ${medalColor}`} />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* 头像 */}
                    <div className="relative mb-3">
                        <Avatar className="h-16 w-16 rounded-full border-0 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                            <AvatarImage src={entry.avatarUrl} />
                            <AvatarFallback className={`text-lg font-bold ${avatarFallbackClass}`}>
                                {entry.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* 排名水滴胶囊 */}
                    <div
                        className={`rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium mb-1.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] ${pillClass}`}
                    >
                        第 {position} 名
                    </div>

                    {/* 用户名 */}
                    <Link href={`/user/${entry.userId}`} className="max-w-full">
                        <h4 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-300 transition-colors truncate">
                            {entry.username}
                        </h4>
                    </Link>

                    {/* 渐变消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-3" />

                    {/* 分数 */}
                    <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${medalColor}`} />
                        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                            {entry.score.toLocaleString()}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                            {label}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// 列表排名项（无边框液态玻璃条目）
// ============================================================
function LeaderboardRow({
    entry,
    label,
    icon: Icon,
    delay,
}: {
    entry: LeaderboardEntry;
    label: string;
    icon: React.ElementType;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: "easeOut" }}
            className="group relative"
        >
            <div className="relative flex items-center gap-4 rounded-2xl border-0 bg-white/75 hover:bg-white/88 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65 backdrop-blur-2xl px-4 py-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-300">
                {/* 排名水滴胶囊 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-0 bg-zinc-200/55 dark:bg-white/[0.07] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] flex items-center justify-center select-none">
                    <span className="text-xs font-bold font-mono text-zinc-600 dark:text-zinc-300 tabular-nums">
                        {entry.rank}
                    </span>
                </div>

                {/* 头像 */}
                <Avatar className="h-10 w-10 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_2px_8px_rgba(0,0,0,0.3)]">
                    <AvatarImage src={entry.avatarUrl} />
                    <AvatarFallback className="text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                        {entry.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {/* 用户名 */}
                <Link href={`/user/${entry.userId}`} className="flex-1 min-w-0">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors truncate block">
                        {entry.username}
                    </span>
                </Link>

                {/* 分数药丸 */}
                <div className="flex items-center gap-1.5 rounded-full border-0 bg-zinc-200/40 dark:bg-white/[0.05] px-3 py-1 text-zinc-600 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                    <Icon className="h-3.5 w-3.5 text-amber-500/80 dark:text-amber-400/80" />
                    <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200 text-sm">
                        {entry.score.toLocaleString()}
                    </span>
                    <span className="text-xs hidden sm:inline">{label}</span>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// 加载骨架态
// ============================================================
function LoadingSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-0 bg-white/65 dark:bg-zinc-900/45 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(0,0,0,0.3)]">
            <motion.div
                animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.12, 1],
                    opacity: [0.65, 1, 0.65],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <Flame className="h-12 w-12 text-amber-500 drop-shadow-[0_4px_16px_rgba(245,158,11,0.3)]" />
            </motion.div>
            <motion.p
                className="mt-4 text-zinc-500 dark:text-zinc-400 text-sm font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                正在加载排行榜...
            </motion.p>
        </div>
    );
}

// ============================================================
// 空状态面板
// ============================================================
function EmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 px-8 rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
        >
            <Trophy className="h-14 w-14 mx-auto text-zinc-400 dark:text-zinc-500 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                暂无排名数据
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                快来发布帖子，成为第一个上榜的学者吧！
            </p>
            <Link href="/posts/new">
                <Button className="mt-6 rounded-full border-0 px-6 font-medium">
                    发布帖子
                </Button>
            </Link>
        </motion.div>
    );
}

// ============================================================
// 排行榜展示区
// ============================================================
function LeaderboardDisplay({
    entries,
    label,
    icon,
}: {
    entries: LeaderboardEntry[];
    label: string;
    icon: React.ElementType;
}) {
    if (entries.length === 0) return <EmptyState />;

    const champion = entries[0];
    const second = entries[1];
    const third = entries[2];
    const rest = entries.slice(3);

    return (
        <motion.div
            key={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* 榜一 · 王者 */}
            {champion && (
                <TopChampionCard entry={champion} label={label} icon={icon} />
            )}

            {/* 二三名 */}
            {(second || third) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {second ? (
                        <RunnerUpCard
                            entry={second}
                            position={2}
                            label={label}
                            icon={icon}
                        />
                    ) : (
                        <div className="hidden sm:block" />
                    )}
                    {third ? (
                        <RunnerUpCard
                            entry={third}
                            position={3}
                            label={label}
                            icon={icon}
                        />
                    ) : (
                        <div className="hidden sm:block" />
                    )}
                </div>
            )}

            {/* 其余排名 */}
            {rest.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center gap-3 my-4 px-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium select-none">
                            群星璀璨 · 学术先锋
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                    </div>
                    {rest.map((entry, index) => (
                        <LeaderboardRow
                            key={entry.userId}
                            entry={entry}
                            label={label}
                            icon={icon}
                            delay={0.3 + index * 0.05}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================
// 主页面
// ============================================================
type TabKey = "likes" | "bookmarks" | "contribution";

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("likes");
    const [data, setData] = useState<Record<TabKey, LeaderboardEntry[]>>({
        likes: [],
        bookmarks: [],
        contribution: [],
    });
    const [loaded, setLoaded] = useState<Record<TabKey, boolean>>({
        likes: false,
        bookmarks: false,
        contribution: false,
    });
    const [loading, setLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    const fetchTab = useCallback(
        async (tab: TabKey) => {
            if (loaded[tab]) return;
            setLoading(true);
            try {
                let entries: LeaderboardEntry[];
                switch (tab) {
                    case "likes":
                        entries = await getWeeklyLikeLeaderboard();
                        break;
                    case "bookmarks":
                        entries = await getWeeklyBookmarkLeaderboard();
                        break;
                    case "contribution":
                        entries = await getContributionLeaderboard();
                        break;
                }
                setData((prev) => ({ ...prev, [tab]: entries }));
                setLoaded((prev) => ({ ...prev, [tab]: true }));
            } catch (err) {
                console.error(`Failed to fetch ${tab} leaderboard:`, err);
            } finally {
                setLoading(false);
            }
        },
        [loaded]
    );

    // 初始加载
    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 3500);
        fetchTab("likes");
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tab切换时加载
    useEffect(() => {
        fetchTab(activeTab);
    }, [activeTab, fetchTab]);

    const tabConfig: {
        key: TabKey;
        label: string;
        icon: React.ElementType;
        scoreLabel: string;
    }[] = [
        { key: "likes", label: "周点赞榜", icon: Heart, scoreLabel: "获赞" },
        {
            key: "bookmarks",
            label: "周收藏榜",
            icon: Bookmark,
            scoreLabel: "收藏",
        },
        {
            key: "contribution",
            label: "社区贡献值",
            icon: FileText,
            scoreLabel: "发帖",
        },
    ];

    const currentTabConfig = tabConfig.find((t) => t.key === activeTab)!;

    return (
        <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 双模通透光学氛围背景 */}
            <motion.div
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
            >
                <OpticalAtmosphereBackground />
            </motion.div>

            {/* 入场过渡 — 双模通透光影流转 */}
            <AnimatePresence>
                {!showContent && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#fafafa] dark:bg-[#09090b]"
                        exit={{ opacity: 0, scale: 1.06, filter: "blur(10px)" }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* 温润琥珀氛围汇聚 */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{
                                opacity: [0, 0.65, 1, 0.5],
                                scale: [0.6, 1, 1.18, 1.4],
                            }}
                            transition={{ duration: 3.4, delay: 0.4, ease: "easeOut" }}
                        >
                            <div
                                className="w-[100vw] h-[100vw] max-w-[960px] max-h-[960px] rounded-full blur-[100px]"
                                style={{
                                    background:
                                        "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(249,115,22,0.06) 50%, transparent 80%)",
                                }}
                            />
                        </motion.div>

                        {/* 核心降临：图标与文字阶段性渐显 */}
                        <div className="relative flex flex-col items-center">
                            <motion.div
                                initial={{
                                    scale: 0.6,
                                    opacity: 0,
                                    filter: "blur(10px)",
                                }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    filter: "blur(0px)",
                                }}
                                transition={{
                                    duration: 1.4,
                                    delay: 0.9,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                            >
                                <motion.div
                                    animate={{
                                        y: [0, -12, 0],
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="p-6 rounded-full bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_12px_40px_-4px_rgba(245,158,11,0.22)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_12px_40px_-4px_rgba(245,158,11,0.3)]"
                                >
                                    <Flame className="h-20 w-20 text-amber-500 fill-amber-500/20" />
                                </motion.div>
                            </motion.div>

                            <div className="overflow-hidden mt-7">
                                <motion.h1
                                    className="text-4xl sm:text-5xl font-bold tracking-widest text-zinc-900 dark:text-zinc-50 pb-2"
                                    initial={{ y: "140%", opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{
                                        duration: 1.1,
                                        delay: 1.7,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    学术排行榜
                                </motion.h1>
                            </div>

                            <motion.div
                                className="mt-3 flex items-center gap-5"
                                initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.9, delay: 2.3, ease: "easeOut" }}
                            >
                                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                                <p className="text-sm font-medium tracking-[0.28em] text-amber-700 dark:text-amber-400">
                                    荣耀加冕时刻
                                </p>
                                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 主内容 */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* 头部 */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{
                        opacity: showContent ? 1 : 0,
                        y: showContent ? 0 : -16,
                    }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Flame className="h-6 w-6 text-amber-500 fill-amber-500/20" />
                            学术排行榜
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
                            荣耀属于最杰出的学者
                        </p>
                    </div>
                </motion.div>

                {/* Tab 切换（水滴胶囊无边框悬浮栏 + 恒定 font-medium 零布局跳动） */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                        opacity: showContent ? 1 : 0,
                        y: showContent ? 0 : 10,
                    }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="mb-8"
                >
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as TabKey)}
                    >
                        <TabsList
                            indicatorClassName="bg-amber-500/[0.14] dark:bg-amber-500/[0.18] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_12px_rgba(245,158,11,0.22)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_12px_rgba(245,158,11,0.25)]"
                            className="w-full h-auto p-1.5 rounded-full border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] flex gap-1.5"
                        >
                            {tabConfig.map((tab) => {
                                const TabIcon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.key}
                                        value={tab.key}
                                        className="flex-1 rounded-full border-0 py-2 px-3 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer select-none"
                                    >
                                        <TabIcon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{tab.label}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>
                </motion.div>

                {/* 排行榜内容 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showContent ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    <AnimatePresence mode="wait">
                        {loading && !loaded[activeTab] ? (
                            <LoadingSkeleton />
                        ) : (
                            <LeaderboardDisplay
                                entries={data[activeTab]}
                                label={currentTabConfig.scoreLabel}
                                icon={currentTabConfig.icon}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
