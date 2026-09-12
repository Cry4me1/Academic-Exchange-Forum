"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NotificationItem } from "./NotificationItem";

interface NotificationCenterProps {
    currentUserId: string;
}

export function NotificationCenter({ currentUserId }: NotificationCenterProps) {
    const [open, setOpen] = useState(false);
    const [confirmingClear, setConfirmingClear] = useState(false);

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    } = useNotifications(currentUserId);

    const handleMarkAsRead = async (notificationId: string) => {
        await markAsRead([notificationId]);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDelete = async (notificationId: string) => {
        await deleteNotification(notificationId);
    };

    const handleClearAll = async () => {
        if (!confirmingClear) {
            setConfirmingClear(true);
            setTimeout(() => setConfirmingClear(false), 3000);
            return;
        }
        await deleteAllNotifications();
        setConfirmingClear(false);
    };

    // 根据通知类型跳转到相应页面
    const getNotificationLink = (notification: (typeof notifications)[0]) => {
        switch (notification.type) {
            case "like":
            case "comment":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            case "friend_request":
            case "friend_accepted":
                return "/friends";
            case "message":
                return notification.from_user_id
                    ? `/messages?user=${notification.from_user_id}`
                    : "/messages";
            case "mention":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            case "duel_invite":
            case "duel_accepted":
            case "duel_rejected":
                return notification.related_id ? `/duels` : "/duels";
            case "system":
                return notification.related_id ? `/posts/${notification.related_id}` : null;
            default:
                return null;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="通知"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-bold"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[380px] sm:w-[400px] p-0 flex flex-col max-h-[520px] shadow-xl border-border/80"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-card rounded-t-lg select-none">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground">通知</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                                {unreadCount} 未读
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                title="全部标为已读"
                            >
                                <Check className="h-3.5 w-3.5" />
                                <span>全部已读</span>
                            </Button>
                        )}

                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                className={`h-7 px-2 text-xs gap-1 transition-colors ${
                                    confirmingClear
                                        ? "text-destructive hover:text-destructive bg-destructive/10"
                                        : "text-muted-foreground hover:text-destructive"
                                }`}
                                title={confirmingClear ? "再次点击确认清空" : "清空全部通知"}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{confirmingClear ? "确认清空?" : "清空"}</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications List (原生流畅滚动，无截断) */}
                <div className="flex-1 min-h-0 max-h-[380px] overflow-y-auto overscroll-contain p-2 space-y-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell className="h-10 w-10 mb-2 opacity-40" />
                            <p className="text-sm font-medium">暂无通知</p>
                            <p className="text-xs text-muted-foreground/70 mt-0.5">有新动态时会在此提醒您</p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const link = getNotificationLink(notification);

                            return link ? (
                                <Link
                                    key={notification.id}
                                    href={link}
                                    className="block focus:outline-none"
                                    onClick={() => setOpen(false)}
                                >
                                    <NotificationItem
                                        notification={notification}
                                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                        onDelete={() => handleDelete(notification.id)}
                                    />
                                </Link>
                            ) : (
                                <div key={notification.id} className="block">
                                    <NotificationItem
                                        notification={notification}
                                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                        onDelete={() => handleDelete(notification.id)}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="flex-shrink-0 border-t bg-card/50 rounded-b-lg p-2">
                        <Link href="/notifications" onClick={() => setOpen(false)}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center text-xs h-8 text-muted-foreground hover:text-foreground"
                            >
                                查看全部通知
                            </Button>
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
