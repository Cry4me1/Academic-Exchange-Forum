"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useI18n } from "@/i18n/context";

export function QuickPostButton() {
    const { t } = useI18n();

    return (
        <Link href="/posts/new" className="block">
            <Button
                className="w-full gap-2 h-10 text-sm font-medium rounded-lg bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs hover:shadow-sm active:scale-[0.99] transition-all duration-150 border border-zinc-800 dark:border-zinc-200"
            >
                <Plus className="h-4 w-4" strokeWidth={2} />
                {t.dashboardComponents.quickPost}
            </Button>
        </Link>
    );
}
