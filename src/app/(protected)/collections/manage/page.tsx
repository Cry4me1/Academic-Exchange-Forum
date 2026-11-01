"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Edit2, BookMarked, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { getMyCollections, deleteCollection } from "../actions";
import { CollectionCard, CreateCollectionDialog } from "@/components/collections";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function ManageCollectionsPage() {
    const router = useRouter();
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<any | null>(null);
    
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCollections = async (newCol?: any) => {
        if (newCol && !collections.some(c => c.id === newCol.id)) {
            setCollections(prev => [newCol, ...prev]);
        }
        try {
            const result = await getMyCollections();
            if (result.collections) {
                setCollections(result.collections);
            }
        } catch (error) {
            console.error(error);
            toast.error("加载专栏失败");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCollections();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteCollection(deleteId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("删除成功");
                setCollections(prev => prev.filter(c => c.id !== deleteId));
            }
        } catch (error) {
            toast.error("删除出错");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
        >
            {/* Header - Apple Liquid Glass 无边框导航栏 */}
            <header className="sticky top-0 z-40 border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3.5">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3.5 rounded-full border-0 gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200/35 hover:bg-zinc-200/60 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all cursor-pointer"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    返回工作台
                                </Button>
                            </Link>
                            <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent shrink-0" />
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                                <span className="w-7 h-7 rounded-full bg-amber-500/[0.12] text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                                    <BookMarked className="h-4 w-4" />
                                </span>
                                我的专栏
                            </h1>
                        </div>
                        
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            <Button 
                                onClick={() => {
                                    setEditingCollection(null);
                                    setIsCreateOpen(true);
                                }}
                                className="relative overflow-hidden group h-9 px-5 rounded-full border-0 gap-1.5 font-medium text-xs sm:text-sm bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] backdrop-blur-xl transition-all duration-300 cursor-pointer"
                            >
                                <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/45 dark:via-white/85 to-transparent pointer-events-none" />
                                <Plus className="h-4 w-4" />
                                新建专栏
                            </Button>
                        </motion.div>
                    </div>
                </div>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-64 w-full rounded-3xl border-0" />
                        ))}
                    </div>
                ) : collections.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-lg mx-auto mt-12 rounded-3xl border-0 p-10 flex flex-col items-center justify-center text-center bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
                    >
                        <div className="w-20 h-20 mb-6 rounded-full bg-amber-500/[0.12] text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_4px_20px_rgba(245,158,11,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16)]">
                            <BookMarked className="w-9 h-9" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">还没有创建任何专栏</h2>
                        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                            专栏可以帮助你将相关的帖子分类整理，形成系列的知识库。快来创建你的第一个专栏吧！
                        </p>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                            <Button 
                                size="lg" 
                                onClick={() => {
                                    setEditingCollection(null);
                                    setIsCreateOpen(true);
                                }} 
                                className="relative overflow-hidden group h-10 px-6 rounded-full border-0 gap-2 font-medium text-sm bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] backdrop-blur-xl transition-all duration-300 cursor-pointer"
                            >
                                <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/45 dark:via-white/85 to-transparent pointer-events-none" />
                                <Plus className="h-4 w-4" />
                                立即创建
                            </Button>
                        </motion.div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {collections.map((collection) => (
                                <motion.div
                                    key={collection.id}
                                    layout
                                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3 }}
                                    className="relative group"
                                >
                                    <CollectionCard 
                                        id={collection.id}
                                        name={collection.name}
                                        description={collection.description}
                                        coverUrl={collection.cover_url}
                                        coverStyle={collection.cover_style}
                                        postCount={collection.post_count ?? 0}
                                        isPublic={collection.is_public ?? true}
                                        onlyShowLeadPostInFeed={collection.only_show_lead_post_in_feed}
                                        updatedAt={collection.updated_at}
                                    />
                                    
                                    {/* Hover Actions - 水滴胶囊悬浮按钮 */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <Button 
                                            variant="secondary" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full border-0 bg-black/45 hover:bg-black/65 text-white backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35),0_4px_12px_rgba(0,0,0,0.25)] transition-all cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingCollection(collection);
                                                setIsCreateOpen(true);
                                            }}
                                            title="编辑专栏"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full border-0 bg-red-500/80 hover:bg-red-600/95 text-white backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35),0_4px_12px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setDeleteId(collection.id);
                                            }}
                                            title="删除"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Create / Edit Dialog */}
            {isCreateOpen && (
                <CreateCollectionDialog 
                    open={isCreateOpen} 
                    onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) setEditingCollection(null);
                    }} 
                    editingCollection={editingCollection}
                    onSuccess={(newCol) => loadCollections(newCol)}
                />
            )}

            {/* Delete Alert - Apple Liquid Glass 模态框 */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
                <AlertDialogContent className="rounded-3xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7),inset_0_1px_0.5px_rgba(255,255,255,0.15)] p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">确认删除该专栏吗？</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                            删除专栏不会删除其中的帖子，但专栏信息和帖子与专栏的关联将被永久删除，且无法恢复。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2.5 pt-2">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            className="h-9 px-5 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200/45 hover:bg-zinc-200/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-all cursor-pointer mt-0"
                        >
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="h-9 px-5 rounded-full border-0 text-xs font-medium bg-red-600/90 hover:bg-red-600 text-white shadow-[0_4px_16px_-2px_rgba(239,68,68,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-xl transition-all cursor-pointer"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
