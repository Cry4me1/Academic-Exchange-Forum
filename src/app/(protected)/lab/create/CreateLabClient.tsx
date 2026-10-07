"use client";

import { createLabRoom } from "@/app/(protected)/lab/actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    Check,
    FileText,
    FlaskConical,
    Loader2,
    Lock,
    Pencil,
    Shield,
    Sparkles,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const ROOM_TYPES = [
    {
        id: "hybrid",
        title: "全能研讨",
        description: "左侧文献共读与划注，右侧 Yjs 实时推导与 Markdown 协作笔记",
        icon: FileText,
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        aura: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]",
    },
    {
        id: "reading",
        title: "文献共读",
        description: "聚焦学术论文、期刊专栏与长帖深度研读，支持多学者视口滚动同步",
        icon: BookOpen,
        badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
        aura: "hover:shadow-[0_8px_30px_rgba(14,165,233,0.15)]",
    },
    {
        id: "whiteboard",
        title: "白板推导",
        description: "侧重公式推演、算法步骤剖析与结构化图表思维碰撞",
        icon: Pencil,
        badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200",
        aura: "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
    },
] as const;

const MEMBER_LIMIT_OPTIONS = [4, 8, 10, 15, 20];

export default function CreateLabClient() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [roomType, setRoomType] = useState<"reading" | "whiteboard" | "hybrid">("hybrid");
    const [maxMembers, setMaxMembers] = useState(10);
    const [enablePassword, setEnablePassword] = useState(false);
    const [accessCode, setAccessCode] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("请输入研究室名称");
            return;
        }

        if (enablePassword && !accessCode.trim()) {
            toast.error("已开启密码保护，请输入访问口令");
            return;
        }

        startTransition(async () => {
            const res = await createLabRoom({
                name: name.trim(),
                description: description.trim() || undefined,
                room_type: roomType,
                max_members: maxMembers,
                access_code: enablePassword ? accessCode.trim() : undefined,
            });

            if (res.error) {
                toast.error(res.error);
            } else if (res.data?.id) {
                toast.success("研究室已创建，正在进入研讨空间...");
                router.push(`/lab/${res.data.id}`);
            }
        });
    };

    return (
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* 顶部返回导航 */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <Link href="/lab">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)] text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>返回研讨大盘</span>
                        </button>
                    </Link>
                </motion.div>

                {/* 主表单面板 */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/65 backdrop-blur-2xl shadow-[0_12px_40px_-6px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.12)] p-6 sm:p-8"
                >
                    {/* 面板头部 */}
                    <div className="flex items-center gap-3.5 pb-6">
                        <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]">
                            <FlaskConical className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground font-title">
                                创建新的学术研究室
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                配置房间类型与学术研讨模式，邀请同侪展开无缝协同推演
                            </p>
                        </div>
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mb-6" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. 研究室名称 */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground tracking-tight flex items-center justify-between">
                                <span>研究室名称 <span className="text-rose-500">*</span></span>
                                <span className="text-[11px] text-muted-foreground font-normal">{name.length}/50</span>
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value.slice(0, 50))}
                                placeholder="例如：Transformer 线性注意力推导演讨小组"
                                required
                                className="h-11 rounded-full border-0 bg-zinc-100/70 dark:bg-zinc-800/60 px-4 text-sm text-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)] focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                            />
                        </div>

                        {/* 2. 研究室描述 */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground tracking-tight">
                                研讨背景与目标描述（可选）
                            </label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                                placeholder="简要说明本次研讨的文献主题、推导演练目标或参与要求..."
                                rows={3}
                                className="rounded-2xl border-0 bg-zinc-100/70 dark:bg-zinc-800/60 p-3.5 text-sm text-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)] focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 resize-none"
                            />
                        </div>

                        {/* 3. 研讨模式选择 */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-medium text-foreground tracking-tight">
                                研讨协作模式
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {ROOM_TYPES.map((type) => {
                                    const isSelected = roomType === type.id;
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setRoomType(type.id)}
                                            className={cn(
                                                "p-4 rounded-2xl border-0 text-left transition-all duration-200 cursor-pointer relative",
                                                "bg-zinc-100/50 dark:bg-zinc-800/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70",
                                                type.aura,
                                                isSelected
                                                    ? "bg-white dark:bg-zinc-800 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.15)] ring-1.5 ring-zinc-950 dark:ring-white"
                                                    : "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={cn("p-2 rounded-xl border-0", type.badgeColor)}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                {isSelected && (
                                                    <div className="h-5 w-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-sm">
                                                        <Check className="h-3 w-3 stroke-[2.5]" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground tracking-tight mb-1">
                                                {type.title}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                                                {type.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. 最大参与人数 */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-foreground tracking-tight flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>最大参与人数上限</span>
                                </label>
                                <span className="text-xs font-semibold text-foreground">
                                    {maxMembers} 人
                                </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {MEMBER_LIMIT_OPTIONS.map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setMaxMembers(num)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-medium border-0 transition-all cursor-pointer",
                                            maxMembers === num
                                                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.15)] font-semibold"
                                                : "bg-zinc-100/70 dark:bg-zinc-800/60 text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                        )}
                                    >
                                        {num} 人
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 5. 访问权限保护 */}
                        <div className="p-4 rounded-2xl border-0 bg-zinc-100/40 dark:bg-zinc-800/30 space-y-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-foreground">研讨室准入保护</p>
                                        <p className="text-[11px] text-muted-foreground font-normal">
                                            开启后，受邀同侪需凭访问口令方可加入
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEnablePassword(!enablePassword)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative cursor-pointer border-0",
                                        enablePassword ? "bg-zinc-950 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200",
                                            enablePassword ? "translate-x-5 bg-white dark:bg-zinc-950" : "bg-white"
                                        )}
                                    />
                                </button>
                            </div>

                            {enablePassword && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-2"
                                >
                                    <Input
                                        type="password"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        placeholder="输入研讨室访问密码或准入口令"
                                        className="h-10 rounded-full border-0 bg-white dark:bg-zinc-900 px-4 text-xs text-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] focus-visible:ring-2 focus-visible:ring-zinc-400/40"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* 消融内部光缝 */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                        {/* 提交行动栏 */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Link href="/lab">
                                <button
                                    type="button"
                                    className="px-5 py-2.5 rounded-full text-xs font-medium border-0 text-muted-foreground hover:text-foreground hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                                >
                                    取消
                                </button>
                            </Link>

                            <motion.button
                                type="submit"
                                disabled={isPending}
                                whileHover={{ scale: isPending ? 1 : 1.02 }}
                                whileTap={{ scale: isPending ? 1 : 0.98 }}
                                className={cn(
                                    "inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border-0 transition-all",
                                    "bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950",
                                    "shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer",
                                    isPending && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>正在创建并初始化空间...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        <span>立即开启学术研讨空间</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
