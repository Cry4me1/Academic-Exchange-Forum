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
                                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 border-0",
                                    isSelected
                                        ? "bg-white/90 dark:bg-zinc-850/80 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.35)]"
                                        : "hover:bg-white/60 dark:hover:bg-zinc-900/50 hover:backdrop-blur-sm hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                                )}
                            >
                                {/* 头像 */}
                                <div className="relative flex-shrink-0">
                                    <Avatar className="h-10 w-10 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.06)]">
                                        <AvatarImage src={conv.partnerAvatarUrl || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-zinc-200/90 to-zinc-100/90 dark:from-zinc-700/80 dark:to-zinc-800/80 text-zinc-600 dark:text-zinc-300 text-xs font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* 在线状态指示器 */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-950",
                                            isPartnerOnline
                                                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
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
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 font-normal">
                                            {formatTime(conv.lastMessageTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                            {conv.lastMessage || "开始聊天吧"}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="flex-shrink-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1 text-[10px] font-medium text-white shadow-[0_2px_8px_rgba(239,68,68,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
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
