"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { VipBadge } from "@/components/payments/VipBadge";
import { PostAnnotation, AnnotationColor } from "./types";
import { cn, formatDate } from "@/lib/utils";
import {
    CheckCircle2,
    MessageSquare,
    CornerDownRight,
    Send,
    Trash2,
    ChevronDown,
    ChevronUp,
    Quote,
    Sparkles,
    Check,
    RotateCcw,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface MarginNotesPanelProps {
    annotations: PostAnnotation[];
    activeAnnotationId: string | null;
    onSelectAnnotation: (id: string) => void;
    onScrollToAnchor: (annotation: PostAnnotation) => void;
    onReply: (annotationId: string, content: string) => Promise<void>;
    onToggleResolve: (annotationId: string) => Promise<void>;
    onDelete: (annotationId: string) => Promise<void>;
    currentUserId?: string;
    isPostAuthor?: boolean;
    className?: string;
}

const COLOR_CONFIG: Record<
    AnnotationColor,
    { label: string; dotClass: string; borderClass: string; bgClass: string }
> = {
    amber: {
        label: "推导",
        dotClass: "bg-amber-500",
        borderClass: "border-l-amber-500",
        bgClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    emerald: {
        label: "佐证",
        dotClass: "bg-emerald-500",
        borderClass: "border-l-emerald-500",
        bgClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    sky: {
        label: "存疑",
        dotClass: "bg-sky-500",
        borderClass: "border-l-sky-500",
        bgClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    violet: {
        label: "延伸",
        dotClass: "bg-purple-500",
        borderClass: "border-l-purple-500",
        bgClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    },
};

export function MarginNotesPanel({
    annotations,
    activeAnnotationId,
    onSelectAnnotation,
    onScrollToAnchor,
    onReply,
    onToggleResolve,
    onDelete,
    currentUserId,
    isPostAuthor = false,
    className,
}: MarginNotesPanelProps) {
    const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // 当 activeAnnotationId 变化时，平滑滚动至对应的卡片
    useEffect(() => {
        if (activeAnnotationId && cardRefs.current[activeAnnotationId]) {
            cardRefs.current[activeAnnotationId]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [activeAnnotationId]);

    const filteredAnnotations = annotations.filter((a) => {
        if (filter === "open") return !a.is_resolved;
        if (filter === "resolved") return a.is_resolved;
        return true;
    });

    const handleSendReply = async (annotationId: string) => {
        if (!replyText.trim() || submittingReply) return;
        setSubmittingReply(true);
        try {
            await onReply(annotationId, replyText.trim());
            setReplyText("");
            setReplyingId(null);
            toast.success("回复已发布");
        } catch {
            toast.error("回复失败，请重试");
        } finally {
            setSubmittingReply(false);
        }
    };

    return (
        <div className={cn("space-y-4 w-full", className)}>
            {/* 顶部统计与状态过滤胶囊 */}
            <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                        行间研讨 ({annotations.length})
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/60 p-0.5 rounded-full">
                    <button
                        type="button"
                        onClick={() => setFilter("all")}
                        className={cn(
                            "px-2 py-0.5 text-[11px] rounded-full font-medium transition-all",
                            filter === "all"
                                ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        全部
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("open")}
                        className={cn(
                            "px-2 py-0.5 text-[11px] rounded-full font-medium transition-all",
                            filter === "open"
                                ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        探讨中
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter("resolved")}
                        className={cn(
                            "px-2 py-0.5 text-[11px] rounded-full font-medium transition-all",
                            filter === "resolved"
                                ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        已结题
                    </button>
                </div>
            </div>

            {/* 批注卡片列表 */}
            {filteredAnnotations.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border-0 text-center space-y-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                    <div className="mx-auto w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-foreground">
                        {filter === "all" ? "暂无行间批注" : filter === "open" ? "无未解决的批注" : "暂无已结题批注"}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        在正文中用鼠标划选任意句子或公式，点击“添加批注”即可在此展开学术微线程探讨。
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAnnotations.map((annotation) => {
                        const isActive = activeAnnotationId === annotation.id;
                        const config = COLOR_CONFIG[annotation.color] || COLOR_CONFIG.amber;
                        const isOwner = !!(currentUserId && isPostAuthor);
                        const isCreator = !!(currentUserId && currentUserId === annotation.author_id);
                        const canResolve = isOwner; // 标记已完成/结题裁定权严格属于文章主人
                        const canDelete = isCreator || isOwner; // 批注作者可撤回，文章主人可管理删除

                        return (
                            <div
                                key={annotation.id}
                                ref={(el) => {
                                    cardRefs.current[annotation.id] = el;
                                }}
                                onClick={() => onSelectAnnotation(annotation.id)}
                                className={cn(
                                    "group relative p-3.5 rounded-2xl transition-all duration-200 border-0 cursor-pointer",
                                    "bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl",
                                    "shadow-[0_6px_24px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                                    "dark:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)]",
                                    isActive
                                        ? "ring-2 ring-amber-500/50 dark:ring-amber-400/50 bg-amber-500/5"
                                        : "hover:bg-white dark:hover:bg-zinc-800/80"
                                )}
                            >
                                {/* 顶部作者与操作状态 */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Avatar className="h-5 w-5 shrink-0 rounded-full ring-1 ring-primary/10">
                                            <AvatarImage src={annotation.author?.avatar_url} />
                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                {annotation.author?.username?.charAt(0) || "学"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            {annotation.author?.username}
                                        </span>
                                        {annotation.author?.is_verified && (
                                            <VerifiedBadge provider={annotation.author.auth_provider} />
                                        )}
                                        {annotation.author?.vip_level && (
                                            <VipBadge vipLevel={annotation.author.vip_level} size="sm" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                                            config.bgClass
                                        )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
                                            {config.label}
                                        </span>
                                        {annotation.is_resolved && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <Check className="w-2.5 h-2.5" />
                                                结题
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 被引正文选段（点击可平滑滚动回到正文对应段落） */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onScrollToAnchor(annotation);
                                    }}
                                    className="w-full text-left p-2 mb-2 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/40 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 transition-colors flex items-start gap-1.5 group/quote"
                                    title="点击回到正文对应段落"
                                >
                                    <Quote className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed group-hover/quote:text-foreground transition-colors">
                                        <MathText text={annotation.anchor_text} inlineOnly />
                                    </p>
                                </button>

                                {/* 批注正文内容 */}
                                <div className="text-xs text-foreground/90 leading-relaxed font-sans mb-2.5">
                                    <MathText text={annotation.content} />
                                </div>

                                {/* 底部元数据与操作条 */}
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground/75 pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                    <span suppressHydrationWarning>
                                        {formatDate(annotation.created_at)}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        {/* 回复按钮 */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReplyingId(replyingId === annotation.id ? null : annotation.id);
                                            }}
                                            className="px-2 py-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            回复 {annotation.replies && annotation.replies.length > 0 && `(${annotation.replies.length})`}
                                        </button>

                                        {/* 结题/解开切换：仅文章主人可见可操作 */}
                                        {canResolve && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleResolve(annotation.id);
                                                }}
                                                className={cn(
                                                    "px-2 py-0.5 rounded-full transition-colors",
                                                    annotation.is_resolved
                                                        ? "text-amber-600 hover:bg-amber-500/10"
                                                        : "text-emerald-600 hover:bg-emerald-500/10"
                                                )}
                                                title={annotation.is_resolved ? "重新开启探讨" : "标记为已解决"}
                                            >
                                                {annotation.is_resolved ? "重开" : "解决"}
                                            </button>
                                        )}

                                        {/* 删除与撤回：批注作者可撤回，文章主人可管理删除 */}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("确定删除此条批注吗？")) {
                                                        onDelete(annotation.id);
                                                    }
                                                }}
                                                className="p-1 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                                title="删除批注"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 嵌套回复微线程列表 */}
                                {annotation.replies && annotation.replies.length > 0 && (
                                    <div className="mt-2.5 pt-2 space-y-2 border-t border-zinc-100 dark:border-zinc-800/40 pl-2.5 border-l-2 border-l-primary/20">
                                        {annotation.replies.map((reply) => (
                                            <div key={reply.id} className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar className="h-4 w-4 rounded-full">
                                                        <AvatarImage src={reply.author?.avatar_url} />
                                                        <AvatarFallback className="text-[8px]">
                                                            {reply.author?.username?.charAt(0) || "学"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[11px] font-medium text-foreground">
                                                        {reply.author?.username}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground/60 ml-auto" suppressHydrationWarning>
                                                        {formatDate(reply.created_at)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-foreground/85 pl-5 leading-relaxed">
                                                    <MathText text={reply.content} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 回复输入框 */}
                                {replyingId === annotation.id && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-1.5"
                                    >
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="撰写学术微回复（支持公式）..."
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply(annotation.id);
                                                }
                                            }}
                                            className={cn(
                                                "flex-1 h-7 px-2.5 text-xs rounded-full border-0",
                                                "bg-zinc-100/70 dark:bg-zinc-800/60 text-foreground",
                                                "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={!replyText.trim() || submittingReply}
                                            onClick={() => handleSendReply(annotation.id)}
                                            className="h-7 w-7 p-0 rounded-full bg-primary text-primary-foreground shrink-0"
                                        >
                                            {submittingReply ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Send className="w-3 h-3" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
