"use client";

import { joinLabRoom } from "@/app/(protected)/lab/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    FileText,
    FlaskConical,
    Loader2,
    Lock,
    LogIn,
    Pencil,
    Shield,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface JoinLabClientProps {
    room: {
        id: string;
        name: string;
        description?: string;
        room_type: string;
        max_members: number;
        memberCount: number;
        isEncrypted?: boolean;
    };
}

export default function JoinLabClient({ room }: JoinLabClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [accessCode, setAccessCode] = useState("");

    const isFull = room.memberCount >= room.max_members;

    const handleJoin = () => {
        startTransition(async () => {
            const result = await joinLabRoom(room.id, accessCode ? accessCode.trim() : undefined);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`已成功加入「${room.name}」研讨空间`);
                router.push(`/lab/${room.id}`);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-4"
            >
                {/* 返回导航 */}
                <div>
                    <Link href="/lab">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)] text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>返回研讨大盘</span>
                        </button>
                    </Link>
                </div>

                {/* 主卡片 */}
                <div className="rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_12px_40px_-6px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.12)] space-y-6">
                    {/* 头部 */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] mb-1">
                            <FlaskConical className="h-7 w-7 text-foreground" />
                        </div>
                        <h1 className="text-lg font-bold text-foreground font-title tracking-tight">
                            受邀加入学术研究室
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                            加入同侪协作网络，开启实时学术共读与笔记推演
                        </p>
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 房间信息卡片 */}
                    <div className="rounded-2xl border-0 bg-zinc-100/60 dark:bg-zinc-800/40 p-4 space-y-2.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                        <div>
                            <h2 className="font-semibold text-foreground text-base tracking-tight">
                                {room.name}
                            </h2>
                            {room.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                    {room.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <Badge
                                variant="secondary"
                                className="rounded-full border-0 bg-white/80 dark:bg-zinc-700/80 text-foreground text-[11px] px-2.5 py-0.5 font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]"
                            >
                                {room.room_type === "reading" ? "文献共读" : room.room_type === "whiteboard" ? "白板推导" : "全能研讨"}
                            </Badge>

                            <span className={cn(
                                "text-xs font-medium flex items-center gap-1.5",
                                isFull ? "text-rose-500" : "text-muted-foreground"
                            )}>
                                <Users className="h-3.5 w-3.5" />
                                {room.memberCount} / {room.max_members} 成员
                            </span>
                        </div>
                    </div>

                    {/* 访问密码口令输入框（如果房间加密或需要输入） */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground tracking-tight flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-zinc-400" />
                            <span>访问密码口令 {room.isEncrypted ? <span className="text-rose-500">*</span> : "（公开房间可留空）"}</span>
                        </label>
                        <Input
                            type="password"
                            placeholder="输入研讨室访问口令..."
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className="h-10 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/60 px-4 text-xs text-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                        />
                    </div>

                    {/* 加入行动点按钮 */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: isPending || isFull ? 1 : 1.02 }}
                        whileTap={{ scale: isPending || isFull ? 1 : 0.98 }}
                        disabled={isPending || isFull}
                        onClick={handleJoin}
                        className={cn(
                            "w-full h-11 inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium border-0 transition-all",
                            "bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950",
                            "shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer",
                            (isPending || isFull) && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>正在验证并接入空间...</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="h-4 w-4" />
                                <span>{isFull ? "研讨室成员已满" : "确认并进入研讨空间"}</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
