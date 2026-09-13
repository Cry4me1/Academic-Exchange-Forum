"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Message } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";
import { CheckCheck, Clock, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatContentViewer, ChatTextMathViewer } from "./ChatEditor";
import { ChatCodeBlock, parseCodeBlocks } from "./ChatCodeBlock";
import { FilePreview } from "./FilePreview";
import DOMPurify from "isomorphic-dompurify";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ChatBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string | null;
    canRevoke?: boolean;
    onRevoke?: (messageId: string) => Promise<{ success: boolean; error?: string }>;
}

export function ChatBubble({
    message,
    isOwn,
    showAvatar = true,
    senderName,
    senderAvatar,
    canRevoke = false,
    onRevoke,
}: ChatBubbleProps) {
    const [isRevoking, setIsRevoking] = useState(false);

    const formatTime = (dateString?: string | null) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const initials = (senderName || "?").charAt(0).toUpperCase();

    // 处理撤回
    const handleRevoke = async () => {
        if (!onRevoke || isRevoking) return;

        setIsRevoking(true);
        const result = await onRevoke(message.id);
        setIsRevoking(false);

        if (!result.success) {
            toast.error(result.error || "撤回失败");
        } else {
            toast.success("消息已撤回");
        }
    };

    // 解析代码块（仅对富文本消息）
    const contentParts = useMemo(() => {
        if (message.content_type === "rich_text" && message.content) {
            return parseCodeBlocks(message.content);
        }
        return null;
    }, [message.content, message.content_type]);

    // 撤回的消息显示
    if (message.is_revoked) {
        return (
            <div
                className={cn(
                    "flex gap-2 max-w-[75%] sm:max-w-[60%]",
                    isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
            >
                {showAvatar && (
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5 opacity-50 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                        <AvatarImage src={senderAvatar || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className={cn("flex flex-col gap-0.5", isOwn ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-850/50 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] text-xs text-zinc-500 dark:text-zinc-400 italic">
                        <RotateCcw className="h-3 w-3" />
                        <span>{isOwn ? "你撤回了一条消息" : "对方撤回了一条消息"}</span>
                        <span className="text-[10px] opacity-70 ml-1 font-normal">
                            {formatTime(message.revoked_at || message.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // 时间 + 已读状态（紧凑内联组件）
    const inlineTimestamp = (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 ml-2.5 float-right translate-y-[2px] text-[10px] leading-none select-none font-normal shrink-0",
                isOwn
                    ? "text-white/70 dark:text-zinc-900/70"
                    : "text-zinc-400 dark:text-zinc-500"
            )}
        >
            <span>{formatTime(message.created_at)}</span>
            {isOwn && (
                message.is_read ? (
                    <CheckCheck className="h-3 w-3 text-emerald-400 dark:text-emerald-600 inline ml-0.5" />
                ) : (
                    <Clock className="h-2.5 w-2.5 opacity-70 inline ml-0.5" />
                )
            )}
        </span>
    );

    // 渲染富文本内容（含代码块分离）
    const renderRichContent = () => {
        if (!contentParts || contentParts.length === 0) return null;

        const hasCodeBlocks = contentParts.some((p) => p.type === "code");

        if (!hasCodeBlocks) {
            return (
                <div
                    className={cn(
                        "rounded-[18px] px-3.5 py-2 max-w-full break-words border-0 backdrop-blur-xl transition-shadow",
                        isOwn
                            ? "bg-zinc-950/90 text-white dark:bg-white/95 dark:text-zinc-950 rounded-br-xs shadow-[0_4px_16px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                            : "bg-white/85 text-zinc-900 dark:bg-zinc-900/80 dark:text-zinc-100 rounded-bl-xs shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.95)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                    )}
                >
                    <div className="overflow-hidden">
                        <ChatContentViewer
                            content={message.content}
                            className={cn(
                                "text-sm",
                                isOwn ? "text-white prose-invert dark:text-zinc-900 dark:prose-headings:text-zinc-900" : ""
                            )}
                        />
                        {inlineTimestamp}
                    </div>
                </div>
            );
        }

        // 有代码块，分段渲染
        return (
            <div className="flex flex-col gap-1 max-w-full">
                {contentParts.map((part, idx) => {
                    if (part.type === "code") {
                        return (
                            <ChatCodeBlock
                                key={idx}
                                code={part.content}
                                language={part.language}
                            />
                        );
                    }
                    // 文本段
                    const sanitizedHtml = DOMPurify.sanitize(part.content, {
                        ALLOWED_TAGS: [
                            "p", "br", "strong", "b", "em", "i", "u", "s", "del",
                            "ul", "ol", "li", "blockquote",
                            "a", "span", "sub", "sup", "mark", "code",
                        ],
                        ALLOWED_ATTR: ["href", "target", "rel", "class"],
                    });
                    const stripped = sanitizedHtml.replace(/<[^>]*>/g, "").trim();
                    if (!stripped) return null;

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "rounded-[18px] px-3.5 py-2 max-w-full break-words border-0 backdrop-blur-xl transition-shadow",
                                isOwn
                                    ? "bg-zinc-950/90 text-white dark:bg-white/95 dark:text-zinc-950 rounded-br-xs shadow-[0_4px_16px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                                    : "bg-white/85 text-zinc-900 dark:bg-zinc-900/80 dark:text-zinc-100 rounded-bl-xs shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.95)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                            )}
                        >
                            <div
                                className={cn(
                                    "prose prose-sm dark:prose-invert max-w-none break-words",
                                    "prose-p:my-0 prose-ul:my-0.5 prose-ol:my-0.5 prose-blockquote:my-0.5",
                                    isOwn ? "text-white prose-invert dark:text-zinc-900 dark:prose-headings:text-zinc-900" : ""
                                )}
                                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                            />
                            {idx === contentParts.length - 1 && inlineTimestamp}
                        </div>
                    );
                })}
            </div>
        );
    };

    const bubbleContent = (
        <div
            className={cn(
                "flex gap-2 max-w-[80%] sm:max-w-[65%] w-fit",
                isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
        >
            {/* 头像 */}
            {!isOwn && (
                <div className="w-7 flex-shrink-0">
                    {showAvatar && (
                        <Avatar className="h-7 w-7 mt-0.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_6px_rgba(0,0,0,0.06)]">
                            <AvatarImage src={senderAvatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-zinc-200/90 to-zinc-100/90 dark:from-zinc-700/80 dark:to-zinc-800/80 text-zinc-600 dark:text-zinc-300 text-[10px] font-semibold shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}

            <div className={cn("flex flex-col gap-0.5 min-w-0", isOwn ? "items-end" : "items-start")}>
                {/* 消息气泡 */}
                {message.content_type === "rich_text" ? (
                    renderRichContent()
                ) : (
                    <div
                        className={cn(
                            "rounded-[18px] px-3.5 py-1.5 max-w-full break-words border-0 backdrop-blur-xl transition-shadow",
                            isOwn
                                ? "bg-zinc-950/90 text-white dark:bg-white/95 dark:text-zinc-950 rounded-br-xs shadow-[0_4px_16px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                                : "bg-white/85 text-zinc-900 dark:bg-zinc-900/80 dark:text-zinc-100 rounded-bl-xs shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.95)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                        )}
                    >
                        {/* 紧凑内联布局：文字与时间戳自然流式排列 */}
                        <div className="text-sm leading-snug">
                            <span className="break-words">
                                <ChatTextMathViewer
                                    content={message.content}
                                    className={cn(
                                        "inline text-sm leading-snug",
                                        isOwn ? "text-white dark:text-zinc-900" : ""
                                    )}
                                />
                            </span>
                            {/* 内嵌时间戳 + 已读标记 */}
                            {inlineTimestamp}
                        </div>

                        {/* 引用帖子 */}
                        {message.content_type === "post_reference" && message.referenced_post && (
                            <Link
                                href={`/posts/${message.referenced_post.id}`}
                                className={cn(
                                    "flex items-center gap-2 mt-1.5 p-1.5 rounded-xl border-0 backdrop-blur-md transition-all text-xs active:scale-[0.98]",
                                    isOwn
                                        ? "bg-white/15 hover:bg-white/25 dark:bg-zinc-900/15 dark:hover:bg-zinc-900/25 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                                        : "bg-white/90 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)]"
                                )}
                            >
                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="font-medium truncate">
                                    {message.referenced_post.title}
                                </span>
                            </Link>
                        )}
                    </div>
                )}

                {/* 附件列表 */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-1.5 mt-0.5">
                        {message.attachments.map((attachment) => (
                            <FilePreview
                                key={attachment.id}
                                attachment={{
                                    id: attachment.id,
                                    messageId: attachment.message_id,
                                    fileName: attachment.file_name,
                                    fileType: attachment.file_type,
                                    fileSize: attachment.file_size,
                                    storagePath: attachment.storage_path,
                                    publicUrl: attachment.public_url,
                                    expiresAt: attachment.expires_at,
                                    isExpired: attachment.is_expired,
                                    createdAt: attachment.created_at,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* 撤回提示（气泡外） */}
                {isOwn && canRevoke && (
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 px-1">
                        右键可撤回
                    </span>
                )}
            </div>
        </div>
    );

    // 如果可以撤回，包装在右键菜单中
    if (isOwn && canRevoke && onRevoke) {
        return (
            <ContextMenu>
                <ContextMenuTrigger asChild>{bubbleContent}</ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem
                        onClick={handleRevoke}
                        disabled={isRevoking}
                        className="text-destructive focus:text-destructive text-xs"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        {isRevoking ? "撤回中..." : "撤回消息"}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    }

    return bubbleContent;
}

interface ChatMessagesProps {
    messages: Message[];
    currentUserId: string;
    partnerName?: string;
    partnerAvatar?: string | null;
    currentUserName?: string;
    currentUserAvatar?: string | null;
    canRevoke?: (message: Message) => boolean;
    onRevoke?: (messageId: string) => Promise<{ success: boolean; error?: string }>;
}

export function ChatMessages({
    messages,
    currentUserId,
    partnerName,
    partnerAvatar,
    currentUserName,
    currentUserAvatar,
    canRevoke,
    onRevoke,
}: ChatMessagesProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(messages.length);

    useIsomorphicLayoutEffect(() => {
        if (scrollRef.current) {
            const isInitialLoad = prevMessagesLength.current === 0;
            const targetScrollTop = scrollRef.current.scrollHeight;

            if (isInitialLoad) {
                scrollRef.current.scrollTo({ top: targetScrollTop, behavior: "auto" });
            } else if (messages.length > prevMessagesLength.current) {
                scrollRef.current.scrollTo({ top: targetScrollTop, behavior: "smooth" });
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages]);

    // 按日期分组消息
    const groupedMessages = messages.reduce<
        { date: string; messages: Message[] }[]
    >((groups, message) => {
        let date = "今天";
        if (message.created_at) {
            const parsed = new Date(message.created_at);
            if (!isNaN(parsed.getTime())) {
                date = parsed.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            }
        }

        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === date) {
            lastGroup.messages.push(message);
        } else {
            groups.push({ date, messages: [message] });
        }

        return groups;
    }, []);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="w-full space-y-3">
                {groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-1.5">
                        {/* 日期分隔符 - 紧凑轻量 */}
                        <div className="flex items-center justify-center my-3">
                            <span className="px-3 py-0.5 rounded-full border-0 bg-white/70 dark:bg-zinc-850/60 backdrop-blur-md text-[10px] text-zinc-500 dark:text-zinc-400 font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_6px_-1px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_2px_6px_-1px_rgba(0,0,0,0.3)]">
                                {group.date}
                            </span>
                        </div>

                        {/* 消息列表 */}
                        {group.messages.map((message, index) => {
                            const isOwn = message.sender_id === currentUserId;
                            const prevMessage = group.messages[index - 1];
                            const isSameSender = prevMessage && prevMessage.sender_id === message.sender_id;
                            const showAvatar = !isOwn && !isSameSender;

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        isSameSender ? "mt-1" : "mt-2.5"
                                    )}
                                >
                                    <ChatBubble
                                        message={message}
                                        isOwn={isOwn}
                                        showAvatar={showAvatar}
                                        senderName={isOwn ? currentUserName : partnerName}
                                        senderAvatar={isOwn ? currentUserAvatar : partnerAvatar}
                                        canRevoke={canRevoke?.(message) ?? false}
                                        onRevoke={onRevoke}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 py-16">
                        <p className="text-sm">还没有消息</p>
                        <p className="text-xs mt-1">发送第一条消息开始聊天吧</p>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-1" />
            </div>
        </div>
    );
}
