"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

export function QuickPostButton() {
    const { t } = useI18n();

    return (
        <Link href="/posts/new" className="block">
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-colors duration-200 select-none cursor-pointer"
            >
                <Plus className="h-4 w-4" strokeWidth={2} />
                <span>{t.dashboardComponents.quickPost}</span>
            </motion.div>
        </Link>
    );
}

