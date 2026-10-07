"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addPostToRoom, searchPostsForRoom } from "@/app/(protected)/lab/actions";
import { Heart, Loader2, MessageCircle, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PostResult {
    id: string;
    title: string;
    tags: string[];
    like_count: number;
    comment_count: number;
    created_at: string;
    author: {
        id: string;
        username?: string;
        avatar_url?: string;
    };
}

interface PostSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    onPostAdded?: (postLink: unknown) => void;
}

export function PostSearchDialog({ open, onOpenChange, roomId, onPostAdded }: PostSearchDialogProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PostResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const doSearch = useCallback(async (searchQuery: string) => {
        setIsSearching(true);
        const result = await searchPostsForRoom(searchQuery, roomId);
        if (result.error) {
            toast.error(result.error);
        } else {
            setResults(result.data as PostResult[]);
        }
        setIsSearching(false);
    }, [roomId]);

    useEffect(() => {
        if (open) {
            doSearch("");
        }
    }, [open, doSearch]);

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            doSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, open, doSearch]);

    const handleAdd = (postId: string) => {
        setAddingId(postId);
        startTransition(async () => {
            const result = await addPostToRoom(roomId, postId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("已成功添加至共读书单");
                setResults((prev) => prev.filter((p) => p.id !== postId));
                if (onPostAdded && result.data) {
                    onPostAdded(result.data);
                }
                onOpenChange(false);
            }
            setAddingId(null);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col rounded-3xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_16px_50px_-8px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_16px_50px_-8px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-6">
                <DialogHeader className="space-y-1 pb-1">
                    <DialogTitle className="text-lg font-bold font-title text-foreground tracking-tight">
                        检索并挂载学术文献
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-medium">
                        搜索社区学术帖子引入研讨空间，与同侪开启同步视口共读
                    </DialogDescription>
                </DialogHeader>

                <div className="relative my-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索论文标题或关键词..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 h-10 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/60 text-xs shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 min-h-[220px] max-h-[420px] pr-1">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                            <p className="text-xs text-muted-foreground font-medium">正在检索文献...</p>
                        </div>
                    ) : results.length > 0 ? (
                        results.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border-0 bg-zinc-100/50 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-9 w-9 rounded-full ring-1 ring-background shrink-0">
                                        <AvatarImage src={post.author.avatar_url} />
                                        <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium">
                                            {(post.author.username || "?").slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs sm:text-sm text-foreground truncate tracking-tight">
                                            {post.title}
                                        </p>
                                        <div className="flex items-center gap-2.5 mt-1 text-[11px] text-muted-foreground font-medium">
                                            <span>{post.author.username || "学者"}</span>
                                            <span className="flex items-center gap-0.5">
                                                <Heart className="h-3 w-3 text-rose-500/80" /> {post.like_count}
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                <MessageCircle className="h-3 w-3 text-sky-500/80" /> {post.comment_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAdd(post.id)}
                                    disabled={addingId === post.id}
                                    className="shrink-0 px-3.5 py-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                >
                                    {addingId === post.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>添加</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                            {query ? "未检索到相关学术帖子" : "请输入关键词开始检索"}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
