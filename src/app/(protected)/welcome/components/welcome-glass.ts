/**
 * Welcome 入驻向导共享的 Apple Liquid Glass 设计令牌
 * 在 Landing 令牌（GLASS / OBSIDIAN_CTA / DIVIDER_H 等）基础上补充向导专用的面板与内嵌晶片。
 * 规则：border-0 + 高斯磨砂 + 菲涅尔内高光 + 弥散阴影；激活态使用单色微光晕。
 */

export {
    GLASS,
    DIVIDER_H,
    DIVIDER_V,
    OBSIDIAN_CTA,
    SERIF_STACK,
    trackPointer,
} from "@/components/landing/liquid-glass";

/** 主玻璃晶体面板（rounded-3xl 大曲率） */
export const PANEL =
    "relative overflow-hidden rounded-3xl border-0 " +
    "bg-white/78 dark:bg-zinc-900/62 backdrop-blur-2xl " +
    "shadow-[inset_0_1px_1px_rgba(255,255,255,0.92),0_24px_64px_-12px_rgba(0,0,0,0.09),0_8px_32px_-4px_rgba(0,0,0,0.05)] " +
    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_24px_64px_-12px_rgba(0,0,0,0.65)]";

/** 面板内嵌晶片（条款段落 / 表单分组），rounded-2xl，无边框 */
export const TILE =
    "rounded-2xl border-0 bg-white/60 dark:bg-white/[0.035] " +
    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_10px_-4px_rgba(0,0,0,0.04)] " +
    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.07)]";

/** 光随鼠动镜面漫射层的 radial-gradient（配合 trackPointer 写入的 --mouse-x / --mouse-y） */
export const REFLEX_GRADIENT =
    "radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.55), transparent 55%)";

/** 仅桌面精确指针 hover 时显现的镜面漫射层类名（需父级 group/panel） */
export const REFLEX_LAYER =
    "pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 " +
    "[@media(hover:hover)_and_(pointer:fine)]:group-hover/panel:opacity-100 " +
    "dark:[@media(hover:hover)_and_(pointer:fine)]:group-hover/panel:opacity-20";

/** 面板顶部极细物理透光光缝 */
export const TOP_SEAM =
    "pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/25 to-transparent";

/** 琥珀金单色微光晕（激活态） */
export const AMBER_AURA_SHADOW =
    "shadow-[0_4px_16px_-4px_rgba(245,158,11,0.28),inset_0_1px_0.5px_rgba(255,255,255,0.85)] " +
    "dark:shadow-[0_4px_16px_-4px_rgba(245,158,11,0.24),inset_0_1px_0.5px_rgba(255,255,255,0.14)]";

/** Strong ease-out（与 globals.css --ease-out-snappy 一致） */
export const EASE_SNAPPY = [0.23, 1, 0.32, 1] as const;
