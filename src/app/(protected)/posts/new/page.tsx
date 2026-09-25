"use client";

import { CreateCollectionDialog } from "@/components/collections";
import { LiquidTagSelector } from "@/components/posts/LiquidTagSelector";
import dynamic from "next/dynamic";
import { PostCoverUploader } from "@/components/editor/PostCoverUploader";
import { MobilePublishSettingsSheet } from "@/components/editor/MobilePublishSettingsSheet";

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
import { getMyCollections, syncPostCollections } from "@/app/(protected)/collections/actions";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    BookOpen,
    Cloud,
    HelpCircle,
    Plus,
    Send,
    Sparkles,
    Tag,
    X,
    ChevronDown,
    ShieldAlert,
    FileCode2,
    Sigma,
    ExternalLink,
    Trash2,
    SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type JSONContent } from "novel";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { extractTextFromJSON } from "@/lib/extract-text";
import { createPost } from "../actions";

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

const DRAFT_STORAGE_KEY = "scholarly_new_post_draft_v1";

export default function NewPostPage() {
    const router = useRouter();
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
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
    const [isRulesExpanded, setIsRulesExpanded] = useState(false);
    const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

    // 实时统计正文纯文本字符数与预估阅读时长
    const stats = useMemo(() => {
        if (!contentJson) return { chars: 0, readingTime: 1 };
        const raw = extractTextFromJSON(contentJson);
        const chars = raw.replace(/\s+/g, "").length;
        const readingTime = Math.max(1, Math.ceil(chars / 350));
        return { chars, readingTime };
    }, [contentJson]);

    const loadCollectionsData = useCallback(async () => {
        const { collections } = await getMyCollections();
        setMyCollections(collections || []);
    }, []);

    // 页面加载：恢复未发布的本地草稿
    useEffect(() => {
        loadCollectionsData();

        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.tags) setSelectedTags(parsed.tags);
                if (parsed.isHelpWanted !== undefined) setIsHelpWanted(parsed.isHelpWanted);
                if (parsed.coverImage) setCoverImage(parsed.coverImage);
                if (parsed.collectionId) setSelectedCollectionId(parsed.collectionId);
                if (parsed.contentJson) {
                    setContentJson(parsed.contentJson);
                    setContent("valid");
                }
                if (parsed.updatedAt) {
                    const d = new Date(parsed.updatedAt);
                    setLastSavedTime(
                        `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
                    );
                }
                toast.info("已自动恢复您上次未发布的草稿内容");
            }
        } catch (e) {
            console.error("Failed to restore draft from localStorage:", e);
        }

        // 监听外部 Markdown 导入或粘贴触发的标题自动提取
        const handleTitleExtracted = (e: any) => {
            const extracted = e?.detail?.title;
            if (extracted) {
                setTitle((prev) => (prev.trim() ? prev : extracted));
            }
        };
        window.addEventListener("scholarly-title-extracted", handleTitleExtracted);

        return () => {
            window.removeEventListener("scholarly-title-extracted", handleTitleExtracted);
        };
    }, [loadCollectionsData]);

    // 自动暂存草稿到 localStorage (1s 防抖)
    useEffect(() => {
        if (!title && !contentJson && selectedTags.length === 0 && !coverImage) return;

        const timer = setTimeout(() => {
            try {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                localStorage.setItem(
                    DRAFT_STORAGE_KEY,
                    JSON.stringify({
                        title,
                        contentJson,
                        coverImage,
                        tags: selectedTags,
                        isHelpWanted,
                        collectionId: selectedCollectionId,
                        updatedAt: Date.now(),
                    })
                );
                setLastSavedTime(timeStr);
            } catch (e) {
                console.error("Failed to save draft:", e);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [title, contentJson, coverImage, selectedTags, isHelpWanted, selectedCollectionId]);

    const handleClearDraft = () => {
        if (confirm("确定要清空当前草稿并重置所有内容吗？")) {
            try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch (e) {
                console.error(e);
            }
            setTitle("");
            setContent("");
            setContentJson(undefined);
            setCoverImage(null);
            setSelectedTags([]);
            setIsHelpWanted(false);
            setSelectedCollectionId("none");
            setLastSavedTime(null);
            toast.success("草稿已清空");
        }
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
            toast.error("请至少选择一个专业标签");
            return;
        }

        if (!contentJson) {
            toast.error("内容格式解析异常，请重试");
            return;
        }

        setIsSubmitting(true);

        try {
            const cleanedContent = JSON.parse(JSON.stringify(contentJson));

            const result = await createPost({
                title: title.trim(),
                content: cleanedContent,
                tags: selectedTags,
                cover_image: coverImage,
                is_help_wanted: isHelpWanted,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            // 清理本地草稿
            try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch (e) {
                console.error("Clear draft error:", e);
            }

            // 同步帖子的专栏归属
            if (result.data?.id && selectedCollectionId && selectedCollectionId !== "none") {
                await syncPostCollections(result.data.id, [selectedCollectionId]).catch((err) => {
                    console.error("Sync post collections error:", err);
                });
            }

            if (result.reviewStatus === "pending") {
                toast.warning("帖子已提交！由于包含学术敏感探讨，已进入人工审核队列，审核通过后将对全站公开展示。", {
                    duration: 5000,
                });
            } else {
                toast.success("发布成功！");
            }

            router.push(`/posts/${result.data?.id}`);
        } catch (error) {
            toast.error("发布失败，请检查网络后重试");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-background text-foreground selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 顶部微弱环境放射渐变微光 (Magic UI / Linear 风格质感微光晕) */}
            <div className="pointer-events-none fixed inset-0 -z-10 flex justify-center overflow-hidden">
                <div className="w-[1100px] h-[360px] bg-gradient-to-b from-indigo-500/8 via-primary/5 to-transparent blur-3xl opacity-60 dark:opacity-30 -top-20 transform-gpu" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-300/40 dark:via-zinc-700/40 to-transparent" />
            </div>

            {/* 顶部轻量操作栏 Header Bar */}
            {/* 顶部轻量操作栏 Header Bar：无边框 Apple Liquid Glass 流体透光 */}
            <header className="sticky top-0 z-40 bg-background/75 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)] transition-colors">
                <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-14">
                        {/* 左侧：返回 + 自动保存云状态 */}
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full bg-zinc-200/30 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all cursor-pointer border-0"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    返回
                                </Button>
                            </Link>

                            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                                {lastSavedTime ? (
                                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                                        <span>草稿已自动保存于 {lastSavedTime}</span>
                                        <button
                                            type="button"
                                            onClick={handleClearDraft}
                                            title="清空当前草稿"
                                            className="ml-1 p-1 hover:text-destructive rounded-full hover:bg-destructive/10 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[11px] text-zinc-400">新学术研讨草稿</span>
                                )}
                            </div>
                        </div>

                        {/* 右侧：移动端专属配置微胶囊 + 桌面设为求助 Toggle + 高阶 Apple Liquid Glass 全局核心 CTA 发布按钮 */}
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

                            {/* 桌面端设为求助 Toggle */}
                            <div
                                className={`hidden lg:flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full backdrop-blur-xl transition-all duration-300 select-none ${
                                    isHelpWanted
                                        ? "bg-amber-500/[0.14] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_12px_rgba(245,158,11,0.22)] dark:bg-amber-500/[0.18] dark:shadow-[inset_0_1px_0.5px_rgba(251,191,36,0.35),0_2px_16px_rgba(245,158,11,0.25)]"
                                        : "bg-zinc-200/40 hover:bg-zinc-200/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.03)] dark:bg-white/[0.06] dark:hover:bg-white/[0.09] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_2px_8px_-2px_rgba(0,0,0,0.3)]"
                                }`}
                            >
                                <label
                                    htmlFor="help-wanted-toggle"
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
                                    id="help-wanted-toggle"
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
                                            <span className="relative z-10">发布中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-3.5 w-3.5 relative z-10 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                                            <span className="relative z-10">发布帖子</span>
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 双栏沉浸式主体区域（全屏 80%~90% 开阔工作台） */}
            <main className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* 左侧 75% 沉浸写作画布 (Canvas: Notion / Ghost 风格，大标题与正文共享纯净底色) */}
                    <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
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

                        {/* 编辑器区域：去除外层灰色大线框，大标题与正文浑然一体 */}
                        <div className="w-full flex-1 flex flex-col min-h-[580px]">
                            <NovelEditor
                                initialValue={contentJson}
                                toolbarHintRight={<span>AI 辅助写作可用</span>}
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

                        {/* 极简沉浸式状态底栏（Status Bar）：字符数、阅读预估用时与实时暂存状态 */}
                        <div className="flex items-center justify-between pl-4 sm:pl-8 pr-4 py-3 text-xs text-muted-foreground border-t border-border/40 mt-4 select-none pb-24 md:pb-4">
                            <div className="flex items-center gap-3 text-[11px]">
                                <span>
                                    字数：<strong className="text-foreground font-mono font-medium">{stats.chars}</strong> 字符
                                </span>
                                <span className="text-border">·</span>
                                <span>
                                    预估阅读：<strong className="text-foreground font-mono font-medium">{stats.readingTime}</strong> 分钟
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                                {lastSavedTime ? (
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                        <Cloud className="w-3 h-3" />
                                        本地草稿已同步于 {lastSavedTime}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground/50">实时防丢保护已就绪</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧 25%~30% 发布元信息侧边栏 (Right Sidebar, 仅在桌面端 lg 及以上展示，移动端由右上角配置胶囊唤起抽屉) */}
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

                                {myCollections.length === 0 && (
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        专栏可将同类研讨系列化整理并展示在主页
                                    </p>
                                )}
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

                        {/* 4. 发布提示与社区规范 (无边框 Apple 液态毛玻璃手风琴面板) */}
                        <div className="rounded-3xl bg-white/75 hover:bg-white/85 dark:bg-zinc-900/45 dark:hover:bg-zinc-900/55 backdrop-blur-2xl overflow-hidden shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                                className="w-full flex items-center justify-between p-5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <ShieldAlert className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                    发布提示与学术规范
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
                                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                <p>
                                                    <strong className="text-foreground">版权责任</strong>：用户上传配图与引文需由本人承担知识产权法律责任，严禁抄袭与侵权。
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Sigma className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <p>
                                                    <strong className="text-foreground">LaTeX 公式</strong>：输入 <code className="text-[11px] bg-muted/60 px-1.5 py-0.5 rounded-md font-mono">$E=mc^2$</code> 或使用斜杠菜单快捷插入。
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <FileCode2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <p>
                                                    <strong className="text-foreground">代码与图表</strong>：支持主流语言语法高亮及 Mermaid 流程图与时序图渲染。
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

