"use client";

import { CreateCollectionDialog } from "@/components/collections";
import NovelEditor from "@/components/editor/NovelEditor";
import { PostCoverUploader } from "@/components/editor/PostCoverUploader";
import PeerReviewPanel from "@/components/editor/peer-review-panel";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type JSONContent } from "novel";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
        <div className="min-h-screen bg-background text-foreground selection:bg-zinc-200 dark:selection:bg-zinc-800">
            {/* 顶部轻量操作栏 Header Bar */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
                <div className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-14">
                        {/* 左侧：返回 + 自动保存云状态 */}
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg"
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
                                            className="ml-1 p-1 hover:text-destructive rounded transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[11px] text-zinc-400">新学术研讨草稿</span>
                                )}
                            </div>
                        </div>

                        {/* 右侧：设为求助微型 Toggle + 高对比度全局核心 CTA 发布按钮 */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-xs">
                                <label
                                    htmlFor="help-wanted-toggle"
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
                                    id="help-wanted-toggle"
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
                                        发布中...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                                        发布帖子
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 双栏沉浸式主体区域（全屏 80%~90% 开阔工作台） */}
            <main className="w-full max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* 左侧 75% 沉浸写作画布 (Canvas) */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
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
                                    <span>AI 辅助写作可用</span>
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

                        {/* AI 同行评审辅助面板 (Reviewer #2 · DeepSeek) */}
                        <AnimatePresence>
                            {title.trim() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <PeerReviewPanel
                                        content={contentJson}
                                        title={title}
                                        tags={selectedTags}
                                        isAuthor={true}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 右侧 25%~30% 发布元信息侧边栏 (Right Sidebar) */}
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
                                        请从下方点击选择 1~3 个学科分类
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

                                {myCollections.length === 0 && (
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                        专栏可将同类研讨系列化整理并展示在主页
                                    </p>
                                )}
                            </div>

                            <hr className="border-zinc-100 dark:border-zinc-800/80" />

                            {/* 3. 主页展示封面 (16:9 紧凑虚线框) */}
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

                        {/* 4. 发布提示与社区规范 (折叠手风琴面板 Accordion) */}
                        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card/40 backdrop-blur-sm overflow-hidden shadow-xs">
                            <button
                                type="button"
                                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                                className="w-full flex items-center justify-between p-4 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-muted/30 transition-colors"
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
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 text-xs text-muted-foreground space-y-2.5 border-t border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                                            <div className="flex items-start gap-2 pt-2">
                                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                <p>
                                                    <strong className="text-foreground">版权责任</strong>：用户上传配图与引文需由本人承担知识产权法律责任，严禁抄袭与侵权。
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Sigma className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <p>
                                                    <strong className="text-foreground">LaTeX 公式</strong>：输入 <code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">$E=mc^2$</code> 或使用斜杠菜单快捷插入。
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <FileCode2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <p>
                                                    <strong className="text-foreground">代码与图表</strong>：支持主流语言语法高亮及 Mermaid 流程图与时序图渲染。
                                                </p>
                                            </div>
                                            <div className="pt-1 text-right">
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
        </div>
    );
}

