"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FlaskConical, Users } from "lucide-react";
import Link from "next/link";

export interface CoAuthor {
    id: string;
    role: "co_author" | "contributor" | "annotator";
    contribution_summary?: string;
    lab_room_id?: string;
    user: {
        id: string;
        username?: string;
        avatar_url?: string;
    };
}

interface CoAuthorPanelProps {
    coAuthors: CoAuthor[];
    labRoomName?: string;
    labRoomId?: string;
    className?: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
    co_author: { label: "共创作者", color: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]" },
    contributor: { label: "贡献者", color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]" },
    annotator: { label: "批注者", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]" },
};

export function CoAuthorPanel({ coAuthors, labRoomName, labRoomId, className }: CoAuthorPanelProps) {
    if (!coAuthors || coAuthors.length === 0) return null;

    return (
        <div className={cn(
            "rounded-2xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.1)] p-4 sm:p-5",
            className
        )}>
            <div className="flex items-center gap-2 mb-3.5">
                <Users className="h-4 w-4 text-foreground" />
                <span className="text-sm font-semibold text-foreground tracking-tight">共创团队</span>
                {labRoomName && labRoomId && (
                    <Link href={`/lab/${labRoomId}`} className="ml-auto">
                        <Badge variant="secondary" className="rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-800/80 text-xs gap-1 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] transition-all cursor-pointer">
                            <FlaskConical className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                            {labRoomName}
                        </Badge>
                    </Link>
                )}
            </div>

            <div className="space-y-2.5">
                {coAuthors.map((ca) => {
                    const config = roleConfig[ca.role] || roleConfig.co_author;
                    const caUser = ca.user || { id: ca.id, username: "学者", avatar_url: undefined };
                    const userLink = `/user/${caUser.id || caUser.username}`;
                    return (
                        <div key={ca.id} className="flex items-center gap-3">
                            <Link href={userLink}>
                                <Avatar className="h-8 w-8 ring-1 ring-zinc-200 dark:ring-zinc-700 hover:ring-zinc-400 transition-all border-0">
                                    <AvatarImage src={caUser.avatar_url} />
                                    <AvatarFallback className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                        {(caUser.username || "?").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link href={userLink}>
                                        <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                                            {caUser.username || "学者"}
                                        </span>
                                    </Link>
                                    <Badge variant="secondary" className={cn("text-[10px] px-2 py-0.5 rounded-full border-0 font-medium", config.color)}>
                                        {config.label}
                                    </Badge>
                                </div>
                                {ca.contribution_summary && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {ca.contribution_summary}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
