"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  BookOpen,
  Download,
  ExternalLink,
  Link2,
  Quote,
  Sparkles,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyMorphButton } from "@/components/ui/copy-morph-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BacklinkItem } from "./Backlinks";
import { cn, formatDate } from "@/lib/utils";
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
  shouldDismissByVelocity,
} from "@/lib/motion-tokens";

export interface CitationsDrawerPostData {
  id: string;
  title: string;
  content: object;
  tags?: string[];
  created_at: string;
  author: {
    id: string;
    username: string;
  };
}

export interface CitationsFluidDrawerProps {
  open: boolean;
  onClose: () => void;
  post: CitationsDrawerPostData;
  backlinks?: BacklinkItem[];
}

interface ExtractedReferenceItem {
  id: string;
  index: number;
  title: string;
  url?: string;
  sourceBadge: string;
  isInternalPost?: boolean;
}

/**
 * 嗅探并提取 Tiptap JSON 文档内的外部学术链接、DOI/arXiv 信源及显式编号参考文献条目
 */
function extractReferencesFromContent(content: object): ExtractedReferenceItem[] {
  const results: ExtractedReferenceItem[] = [];
  const seenKeys = new Set<string>();

  const classifyUrl = (href: string): { badge: string; isInternal: boolean } => {
    const lower = href.toLowerCase();
    if (lower.includes("arxiv.org")) return { badge: "arXiv 预印本", isInternal: false };
    if (lower.includes("doi.org")) return { badge: "DOI 文献", isInternal: false };
    if (lower.includes("pubmed") || lower.includes("ncbi.nlm.nih.gov"))
      return { badge: "PubMed", isInternal: false };
    if (lower.includes("nature.com") || lower.includes("science.org"))
      return { badge: "顶刊文献", isInternal: false };
    if (lower.includes("ieee.org") || lower.includes("acm.org"))
      return { badge: "计算机学会", isInternal: false };
    if (lower.includes("github.com")) return { badge: "开源代码库", isInternal: false };
    if (lower.includes("wikipedia.org")) return { badge: "百科词条", isInternal: false };
    if (lower.startsWith("/posts/") || lower.includes("/posts/"))
      return { badge: "站内研讨", isInternal: true };
    return { badge: "外部信源", isInternal: false };
  };

  const collectPlainText = (node: any): string => {
    if (!node) return "";
    if (node.type === "text" && typeof node.text === "string") return node.text;
    if (Array.isArray(node.content)) {
      return node.content.map(collectPlainText).join("");
    }
    return "";
  };

  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;

    // 1. 提取带超链接 mark 的文本节点
    if (node.type === "text" && Array.isArray(node.marks)) {
      for (const mark of node.marks) {
        if (mark?.type === "link" && typeof mark.attrs?.href === "string") {
          const href = mark.attrs.href.trim();
          if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
          if (seenKeys.has(href)) continue;
          seenKeys.add(href);

          const { badge, isInternal } = classifyUrl(href);
          const anchorLabel = (node.text || "").trim() || href;
          results.push({
            id: `link-${results.length + 1}`,
            index: results.length + 1,
            title: anchorLabel,
            url: href,
            sourceBadge: badge,
            isInternalPost: isInternal,
          });
        }
      }
    }

    // 2. 提取显式 [1] Author, Title... 格式的参考文献段落
    if (node.type === "paragraph" || node.type === "listItem") {
      const lineText = collectPlainText(node).trim();
      const bibMatch = lineText.match(/^\[(\d{1,3})\]\s+(.{8,300})$/);
      if (bibMatch) {
        const body = bibMatch[2].trim();
        if (!seenKeys.has(body)) {
          seenKeys.add(body);
          const urlInText = body.match(/https?:\/\/[^\s)\]]+/)?.[0];
          const classified = urlInText
            ? classifyUrl(urlInText)
            : { badge: "文内条目", isInternal: false };
          results.push({
            id: `bib-${results.length + 1}`,
            index: results.length + 1,
            title: body,
            url: urlInText,
            sourceBadge: classified.badge,
            isInternalPost: classified.isInternal,
          });
        }
      }
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  walk(content);
  return results;
}

/**
 * 文献引用与知识网络流体抽屉 (Apple / Vaul 级物理手势抽屉)
 * - 支持 Pointer Capture 连续拖拽追踪、向上越界平方根阻尼橡皮筋 (Rubber-banding)
 * - 集成 shouldDismissByVelocity (> 0.11 px/ms) 快速轻拂关闭与物理弹簧回弹
 * - 内置 GB/T 7714、BibTeX、APA 7th、Markdown 四大学术引用格式一键切换与 .bib 导出
 */
export function CitationsFluidDrawer({
  open,
  onClose,
  post,
  backlinks = [],
}: CitationsFluidDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const [activeFormat, setActiveFormat] = React.useState<string>("gbt7714");

  // 直接驱动复合层 translateY，拖拽全程 0 React 重渲染、0 继承型 CSS 变量开销
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 320], [1, 0.2]);

  // 多点触控锁与手势采样缓存
  const activePointerIdRef = React.useRef<number | null>(null);
  const dragStartYRef = React.useRef<number>(0);
  const dragStartTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 打开时重置拖拽位移并锁定背景滚动
  React.useEffect(() => {
    if (!open) return;
    dragY.jump(0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, dragY]);

  // 构造标准化学术引用文本
  const citations = React.useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://scholarly.forum";
    const postUrl = `${origin}/posts/${post.id}`;
    const createdDate = new Date(post.created_at);
    const year = createdDate.getFullYear();
    const isoDate = createdDate.toISOString().slice(0, 10);
    const enDate = createdDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const authorName = post.author?.username || "Scholarly Author";
    const citeKey = `scholarly_${year}_${post.id.slice(0, 6)}`;

    const gbt7714 = `[1] ${authorName}. ${post.title}[EB/OL]. Scholarly 学术论坛, ${isoDate}. ${postUrl}.`;

    const bibtex = `@article{${citeKey},
  title   = {${post.title}},
  author  = {${authorName}},
  journal = {Scholarly Academic Exchange Forum},
  year    = {${year}},
  date    = {${isoDate}},
  url     = {${postUrl}}
}`;

    const apa = `${authorName}. (${enDate}). ${post.title}. Scholarly Academic Exchange Forum. ${postUrl}`;

    const markdown = `<!-- 站内双向知识网络引用 -->\n[[${post.title}]]\n\n<!-- 外部 Markdown 标准引用 -->\n[${post.title} — @${authorName} (${year})](${postUrl})`;

    return { gbt7714, bibtex, apa, markdown, citeKey };
  }, [post.id, post.title, post.created_at, post.author?.username]);

  const extractedRefs = React.useMemo(
    () => extractReferencesFromContent(post.content),
    [post.content]
  );

  // 下载 .bib 文件
  const handleDownloadBib = React.useCallback(() => {
    const blob = new Blob([citations.bibtex], {
      type: "application/x-bibtex;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${citations.citeKey}.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [citations.bibtex, citations.citeKey]);

  // 顶部手柄区连续手势追踪（含向上越界橡皮筋阻尼 + 速度阈值轻拂关闭）
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== null) return; // 拒绝第二根手指抢占手势
    if ((e.target as HTMLElement)?.closest("button")) return;

    activePointerIdRef.current = e.pointerId;
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = performance.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    const rawDelta = e.clientY - dragStartYRef.current;

    if (rawDelta < 0) {
      // 向上越界时施加平方根物理橡皮筋阻尼 (Rubber-banding)
      const damped = -Math.sqrt(Math.abs(rawDelta)) * 3.5;
      dragY.set(damped);
    } else {
      dragY.set(rawDelta);
    }
  };

  const finishGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const finalDelta = e.clientY - dragStartYRef.current;
    const elapsedMs = performance.now() - dragStartTimeRef.current;

    if (
      !cancelled &&
      finalDelta > 20 &&
      shouldDismissByVelocity(finalDelta, elapsedMs, 95, 0.11)
    ) {
      onClose();
      return;
    }

    // 未达关闭阈值：以物理弹簧平滑回弹归位
    animate(
      dragY,
      0,
      prefersReducedMotion ? { duration: 0.1 } : MOTION_SPRINGS.sheetGesture
    );
  };

  if (!mounted) return null;

  const activeSnippet =
    activeFormat === "bibtex"
      ? citations.bibtex
      : activeFormat === "apa"
      ? citations.apa
      : activeFormat === "markdown"
      ? citations.markdown
      : citations.gbt7714;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center sm:p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="文献引用与参考信源抽屉"
        >
          {/* 液态背景遮罩：透明度随手势下滑实时线性消退 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.24,
              ease: MOTION_EASINGS.drawer,
            }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          >
            <motion.div
              style={{ opacity: backdropOpacity }}
              className="w-full h-full"
            />
          </motion.div>

          {/* 抽屉主面板：移动端贴底圆润抽屉 / 桌面端悬浮晶体面板 */}
          <motion.div
            style={{ y: dragY }}
            initial={
              prefersReducedMotion ? { opacity: 0 } : { y: "100%", opacity: 0.6 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : {
                    y: "104%",
                    opacity: 0,
                    transition: { duration: 0.22, ease: MOTION_EASINGS.drawer },
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.12 }
                : {
                    duration: MOTION_DURATIONS.drawer,
                    ease: MOTION_EASINGS.drawer,
                  }
            }
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 w-full sm:max-w-2xl max-h-[85dvh] flex flex-col border-0 overflow-hidden pb-safe will-change-transform",
              "rounded-t-[28px] sm:rounded-3xl",
              "bg-white/86 dark:bg-zinc-900/86 backdrop-blur-2xl text-foreground",
              "shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.16),inset_0_1px_1px_rgba(255,255,255,0.92)]",
              "dark:shadow-[0_-16px_56px_-8px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
            )}
          >
            {/* 顶部手势拖拽区 (Grabber + Header) */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => finishGesture(e, false)}
              onPointerCancel={(e) => finishGesture(e, true)}
              className="pt-2.5 pb-3.5 px-5 select-none touch-none cursor-grab active:cursor-grabbing shrink-0"
            >
              {/* iOS 物理拖拽药丸指示条 */}
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-zinc-300/90 dark:bg-zinc-700/90" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] shrink-0">
                    <Quote className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight text-foreground truncate">
                      学术引用与文献溯源
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      支持标准文献格式导出、文内引文嗅探与双向知识网络
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="关闭引用抽屉"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-zinc-200/60 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-zinc-200/90 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.14] active:scale-[0.95] transition-[transform,background-color] duration-150 cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 渐变消融内部微光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

            {/* 独立滚动内容区（overscroll-contain 阻断滚动穿透） */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-6">
              {/* 模块一：一键生成标准学术引用 */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>引用本文（标准著录格式）</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    {activeFormat === "bibtex" && (
                      <button
                        type="button"
                        onClick={handleDownloadBib}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-0 text-[11px] font-medium bg-sky-500/12 text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sky-500/20 active:scale-[0.96] transition-[transform,background-color] duration-150 cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>下载 .bib</span>
                      </button>
                    )}

                    <CopyMorphButton
                      valueToCopy={activeSnippet}
                      surface="glass"
                      auraTone="amber"
                      showLabel
                      idleLabel="复制引用"
                      copiedLabel="已复制"
                      iconClassName="h-3 w-3"
                    />
                  </div>
                </div>

                <Tabs
                  value={activeFormat}
                  onValueChange={setActiveFormat}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="gbt7714" className="text-xs">
                      GB/T 7714
                    </TabsTrigger>
                    <TabsTrigger value="bibtex" className="text-xs">
                      BibTeX
                    </TabsTrigger>
                    <TabsTrigger value="apa" className="text-xs">
                      APA 7th
                    </TabsTrigger>
                    <TabsTrigger value="markdown" className="text-xs">
                      Markdown
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeFormat} className="mt-2.5">
                    <div className="rounded-2xl border-0 bg-zinc-950/92 text-zinc-200 p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-6px_rgba(0,0,0,0.3)]">
                      <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all select-all">
                        {activeSnippet}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </section>

              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

              {/* 模块二：文内参考文献与学术信源 */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-sky-500" />
                    <span>文内引证信源与外部文献</span>
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200/65 dark:bg-white/[0.08] text-[11px] font-mono tabular-nums font-medium text-muted-foreground">
                    {extractedRefs.length}
                  </span>
                </div>

                {extractedRefs.length === 0 ? (
                  <div className="rounded-2xl border-0 p-4 bg-zinc-100/65 dark:bg-white/[0.03] text-center text-xs text-muted-foreground">
                    本文暂未检测到显式外部文献链接或编号引文条目
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {extractedRefs.map((item) => (
                      <li
                        key={item.id}
                        className="group rounded-2xl border-0 p-3 bg-zinc-100/70 dark:bg-white/[0.04] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/90 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.07] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-colors duration-150 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-sky-500/12 text-sky-700 dark:text-sky-300 text-[10px] font-mono tabular-nums font-medium shrink-0 mt-0.5">
                            [{item.index}]
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-medium text-foreground break-words leading-relaxed">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-white/[0.07] text-[10px] font-medium text-muted-foreground">
                                {item.sourceBadge}
                              </span>
                              {item.url && (
                                <span className="text-[11px] font-mono text-muted-foreground/75 truncate max-w-[260px]">
                                  {item.url}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <CopyMorphButton
                            valueToCopy={item.url || item.title}
                            surface="ghost"
                            auraTone="amber"
                            iconClassName="h-3.5 w-3.5"
                            title="复制该条引文"
                          />
                          {item.url && (
                            <a
                              href={item.url}
                              target={item.isInternalPost ? undefined : "_blank"}
                              rel={
                                item.isInternalPost
                                  ? undefined
                                  : "noopener noreferrer"
                              }
                              onClick={() => {
                                if (item.isInternalPost) onClose();
                              }}
                              aria-label="打开引文链接"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:text-sky-600 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-sky-400 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sky-500/10 active:scale-[0.95] transition-[transform,color,background-color] duration-150"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* 模块三：站内反向引用（施引文献网络） */}
              {backlinks.length > 0 && (
                <>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>被以下站内学术帖子引用（施引网络）</span>
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono tabular-nums font-medium">
                        {backlinks.length}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {backlinks.map((bl) => (
                        <li key={bl.id}>
                          <Link
                            href={`/posts/${bl.id}`}
                            onClick={onClose}
                            className="flex items-center justify-between gap-3 rounded-2xl border-0 p-3 bg-zinc-100/70 dark:bg-white/[0.04] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/90 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] active:scale-[0.99] transition-[transform,background-color] duration-150"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-xs font-medium text-foreground truncate">
                                {bl.title}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={bl.author?.avatar_url} />
                                  <AvatarFallback className="text-[9px]">
                                    {bl.author?.username?.slice(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{bl.author?.username}</span>
                                <span>·</span>
                                <span suppressHydrationWarning>
                                  {formatDate(bl.created_at)}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
