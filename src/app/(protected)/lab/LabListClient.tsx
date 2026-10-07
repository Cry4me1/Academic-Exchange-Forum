"use client";

import { LabRoomCard } from "@/components/lab/LabRoomCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FlaskConical, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";

interface LabListClientProps {
    rooms: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        is_encrypted?: boolean;
        access_code_hash?: string | null;
        max_members: number;
        is_archived?: boolean;
        updated_at: string;
        lab_members?: { count: number }[];
        lab_post_links?: { count: number }[];
        output_count?: number;
    }[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LabListClient({ rooms }: LabListClientProps) {
    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* 顶部操作与标题横幅 */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border-0 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]">
                            <FlaskConical className="h-7 w-7 text-foreground" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground font-title">
                                    学术共创实验室
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                    <Sparkles className="h-3 w-3" />
                                    实时协作
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">
                                文献同读 · Yjs 协同笔记推演 · 多人知识共创与成果署名
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/lab/create">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border-0 transition-all duration-200 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                <span>新建研究室</span>
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* 研究室列表网格 */}
                {rooms.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {rooms.map((room) => (
                            <motion.div key={room.id} variants={itemVariants}>
                                <LabRoomCard room={room} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-0 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.1)] text-center"
                    >
                        <div className="p-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                            <FlaskConical className="h-12 w-12" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">
                            暂无活跃的共创研究室
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed font-medium">
                            创建一个专属学术研讨室，邀请同侪实时推导演练公式、深度共读文献，并将研讨记录一键以联合署名形式发布至学术社区。
                        </p>
                        <Link href="/lab/create">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border-0 transition-all bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                <span>立即创建第一个研讨室</span>
                            </motion.button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
