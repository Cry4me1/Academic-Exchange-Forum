"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { playMessageSound } from "@/lib/sound";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { MessageSquare } from "lucide-react";

interface GlobalMessageListenerProps {
    currentUserId: string;
}

export function GlobalMessageListener({ currentUserId }: GlobalMessageListenerProps) {
    const pathname = usePathname();
    const router = useRouter();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if (!currentUserId) return;

        const supabase = createClient();
        const channelName = `global-messages:${currentUserId}`;

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `receiver_id=eq.${currentUserId}`,
                },
                async (payload: any) => {
                    const newMessage = payload.new;
                    if (!newMessage || newMessage.sender_id === currentUserId) return;

                    // 1. 播放提示音（内置去重与节流）
                    playMessageSound({ messageId: newMessage.id });

                    // 2. 如果用户当前不在私信页面，弹出温润的 Toast 提醒
                    const isCurrentlyInMessages = pathnameRef.current?.startsWith("/messages");
                    if (!isCurrentlyInMessages) {
                        try {
                            const { data: senderProfile } = await supabase
                                .from("profiles")
                                .select("username, email")
                                .eq("id", newMessage.sender_id)
                                .single();

                            const senderName =
                                senderProfile?.username ||
                                (senderProfile?.email ? senderProfile.email.split("@")[0] : "用户");

                            const displayContent = newMessage.content_type === "post_reference"
                                ? "分享了一篇学术帖子"
                                : (newMessage.content?.length > 40 ? newMessage.content.substring(0, 40) + "..." : newMessage.content) || "发来了一条新消息";

                            toast(
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <MessageSquare className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                            {senderName} 给您发送了私信
                                        </p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                            {displayContent}
                                        </p>
                                    </div>
                                </div>,
                                {
                                    action: {
                                        label: "查看",
                                        onClick: () => router.push(`/messages?user=${newMessage.sender_id}`),
                                    },
                                    duration: 4500,
                                }
                            );
                        } catch (err) {
                            console.warn("获取发信人信息失败:", err);
                        }
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [currentUserId, router]);

    return null;
}
