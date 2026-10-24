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
    getRecentLastSeen: (userId: string) => string | null;
    isConnected: boolean;
    currentUserId: string | null;
}

const PresenceContext = createContext<PresenceContextType | null>(null);

const SCHOLARLY_AI_ID = "00000000-0000-0000-0000-0000000000a1";
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000;

export function PresenceProvider({
    children,
    currentUserId,
}: {
    children: ReactNode;
    currentUserId: string | null;
}) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set([SCHOLARLY_AI_ID]));
    const [recentLastSeenMap, setRecentLastSeenMap] = useState<Record<string, string>>({});
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!currentUserId) return;

        const supabase = createClient();

        const syncLastSeenSilently = () => {
            if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
            Promise.resolve(supabase.rpc("touch_user_last_seen")).catch(() => {});
        };

        // 1. 若客户端中已存在该话题的旧频道（如 Fast Refresh、快速重挂载），先同步彻底移除，防止复用已 subscribe 的频道
        const existingChannel = supabase.getChannels().find(
            (c: any) => c.topic === "realtime:online-users" || c.topic === "online-users"
        );
        if (existingChannel) {
            supabase.removeChannel(existingChannel).catch(() => {});
        }

        // 2. 创建全新的 Presence 频道
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

        // 用户离开：记录会话级离线时间快照
        const handleLeave = ({ key }: { key: string }) => {
            if (key === SCHOLARLY_AI_ID) return;
            const leftIso = new Date().toISOString();
            setRecentLastSeenMap((prev) => ({ ...prev, [key]: leftIso }));
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(key);
                next.add(SCHOLARLY_AI_ID);
                return next;
            });
        };

        let isSubscribed = false;

        try {
            channel
                .on("presence", { event: "sync" }, handleSync)
                .on("presence", { event: "join" }, handleJoin)
                .on("presence", { event: "leave" }, handleLeave);
        } catch (err) {
            console.warn("[PresenceProvider] 绑定 presence 监听警告:", err);
        }

        channel.subscribe(async (status: any) => {
            if (status === "SUBSCRIBED") {
                isSubscribed = true;
                setIsConnected(true);
                syncLastSeenSilently();
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
                syncLastSeenSilently();
                await channelRef.current.track({
                    id: currentUserId,
                    online_at: new Date().toISOString(),
                });
            }
        };

        const heartbeatTimer = window.setInterval(syncLastSeenSilently, HEARTBEAT_INTERVAL_MS);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(heartbeatTimer);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            channelRef.current = null;
            // 立即同步从客户端频道池中移除，禁止 setTimeout 延迟，确保下一次挂载拿到全新频道
            supabase.removeChannel(channel).catch(() => {});
        };
    }, [currentUserId]);

    const isOnline = useCallback(
        (userId: string) => userId === SCHOLARLY_AI_ID || onlineUsers.has(userId),
        [onlineUsers]
    );

    const getRecentLastSeen = useCallback(
        (userId: string) => recentLastSeenMap[userId] || null,
        [recentLastSeenMap]
    );

    return (
        <PresenceContext.Provider value={{ onlineUsers, isOnline, getRecentLastSeen, isConnected, currentUserId }}>
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
            getRecentLastSeen: () => null,
            isConnected: false,
            currentUserId: null,
        };
    }
    return context;
}
