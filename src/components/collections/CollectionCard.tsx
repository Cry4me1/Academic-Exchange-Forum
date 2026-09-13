"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, FileText, Lock } from "lucide-react";
import { CollectionCover } from "./CollectionCover";
import { COLLECTION_COVER_PRESETS, getCollectionCoverPreset } from "./CollectionCoverPresets";

export { COLLECTION_COVER_PRESETS, getCollectionCoverPreset };

interface CollectionCardProps {
    id: string;
    name: string;
    description?: string | null;
    coverUrl?: string | null;
    coverStyle?: string;
    postCount: number;
    isPublic: boolean;
    updatedAt?: string;
    authorName?: string;
    showAuthor?: boolean;
}

export function CollectionCard({
    id,
    name,
    description,
    coverUrl,
    coverStyle = "preset-academic",
    postCount,
    isPublic,
    updatedAt,
    authorName,
    showAuthor = false,
}: CollectionCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="group block w-full"
        >
            <Link href={`/collections/${id}`}>
                {/* 超椭圆通透毛玻璃卡片 */}
                <div className="relative bg-white/75 dark:bg-zinc-900/60 backdrop-blur-2xl border-0 rounded-3xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_16px_40px_-6px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_16px_40px_-6px_rgba(0,0,0,0.5)] transition-all duration-300">
                    
                    {/* 专栏封面 - 3:2 构图 */}
                    <div className="relative w-full aspect-[3/2] overflow-hidden">
                        <CollectionCover
                            coverUrl={coverUrl}
                            coverStyle={coverStyle}
                            size="md"
                            className="group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                        >
                            {/* 私密状态胶囊徽标 */}
                            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                                {!isPublic && (
                                    <div className="bg-black/50 backdrop-blur-xl px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium text-amber-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
                                        <Lock className="w-3 h-3" />
                                        <span>私密</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* 标题悬浮液态遮罩 */}
                            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pt-14 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                                <h3 className="text-lg font-bold text-white tracking-tight leading-snug line-clamp-2 drop-shadow-md group-hover:text-white/95">
                                    {name}
                                </h3>
                            </div>
                        </CollectionCover>
                    </div>

                    {/* 元信息区域 */}
                    <div className="p-4 bg-transparent">
                        {description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3.5 leading-relaxed min-h-[2rem]">
                                {description}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground/60 italic mb-3.5 line-clamp-2 min-h-[2rem]">
                                暂无专栏简介
                            </p>
                        )}
                        
                        <div className="mt-auto pt-2.5 space-y-2">
                            {/* 渐变消融微光缝 */}
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                        <FileText className="w-3.5 h-3.5 opacity-80" />
                                        <span>{postCount} 篇</span>
                                    </div>
                                    {updatedAt && (
                                        <div className="flex items-center gap-1 text-[11px] opacity-75">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {showAuthor && authorName && (
                                    <div className="text-xs font-medium text-primary/90 truncate max-w-[110px] text-right">
                                        {authorName}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
