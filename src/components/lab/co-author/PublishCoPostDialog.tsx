"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { publishCoPost } from "@/app/(protected)/lab/actions";
import { FileText, Loader2, Send, Sparkles, Users } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CoAuthorEntry {
    userId: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    role: "co_author" | "contributor" | "annotator";
    contribution: string;
}

interface PublishCoPostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    roomName: string;
    currentUserId: string;
    collaborators: {
        id: string;
        name: string;
        avatarUrl?: string;
    }[];
    noteContent: object | null;
    onPublished?: (post: { id: string; title: string }) => void;
}

const roleOptions = [
    { value: "co_author", label: "共同作者" },
    { value: "contributor", label: "主要贡献者" },
    { value: "annotator", label: "评阅/批注者" },
] as const;

export function PublishCoPostDialog({
    open,
    onOpenChange,
    roomId,
    roomName,
    currentUserId,
    collaborators,
    noteContent,
    onPublished,
}: PublishCoPostDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [coAuthors, setCoAuthors] = useState<CoAuthorEntry[]>(() =>
        collaborators
            .filter((c) => c.id !== currentUserId)
            .map((c) => ({
                userId: c.id,
                username: c.name,
                fullName: c.name,
                avatarUrl: c.avatarUrl,
                role: "co_author" as const,
                contribution: "",
            }))
    );

    const updateCoAuthorRole = (userId: string, role: CoAuthorEntry["role"]) => {
        setCoAuthors((prev) =>
            prev.map((ca) => (ca.userId === userId ? { ...ca, role } : ca))
        );
    };

    const handlePublish = () => {
        if (!title.trim()) {
            toast.error("请输入帖子标题");
            return;
        }
        if (!noteContent) {
            toast.error("研讨笔记内容为空，请先在编辑器中编写推导记录");
            return;
        }

        startTransition(async () => {
            const tagList = tags
                .split(/[,，\s]+/)
                .map((t) => t.trim())
                .filter(Boolean);

            const result = await publishCoPost({
                roomId,
                title: title.trim(),
                tags: tagList,
                content: noteContent,
                coAuthors: coAuthors.map((ca) => ({
                    userId: ca.userId,
                    role: ca.role,
                    contributionSummary: ca.contribution || undefined,
                })),
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.data) {
                const reviewStatus = result.data.review_status;
                if (reviewStatus === "pending") {
                    toast.info("研讨成果已提交！因内容包含待复核要素，已自动转入人工审核队列，复核通过后将正式向全站公开。", {
                        duration: 6000,
                    });
                } else {
                    toast.success("学术研讨成果已正式发布至学术社区！");
                }

                onOpenChange(false);
                if (onPublished) {
                    onPublished({ id: result.data.id, title: title.trim() });
                } else {
                    router.push(`/posts/${result.data.id}`);
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-3xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_16px_50px_-8px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_50px_-8px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-6">
                <DialogHeader className="space-y-1 pb-1">
                    <DialogTitle className="text-lg font-bold font-title text-foreground tracking-tight flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-foreground" />
                        <span>研讨成果联合署名发帖</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-medium">
                        将本次协同推导与笔记转化为学术长帖，自动标注所有共创同侪与贡献分工
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* 帖子标题 */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                            论文 / 研讨论述标题 <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            placeholder="输入学术帖子标题..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            className="h-10 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/60 px-4 text-xs shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                        />
                    </div>

                    {/* 学术标签 */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                            领域标签（逗号或空格分隔）
                        </label>
                        <Input
                            placeholder="例如：线性注意力, Transformer, 算法推演"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="h-10 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/60 px-4 text-xs shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                        />
                    </div>

                    {/* 来源研讨空间标签 */}
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl border-0 bg-zinc-100/50 dark:bg-zinc-800/40 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                        <FileText className="h-4 w-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
                        <span className="text-xs text-muted-foreground font-normal">来源研讨空间：</span>
                        <Badge
                            variant="secondary"
                            className="rounded-full border-0 bg-white/80 dark:bg-zinc-700/80 text-[11px] px-2.5 py-0.5 font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                        >
                            {roomName}
                        </Badge>
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 共创作者确认 */}
                    {coAuthors.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>联合署名成员与分工</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground font-normal">{coAuthors.length} 位协作者</span>
                            </label>
                            <div className="space-y-2 max-h-[170px] overflow-y-auto no-scrollbar pr-1">
                                {coAuthors.map((ca) => (
                                    <div
                                        key={ca.userId}
                                        className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border-0 bg-zinc-100/40 dark:bg-zinc-800/30 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)]"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Avatar className="h-7 w-7 rounded-full shrink-0 ring-1 ring-background">
                                                <AvatarImage src={ca.avatarUrl} />
                                                <AvatarFallback className="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium">
                                                    {(ca.username || "?").slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium text-foreground truncate">
                                                {ca.fullName || ca.username}
                                            </span>
                                        </div>

                                        <Select
                                            value={ca.role}
                                            onValueChange={(v) =>
                                                updateCoAuthorRole(ca.userId, v as CoAuthorEntry["role"])
                                            }
                                        >
                                            <SelectTrigger className="h-7 w-[105px] text-xs rounded-full border-0 bg-white/80 dark:bg-zinc-700/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] shrink-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-0 bg-white/95 dark:bg-zinc-900/95 shadow-lg">
                                                {roleOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-xs rounded-xl">
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 行动按钮 */}
                <DialogFooter className="pt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 rounded-full border-0 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                    >
                        取消
                    </button>
                    <motion.button
                        type="button"
                        whileHover={{ scale: isPending || !title.trim() || !noteContent ? 1 : 1.02 }}
                        whileTap={{ scale: isPending || !title.trim() || !noteContent ? 1 : 0.98 }}
                        disabled={isPending || !title.trim() || !noteContent}
                        onClick={handlePublish}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium border-0 transition-all",
                            "bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950",
                            "shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer",
                            (isPending || !title.trim() || !noteContent) && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>正在排版发布中...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-3.5 w-3.5" />
                                <span>正式联合署名发帖</span>
                            </>
                        )}
                    </motion.button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
