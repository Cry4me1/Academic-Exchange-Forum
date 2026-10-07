"use client";

import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface CoAuthorBadgeProps {
    count: number;
    className?: string;
}

export function CoAuthorBadge({ count, className }: CoAuthorBadgeProps) {
    if (count <= 0) return null;

    return (
        <Badge
            variant="secondary"
            className={`gap-1 rounded-full border-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] ${className || ""}`}
        >
            <Users className="h-3 w-3" />
            <span>{count}人共创</span>
        </Badge>
    );
}
