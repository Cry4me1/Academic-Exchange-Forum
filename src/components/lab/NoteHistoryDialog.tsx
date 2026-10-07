"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    Clock,
    History,
    Loader2,
    RotateCcw,
    Save,
    Tag,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Snapshot {
    id: string;
    snapshot_type: string;
    label: string | null;
    created_by: string | null;
    created_at: string;
    createdByUser: {
        username?: string;
        avatar_url?: string;
    } | null;
}

interface NoteHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    onRollback: (snapshotId: string) => Promise<boolean>;
    onManualSave: (label?: string) => Promise<boolean>;
    isSaving: boolean;
    isRestoring: boolean;
    isOwnerOrAdmin: boolean;
}

const snapshotTypeLabels: Record<string, { label: string; color: string }> = {
    auto: { label: "自动快照", color: "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground" },
    manual: { label: "里程碑", color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200" },
    pre_rollback: { label: "回滚备份", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function NoteHistoryDialog({
    open,
    onOpenChange,
    roomId,
    onRollback,
    onManualSave,
    isSaving,
    isRestoring,
    isOwnerOrAdmin,
}: NoteHistoryDialogProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveLabel, setSaveLabel] = useState("");
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [rollbackTarget, setRollbackTarget] = useState<Snapshot | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null);

    const fetchSnapshots = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/lab-notes/snapshots?roomId=${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setSnapshots(data.snapshots || []);
            }
        } catch (e) {
            console.error("获取快照列表失败:", e);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        if (open) {
            fetchSnapshots();
        }
    }, [open, fetchSnapshots]);

    const handleManualSave = async () => {
        const label = saveLabel.trim() || undefined;
        const ok = await onManualSave(label);
        if (ok) {
            toast.success("已创建快照保存点");
            setSaveLabel("");
            setShowSaveInput(false);
            fetchSnapshots();
        } else {
            toast.error("快照保存失败，请重试");
        }
    };

    const handleRollback = async () => {
        if (!rollbackTarget) return;
        const ok = await onRollback(rollbackTarget.id);
        if (ok) {
            toast.success(`回滚成功，已恢复到 ${formatTimeAgo(rollbackTarget.created_at)} 的状态`);
            setRollbackTarget(null);
            onOpenChange(false); // 回滚成功后自动关闭弹窗，方便学者查看最新恢复的笔记内容
        } else {
            toast.error("回滚失败，请重试");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetch(
                `/api/lab-notes/snapshots?snapshotId=${deleteTarget.id}&roomId=${roomId}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                toast.success("已删除快照记录");
                setDeleteTarget(null);
                fetchSnapshots();
            } else {
                toast.error("删除失败");
            }
        } catch {
            toast.error("删除失败");
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[540px] max-h-[85vh] h-[80vh] flex flex-col rounded-3xl border-0 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[0_16px_50px_-8px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_50px_-8px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-6">
                    <DialogHeader className="space-y-1 pb-1 flex-shrink-0">
                        <DialogTitle className="text-lg font-bold font-title text-foreground tracking-tight flex items-center gap-2">
                            <History className="h-5 w-5 text-foreground" />
                            <span>研讨笔记版本历史</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground font-medium">
                            自动记录协同演练快照，支持精准安全回滚与版本备份
                        </DialogDescription>
                    </DialogHeader>

                    {/* 手动创建快照 */}
                    <div className="rounded-2xl border-0 p-3 bg-zinc-100/50 dark:bg-zinc-800/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] my-2 flex-shrink-0">
                        {showSaveInput ? (
                            <div className="space-y-2">
                                <Input
                                    placeholder="输入里程碑标签（例如「公式推导完成」）"
                                    value={saveLabel}
                                    onChange={(e) => setSaveLabel(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleManualSave()}
                                    className="h-9 rounded-full border-0 bg-white dark:bg-zinc-900 px-3 text-xs shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => { setShowSaveInput(false); setSaveLabel(""); }}
                                        className="px-3 py-1 rounded-full text-xs font-medium border-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleManualSave}
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border-0 bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white dark:text-zinc-950 text-white shadow-xs cursor-pointer disabled:opacity-60"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Save className="h-3 w-3" />
                                        )}
                                        <span>保存当前快照</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowSaveInput(true)}
                                className="w-full py-1.5 rounded-full border-0 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-foreground text-xs font-medium transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Save className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                                <span>创建当前笔记里程碑快照</span>
                            </button>
                        )}
                    </div>

                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-1 flex-shrink-0" />

                    {/* 快照时间线列表（flex-1 搭配 overflow-y-auto，严丝合缝拘束在弹窗内胆） */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1.5 space-y-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                                <p className="text-xs text-muted-foreground font-medium">正在读取快照档案...</p>
                            </div>
                        ) : snapshots.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                                <History className="h-9 w-9 mx-auto mb-2 opacity-30" />
                                <p>暂无历史版本快照</p>
                                <p className="text-[11px] mt-1 text-muted-foreground/70">协同编辑时系统将自动生成快照，也可随时手动创建保存点</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {snapshots.map((snapshot, index) => {
                                    const typeInfo = snapshotTypeLabels[snapshot.snapshot_type] || {
                                        label: snapshot.snapshot_type,
                                        color: "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground",
                                    };
                                    const isFirst = index === 0;

                                    return (
                                        <div
                                            key={snapshot.id}
                                            className={cn(
                                                "group flex items-start justify-between gap-3 p-3 rounded-2xl border-0 transition-all",
                                                "bg-zinc-100/40 dark:bg-zinc-800/30 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]",
                                                isFirst && "bg-zinc-100/90 dark:bg-zinc-800/80 ring-1 ring-zinc-300/80 dark:ring-zinc-600/80"
                                            )}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className="mt-1">
                                                    <div className={cn(
                                                        "h-2 w-2 rounded-full ring-2 ring-background",
                                                        isFirst ? "bg-emerald-500" :
                                                        snapshot.snapshot_type === "manual" ? "bg-zinc-700 dark:bg-zinc-300" :
                                                        snapshot.snapshot_type === "pre_rollback" ? "bg-amber-500" :
                                                        "bg-muted-foreground/40"
                                                    )} />
                                                </div>

                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]", typeInfo.color)}>
                                                            {typeInfo.label}
                                                        </span>
                                                        {isFirst && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-800 dark:text-zinc-200">
                                                                最新状态
                                                            </span>
                                                        )}
                                                        {snapshot.label && (
                                                            <span className="flex items-center gap-1 text-xs text-foreground font-medium truncate">
                                                                <Tag className="h-3 w-3 text-muted-foreground" />
                                                                {snapshot.label}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTimeAgo(snapshot.created_at)}
                                                        </span>
                                                        {snapshot.createdByUser && (
                                                            <span className="flex items-center gap-1">
                                                                <Avatar className="h-3.5 w-3.5 rounded-full">
                                                                    <AvatarImage src={snapshot.createdByUser.avatar_url} />
                                                                    <AvatarFallback className="text-[8px]">
                                                                        {(snapshot.createdByUser.username || "?").slice(0, 1).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>{snapshot.createdByUser.username || "学者"}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 操作按钮 */}
                                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRollbackTarget(snapshot)}
                                                            disabled={isRestoring}
                                                            className="h-7 w-7 rounded-full border-0 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isRestoring && rollbackTarget?.id === snapshot.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />
                                                            ) : (
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-xs">回滚到此版本</TooltipContent>
                                                </Tooltip>

                                                {isOwnerOrAdmin && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget(snapshot)}
                                                                className="h-7 w-7 rounded-full border-0 inline-flex items-center justify-center text-rose-500/70 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom" className="text-xs">删除此快照</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 回滚确认弹窗 */}
            <AlertDialog open={!!rollbackTarget} onOpenChange={(open) => !open && setRollbackTarget(null)}>
                <AlertDialogContent className="rounded-3xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-xl p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground font-title">
                            确认回滚笔记状态？
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            系统将恢复到 {rollbackTarget && formatTimeAgo(rollbackTarget.created_at)} 的快照。在回滚前，系统已自动为当前编辑状态生成一份备份快照，你可以随时再次恢复。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full border-0 text-xs font-medium">取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRollback}
                            className="rounded-full border-0 bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 text-white text-xs font-medium shadow-sm"
                        >
                            确认安全回滚
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 删除快照确认弹窗 */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="rounded-3xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-xl p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground font-title">
                            确认删除此快照？
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            删除后，该时间点的快照将被永久移除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full border-0 text-xs font-medium">取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-full border-0 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm"
                        >
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
