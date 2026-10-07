"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteLabRoom } from "@/app/(protected)/lab/actions";
import {
    AlertTriangle,
    Copy,
    Check,
    Crown,
    Link2,
    Loader2,
    Shield,
    Trash2,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Member {
    id: string;
    role: string;
    user: {
        id: string;
        username?: string;
        avatar_url?: string;
    };
}

interface LabSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        max_members: number;
        created_by: string;
    };
    members: Member[];
    currentUserId: string;
    onlineUserIds?: Set<string>;
    onRoomDeleted?: () => void;
}

const roleLabels: Record<string, string> = {
    owner: "创建者",
    admin: "管理员",
    editor: "协作者",
    viewer: "观察者",
};

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown className="h-3 w-3 text-amber-500" />,
    admin: <Shield className="h-3 w-3 text-blue-500" />,
};

export function LabSettingsDialog({
    open,
    onOpenChange,
    room,
    members,
    currentUserId,
    onlineUserIds,
    onRoomDeleted,
}: LabSettingsDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwner = room.created_by === currentUserId;
    const baseUrl = typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")
        ? window.location.origin
        : "https://scholarly.wiki";
    const joinLink = `${baseUrl}/lab/join/${room.id}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(joinLink);
            setCopied(true);
            toast.success("研讨室邀请链接已复制");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("复制失败，请手动选取复制");
        }
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteLabRoom(room.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("研讨室已成功解散");
                onRoomDeleted?.();
                onOpenChange(false);
                router.push("/lab");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_16px_50px_-8px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_50px_-8px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg font-bold font-title text-foreground tracking-tight">
                        研究室空间设置
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-medium truncate">
                        {room.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* 邀请链接 */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 text-zinc-400" />
                            <span>学者专属邀请链接</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={joinLink}
                                readOnly
                                className="h-9 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/60 px-3 text-xs font-mono text-muted-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                            />
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyLink}
                                className="shrink-0 h-9 px-3.5 rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-foreground text-xs font-medium transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] cursor-pointer flex items-center gap-1"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        <span>已复制</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>复制</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 房间基本元数据 */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">空间属性</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-3 rounded-2xl border-0 bg-zinc-100/50 dark:bg-zinc-800/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                <p className="text-[11px] text-muted-foreground font-normal">模式</p>
                                <p className="font-semibold text-foreground mt-0.5">
                                    {room.room_type === "reading" ? "文献共读" : room.room_type === "whiteboard" ? "白板推导" : "全能研讨"}
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl border-0 bg-zinc-100/50 dark:bg-zinc-800/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                <p className="text-[11px] text-muted-foreground font-normal">席位容量</p>
                                <p className="font-semibold text-foreground mt-0.5">
                                    {members.length} / {room.max_members} 人
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 成员名单 */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-zinc-400" />
                                <span>研讨室成员</span>
                            </span>
                            <span className="text-[11px] text-muted-foreground font-normal">
                                共 {members.length} 位学者
                                {onlineUserIds ? ` · ${members.filter((m) => onlineUserIds.has(m.user.id)).length} 人在线` : ""}
                            </span>
                        </label>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {members.map((member) => {
                                const isOnline = onlineUserIds ? onlineUserIds.has(member.user.id) : false;
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-2 rounded-xl border-0 bg-zinc-100/40 dark:bg-zinc-800/30 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative shrink-0">
                                                <Avatar className="h-7 w-7 rounded-full ring-1 ring-background">
                                                    <AvatarImage src={member.user.avatar_url} />
                                                    <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                                        {(member.user.username || "?").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex items-center gap-1.5">
                                                <span className="text-xs font-medium text-foreground truncate">
                                                    {member.user.username || "学者"}
                                                </span>
                                                {member.user.id === currentUserId && (
                                                    <span className="text-[10px] text-muted-foreground font-normal">(我)</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isOnline ? (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]">
                                                    在线
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground font-normal px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-700/50 border-0">
                                                    离线
                                                </span>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-0 bg-white/80 dark:bg-zinc-700/80 text-[10px] px-2 py-0.5 font-medium flex items-center gap-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]"
                                            >
                                                {roleIcons[member.role]}
                                                <span>{roleLabels[member.role] || member.role}</span>
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 危险操作 */}
                    {isOwner && (
                        <>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-rose-300/50 dark:via-rose-900/50 to-transparent" />
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-rose-500 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>解散研讨室</span>
                                </label>
                                {!showDeleteConfirm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full py-2 rounded-full border-0 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>解散本研究室</span>
                                    </button>
                                ) : (
                                    <div className="p-3.5 rounded-2xl border-0 bg-rose-500/10 space-y-2.5">
                                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                            确定要彻底解散本研究室？此操作将清除所有协同会话与记录且不可撤销。
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-1.5 rounded-full border-0 bg-white/80 dark:bg-zinc-800 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                            >
                                                取消
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={isPending}
                                                className="flex-1 py-1.5 rounded-full border-0 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                                <span>确认解散</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
