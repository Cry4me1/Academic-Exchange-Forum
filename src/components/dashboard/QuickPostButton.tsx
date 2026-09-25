"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context";

export function QuickPostButton() {
    const { t } = useI18n();

    return (
        <Link 
            href="/posts/new" 
            prefetch={false} 
            className="block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
        >
            <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative overflow-hidden isolate w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white backdrop-blur-xl shadow-[0_2px_6px_rgba(0,0,0,0.06),0_8px_24px_-4px_rgba(0,0,0,0.1),0_16px_36px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_3px_8px_rgba(0,0,0,0.08),0_12px_32px_-4px_rgba(0,0,0,0.13),0_24px_48px_-8px_rgba(0,0,0,0.07),inset_0_1px_1px_rgba(255,255,255,0.45)] dark:shadow-[0_2px_8px_rgba(255,255,255,0.04),0_8px_24px_-4px_rgba(255,255,255,0.08),0_16px_36px_-6px_rgba(255,255,255,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:hover:shadow-[0_3px_10px_rgba(255,255,255,0.06),0_12px_32px_-4px_rgba(255,255,255,0.12),0_20px_44px_-6px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,1)] transition-all duration-200 select-none cursor-pointer"
            >
                {/* 表面张力极细物理透光顶缝 */}
                <div className="pointer-events-none absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 dark:via-zinc-950/20 to-transparent" />

                <Plus className="h-4 w-4 relative z-10" strokeWidth={2} />
                <span className="relative z-10">{t.dashboardComponents.quickPost}</span>
            </motion.div>
        </Link>
    );
}

