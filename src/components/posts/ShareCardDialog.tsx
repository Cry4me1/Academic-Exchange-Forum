"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MathText } from "@/components/ui/math-text";
import { extractTextFromContent } from "@/lib/extract-text";
import { cn } from "@/lib/utils";
import { toPng, toBlob } from "html-to-image";
import {
    Check,
    Copy,
    Download,
    GraduationCap,
    Loader2,
    Moon,
    Sparkles,
    Sun,
    Flame,
    Share2,
    ShieldCheck,
    ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export type ShareCardTheme = "obsidian" | "frost" | "academic" | "amber";

export interface ShareCardPostData {
    id: string;
    title: string;
    content?: any;
    tags?: string[];
    created_at?: string;
    author?: {
        username?: string;
        avatar_url?: string | null;
        special_title?: string | null;
        vip_level?: number | null;
        is_verified?: boolean;
        is_developer?: boolean;
        developer_title?: string | null;
    };
}

interface ShareCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId?: string;
    postTitle?: string;
    post?: ShareCardPostData;
}

// 风格主题配置
const themeConfigs: Record<
    ShareCardTheme,
    {
        name: string;
        label: string;
        icon: React.ReactNode;
        description: string;
        wrapperClass: string;
        cardBg: string;
        auraColor: string;
        headerLogoBg: string;
        titleClass: string;
        badgeClass: string;
        tagClass: string;
        summaryBoxClass: string;
        summaryTextClass: string;
        authorNameClass: string;
        metaTextClass: string;
        dividerClass: string;
        qrBorderClass: string;
    }
> = {
    obsidian: {
        name: "obsidian",
        label: "极夜黑曜",
        icon: <Moon className="h-4 w-4" />,
        description: "冷调黑曜石与天青微光",
        wrapperClass: "text-zinc-100",
        cardBg: "bg-gradient-to-br from-zinc-950 via-[#0d1117] to-black",
        auraColor: "rgba(56, 189, 248, 0.12)",
        headerLogoBg: "bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]",
        titleClass: "text-zinc-50 font-bold",
        badgeClass: "bg-sky-500/15 text-sky-300 shadow-[inset_0_1px_0.5px_rgba(56,189,248,0.3)]",
        tagClass: "bg-white/10 text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]",
        summaryBoxClass: "bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border-0",
        summaryTextClass: "text-zinc-300",
        authorNameClass: "text-zinc-100",
        metaTextClass: "text-zinc-400",
        dividerClass: "via-white/15",
        qrBorderClass: "bg-white/[0.06] text-zinc-400",
    },
    frost: {
        name: "frost",
        label: "凝光霜白",
        icon: <Sun className="h-4 w-4" />,
        description: "高雅通透的白月光晶体",
        wrapperClass: "text-zinc-900",
        cardBg: "bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#eef2f6]",
        auraColor: "rgba(226, 232, 240, 0.8)",
        headerLogoBg: "bg-zinc-900/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
        titleClass: "text-zinc-900 font-bold",
        badgeClass: "bg-zinc-900/10 text-zinc-800 shadow-[inset_0_1px_0.5px_rgba(0,0,0,0.06)]",
        tagClass: "bg-zinc-200/70 text-zinc-700 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]",
        summaryBoxClass: "bg-zinc-900/[0.03] shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] border-0",
        summaryTextClass: "text-zinc-700",
        authorNameClass: "text-zinc-900",
        metaTextClass: "text-zinc-500",
        dividerClass: "via-zinc-300/60",
        qrBorderClass: "bg-zinc-200/60 text-zinc-600",
    },
    academic: {
        name: "academic",
        label: "学术典蓝",
        icon: <GraduationCap className="h-4 w-4" />,
        description: "顶级学府理性格调深蓝",
        wrapperClass: "text-slate-100",
        cardBg: "bg-gradient-to-br from-[#0c192c] via-[#10223d] to-[#0a1424]",
        auraColor: "rgba(14, 165, 233, 0.18)",
        headerLogoBg: "bg-sky-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]",
        titleClass: "text-white font-bold",
        badgeClass: "bg-cyan-500/20 text-cyan-300 shadow-[inset_0_1px_0.5px_rgba(34,211,238,0.3)]",
        tagClass: "bg-sky-950/60 text-sky-200 shadow-[inset_0_1px_0.5px_rgba(56,189,248,0.2)]",
        summaryBoxClass: "bg-sky-950/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] border-0",
        summaryTextClass: "text-slate-200",
        authorNameClass: "text-white",
        metaTextClass: "text-sky-200/70",
        dividerClass: "via-sky-400/20",
        qrBorderClass: "bg-sky-900/30 text-sky-300",
    },
    amber: {
        name: "amber",
        label: "晨曦琥珀",
        icon: <Flame className="h-4 w-4" />,
        description: "温润金石余晖学术质感",
        wrapperClass: "text-amber-50",
        cardBg: "bg-gradient-to-br from-[#1a1410] via-[#241a14] to-[#120d0a]",
        auraColor: "rgba(245, 158, 11, 0.16)",
        headerLogoBg: "bg-amber-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]",
        titleClass: "text-amber-50 font-bold",
        badgeClass: "bg-amber-500/20 text-amber-300 shadow-[inset_0_1px_0.5px_rgba(245,158,11,0.3)]",
        tagClass: "bg-amber-950/50 text-amber-200 shadow-[inset_0_1px_0.5px_rgba(245,158,11,0.2)]",
        summaryBoxClass: "bg-amber-950/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border-0",
        summaryTextClass: "text-amber-100/90",
        authorNameClass: "text-amber-100",
        metaTextClass: "text-amber-200/60",
        dividerClass: "via-amber-400/20",
        qrBorderClass: "bg-amber-900/30 text-amber-300",
    },
};

/**
 * 提取学术正文摘要，并确保数学公式不会在中间被切断
 */
function extractAcademicSnippet(content: unknown, maxLength: number = 135): string {
    const raw = extractTextFromContent(content);
    if (!raw) return "探讨前沿学术命题，分享独到研究洞见。";

    const singleLine = raw.replace(/\r?\n+/g, " ").trim();
    if (singleLine.length <= maxLength) return singleLine;

    let cut = singleLine.slice(0, maxLength);

    // 检查是否有未闭合的数学公式标记 $
    const dollarMatches = cut.match(/\$/g);
    const dollarCount = dollarMatches ? dollarMatches.length : 0;
    if (dollarCount % 2 !== 0) {
        // 尝试向后寻找闭合的 $
        const nextDollar = singleLine.indexOf("$", maxLength);
        if (nextDollar !== -1 && nextDollar - maxLength < 35) {
            cut = singleLine.slice(0, nextDollar + 1);
        } else {
            // 否则截断至前一个 $ 处
            const lastDollar = cut.lastIndexOf("$");
            if (lastDollar > 20) {
                cut = cut.slice(0, lastDollar);
            }
        }
    }

    return cut.trim() + " ...";
}

export function ShareCardDialog({
    open,
    onOpenChange,
    postId,
    postTitle,
    post: propPost,
}: ShareCardDialogProps) {
    const [theme, setTheme] = useState<ShareCardTheme>("obsidian");
    const [fetchedPost, setFetchedPost] = useState<ShareCardPostData | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isCopyingImage, setIsCopyingImage] = useState(false);
    const [isCopyingLink, setIsCopyingLink] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);

    // 优先使用传入的 post，若无则按 postId 获取
    const activePost: ShareCardPostData = useMemo(() => {
        if (propPost) return propPost;
        if (fetchedPost) return fetchedPost;
        return {
            id: postId || "",
            title: postTitle || "学术探讨与深度分享",
            tags: [],
            author: { username: "学者" },
        };
    }, [propPost, fetchedPost, postId, postTitle]);

    // 如果没有外部传入完整的 post，通过客户端 Supabase 异步获取
    useEffect(() => {
        if (!open || propPost || !postId) return;

        let isMounted = true;
        const loadPostData = async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("posts")
                    .select(`
                        id,
                        title,
                        content,
                        tags,
                        created_at,
                        author:profiles!author_id (
                            username,
                            avatar_url,
                            special_title,
                            vip_level,
                            is_verified,
                            is_developer,
                            developer_title
                        )
                    `)
                    .eq("id", postId)
                    .single();

                if (!error && data && isMounted) {
                    const postAuthor = Array.isArray(data.author) ? data.author[0] : data.author;
                    setFetchedPost({
                        id: data.id,
                        title: data.title,
                        content: data.content,
                        tags: data.tags || [],
                        created_at: data.created_at,
                        author: postAuthor,
                    });
                }
            } catch (e) {
                console.error("Failed to fetch post for share card:", e);
            }
        };

        loadPostData();
        return () => {
            isMounted = false;
        };
    }, [open, postId, propPost]);

    // 格式化数据
    const activeTheme = themeConfigs[theme];
    const displayTitle = activePost.title || "学术前沿与理论洞察";
    const snippet = useMemo(
        () => extractAcademicSnippet(activePost.content),
        [activePost.content]
    );
    const tags = useMemo(() => (activePost.tags || []).slice(0, 3), [activePost.tags]);
    const authorName = activePost.author?.username || "Scholarly 学者";
    const authorInitials = authorName.slice(0, 2).toUpperCase();

    // 格式化日期
    const formattedDate = useMemo(() => {
        if (!activePost.created_at) return new Date().toLocaleDateString("zh-CN");
        return new Date(activePost.created_at).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }, [activePost.created_at]);

    // 安全头像 URL：若是外部网络图片，利用本地 proxy 代理，彻底避免 Canvas 跨域污染
    const safeAvatarUrl = useMemo(() => {
        const raw = activePost.author?.avatar_url;
        if (!raw) return null;
        if (raw.startsWith("http://") || raw.startsWith("https://")) {
            return `/api/proxy-avatar?url=${encodeURIComponent(raw)}`;
        }
        return raw;
    }, [activePost.author?.avatar_url]);

    // 下载高清卡片
    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        try {
            // 使用 2x Retina 分辨率生成超清图片
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: "transparent",
            });

            const link = document.createElement("a");
            const cleanTitle = displayTitle
                .replace(/[$}{]/g, "")
                .slice(0, 28)
                .replace(/[/\\?%*:|"<>]/g, "-");
            link.download = `${cleanTitle}-Scholarly学术分享.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("超清分享卡片已生成并下载");
        } catch (error) {
            console.error("Export card error:", error);
            toast.error("生成卡片失败，请重试");
        } finally {
            setIsExporting(false);
        }
    };

    // 一键复制图片到剪贴板
    const handleCopyImage = async () => {
        if (!cardRef.current) return;
        setIsCopyingImage(true);
        try {
            const blob = await toBlob(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                backgroundColor: "transparent",
            });

            if (!blob) throw new Error("Blob conversion failed");

            // 检查剪贴板写入权限
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "image/png": blob,
                    }),
                ]);
                toast.success("卡片图片已复制到剪贴板，可直接在微信/即时通讯中粘贴！");
            } else {
                toast.info("当前浏览器暂不支持直接复制图片，请使用【下载图片】");
            }
        } catch (error) {
            console.error("Copy image error:", error);
            toast.error("复制图片失败，请尝试直接下载");
        } finally {
            setIsCopyingImage(false);
        }
    };

    // 复制链接
    const handleCopyLink = async () => {
        try {
            setIsCopyingLink(true);
            const postUrl = typeof window !== "undefined" ? window.location.href : "";
            await navigator.clipboard.writeText(postUrl);
            toast.success("文章链接已复制到剪贴板");
        } catch {
            toast.error("复制链接失败");
        } finally {
            setTimeout(() => setIsCopyingLink(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl p-0 overflow-hidden border-0 rounded-3xl bg-zinc-950/80 backdrop-blur-2xl text-foreground shadow-[0_32px_96px_-16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] max-h-[92vh] flex flex-col"
                aria-describedby={undefined}
            >
                {/* 顶栏 Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-sky-400" />
                            生成学术分享卡片
                        </DialogTitle>
                    </DialogHeader>

                    {/* 风格切换水滴胶囊组 */}
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                        {(Object.keys(themeConfigs) as ShareCardTheme[]).map((themeKey) => {
                            const config = themeConfigs[themeKey];
                            const isActive = theme === themeKey;
                            return (
                                <button
                                    key={themeKey}
                                    type="button"
                                    onClick={() => setTheme(themeKey)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border-0",
                                        isActive
                                            ? "bg-white/20 text-white shadow-[0_2px_12px_rgba(0,0,0,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.4)]"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                    )}
                                >
                                    {config.icon}
                                    <span>{config.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 渐变消融分隔光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 卡片预览容器 */}
                <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-[760px] aspect-[16/9.2] relative select-none">
                        {/* 实际渲染的卡片 DOM：所见即所得，同时供 html-to-image 捕获 */}
                        <div
                            ref={cardRef}
                            className={cn(
                                "w-full h-full relative overflow-hidden rounded-3xl p-7 sm:p-9 flex flex-col justify-between border-0 transition-all duration-300",
                                activeTheme.cardBg,
                                activeTheme.wrapperClass
                            )}
                            style={{
                                boxShadow:
                                    "0 24px 72px -12px rgba(0,0,0,0.45), inset 0 1px 1px 0 rgba(255,255,255,0.25)",
                            }}
                        >
                            {/* 背景物理环境微光晕 */}
                            <div
                                className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-60 transition-colors duration-500"
                                style={{ background: activeTheme.auraColor }}
                            />
                            <div
                                className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-500"
                                style={{ background: activeTheme.auraColor }}
                            />

                            {/* 1. 顶栏：真实的 Scholarly 品牌与学科标签 */}
                            <div className="relative z-10 flex items-center justify-between">
                                {/* 左侧官方品牌区 */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-2xl flex items-center justify-center p-1.5 backdrop-blur-md border-0 transition-colors",
                                            activeTheme.headerLogoBg
                                        )}
                                    >
                                        <Image
                                            src="/logo.png"
                                            alt="Scholarly Logo"
                                            width={32}
                                            height={32}
                                            priority
                                            unoptimized
                                            className="w-full h-full object-contain drop-shadow-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold tracking-tight">
                                                Scholarly
                                            </span>
                                            <span
                                                className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide border-0 backdrop-blur-md",
                                                    activeTheme.badgeClass
                                                )}
                                            >
                                                学术交流社区 · 同行研讨
                                            </span>
                                        </div>
                                        <span className="text-[10px] opacity-60 tracking-wider uppercase font-mono">
                                            Academic Research Network
                                        </span>
                                    </div>
                                </div>

                                {/* 右侧标签胶囊 */}
                                {tags.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-medium border-0 backdrop-blur-md transition-colors",
                                                    activeTheme.tagClass
                                                )}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 渐变消融微光缝 */}
                            <div
                                className={cn(
                                    "relative z-10 h-[1px] w-full bg-gradient-to-r from-transparent to-transparent my-3.5",
                                    activeTheme.dividerClass
                                )}
                            />

                            {/* 2. 核心学术内容区：完美渲染数学公式的标题与摘要 */}
                            <div className="relative z-10 flex-1 flex flex-col justify-center my-1">
                                {/* 帖子标题：支持 KaTeX 数学公式排版 */}
                                <h1
                                    className={cn(
                                        "text-xl sm:text-2xl lg:text-[26px] tracking-tight leading-snug line-clamp-2 mb-3.5",
                                        activeTheme.titleClass
                                    )}
                                >
                                    <MathText text={displayTitle} inlineOnly />
                                </h1>

                                {/* 正文学术摘录：优雅的引述 Liquid Glass 视窗，支持公式 */}
                                <div
                                    className={cn(
                                        "p-4 rounded-2xl backdrop-blur-md relative overflow-hidden transition-colors",
                                        activeTheme.summaryBoxClass
                                    )}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400/80 via-indigo-400/60 to-transparent"
                                    />
                                    <p
                                        className={cn(
                                            "text-xs sm:text-sm leading-relaxed line-clamp-3 pl-1 font-normal",
                                            activeTheme.summaryTextClass
                                        )}
                                    >
                                        <MathText text={snippet} inlineOnly={false} />
                                    </p>
                                </div>
                            </div>

                            {/* 渐变消融微光缝 */}
                            <div
                                className={cn(
                                    "relative z-10 h-[1px] w-full bg-gradient-to-r from-transparent to-transparent my-3.5",
                                    activeTheme.dividerClass
                                )}
                            />

                            {/* 3. 底栏：真实学者身份卡片与学术防伪印章 */}
                            <div className="relative z-10 flex items-center justify-between">
                                {/* 作者名片 */}
                                <div className="flex items-center gap-3">
                                    {safeAvatarUrl ? (
                                        <div className="relative w-11 h-11 rounded-full overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.25)] ring-2 ring-white/20">
                                            {/* 使用标准 img 元素配合 crossOrigin 保证 html-to-image 捕获 */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={safeAvatarUrl}
                                                alt={authorName}
                                                crossOrigin="anonymous"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className={cn(
                                                "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm tracking-wider shadow-[0_4px_16px_rgba(0,0,0,0.25)] ring-2 ring-white/20 border-0",
                                                activeTheme.badgeClass
                                            )}
                                        >
                                            {authorInitials}
                                        </div>
                                    )}

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                                className={cn(
                                                    "font-semibold text-sm tracking-tight",
                                                    activeTheme.authorNameClass
                                                )}
                                            >
                                                {authorName}
                                            </span>
                                            {activePost.author?.is_verified && (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] bg-blue-500/15 text-blue-400 font-medium">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    认证学者
                                                </span>
                                            )}
                                            {activePost.author?.special_title && (
                                                <span className="px-2 py-0.2 rounded-full text-[10px] bg-purple-500/15 text-purple-300 font-medium">
                                                    {activePost.author.special_title}
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[11px] font-mono mt-0.5",
                                                activeTheme.metaTextClass
                                            )}
                                        >
                                            发表于 {formattedDate} · 学术论述
                                        </span>
                                    </div>
                                </div>

                                {/* 右侧防伪印记 / 认证指纹 */}
                                <div
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md border-0 transition-colors",
                                        activeTheme.qrBorderClass
                                    )}
                                >
                                    <div className="flex flex-col items-end text-right">
                                        <span className="text-[10px] font-semibold tracking-wider uppercase">
                                            Scholarly Insight
                                        </span>
                                        <span className="text-[9px] opacity-70 font-mono">
                                            ID: {(activePost.id || "forum").slice(0, 8)}
                                        </span>
                                    </div>
                                    <div className="w-6 h-6 rounded-lg bg-current/10 flex items-center justify-center p-1">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 渐变消融分隔光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 底栏操作区（严格遵照 UI-DESIGN-RULES：水滴胶囊 rounded-full，核心 CTA 黑曜石液态玻璃与白月光晶体） */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-zinc-950/90">
                    <p className="text-xs text-zinc-400 hidden sm:block">
                        ✨ 超清 2x 导出，公式与排版已完全矢量化渲染，可自由分发分享
                    </p>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        {/* 复制链接 */}
                        <Button
                            variant="ghost"
                            onClick={handleCopyLink}
                            className="rounded-full text-xs h-9 px-4 text-zinc-300 hover:text-white hover:bg-white/10 gap-1.5 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                        >
                            {isCopyingLink ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                            复制链接
                        </Button>

                        {/* 一键复制图片到剪贴板 */}
                        <Button
                            variant="outline"
                            onClick={handleCopyImage}
                            disabled={isCopyingImage || isExporting}
                            className="rounded-full text-xs h-9 px-4 text-zinc-200 bg-white/5 hover:bg-white/10 hover:text-white gap-1.5 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]"
                        >
                            {isCopyingImage ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            )}
                            复制图片
                        </Button>

                        {/* 下载超清图片（Primary CTA 核心行动点） */}
                        <Button
                            onClick={handleDownload}
                            disabled={isExporting}
                            className="rounded-full text-xs h-9 px-5 gap-1.5 border-0 bg-white text-zinc-950 font-semibold hover:bg-zinc-100 shadow-[0_4px_16px_-2px_rgba(255,255,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.9)] active:scale-95 transition-all"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    生成高清图中...
                                </>
                            ) : (
                                <>
                                    <Download className="h-3.5 w-3.5" />
                                    下载高清卡片
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
