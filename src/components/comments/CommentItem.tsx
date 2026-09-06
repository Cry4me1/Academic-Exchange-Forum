"use client";

import { deleteComment, toggleLikeComment } from "@/app/posts/[id]/actions";
import { toggleAcceptAnswer } from "@/app/(protected)/posts/actions";
import NovelViewer from "@/components/editor/NovelViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { CheckCircle2, ChevronUp, CornerDownRight, Link2, Trash2, Clock, AlertCircle, Sparkles, Bot } from "lucide-react";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { ensureTipTapContent } from "@/lib/markdown-to-tiptap";

import { VerifiedBadge } from "@/components/ui/verified-badge";
import { VipBadge } from "@/components/payments/VipBadge";

export interface CommentAuthor {
    id: string;
    username: string;
    avatar_url?: string;
    title?: string;
    vip_level?: number | null;
    special_title?: string | null;
    badges?: string[] | null;
    is_verified?: boolean;
    auth_provider?: string;
}

export interface CommentData {
    id: string;
    post_id?: string;
    content: object;
    author: CommentAuthor;
    created_at: string;
    like_count: number;
    replies?: CommentData[];
    is_accepted?: boolean;
    review_status?: string;
    ai_score?: number | null;
    ai_risk_level?: string | null;
    ai_reason?: string | null;
    matched_sensitive_words?: string[] | null;
}

interface CommentItemProps {
    comment: CommentData;
    postId: string;
    postAuthorId?: string;  // 帖子作者 ID，用于标记"作者"徽章
    currentUserId?: string;
    depth?: number;
    maxDepth?: number;
    onReply?: (parentId: string) => void;
    onDelete?: (commentId: string) => void;
    isLiked?: boolean;
    isPostAuthor?: boolean;
    onAccept?: (commentId: string) => void;
}

export function CommentItem({
    comment,
    postId,
    postAuthorId,
    currentUserId,
    depth = 0,
    maxDepth = 2,
    onReply,
    onDelete,
    isLiked: initialIsLiked = false,
    isPostAuthor = false,
    onAccept,
}: CommentItemProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(comment.like_count);
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAccepted, setIsAccepted] = useState(comment.is_accepted);

    // 判断该评论是否为帖子原作者所发
    const isOriginalPoster = comment.author.id === postAuthorId;

    const handleAccept = async () => {
        if (!isPostAuthor) return;

        const newAccepted = !isAccepted;
        setIsAccepted(newAccepted);
        onAccept?.(comment.id);

        const result = await toggleAcceptAnswer(comment.id);
        if (result.error) {
            setIsAccepted(!newAccepted);
            toast.error(result.error);
        } else {
            toast.success(newAccepted ? "已采纳回答" : "已取消采纳");
        }
    };

    const handleLike = () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        startTransition(async () => {
            const result = await toggleLikeComment(comment.id);
            if (result.error) {
                setIsLiked(!newLiked);
                setLikeCount(newLiked ? likeCount : likeCount + 1);
                toast.error(result.error);
            }
        });
    };

    const handleReply = () => {
        onReply?.(comment.id);
    };

    const handleDelete = async () => {
        if (!confirm("确定要删除这条评论吗？")) return;

        setIsDeleting(true);
        const result = await deleteComment(comment.id, postId);
        setIsDeleting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("评论已删除");
            onDelete?.(comment.id);
        }
    };

    // 分享评论链接
    const shareCommentLink = (commentId: string) => {
        const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("评论链接已复制");
        });
    };

    const authorInitials = comment.author.username?.slice(0, 2).toUpperCase() || "?";
    const isNested = depth > 0;
    const isAuthor = currentUserId === comment.author.id;
    const isAiComment =
        comment.author.id === "00000000-0000-0000-0000-0000000000a1" ||
        comment.author.username === "Scholarly AI";

    // 自愈与规范化解析评论内容（支持 Markdown、单/双美元 LaTeX、旧版 doc 自动重构）
    const safeContent = useMemo(() => {
        return ensureTipTapContent(comment.content);
    }, [comment.content]);

    return (
        <div
            id={`comment-${comment.id}`}
            className={cn(
                "scroll-mt-24 transition-all duration-200",
                isNested && "ml-8 border-l-2 border-border/50 pl-4",
                isAccepted && "bg-green-500/5 rounded-xl border border-green-500/20 p-2 -mx-2",
                // AI 评论：采用纯粹一体化的学术紫底色，消除白色断层与 UI 割裂
                isAiComment && "bg-purple-50/80 dark:bg-purple-950/25 rounded-2xl border border-purple-200/80 dark:border-purple-800/50 p-4 -mx-2 shadow-xs ring-1 ring-purple-500/10"
            )}
        >
            <div className="py-2 group/comment">
                {/* 评论头部 */}
                <div className="flex items-start gap-3">
                    {/* 投票计数器 (仅顶级评论显示) */}
                    {!isNested && (
                        <div className="flex flex-col items-center gap-0.5 pt-1 flex-shrink-0">
                            <button
                                onClick={handleLike}
                                disabled={isPending}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md transition-all",
                                    isLiked
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                )}
                            >
                                <ChevronUp className={cn("h-5 w-5", isLiked && "text-primary")} />
                                <span className={cn(
                                    "text-sm tabular-nums font-semibold",
                                    isLiked && "text-primary"
                                    )}>
                                    {likeCount}
                                </span>
                            </button>
                        </div>
                    )}

                    <Avatar className={cn("h-9 w-9 flex-shrink-0", isAiComment && "ring-2 ring-purple-500/40 shadow-xs")}>
                        <AvatarImage src={comment.author.avatar_url} alt={comment.author.username} />
                        <AvatarFallback className={cn(
                            "text-xs font-semibold",
                            isAiComment
                                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                                : "bg-gradient-to-br from-primary/30 to-primary/10 text-primary"
                        )}>
                            {isAiComment ? <Bot className="h-4 w-4" /> : authorInitials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        {/* 用户名和时间 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn("font-medium text-sm", isAiComment ? "text-purple-400 font-semibold" : "text-foreground")}>
                                {comment.author.username}
                            </span>
                            {isAiComment ? (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 rounded-full">
                                    <Sparkles className="h-2.5 w-2.5 text-purple-500 animate-pulse" />
                                    AI 学术智脑
                                </span>
                            ) : (
                                <>
                                    {comment.author.is_verified && (
                                        <VerifiedBadge provider={comment.author.auth_provider} />
                                    )}
                                    <VipBadge vipLevel={comment.author.vip_level || 1} size="xs" />
                                </>
                            )}
                            {/* 作者标记 */}
                            {isOriginalPoster && (
                                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                    作者
                                </span>
                            )}
                            {comment.author.title && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                    {comment.author.title}
                                </span>
                            )}
                            {comment.author.special_title && !isAiComment && (
                                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded">
                                    {comment.author.special_title}
                                </span>
                            )}
                            {isAccepted && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.2 rounded border border-green-500/20">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    已采纳
                                </span>
                            )}
                            {comment.review_status === "pending" && (
                                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                                    <Clock className="h-3 w-3" />
                                    审核中
                                </span>
                            )}
                            {comment.review_status === "rejected" && (
                                <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                                    <AlertCircle className="h-3 w-3" />
                                    未通过审核
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(comment.created_at)}
                            </span>
                        </div>

                        {/* 评论内容 — 富文本与学术数学公式渲染 */}
                        <div className="mt-2 w-full">
                            <NovelViewer
                                initialValue={safeContent}
                                className="bg-transparent"
                                editorClassName="prose-sm sm:prose-base max-w-none text-foreground"
                            />
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-3 mt-3">
                            {/* 嵌套评论使用行内点赞按钮 */}
                            {isNested && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 gap-1.5 text-xs",
                                        isLiked ? "text-primary" : "text-muted-foreground"
                                    )}
                                    onClick={handleLike}
                                    disabled={isPending}
                                >
                                    <ChevronUp className={cn("h-3.5 w-3.5", isLiked && "text-primary")} />
                                    {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
                                </Button>
                            )}

                            {depth < maxDepth - 1 && onReply && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 gap-1.5 text-xs text-muted-foreground"
                                    onClick={handleReply}
                                >
                                    <CornerDownRight className="h-3.5 w-3.5" />
                                    回复
                                </Button>
                            )}

                            {/* 分享评论链接 */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 gap-1.5 text-xs text-muted-foreground opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                onClick={() => shareCommentLink(comment.id)}
                            >
                                <Link2 className="h-3.5 w-3.5" />
                                链接
                            </Button>

                            {isAuthor && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {isDeleting ? "删除中..." : "删除"}
                                </Button>
                            )}

                            {isPostAuthor && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 gap-1.5 text-xs",
                                        isAccepted
                                            ? "text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                            : "text-muted-foreground hover:text-green-600"
                                    )}
                                    onClick={handleAccept}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isAccepted ? "取消采纳" : "采纳"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 递归渲染回复（仅限旧方式兼容，推荐外部使用 CollapsibleReplies 来渲染回复） */}
            {comment.replies && comment.replies.length > 0 && depth < maxDepth - 1 && depth > 0 && (
                <div className="space-y-0">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            postAuthorId={postAuthorId}
                            currentUserId={currentUserId}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                            onReply={onReply}
                            onDelete={onDelete}
                            isPostAuthor={isPostAuthor}
                            onAccept={onAccept}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentItem;
