"use client";

import {
    getPostRevisions,
    getRevisionDiff,
    PostRevisionListItem,
} from "@/app/posts/[id]/history-actions";
import { DiffViewer } from "@/components/posts/DiffViewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Compass, FileText, History, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DiffData {
    old: {
        title: string;
        content: object;
        revision_number: number;
        created_at: string;
    };
    new: {
        title: string;
        content: object;
        revision_number: number;
        is_current?: boolean;
        created_at: string;
    };
}

export default function PostHistoryPage() {
    const params = useParams();
    const postId = params.id as string;

    const [revisions, setRevisions] = useState<PostRevisionListItem[]>([]);
    const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
    const [diffData, setDiffData] = useState<DiffData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDiff, setLoadingDiff] = useState(false);
    const [accessError, setAccessError] = useState<string | null>(null);

    const loadRevisions = async () => {
        setLoading(true);
        setAccessError(null);
        const result = await getPostRevisions(postId);
        if (result.code === "REQUIRES_SCHOLAR_LV3" || result.error) {
            setAccessError(result.error || "需要达到学者等级 Lv3 及以上方可查看历史版本");
            setLoading(false);
            return;
        }
        if (result.data) {
            setRevisions(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadRevisions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    const loadDiff = async (revisionNumber: number) => {
        setLoadingDiff(true);
        setSelectedRevision(revisionNumber);
        const result = await getRevisionDiff(postId, revisionNumber);
        if (result.data) {
            setDiffData(result.data as DiffData);
        }
        setLoadingDiff(false);
    };

    return (
        <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-50 bg-white/75 dark:bg-zinc-900/70 backdrop-blur-2xl border-0 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05),inset_0_-1px_0.5px_rgba(0,0,0,0.04)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href={`/posts/${postId}`}>
                                <Button variant="ghost" size="sm" className="gap-2 rounded-full border-0">
                                    <ArrowLeft className="h-4 w-4" />
                                    返回帖子
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <h1 className="text-lg font-semibold">修订历史</h1>
                                {revisions.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 rounded-full border-0">
                                        {revisions.length} 个版本
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 学者等级 Lv3 权限拦截面板 */}
            {accessError ? (
                <div className="max-w-lg mx-auto px-4 py-20">
                    <div className="rounded-3xl border-0 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_16px_48px_-8px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_16px_48px_-8px_rgba(0,0,0,0.5)] p-8 text-center space-y-5">
                        <div className="mx-auto w-14 h-14 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-foreground">
                                Lv3 学者专属特权：历史版本追溯对比
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {accessError}。通过发表高质量学术文章、积累同行点赞与社区共建即可晋升解锁。
                            </p>
                        </div>
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                        <div className="flex items-center justify-center gap-3 pt-1">
                            <Link href={`/posts/${postId}`}>
                                <Button variant="ghost" className="rounded-full border-0 px-5 text-xs font-medium">
                                    返回文章
                                </Button>
                            </Link>
                            <Link href="/vip">
                                <Button className="rounded-full border-0 px-6 text-xs font-medium bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] gap-1.5">
                                    <Compass className="w-3.5 h-3.5" />
                                    查看学者等级与晋升进度
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                /* 主内容区域 */
                <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
                    {/* 左侧版本列表 */}
                    <div className="w-full lg:w-72 xl:w-80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl flex flex-col shrink-0 max-h-[30vh] lg:max-h-full overflow-hidden shadow-[4px_0_24px_-4px_rgba(0,0,0,0.04)]">
                        <div className="p-4 shrink-0">
                            <p className="text-sm text-muted-foreground">
                                点击版本查看与下一版本的对比
                            </p>
                            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent mt-3" />
                        </div>
                        <div className="flex-1 overflow-auto">
                            <div className="p-3 space-y-2">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : revisions.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                        <p className="text-muted-foreground">
                                            暂无修订历史
                                        </p>
                                        <p className="text-muted-foreground/60 text-sm mt-2">
                                            编辑帖子后将自动保存版本
                                        </p>
                                    </div>
                                ) : (
                                    revisions.map((rev, index) => (
                                        <button
                                            key={rev.id}
                                            onClick={() => loadDiff(rev.revision_number)}
                                            className={`w-full p-4 text-left rounded-2xl border-0 transition-all cursor-pointer ${
                                                selectedRevision === rev.revision_number
                                                    ? "bg-white dark:bg-zinc-800 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_6px_20px_-2px_rgba(14,165,233,0.16)]"
                                                    : "hover:bg-white/60 dark:hover:bg-zinc-800/50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={rev.editor?.avatar_url || ""} />
                                                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/30 to-primary/10">
                                                        {rev.editor?.username?.[0]?.toUpperCase() || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">
                                                            版本 {rev.revision_number}
                                                        </span>
                                                        {index === 0 && (
                                                            <Badge variant="outline" className="text-[10px] h-5 rounded-full border-0 bg-primary/10 text-primary">
                                                                最新
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate pl-11">
                                                {rev.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 mt-1 pl-11">
                                                {formatDate(rev.created_at)}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧 Diff 视图 */}
                    <div className="flex-1 flex flex-col bg-transparent min-h-0 min-w-0 overflow-hidden">
                        {loadingDiff ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">加载版本差异...</p>
                                </div>
                            </div>
                        ) : diffData ? (
                            <>
                                <div className="px-6 py-4 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="rounded-full border-0 bg-red-500/10 text-red-600 px-3 py-1">
                                            版本 {diffData.old.revision_number}
                                        </Badge>
                                        <span className="text-muted-foreground text-lg">→</span>
                                        <Badge variant="outline" className="rounded-full border-0 bg-emerald-500/10 text-emerald-600 px-3 py-1">
                                            {diffData.new.is_current
                                                ? "当前版本"
                                                : `版本 ${diffData.new.revision_number}`}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 overflow-hidden">
                                    <DiffViewer
                                        oldContent={diffData.old.content}
                                        newContent={diffData.new.content}
                                        oldTitle={diffData.old.title}
                                        newTitle={diffData.new.title}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                                        <History className="h-10 w-10 opacity-30" />
                                    </div>
                                    <p className="text-lg mb-2">选择一个版本</p>
                                    <p className="text-sm text-muted-foreground/60">
                                        从左侧列表中选择一个历史版本查看变化
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
