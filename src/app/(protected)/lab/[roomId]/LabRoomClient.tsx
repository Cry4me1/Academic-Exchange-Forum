"use client";

import { createClient } from "@/lib/supabase/client";
import NovelViewer from "@/components/editor/NovelViewer";
import NovelCollabEditor from "@/components/editor/NovelCollabEditor";
import { PostSearchDialog } from "@/components/lab/reader/PostSearchDialog";
import { PublishCoPostDialog } from "@/components/lab/co-author/PublishCoPostDialog";
import { PostPublishedSyncModal } from "@/components/lab/co-author/PostPublishedSyncModal";
import { LabOutputsDialog, type LabOutputPost } from "@/components/lab/LabOutputsDialog";
import { ReadingModeAccessoryBar } from "@/components/lab/modes/ReadingModeAccessoryBar";
import { NoteHistoryDialog } from "@/components/lab/NoteHistoryDialog";
import { LabSettingsDialog } from "@/components/lab/LabSettingsDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useYjsCollaboration } from "@/hooks/useYjsCollaboration";
import { useLabPresence } from "@/hooks/useLabPresence";
import { useScrollSync } from "@/hooks/useScrollSync";
import type { JSONContent } from "novel";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Award,
    BookOpen,
    Check,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    FlaskConical,
    GripVertical,
    History,
    Link2,
    Loader2,
    Maximize2,
    Minimize2,
    Pencil,
    Plus,
    Save,
    Send,
    Settings,
    Sigma,
    Sparkles,
    Users,
    Wifi,
    WifiOff,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addPostToRoom, getLabOutputs, removePostFromRoom, updateLabRoomType } from "@/app/(protected)/lab/actions";

// Types
interface PostLink {
    id: string;
    sort_order: number;
    post: {
        id: string;
        title: string;
        content: object;
        tags: string[];
        author_id: string;
        like_count: number;
        comment_count: number;
        created_at: string;
        author: {
            id: string;
            username?: string;
            avatar_url?: string;
        };
    };
}

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        username?: string;
        avatar_url?: string;
    };
}

interface LabRoomClientProps {
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        is_encrypted?: boolean;
        created_by: string;
        max_members?: number;
        lab_members: Member[];
        lab_post_links: PostLink[];
    };
    currentUserId: string;
    currentUsername: string;
    currentAvatarUrl?: string;
}

const roleLabels: Record<string, string> = {
    owner: "创建者",
    admin: "管理员",
    editor: "协作者",
    viewer: "观察者",
};

export default function LabRoomClient({
    room,
    currentUserId,
    currentUsername,
    currentAvatarUrl,
}: LabRoomClientProps) {
    // 研讨室共读书单（支持实时协同挂载与同步）
    const [postLinks, setPostLinks] = useState<PostLink[]>(room.lab_post_links || []);
    const [selectedPostIndex, setSelectedPostIndex] = useState(0);
    const [showPostSearch, setShowPostSearch] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // 实验室模式状态 ("reading" | "whiteboard" | "hybrid")
    const [currentRoomType, setCurrentRoomType] = useState<"reading" | "whiteboard" | "hybrid">(
        (room.room_type as any) || "hybrid"
    );
    const [isFullScreenReader, setIsFullScreenReader] = useState<boolean>(false);
    const [isFullScreenWhiteboard, setIsFullScreenWhiteboard] = useState<boolean>(false);
    const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "xlarge">("normal");

    // 实验室成果展厅面板状态
    const [showOutputs, setShowOutputs] = useState(false);
    const [outputs, setOutputs] = useState<LabOutputPost[]>([]);
    const [isLoadingOutputs, setIsLoadingOutputs] = useState(false);

    // 全员发帖协同同步弹窗状态
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [syncPostInfo, setSyncPostInfo] = useState<{
        id: string;
        title: string;
        publishedBy: string;
        isAuthor: boolean;
    } | null>(null);

    // 移动端双栏切换选项卡: "reader" | "collab"
    const [mobileActiveTab, setMobileActiveTab] = useState<"reader" | "collab">("collab");
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const roomChannelRef = useRef<ReturnType<typeof createClient> extends { channel: (name: string) => infer R } ? R : any>(null);

    // 成果档案加载
    const loadOutputs = useCallback(async () => {
        setIsLoadingOutputs(true);
        const res = await getLabOutputs(room.id);
        if (res.data) {
            setOutputs(res.data as any);
        }
        setIsLoadingOutputs(false);
    }, [room.id]);

    useEffect(() => {
        loadOutputs();
    }, [loadOutputs]);

    // 服务端数据更新时同步
    useEffect(() => {
        if (room.lab_post_links) {
            setPostLinks(room.lab_post_links);
        }
    }, [room.lab_post_links]);

    // 安全索引，防止切换或移除文献后越界
    const safeSelectedIndex = useMemo(() => {
        if (postLinks.length === 0) return 0;
        return Math.min(selectedPostIndex, postLinks.length - 1);
    }, [selectedPostIndex, postLinks.length]);

    const selectedPost = postLinks[safeSelectedIndex]?.post;
    const members = useMemo(() => room.lab_members || [], [room.lab_members]);
    const currentMember = members.find((m) => m.user.id === currentUserId);
    const isOwner = currentMember?.role === "owner" || room.created_by === currentUserId;
    const isOwnerOrAdmin = isOwner || currentMember?.role === "admin";

    const router = useRouter();
    const displayName = currentUsername || `学者${currentUserId.slice(-4)}`;

    // 监听研讨室公共事件：实时书单协同（挂载、移出）与成员变动
    useEffect(() => {
        const supabase = createClient();
        const channelName = `lab-room-events-${room.id}`;

        // 清理同名可能残留的已订阅频道实例
        const existingChannel = supabase.getChannels().find(
            (c: any) => c.topic === `realtime:${channelName}` || c.topic === channelName
        );
        if (existingChannel) {
            supabase.removeChannel(existingChannel);
        }

        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false },
            },
        });
        roomChannelRef.current = channel;

        // 1. 广播：新文献挂载实时同步
        channel.on("broadcast", { event: "lab-post-added" }, ({ payload }: any) => {
            if (payload?.newLink) {
                const newLink = payload.newLink as PostLink;
                setPostLinks((prev) => {
                    if (prev.some((p) => p.id === newLink.id || p.post?.id === newLink.post?.id)) {
                        return prev;
                    }
                    return [...prev, newLink];
                });
                const adderName = payload.addedBy || "在席同侪";
                const postTitle = newLink.post?.title || "学术文献";
                toast.info(`${adderName} 挂载了新文献《${postTitle}》至共读书单`, {
                    icon: "📚",
                });
            }
        });

        // 2. 广播：文献移出实时同步
        channel.on("broadcast", { event: "lab-post-removed" }, ({ payload }: any) => {
            if (payload?.postId) {
                setPostLinks((prev) => prev.filter((p) => p.post?.id !== payload.postId));
                setSelectedPostIndex(0);
                const removerName = payload.removedBy || "在席学者";
                toast.info(`${removerName} 移出了共读文献`);
            }
        });

        // 3. 成员变动（如被移出房间）
        channel.on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "lab_members",
                filter: `room_id=eq.${room.id}`,
            },
            (payload: any) => {
                if (payload.old?.user_id === currentUserId) {
                    toast.error("你已被移出该研究室");
                    router.push("/lab");
                }
            }
        );

        // 4. 监听 lab_post_links 的数据库变更（作为双重兜底保障）
        channel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "lab_post_links",
                filter: `room_id=eq.${room.id}`,
            },
            () => {
                router.refresh();
            }
        );

        // 5. 广播：房间解散实时同步
        channel.on("broadcast", { event: "lab-room-dismissed" }, ({ payload }: any) => {
            if (payload?.roomId === room.id) {
                toast.error("当前研讨室已被创建者解散，正在返回共创大厅...");
                setTimeout(() => {
                    router.push("/lab");
                }, 1200);
            }
        });

        // 6. 广播：学术长帖成果发布实时全员同步（解决全员跳转问题）
        channel.on("broadcast", { event: "lab-post-published" }, ({ payload }: any) => {
            if (payload?.postId) {
                setSyncPostInfo({
                    id: payload.postId,
                    title: payload.postTitle || "学术研讨成果",
                    publishedBy: payload.publishedBy || "在席学者",
                    isAuthor: payload.authorId === currentUserId,
                });
                setSyncModalOpen(true);
                // 实时自动刷新成果列表与书单
                loadOutputs();
            }
        });

        // 7. 广播：研讨室模式热切换实时全员同步（解决模式协同感知）
        channel.on("broadcast", { event: "lab-mode-updated" }, ({ payload }: any) => {
            if (payload?.roomType) {
                setCurrentRoomType(payload.roomType);
                if (payload.roomType === "reading") {
                    setSplitPercent(70);
                } else if (payload.roomType === "whiteboard") {
                    setSplitPercent(25);
                } else {
                    setSplitPercent(50);
                }
                const label = payload.roomType === "reading" ? "文献共读" : payload.roomType === "whiteboard" ? "白板推导" : "全能研讨";
                toast.info(`研讨室模式已由同侪切换为「${label}」`);
            }
        });

        channel.subscribe();

        return () => {
            roomChannelRef.current = null;
            supabase.removeChannel(channel);
        };
    }, [room.id, router, currentUserId, loadOutputs]);

    // 房主解散研讨室时主动广播通知全房间
    const handleRoomDeleted = useCallback(() => {
        roomChannelRef.current?.send({
            type: "broadcast",
            event: "lab-room-dismissed",
            payload: { roomId: room.id },
        });
    }, [room.id]);

    // 分栏拖拽与视图比例控制（根据房间模式设定差异化黄金初始比例）
    const getDefaultSplit = useCallback((type: string) => {
        if (type === "reading") return 70;      // 文献共读：文献 70% : 笔记 30%
        if (type === "whiteboard") return 25;   // 白板推导：文献 25% : 笔记 75%
        return 50;                              // 全能研讨：对等 50% : 50%
    }, []);

    const [splitPercent, setSplitPercent] = useState<number>(() => getDefaultSplit(room.room_type));
    const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 沉浸全屏控制（视口层叠覆盖 + HTML5 原生 Fullscreen API 双重保障）
    const exitAllFullScreen = useCallback(async () => {
        setIsFullScreenReader(false);
        setIsFullScreenWhiteboard(false);
        if (typeof document !== "undefined" && document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch {
                // 静默处理浏览器全屏退出异常
            }
        }
    }, []);

    const toggleFullScreen = useCallback(async (target: "reader" | "whiteboard") => {
        if (target === "reader") {
            if (isFullScreenReader) {
                await exitAllFullScreen();
            } else {
                setIsFullScreenReader(true);
                setIsFullScreenWhiteboard(false);
                if (typeof document !== "undefined" && !document.fullscreenElement) {
                    try {
                        await document.documentElement.requestFullscreen();
                    } catch {
                        // 某些浏览器安全策略限制，视口 fixed 浮层仍将提供完整沉浸全屏
                    }
                }
            }
        } else {
            if (isFullScreenWhiteboard) {
                await exitAllFullScreen();
            } else {
                setIsFullScreenWhiteboard(true);
                setIsFullScreenReader(false);
                if (typeof document !== "undefined" && !document.fullscreenElement) {
                    try {
                        await document.documentElement.requestFullscreen();
                    } catch {
                        // 视口 fixed 浮层仍将提供完整沉浸全屏
                    }
                }
            }
        }
    }, [isFullScreenReader, isFullScreenWhiteboard, exitAllFullScreen]);

    // 监听物理 ESC 键和浏览器原生全屏状态变更，保持全屏状态严格双向同步
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (typeof document !== "undefined" && !document.fullscreenElement) {
                setIsFullScreenReader(false);
                setIsFullScreenWhiteboard(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isFullScreenReader || isFullScreenWhiteboard) {
                    exitAllFullScreen();
                }
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullScreenReader, isFullScreenWhiteboard, exitAllFullScreen]);

    // 模式热切换回调
    const handleSwitchMode = useCallback(async (newMode: "reading" | "whiteboard" | "hybrid") => {
        setCurrentRoomType(newMode);
        await exitAllFullScreen();
        setSplitPercent(getDefaultSplit(newMode));

        if (isOwnerOrAdmin) {
            await updateLabRoomType(room.id, newMode);
            roomChannelRef.current?.send({
                type: "broadcast",
                event: "lab-mode-updated",
                payload: { roomType: newMode },
            });
            const label = newMode === "reading" ? "文献共读" : newMode === "whiteboard" ? "白板推导" : "全能研讨";
            toast.success(`研讨模式已更新为「${label}」`);
        }
    }, [getDefaultSplit, isOwnerOrAdmin, room.id, exitAllFullScreen]);

    // 成果发帖成功回调：广播全员同步弹窗并刷新成果展厅
    const handlePostPublished = useCallback((postData: { id: string; title: string }) => {
        roomChannelRef.current?.send({
            type: "broadcast",
            event: "lab-post-published",
            payload: {
                postId: postData.id,
                postTitle: postData.title,
                publishedBy: displayName,
                authorId: currentUserId,
            },
        });

        // 自身也展示全员协同同步倒计时弹窗
        setSyncPostInfo({
            id: postData.id,
            title: postData.title,
            publishedBy: displayName,
            isAuthor: true,
        });
        setSyncModalOpen(true);
        loadOutputs();
    }, [displayName, currentUserId, loadOutputs]);

    // 论文评议研讨模板直接注入协同笔记（通过自定义事件真实注入编辑器末尾，无需剪贴板中转）
    const handleInjectReadingTemplate = useCallback((type: "critique" | "summary") => {
        const title = selectedPost?.title || "学术文献";
        const template = type === "critique" 
            ? `\n\n### 📖 《${title}》同侪研读评议纪要\n- **核心假设与立论根基**：\n- **关键推导/实验数据验证**：\n- **存疑点与边界局限**：\n- **本研讨组延伸思考**：\n\n`
            : `\n\n### 📝 文献论点提炼\n- **核心要旨**：\n- **对本室推导的启发**：\n\n`;
        
        window.dispatchEvent(
            new CustomEvent("collab-editor-insert-content", {
                detail: {
                    markdown: template,
                    tip: "已成功将论文评议提纲注入协同笔记！",
                    appendToEnd: true,
                },
            })
        );
    }, [selectedPost?.title]);

    const handleMouseDownSplit = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingSplit(true);
    }, []);

    useEffect(() => {
        if (!isDraggingSplit) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const clamped = Math.max(20, Math.min(80, Math.round(rawPercent)));
            setSplitPercent(clamped);
        };

        const handleMouseUp = () => {
            setIsDraggingSplit(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingSplit]);

    // 当前学者挂载文献成功回调（即刻更新本地并实时广播给全房间）
    const handlePostAdded = useCallback((newLink: any) => {
        if (!newLink) return;
        setPostLinks((prev) => {
            if (prev.some((p) => p.id === newLink.id || p.post?.id === newLink.post?.id)) {
                return prev;
            }
            const updated = [...prev, newLink];
            setSelectedPostIndex(updated.length - 1);
            return updated;
        });

        // 广播给房间内的所有其他在席学者
        roomChannelRef.current?.send({
            type: "broadcast",
            event: "lab-post-added",
            payload: {
                newLink,
                addedBy: displayName,
            },
        });
    }, [displayName]);

    // 从成果展厅一键挂载为共读文献
    const handleMountOutputAsReference = useCallback(async (outputPost: LabOutputPost) => {
        const res = await addPostToRoom(room.id, outputPost.id);
        if (res.error) {
            toast.error(res.error);
            return;
        }
        toast.success(`已将成果《${outputPost.title}》挂载到本室共读书单`);
        handlePostAdded(res.data);
        setShowOutputs(false);
    }, [room.id, handlePostAdded]);

    // 当前学者（拥有权限者）移出文献
    const handleRemovePost = useCallback(async (e: React.MouseEvent, postId: string, title: string) => {
        e.stopPropagation();
        if (!window.confirm(`确定要将《${title}》从共读书单中移出吗？`)) return;

        const res = await removePostFromRoom(room.id, postId);
        if (res.error) {
            toast.error(res.error);
            return;
        }

        toast.success("已移出共读书单");
        setPostLinks((prev) => prev.filter((p) => p.post.id !== postId));
        setSelectedPostIndex(0);

        // 广播给房间内所有其他学者
        roomChannelRef.current?.send({
            type: "broadcast",
            event: "lab-post-removed",
            payload: {
                postId,
                removedBy: displayName,
            },
        });
    }, [room.id, displayName]);

    const {
        ydoc,
        awarenessProvider,
        isConnected: yjsConnected,
        connectedPeers,
        isSaving,
        lastSavedAt,
        isRestoring,
        manualSave,
        rollbackToSnapshot,
        reinitKey,
    } = useYjsCollaboration({
        roomId: room.id,
        user: {
            id: currentUserId,
            name: displayName,
            color: "",
            avatarUrl: currentAvatarUrl,
        },
    });

    // Lab Presence
    const { onlineMembers, isConnected: presenceConnected, broadcastScrollPosition } = useLabPresence({
        roomId: room.id,
        userId: currentUserId,
        username: currentUsername,
        avatarUrl: currentAvatarUrl,
    });

    // 滚动同步
    useScrollSync({
        scrollContainerRef,
        currentPostId: selectedPost?.id || null,
        onlineMembers,
        broadcastScrollPosition,
    });

    // 统一计算并去重在线在席学者列表与独立人数（防止同一学者多开窗口膨胀）
    const displayOnlineMembers = useMemo(() => {
        const userMap = new Map<string, { id: string; username: string; avatarUrl?: string }>();

        // 1. 录入 presence 上报的在线成员（以 userId 为唯一 key）
        onlineMembers.forEach((m) => {
            if (m.id) {
                userMap.set(m.id, {
                    id: m.id,
                    username: m.username || "学者",
                    avatarUrl: m.avatarUrl,
                });
            }
        });

        // 2. 确保当前学者自身始终计入且具备最新资料
        if (currentUserId) {
            userMap.set(currentUserId, {
                id: currentUserId,
                username: displayName,
                avatarUrl: currentAvatarUrl,
            });
        }

        return Array.from(userMap.values());
    }, [onlineMembers, currentUserId, displayName, currentAvatarUrl]);

    // 当前在席学者总数（单人多开无论打开多少个标签页，均严格计为 1 人）
    const activeScholarCount = displayOnlineMembers.length;

    // 在线成员 ID 集合（用于弹窗等快速查询在线状态）
    const onlineUserIds = useMemo(() => {
        return new Set(displayOnlineMembers.map((m) => m.id));
    }, [displayOnlineMembers]);

    // 协作光标固定随机高雅色盘
    const userColor = useMemo(() => {
        const CURSOR_COLORS = [
            "#7c3aed", "#2563eb", "#059669", "#d97706",
            "#dc2626", "#7c2d12", "#4f46e5", "#0891b2",
            "#65a30d", "#c026d3", "#e11d48", "#0d9488",
        ];
        let hash = 0;
        for (let i = 0; i < currentUserId.length; i++) {
            hash = currentUserId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
    }, [currentUserId]);

    // 协作编辑器笔记内容
    const noteContentRef = useRef<JSONContent | null>(null);
    const handleEditorUpdate = useCallback((json: JSONContent) => {
        noteContentRef.current = json;
    }, []);

    // 房间成员作为共创者候选人（排除自己）
    const collaborators = useMemo(() => {
        return members
            .filter((m) => m.user.id !== currentUserId)
            .map((m) => ({
                id: m.user.id,
                name: m.user.username || "学者",
                avatarUrl: m.user.avatar_url,
            }));
    }, [members, currentUserId]);

    const getNoteContent = () => {
        return noteContentRef.current;
    };

    return (
        <TooltipProvider>
            <div className="h-screen flex flex-col bg-background overflow-hidden">
                {/* 顶部 Apple Liquid Glass 导航工具栏 */}
                <header className="flex-shrink-0 z-30 border-0 bg-white/75 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                    <div className="flex items-center justify-between h-14 px-4 gap-2">
                        {/* 左侧：返回、房间名、模式、连接状态 */}
                        <div className="flex items-center gap-3 min-w-0">
                            <Link href="/lab">
                                <button
                                    type="button"
                                    className="h-8 w-8 rounded-full border-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground bg-zinc-100/60 dark:bg-zinc-800/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                            </Link>

                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                    <FlaskConical className="h-4 w-4" />
                                </div>
                                <h1 className="font-semibold text-sm sm:text-base text-foreground truncate tracking-tight">
                                    {room.name}
                                </h1>
                            </div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isOwnerOrAdmin) {
                                                const nextMode = currentRoomType === "reading" ? "whiteboard" : currentRoomType === "whiteboard" ? "hybrid" : "reading";
                                                handleSwitchMode(nextMode);
                                            }
                                        }}
                                        className={cn(
                                            "rounded-full border-0 text-[11px] px-2.5 py-0.5 font-medium hidden md:inline-flex items-center gap-1 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] shrink-0",
                                            currentRoomType === "reading" && "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15",
                                            currentRoomType === "whiteboard" && "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80",
                                            currentRoomType === "hybrid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                                        )}
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        <span>{currentRoomType === "reading" ? "文献共读模式" : currentRoomType === "whiteboard" ? "白板推导模式" : "全能研讨模式"}</span>
                                        {isOwnerOrAdmin && <span className="text-[9px] opacity-70 ml-0.5">切换</span>}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs max-w-xs">
                                    {currentRoomType === "reading" && "聚焦文献深度研读、视口同屏追踪与学术评议，文献视野已针对长文专门优化。"}
                                    {currentRoomType === "whiteboard" && "聚焦公式演练、定理证明与计算推导，白板视野最大化，提供极速 LaTeX 工具带。"}
                                    {currentRoomType === "hybrid" && "文献共读与公式推演并驾齐驱，50:50 对等双重视角联动研讨。"}
                                    {isOwnerOrAdmin && " (点击可循环热切换研讨室模式)"}
                                </TooltipContent>
                            </Tooltip>

                            {/* 连接与协同在席人数状态 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] shrink-0",
                                        yjsConnected
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "bg-rose-500/10 text-rose-500"
                                    )}>
                                        {yjsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                        <span className="hidden sm:inline">
                                            {yjsConnected ? `${activeScholarCount} 人在席` : "离线重连"}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    {yjsConnected
                                        ? `研讨协同引擎已就绪，当前在席学者：${activeScholarCount} 位`
                                        : "正在尝试恢复协同会话连接..."}
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* 桌面端分栏视图预设胶囊 */}
                        <div className="hidden md:flex items-center p-0.5 rounded-full bg-zinc-100/70 dark:bg-zinc-800/60 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            <button
                                type="button"
                                onClick={() => {
                                    exitAllFullScreen();
                                    setSplitPercent(70);
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer",
                                    !isFullScreenReader && !isFullScreenWhiteboard && splitPercent === 70
                                        ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="文献专注视角 (文献 70% : 笔记 30%)"
                            >
                                研读 70%
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    exitAllFullScreen();
                                    setSplitPercent(50);
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer",
                                    !isFullScreenReader && !isFullScreenWhiteboard && splitPercent === 50
                                        ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="平衡对等视角 (文献 50% : 笔记 50%)"
                            >
                                对等 50%
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    exitAllFullScreen();
                                    setSplitPercent(25);
                                }}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer",
                                    !isFullScreenReader && !isFullScreenWhiteboard && splitPercent === 25
                                        ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="推导专注视角 (文献 25% : 笔记 75%)"
                            >
                                笔记 75%
                            </button>
                        </div>

                        {/* 移动端视图切换胶囊 */}
                        <div className="flex md:hidden items-center p-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                            <button
                                type="button"
                                onClick={() => setMobileActiveTab("reader")}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer",
                                    mobileActiveTab === "reader"
                                        ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                文献
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileActiveTab("collab")}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer",
                                    mobileActiveTab === "collab"
                                        ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                笔记
                            </button>
                        </div>

                        {/* 右侧：保存指示、快照、设置、联合发帖 */}
                        <div className="flex items-center gap-2">
                            {/* 保存状态指示 */}
                            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-1">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                                        <span className="text-zinc-600 dark:text-zinc-400">快照同步中...</span>
                                    </>
                                ) : lastSavedAt ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span>已自动保存</span>
                                    </>
                                ) : null}
                            </div>

                            {/* 在席同侪微头像组：Apple Liquid Glass 优雅堆叠（彻底去除破相冲突绿点） */}
                            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-100/60 dark:bg-zinc-800/50 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] mr-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5 shrink-0" title="在席同侪实时在线" />
                                <div className="flex items-center -space-x-2">
                                    {displayOnlineMembers.slice(0, 4).map((om) => (
                                        <Tooltip key={om.id}>
                                            <TooltipTrigger asChild>
                                                <Avatar className="h-6 w-6 rounded-full ring-2 ring-background border-0 shadow-sm transition-transform hover:scale-110 hover:z-20 cursor-pointer">
                                                    <AvatarImage src={om.avatarUrl} />
                                                    <AvatarFallback className="text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold">
                                                        {(om.username).slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs">
                                                {om.username} {om.id === currentUserId ? "(当前学者)" : "(在线协同)"}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                    {displayOnlineMembers.length > 4 && (
                                        <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center ring-2 ring-background text-[9px] font-semibold text-muted-foreground">
                                            +{displayOnlineMembers.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 手动快照保存 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => manualSave()}
                                        disabled={isSaving}
                                        className="h-8 w-8 rounded-full border-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                                    >
                                        <Save className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">手动保存版本快照</TooltipContent>
                            </Tooltip>

                            {/* 版本历史快照 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => setShowHistory(true)}
                                        className="h-8 w-8 rounded-full border-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                                    >
                                        <History className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">查看笔记版本历史与回滚</TooltipContent>
                            </Tooltip>

                            {/* 实验室成果展厅入口（统计并列举成果） */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowOutputs(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-0 transition-all bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/90 dark:hover:bg-zinc-700/80 text-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] cursor-pointer"
                                    >
                                        <Award className="h-3.5 w-3.5 text-foreground" />
                                        <span className="hidden sm:inline">成果展厅</span>
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                                            {outputs.length}
                                        </span>
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    查看本研讨室所有已发表学术长帖成果（共 {outputs.length} 篇）
                                </TooltipContent>
                            </Tooltip>

                            {/* 联合署名发布研讨成果 */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowPublishDialog(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border-0 transition-all bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">成果联合署名发帖</span>
                                        <span className="sm:hidden">发帖</span>
                                    </motion.button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                    将本次研讨推导与笔记一键转为社区学术长帖，自动标注共同作者
                                </TooltipContent>
                            </Tooltip>

                            {/* 研讨室设置 */}
                            {isOwnerOrAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(true)}
                                    className="h-8 w-8 rounded-full border-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                                >
                                    <Settings className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* 顶部微渐变消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                </header>

                {/* 主研讨工作区：支持双栏拖拽 / 响应式单栏 */}
                <div
                    ref={containerRef}
                    style={{
                        "--split-left": `${splitPercent}%`,
                        "--split-right": `${100 - splitPercent}%`,
                    } as React.CSSProperties}
                    className={cn(
                        "flex-1 flex overflow-hidden relative",
                        isDraggingSplit && "select-none cursor-col-resize"
                    )}
                >
                    {/* 左栏：学术文献/帖子共读区 */}
                    <div className={cn(
                        "flex flex-col min-w-0 bg-background",
                        isFullScreenReader
                            ? "fixed inset-0 z-40 w-full h-full flex"
                            : cn(
                                "bg-background/50 backdrop-blur-sm",
                                isFullScreenWhiteboard && "hidden",
                                "w-full md:w-[var(--split-left)] transition-[width] duration-75",
                                mobileActiveTab === "reader" ? "flex" : "hidden md:flex"
                            )
                    )}>
                        {selectedPost ? (
                            <>
                                {/* 帖子头部信息栏 */}
                                <div className="flex-shrink-0 px-6 py-3.5 bg-white/40 dark:bg-zinc-900/30">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-base text-foreground tracking-tight truncate">
                                                {selectedPost.title}
                                            </h2>
                                            <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">
                                                原作者: {selectedPost.author?.username || "学者"}
                                                {selectedPost.tags?.length > 0 && ` · 标签: ${selectedPost.tags.join(", ")}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link href={`/posts/${selectedPost.id}`} target="_blank">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 text-xs font-medium text-foreground transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                                >
                                                    <span>打开全篇</span>
                                                    <ChevronRight className="h-3 w-3" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-zinc-800/60 to-transparent mt-3" />
                                </div>

                                {/* 文献共读专属学术增强栏（视口同步指示、排版调节与论文评议模板） */}
                                <ReadingModeAccessoryBar
                                    isFullScreenReader={isFullScreenReader}
                                    onToggleFullScreenReader={() => toggleFullScreen("reader")}
                                    fontSizeLevel={fontSizeLevel}
                                    onChangeFontSize={setFontSizeLevel}
                                    onInjectTemplate={handleInjectReadingTemplate}
                                    activeScholarCount={activeScholarCount}
                                />

                                {/* 帖子正文（支持多端视口滚动同步与字号缩放） */}
                                <div
                                    ref={scrollContainerRef}
                                    className={cn(
                                        "flex-1 overflow-y-auto no-scrollbar px-6 py-4",
                                        fontSizeLevel === "large" && "text-base [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-loose",
                                        fontSizeLevel === "xlarge" && "text-lg [&_.ProseMirror]:text-lg [&_.ProseMirror]:leading-loose font-serif"
                                    )}
                                >
                                    <NovelViewer key={selectedPost.id} initialValue={selectedPost.content as import("novel").JSONContent} />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-6 text-center">
                                <div className="space-y-4 max-w-sm">
                                    <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 inline-flex shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                        <BookOpen className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground text-base">尚未挂载共读学术帖</h3>
                                        <p className="text-xs text-muted-foreground font-normal mt-1 leading-relaxed">
                                            可从社区中检索并引入优质学术帖子，与同侪开启双重视角同步阅读与推导
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPostSearch(true)}
                                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 text-xs font-medium shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>从社区挂载第一篇文献</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 底部已挂载帖子流 */}
                        <div className="flex-shrink-0 p-3 bg-white/50 dark:bg-zinc-950/40 border-0">
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-2.5" />
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>共读书单:</span>
                                </span>
                                {postLinks.map((link, idx) => {
                                    const isSelected = idx === safeSelectedIndex;
                                    return (
                                        <div
                                            key={link.id}
                                            className={cn(
                                                "group/tab relative flex items-center rounded-full transition-all shrink-0 border-0",
                                                isSelected
                                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.25)] font-medium"
                                                    : "bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPostIndex(idx)}
                                                className="text-xs px-3 py-1 font-medium border-0 bg-transparent text-inherit cursor-pointer truncate max-w-[160px] sm:max-w-[220px]"
                                            >
                                                {link.post.title}
                                            </button>

                                            {/* 拥有研讨室管理权限或多篇文献时，支持一键移出 */}
                                            {isOwnerOrAdmin && postLinks.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRemovePost(e, link.post.id, link.post.title)}
                                                    title="从共读书单中移出"
                                                    className={cn(
                                                        "h-4 w-4 mr-1.5 rounded-full inline-flex items-center justify-center transition-all border-0 cursor-pointer",
                                                        isSelected
                                                            ? "hover:bg-white/20 text-white/70 hover:text-white dark:hover:bg-black/10 dark:text-zinc-700 dark:hover:text-zinc-950"
                                                            : "hover:bg-zinc-300 dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground opacity-0 group-hover/tab:opacity-100"
                                                    )}
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setShowPostSearch(true)}
                                    className="h-6 w-6 rounded-full inline-flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-800/80 text-muted-foreground hover:text-foreground transition-all border-0 cursor-pointer shrink-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                    title="从社区挂载文献"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 可拖拽微光缝 Resizer（桌面端且未开启单侧全屏纯享时呈现） */}
                    {!isFullScreenReader && !isFullScreenWhiteboard && (
                        <div
                            onMouseDown={handleMouseDownSplit}
                            onDoubleClick={() => setSplitPercent(50)}
                            className={cn(
                                "hidden md:flex relative items-center justify-center cursor-col-resize select-none z-20 group transition-all",
                                "w-2 -mx-1 hover:w-3 hover:-mx-1.5",
                                isDraggingSplit && "w-3 -mx-1.5"
                            )}
                            title="左右拖动调整分栏比例，双击快速居中复位 (50:50)"
                        >
                            {/* 中心微光缝 */}
                            <div
                                className={cn(
                                    "w-[1px] h-full bg-gradient-to-b from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent transition-colors",
                                    isDraggingSplit
                                        ? "via-zinc-600 dark:via-zinc-300"
                                        : "group-hover:via-zinc-400 dark:group-hover:via-zinc-600"
                                )}
                            />
                            {/* 悬浮水滴抓手胶囊 */}
                            <div
                                className={cn(
                                    "absolute top-1/2 -translate-y-1/2 w-4 h-10 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border-0 flex items-center justify-center transition-all",
                                    "shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                                    isDraggingSplit
                                        ? "opacity-100 scale-105 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                                        : "opacity-0 group-hover:opacity-100 text-zinc-600 dark:text-zinc-400"
                                )}
                            >
                                <GripVertical className="h-3 w-3" />
                            </div>
                        </div>
                    )}

                    {/* 右栏：Yjs 实时协同学术笔记区（现代编辑器 UI） */}
                    <div className={cn(
                        "flex flex-col min-w-0 bg-background",
                        isFullScreenWhiteboard
                            ? "fixed inset-0 z-40 w-full h-full flex"
                            : cn(
                                isFullScreenReader && "hidden",
                                "w-full md:w-[var(--split-right)] transition-[width] duration-75",
                                mobileActiveTab === "collab" ? "flex" : "hidden md:flex"
                            )
                    )}>
                        {/* 笔记区头部 */}
                        <div className="flex-shrink-0 px-4 py-2.5 bg-white/40 dark:bg-zinc-900/30 flex items-center justify-between border-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-xs text-foreground tracking-tight">📝 协同笔记与公式推演区</h3>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {currentRoomType === "whiteboard" && (
                                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                        <Sigma className="h-3 w-3" />
                                        <span>白板推演模式</span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    {yjsConnected ? `Yjs CRDT 实时推演 · ${activeScholarCount} 人在席` : "协同引擎连接中..."}
                                </span>
                                {/* 全屏纯享白板推导切换 */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => toggleFullScreen("whiteboard")}
                                                className={cn(
                                                    "shrink-0 rounded-full border-0 inline-flex items-center justify-center transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] active:scale-95",
                                                    isFullScreenWhiteboard
                                                        ? "h-7 px-2.5 gap-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium"
                                                        : "h-6 w-6 text-muted-foreground hover:text-foreground bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
                                                )}
                                            >
                                                {isFullScreenWhiteboard ? (
                                                    <>
                                                        <Minimize2 className="h-3 w-3 shrink-0" />
                                                        <span className="text-[11px] font-medium hidden sm:inline">退出全屏</span>
                                                    </>
                                                ) : (
                                                    <Maximize2 className="h-3 w-3 shrink-0" />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            {isFullScreenWhiteboard ? "退出全屏推导 (ESC)" : "全屏纯享白板推导演练"}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* 现代协同学术编辑器主体（由内部独立驱动固定工具栏与正文视口） */}
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            {ydoc && awarenessProvider ? (
                                <NovelCollabEditor
                                    key={`novel-collab-${room.id}-${reinitKey}`}
                                    ydoc={ydoc}
                                    awarenessProvider={awarenessProvider}
                                    currentUser={{ name: displayName, color: userColor }}
                                    onUpdate={handleEditorUpdate}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center space-y-2">
                                        <Loader2 className="h-6 w-6 mx-auto animate-spin text-zinc-500" />
                                        <p className="text-xs text-muted-foreground font-medium">
                                            正在挂载多人协同推演文档...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 各种功能弹窗 */}
                <PostSearchDialog
                    open={showPostSearch}
                    onOpenChange={setShowPostSearch}
                    roomId={room.id}
                    onPostAdded={handlePostAdded}
                />

                <PublishCoPostDialog
                    open={showPublishDialog}
                    onOpenChange={setShowPublishDialog}
                    roomId={room.id}
                    roomName={room.name}
                    currentUserId={currentUserId}
                    collaborators={collaborators}
                    noteContent={getNoteContent()}
                    onPublished={handlePostPublished}
                />

                {/* 全员协同发帖同步弹窗（解决一个人发布其他人不跳转问题） */}
                {syncPostInfo && (
                    <PostPublishedSyncModal
                        open={syncModalOpen}
                        onClose={() => setSyncModalOpen(false)}
                        postId={syncPostInfo.id}
                        postTitle={syncPostInfo.title}
                        publishedBy={syncPostInfo.publishedBy}
                        isAuthor={syncPostInfo.isAuthor}
                    />
                )}

                {/* 实验室学术成果展厅面板（解决成果列举与统计问题） */}
                <LabOutputsDialog
                    open={showOutputs}
                    onOpenChange={setShowOutputs}
                    roomName={room.name}
                    outputs={outputs}
                    isLoading={isLoadingOutputs}
                    onMountAsReference={handleMountOutputAsReference}
                />

                <LabSettingsDialog
                    open={showSettings}
                    onOpenChange={setShowSettings}
                    room={{
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        room_type: currentRoomType,
                        max_members: room.max_members ?? 10,
                        created_by: room.created_by,
                    }}
                    members={members}
                    currentUserId={currentUserId}
                    onlineUserIds={onlineUserIds}
                    onRoomDeleted={handleRoomDeleted}
                />

                <NoteHistoryDialog
                    open={showHistory}
                    onOpenChange={setShowHistory}
                    roomId={room.id}
                    onRollback={rollbackToSnapshot}
                    onManualSave={manualSave}
                    isSaving={isSaving}
                    isRestoring={isRestoring}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                />
            </div>
        </TooltipProvider>
    );
}
