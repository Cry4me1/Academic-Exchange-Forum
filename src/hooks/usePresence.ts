"use client";

import { usePresenceContext } from "@/contexts/PresenceContext";

export interface UsePresenceReturn {
    onlineUsers: Set<string>;
    isOnline: (userId: string) => boolean;
    isConnected: boolean;
}

export function usePresence(_currentUserId?: string | null): UsePresenceReturn {
    const { onlineUsers, isOnline, isConnected } = usePresenceContext();
    return { onlineUsers, isOnline, isConnected };
}
