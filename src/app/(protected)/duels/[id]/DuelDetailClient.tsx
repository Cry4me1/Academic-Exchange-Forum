"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Swords,
    Trophy,
    Send,
    Loader2,
    AlertTriangle,
    Zap,
    BookOpen,
    Brain,
    Eye,
    EyeOff,
} from "lucide-react";
import { DuelScoreCard } from "@/components/duel/DuelScoreCard";
import { DuelCrystalArena } from "@/components/duel/DuelCrystalArena";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/utils";
import dynamic from "next/dynamic";
import { SpectatorBadge, Spectator } from "@/components/duel/SpectatorBadge";
import { DanmakuOverlay, DanmakuMessage } from "@/components/duel/DanmakuOverlay";
import { DanmakuHistoryPanel, DanmakuRecord } from "@/components/duel/DanmakuHistoryPanel";
import { Input } from "@/components/ui/input";
import { SpectatorBetPanel } from "@/components/duel/SpectatorBetPanel";
import { MOTION_EASINGS } from "@/lib/motion-tokens";

const NovelEditor = dynamic(() => import("@/components/editor/NovelEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-[200px] w-full bg-zinc-100/60 dark:bg-white/[0.04] animate-pulse rounded-2xl border-0 flex items-center justify-center text-sm text-muted-foreground">
            编辑器加载中...
        </div>
    ),
});

const NovelViewer = dynamic(() => import("@/components/editor/NovelViewer"), {
    ssr: false,
    loading: () => (
        <div className="h-20 w-full bg-zinc-100/40 dark:bg-white/[0.03] animate-pulse rounded-2xl border-0 flex items-center justify-center text-sm text-muted-foreground">
            内容加载中...
        </div>
    ),
});

interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    reputation_score?: number;
    duel_wins?: number;
    duel_losses?: number;
}

interface DuelRound {
    id: string;
    duel_id: string;
    round_number: number;
    author_id: string;
    content: object;
    content_text?: string;
    evidence_score: number;
    citation_score: number;
    logic_score: number;
    fallacy_penalty: number;
    total_score: number;
    has_fallacy: boolean;
    fallacy_type?: string;
    ai_analysis?: string;
    ai_analyzed_at?: string;
    created_at: string;
    author: Profile;
}

interface Duel {
    id: string;
    topic: string;
    description?: string;
    status: string;
    challenger_id: string;
    opponent_id?: string;
    winner_id?: string;
    challenger_score: number;
    opponent_score: number;
    challenger_lp: number;
    opponent_lp: number;
    challenger_position: string;
    opponent_position: string;
    max_rounds: number;
    current_round: number;
    current_turn_user_id?: string;
    ko_type?: string;
    ko_reason?: string;
    created_at: string;
    started_at?: string;
    ended_at?: string;
    challenger: Profile;
    opponent?: Profile;
    winner?: { id: string; username: string };
    post?: {
        id: string;
        title: string;
        content: object;
    };
}

interface DuelDetailClientProps {
    duel: Duel;
    rounds: DuelRound[];
    currentUser: Profile | null;
    isParticipant: boolean;
    isMyTurn: boolean;
}

export default function DuelDetailClient({
    duel: initialDuel,
    rounds: initialRounds,
    currentUser,
    isParticipant,
    isMyTurn: initialIsMyTurn,
}: DuelDetailClientProps) {
    const [currentDuel, setCurrentDuel] = useState<Duel>(initialDuel);
    const [rounds, setRounds] = useState<DuelRound[]>(initialRounds);
    const [isMyTurn, setIsMyTurn] = useState(initialIsMyTurn);
    const [editorContent, setEditorContent] = useState<object | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [userReputation, setUserReputation] = useState(currentUser?.reputation_score || 0);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [supabase] = useState(() => createClient());
    const processedIds = useRef(new Set(initialRounds.map(r => r.id)));

    // 弹幕与围观状态
    const [spectators, setSpectators] = useState<Spectator[]>([]);
    const [danmakuInput, setDanmakuInput] = useState("");
    const [danmakuVisible, setDanmakuVisible] = useState(true);
    const [latestDanmaku, setLatestDanmaku] = useState<DanmakuMessage | null>(null);
    const [isSendingDanmaku, setIsSendingDanmaku] = useState(false);
    const [danmakuHistory, setDanmakuHistory] = useState<DanmakuRecord[]>([]);

    // 实时监听
    useEffect(() => {
        // 加载历史弹幕记录
        const fetchDanmakuHistory = async () => {
            const { data: comments } = await supabase
                .from("duel_live_comments")
                .select("id, content, user_id, created_at, profiles:user_id(username, avatar_url)")
                .eq("duel_id", currentDuel.id)
                .order("created_at", { ascending: true });

            if (comments) {
                const records: DanmakuRecord[] = comments.map((c: any) => ({
                    id: c.id,
                    content: c.content,
                    username: c.profiles?.username || "神秘学者",
                    avatar_url: c.profiles?.avatar_url,
                    user_id: c.user_id,
                    created_at: c.created_at,
                    role: c.user_id === currentDuel.challenger_id
                        ? "challenger" as const
                        : c.user_id === currentDuel.opponent_id
                            ? "opponent" as const
                            : "spectator" as const,
                }));
                setDanmakuHistory(records);
            }
        };
        fetchDanmakuHistory();

        // 主动拉取最新的决斗状态，避免 soft navigation 缓存问题
        const fetchLatestDuel = async () => {
            const { data: latestDuel } = await supabase
                .from("duels")
                .select(`
                    *,
                    challenger:profiles!challenger_id(
                        id, username, avatar_url, reputation_score, duel_wins, duel_losses
                    ),
                    opponent:profiles!opponent_id(
                        id, username, avatar_url, reputation_score, duel_wins, duel_losses
                    ),
                    winner:profiles!winner_id(
                        id, username
                    ),
                    post:posts(id, title, content)
                `)
                .eq("id", currentDuel.id)
                .single();
            if (latestDuel) {
                setCurrentDuel(latestDuel as unknown as Duel);
                if (currentUser && latestDuel.current_turn_user_id) {
                    setIsMyTurn(latestDuel.current_turn_user_id === currentUser.id);
                }
            }

            if (currentUser) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("reputation_score")
                    .eq("id", currentUser.id)
                    .single();
                if (profile) {
                    setUserReputation(profile.reputation_score);
                }
            }
        };
        fetchLatestDuel();

        const presenceKey = currentUser?.username || `Guest_${Math.random().toString(36).substr(2, 4)}`;
        const channel = supabase.channel(`duel-game-${currentDuel.id}`, {
            config: {
                presence: { key: presenceKey }
            }
        });

        // 监听决斗回合
        channel.on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "duel_rounds",
                filter: `duel_id=eq.${currentDuel.id}`,
            },
            async (payload: any) => {
                if (payload.eventType === "INSERT") {
                    if (processedIds.current.has(payload.new.id)) return;
                    processedIds.current.add(payload.new.id);

                    const { data: newRound } = await supabase
                        .from("duel_rounds")
                        .select(`
                            *,
                            author:profiles!author_id (
                                id, username, avatar_url
                            )
                        `)
                        .eq("id", payload.new.id)
                        .single();

                    if (newRound) {
                        setRounds((prev) => {
                            if (prev.some(r => r.id === newRound.id)) return prev;
                            return [...prev, newRound];
                        });
                    }
                } else if (payload.eventType === "UPDATE") {
                    setRounds((prev) =>
                        prev.map((r) =>
                            r.id === payload.new.id ? { ...r, ...payload.new } : r
                        )
                    );
                }
            }
        );

        // 监听决斗主表
        channel.on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "duels",
                filter: `id=eq.${currentDuel.id}`,
            },
            async () => {
                const { data: updatedDuel } = await supabase
                    .from("duels")
                    .select(`
                        *,
                        challenger:profiles!challenger_id(
                            id, username, avatar_url, reputation_score, duel_wins, duel_losses
                        ),
                        opponent:profiles!opponent_id(
                            id, username, avatar_url, reputation_score, duel_wins, duel_losses
                        ),
                        winner:profiles!winner_id(
                            id, username
                        ),
                        post:posts(id, title, content)
                    `)
                    .eq("id", currentDuel.id)
                    .single();

                if (updatedDuel) {
                    setCurrentDuel(updatedDuel as unknown as Duel);

                    if (currentUser && updatedDuel.current_turn_user_id) {
                        setIsMyTurn(updatedDuel.current_turn_user_id === currentUser.id);
                    }
                }
            }
        );

        // 监听实时弹幕
        channel.on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "duel_live_comments",
                filter: `duel_id=eq.${currentDuel.id}`,
            },
            async (payload: any) => {
                try {
                    const { data: userProfile } = await supabase
                        .from("profiles")
                        .select("username, avatar_url")
                        .eq("id", payload.new.user_id)
                        .single();

                    const role = payload.new.user_id === currentDuel.challenger_id
                        ? "challenger" as const
                        : (payload.new.user_id === currentDuel.opponent_id ? "opponent" as const : "spectator" as const);

                    const username = userProfile?.username || "神秘学者";

                    setLatestDanmaku({
                        id: payload.new.id,
                        text: payload.new.content,
                        userId: payload.new.user_id,
                        username,
                        positionColor: role,
                    });

                    setDanmakuHistory((prev) => [
                        ...prev,
                        {
                            id: payload.new.id,
                            content: payload.new.content,
                            username,
                            avatar_url: userProfile?.avatar_url,
                            user_id: payload.new.user_id,
                            created_at: payload.new.created_at || new Date().toISOString(),
                            role,
                        },
                    ]);
                } catch (e) {
                    console.error("Fetch danmaku profile error", e);
                }
            }
        );

        // 监听 Presence 同步，维护在线围观列表
        channel.on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const onlineList: Spectator[] = [];

            Object.keys(state).forEach((key) => {
                const presences = state[key] as any[];
                presences.forEach((p) => {
                    const isChallenger = p.username === currentDuel.challenger.username;
                    const isOpponent = currentDuel.opponent && p.username === currentDuel.opponent.username;

                    if (
                        p.username &&
                        !isChallenger &&
                        !isOpponent &&
                        !onlineList.some(o => o.username === p.username)
                    ) {
                        onlineList.push({
                            username: p.username,
                            avatar_url: p.avatar_url,
                        });
                    }
                });
            });
            setSpectators(onlineList);
        });

        channel.subscribe(async (status: any) => {
            if (status === "SUBSCRIBED") {
                await channel.track({
                    username: currentUser?.username || `游客_${presenceKey.substr(-4)}`,
                    avatar_url: currentUser?.avatar_url,
                    online_at: new Date().toISOString()
                });
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentDuel.id, supabase, currentUser, currentDuel.challenger_id, currentDuel.opponent_id, currentDuel.challenger.username, currentDuel.opponent]);

    // 提取纯文本
    const extractTextFromContent = (content: object): string => {
        let text = "";
        const traverse = (node: Record<string, unknown>) => {
            if (node.type === "text" && typeof node.text === "string") {
                text += node.text + " ";
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse);
            }
        };

        const contentObj = content as Record<string, unknown>;
        if (contentObj.content && Array.isArray(contentObj.content)) {
            contentObj.content.forEach(traverse);
        }

        return text.trim();
    };

    // 内容相似度检测（Jaccard 相似度）
    const calculateSimilarity = (text1: string, text2: string): number => {
        const tokenize = (t: string) => new Set(t.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, " ").split(/\s+/).filter(Boolean));
        const words1 = tokenize(text1);
        const words2 = tokenize(text2);
        if (words1.size === 0 && words2.size === 0) return 1;
        if (words1.size === 0 || words2.size === 0) return 0;
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    };

    // 构建之前回合的上下文数据
    const buildPreviousRoundsContext = () => {
        return rounds.map(r => ({
            round: r.round_number,
            author: r.author?.username || "未知",
            position: r.author_id === currentDuel.challenger_id
                ? currentDuel.challenger_position
                : currentDuel.opponent_position,
            content: r.content_text || extractTextFromContent(r.content),
        }));
    };

    // 提交论点
    const handleSubmit = async () => {
        if (!currentUser || !editorContent) {
            toast.error("请先输入你的论点");
            return;
        }

        if (!isMyTurn) {
            toast.error("还没轮到你");
            return;
        }

        setIsSubmitting(true);

        try {
            const contentText = extractTextFromContent(editorContent);

            // 前端重复检测：与自己之前的回合进行相似度比较
            const myPreviousRounds = rounds.filter(r => r.author_id === currentUser.id);
            for (const prevRound of myPreviousRounds) {
                const prevText = prevRound.content_text || extractTextFromContent(prevRound.content);
                const similarity = calculateSimilarity(contentText, prevText);
                if (similarity > 0.7) {
                    toast.error("你的论点与之前提交的内容过于相似（相似度 " + Math.round(similarity * 100) + "%），请提出新的论据和观点！");
                    setIsSubmitting(false);
                    return;
                }
            }

            // 最小字数检查
            if (contentText.length < 20) {
                toast.error("论点内容过短，请至少输入 20 个字符");
                setIsSubmitting(false);
                return;
            }

            const currentRoundNumber = Math.floor(rounds.length / 2) + 1;

            // 1. 创建回合记录
            const { data: round, error } = await supabase
                .from("duel_rounds")
                .insert({
                    duel_id: currentDuel.id,
                    round_number: currentRoundNumber,
                    author_id: currentUser.id,
                    content: editorContent,
                    content_text: contentText,
                })
                .select("id")
                .single();

            if (error) {
                if (error.message?.includes("duplicate_content")) {
                    toast.error("不允许提交与之前完全相同的内容");
                    return;
                }
                throw error;
            }

            // 2. 调用 AI 分析（传入完整上下文）
            setIsAnalyzing(true);
            toast.info("AI 裁判正在深度思考并分析你的论点，请稍候...");

            let roundTotalScore = 0;
            let hasFallacy = false;

            const previousRounds = buildPreviousRoundsContext();

            const response = await fetch("/api/duel/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    duelId: currentDuel.id,
                    roundId: round.id,
                    topic: currentDuel.topic,
                    description: currentDuel.description || "",
                    position: currentUser.id === currentDuel.challenger_id
                        ? currentDuel.challenger_position
                        : currentDuel.opponent_position,
                    previousRounds,
                    postContent: currentDuel.post?.content ? extractTextFromContent(currentDuel.post.content) : null,
                }),
            });

            if (response.ok) {
                try {
                    const scoreData = await response.json();
                    roundTotalScore = scoreData.totalScore || 0;
                    hasFallacy = scoreData.hasFallacy || false;

                    // 更新回合评分
                    await supabase
                        .from("duel_rounds")
                        .update({
                            evidence_score: scoreData.evidenceScore || 0,
                            citation_score: scoreData.citationScore || 0,
                            logic_score: scoreData.logicScore || 0,
                            fallacy_penalty: scoreData.fallacyPenalty || 0,
                            total_score: roundTotalScore,
                            has_fallacy: scoreData.hasFallacy || false,
                            fallacy_type: scoreData.fallacyType || null,
                            ai_analysis: scoreData.analysis || null,
                            ai_analyzed_at: new Date().toISOString(),
                        })
                        .eq("id", round.id);

                    if (scoreData.isDuplicate) {
                        toast.warning("AI 裁判判定你的论点与之前的内容高度重复，本回合得分: 0");
                    } else {
                        toast.success(`论点提交成功！得分: ${roundTotalScore}`);
                    }
                } catch {
                    console.error("Failed to parse AI response");
                    toast.warning("AI 分析结果解析失败，论点已提交但未评分");
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("AI analyze failed:", errorData);
                toast.warning("AI 分析暂时不可用，论点已提交但未评分");
            }

            // 3. 更新决斗状态 (分数, LP, 回合, 结束判定)
            const isChallenger = currentUser.id === currentDuel.challenger_id;
            const newChallengerScore = isChallenger
                ? currentDuel.challenger_score + roundTotalScore
                : currentDuel.challenger_score;
            const newOpponentScore = !isChallenger
                ? currentDuel.opponent_score + roundTotalScore
                : currentDuel.opponent_score;

            // LP Logic
            let newChallengerLp = currentDuel.challenger_lp;
            let newOpponentLp = currentDuel.opponent_lp;
            if (hasFallacy) {
                if (isChallenger) {
                    newChallengerLp = Math.max(0, currentDuel.challenger_lp - 10);
                } else {
                    newOpponentLp = Math.max(0, currentDuel.opponent_lp - 10);
                }
            }

            const totalTurnsPlayed = rounds.length + 1;
            const maxTurns = currentDuel.max_rounds * 2;
            let isGameOver = totalTurnsPlayed >= maxTurns;
            let koType = null;
            let koReason = null;

            // T.K.O check
            if (newChallengerLp <= 0 || newOpponentLp <= 0) {
                isGameOver = true;
                koType = "fallacy_limit";
                koReason = "逻辑值归零，惨遭技术性击倒";
            } else if (newChallengerScore <= -30 || newOpponentScore <= -30) {
                isGameOver = true;
                koType = "negative_streak";
                koReason = "得分极低，惨遭技术性击倒";
            }

            const updatePayload: any = {
                challenger_score: newChallengerScore,
                opponent_score: newOpponentScore,
                challenger_lp: newChallengerLp,
                opponent_lp: newOpponentLp,
            };

            if (isGameOver) {
                updatePayload.status = "completed";
                updatePayload.ended_at = new Date().toISOString();
                if (koType) {
                    updatePayload.ko_type = koType;
                    updatePayload.ko_reason = koReason;
                }

                // Determine winner logic with KO priority
                if (newChallengerLp <= 0) {
                    updatePayload.winner_id = currentDuel.opponent_id;
                } else if (newOpponentLp <= 0) {
                    updatePayload.winner_id = currentDuel.challenger_id;
                } else if (newChallengerScore <= -30) {
                    updatePayload.winner_id = currentDuel.opponent_id;
                } else if (newOpponentScore <= -30) {
                    updatePayload.winner_id = currentDuel.challenger_id;
                } else if (newChallengerScore > newOpponentScore) {
                    updatePayload.winner_id = currentDuel.challenger_id;
                } else if (newOpponentScore > newChallengerScore && currentDuel.opponent_id) {
                    updatePayload.winner_id = currentDuel.opponent_id;
                }

                toast.success(koType ? "决斗结束，判定 T.K.O！" : "决斗结束！正在生成总结...");
            } else {
                updatePayload.current_round = currentRoundNumber;
                updatePayload.current_turn_user_id = isChallenger
                    ? currentDuel.opponent_id
                    : currentDuel.challenger_id;
            }

            await supabase
                .from("duels")
                .update(updatePayload)
                .eq("id", currentDuel.id);

            setIsMyTurn(false);
            setEditorContent(null);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("提交失败");
        } finally {
            setIsSubmitting(false);
            setIsAnalyzing(false);
        }
    };

    // 获取用户角色
    const getUserRole = (userId: string) => {
        if (userId === currentDuel.challenger_id) return "challenger";
        if (userId === currentDuel.opponent_id) return "opponent";
        return "spectator";
    };

    // 发送实时弹幕
    const handleSendDanmaku = async () => {
        if (!currentUser) {
            toast.error("请先登录后发送弹幕");
            return;
        }
        if (!danmakuInput.trim()) return;

        setIsSendingDanmaku(true);
        try {
            const { error } = await supabase
                .from("duel_live_comments")
                .insert({
                    duel_id: currentDuel.id,
                    user_id: currentUser.id,
                    content: danmakuInput.trim(),
                });

            if (error) throw error;
            setDanmakuInput("");
        } catch (error) {
            console.error("Send danmaku error:", error);
            toast.error("弹幕发送失败");
        } finally {
            setIsSendingDanmaku(false);
        }
    };

    if (!isMounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative flex flex-col">
                <header className="sticky top-0 z-50 bg-white/75 dark:bg-zinc-900/65 backdrop-blur-2xl border-0 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/duels">
                                <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回决斗场
                                </Button>
                            </Link>
                            <div className="h-8 w-24 bg-muted/40 animate-pulse rounded-full" />
                        </div>
                    </div>
                </header>
                <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                        <p className="text-sm text-muted-foreground animate-pulse">正在载入学术决斗现场...</p>
                    </div>
                </main>
            </div>
        );
    }

    const myRole = currentUser ? getUserRole(currentUser.id) : "spectator";
    const myPosition = myRole === "challenger" ? currentDuel.challenger_position : currentDuel.opponent_position;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
            {/* 顶部导航（无边框液态流光毛玻璃） */}
            <header className="sticky top-0 z-50 bg-white/75 dark:bg-zinc-900/65 backdrop-blur-2xl border-0 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.38),inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/duels">
                            <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                                <ArrowLeft className="h-4 w-4" />
                                返回决斗场
                            </Button>
                        </Link>

                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* 观战人数显示 */}
                            {currentDuel.status === "active" && isMounted && (
                                <SpectatorBadge spectators={spectators} />
                            )}

                            {/* 弹幕开关 */}
                            {currentDuel.status === "active" && isMounted && myRole === "spectator" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDanmakuVisible(!danmakuVisible)}
                                    title={danmakuVisible ? "屏蔽弹幕" : "开启弹幕"}
                                    className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
                                >
                                    {danmakuVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                            )}

                            <div className="flex items-center gap-2">
                                {currentDuel.status === "active" && (
                                    <Badge variant="default" className="rounded-full border-0 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300 font-medium px-3 py-0.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)]">
                                        <span className="animate-pulse mr-1">●</span> 进行中
                                    </Badge>
                                )}
                                {currentDuel.status === "completed" && (
                                    <Badge variant="secondary" className="rounded-full border-0 bg-amber-500/14 text-amber-700 dark:text-amber-300 font-medium px-3 py-0.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.65)]">
                                        {currentDuel.ko_type ? "KO 结束" : "已完赛"}
                                    </Badge>
                                )}
                                <span className="text-xs sm:text-sm text-muted-foreground font-mono tabular-nums font-medium">
                                    第 {currentDuel.current_round}/{currentDuel.max_rounds} 回合
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                {/* 实时弹幕层（仅非决斗选手的普通观众可见） */}
                {isMounted && myRole === "spectator" && (
                    <DanmakuOverlay newDanmaku={latestDanmaku} visible={danmakuVisible} />
                )}

                {/* 辩题 */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: MOTION_EASINGS.snappy }}
                    className="text-center mb-8"
                >
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">{currentDuel.topic}</h1>
                    {currentDuel.description && (
                        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">{currentDuel.description}</p>
                    )}
                </motion.div>

                {/* 3D 晶体翻转对战竞技舱（正面实时对战态势 / 背面 AI 多维量化裁决） */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: 0.05, ease: MOTION_EASINGS.snappy }}
                    className="mb-8"
                >
                    <DuelCrystalArena duel={currentDuel} rounds={rounds} />
                </motion.div>

                {/* 回合列表 */}
                <div className="space-y-6 mb-8">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        辩论记录
                    </h2>

                    <AnimatePresence>
                        {rounds.length === 0 ? (
                            <Card className="text-center py-12 border-0 rounded-3xl bg-white/70 dark:bg-zinc-900/55 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
                                <CardContent>
                                    <Swords className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">还没有任何论点提交</p>
                                    {isMyTurn && (
                                        <p className="text-sm text-primary mt-2 font-medium">轮到你了，发起第一轮攻势吧！</p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            rounds.map((round, index) => {
                                const isChallenger = round.author_id === currentDuel.challenger_id;
                                const position = isChallenger
                                    ? currentDuel.challenger_position
                                    : currentDuel.opponent_position;

                                return (
                                    <motion.div
                                        key={round.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.24,
                                            delay: Math.min(index * 0.04, 0.2),
                                            ease: MOTION_EASINGS.snappy,
                                        }}
                                    >
                                        <Card
                                            className={`relative overflow-hidden border-0 rounded-3xl bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.1)] ${
                                                isChallenger
                                                    ? "before:content-[''] before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-r-full before:bg-sky-500/80"
                                                    : "before:content-[''] before:absolute before:inset-y-4 before:right-0 before:w-1 before:rounded-l-full before:bg-rose-500/80"
                                            }`}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={round.author?.avatar_url} />
                                                            <AvatarFallback>
                                                                {round.author?.username?.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {round.author?.username || "学者"}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={`rounded-full border-0 font-medium ${
                                                                        isChallenger
                                                                            ? "bg-sky-500/12 text-sky-700 dark:text-sky-300"
                                                                            : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                                                                    }`}
                                                                >
                                                                    {position}
                                                                </Badge>
                                                                <span>第 {round.round_number} 回合</span>
                                                                <span>·</span>
                                                                <span suppressHydrationWarning>{formatDistanceToNow(new Date(round.created_at))}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 评分卡片 */}
                                                    {round.ai_analyzed_at && (
                                                        <DuelScoreCard
                                                            evidenceScore={round.evidence_score}
                                                            citationScore={round.citation_score}
                                                            logicScore={round.logic_score}
                                                            fallacyPenalty={round.fallacy_penalty}
                                                            totalScore={round.total_score}
                                                            hasFallacy={round.has_fallacy}
                                                            fallacyType={round.fallacy_type}
                                                            analysis={round.ai_analysis}
                                                        />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                                    <NovelViewer initialValue={round.content as any} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* 提交论点区域 */}
                {currentDuel.status === "active" && isParticipant && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: MOTION_EASINGS.snappy }}
                    >
                        <Card className="border-0 rounded-3xl bg-white/75 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {isMyTurn ? (
                                        <>
                                            <Zap className="h-5 w-5 text-amber-500" />
                                            轮到你了！提交你的论点
                                            <Badge className="ml-2 rounded-full border-0">{myPosition}</Badge>
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="h-5 w-5 text-muted-foreground" />
                                            等待对手回应...
                                        </>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isMyTurn ? (
                                    <div className="space-y-4">
                                        <div className="min-h-[200px] rounded-2xl border-0 bg-zinc-100/60 dark:bg-white/[0.03] shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] overflow-hidden">
                                            <NovelEditor
                                                initialValue={undefined}
                                                onChange={(content) => setEditorContent(content as object)}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || !editorContent}
                                                size="lg"
                                                className="rounded-full"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        {isAnalyzing ? "AI 裁判分析中..." : "提交中..."}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 mr-2" />
                                                        提交论点
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                        <p>对手正在思考...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* 观战提示区域 */}
                {currentDuel.status === "active" && !isParticipant && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: MOTION_EASINGS.snappy }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="md:col-span-2">
                            <Card className="border-0 rounded-3xl bg-white/70 dark:bg-zinc-900/55 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] h-full">
                                <CardContent className="text-center py-8">
                                    <Eye className="h-10 w-10 mx-auto text-primary/60 mb-3 animate-pulse" />
                                    <h3 className="text-base font-semibold mb-1">您正在学术围观中</h3>
                                    <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                                        您是本次学术决斗的观战嘉宾，可以阅读双方选手的交锋记录，翻转顶部 3D 晶体舱查看 AI 裁判量化矩阵，或使用底部弹幕框进行学术应援！
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-1">
                            {currentDuel.opponent && currentUser ? (
                                <SpectatorBetPanel
                                    duelId={currentDuel.id}
                                    challenger={{
                                        id: currentDuel.challenger_id,
                                        username: currentDuel.challenger.username,
                                        avatar_url: currentDuel.challenger.avatar_url,
                                        position: currentDuel.challenger_position
                                    }}
                                    opponent={{
                                        id: currentDuel.opponent_id!,
                                        username: currentDuel.opponent.username,
                                        avatar_url: currentDuel.opponent.avatar_url,
                                        position: currentDuel.opponent_position
                                    }}
                                    userReputation={userReputation}
                                    onBetSuccess={() => {
                                        // Optional callback
                                    }}
                                />
                            ) : null}
                        </div>
                    </motion.div>
                )}

                {/* 决斗结束底部摘要铭牌 */}
                {currentDuel.status === "completed" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.24, ease: MOTION_EASINGS.snappy }}
                    >
                        <Card className="border-0 rounded-3xl bg-amber-500/[0.08] dark:bg-amber-500/[0.07] backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(245,158,11,0.16),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                            <CardContent className="text-center py-8">
                                <Trophy className="h-14 w-14 mx-auto text-amber-500 mb-3" />
                                <h2 className="text-2xl font-bold mb-2">决斗结束！</h2>
                                {currentDuel.winner ? (
                                    <p className="text-lg">
                                        🎉 <span className="font-semibold text-primary">{currentDuel.winner.username}</span> 获胜！
                                    </p>
                                ) : (
                                    <p className="text-lg text-muted-foreground">平局！</p>
                                )}
                                {currentDuel.ko_type && (
                                    <Badge variant="destructive" className="mt-2 rounded-full border-0 px-3 py-0.5">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {currentDuel.ko_type === "fallacy_limit" ? "逻辑谬误 KO" : "负分连败 KO"}
                                    </Badge>
                                )}
                                {currentDuel.ko_reason && (
                                    <p className="text-sm text-muted-foreground mt-2">{currentDuel.ko_reason}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* 底部悬浮/固定弹幕栏 */}
                {currentDuel.status === "active" && isMounted && myRole === "spectator" && (
                    <div className="sticky bottom-6 left-0 right-0 max-w-xl mx-auto px-4 z-30 mt-8">
                        <div className="flex items-center gap-2 p-2 rounded-full border-0 bg-white/80 dark:bg-zinc-900/75 backdrop-blur-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.55),inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                            <DanmakuHistoryPanel
                                records={danmakuHistory}
                                challengerName={currentDuel.challenger.username}
                                opponentName={currentDuel.opponent?.username}
                            />
                            <div className="w-[1px] h-5 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent hidden sm:block" />
                            <Input
                                placeholder={currentUser ? "说点什么，发送实时弹幕..." : "请登录后发送弹幕"}
                                value={danmakuInput}
                                onChange={(e) => setDanmakuInput(e.target.value)}
                                disabled={!currentUser || isSendingDanmaku}
                                onKeyDown={(e) => e.key === "Enter" && handleSendDanmaku()}
                                className="flex-1 rounded-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-9 text-xs sm:text-sm"
                            />
                            <Button
                                onClick={handleSendDanmaku}
                                disabled={!currentUser || isSendingDanmaku || !danmakuInput.trim()}
                                size="sm"
                                className="rounded-full px-4 h-8 shrink-0 text-xs font-medium"
                            >
                                {isSendingDanmaku ? "发送中..." : "发弹幕"}
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
