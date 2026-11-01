"use client";

import { getMyCollections, syncPostCollections } from "@/app/(protected)/collections/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookMarked, FolderPlus, Loader2, Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CreateCollectionDialog } from "./CreateCollectionDialog";

interface AddToCollectionDialogProps {
    postId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialCollectionIds?: string[];
    onSuccess?: () => void;
}

export function AddToCollectionDialog({ postId, open, onOpenChange, initialCollectionIds = [], onSuccess }: AddToCollectionDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialCollectionIds));
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useEffect(() => {
        if (open) {
            loadCollections();
            setSelectedIds(new Set(initialCollectionIds));
        }
    }, [open, initialCollectionIds]);

    const loadCollections = async () => {
        setIsLoading(true);
        try {
            const { collections } = await getMyCollections();
            setCollections(collections || []);
        } catch (error) {
            console.error("Failed to load collections:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        setSelectedIds(next);
    };

    const handleSubmit = async () => {
        startTransition(async () => {
            const result = await syncPostCollections(postId, Array.from(selectedIds));
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("已更新所属专栏");
                onOpenChange(false);
                onSuccess?.();
            }
        });
    };

    const handleCreateSuccess = () => {
        loadCollections();
        setShowCreateDialog(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[460px] rounded-3xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 select-none">
                    <DialogHeader className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] border-0">
                                <FolderPlus className="w-4 h-4" />
                            </div>
                            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                                添加到学术专栏
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            将本文归入您的专栏进行知识分类整理，读者将能沿目录连载阅读。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="text-xs text-muted-foreground">正在同步专栏列表...</span>
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="text-center py-10 rounded-2xl bg-zinc-100/50 dark:bg-white/[0.04] p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                <BookMarked className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                                <p className="text-sm font-medium text-foreground mb-1">您还没有创建任何学术专栏</p>
                                <p className="text-xs text-muted-foreground mb-4">创建首个专栏，开启系列主题连载沉淀。</p>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowCreateDialog(true)}
                                    className="h-8 px-4 rounded-full border-0 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium cursor-pointer"
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" /> 立即新建专栏
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {collections.map((collection) => {
                                    const isChecked = selectedIds.has(collection.id);
                                    return (
                                        <div 
                                            key={collection.id} 
                                            onClick={() => handleToggle(collection.id, !isChecked)}
                                            className="flex items-center space-x-3 rounded-2xl p-3 bg-zinc-200/40 hover:bg-zinc-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)] transition-all cursor-pointer"
                                        >
                                            <Checkbox
                                                id={`collection-${collection.id}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => handleToggle(collection.id, checked as boolean)}
                                                className="rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                                            />
                                            <Label
                                                htmlFor={`collection-${collection.id}`}
                                                className="flex-1 cursor-pointer flex justify-between items-center text-xs sm:text-sm font-medium text-foreground select-none"
                                            >
                                                <span className="truncate">{collection.name}</span>
                                                <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-zinc-200/50 dark:bg-white/[0.06] shrink-0 ml-2">
                                                    {collection.post_count} 篇
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 消融内部微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-2">
                        {collections.length > 0 && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowCreateDialog(true)}
                                className="h-8 px-3 rounded-full border-0 text-xs text-muted-foreground hover:text-primary cursor-pointer"
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" /> 新建专栏
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-8.5 px-4 rounded-full border-0 bg-zinc-200/40 hover:bg-zinc-200/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] text-xs font-medium cursor-pointer"
                            >
                                取消
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isPending || isLoading}
                                size="sm"
                                className="h-8.5 px-5 rounded-full border-0 font-medium text-xs bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] cursor-pointer"
                            >
                                {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                保存归属
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CreateCollectionDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleCreateSuccess}
            />
        </>
    );
}
