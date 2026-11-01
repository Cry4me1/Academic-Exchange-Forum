"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion-tokens";

export interface CopyMorphButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onCopy"> {
  /** 待写入剪贴板的文本（非受控或半受控模式下自动执行复制） */
  valueToCopy?: string;
  /** 外部受控的已复制状态（若不传则由内部管理 2000ms 自动复原） */
  copied?: boolean;
  /** 复制成功回调 */
  onCopied?: () => void;
  /** 是否显示文字标签（默认 false 仅显示图标；开启后采用 Grid 叠层锁宽确保绝对零布局跳动） */
  showLabel?: boolean;
  /** 常态文字（默认 "复制"） */
  idleLabel?: string;
  /** 复制成功文字（默认 "已复制"） */
  copiedLabel?: string;
  /** 外观明暗语境适配（dark 用于深色代码块顶栏，glass 用于自适应亮暗毛玻璃面板） */
  surface?: "dark" | "glass" | "ghost";
  /** 激活态微光晕色调（遵循 UI-DESIGN-RULES 琥珀金光 / 翡翠微光） */
  auraTone?: "amber" | "emerald";
  /** 图标尺寸样式 */
  iconClassName?: string;
  /** 复制状态维持时长（ms） */
  resetDelayMs?: number;
}

/**
 * Emil Kowalski 风格微模糊融合复制胶囊 (Blur Crossfade Morph Button)
 * - 图标与文案切换采用 opacity + scale(0.85 -> 1) + filter: blur(2px -> 0px) 融合过渡
 * - CSS Grid 隐式占位层锁死胶囊物理宽度，实现 0.00px 绝对零布局跳动 (Zero Layout Shift)
 * - 复制成功瞬间触发温润琥珀金光晕 (Amber Aura) 并在 2s 后柔和消散
 */
export function CopyMorphButton({
  valueToCopy,
  copied: controlledCopied,
  onCopied,
  showLabel = false,
  idleLabel = "复制",
  copiedLabel = "已复制",
  surface = "glass",
  auraTone = "amber",
  iconClassName = "h-3.5 w-3.5",
  resetDelayMs = 2000,
  className,
  onClick,
  title = "复制到剪贴板",
  ...props
}: CopyMorphButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [internalCopied, setInternalCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCopied = controlledCopied !== undefined ? controlledCopied : internalCopied;

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerCopiedState = React.useCallback(() => {
    if (controlledCopied === undefined) {
      setInternalCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setInternalCopied(false);
      }, resetDelayMs);
    }
    onCopied?.();
  }, [controlledCopied, onCopied, resetDelayMs]);

  const handleClick = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;

      if (valueToCopy !== undefined) {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(valueToCopy);
          triggerCopiedState();
        } catch {
          try {
            const textarea = document.createElement("textarea");
            textarea.value = valueToCopy;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            triggerCopiedState();
          } catch {
            // 剪贴板不可用时静默降级
          }
        }
      }
    },
    [onClick, valueToCopy, triggerCopiedState]
  );

  // 计算较长文案作为隐形撑宽锚点，彻底杜绝切换瞬间周围元素产生哪怕 1px 位移
  const longerLabel =
    copiedLabel.length >= idleLabel.length ? copiedLabel : idleLabel;

  const surfaceIdleClass =
    surface === "dark"
      ? "text-zinc-400 bg-zinc-800/55 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-800/90"
      : surface === "ghost"
      ? "text-muted-foreground bg-transparent [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/50 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.08]"
      : "text-zinc-600 dark:text-zinc-300 bg-white/75 dark:bg-zinc-800/70 backdrop-blur-xl shadow-[0_4px_14px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.12)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/95 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-800/95 [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-950 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-white";

  const auraCopiedClass =
    auraTone === "amber"
      ? surface === "dark"
        ? "text-amber-300 bg-amber-500/18 shadow-[0_0_16px_rgba(245,158,11,0.24),inset_0_1px_0.5px_rgba(255,255,255,0.28)]"
        : "text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/18 shadow-[0_0_16px_rgba(245,158,11,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_0_16px_rgba(245,158,11,0.24),inset_0_1px_0.5px_rgba(255,255,255,0.22)]"
      : surface === "dark"
      ? "text-emerald-300 bg-emerald-500/18 shadow-[0_0_16px_rgba(16,185,129,0.24),inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
      : "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.8)]";

  const morphTransition = prefersReducedMotion
    ? { duration: 0.1 }
    : { duration: MOTION_DURATIONS.morph, ease: MOTION_EASINGS.snappy };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isCopied ? copiedLabel : title}
      aria-label={isCopied ? copiedLabel : title}
      className={cn(
        "relative inline-grid place-items-center rounded-full border-0 font-medium select-none cursor-pointer",
        "transition-[transform,background-color,color,box-shadow] duration-150 ease-[var(--ease-out-snappy)]",
        "active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35",
        showLabel ? "px-2.5 py-1 text-[11px]" : "h-7 w-7 p-0",
        isCopied ? auraCopiedClass : surfaceIdleClass,
        className
      )}
      {...props}
    >
      {/* 隐形占位锚点：锁定最大胶囊尺寸，保证零布局跳动 */}
      {showLabel && (
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 inline-flex items-center gap-1.5 pointer-events-none font-medium"
        >
          <Check className={cn("shrink-0", iconClassName)} />
          <span>{longerLabel}</span>
        </span>
      )}

      {/* 可见动态融合层 */}
      <span className="col-start-1 row-start-1 inline-flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {isCopied ? (
            <motion.span
              key="copied"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.85, filter: "blur(2px)" }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, filter: "blur(0px)" }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.85, filter: "blur(2px)" }
              }
              transition={morphTransition}
              className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap will-change-[transform,opacity,filter]"
            >
              <Check className={cn("shrink-0", iconClassName)} strokeWidth={2.25} />
              {showLabel && <span>{copiedLabel}</span>}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.85, filter: "blur(2px)" }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, filter: "blur(0px)" }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.85, filter: "blur(2px)" }
              }
              transition={morphTransition}
              className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap will-change-[transform,opacity,filter]"
            >
              <Copy className={cn("shrink-0", iconClassName)} strokeWidth={1.9} />
              {showLabel && <span>{idleLabel}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
