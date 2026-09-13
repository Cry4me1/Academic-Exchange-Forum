"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/context";

export function GlobalSearch({ className = "" }: { className?: string }) {
    const { t } = useI18n();
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`relative group ${className}`}>
            <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-300 pointer-events-none" 
                strokeWidth={1.75}
            />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search.placeholder}
                className="w-full h-9 pl-9 pr-12 rounded-full border-0 bg-zinc-100/80 dark:bg-zinc-800/60 backdrop-blur-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_2px_8px_-2px_rgba(0,0,0,0.3)] focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:shadow-[inset_0_1px_0.5px_rgba(255,255,255,1),0_4px_20px_-2px_rgba(0,0,0,0.08)] dark:focus:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_4px_20px_-2px_rgba(0,0,0,0.4)] transition-all duration-200 font-sans font-medium"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5">
                <kbd className="inline-flex h-5 items-center justify-center rounded-full border-0 bg-white/80 dark:bg-zinc-700/70 px-2 font-mono text-[10px] font-medium text-zinc-400 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                    {t.search.shortcut}
                </kbd>
            </div>
        </form>
    );
}
