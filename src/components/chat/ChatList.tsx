"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePresenceContext } from "@/contexts/PresenceContext";
import type { Conversation } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface ChatListProps {
    conversations: Conversation[];
    selectedPartnerId?: string;
    onSelectConversation: (partnerId: string) => void;
}

export function ChatList({
    conversations,
    selectedPartnerId,
    onSelectConversation,
}: ChatListProps) {
    const { isOnline } = usePresenceContext();

    const formatTime = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "刚刚";
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;

        return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-2 space-y-0.5">
                {conversations.length === 0 ? (
                    <div className="text-center text-zinc-400 dark:text-zinc-500 py-8">
                        <p className="text-sm">暂无聊天记录</p>
                        <p className="text-xs mt-1">添加好友开始聊天吧</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isSelected = selectedPartnerId === conv.partnerId;
                        const isPartnerOnline = isOnline(conv.partnerId);
                        const initials = (conv.partnerUsername || conv.partnerEmail || "?")
                            .charAt(0)
                            .toUpperCase();

                        return (
                            <div
                                key={conv.partnerId}
                                onClick={() => onSelectConversation(conv.partnerId)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                                    isSelected
                                        ? "bg-zinc-100 dark:bg-zinc-800"
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                )}
                            >
                                {/* 头像 */}
                                <div className="relative flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={conv.partnerAvatarUrl || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-zinc-200 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* 在线状态指示器 */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950",
                                            isPartnerOnline
                                                ? "bg-emerald-500"
                                                : "bg-zinc-400"
                                        )}
                                    />
                                </div>

                                {/* 内容 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                            {conv.partnerUsername || (conv.partnerEmail ? conv.partnerEmail.split("@")[0] : "未知用户")}
                                        </p>
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                                            {formatTime(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                            {conv.lastMessage || "开始聊天吧"}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="flex-shrink-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
}
