"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Bell, Check, ArrowLeft, Trash2 } from "lucide-react";

export default function NotificationsPage() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            } else {
                router.push("/auth/login");
            }
        };
        getUser();
    }, [supabase, router]);

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

    const handleDelete = async (notificationId: string) => {
        await deleteNotification(notificationId);
    };

    // 根据通知类型跳转到相应页面
    const getNotificationLink = (notification: Notification) => {
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

    if (!currentUserId) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-9 w-9"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">通知中心</h1>
                        <p className="text-sm text-muted-foreground">
                            {unreadCount > 0
                                ? `${unreadCount} 条未读通知`
                                : "暂无未读通知"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="gap-1.5"
                        >
                            <Check className="h-4 w-4" />
                            全部已读
                        </Button>
                    )}

                    {notifications.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-border/80"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    清空全部
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确定清空全部通知？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        该操作将永久删除您当前收到的所有学术通知与互动消息，清空后无法恢复。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={deleteAllNotifications}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        确认清空
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Notifications List - 解决异常分行线：容器统一 divide-y，每一个子项均使用严格的 block-level */}
            <div className="bg-card rounded-xl border shadow-sm divide-y divide-border/60 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Bell className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">暂无通知</p>
                        <p className="text-sm">当有新动态时，会在这里显示</p>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const link = getNotificationLink(notification);
                        const item = (
                            <NotificationItem
                                notification={notification}
                                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                                onDelete={() => handleDelete(notification.id)}
                                className="rounded-none px-4 py-3.5"
                            />
                        );

                        return link ? (
                            <Link
                                key={notification.id}
                                href={link}
                                className="block w-full focus:outline-none transition-colors"
                            >
                                {item}
                            </Link>
                        ) : (
                            <div key={notification.id} className="block w-full">
                                {item}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
