"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Swords,
    Trophy,
    Clock,
    Eye,
    Plus,
    Zap,
    ArrowRight,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Sparkles,
} from "lucide-react";
import { ReputationBadgeCompact } from "@/components/duel/ReputationBadge";
import { CreateDuelDialog } from "@/components/duel/CreateDuelDialog";
import { formatDistanceToNow } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { acceptDuel, rejectDuel, cancelDuel, deleteDuel } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DEFAULT_DUEL_CONFIG, normalizeDuelConfig } from "@/lib/duel-config";

interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    reputation_score?: number;
}

interface Duel {
    id: string;
    topic: string;
    description?: string;
    status: string;
    challenger_score: number;
    opponent_score: number;
    current_round?: number;
    max_rounds?: number;
    ko_type?: string;
    created_at?: string;
    ended_at?: string;
    current_turn_user_id?: string;
    challenger_id: string;
    opponent_id?: string;
    challenger: Profile;
    opponent?: Profile;
    winner?: { id: string; username: string };
}

interface Invitation {
    id: string;
    created_at: string;
    duel: {
        id: string;
        topic: string;
        description?: string;
        challenger_position: string;
        max_rounds: number;
        challenger: Profile;
    };
}

interface DuelsPageClientProps {
    activeDuels: Duel[];
    recentCompletedDuels: Duel[];
    myDuels: Duel[];
    pendingInvitations: Invitation[];
    currentUser: Profile | null;
}

export default function DuelsPageClient({
    activeDuels,
    recentCompletedDuels,
    myDuels,
    pendingInvitations,
    currentUser,
}: DuelsPageClientProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creationFee, setCreationFee] = useState<number>(DEFAULT_DUEL_CONFIG.economy.creation_fee);
    const [autoRefund, setAutoRefund] = useState<boolean>(DEFAULT_DUEL_CONFIG.economy.auto_refund_on_pending_cancel);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const { data } = await supabase
                .from("system_settings")
                .select("value")
                .eq("key", "duel_config")
                .maybeSingle();
            const row = data as { value?: unknown } | null;
            if (!cancelled && row?.value) {
                const cfg = normalizeDuelConfig(row.value);
                setCreationFee(cfg.economy.creation_fee);
                setAutoRefund(cfg.economy.auto_refund_on_pending_cancel);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [supabase]);

    // 实时监听决斗更新
    useEffect(() => {
        const channel = supabase
            .channel("duels-page-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "duels" },
                () => {
                    router.refresh();
                }
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "duel_invitations" },
                () => {
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, supabase]);

    const handleAccept = async (duelId: string, invitationId: string) => {
        const result = await acceptDuel(duelId, invitationId);
        if (result.error) toast.error(result.error);
        else {
            toast.success("已接受决斗！");
            router.push(`/duels/${duelId}`);
            router.refresh();
        }
    };

    const handleReject = async (duelId: string, invitationId: string) => {
        if (!confirm("确定要婉拒这场决斗邀请吗？")) return;
        const result = await rejectDuel(duelId, invitationId);
        if (result.error) toast.error(result.error);
        else {
            toast.success(autoRefund ? "已婉拒决斗，挑战者预付积分已全额退还" : "已婉拒决斗");
            router.refresh();
        }
    };

    const handleCancel = async (duelId: string) => {
        if (!confirm("确定要取消这场等待应战的决斗吗？")) return;
        const result = await cancelDuel(duelId);
        if (result.error) toast.error(result.error);
        else {
            toast.success(autoRefund ? "决斗已取消，发起积分已全额退还" : "决斗已取消");
            router.refresh();
        }
    };

    const handleDelete = async (duelId: string) => {
        if (!confirm("确定要删除这条记录吗？")) return;
        const result = await deleteDuel(duelId);
        if (result.error) toast.error(result.error);
        else {
            toast.success("记录已删除");
            router.refresh();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };

    const renderDuelCard = (duel: Duel, showActions = false) => {
        const isMyTurn = currentUser && duel.current_turn_user_id === currentUser.id;

        return (
            <div
                key={duel.id}
                onMouseMove={handleMouseMove}
                className="group relative overflow-hidden rounded-3xl border-0 p-5 bg-white/75 hover:bg-white/85 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-all duration-300"
            >
                {/* 120fps 光随鼠动纯白微反射 */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:hidden"
                    style={{
                        background:
                            "radial-gradient(180px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.6), transparent 80%)",
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-0 hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:block"
                    style={{
                        background:
                            "radial-gradient(180px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1), transparent 80%)",
                    }}
                />

                <Link href={`/duels/${duel.id}`} className="block relative z-10">
                    {/* 状态和回合 */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {duel.status === "active" && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 进行中
                                </span>
                            )}
                            {duel.status === "pending" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                    等待应战
                                </span>
                            )}
                            {duel.status === "completed" && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-200/50 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                    {duel.ko_type ? "KO 终局" : "已决胜负"}
                                </span>
                            )}
                            {isMyTurn && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_12px_rgba(245,158,11,0.2)]">
                                    ⚡ 轮到你了
                                </span>
                            )}
                        </div>
                        {duel.current_round !== undefined && duel.max_rounds && (
                            <span className="text-xs text-muted-foreground font-mono">
                                回合 {duel.current_round}/{duel.max_rounds}
                            </span>
                        )}
                    </div>

                    {/* 辩题 */}
                    <h3 className="font-semibold text-base mb-5 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {duel.topic}
                    </h3>

                    {/* VS 对战展示 */}
                    <div className="flex items-center justify-between gap-4 py-2">
                        {/* 挑战者 */}
                        <div className="flex-1 text-center">
                            <Avatar className="h-12 w-12 mx-auto mb-2 ring-0 shadow-[0_4px_16px_-2px_rgba(59,130,246,0.3)]">
                                <AvatarImage src={duel.challenger?.avatar_url} />
                                <AvatarFallback className="bg-sky-500/15 text-sky-600 font-bold">
                                    {duel.challenger?.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium truncate text-foreground">
                                {duel.challenger?.username || "学者"}
                            </p>
                            {duel.challenger?.reputation_score !== undefined && (
                                <div className="mt-1 flex justify-center">
                                    <ReputationBadgeCompact score={duel.challenger.reputation_score} />
                                </div>
                            )}
                            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1 font-mono">
                                {duel.challenger_score}
                            </p>
                            {duel.status === "pending" && currentUser?.id === duel.challenger_id && showActions && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="mt-2 h-7 text-xs px-3"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleCancel(duel.id);
                                    }}
                                >
                                    取消决斗
                                </Button>
                            )}
                        </div>

                        {/* VS 勋标 */}
                        <div className="flex flex-col items-center px-2">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-zinc-200/50 dark:bg-white/[0.06] text-muted-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]">
                                <Swords className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-semibold mt-1">VS</span>
                        </div>

                        {/* 对手 */}
                        <div className="flex-1 text-center">
                            {duel.opponent ? (
                                <>
                                    <Avatar className="h-12 w-12 mx-auto mb-2 ring-0 shadow-[0_4px_16px_-2px_rgba(239,68,68,0.3)]">
                                        <AvatarImage src={duel.opponent?.avatar_url} />
                                        <AvatarFallback className="bg-rose-500/15 text-rose-600 font-bold">
                                            {duel.opponent?.username?.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-xs font-medium truncate text-foreground">
                                        {duel.opponent?.username || "学者"}
                                    </p>
                                    {duel.opponent?.reputation_score !== undefined && (
                                        <div className="mt-1 flex justify-center">
                                            <ReputationBadgeCompact score={duel.opponent.reputation_score} />
                                        </div>
                                    )}
                                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                                        {duel.opponent_score}
                                    </p>
                                </>
                            ) : (
                                <div className="opacity-60">
                                    <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-zinc-200/50 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] flex items-center justify-center">
                                        <span className="text-base text-muted-foreground font-mono">?</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">席位待定</p>
                                </div>
                            )}
                        </div>

                        {/* 删除历史按钮 */}
                        {(duel.status === "cancelled" || duel.status === "declined") &&
                            (currentUser?.id === duel.challenger_id || currentUser?.id === duel.opponent_id) &&
                            showActions && (
                                <div className="absolute top-3 right-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full text-muted-foreground hover:text-rose-600"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(duel.id);
                                        }}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                    </div>

                    {/* 消融内部光缝 */}
                    <div className="my-3 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="h-3 w-3" />
                            {duel.created_at && formatDistanceToNow(new Date(duel.created_at))}
                        </div>
                        <div className="flex items-center gap-1 font-medium group-hover:text-primary transition-colors text-xs">
                            <Eye className="h-3 w-3" />
                            观战席
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </Link>
            </div>
        );
    };

    const renderInvitationCard = (invitation: Invitation) => {
        if (!invitation.duel) return null;

        return (
            <div
                key={invitation.id}
                className="p-5 rounded-3xl border-0 bg-amber-500/[0.07] dark:bg-amber-500/[0.05] backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(245,158,11,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 shadow-sm">
                            <AvatarImage src={invitation.duel.challenger?.avatar_url} />
                            <AvatarFallback className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                                {invitation.duel.challenger?.username?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground">
                                {invitation.duel.challenger?.username || "学者"}
                                <span className="text-muted-foreground font-normal"> 诚邀你开展学术对决</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                论题：{invitation.duel.topic}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]">
                                    对方立场: {invitation.duel.challenger_position}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {invitation.duel.max_rounds} 轮交锋
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                            onClick={() => handleReject(invitation.duel.id, invitation.id)}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            婉拒
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-[0_4px_16px_-2px_rgba(16,185,129,0.3)]"
                            onClick={() => handleAccept(invitation.duel.id, invitation.id)}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            应战
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-16">
            {/* 顶栏 */}
            <div className="sticky top-0 z-40 px-4 pt-3 md:px-6 max-w-7xl mx-auto">
                <header className="flex h-16 items-center justify-between rounded-full border-0 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-2xl px-5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            返回控制台
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                            <Swords className="h-4 w-4" />
                        </div>
                        <h1 className="text-base sm:text-lg font-bold tracking-tight">学术竞技场 (Duels)</h1>
                    </div>

                    <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        发起对决
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold text-amber-300 tabular-nums">
                            <Zap className="h-3 w-3" />
                            {creationFee}
                        </span>
                    </Button>
                </header>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* 待处理邀请 */}
                {pendingInvitations.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <Zap className="h-4 w-4 text-amber-500" />
                            待处理的对决邀请
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600">
                                {pendingInvitations.length}
                            </span>
                        </h2>
                        <div className="space-y-3">
                            {pendingInvitations.map(renderInvitationCard)}
                        </div>
                    </motion.section>
                )}

                <Tabs defaultValue="active" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="active" className="gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            进行中 ({activeDuels.length})
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="gap-2">
                            我的对决 ({myDuels.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            历史战绩
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        {activeDuels.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeDuels.map((duel) => renderDuelCard(duel))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-3xl border-0 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Swords className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-foreground">当前暂无进行中的学术对决</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    发起一场严谨而热烈的观点交锋，邀请同行学者同台竞技
                                </p>
                                <Button className="mt-5" onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    发起第一场对决
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="mine">
                        {myDuels.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myDuels.map((duel) => renderDuelCard(duel, true))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-3xl border-0 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-foreground">你尚未参与任何学术对决</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    去“进行中”观战或直接向关注的学者发起论辩挑战！
                                </p>
                                <Button className="mt-5" onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    发起对决
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        {recentCompletedDuels.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentCompletedDuels.map((duel) => renderDuelCard(duel))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-3xl border-0 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-foreground">暂无历史完结记录</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>

            {/* 创建对决弹窗 */}
            <CreateDuelDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                currentUser={currentUser}
            />
        </div>
    );
}
