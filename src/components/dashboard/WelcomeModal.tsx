"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    AtSign,
    BookOpen,
    Bot,
    Box,
    Calculator,
    Code,
    FlaskConical,
    Globe,
    GraduationCap,
    Image as ImageIcon,
    LayoutDashboard,
    Lock,
    MessageSquareCode,
    Printer,
    Rocket,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// 正式版发布日期（UTC）- 升级至 v1.1.9 节点以达成 seen 状态重置
const V1_LAUNCH_DATE = "2026-10-07T00:00:00Z";

// 老用户弹窗：v1.1.9 六大核心更新
const v1_1_9Features = [
    { icon: FlaskConical, label: "学术共创实验室 & Yjs 实时推演", color: "text-purple-500" },
    { icon: Box, label: "3D 立体几何模型 360° 交互画布", color: "text-blue-500" },
    { icon: MessageSquareCode, label: "正文划线学术批注与边注研讨", color: "text-amber-500" },
    { icon: BookOpen, label: "文献同读视口同频与分屏工作台", color: "text-emerald-500" },
    { icon: ShieldCheck, label: "AI 审稿快照回溯与合规申诉隔离", color: "text-cyan-500" },
    { icon: Sparkles, label: "零水合报错与 Liquid Glass 质感", color: "text-pink-500" },
];

interface WelcomeModalProps {
    userCreatedAt: string | null;
}

export function WelcomeModal({ userCreatedAt }: WelcomeModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!userCreatedAt) return;

        const createdAt = new Date(userCreatedAt);
        const launchDate = new Date(V1_LAUNCH_DATE);
        const newUser = createdAt >= launchDate;

        const storageKey = newUser
            ? "scholarly_welcome_v1_1_9_seen"
            : "scholarly_v1_1_9_update_seen";

        if (localStorage.getItem(storageKey)) return;

        // 短延迟让 Dashboard 先渲染完
        const timer = setTimeout(() => {
            setIsNewUser(newUser);
            setIsOpen(true);
            localStorage.setItem(storageKey, "true");
        }, 800);

        return () => clearTimeout(timer);
    }, [userCreatedAt]);

    const handleAction = () => {
        setIsOpen(false);
        if (isNewUser) {
            // 新用户点击“开始探索”直接关闭弹窗，留在仪表盘开始探索
            setIsOpen(false);
        } else {
            router.push("/updates");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                showCloseButton={false}
                aria-describedby={undefined}
                className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none outline-none ring-0"
            >
                <DialogTitle className="sr-only">
                    {isNewUser ? "欢迎加入 Scholarly" : "v1.1.9 学术共创实验室与三维空间几何已上线"}
                </DialogTitle>

                <AnimatePresence mode="wait">
                    {isNewUser ? (
                        /* ═══════════════════════════════════════
                         *  新用户 — 欢迎弹窗
                         * ═══════════════════════════════════════ */
                        <motion.div
                            key="new-user"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_16px_48px_-8px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_16px_48px_-8px_rgba(0,0,0,0.6)] overflow-hidden"
                        >
                            {/* Top accent gradient bar */}
                            <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                            {/* Hero area */}
                            <div className="relative px-8 pt-10 pb-6 text-center">
                                {/* Soft glow behind icon */}
                                <div className="absolute inset-x-0 top-6 mx-auto h-20 w-20 rounded-full bg-primary/10 blur-2xl" />

                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", damping: 12 }}
                                    className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/25"
                                >
                                    <Sparkles className="h-8 w-8 text-white" />
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold tracking-tight text-foreground"
                                >
                                    欢迎加入 Scholarly
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto"
                                >
                                    一个为学术交流而生的社区。
                                    <br />
                                    在这里，知识因分享而永恒，思想因碰撞而闪光。
                                </motion.p>
                            </div>

                            {/* CTA */}
                            <div className="px-8 pb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Button
                                        onClick={handleAction}
                                        className="w-full h-11 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/20 rounded-full font-medium group cursor-pointer border-0"
                                    >
                                        开始探索仪表盘
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                    <div className="mt-3 flex items-center justify-center gap-2.5 text-[11px] text-muted-foreground/70">
                                        <Link
                                            href="/rules?tab=terms"
                                            onClick={() => setIsOpen(false)}
                                            className="hover:text-primary hover:underline transition-colors"
                                        >
                                            用户协议
                                        </Link>
                                        <span>•</span>
                                        <Link
                                            href="/rules?tab=guidelines"
                                            onClick={() => setIsOpen(false)}
                                            className="hover:text-primary hover:underline transition-colors"
                                        >
                                            社区公约
                                        </Link>
                                        <span>•</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            关闭
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        /* ═══════════════════════════════════════
                         *  老用户 — v1.1.8 正式版上线通知
                         * ═══════════════════════════════════════ */
                        <motion.div
                            key="existing-user"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_16px_48px_-8px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_16px_48px_-8px_rgba(0,0,0,0.6)] overflow-hidden"
                        >
                            {/* Top accent gradient bar */}
                            <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                            {/* Hero area */}
                            <div className="relative px-8 pt-10 pb-4 text-center">
                                <div className="absolute inset-x-0 top-6 mx-auto h-20 w-20 rounded-full bg-violet-500/10 blur-2xl" />

                                <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", damping: 12 }}
                                    className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-primary shadow-lg shadow-violet-500/25"
                                >
                                    <Rocket className="h-8 w-8 text-white" />
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold tracking-tight text-foreground"
                                >
                                    v1.1.9 学术共创实验室已上线
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-2 text-sm text-muted-foreground"
                                >
                                    共创实验室 · 3D 立体几何 · 行间划线批注 · 文献同读推演
                                </motion.p>
                            </div>

                            {/* Feature list */}
                            <div className="px-8 pb-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    className="grid grid-cols-2 gap-2.5"
                                >
                                    {v1_1_9Features.map((feature, i) => (
                                        <motion.div
                                            key={feature.label}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 + i * 0.08 }}
                                            className="flex items-center gap-2.5 rounded-xl bg-white/50 dark:bg-zinc-800/40 px-3.5 py-3 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                                        >
                                            <feature.icon className={`h-4 w-4 ${feature.color} shrink-0`} />
                                            <span className="text-xs font-medium text-foreground leading-tight">
                                                {feature.label}
                                            </span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* CTA */}
                            <div className="px-8 pb-8 pt-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <Button
                                        onClick={handleAction}
                                        className="w-full h-11 bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90 text-white shadow-lg shadow-violet-500/20 rounded-full font-medium group cursor-pointer border-0"
                                    >
                                        查看更新详情
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </Button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full mt-3 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
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
