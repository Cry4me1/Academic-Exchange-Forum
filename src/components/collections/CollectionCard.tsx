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
                <div className="relative bg-card/80 backdrop-blur-2xl border border-white/15 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.18)] hover:border-white/30 transition-all duration-400">
                    
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
                                    <div className="bg-black/50 backdrop-blur-xl px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium text-amber-300 border border-white/20 shadow-lg">
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
                    <div className="p-4 bg-card/60 backdrop-blur-md">
                        {description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3.5 leading-relaxed min-h-[2rem]">
                                {description}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground/60 italic mb-3.5 line-clamp-2 min-h-[2rem]">
                                暂无专栏简介
                            </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-border/40">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <div className="flex items-center gap-1.5 bg-muted/60 text-foreground/80 px-2.5 py-0.5 rounded-full border border-border/30">
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
            </Link>
        </motion.div>
    );
}
