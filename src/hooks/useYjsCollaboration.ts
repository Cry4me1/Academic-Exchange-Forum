"use client";

/**
 * 基于 Supabase Realtime Broadcast 的 Yjs 同步 Provider
 * 包含 Awareness 支持（用于协作光标显示）
 * 包含自动保存/恢复机制
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import * as awarenessProtocol from "y-protocols/awareness";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CollabUser {
    id: string;
    name: string;
    color: string;
    avatarUrl?: string;
}

interface UseYjsCollaborationOptions {
    roomId: string;
    user: CollabUser;
    enabled?: boolean;
    /** 自动保存间隔(ms)，默认 5000 */
    autoSaveInterval?: number;
    /** 自动快照间隔(ms)，默认 5分钟 */
    autoSnapshotInterval?: number;
}

// 协作光标颜色池
const CURSOR_COLORS = [
    "#7c3aed", "#2563eb", "#059669", "#d97706",
    "#dc2626", "#7c2d12", "#4f46e5", "#0891b2",
    "#65a30d", "#c026d3", "#e11d48", "#0d9488",
];

function getUserColor(userId: string, clientId?: number): string {
    let hash = 0;
    const seed = clientId ? `${userId}-${clientId}` : userId;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

/**
 * 伪 Provider 对象 - 让 CollaborationCursor 扩展可以使用 Awareness
 */
class SupabaseAwarenessProvider {
    awareness: Awareness;

    constructor(awareness: Awareness) {
        this.awareness = awareness;
    }
}

// ============================================
// 保存/恢复 工具函数
// ============================================

/** 从服务器加载 Yjs 状态 */
async function loadYjsState(roomId: string): Promise<Uint8Array | null> {
    try {
        const res = await fetch(`/api/lab-notes?roomId=${roomId}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.state) return null;

        // Supabase bytea 返回 base64 格式
        // 先尝试 base64 解码
        if (typeof data.state === "string") {
            // 去除可能的 \x 前缀 (hex format)
            if (data.state.startsWith("\\x")) {
                const hex = data.state.slice(2);
                const bytes = new Uint8Array(hex.length / 2);
                for (let i = 0; i < hex.length; i += 2) {
                    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
                }
                return bytes;
            }
            // base64
            const binary = atob(data.state);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        }
        return null;
    } catch (e) {
        console.error("加载 Yjs 状态失败:", e);
        return null;
    }
}

/** 保存 Yjs 状态到服务器 */
async function saveYjsState(
    roomId: string,
    doc: Y.Doc,
    options?: { createSnapshot?: boolean; snapshotLabel?: string; snapshotType?: string }
): Promise<boolean> {
    try {
        const state = Y.encodeStateAsUpdate(doc);
        const res = await fetch("/api/lab-notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomId,
                state: Array.from(state),
                createSnapshot: options?.createSnapshot,
                snapshotLabel: options?.snapshotLabel,
                snapshotType: options?.snapshotType || "auto",
            }),
            keepalive: true,
        });
        return res.ok;
    } catch (e) {
        console.error("保存 Yjs 状态失败:", e);
        return false;
    }
}

export function useYjsCollaboration({
    roomId,
    user,
    enabled = true,
    autoSaveInterval = 5000,
    autoSnapshotInterval = 5 * 60 * 1000,
}: UseYjsCollaborationOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [connectedPeers, setConnectedPeers] = useState(0);
    const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
    const [awarenessProvider, setAwarenessProvider] = useState<SupabaseAwarenessProvider | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const isApplyingRemote = useRef(false);
    const isApplyingRemoteAwareness = useRef(false);
    const docRef = useRef<Y.Doc | null>(null);
    const hasLocalChanges = useRef(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isRollingBack = useRef(false);
    const [reinitKey, setReinitKey] = useState(0);

    // 手动保存（带版本快照）
    const manualSave = useCallback(async (label?: string) => {
        if (!docRef.current) return false;
        setIsSaving(true);
        const ok = await saveYjsState(roomId, docRef.current, {
            createSnapshot: true,
            snapshotLabel: label || `手动保存 ${new Date().toLocaleString("zh-CN")}`,
            snapshotType: "manual",
        });
        if (ok) {
            setLastSavedAt(new Date());
            hasLocalChanges.current = false;
        }
        setIsSaving(false);
        return ok;
    }, [roomId]);

    // 回滚到指定快照
    // 策略：调用 API 将数据库中的 lab_notes 替换为快照内容，
    // 通过 Realtime 广播通知所有开着此研讨室的客户端重置，
    // 并通过 reinitKey 触发 hook 完全重建，从数据库重新加载文档
    const rollbackToSnapshot = useCallback(async (snapshotId: string): Promise<boolean> => {
        try {
            setIsRestoring(true);
            isRollingBack.current = true;
            // 立即掐断未保存标记与定时器，严禁旧内容在卸载时写回数据库覆盖快照
            hasLocalChanges.current = false;
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }

            const res = await fetch("/api/lab-notes/snapshots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, snapshotId }),
            });

            if (!res.ok) {
                isRollingBack.current = false;
                return false;
            }
            const data = await res.json();
            if (!data.success) {
                isRollingBack.current = false;
                return false;
            }

            // 广播回滚事件，通知所有协同在席端（包括同用户多开的窗口）同步重载
            if (channelRef.current) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "lab-note-rollback",
                    payload: { roomId, snapshotId, userId: user.id },
                });
            }

            // 强制重建 Yjs doc：cleanup 销毁旧 doc，新 useEffect 从数据库加载回滚快照
            setReinitKey((k) => k + 1);
            setLastSavedAt(new Date());
            setTimeout(() => {
                isRollingBack.current = false;
            }, 800);
            return true;
        } catch (e) {
            console.error("回滚失败:", e);
            isRollingBack.current = false;
            return false;
        } finally {
            setIsRestoring(false);
        }
    }, [roomId, user.id]);

    useEffect(() => {
        if (!enabled || !roomId || !user.id) return;

        const supabase = createClient();
        const channelName = `yjs-collab:${roomId}`;

        // 清理可能由于 React Remount / Fast Refresh 残留的已订阅频道实例
        const existingChannel = supabase.getChannels().find(
            (c: any) => c.topic === `realtime:${channelName}` || c.topic === channelName
        );
        if (existingChannel) {
            supabase.removeChannel(existingChannel);
        }

        const doc = new Y.Doc();
        const awareness = new Awareness(doc);
        docRef.current = doc;

        // 设置本地 awareness 状态（同账号多开窗口时按 clientID 区分光标色彩，确保清晰可辨）
        const color = user.color || getUserColor(user.id, doc.clientID);
        awareness.setLocalStateField("user", {
            name: user.name,
            color,
            avatarUrl: user.avatarUrl,
            id: user.id,
        });

        const provider = new SupabaseAwarenessProvider(awareness);

        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false },
                presence: {
                    key: user.id,
                },
            },
        });
        channelRef.current = channel;

        // ============================================
        // 恢复已保存的状态
        // ============================================
        let isInitialized = false;

        const restoreState = async () => {
            const savedState = await loadYjsState(roomId);
            if (savedState && savedState.length > 0) {
                try {
                    isApplyingRemote.current = true;
                    Y.applyUpdate(doc, savedState);
                    isApplyingRemote.current = false;
                    console.log("[Yjs] 从服务器恢复了文档状态");
                } catch (e) {
                    console.error("[Yjs] 恢复状态失败:", e);
                    isApplyingRemote.current = false;
                }
            }
            isInitialized = true;
        };

        restoreState();

        // --- Yjs 文档协同同步（基于 clientID 过滤，同学者多窗口可自测试协同） ---

        channel.on("broadcast", { event: "yjs-update" }, ({ payload }: any) => {
            if (payload?.update && payload.clientId !== doc.clientID) {
                isApplyingRemote.current = true;
                try {
                    Y.applyUpdate(doc, Uint8Array.from(payload.update));
                } catch (e) {
                    console.error("Failed to apply remote Yjs update:", e);
                }
                isApplyingRemote.current = false;
            }
        });

        channel.on("broadcast", { event: "yjs-sync-request" }, ({ payload }: any) => {
            if (payload?.clientId !== doc.clientID) {
                const state = Y.encodeStateAsUpdate(doc);
                channel.send({
                    type: "broadcast",
                    event: "yjs-sync-response",
                    payload: {
                        clientId: doc.clientID,
                        targetClientId: payload.clientId,
                        update: Array.from(state),
                    },
                });
                // 也发送当前的 awareness 状态，确保新接入窗口立刻看到光标
                const awUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, [awareness.clientID]);
                channel.send({
                    type: "broadcast",
                    event: "awareness-update",
                    payload: {
                        clientId: doc.clientID,
                        update: Array.from(awUpdate),
                    },
                });
            }
        });

        channel.on("broadcast", { event: "yjs-sync-response" }, ({ payload }: any) => {
            if (payload?.update && payload.clientId !== doc.clientID) {
                if (payload.targetClientId && payload.targetClientId !== doc.clientID) return;
                isApplyingRemote.current = true;
                try {
                    Y.applyUpdate(doc, Uint8Array.from(payload.update));
                } catch (e) {
                    console.error("Failed to apply sync response:", e);
                }
                isApplyingRemote.current = false;
            }
        });

        // --- Awareness 官方二进制协议协同同步（光标 + 选区 + 学者名牌） ---

        channel.on("broadcast", { event: "awareness-update" }, ({ payload }: any) => {
            if (payload?.update && payload.clientId !== doc.clientID) {
                try {
                    awarenessProtocol.applyAwarenessUpdate(
                        awareness,
                        Uint8Array.from(payload.update),
                        "remote"
                    );
                } catch (e) {
                    console.error("Failed to apply awareness update:", e);
                }
            }
        });

        channel.on("broadcast", { event: "awareness-remove" }, ({ payload }: any) => {
            if (payload?.removedClientId && payload.clientId !== doc.clientID) {
                try {
                    awarenessProtocol.removeAwarenessStates(
                        awareness,
                        [payload.removedClientId],
                        "remote"
                    );
                } catch (e) {
                    console.error("Failed to remove awareness client:", e);
                }
            }
        });

        // 本地文档更新 → 广播 + 标记有变更
        const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
            if (isApplyingRemote.current) return;
            channel.send({
                type: "broadcast",
                event: "yjs-update",
                payload: {
                    clientId: doc.clientID,
                    userId: user.id,
                    update: Array.from(update),
                },
            });

            // 标记有本地变更，触发防抖保存
            if (isInitialized) {
                hasLocalChanges.current = true;
                // 防抖保存
                if (saveTimerRef.current) {
                    clearTimeout(saveTimerRef.current);
                }
                saveTimerRef.current = setTimeout(async () => {
                    if (hasLocalChanges.current && docRef.current) {
                        setIsSaving(true);
                        const ok = await saveYjsState(roomId, docRef.current);
                        if (ok) {
                            setLastSavedAt(new Date());
                            hasLocalChanges.current = false;
                        }
                        setIsSaving(false);
                    }
                }, autoSaveInterval);
            }
        };
        doc.on("update", handleLocalUpdate);

        // 本地 awareness 变化（选区移动、输入光标偏移、学者标签变化）→ 编码并广播
        const handleAwarenessUpdate = ({ added, updated, removed }: any, origin: any) => {
            if (origin === "remote") return;
            const changedClients = added.concat(updated).concat(removed);
            if (changedClients.length === 0) return;
            const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
            channel.send({
                type: "broadcast",
                event: "awareness-update",
                payload: {
                    clientId: doc.clientID,
                    update: Array.from(update),
                },
            });
        };
        awareness.on("update", handleAwarenessUpdate);

        // Presence 追踪在线人数（严格按学者用户 ID 去重，单人多开窗口不重复计入）
        channel.on("presence", { event: "sync" }, () => {
            const presenceState = channel.presenceState();
            const uniqueUserIds = new Set<string>();

            Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
                if (key && key !== "undefined") {
                    uniqueUserIds.add(key);
                }
                if (Array.isArray(presences)) {
                    presences.forEach((p: any) => {
                        if (p?.userId) uniqueUserIds.add(p.userId);
                    });
                }
            });

            // 计算除当前用户外的其他独立在席协作者数
            const otherPeersCount = Array.from(uniqueUserIds).filter((uid) => uid !== user.id).length;
            setConnectedPeers(otherPeersCount);
        });

        channel.subscribe(async (status: any) => {
            if (status === "SUBSCRIBED") {
                setIsConnected(true);
                await channel.track({
                    userId: user.id,
                    name: user.name,
                    color,
                });

                // 请求同步并广播一次本地 awareness，让所有在席窗口即刻看到光标
                setTimeout(() => {
                    channel.send({
                        type: "broadcast",
                        event: "yjs-sync-request",
                        payload: { clientId: doc.clientID, userId: user.id },
                    });
                    const initialAwUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, [awareness.clientID]);
                    channel.send({
                        type: "broadcast",
                        event: "awareness-update",
                        payload: {
                            clientId: doc.clientID,
                            update: Array.from(initialAwUpdate),
                        },
                    });
                }, 300);
            } else {
                setIsConnected(false);
            }
        });

        // 监听研讨室回滚广播（通知同房间其他窗口和协作者同步重置）
        channel.on("broadcast", { event: "lab-note-rollback" }, ({ payload }: any) => {
            if (payload?.roomId === roomId && payload?.userId !== user.id) {
                console.log("[Yjs] 收到研讨室笔记回滚广播，立即同步重载文档...");
                isRollingBack.current = true;
                hasLocalChanges.current = false;
                if (saveTimerRef.current) {
                    clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = null;
                }
                setReinitKey((k) => k + 1);
                setTimeout(() => {
                    isRollingBack.current = false;
                }, 800);
            }
        });

        // ============================================
        // 定时自动快照（每 autoSnapshotInterval）
        // ============================================
        snapshotTimerRef.current = setInterval(async () => {
            if (docRef.current && !isRollingBack.current) {
                await saveYjsState(roomId, docRef.current, {
                    createSnapshot: true,
                    snapshotType: "auto",
                });
            }
        }, autoSnapshotInterval);

        setYdoc(doc);
        setAwarenessProvider(provider);

        return () => {
            // 离开前做最后一次保存（回滚期间严禁写回本地旧状态，防止冲掉刚回滚的快照！）
            if (hasLocalChanges.current && docRef.current && !isRollingBack.current) {
                saveYjsState(roomId, docRef.current);
            }

            // 清理定时器
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current);

            // 广播 awareness 移除
            channel.send({
                type: "broadcast",
                event: "awareness-remove",
                payload: {
                    clientId: doc.clientID,
                    removedClientId: awareness.clientID,
                },
            });
            awarenessProtocol.removeAwarenessStates(awareness, [awareness.clientID], "local");
            awareness.destroy();
            // 同步解除频道订阅与注销
            supabase.removeChannel(channel);

            doc.destroy();
            channelRef.current = null;
            docRef.current = null;
            setYdoc(null);
            setAwarenessProvider(null);
            setIsConnected(false);
            setConnectedPeers(0);
        };
    }, [roomId, user.id, user.name, user.color, user.avatarUrl, enabled, autoSaveInterval, autoSnapshotInterval, reinitKey]);

    return {
        ydoc,
        awarenessProvider,
        isConnected,
        connectedPeers,
        isSaving,
        lastSavedAt,
        isRestoring,
        manualSave,
        rollbackToSnapshot,
        reinitKey,
    };
}
