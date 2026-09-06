"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js";

interface PresenceUser {
    id: string;
    online_at: string;
}

interface PresenceContextType {
    onlineUsers: Set<string>;
    isOnline: (userId: string) => boolean;
    isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextType | null>(null);

const SCHOLARLY_AI_ID = "00000000-0000-0000-0000-0000000000a1";

export function PresenceProvider({
    children,
    currentUserId,
}: {
    children: ReactNode;
    currentUserId: string | null;
}) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set([SCHOLARLY_AI_ID]));
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!currentUserId) return;

        const supabase = createClient();

        // 创建 Presence 频道
        const channel = supabase.channel("online-users", {
            config: {
                presence: {
                    key: currentUserId,
                },
            },
        });

        channelRef.current = channel;

        // 同步 Presence 状态
        const handleSync = () => {
            const state: RealtimePresenceState<PresenceUser> = channel.presenceState();
            const users = new Set<string>();

            Object.keys(state).forEach((key) => {
                users.add(key);
            });
            // Scholarly AI 作为系统智能体，永远保持在线状态
            users.add(SCHOLARLY_AI_ID);

            setOnlineUsers(users);
        };

        // 用户加入
        const handleJoin = ({ key }: { key: string }) => {
            setOnlineUsers((prev) => new Set([...prev, key, SCHOLARLY_AI_ID]));
        };

        // 用户离开
        const handleLeave = ({ key }: { key: string }) => {
            if (key === SCHOLARLY_AI_ID) return;
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(key);
                next.add(SCHOLARLY_AI_ID);
                return next;
            });
        };

        let isSubscribed = false;

        channel
            .on("presence", { event: "sync" }, handleSync)
            .on("presence", { event: "join" }, handleJoin)
            .on("presence", { event: "leave" }, handleLeave)
            .subscribe(async (status: any) => {
                if (status === "SUBSCRIBED") {
                    isSubscribed = true;
                    setIsConnected(true);
                    // 追踪当前用户上线
                    await channel.track({
                        id: currentUserId,
                        online_at: new Date().toISOString(),
                    });
                } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                    setIsConnected(false);
                }
            });

        // 页面可见性变化时更新状态
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && channelRef.current && isSubscribed) {
                await channelRef.current.track({
                    id: currentUserId,
                    online_at: new Date().toISOString(),
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            channelRef.current = null;

            // 安全清理：避免在 WebSocket 处于 CONNECTING 阶段时强行中断触发浏览器控制台报错
            const cleanup = () => {
                supabase.removeChannel(channel);
            };

            if (channel.state === "joined") {
                cleanup();
            } else {
                setTimeout(cleanup, 500);
            }
        };
    }, [currentUserId]);

    const isOnline = useCallback(
        (userId: string) => userId === SCHOLARLY_AI_ID || onlineUsers.has(userId),
        [onlineUsers]
    );

    return (
        <PresenceContext.Provider value={{ onlineUsers, isOnline, isConnected }}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresenceContext(): PresenceContextType {
    const context = useContext(PresenceContext);
    if (!context) {
        // 返回默认值而不是抛出错误，这样组件可以在 Provider 外部降级使用
        return {
            onlineUsers: new Set([SCHOLARLY_AI_ID]),
            isOnline: (userId: string) => userId === SCHOLARLY_AI_ID,
            isConnected: false,
        };
    }
    return context;
}
