"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useMessages } from "@/hooks/useMessages";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from "@/lib/file-utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Code2,
    FunctionSquare,
    Link as LinkIcon,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Send,
    Smile,
    Type,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatMessages } from "./ChatBubble";
import { ChatEditor, type ChatEditorRef } from "./ChatEditor";
import { uploadMessageFile } from "./FileUploader";

interface ChatWindowProps {
    currentUserId: string;
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    partnerAvatar?: string | null;
    currentUserName?: string;
    currentUserAvatar?: string | null;
    onBack?: () => void;
    className?: string;
}

export function ChatWindow({
    currentUserId,
    partnerId,
    partnerName,
    partnerEmail,
    partnerAvatar,
    currentUserName,
    currentUserAvatar,
    onBack,
    className,
}: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("");
    const [richContent, setRichContent] = useState("");
    const [sending, setSending] = useState(false);
    const [showPostSelector, setShowPostSelector] = useState(false);
    const [useRichEditor, setUseRichEditor] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const editorRef = useRef<ChatEditorRef>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { messages, loading, sendMessage, markAsRead, revokeMessage, canRevoke } = useMessages(
        currentUserId,
        partnerId
    );
    const { isOnline } = usePresenceContext();

    const isPartnerOnline = isOnline(partnerId);
    const partnerInitials = (partnerName || partnerEmail || "?").charAt(0).toUpperCase();

    // 标记消息为已读
    const handleMarkAsRead = useCallback(() => {
        const unreadMessages = messages
            .filter((m) => m.receiver_id === currentUserId && !m.is_read)
            .map((m) => m.id);
        if (unreadMessages.length > 0) {
            markAsRead(unreadMessages);
        }
    }, [messages, currentUserId, markAsRead]);

    // 发送消息（支持富文本和附件）
    const handleSend = async () => {
        let content = useRichEditor ? richContent : inputValue.trim();

        // 如果内容为空但有文件，设置默认提示文本
        if ((!content || content === "<p></p>") && pendingFiles.length > 0) {
            const isAllImages = pendingFiles.every(f => f.type?.startsWith("image/"));
            content = isAllImages ? "[图片]" : "[文件]";
        }

        if ((!content || content === "<p></p>") && pendingFiles.length === 0) return;

        if (sending) return;

        setSending(true);

        try {
            // 发送文本消息
            const contentType = useRichEditor ? "rich_text" : "text";
            const result = await sendMessage(partnerId, content, contentType);

            if (!result.success) {
                toast.error(result.error || "发送失败");
                setSending(false);
                return;
            }

            // 如果有待上传的文件，上传附件
            if (pendingFiles.length > 0 && result.messageId) {
                for (const file of pendingFiles) {
                    try {
                        await uploadMessageFile(file, result.messageId);
                    } catch (error) {
                        console.error("文件上传失败:", error);
                        toast.error(`${file.name} 上传失败`);
                    }
                }
            }

            // 清空输入
            if (useRichEditor) {
                editorRef.current?.clear();
                setRichContent("");
            } else {
                setInputValue("");
                inputRef.current?.focus();
            }
            setPendingFiles([]);
        } catch (error) {
            toast.error("发送失败");
        } finally {
            setSending(false);
        }
    };

    // 发送帖子引用
    const handleSharePost = async (postId: string, postTitle: string) => {
        setSending(true);
        const result = await sendMessage(
            partnerId,
            `分享了帖子：${postTitle}`,
            "post_reference",
            postId
        );
        setSending(false);
        setShowPostSelector(false);

        if (result.success) {
            toast.success("帖子已分享");
        } else {
            toast.error(result.error || "分享失败");
        }
    };

    // 处理文件选择
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const validFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} 超过 10MB 限制`);
                continue;
            }
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                toast.error(`${file.name} 不支持的文件类型`);
                continue;
            }
            validFiles.push(file);
        }

        setPendingFiles((prev) => [...prev, ...validFiles]);
        e.target.value = ""; // 重置 input
    };

    // 移除待上传文件
    const removePendingFile = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // 插入代码块模板
    const insertCodeBlock = () => {
        if (useRichEditor) return;
        setInputValue((prev) => prev + "\n```\n\n```");
        inputRef.current?.focus();
    };

    // 插入公式模板
    const insertFormula = () => {
        if (useRichEditor) return;
        setInputValue((prev) => prev + " $$ $$ ");
        inputRef.current?.focus();
    };

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* ===== Header ===== */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}

                <Avatar className="h-8 w-8">
                    <AvatarImage src={partnerAvatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
                        {partnerInitials}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {partnerName}
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isPartnerOnline
                                    ? "bg-emerald-500"
                                    : "bg-zinc-400"
                            )}
                        />
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {isPartnerOnline ? "在线" : "离线"}
                        </span>
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* ===== Messages ===== */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
            ) : (
                <ChatMessages
                    messages={messages}
                    currentUserId={currentUserId}
                    partnerName={partnerName}
                    partnerAvatar={partnerAvatar}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    canRevoke={canRevoke}
                    onRevoke={revokeMessage}
                />
            )}

            {/* ===== 待上传文件预览 ===== */}
            {pendingFiles.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                        {pendingFiles.map((file, index) => (
                            <div
                                key={index}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                            >
                                <Paperclip className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="text-xs truncate max-w-[120px] text-zinc-700 dark:text-zinc-300">
                                    {file.name}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                    {formatFileSize(file.size)}
                                </span>
                                <button
                                    onClick={() => removePendingFile(index)}
                                    className="ml-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== Input Area ===== */}
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                {useRichEditor ? (
                    /* 富文本编辑器模式 */
                    <div className="space-y-2">
                        <ChatEditor
                            ref={editorRef}
                            onChange={(html) => setRichContent(html)}
                            onSubmit={handleSend}
                            placeholder="输入消息... 支持 Markdown 格式"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUseRichEditor(false)}
                                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    简单模式
                                </Button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept={ALLOWED_FILE_TYPES.join(",")}
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    附件
                                </Button>

                                <Dialog open={showPostSelector} onOpenChange={setShowPostSelector}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                            <LinkIcon className="h-4 w-4 mr-1" />
                                            分享帖子
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent aria-describedby={undefined}>
                                        <DialogHeader>
                                            <DialogTitle>分享帖子</DialogTitle>
                                        </DialogHeader>
                                        <PostSelector onSelect={handleSharePost} />
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={(!richContent || richContent === "<p></p>") && pendingFiles.length === 0 || sending}
                                size="sm"
                                className="rounded-lg"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-1" />
                                        发送
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ===== 简单输入模式 — 全宽精致输入容器 ===== */
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 p-1 shadow-2xs">
                        <div className="flex items-center gap-0.5">
                            {/* 快捷工具栏 */}
                            <TooltipProvider delayDuration={300}>
                                {/* 表情 */}
                                <Popover>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                                                >
                                                    <Smile className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">表情</TooltipContent>
                                    </Tooltip>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <EmojiPicker
                                            onSelect={(emoji) => {
                                                setInputValue((prev) => prev + emoji);
                                                inputRef.current?.focus();
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* 附件 */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept={ALLOWED_FILE_TYPES.join(",")}
                                    onChange={handleFileSelect}
                                />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">附件</TooltipContent>
                                </Tooltip>

                                {/* 插入代码 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                                            onClick={insertCodeBlock}
                                        >
                                            <Code2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">代码块</TooltipContent>
                                </Tooltip>

                                {/* 公式 */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                                            onClick={insertFormula}
                                        >
                                            <FunctionSquare className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">LaTeX 公式</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* 分隔线 */}
                            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5 flex-shrink-0" />

                            {/* 输入框 */}
                            <Input
                                ref={inputRef}
                                placeholder="输入消息..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                onFocus={handleMarkAsRead}
                                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-zinc-400 h-8 px-2"
                            />

                            {/* 富文本模式切换 */}
                            <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                                            onClick={() => setUseRichEditor(true)}
                                        >
                                            <Type className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">富文本模式</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* 分享帖子 */}
                            <Dialog open={showPostSelector} onOpenChange={setShowPostSelector}>
                                <DialogTrigger asChild>
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">分享帖子</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </DialogTrigger>
                                <DialogContent aria-describedby={undefined}>
                                    <DialogHeader>
                                        <DialogTitle>分享帖子</DialogTitle>
                                    </DialogHeader>
                                    <PostSelector onSelect={handleSharePost} />
                                </DialogContent>
                            </Dialog>

                            {/* 发送按钮 */}
                            <Button
                                onClick={handleSend}
                                disabled={(!inputValue.trim() && pendingFiles.length === 0) || sending}
                                size="icon"
                                className="h-7 w-7 flex-shrink-0 rounded-lg ml-0.5"
                            >
                                {sending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Send className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 帖子选择器（用于分享帖子）
function PostSelector({
    onSelect,
}: {
    onSelect: (postId: string, postTitle: string) => void;
}) {
    const [posts, setPosts] = useState<{ id: string; title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data } = await supabase
                .from("posts")
                .select("id, title")
                .eq("is_published", true)
                .order("created_at", { ascending: false })
                .limit(20);

            setPosts(data || []);
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter((post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Input
                placeholder="搜索帖子..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => onSelect(post.id, post.title)}
                                className="p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                            >
                                <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-zinc-500 py-4">
                            暂无帖子
                        </p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

// 表情选择器
const EMOJI_LIST = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
    "👍", "👎", "👏", "🙌", "🤝", "🙏", "✨", "🔥",
    "💯", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤",
];

function EmojiPicker({
    onSelect,
}: {
    onSelect: (emoji: string) => void;
}) {
    return (
        <div className="grid grid-cols-8 gap-1 p-2">
            {EMOJI_LIST.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}
