"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePresenceContext } from "@/contexts/PresenceContext";
import { useFriends, type FriendWithProfile } from "@/hooks/useFriends";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/context";

interface FriendItemProps {
    friend: FriendWithProfile["friend"];
    friendshipId: string;
    isOnline: boolean;
}

function FriendItem({ friend, friendshipId, isOnline }: FriendItemProps) {
    const { isZh } = useI18n();
    const initials = (friend.username || friend.email || "?").charAt(0).toUpperCase();
    const displayName = friend.username || friend.email?.split("@")[0] || (isZh ? "未知学者" : "Scholar");

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-white/60 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors duration-150 group border-0">
                        {/* 头像点击跳转到用户主页 */}
                        <Link href={`/user/${friend.id}`} prefetch={false} className="relative shrink-0">
                            <Avatar className="h-7 w-7 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                                <AvatarImage src={friend.avatar_url || undefined} alt={displayName} />
                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {/* 在线状态指示器 */}
                            <span
                                className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-900 ${
                                    isOnline ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-zinc-300 dark:bg-zinc-600"
                                }`}
                            />
                        </Link>
                        {/* 名字点击跳转到消息页 */}
                        <Link href={`/messages?user=${friend.id}`} prefetch={false} className="flex-1 truncate">
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate block">
                                {displayName}
                            </span>
                        </Link>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="right"
                    sideOffset={8}
                    className="text-xs border-0 rounded-2xl bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_24px_-2px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-2px_rgba(0,0,0,0.4)] px-3 py-2 z-50 pointer-events-none"
                >
                    <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-100">
                        <span>{displayName}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] ${
                            isOnline ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-zinc-400 dark:text-zinc-500"
                        }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                                isOnline ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" : "bg-zinc-300 dark:bg-zinc-600"
                            }`} />
                            {isOnline ? (isZh ? "在线" : "离线") : (isZh ? "Online" : "Offline")}
                        </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {isZh ? "点击头像查看主页，点击名字发私信" : "Click avatar for profile, click name to chat"}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

interface FriendsListProps {
    currentUserId: string | null;
}

export function FriendsList({ currentUserId }: FriendsListProps) {
    const { t, isZh } = useI18n();
    const { friends, loading } = useFriends(currentUserId);
    const { isOnline } = usePresenceContext();

    // 根据在线状态分组好友
    const onlineFriends = friends.filter((f) => isOnline(f.friend.id));
    const offlineFriends = friends.filter((f) => !isOnline(f.friend.id));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" strokeWidth={1.75} />
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{t.dashboardComponents.friendsEmpty}</p>
                <Link href="/friends" className="text-xs text-primary hover:underline mt-1.5 inline-block font-medium">
                    {t.dashboardComponents.friendsFind}
                </Link>
            </div>
        );
    }

    return (
        <div>
            <ScrollArea className="max-h-72 pr-1">
                {/* 在线好友 */}
                {onlineFriends.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-1.5 px-2 mb-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <h4 className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                {isZh ? "在线" : "Online"} ({onlineFriends.length})
                            </h4>
                        </div>
                        <div className="space-y-0.5">
                            {onlineFriends.map((f) => (
                                <FriendItem
                                    key={f.friendshipId}
                                    friend={f.friend}
                                    friendshipId={f.friendshipId}
                                    isOnline={true}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 离线好友 */}
                {offlineFriends.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 px-2 mb-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                            <h4 className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                {isZh ? "离线" : "Offline"} ({offlineFriends.length})
                            </h4>
                        </div>
                        <div className="space-y-0.5">
                            {offlineFriends.map((f) => (
                                <FriendItem
                                    key={f.friendshipId}
                                    friend={f.friend}
                                    friendshipId={f.friendshipId}
                                    isOnline={false}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
