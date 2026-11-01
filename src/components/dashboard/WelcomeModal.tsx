"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Database,
    Layers,
    Rocket,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// 正式版发布日期（UTC）- 升级至 v2.0.0 里程碑节点以达成 seen 状态重置
const V2_LAUNCH_DATE = "2026-10-25T00:00:00Z";

// 老用户弹窗：v2.0.0 六大核心更新支柱
const v2_0_0Features = [
    { icon: Sparkles, label: "Hero 流体美学与 120fps 光晕动效", color: "text-indigo-500" },
    { icon: BarChart3, label: "个人主页热力图与六维领域雷达", color: "text-emerald-500" },
    { icon: Layers, label: "Apple Liquid Glass 无边框系统", color: "text-sky-500" },
    { icon: BookOpen, label: "专栏详情页宽屏精致 Banner 范式", color: "text-amber-500" },
    { icon: Database, label: "数据库全量架构同步与学者阶梯", color: "text-purple-500" },
    { icon: ShieldCheck, label: "企业级生产安全防护与数据脱敏", color: "text-teal-500" },
];

interface WelcomeModalProps {
    userCreatedAt: string | null;
}

export function WelcomeModal({ userCreatedAt }: WelcomeModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const router = useRouter();

    const [storageKey, setStorageKey] = useState<string | null>(null);

    useEffect(() => {
        if (!userCreatedAt) return;

        const createdAt = new Date(userCreatedAt);
        const launchDate = new Date(V2_LAUNCH_DATE);
        const newUser = createdAt >= launchDate;

        const key = newUser
            ? "scholarly_welcome_v2_0_0_release_seen"
            : "scholarly_v2_0_0_release_seen";

        if (localStorage.getItem(key)) return;

        // 短延迟让 Dashboard 先渲染完
        const timer = setTimeout(() => {
            setIsNewUser(newUser);
            setStorageKey(key);
            setIsOpen(true);
        }, 800);

        return () => clearTimeout(timer);
    }, [userCreatedAt]);

    const dismissModal = () => {
        if (storageKey) {
            localStorage.setItem(storageKey, "true");
        }
        setIsOpen(false);
    };

    const handleAction = () => {
        dismissModal();
        if (!isNewUser) {
            router.push("/updates");
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    dismissModal();
                } else {
                    setIsOpen(true);
                }
            }}
        >
            <DialogContent
                showCloseButton={false}
                aria-describedby={undefined}
                className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none outline-none ring-0"
            >
                <DialogTitle className="sr-only">
                    {isNewUser ? "欢迎加入 Scholarly" : "v2.0.0 创世里程碑正式版已上线"}
                </DialogTitle>

                <AnimatePresence mode="wait">
                    {isNewUser ? (
                        /* ═══════════════════════════════════════
                         *  新用户 — 欢迎弹窗（Apple Liquid Glass）
                         * ═══════════════════════════════════════ */
                        <motion.div
                            key="new-user"
                            initial={{ scale: 0.94, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            className="relative rounded-3xl bg-white/80 dark:bg-zinc-900/75 backdrop-blur-2xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_20px_56px_-8px_rgba(0,0,0,0.16)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_20px_56px_-8px_rgba(0,0,0,0.65)] overflow-hidden"
                        >
                            {/* 顶部纯物理无色微高光环境漫射 */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-sky-500/[0.12] dark:bg-sky-400/[0.08] blur-3xl"
                            />

                            {/* Hero area */}
                            <div className="relative px-8 pt-10 pb-6 text-center">
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.15, type: "spring", damping: 14 }}
                                    className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/12 dark:bg-sky-400/15 border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_-4px_rgba(14,165,233,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_8px_24px_-4px_rgba(14,165,233,0.25)]"
                                >
                                    <Sparkles className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-2xl font-bold tracking-tight text-foreground"
                                >
                                    欢迎加入 Scholarly
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto"
                                >
                                    一个为学术交流而生的理性社区。
                                    <br />
                                    在这里，知识因分享而永恒，思想因碰撞而闪光。
                                </motion.p>
                            </div>

                            {/* 渐变消融内部微光缝 */}
                            <div className="mx-auto w-4/5 h-[1px] bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                            {/* Primary CTA（黑曜石液态玻璃 / 白月光晶体） */}
                            <div className="px-8 pt-6 pb-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                    className="flex flex-col items-center"
                                >
                                    <motion.div whileTap={{ scale: 0.97 }} className="w-full">
                                        <Button
                                            onClick={handleAction}
                                            className="w-full h-11 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,1)] font-medium group cursor-pointer transition-all"
                                        >
                                            <span className="relative inline-flex items-center">
                                                <span>开始探索仪表盘</span>
                                                <ArrowRight className="absolute left-full ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
                                        </Button>
                                    </motion.div>
                                    <div className="mt-3 flex items-center justify-center gap-2.5 text-[11px] text-muted-foreground/70 font-medium">
                                        <Link
                                            href="/rules?tab=terms"
                                            onClick={dismissModal}
                                            className="rounded-full px-1.5 py-0.5 hover:text-foreground transition-colors"
                                        >
                                            用户协议
                                        </Link>
                                        <span className="opacity-40">·</span>
                                        <Link
                                            href="/rules?tab=guidelines"
                                            onClick={dismissModal}
                                            className="rounded-full px-1.5 py-0.5 hover:text-foreground transition-colors"
                                        >
                                            社区公约
                                        </Link>
                                        <span className="opacity-40">·</span>
                                        <button
                                            type="button"
                                            onClick={dismissModal}
                                            className="rounded-full px-1.5 py-0.5 hover:text-foreground transition-colors cursor-pointer font-medium"
                                        >
                                            关闭
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        /* ═══════════════════════════════════════
                         *  老用户 — v2.0.0 创世里程碑正式版通知
                         * ═══════════════════════════════════════ */
                        <motion.div
                            key="existing-user"
                            initial={{ scale: 0.94, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            transition={{ type: "spring", damping: 26, stiffness: 320 }}
                            className="relative rounded-3xl bg-white/80 dark:bg-zinc-900/75 backdrop-blur-2xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_20px_56px_-8px_rgba(0,0,0,0.16)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_20px_56px_-8px_rgba(0,0,0,0.65)] overflow-hidden"
                        >
                            {/* 顶部纯物理天青微光晕（Ambient Aura Glow） */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-sky-500/[0.14] dark:bg-sky-400/[0.09] blur-3xl"
                            />

                            {/* Hero area */}
                            <div className="relative px-7 pt-9 pb-4 text-center">
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.15, type: "spring", damping: 14 }}
                                    className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/12 dark:bg-sky-400/15 border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_-4px_rgba(14,165,233,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_8px_24px_-4px_rgba(14,165,233,0.25)]"
                                >
                                    <Rocket className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                </motion.div>

                                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                                    <Sparkles className="h-3 w-3 text-sky-500" />
                                    <span>创世里程碑大版本</span>
                                </div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
                                >
                                    Scholarly v2.0.0 正式发布
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.32 }}
                                    className="mt-1.5 text-xs sm:text-sm text-muted-foreground"
                                >
                                    Liquid Glass 无边框设计 · 数据可视化看板 · 架构全量同步
                                </motion.p>
                            </div>

                            {/* Feature list */}
                            <div className="px-7 pb-5">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.38 }}
                                    className="grid grid-cols-2 gap-2.5"
                                >
                                    {v2_0_0Features.map((feature, i) => (
                                        <motion.div
                                            key={feature.label}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.42 + i * 0.06 }}
                                            className="flex items-center gap-2.5 rounded-2xl bg-zinc-500/[0.05] dark:bg-white/[0.04] px-3.5 py-2.5 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                                        >
                                            <feature.icon className={`h-4 w-4 ${feature.color} shrink-0`} />
                                            <span className="text-xs font-medium text-foreground/90 leading-snug">
                                                {feature.label}
                                            </span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* 渐变消融内部微光缝 */}
                            <div className="mx-auto w-4/5 h-[1px] bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                            {/* Primary CTA（黑曜石液态玻璃 / 白月光晶体） */}
                            <div className="px-7 pt-5 pb-5">
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.65 }}
                                    className="flex flex-col items-center"
                                >
                                    <motion.div whileTap={{ scale: 0.97 }} className="w-full">
                                        <Button
                                            onClick={handleAction}
                                            className="w-full h-11 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,1)] font-medium group cursor-pointer transition-all"
                                        >
                                            <span className="relative inline-flex items-center">
                                                <span>查看 v2.0.0 更新详情</span>
                                                <ArrowRight className="absolute left-full ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
                                        </Button>
                                    </motion.div>
                                    <button
                                        type="button"
                                        onClick={dismissModal}
                                        className="mt-2.5 inline-flex h-8 items-center justify-center rounded-full px-5 text-center text-xs font-medium leading-none text-muted-foreground/70 hover:bg-zinc-500/[0.06] dark:hover:bg-white/[0.06] hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        我知道了
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
