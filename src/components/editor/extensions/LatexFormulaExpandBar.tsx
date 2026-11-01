"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import katex from "katex";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Code2, Maximize2, X } from "lucide-react";
import { CopyMorphButton } from "@/components/ui/copy-morph-button";
import { cn } from "@/lib/utils";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion-tokens";

interface LatexFormulaExpandBarProps {
  latex: string;
  formulaElement: HTMLElement;
}

const FOLD_THRESHOLD_PX = 220;
const FOLDED_HEIGHT_PX = 140;

/**
 * LaTeX 独立块级长公式自适应流体展开与精读检视条
 * - 仅针对独占段落的块级长推导公式生效，绝不修改行内公式 display 属性或侵入段落内联流
 * - 超高多步推导默认柔和折叠并施加底部渐变消融遮罩，支持丝滑展开与全屏液态毛玻璃放大精读灯箱
 */
export function LatexFormulaExpandBar({
  latex,
  formulaElement,
}: LatexFormulaExpandBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isTall, setIsTall] = React.useState(false);
  const [isWideOverflow, setIsWideOverflow] = React.useState(false);
  const [naturalHeight, setNaturalHeight] = React.useState<number>(0);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const [showRawSource, setShowRawSource] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 测量独立公式容器真实尺寸（严禁改动其原有 display 布局模式）
  const measureFormula = React.useCallback(() => {
    if (!formulaElement || !formulaElement.isConnected) return;
    const prevMaxHeight = formulaElement.style.maxHeight;
    formulaElement.style.maxHeight = "none";
    const fullH = formulaElement.scrollHeight;
    const fullW = formulaElement.scrollWidth;
    const clientW =
      formulaElement.clientWidth ||
      formulaElement.parentElement?.clientWidth ||
      fullW;
    formulaElement.style.maxHeight = prevMaxHeight;

    setNaturalHeight(fullH);
    setIsTall(fullH > FOLD_THRESHOLD_PX);
    setIsWideOverflow(fullW > clientW + 16);
  }, [formulaElement]);

  React.useEffect(() => {
    measureFormula();
    const ro = new ResizeObserver(() => {
      measureFormula();
    });
    ro.observe(formulaElement);
    return () => {
      ro.disconnect();
    };
  }, [formulaElement, measureFormula]);

  // 仅在确认为超高独立公式时施加高度过渡与底部消融遮罩；绝不修改 display 属性
  React.useEffect(() => {
    if (!formulaElement || !formulaElement.isConnected) return;

    if (!isTall) {
      formulaElement.style.maxHeight = "";
      formulaElement.style.overflowY = "";
      formulaElement.style.maskImage = "";
      formulaElement.style.webkitMaskImage = "";
      formulaElement.style.transition = "";
      return;
    }

    const durationStr = prefersReducedMotion ? "0ms" : "260ms";
    formulaElement.style.overflowY = "hidden";
    formulaElement.style.transition = `max-height ${durationStr} cubic-bezier(0.23, 1, 0.32, 1)`;

    if (isExpanded) {
      formulaElement.style.maxHeight = `${Math.max(naturalHeight + 24, FOLD_THRESHOLD_PX)}px`;
      formulaElement.style.maskImage = "none";
      formulaElement.style.webkitMaskImage = "none";
    } else {
      formulaElement.style.maxHeight = `${FOLDED_HEIGHT_PX}px`;
      const fadeMask = "linear-gradient(to bottom, black 58%, transparent 100%)";
      formulaElement.style.maskImage = fadeMask;
      formulaElement.style.webkitMaskImage = fadeMask;
    }

    return () => {
      formulaElement.style.maxHeight = "";
      formulaElement.style.overflowY = "";
      formulaElement.style.maskImage = "";
      formulaElement.style.webkitMaskImage = "";
      formulaElement.style.transition = "";
    };
  }, [formulaElement, isTall, isExpanded, naturalHeight, prefersReducedMotion]);

  // ESC 关闭放大灯箱
  React.useEffect(() => {
    if (!zoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomOpen]);

  const renderedZoomHtml = React.useMemo(() => {
    if (!zoomOpen) return "";
    try {
      const clean = latex.replace(/^\$+|\$+$/g, "").trim();
      return katex.renderToString(clean, {
        displayMode: true,
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      return "";
    }
  }, [latex, zoomOpen]);

  const stepCount = React.useMemo(() => {
    const lineBreaks = (latex.match(/\\\\/g) || []).length;
    return lineBreaks > 0 ? lineBreaks + 1 : 0;
  }, [latex]);

  const cleanLatex = React.useMemo(
    () => latex.replace(/^\$+|\$+$/g, "").trim(),
    [latex]
  );

  const shouldShowToolbar = isTall || isWideOverflow || cleanLatex.length >= 140;
  if (!shouldShowToolbar) return null;

  return (
    <>
      <div
        className={cn(
          "math-expand-bar-inner -mt-2 mb-3 flex items-center justify-center sm:justify-end gap-2 select-none",
          !isTall &&
            "opacity-85 [@media(hover:hover)_and_(pointer:fine)]:opacity-70 [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-100 transition-opacity duration-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 自适应展开 / 收起完整推导胶囊 */}
        {isTall && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "inline-grid place-items-center px-3 py-1 rounded-full border-0 text-[11px] font-medium cursor-pointer",
              "bg-sky-500/12 text-sky-700 dark:text-sky-300 backdrop-blur-xl",
              "shadow-[0_4px_14px_-4px_rgba(14,165,233,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.14)]",
              "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-sky-500/20 active:scale-[0.96]",
              "transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-out-snappy)]"
            )}
          >
            <span
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 inline-flex items-center gap-1 pointer-events-none"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span>
                {stepCount >= 2 ? `展开完整推导 (${stepCount} 步)` : "展开完整公式推导"}
              </span>
            </span>

            <span className="col-start-1 row-start-1 inline-flex items-center gap-1">
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-out-snappy)]",
                  isExpanded && "rotate-180"
                )}
              />
              <span>
                {isExpanded
                  ? "收起公式推导"
                  : stepCount >= 2
                  ? `展开完整推导 (${stepCount} 步)`
                  : "展开完整公式推导"}
              </span>
            </span>
          </button>
        )}

        {/* 精读放大检视胶囊 */}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-0 text-[11px] font-medium cursor-pointer",
            "text-zinc-600 dark:text-zinc-300 bg-white/75 dark:bg-zinc-800/70 backdrop-blur-xl",
            "shadow-[0_4px_14px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.12)]",
            "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/95 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-800/95 active:scale-[0.96]",
            "transition-[transform,background-color,color] duration-150 ease-[var(--ease-out-snappy)]"
          )}
          title="全屏精读放大公式"
        >
          <Maximize2 className="h-3 w-3" />
          <span>放大检视</span>
        </button>

        {/* 微模糊融合复制源码胶囊 */}
        <CopyMorphButton
          valueToCopy={cleanLatex}
          surface="glass"
          auraTone="amber"
          showLabel
          idleLabel="复制源码"
          copiedLabel="已复制"
          iconClassName="h-3 w-3"
          title="复制 LaTeX 源码"
        />
      </div>

      {/* 放大精读液态毛玻璃灯箱 */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {zoomOpen && (
              <div
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8"
                onClick={() => setZoomOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.1 : MOTION_DURATIONS.modalEnter,
                    ease: MOTION_EASINGS.snappy,
                  }}
                  className="fixed inset-0 bg-black/45 backdrop-blur-md"
                />

                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="LaTeX 公式放大精读检视"
                  onClick={(e) => e.stopPropagation()}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.95, y: 8 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.96, y: 4 }
                  }
                  transition={{
                    duration: prefersReducedMotion ? 0.1 : MOTION_DURATIONS.modalEnter,
                    ease: MOTION_EASINGS.snappy,
                  }}
                  className={cn(
                    "relative z-10 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl border-0 overflow-hidden",
                    "bg-white/88 dark:bg-zinc-900/88 backdrop-blur-2xl text-foreground",
                    "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.92)]",
                    "dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                  )}
                >
                  <div className="flex items-center justify-between px-5 py-3.5 select-none">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-500/12 text-sky-700 dark:text-sky-300 text-xs font-medium">
                        LaTeX 学术公式精读台
                      </span>
                      {stepCount >= 2 && (
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">
                          共 {stepCount} 行推导步骤
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRawSource((prev) => !prev)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-0 text-xs font-medium cursor-pointer active:scale-[0.96] transition-[transform,background-color,color] duration-150",
                          showRawSource
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                            : "bg-zinc-200/60 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/90 dark:hover:bg-white/[0.14]"
                        )}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>{showRawSource ? "隐藏 TeX 源码" : "查看 TeX 源码"}</span>
                      </button>

                      <CopyMorphButton
                        valueToCopy={cleanLatex}
                        surface="glass"
                        auraTone="amber"
                        showLabel
                        idleLabel="复制 TeX"
                        copiedLabel="已复制"
                        iconClassName="h-3.5 w-3.5"
                      />

                      <button
                        type="button"
                        onClick={() => setZoomOpen(false)}
                        aria-label="关闭检视窗"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-zinc-200/60 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/90 dark:hover:bg-white/[0.14] active:scale-[0.95] transition-[transform,background-color] duration-150 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                  <div className="flex-1 overflow-auto overscroll-contain p-6 sm:p-10 flex items-center justify-center min-h-[180px]">
                    <div
                      className="text-lg sm:text-xl leading-loose max-w-full overflow-x-auto px-2"
                      dangerouslySetInnerHTML={{ __html: renderedZoomHtml }}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {showRawSource && (
                      <motion.div
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        animate={
                          prefersReducedMotion
                            ? { opacity: 1 }
                            : { height: "auto", opacity: 1 }
                        }
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.2, ease: MOTION_EASINGS.snappy }}
                        className="overflow-hidden bg-zinc-950/92 text-zinc-200"
                      >
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <pre className="p-4 sm:p-5 text-xs font-mono leading-relaxed overflow-x-auto max-h-48 overscroll-contain select-all">
                          {cleanLatex}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
