"use client";

import { useEffect, useRef, useState, useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LineChart, X, RotateCcw, Loader2 } from "lucide-react";
import { CopyMorphButton } from "@/components/ui/copy-morph-button";
import { MOTION_EASINGS } from "@/lib/motion-tokens";

interface MathViewerComponentProps {
  content: string; // 传进来的 LaTeX 公式，可能包含 $
}

// 动态脚本加载状态池，避免重复向 DOM 插入 script 标签
let desmosLoadingPromise: Promise<void> | null = null;
function loadDesmosAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Desmos) return Promise.resolve();

  if (!desmosLoadingPromise) {
    desmosLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        desmosLoadingPromise = null;
        reject(new Error("Failed to load Desmos API"));
      };
      document.body.appendChild(script);
    });
  }

  return desmosLoadingPromise;
}

// 辅助函数：从 LaTeX 中解析出未定义的非常规参数，以便自动为 Desmos 创建默认滑块值使图像能够绘制出来
function extractParameters(latex: string, funcName: string | null) {
  const params = new Set<string>();

  const greekLetters = ["sigma", "mu", "alpha", "beta", "gamma", "lambda", "omega", "phi", "psi", "delta"];

  for (const g of greekLetters) {
    const subscriptPattern = new RegExp(`${g[0]}_\\{${g.slice(1)}\\}`, "g");
    if (subscriptPattern.test(latex)) {
      params.add(`${g[0]}_{${g.slice(1)}}`);
    }
  }

  const greekRegex = /\\(sigma|mu|alpha|beta|gamma|lambda|omega|phi|psi|delta)\b/g;
  let match;
  while ((match = greekRegex.exec(latex)) !== null) {
    params.add(match[0]);
  }

  let cleanLatex = latex.replace(/\\[a-zA-Z]+/g, " ");
  cleanLatex = cleanLatex.replace(/[a-zA-Z]_\{[a-zA-Z]+\}/g, " ");

  const letterRegex = /\b([a-df-wzAD-Z])\b/g;
  while ((match = letterRegex.exec(cleanLatex)) !== null) {
    const char = match[1];
    if (funcName && char.toLowerCase() === funcName.toLowerCase()) {
      continue;
    }
    params.add(char);
  }

  return Array.from(params);
}

// 辅助函数：将标准 LaTeX 公式转换为 Desmos 兼容的 LaTeX 语法
function convertLatexForDesmos(latex: string): string {
  let result = latex;

  const greekMap: Record<string, string> = {
    "\\sigma": "s_{igma}",
    "\\mu": "m_{u}",
    "\\alpha": "a_{lpha}",
    "\\beta": "b_{eta}",
    "\\gamma": "g_{amma}",
    "\\lambda": "l_{ambda}",
    "\\omega": "o_{mega}",
    "\\phi": "p_{hi}",
    "\\psi": "p_{si}",
    "\\delta": "d_{elta}",
    "\\pi": "\\pi",
  };
  for (const [latexGreek, desmosGreek] of Object.entries(greekMap)) {
    result = result.split(latexGreek).join(desmosGreek);
  }

  return result;
}

// 1. 函数表达式整理 (只用于绘图)
// 严格判断公式是否为 Desmos 可绘制的函数，减少误判
export const checkIsFunction = (latex: string) => {
  const trimmed = latex.trim();
  const clean = trimmed.replace(/^\$+|\$+$/g, "").trim();
  const lower = clean.toLowerCase();

  if (clean.length < 3) return { isFunc: false, desmosLatex: "" };

  const invalidKeywords = [
    "\\lim", "\\limsup", "\\liminf",
    "\\partial", "\\nabla", "\\delta",
    "\\matrix", "\\bmatrix", "\\pmatrix", "\\vmatrix", "\\begin{array}",
    "\\vec", "\\hat", "\\mathbf",
    "\\in", "\\notin", "\\subset", "\\subseteq", "\\supset", "\\cup", "\\cap",
    "\\forall", "\\exists", "\\nexists", "\\implies", "\\iff",
    "\\land", "\\lor", "\\neg", "\\vee", "\\wedge",
    "\\approx", "\\neq", "\\equiv", "\\sim", "\\cong", "\\propto",
    "\\ge", "\\le", "\\gg", "\\ll",
    "\\binom", "\\choose", "\\perm",
    "\\mathbb{p}", "\\mathbb{e}", "\\var", "\\cov", "\\operatorname{p}",
    "\\text{", "\\mathrm{", "\\textbf{",
    "\\begin{", "\\end{", "\\cases",
    "\\cdots", "\\ldots", "\\vdots", "\\ddots",
    "\\overset", "\\underset", "\\stackrel",
  ];
  if (invalidKeywords.some(kw => lower.includes(kw))) {
    return { isFunc: false, desmosLatex: "" };
  }

  if (/>(?!=)/.test(clean) || /<(?!=)/.test(clean)) {
    return { isFunc: false, desmosLatex: "" };
  }

  const explicitFuncPattern = /^(y|f\s*\(.*?\)|g\s*\(.*?\)|h\s*\(.*?\)|r)\s*=/i;
  if (explicitFuncPattern.test(clean)) {
    return { isFunc: true, desmosLatex: clean };
  }

  if (clean.includes("=") && /x/i.test(clean) && /y/i.test(clean)) {
    return { isFunc: true, desmosLatex: clean };
  }

  const mathFunctions = [
    "\\sin", "\\cos", "\\tan", "\\cot", "\\sec", "\\csc",
    "\\arcsin", "\\arccos", "\\arctan",
    "\\sinh", "\\cosh", "\\tanh",
    "\\ln", "\\log", "\\lg",
    "\\sqrt", "\\exp", "\\abs",
  ];
  const hasMathFunc = mathFunctions.some(fn => lower.includes(fn));
  const hasX = /(?<!\\te)x(?!t)/i.test(clean);
  if (hasMathFunc && hasX) {
    return { isFunc: true, desmosLatex: `y = ${clean}` };
  }

  const polyPattern = /x\s*\^/i;
  if (polyPattern.test(clean) && hasX) {
    const operatorPattern = /[+\-*/^]/;
    if (operatorPattern.test(clean) || /^\s*x\s*\^/.test(clean)) {
      if (clean.includes("=")) {
        return { isFunc: true, desmosLatex: clean };
      }
      return { isFunc: true, desmosLatex: `y = ${clean}` };
    }
  }

  const hasTheta = lower.includes("\\theta");
  if (hasTheta && hasMathFunc) {
    return { isFunc: true, desmosLatex: clean.includes("=") ? clean : `r = ${clean}` };
  }

  return { isFunc: false, desmosLatex: "" };
};

export default function MathViewerComponent({ content }: MathViewerComponentProps) {
  const prefersReducedMotion = useReducedMotion();
  const calculatorRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isDesmosLoaded, setIsDesmosLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueId = useId();
  const cleanId = uniqueId.replace(/[^a-zA-Z0-9]/g, "-");
  const calculatorId = `desmos-calc-${cleanId}`;

  const { isFunc, desmosLatex } = checkIsFunction(content);
  const cleanRawLatex = content.replace(/^\$+|\$+$/g, "").trim();

  // 2. 初始化 Desmos 并执行渐现动画
  const initDesmosAndAnimate = async () => {
    try {
      setError(null);
      await loadDesmosAPI();
      setIsDesmosLoaded(true);

      setTimeout(() => {
        if (!calculatorRef.current) return;

        if (calculatorInstance.current) {
          calculatorInstance.current.destroy();
        }

              const Desmos = (window as any).Desmos;
        if (!Desmos) {
          setError("Desmos 引擎加载失败，请刷新重试");
          return;
        }

        const calc = Desmos.GraphingCalculator(calculatorRef.current, {
          keypad: false,
          expressions: true,
          settingsMenu: false,
          zoomButtons: true,
          expressionsCollapsed: false,
        });

        calculatorInstance.current = calc;

        calc.setMathBounds({
          left: -10,
          right: 10,
          bottom: -6,
          top: 6,
        });

        const xMin = -10;
        const xMax = 10;

        setIsDrawing(true);

        const convertedLatex = convertLatexForDesmos(desmosLatex);

        const funcNameMatch = convertedLatex.trim().match(/^(f|g|h)\s*\(.*?\)\s*=/i);
        const funcName = funcNameMatch ? funcNameMatch[1] : null;
        const params = extractParameters(convertedLatex, funcName);

        params.forEach((param, idx) => {
          const isMu = param.includes("m_{u}") || param === "\\mu";
          const defaultValue = isMu ? "0" : "1";
          calc.setExpression({
            id: `param-slider-${idx}`,
            latex: `${param} = ${defaultValue}`,
            sliderBounds: {
              min: isMu ? "-10" : "0.1",
              max: "10",
              step: "0.1",
            },
          });
        });

        if (prefersReducedMotion) {
          calc.setExpression({
            id: "main-graph",
            latex: convertedLatex,
            color: "#0ea5e9",
            lineWidth: 3,
          });
          setIsDrawing(false);
          return;
        }

        calc.setExpression({
          id: "param-anim-a",
          latex: `a_{anim} = ${xMin}`,
        });

        calc.setExpression({
          id: "main-graph",
          latex: `${convertedLatex} \\left\\{ x \\le a_{anim} \\right\\}`,
          color: "#0ea5e9",
          lineWidth: 3,
        });

        const duration = 1200;
        const startTime = performance.now();

        const runAnimation = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentA = xMin + (xMax - xMin) * progress;

          calc.setExpression({
            id: "param-anim-a",
            latex: `a_{anim} = ${currentA}`,
          });

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(runAnimation);
          } else {
            calc.setExpression({
              id: "main-graph",
              latex: convertedLatex,
              color: "#0ea5e9",
              lineWidth: 3,
            });
            calc.removeExpression({ id: "param-anim-a" });
            setIsDrawing(false);
          }
        };

        animationFrameRef.current = requestAnimationFrame(runAnimation);
      }, 100);
    } catch (err) {
      console.error(err);
      setError("无法加载 Desmos 画图面板");
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      initDesmosAndAnimate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
        calculatorInstance.current = null;
      }
      setIsOpen(false);
      setIsDesmosLoaded(false);
    }
  };

  const handleReset = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    initDesmosAndAnimate();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
      }
    };
  }, []);

  if (!isFunc) return null;

  return (
    <span className="inline-flex flex-wrap items-center relative select-none align-middle">
      {/* 绘制图像水滴胶囊按钮（Grid 锁宽确保切换零跳动） */}
      <button
        onClick={handleToggle}
        type="button"
        className={`inline-grid place-items-center ml-1.5 px-2.5 py-0.5 rounded-full border-0 text-[10px] font-medium cursor-pointer select-none align-middle transition-[transform,background-color,color,box-shadow] duration-150 ease-[var(--ease-out-snappy)] active:scale-[0.95] ${
          isOpen
            ? "bg-sky-500/18 text-sky-700 dark:text-sky-300 shadow-[0_0_14px_rgba(14,165,233,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
            : "bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sky-500/15 [@media(hover:hover)_and_(pointer:fine)]:hover:text-sky-700 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-sky-300"
        }`}
        title={isOpen ? "收起函数图像" : "在文内展开 Desmos 函数图像"}
      >
        <span className="col-start-1 row-start-1 inline-flex items-center gap-1">
          <LineChart className={`h-3 w-3 ${isDrawing ? "animate-pulse" : ""}`} />
          <span>{isOpen ? "收起" : "绘制"}</span>
        </span>
      </button>

      {/* 自适应流体展开窗格（零 margin 布局重排，采用内边距 + clipPath + 强劲曲线丝滑揭示） */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.span
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : {
                    height: 0,
                    opacity: 0,
                    clipPath: "inset(0% 0% 100% 0% round 24px)",
                  }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : {
                    height: "auto",
                    opacity: 1,
                    clipPath: "inset(0% 0% 0% 0% round 24px)",
                  }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : {
                    height: 0,
                    opacity: 0,
                    clipPath: "inset(0% 0% 100% 0% round 24px)",
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.1 }
                : { duration: 0.28, ease: MOTION_EASINGS.snappy }
            }
            className="block w-full overflow-hidden z-30 basis-full"
            style={{
              position: "relative",
              width: "100%",
              clear: "both",
            }}
          >
            <span className="block w-full py-3">
              <span className="block w-full rounded-3xl border-0 bg-white/82 dark:bg-zinc-900/78 backdrop-blur-2xl shadow-[0_16px_44px_-8px_rgba(0,0,0,0.1),inset_0_1px_0.5px_rgba(255,255,255,0.88)] dark:shadow-[0_18px_48px_-8px_rgba(0,0,0,0.55),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-4 relative overflow-hidden">
                {/* 控制栏 */}
                <span className="flex items-center justify-between gap-2 pb-2.5">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground select-none min-w-0">
                    <LineChart className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span className="shrink-0">交互函数图像</span>
                    <code className="bg-zinc-100/80 dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full font-mono text-foreground text-[11px] truncate">
                      {cleanRawLatex}
                    </code>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <CopyMorphButton
                      valueToCopy={cleanRawLatex}
                      surface="ghost"
                      auraTone="amber"
                      iconClassName="h-3.5 w-3.5"
                      title="复制函数表达式"
                    />
                    <button
                      onClick={handleReset}
                      type="button"
                      disabled={isDrawing || !isDesmosLoaded}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border-0 text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/[0.08] active:scale-[0.95] transition-[transform,background-color,color] duration-150 disabled:opacity-50 cursor-pointer"
                      title="重新绘制图像"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${isDrawing ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={handleToggle}
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border-0 text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/[0.08] active:scale-[0.95] transition-[transform,background-color,color] duration-150 cursor-pointer"
                      title="收起窗格"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </span>

                {/* 渐变消融内部微光缝 */}
                <span className="block h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-3" />

                {/* 画板容器 */}
                <span className="block relative w-full h-[400px] bg-zinc-100/50 dark:bg-zinc-950/50 rounded-2xl overflow-hidden border-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
                  {!isDesmosLoaded && !error && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md z-10">
                      <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                      <span className="text-xs font-medium">正在初始化数学计算器...</span>
                    </span>
                  )}

                  {error && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-destructive bg-destructive/5 backdrop-blur-xs z-10">
                      <span className="text-sm font-semibold mb-1">加载失败</span>
                      <span className="text-xs text-muted-foreground">{error}</span>
                    </span>
                  )}

                  <span
                    id={calculatorId}
                    ref={calculatorRef}
                    className="block w-full h-full"
                    style={{ minHeight: "400px" }}
                  />
                </span>
              </span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
