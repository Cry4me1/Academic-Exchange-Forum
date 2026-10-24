/**
 * Landing 页共享的 Apple Liquid Glass 设计令牌
 * 规则：border-0 + 高斯磨砂 + 菲涅尔内高光 + 弥散阴影；分割线一律为两端消融的微光缝。
 */

/** 标准玻璃面板（胶囊 / 卡片通用，圆角由调用方追加） */
export const GLASS =
    "border-0 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl " +
    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] " +
    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.5)]";

/** 水平消融光缝 */
export const DIVIDER_H =
    "h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent";

/** 垂直消融光缝 */
export const DIVIDER_V =
    "w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1";

/** 黑曜石液态玻璃（Light）/ 白月光晶体（Dark）核心 CTA */
export const OBSIDIAN_CTA =
    "border-0 backdrop-blur-xl bg-zinc-950/85 hover:bg-zinc-900/95 text-white " +
    "shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] " +
    "dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 " +
    "dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]";

/** 学术衬线字体栈：优先思源宋体，缺失时 CJK 字形回落系统默认字体 */
export const SERIF_STACK =
    '"Noto Serif SC","Source Han Serif SC","Source Han Serif CN","Songti SC",ui-serif,Georgia,serif';

/** 琥珀金单色微光晕（激活态 / 强调） */
export const AMBER_AURA = "rgba(245,158,11,0.22)";

/** 统一缓动曲线 */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/**
 * 120fps 鼠标物理漫射：直接写入 DOM CSS 变量，绕过 React 渲染。
 * 配合 `radial-gradient(... at var(--mouse-x) var(--mouse-y) ...)` 使用。
 */
export function trackPointer(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}
