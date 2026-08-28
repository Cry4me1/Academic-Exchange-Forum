"use client";

import { CreateCollectionDialog } from "@/components/collections";
import NovelEditor from "@/components/editor/NovelEditor";
import { PostCoverUploader } from "@/components/editor/PostCoverUploader";
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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type JSONContent } from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updatePost } from "../../actions";

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
            {/* 顶部轻量操作栏 Header Bar */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
                <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-14">
                        {/* 左侧：返回 + 编辑/草稿状态 */}
                        <div className="flex items-center gap-3">
                            <Link href={`/posts/${postId}`}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg"
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
                                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                                        已加载本地草稿
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* 右侧：设为求助微型 Toggle + 高对比度全局核心 CTA 保存按钮 */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                                <label
                                    htmlFor="help-wanted-edit-toggle"
                                    className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer flex items-center gap-1"
                                >
                                    <HelpCircle
                                        className={`w-3.5 h-3.5 ${isHelpWanted ? "text-amber-500" : "text-zinc-400"}`}
                                        strokeWidth={1.75}
                                    />
                                    <span className={isHelpWanted ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                                        {isHelpWanted ? "高亮求助" : "设为求助"}
                                    </span>
                                </label>
                                <Switch
                                    id="help-wanted-edit-toggle"
                                    size="sm"
                                    checked={isHelpWanted}
                                    onCheckedChange={setIsHelpWanted}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="h-9 px-5 rounded-full text-xs sm:text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm gap-1.5 transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
                                        保存修改
                                    </>
                                )}
                            </Button>
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

                        {/* 标题输入框：大字号、无边框极简 Input */}
                        <div className="space-y-2 pt-1">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="输入研讨标题..."
                                maxLength={100}
                                className="w-full bg-transparent text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight leading-snug text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 border-none outline-none focus:outline-none focus:ring-0 p-0"
                            />
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span>支持 Markdown、LaTeX 数学公式与代码高亮</span>
                                <span>{title.length}/100</span>
                            </div>
                        </div>

                        {/* 编辑器区域：纯净开阔画布 */}
                        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card/40 backdrop-blur-xs p-3 sm:p-6 lg:p-8 shadow-xs flex flex-col min-h-[680px] transition-all">
                            {/* 快捷斜杠提示条 */}
                            <div className="flex items-center justify-between px-2 py-2 mb-3 border-b border-zinc-100 dark:border-zinc-800/80 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/60">
                                        /
                                    </span>
                                    <span>输入斜杠唤起学术环境、公式与代码面板</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                    <span>修订版本自动归档</span>
                                </div>
                            </div>

                            <NovelEditor
                                initialValue={contentJson}
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

                    {/* 右侧 25%~30% 发布配置侧边栏 */}
                    <div className="lg:col-span-4 xl:col-span-3 space-y-5 lg:sticky lg:top-20">
                        {/* 发布元数据配置卡片 */}
                        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card/60 backdrop-blur-sm p-5 shadow-xs space-y-6">
                            {/* 1. 标签选择器 */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                        标签 <span className="text-destructive">*</span>
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">
                                        已选 {selectedTags.length}/3
                                    </span>
                                </div>

                                {/* 已选标签胶囊 */}
                                {selectedTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                                        {selectedTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="gap-1 pr-1 py-1 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer rounded-lg transition-all"
                                                onClick={() => handleTagToggle(tag)}
                                            >
                                                {tag}
                                                <X className="h-3 w-3 hover:scale-110" />
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-zinc-400 italic">
                                        请选择 1~3 个学科分类
                                    </p>
                                )}

                                {/* 可选标签快速点选 */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {AVAILABLE_TAGS.filter((t) => !selectedTags.includes(t)).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleTagToggle(tag)}
                                            disabled={selectedTags.length >= 3}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-2.5 h-2.5" strokeWidth={2} />
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-zinc-100 dark:border-zinc-800/80" />

                            {/* 2. 归入专栏 (重构为标准 Select 下拉选择器) */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                        归入专栏
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateCollectionOpen(true)}
                                        className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5 transition-colors"
                                    >
                                        <Plus className="h-3 w-3" strokeWidth={1.75} />
                                        新建专栏
                                    </button>
                                </div>

                                <Select
                                    value={selectedCollectionId}
                                    onValueChange={setSelectedCollectionId}
                                >
                                    <SelectTrigger className="w-full h-9 rounded-xl border-zinc-200/80 dark:border-zinc-800 bg-background text-xs">
                                        <SelectValue placeholder="不归入任何专栏" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-zinc-200/80 dark:border-zinc-800">
                                        <SelectItem value="none" className="text-xs">
                                            不归入专栏 (独立发布)
                                        </SelectItem>
                                        {myCollections.map((col) => (
                                            <SelectItem key={col.id} value={col.id} className="text-xs">
                                                {col.name} ({col.post_count ?? 0} 篇)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <hr className="border-zinc-100 dark:border-zinc-800/80" />

                            {/* 3. 主页展示封面 */}
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

                        {/* 4. 编辑提示与社区规范 (手风琴) */}
                        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card/40 backdrop-blur-sm overflow-hidden shadow-xs">
                            <button
                                type="button"
                                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                                className="w-full flex items-center justify-between p-4 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-muted/30 transition-colors"
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
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 text-xs text-muted-foreground space-y-2.5 border-t border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                                            <div className="flex items-start gap-2 pt-2">
                                                <Clock className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                                <p>
                                                    修改帖子后将自动生成历史修订记录，读者可通过“查看历史”了解论点演变。
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                <p>
                                                    用户上传配图需由本人承担法律责任，严禁上传侵权或违规图片。
                                                </p>
                                            </div>
                                            <div className="pt-1 text-right">
                                                <Link
                                                    href="/rules"
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                                                >
                                                    查看社区规则
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
        </div>
    );
}

