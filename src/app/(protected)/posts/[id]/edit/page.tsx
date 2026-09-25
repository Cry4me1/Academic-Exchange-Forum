"use client";

import { CreateCollectionDialog } from "@/components/collections";
import { LiquidTagSelector } from "@/components/posts/LiquidTagSelector";
import dynamic from "next/dynamic";
import { PostCoverUploader } from "@/components/editor/PostCoverUploader";

const NovelEditor = dynamic(() => import("@/components/editor/NovelEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-[480px] w-full bg-muted/10 animate-pulse rounded-xl border border-dashed border-border/60 flex items-center justify-center text-sm text-muted-foreground font-sans">
            学术编辑器加载中...
        </div>
    ),
});
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getMyCollections, getPostCollections, syncPostCollections } from "@/app/(protected)/collections/actions";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    HelpCircle,
    Loader2,
    Plus,
    Save,
    Sparkles,
    Tag,
    X,
    AlertTriangle,
    ShieldAlert,
    Clock,
    RotateCcw,
    Trash2,
    FileEdit,
    Cloud,
    FileCode2,
    Sigma,
    ExternalLink,
    ChevronDown,
    SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type JSONContent } from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updatePost } from "../../actions";
import { MobilePublishSettingsSheet } from "@/components/editor/MobilePublishSettingsSheet";

const AVAILABLE_TAGS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "Economics",
    "Philosophy",
    "AI",
    "Chemistry",
    "Engineering",
];

const getDraftStorageKey = (id: string) => `scholarly_edit_post_draft_v1_${id}`;

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contentJson, setContentJson] = useState<JSONContent | undefined>(undefined);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isHelpWanted, setIsHelpWanted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
    const [myCollections, setMyCollections] = useState<Array<{ id: string; name: string; post_count?: number }>>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>("none");
    const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
    const [postReviewStatus, setPostReviewStatus] = useState<string | null>(null);
    const [reviewerNote, setReviewerNote] = useState<string | null>(null);
    const [isRulesExpanded, setIsRulesExpanded] = useState(false);

    // 草稿相关状态
    const [initialData, setInitialData] = useState<{
        title: string;
        contentJson: JSONContent | undefined;
        coverImage: string | null;
        tags: string[];
        isHelpWanted: boolean;
    } | null>(null);

    const [pendingDraft, setPendingDraft] = useState<{
        title: string;
        contentJson: JSONContent | undefined;
        coverImage: string | null;
        tags: string[];
        isHelpWanted: boolean;
        updatedAt: number;
    } | null>(null);

    const [isDraftRestored, setIsDraftRestored] = useState(false);
    const [lastSavedDraftTime, setLastSavedDraftTime] = useState<string | null>(null);
    const isInitializedRef = useRef(false);

    const loadCollectionsData = useCallback(async () => {
        const { collections } = await getMyCollections();
        setMyCollections(collections || []);
    }, []);

    const loadPost = useCallback(async () => {
        const supabase = createClient();

        // 验证用户身份
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("请先登录");
            router.push("/login");
            return;
        }

        // 获取帖子
        const { data: post, error } = await supabase
            .from("posts")
            .select("*")
            .eq("id", postId)
            .single();

        if (error || !post) {
            toast.error("帖子不存在");
            router.push("/dashboard");
            return;
        }

        // 验证是否为作者
        if (post.author_id !== user.id) {
            toast.error("无权编辑此帖子");
            router.push(`/posts/${postId}`);
            return;
        }

        const initial = {
            title: post.title,
            contentJson: post.content as JSONContent,
            coverImage: post.cover_image || null,
            tags: post.tags || [],
            isHelpWanted: post.is_help_wanted || false,
        };

        setTitle(initial.title);
        setContentJson(initial.contentJson);
        setCoverImage(initial.coverImage);
        setSelectedTags(initial.tags);
        setIsHelpWanted(initial.isHelpWanted);
        setPostReviewStatus(post.review_status || null);
        setReviewerNote(post.reviewer_note || post.ai_reason || null);
        setContent("valid");
        setInitialData(initial);
        setLoading(false);

        // 检查是否存在未提交的本地草稿
        try {
            const savedDraft = localStorage.getItem(getDraftStorageKey(postId));
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                const isDifferent =
                    parsed.title !== initial.title ||
                    JSON.stringify(parsed.contentJson) !== JSON.stringify(initial.contentJson) ||
                    parsed.coverImage !== initial.coverImage ||
                    JSON.stringify(parsed.tags || []) !== JSON.stringify(initial.tags) ||
                    Boolean(parsed.isHelpWanted) !== Boolean(initial.isHelpWanted);

                if (isDifferent) {
                    setPendingDraft(parsed);
                } else {
                    localStorage.removeItem(getDraftStorageKey(postId));
                }
            }
        } catch (e) {
            console.error("Failed to read draft from localStorage:", e);
        }

        setTimeout(() => {
            isInitializedRef.current = true;
        }, 500);
    }, [postId, router]);

    useEffect(() => {
        loadPost();
    }, [loadPost]);

    // 加载专栏数据
    useEffect(() => {
        loadCollectionsData();
        getPostCollections(postId).then(({ collections }) => {
            if (collections && collections.length > 0) {
                setSelectedCollectionId(collections[0].id);
            } else {
                setSelectedCollectionId("none");
            }
        });
    }, [postId, loadCollectionsData]);

    // 自动暂存草稿到 localStorage (1s 防抖)
    useEffect(() => {
        if (loading || !isInitializedRef.current || !initialData) return;

        const hasChanges =
            title !== initialData.title ||
            JSON.stringify(contentJson) !== JSON.stringify(initialData.contentJson) ||
            coverImage !== initialData.coverImage ||
            JSON.stringify(selectedTags) !== JSON.stringify(initialData.tags) ||
            isHelpWanted !== initialData.isHelpWanted;

        if (!hasChanges) return;

        const timer = setTimeout(() => {
            try {
                const draftPayload = {
                    title,
                    contentJson,
                    coverImage,
                    tags: selectedTags,
                    isHelpWanted,
                    updatedAt: Date.now(),
                };
                localStorage.setItem(getDraftStorageKey(postId), JSON.stringify(draftPayload));
                const now = new Date();
                setLastSavedDraftTime(
                    `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
                );
            } catch (e) {
                console.error("Failed to save draft:", e);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [title, contentJson, coverImage, selectedTags, isHelpWanted, loading, initialData, postId]);

    // 恢复草稿
    const handleRestoreDraft = () => {
        if (!pendingDraft) return;
        setTitle(pendingDraft.title || "");
        if (pendingDraft.contentJson) {
            setContentJson(pendingDraft.contentJson);
            setContent("valid");
        }
        setCoverImage(pendingDraft.coverImage || null);
        setSelectedTags(pendingDraft.tags || []);
        setIsHelpWanted(Boolean(pendingDraft.isHelpWanted));
        setIsDraftRestored(true);
        setPendingDraft(null);
        toast.success("已恢复本地草稿内容");
    };

    // 丢弃草稿并还原为线上版本
    const handleDiscardDraft = () => {
        try {
            localStorage.removeItem(getDraftStorageKey(postId));
        } catch (e) {
            console.error("Failed to remove draft:", e);
        }
        setPendingDraft(null);
        if (initialData) {
            setTitle(initialData.title);
            setContentJson(initialData.contentJson);
            setCoverImage(initialData.coverImage);
            setSelectedTags(initialData.tags);
            setIsHelpWanted(initialData.isHelpWanted);
            setContent("valid");
        }
        setIsDraftRestored(false);
        setLastSavedDraftTime(null);
        toast.info("已丢弃本地草稿，还原为线上版本");
    };

    const handleTagToggle = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            toast.error("最多只能选择 3 个标签");
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("请输入帖子标题");
            return;
        }

        if (!content.trim() || content === "<p></p>") {
            toast.error("请输入正文内容");
            return;
        }

        if (selectedTags.length === 0) {
            toast.error("请至少选择一个标签");
            return;
        }

        if (!contentJson) {
            toast.error("内容格式解析异常");
            return;
        }

        setIsSubmitting(true);

        try {
            const cleanedContent = JSON.parse(JSON.stringify(contentJson));

            const result = await updatePost(postId, {
                title: title.trim(),
                content: cleanedContent,
                tags: selectedTags,
                cover_image: coverImage,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            // 更新成功，清除本地草稿
            try {
                localStorage.removeItem(getDraftStorageKey(postId));
            } catch (e) {
                console.error("Clear draft error:", e);
            }

            // 同步帖子的专栏归属
            const colIdsToSync = selectedCollectionId && selectedCollectionId !== "none" ? [selectedCollectionId] : [];
            await syncPostCollections(postId, colIdsToSync).catch((err) => {
                console.error("Sync post collections error:", err);
            });

            toast.success("更新成功！");
            router.push(`/posts/${postId}`);
        } catch (error) {
            toast.error("更新失败，请重试");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 顶部轻量操作栏 Header Bar：无边框 Apple Liquid Glass 流体透光 */}
            <header className="sticky top-0 z-40 bg-background/75 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)] transition-colors">
                <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-14">
                        {/* 左侧：返回 + 编辑/草稿状态 */}
                        <div className="flex items-center gap-3">
                            <Link href={`/posts/${postId}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full bg-zinc-200/30 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all cursor-pointer border-0"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    返回帖子
                                </Button>
                            </Link>

                            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                                {lastSavedDraftTime ? (
                                    <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                                        草稿已自动保存于 {lastSavedDraftTime}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-zinc-400">编辑现有研讨</span>
                                )}
                                {isDraftRestored && (
                                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30 rounded-full">
                                        已加载本地草稿
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* 右侧：移动端配置胶囊 + 设为求助微型 Toggle + 高阶 Apple Liquid Glass 全局核心 CTA 保存按钮 */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* 移动端专属发布配置水滴胶囊 */}
                            <button
                                type="button"
                                onClick={() => setIsMobileSettingsOpen(true)}
                                className="lg:hidden flex items-center gap-1.5 h-8.5 px-3 rounded-full border-0 bg-zinc-200/50 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] active:scale-95 transition-all cursor-pointer"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                <span>配置</span>
                                {selectedTags.length > 0 ? (
                                    <span className="text-[10px] font-mono bg-blue-500 text-white rounded-full px-1.5 py-0.2">
                                        {selectedTags.length}
                                    </span>
                                ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                )}
                            </button>

                            <div
                                className={`hidden lg:flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full backdrop-blur-xl transition-all duration-300 select-none ${
                                    isHelpWanted
                                        ? "bg-amber-500/[0.14] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_12px_rgba(245,158,11,0.22)] dark:bg-amber-500/[0.18] dark:shadow-[inset_0_1px_0.5px_rgba(251,191,36,0.35),0_2px_16px_rgba(245,158,11,0.25)]"
                                        : "bg-zinc-200/40 hover:bg-zinc-200/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.03)] dark:bg-white/[0.06] dark:hover:bg-white/[0.09] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_8px_-2px_rgba(0,0,0,0.3)]"
                                }`}
                            >
                                <label
                                    htmlFor="help-wanted-edit-toggle"
                                    className="text-[11px] font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                                >
                                    <HelpCircle
                                        className={`w-3.5 h-3.5 transition-colors ${isHelpWanted ? "text-amber-500" : "text-zinc-500 dark:text-zinc-400"}`}
                                        strokeWidth={1.75}
                                    />
                                    <span className={isHelpWanted ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-zinc-600 dark:text-zinc-300"}>
                                        {isHelpWanted ? "高亮求助" : "设为求助"}
                                    </span>
                                </label>
                                <Switch
                                    id="help-wanted-edit-toggle"
                                    size="sm"
                                    checked={isHelpWanted}
                                    onCheckedChange={setIsHelpWanted}
                                    className="data-[state=checked]:bg-amber-500 cursor-pointer"
                                />
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="relative overflow-hidden group h-9 px-5 rounded-full text-xs sm:text-sm font-medium border-0 transition-all duration-300 cursor-pointer
                                        bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] hover:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]
                                        dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] dark:hover:shadow-[0_6px_24px_-2px_rgba(255,255,255,0.32),inset_0_1px_1.5px_rgba(255,255,255,1)]
                                        backdrop-blur-xl gap-2 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {/* 顶层液态物理漫射光条 (Liquid Sheen Highlight) */}
                                    <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/80 to-transparent pointer-events-none" />

                                    {/* 鼠标悬浮微光流动反射层 (Liquid Hover Reflex) */}
                                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/[0.12] dark:via-white/[0.25] to-transparent pointer-events-none" />

                                    {isSubmitting ? (
                                        <>
                                            <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span className="relative z-10">保存中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-3.5 w-3.5 relative z-10 transition-transform group-hover:scale-110" strokeWidth={1.75} />
                                            <span className="relative z-10">保存修改</span>
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 主体双栏区域（全屏 80%~90% 开阔工作台） */}
            <main className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* 左侧 75% 沉浸写作画布 */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        {/* 本地草稿恢复提示 */}
                        <AnimatePresence>
                            {pendingDraft && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                                            <FileEdit className="h-4 w-4" strokeWidth={1.75} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                                                发现未保存的本地草稿
                                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                                    <Clock className="w-2.5 h-2.5 mr-1" />
                                                    {new Date(pendingDraft.updatedAt).toLocaleTimeString()}
                                                </Badge>
                                            </h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                检测到此帖子在本地存在未提交的编辑记录，与线上版本不一致。是否恢复上次编辑？
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleDiscardDraft}
                                            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            丢弃
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleRestoreDraft}
                                            className="h-8 text-xs gap-1.5 rounded-xl"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            恢复草稿
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 审核状态提醒横幅 */}
                        {postReviewStatus === "rejected" && (
                            <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-xs">
                                <div className="p-1.5 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                                    <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                                        文章未通过审核（需修改后重新提交）
                                        <Badge variant="destructive" className="text-[10px]">
                                            已驳回
                                        </Badge>
                                    </h4>
                                    <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                                        驳回理由：{reviewerNote || "内容未符合学术社区安全规范"}。修改后点击右上角保存即可重新提交初审。
                                    </p>
                                </div>
                            </div>
                        )}

                        {postReviewStatus === "pending" && (
                            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs">
                                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                    <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-xs sm:text-sm">
                                        当前文章正在人工审核队列中
                                    </h4>
                                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                        您可以在此继续完善内容并保存，保存后将自动更新待审版本。
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 标题输入框：大字号、自适应折行、无边框极简 Input */}
                        <div className="pl-6 sm:pl-8 pr-4 space-y-2 pt-2 pb-1">
                            <textarea
                                rows={1}
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="输入研讨标题..."
                                maxLength={100}
                                className="w-full bg-transparent text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight text-foreground placeholder:text-muted-foreground/30 border-none outline-none focus:outline-none focus:ring-0 p-0 resize-none overflow-hidden"
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground/60 pb-1">
                                <span className="flex items-center gap-1.5 text-[11px]">
                                    <Sparkles className="w-3 h-3 text-amber-500/80" />
                                    支持直接粘贴 Markdown 文本、LaTeX 数学公式与代码高亮
                                </span>
                                <span className="font-mono text-[11px] tabular-nums">
                                    {title.length}/100
                                </span>
                            </div>
                        </div>

                        {/* 编辑器区域：纯净开阔画布，去除灰色大线框 */}
                        <div className="w-full flex-1 flex flex-col min-h-[580px]">
                            <NovelEditor
                                initialValue={contentJson}
                                toolbarHintRight={<span>修订版本自动归档</span>}
                                onTitleExtracted={(extracted) => {
                                    if (!title.trim()) {
                                        setTitle(extracted);
                                    }
                                }}
                                onChange={(json) => {
                                    setContentJson(json);
                                    const hasContent = json?.content?.some((node: any) =>
                                        node.content?.length > 0 || (node.type === 'image') || (node.type === 'codeBlock') || (node.type === 'academicBlock')
                                    );
                                    setContent(hasContent ? "valid" : "");
                                }}
                            />
                        </div>
                    </div>

                    {/* 右侧 25%~30% 发布配置侧边栏 (仅在桌面端展示，移动端由右上角配置抽屉承载) */}
                    <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-5 lg:sticky lg:top-20">
                        {/* 发布元数据配置卡片 (Apple 无边框液态毛玻璃材质) */}
                        <div className="rounded-3xl p-6 space-y-6 bg-white/75 hover:bg-white/85 dark:bg-zinc-900/45 dark:hover:bg-zinc-900/55 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300">
                            {/* 1. 学科标签选择器 (Apple Liquid Glass 拟态微光悬浮交互) */}
                            <LiquidTagSelector
                                availableTags={AVAILABLE_TAGS}
                                selectedTags={selectedTags}
                                onTagToggle={handleTagToggle}
                                maxTags={3}
                            />

                            {/* 柔和消融渐变光缝（替代生硬 hr） */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent dark:via-zinc-800/70" />

                            {/* 2. 归入专栏 (无边框液态水滴胶囊下拉) */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                        归入专栏
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateCollectionOpen(true)}
                                        className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" strokeWidth={1.75} />
                                        新建专栏
                                    </button>
                                </div>

                                <Select
                                    value={selectedCollectionId}
                                    onValueChange={setSelectedCollectionId}
                                >
                                    <SelectTrigger className="w-full h-10 px-3.5 rounded-full border-0 bg-zinc-200/40 hover:bg-zinc-200/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),inset_0_-1px_0.5px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.2)] text-xs font-medium cursor-pointer transition-all outline-none focus:ring-2 focus:ring-sky-500/30">
                                        <SelectValue placeholder="不归入任何专栏" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[0_12px_40px_-4px_rgba(0,0,0,0.14),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] p-1.5">
                                        <SelectItem value="none" className="text-xs rounded-xl cursor-pointer">
                                            不归入专栏 (独立发布)
                                        </SelectItem>
                                        {myCollections.map((col) => (
                                            <SelectItem key={col.id} value={col.id} className="text-xs rounded-xl cursor-pointer">
                                                {col.name} ({col.post_count ?? 0} 篇)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 柔和消融渐变光缝 */}
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent dark:via-zinc-800/70" />

                            {/* 3. 主页展示封面 (无边框毛玻璃上传区域) */}
                            <div>
                                <PostCoverUploader
                                    coverImage={coverImage}
                                    onChange={setCoverImage}
                                    contentJson={contentJson}
                                    disabled={isSubmitting}
                                    compact={true}
                                />
                            </div>
                        </div>

                        {/* 4. 编辑提示与社区规范 (无边框 Apple 液态毛玻璃手风琴面板) */}
                        <div className="rounded-3xl bg-white/75 hover:bg-white/85 dark:bg-zinc-900/45 dark:hover:bg-zinc-900/55 backdrop-blur-2xl overflow-hidden shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                                className="w-full flex items-center justify-between p-5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <ShieldAlert className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                    修订记录与学术规范
                                </span>
                                <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                        isRulesExpanded ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            <AnimatePresence>
                                {isRulesExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-5 pt-0 text-xs text-muted-foreground space-y-3 leading-relaxed">
                                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/60 to-transparent dark:via-zinc-800/60 mb-3" />
                                            <div className="flex items-start gap-2">
                                                <Clock className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                                <p>
                                                    修改帖子后将自动生成历史修订记录，读者可通过“查看历史”了解论点演变。
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                <p>
                                                    严禁恶意删改学术研讨核心结论或故意引入误导性公式与代码。
                                                </p>
                                            </div>
                                            <div className="pt-2 text-right">
                                                <Link
                                                    href="/rules"
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                                                >
                                                    阅读完整社区公约
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>

            {/* 新建专栏弹窗 */}
            <CreateCollectionDialog
                open={isCreateCollectionOpen}
                onOpenChange={setIsCreateCollectionOpen}
                onSuccess={async (newCol) => {
                    await loadCollectionsData();
                    if (newCol?.id) {
                        setSelectedCollectionId(newCol.id);
                    }
                }}
            />

            {/* 移动端发布配置抽屉 */}
            <MobilePublishSettingsSheet
                isOpen={isMobileSettingsOpen}
                onClose={() => setIsMobileSettingsOpen(false)}
                availableTags={AVAILABLE_TAGS}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                myCollections={myCollections}
                selectedCollectionId={selectedCollectionId}
                onSelectCollection={setSelectedCollectionId}
                onCreateCollection={() => setIsCreateCollectionOpen(true)}
                coverImage={coverImage}
                onCoverChange={setCoverImage}
                isHelpWanted={isHelpWanted}
                onHelpWantedChange={setIsHelpWanted}
            />
        </div>
    );
}

