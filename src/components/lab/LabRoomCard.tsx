import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Award, BookOpen, Clock, FileText, Lock, Pencil, Users } from "lucide-react";
import Link from "next/link";

interface LabRoomCardProps {
    room: {
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
    };
}

const roomTypeConfig: Record<string, { label: string; icon: typeof BookOpen; auraColor: string; iconBg: string }> = {
    reading: {
        label: "文献共读",
        icon: BookOpen,
        auraColor: "group-hover:shadow-[0_12px_40px_-6px_rgba(14,165,233,0.18)]",
        iconBg: "bg-sky-500/10 text-sky-500",
    },
    whiteboard: {
        label: "白板推导",
        icon: Pencil,
        auraColor: "group-hover:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.08)]",
        iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200",
    },
    hybrid: {
        label: "全能研讨",
        icon: FileText,
        auraColor: "group-hover:shadow-[0_12px_40px_-6px_rgba(16,185,129,0.18)]",
        iconBg: "bg-emerald-500/10 text-emerald-500",
    },
};

function formatRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 30) return `${diffDay}天前`;
    return date.toLocaleDateString("zh-CN");
}

export function LabRoomCard({ room }: LabRoomCardProps) {
    const config = roomTypeConfig[room.room_type] || roomTypeConfig.hybrid;
    const TypeIcon = config.icon;
    const memberCount = room.lab_members?.[0]?.count || 0;
    const postCount = room.lab_post_links?.[0]?.count || 0;
    const outputCount = room.output_count || 0;
    const isEncrypted = Boolean(room.is_encrypted || room.access_code_hash);

    return (
        <Link href={`/lab/${room.id}`} className="block focus:outline-none">
            <div
                className={cn(
                    "group relative overflow-hidden rounded-2xl border-0 transition-all duration-300",
                    "bg-white/75 dark:bg-zinc-900/65 backdrop-blur-xl",
                    "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)]",
                    "dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]",
                    "hover:-translate-y-1 hover:bg-white/85 dark:hover:bg-zinc-900/80",
                    config.auraColor,
                    room.is_archived && "opacity-60"
                )}
            >
                {/* 顶部微光缝菲涅尔反光层 */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

                <div className="p-5 flex flex-col justify-between h-full space-y-4">
                    {/* 卡片头部 */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn("p-2 rounded-xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]", config.iconBg)}>
                                    <TypeIcon className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-base text-foreground truncate tracking-tight">
                                    {room.name}
                                </h3>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {outputCount > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                                    >
                                        <Award className="h-3 w-3 text-foreground" />
                                        {outputCount} 成果
                                    </Badge>
                                )}
                                {isEncrypted && (
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2.5 py-0.5 font-medium flex items-center gap-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                                    >
                                        <Lock className="h-3 w-3 text-zinc-500" />
                                        加密
                                    </Badge>
                                )}
                                <Badge
                                    variant="secondary"
                                    className="rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-800/80 text-foreground text-xs px-2.5 py-0.5 font-medium shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                                >
                                    {config.label}
                                </Badge>
                            </div>
                        </div>

                        {room.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                                {room.description}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground/60 italic font-normal">
                                暂无研究室备忘描述
                            </p>
                        )}
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 卡片底部统计信息 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "flex items-center gap-1",
                                outputCount > 0 && "text-foreground font-semibold"
                            )}>
                                <Award className="h-3.5 w-3.5 text-zinc-500" />
                                {outputCount} 成果
                            </span>
                            <span className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                                {postCount} 文献
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-zinc-400" />
                                {memberCount}/{room.max_members}
                            </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(room.updated_at)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
