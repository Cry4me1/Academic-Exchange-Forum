"use client";

import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useI18n } from "@/i18n/context";

export function Footer() {
    const { t } = useI18n();

    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 transition-colors duration-500">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo & 描述 */}
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent transition-colors">
                                Scholarly
                            </span>
                        </Link>
                        <p className="mt-4 text-slate-600 dark:text-white/50 leading-relaxed max-w-sm transition-colors">
                            {t.landing.footerDesc}
                        </p>
                    </div>

                    {/* 快速链接 */}
                    <div>
                        <h4 className="text-slate-900 dark:text-white font-semibold mb-4 transition-colors">
                            {t.landing.quickLinks}
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/login" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    {t.landing.login}
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    {t.landing.register}
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    {t.landing.aboutUs}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 联系方式 */}
                    <div>
                        <h4 className="text-slate-900 dark:text-white font-semibold mb-4 transition-colors">
                            {t.landing.contact}
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="mailto:ddanthumytrang@gmail.com" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    ddanthumytrang@gmail.com
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com/Cry4me1/Academic-Exchange-Forum" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-8 bg-slate-200 dark:bg-white/10 transition-colors" />

                {/* 版权信息 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-slate-500 dark:text-white/40 text-sm transition-colors">
                        <span>© {new Date().getFullYear()} Scholarly. {t.landing.copyright}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>Made with ❤️ by 邵卓翰</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <Link href="/rules?tab=terms" className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/70 transition-colors">
                            {t.landing.terms}
                        </Link>
                        <Link href="/rules?tab=guidelines" className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/70 transition-colors">
                            {t.landing.guidelines}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
