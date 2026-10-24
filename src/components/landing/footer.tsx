"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { DIVIDER_H, DIVIDER_V, GLASS, SERIF_STACK, trackPointer } from "./liquid-glass";

export function Footer() {
    const { t, isZh } = useI18n();

    return (
        <footer className="relative overflow-hidden bg-[#fafafc] pb-14 pt-8 dark:bg-[#07090e] transition-colors duration-700">
            {/* 底部温润微光衬底 */}
            <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 h-[320px] w-[760px] -translate-x-1/2 rounded-full bg-amber-400/[0.06] blur-[140px] dark:bg-amber-400/[0.04]"
            />

            <div className="relative z-10 mx-auto max-w-7xl px-6">
                {/* 悬浮大曲率液态玻璃面板 */}
                <div
                    onMouseMove={trackPointer}
                    className={cn(GLASS, "group relative overflow-hidden rounded-3xl px-7 py-10 sm:px-10 sm:py-12")}
                >
                    {/* 120fps 鼠标跟随无色纯白物理漫射 */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:group-hover:opacity-25"
                        style={{
                            background:
                                "radial-gradient(480px circle at var(--mouse-x, 50%) var(--mouse-y, 0%), rgba(255,255,255,0.65), transparent 45%)",
                        }}
                    />

                    <div className="relative z-10 grid grid-cols-1 gap-10 md:grid-cols-12">
                        {/* 品牌与学术理念 */}
                        <div className="md:col-span-6 space-y-4">
                            <Link href="/" className="inline-flex items-center gap-3 rounded-full pr-3">
                                <Image
                                    src="/logo.png"
                                    alt="Scholarly Logo"
                                    width={32}
                                    height={32}
                                    className="rounded-full bg-white dark:bg-zinc-950 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]"
                                />
                                <span
                                    style={{ fontFamily: SERIF_STACK }}
                                    className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                                >
                                    Scholarly
                                </span>
                            </Link>

                            <p className="max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 text-pretty">
                                {t.landing.footerDesc}
                            </p>

                            <p
                                style={{ fontFamily: SERIF_STACK }}
                                className="text-xs italic tracking-wide text-zinc-400 dark:text-zinc-500"
                            >
                                {isZh ? "求真 · 致知 · 自由探索" : "Scientia · Veritas · Libertas"}
                            </p>
                        </div>

                        {/* 快速链接 */}
                        <div className="md:col-span-3">
                            <h4 className="mb-4 text-xs font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                                {t.landing.quickLinks}
                            </h4>
                            <ul className="space-y-2.5 text-sm font-medium">
                                <li>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center rounded-full py-0.5 text-zinc-600 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-300 transition-colors"
                                    >
                                        {t.landing.login}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center rounded-full py-0.5 text-zinc-600 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-300 transition-colors"
                                    >
                                        {t.landing.register}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/updates"
                                        className="inline-flex items-center rounded-full py-0.5 text-zinc-600 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-300 transition-colors"
                                    >
                                        {t.landing.aboutUs}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* 联系方式 */}
                        <div className="md:col-span-3">
                            <h4 className="mb-4 text-xs font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                                {t.landing.contact}
                            </h4>
                            <ul className="space-y-2.5 text-sm font-medium">
                                <li>
                                    <a
                                        href="mailto:ddanthumytrang@gmail.com"
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 -ml-3 text-xs font-medium text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
                                    >
                                        <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
                                        <span className="truncate">ddanthumytrang@gmail.com</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/Cry4me1/Academic-Exchange-Forum"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 -ml-3 text-xs font-medium text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
                                    >
                                        <span>GitHub</span>
                                        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 渐变消融内部光缝 */}
                    <div className={cn(DIVIDER_H, "relative z-10 my-8")} />

                    {/* 版权与协议 */}
                    <div className="relative z-10 flex flex-col items-center justify-between gap-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 sm:flex-row">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span>
                                © {new Date().getFullYear()} Scholarly · {t.landing.copyright}
                            </span>
                            <span aria-hidden className={cn(DIVIDER_V, "hidden sm:inline-block")} />
                            <span>{isZh ? "由 邵卓翰 匠心构建" : "Crafted by Zhuohan Shao"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/rules?tab=terms"
                                className="rounded-full px-3 py-1 text-zinc-500 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 transition-colors"
                            >
                                {t.landing.terms}
                            </Link>
                            <Link
                                href="/rules?tab=guidelines"
                                className="rounded-full px-3 py-1 text-zinc-500 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 transition-colors"
                            >
                                {t.landing.guidelines}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
