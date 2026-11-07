"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Loader2, Search, ShieldCheck, Swords, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_DUEL_CONFIG, normalizeDuelConfig } from "@/lib/duel-config";

interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    reputation_score?: number;
}

interface CreateDuelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUser: Profile | null;
    defaultTopic?: string;
    postId?: string;
}

const ROUND_LABELS: Record<number, string> = {
    3: "3 回合（快速交锋）",
    5: "5 回合（标准论辩）",
    7: "7 回合（深度推演）",
    9: "9 回合（大师长局）",
};

export function CreateDuelDialog({
    open,
    onOpenChange,
    currentUser,
    defaultTopic = "",
    postId,
}: CreateDuelDialogProps) {
    const router = useRouter();
    const [topic, setTopic] = useState(defaultTopic);
    const [description, setDescription] = useState("");
    const [position, setPosition] = useState("正方");
    const [maxRounds, setMaxRounds] = useState("5");
    const [creationFee, setCreationFee] = useState<number>(
        DEFAULT_DUEL_CONFIG.economy.creation_fee
    );
    const [allowedRounds, setAllowedRounds] = useState<number[]>(
        DEFAULT_DUEL_CONFIG.economy.allowed_rounds
    );
    const [autoRefund, setAutoRefund] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [selectedOpponent, setSelectedOpponent] = useState<Profile | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        (async () => {
            const [balanceRes, configRes] = await Promise.all([
                currentUser?.id
                    ? supabase
                          .from("user_credits")
                          .select("balance")
                          .eq("user_id", currentUser.id)
                          .maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
                supabase
                    .from("system_settings")
                    .select("value")
                    .eq("key", "duel_config")
                    .maybeSingle(),
            ]);

            if (cancelled) return;

            if (currentUser?.id) {
                setCreditBalance(balanceRes.data?.balance ?? 0);
            }
            if (configRes.data?.value) {
                const cfg = normalizeDuelConfig(configRes.data.value);
                setCreationFee(cfg.economy.creation_fee);
                setAllowedRounds(cfg.economy.allowed_rounds);
                setAutoRefund(cfg.economy.auto_refund_on_pending_cancel);
                if (!cfg.economy.allowed_rounds.includes(Number(maxRounds))) {
                    setMaxRounds(String(cfg.economy.allowed_rounds[0] ?? 5));
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, currentUser?.id, supabase, maxRounds]);

    const insufficientCredits =
        creditBalance !== null && creditBalance < creationFee;

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const { data } = await supabase.rpc("search_users", {
                search_term: searchTerm,
            });

            const filtered = ((data || []) as Profile[]).filter(
                (user) => user.id !== currentUser?.id
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error("Search error:", error);
            toast.error("搜索失败");
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreate = async () => {
        if (!currentUser) {
            toast.error("请先登录");
            return;
        }
        if (!topic.trim()) {
            toast.error("请输入辩题");
            return;
        }
        if (!selectedOpponent) {
            toast.error("请选择对手");
            return;
        }

        setIsCreating(true);
        try {
            const { data, error: rpcError } = await supabase.rpc(
                "create_duel_with_fee",
                {
                    p_topic: topic.trim(),
                    p_description: description.trim() || null,
                    p_position: position,
                    p_max_rounds: parseInt(maxRounds, 10),
                    p_opponent_id: selectedOpponent.id,
                    p_post_id: postId || null,
                    p_fee: creationFee,
                }
            );

            if (rpcError) throw rpcError;

            const result = data as {
                success: boolean;
                duel_id?: string;
                fee?: number;
                error?: string;
            };

            if (!result.success) {
                const errorMessages: Record<string, string> = {
                    INVALID_TOPIC: "请输入辩题",
                    INVALID_OPPONENT: "请选择对手",
                    INVALID_MAX_ROUNDS: "所选回合数当前未开放",
                    INVALID_POSITION: "立场无效",
                    OPPONENT_NOT_FOUND: "对手不存在",
                    INSUFFICIENT_CREDITS: "积分不足，无法发起决斗",
                };
                throw new Error(
                    errorMessages[result.error ?? ""] ?? "发起决斗失败"
                );
            }

            toast.success("决斗邀请已发送！");
            onOpenChange(false);
            router.refresh();

            setTopic(defaultTopic);
            setDescription("");
            setPosition("正方");
            setSearchTerm("");
            setSearchResults([]);
            setSelectedOpponent(null);
        } catch (error: unknown) {
            console.error("Create duel error:", error);
            const msg =
                error instanceof Error ? error.message : "创建决斗失败";
            toast.error(msg);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-3xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.14)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        发起学术决斗
                    </DialogTitle>
                    <DialogDescription>
                        选择一个争议性学术话题，邀请对手进行一场公开的学术辩论！
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="topic">辩题 *</Label>
                        <Input
                            id="topic"
                            className="rounded-full border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                            placeholder="例如：Transformer 架构是否已达瓶颈？"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">补充说明（可选）</Label>
                        <Textarea
                            id="description"
                            className="rounded-2xl border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                            placeholder="对辩题的进一步解释或限定条件..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>你的立场</Label>
                            <Select value={position} onValueChange={setPosition}>
                                <SelectTrigger className="rounded-full border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                                    <SelectItem value="正方">正方（支持）</SelectItem>
                                    <SelectItem value="反方">反方（反对）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>回合数</Label>
                            <Select value={maxRounds} onValueChange={setMaxRounds}>
                                <SelectTrigger className="rounded-full border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                                    {allowedRounds.map((r) => (
                                        <SelectItem key={r} value={String(r)}>
                                            {ROUND_LABELS[r] ?? `${r} 回合`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>邀请对手 *</Label>

                        {selectedOpponent ? (
                            <div className="flex items-center justify-between p-3 rounded-2xl border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedOpponent.avatar_url} />
                                        <AvatarFallback>
                                            {selectedOpponent.username?.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {selectedOpponent.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            信誉分: {selectedOpponent.reputation_score ?? 100}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => setSelectedOpponent(null)}
                                >
                                    更换
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        className="rounded-full border-0 bg-zinc-100/80 dark:bg-white/[0.06] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
                                        placeholder="搜索用户名..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    />
                                    <Button
                                        variant="ghost"
                                        className="rounded-full border-0 bg-zinc-200/60 hover:bg-zinc-200/85 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)]"
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                    >
                                        {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="rounded-2xl border-0 p-1.5 bg-zinc-100/85 dark:bg-zinc-900/75 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.1)] max-h-44 overflow-y-auto space-y-1">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                className="w-full flex items-center gap-3 p-2.5 rounded-full hover:bg-white/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setSelectedOpponent(user);
                                                    setSearchResults([]);
                                                    setSearchTerm("");
                                                }}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback>
                                                        {user.username?.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium">
                                                        {user.username}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground tabular-nums">
                                                        信誉分: {user.reputation_score ?? 100}
                                                    </p>
                                                </div>
                                                <UserPlus className="h-4 w-4 ml-auto text-muted-foreground mr-1" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 渐变消融内部光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 费用与全额退费保障提示 */}
                <div className="flex flex-col gap-1.5 px-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-muted-foreground">
                                发起决斗预付
                                <span className="font-semibold text-foreground mx-1 tabular-nums">
                                    {creationFee}
                                </span>
                                积分（覆盖整场 AI 裁判成本）
                            </span>
                        </div>
                        {creditBalance !== null && (
                            <span
                                className={`text-xs font-medium tabular-nums ${
                                    insufficientCredits
                                        ? "text-rose-600 dark:text-rose-400"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {insufficientCredits
                                    ? "积分不足"
                                    : `当前余额 ${creditBalance}`}
                            </span>
                        )}
                    </div>
                    {autoRefund && creationFee > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>未开赛前主动取消或对方婉拒，系统将自动 100% 全额退还发起积分</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 pt-1">
                    <Button
                        variant="ghost"
                        className="rounded-full border-0 bg-zinc-200/50 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] font-medium"
                        onClick={() => onOpenChange(false)}
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={
                            isCreating ||
                            !topic.trim() ||
                            !selectedOpponent ||
                            insufficientCredits
                        }
                        className="rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 font-medium shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] active:scale-[0.97] transition-all"
                    >
                        {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Swords className="h-4 w-4 mr-2" />
                        )}
                        发起决斗
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
