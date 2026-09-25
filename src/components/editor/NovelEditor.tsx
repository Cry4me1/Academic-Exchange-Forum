"use client";

import { cn } from "@/lib/utils";
import { onDelete, onUpload } from "@/lib/image-upload";
import {
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandItem,
    EditorCommandList,
    EditorContent,
    EditorRoot,
    handleImageDrop, handleImagePaste,
    ImageResizer,
    type JSONContent,
} from "novel";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    extractTitleAndContent,
    insertHtmlIntoEditor,
    isMarkdownText,
    markdownToTiptapHtml,
} from "@/lib/markdown-parser";
import BubbleMenu from "./BubbleMenu";
import TableBubbleMenu from "./TableBubbleMenu";
import AcademicQuickToolbar from "./AcademicQuickToolbar";
import { MobileEditorAccessoryBar } from "./MobileEditorAccessoryBar";
// Apple Liquid Glass Toolbar integration synced
import { defaultExtensions } from "./extensions";
import { SlashAISelector } from "./generative/slash-ai-selector";
import { suggestionItems } from "./slash-command";

interface NovelEditorProps {
    initialValue?: JSONContent;
    onChange?: (value: JSONContent) => void;
    editable?: boolean;
    className?: string;
    contentClassName?: string;
    showToolbar?: boolean;
    toolbarHintRight?: React.ReactNode;
    onTitleExtracted?: (title: string) => void;
}

/**
 * Extract all image URLs from JSONContent
 */
function extractImageUrls(content: JSONContent): Set<string> {
    const urls = new Set<string>();

    function traverse(node: JSONContent) {
        if (node.type === 'image' && node.attrs?.src) {
            urls.add(node.attrs.src);
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    }

    traverse(content);
    return urls;
}

export default function NovelEditor({
    initialValue,
    onChange,
    editable = true,
    className,
    contentClassName,
    showToolbar = true,
    toolbarHintRight,
    onTitleExtracted,
}: NovelEditorProps) {
    const extensions = [...defaultExtensions];

    // Track previous image URLs to detect deletions
    const previousImageUrls = useRef<Set<string>>(new Set());

    // Initialize with images from initial content
    const isInitialized = useRef(false);

    // AI 生成状态监听，用于驱动全域高端静雅边框微晕
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    // 响应式端形态感知：PC 端使用顶部悬浮工具栏，移动端使用底部输入法吸附工具栏，绝不同时存在
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia("(min-width: 768px)");
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsDesktop(e.matches);
        };
        onChange(mql);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const handleStatus = (e: any) => {
            setIsAiGenerating(Boolean(e?.detail?.isGenerating));
        };

        window.addEventListener("ai-generation-status", handleStatus);
        return () => {
            window.removeEventListener("ai-generation-status", handleStatus);
        };
    }, []);

    const handleUpdate = useCallback(({ editor }: { editor: any }) => {
        const json = editor.getJSON();
        const currentUrls = extractImageUrls(json);

        // Initialize on first update
        if (!isInitialized.current) {
            previousImageUrls.current = currentUrls;
            isInitialized.current = true;
            onChange?.(json);
            return;
        }

        // Find deleted images (in previous but not in current)
        previousImageUrls.current.forEach((url) => {
            if (!currentUrls.has(url)) {
                // This image was deleted, remove from storage
                onDelete(url);
            }
        });

        // Update tracked URLs
        previousImageUrls.current = currentUrls;

        onChange?.(json);
    }, [onChange]);

    return (
        <div
            className={cn(
                "novel-editor-container relative w-full flex-1 flex flex-col transition-all duration-700 rounded-xl",
                isAiGenerating &&
                    "ring-1 ring-zinc-400/25 dark:ring-zinc-600/30 shadow-[0_4px_30px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_30px_-8px_rgba(255,255,255,0.025)]",
                className
            )}
            suppressHydrationWarning
        >
            <EditorRoot>
                <EditorContent
                    initialContent={initialValue}
                    extensions={extensions}
                    immediatelyRender={false}
                    slotBefore={
                        showToolbar && isDesktop ? (
                            <AcademicQuickToolbar
                                hintRight={
                                    isAiGenerating ? (
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-sans animate-in fade-in duration-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-300 animate-ping" />
                                            <span>Scholarly 智述推演中...</span>
                                        </div>
                                    ) : (
                                        toolbarHintRight
                                    )
                                }
                            />
                        ) : null
                    }
                    editorProps={{
                        handleDOMEvents: {
                            keydown: (_view, _event) => {
                                // Default slash command behavior is handled by EditorCommand component
                                return false;
                            },
                        },
                        handlePaste: (view, event) => {
                            // 1. 优先检查剪贴板中是否有文件对象（例如在操作系统中直接 Ctrl+C 复制了 .md 文件）
                            const clipboardFiles = Array.from(event.clipboardData?.files || []);
                            const mdFile = clipboardFiles.find((file) =>
                                file.name.endsWith(".md") ||
                                file.name.endsWith(".markdown") ||
                                file.name.endsWith(".mdown") ||
                                file.type === "text/markdown"
                            );

                            if (mdFile) {
                                event.preventDefault();
                                mdFile.text().then((rawText) => {
                                    const { title, content } = extractTitleAndContent(rawText);
                                    if (title) {
                                        onTitleExtracted?.(title);
                                        window.dispatchEvent(
                                            new CustomEvent("scholarly-title-extracted", { detail: { title } })
                                        );
                                    }
                                    const html = markdownToTiptapHtml(content);
                                    const isDocEmpty = view.state.doc.textContent.trim().length === 0;
                                    insertHtmlIntoEditor(view, html, { replaceSelection: !isDocEmpty });
                                    toast.success(`已成功导入并渲染 Markdown 文件：${mdFile.name}`);
                                }).catch((err) => {
                                    console.error("读取 Markdown 文件失败:", err);
                                    toast.error("读取 Markdown 文件失败");
                                });
                                return true;
                            }

                            // 2. 检查是否为图片文件（继续委托图片上传）
                            const hasImage = clipboardFiles.some((f) => f.type.startsWith("image/"));
                            if (hasImage) {
                                return handleImagePaste(view, event, onUpload);
                            }

                            // 3. 检查剪贴板中的纯文本是否为 Markdown 格式
                            const plainText = event.clipboardData?.getData("text/plain");
                            const htmlText = event.clipboardData?.getData("text/html");
                            const isHtmlCodeOrEmpty = !htmlText || /^\s*<pre[\s\S]*<\/pre>\s*$/i.test(htmlText);

                            if (plainText && isHtmlCodeOrEmpty && isMarkdownText(plainText)) {
                                event.preventDefault();
                                const { title, content } = extractTitleAndContent(plainText);
                                if (title) {
                                    onTitleExtracted?.(title);
                                    window.dispatchEvent(
                                        new CustomEvent("scholarly-title-extracted", { detail: { title } })
                                    );
                                }
                                const html = markdownToTiptapHtml(content);
                                const isDocEmpty = view.state.doc.textContent.trim().length === 0;
                                insertHtmlIntoEditor(view, html, { replaceSelection: !isDocEmpty });
                                toast.success("已自动识别并渲染 Markdown 格式内容");
                                return true;
                            }

                            return false;
                        },
                        handleDrop: (view, event, _slice, moved) => {
                            // 1. 优先检查拖入的文件是否有 Markdown 文件
                            const files = Array.from(event.dataTransfer?.files || []);
                            const mdFile = files.find((file) =>
                                file.name.endsWith(".md") ||
                                file.name.endsWith(".markdown") ||
                                file.name.endsWith(".mdown") ||
                                file.type === "text/markdown"
                            );

                            if (mdFile) {
                                event.preventDefault();
                                mdFile.text().then((rawText) => {
                                    const { title, content } = extractTitleAndContent(rawText);
                                    if (title) {
                                        onTitleExtracted?.(title);
                                        window.dispatchEvent(
                                            new CustomEvent("scholarly-title-extracted", { detail: { title } })
                                        );
                                    }
                                    const html = markdownToTiptapHtml(content);
                                    const isDocEmpty = view.state.doc.textContent.trim().length === 0;
                                    insertHtmlIntoEditor(view, html, { replaceSelection: !isDocEmpty });
                                    toast.success(`已成功导入并渲染 Markdown 文件：${mdFile.name}`);
                                }).catch((err) => {
                                    console.error("拖入 Markdown 文件读取失败:", err);
                                    toast.error("读取 Markdown 文件失败");
                                });
                                return true;
                            }

                            // 2. 图片拖拽
                            return handleImageDrop(view, event, moved, onUpload);
                        },
                        attributes: {
                            class: cn(
                                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full pl-4 pr-3 sm:pl-8 sm:pr-4 py-4 pb-24 md:pb-6 flex-1 min-h-[420px] h-full",
                                contentClassName
                            ),
                        },
                        editable: () => editable,
                    }}
                    onUpdate={handleUpdate}
                    className="w-full flex-1 flex flex-col"
                >
                    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
                        <EditorCommandEmpty className="px-2 text-muted-foreground">
                            没有找到命令
                        </EditorCommandEmpty>
                        <EditorCommandList>
                            {suggestionItems.map((item) => (
                                <EditorCommandItem
                                    key={item.title}
                                    value={item.title}
                                    onCommand={(val) => item.command?.(val)}
                                    className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </EditorCommandItem>
                            ))}
                        </EditorCommandList>
                    </EditorCommand>
                    <ImageResizer />
                    <BubbleMenu />
                    <TableBubbleMenu />
                    <SlashAISelector />
                    {/* 移动端专属键盘附件快捷工具栏：仅在移动端挂载 */}
                    {!isDesktop && <MobileEditorAccessoryBar />}
                </EditorContent>
            </EditorRoot>
        </div>
    );
}
