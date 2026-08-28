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
                className="w-full h-9 pl-9 pr-12 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:bg-background focus:border-zinc-300 dark:focus:border-zinc-700 focus:ring-2 focus:ring-zinc-200/60 dark:focus:ring-zinc-800 transition-all duration-200 font-sans shadow-xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5">
                <kbd className="inline-flex h-5 items-center justify-center rounded border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {t.search.shortcut}
                </kbd>
            </div>
        </form>
    );
}
