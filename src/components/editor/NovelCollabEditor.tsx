"use client";

import { onUpload } from "@/lib/image-upload";
import {
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandItem,
    EditorCommandList,
    EditorContent,
    EditorRoot,
    handleImageDrop,
    handleImagePaste,
    ImageResizer,
    type JSONContent,
} from "novel";
import { useEffect, useMemo, useRef, useState } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import BubbleMenu from "./BubbleMenu";
import TableBubbleMenu from "./TableBubbleMenu";
import AcademicQuickToolbar from "./AcademicQuickToolbar";
import { MobileEditorAccessoryBar } from "./MobileEditorAccessoryBar";
import { SlashAISelector } from "./generative/slash-ai-selector";
import { createExtensions } from "./extensions";
import { toast } from "sonner";
import {
    extractTitleAndContent,
    insertHtmlIntoEditor,
    isMarkdownText,
    markdownToTiptapHtml,
} from "@/lib/markdown-parser";
import { suggestionItems } from "./slash-command";
import { cn } from "@/lib/utils";
import type * as Y from "yjs";

interface NovelCollabEditorProps {
    ydoc: Y.Doc;
    awarenessProvider: { awareness: any };
    currentUser: { name: string; color: string };
    onUpdate?: (value: JSONContent) => void;
    className?: string;
    contentClassName?: string;
    showToolbar?: boolean;
}

/**
 * 基于 Novel 与 Yjs 的实时协同现代学术编辑器
 * 完整复用论坛主编辑器的全部高级特性：
 * - AcademicQuickToolbar（定理环境、算法步进、MathPalette 公式推导、图表渲染、代码块）
 * - 划选气泡菜单与表格浮层
 * - 斜杠命令 (Slash Command) 与 AI 辅助
 * - 智能 Markdown 与图片拖拽解析
 * - 多人实时光标渲染与冲突免疫（CRDT）
 */
export default function NovelCollabEditor({
    ydoc,
    awarenessProvider,
    currentUser,
    onUpdate,
    className,
    contentClassName,
    showToolbar = true,
}: NovelCollabEditorProps) {
    const [isDesktop, setIsDesktop] = useState(false);
    const editorRef = useRef<any>(null);

    useEffect(() => {
        const mql = window.matchMedia("(min-width: 768px)");
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsDesktop(e.matches);
        };
        onChange(mql);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    // 监听外部学术模板与内容一键注入事件（如文献评议、研讨提纲等，彻底取代假剪贴板操作）
    useEffect(() => {
        const handleInsertContent = (e: Event) => {
            const customEvent = e as CustomEvent<{
                markdown?: string;
                html?: string;
                tip?: string;
                appendToEnd?: boolean;
            }>;
            const editor = editorRef.current;
            if (!editor || !customEvent.detail) return;

            const { markdown, html, tip, appendToEnd = true } = customEvent.detail;
            try {
                if (html) {
                    insertHtmlIntoEditor(editor.view, html, { replaceSelection: false, appendToEnd });
                } else if (markdown) {
                    const parsedHtml = markdownToTiptapHtml(markdown);
                    insertHtmlIntoEditor(editor.view, parsedHtml, { replaceSelection: false, appendToEnd });
                }
                editor.commands.focus("end");
                if (tip) {
                    toast.success(tip);
                }
            } catch (err) {
                console.error("[NovelCollabEditor] 注入内容失败:", err);
                toast.error("插入内容失败，请在编辑器正文中点击后重试");
            }
        };

        window.addEventListener("collab-editor-insert-content", handleInsertContent);
        return () => {
            window.removeEventListener("collab-editor-insert-content", handleInsertContent);
        };
    }, []);

    // 合并基础扩展（禁用内置 history，由 Yjs 接管协作 undo/redo）+ 协同网络扩展
    const extensions = useMemo(() => {
        const baseExtensions = createExtensions({
            disableHistory: true,
            placeholder: "输入 '/' 唤起学术命令，开始协同推导演练与研讨记录...",
        });

        return [
            ...baseExtensions,
            // Yjs 文档协作
            Collaboration.configure({
                document: ydoc,
            }),
            // 协作光标
            CollaborationCursor.configure({
                provider: awarenessProvider,
                user: currentUser,
                render: (user: { name: string; color: string }) => {
                    const cursor = document.createElement("span");
                    cursor.classList.add("collaboration-cursor__caret", "ProseMirror-yjs-cursor");
                    cursor.style.borderColor = user.color || "#7c3aed";

                    const label = document.createElement("div");
                    label.classList.add("collaboration-cursor__label");
                    label.style.backgroundColor = user.color || "#7c3aed";
                    label.textContent = user.name || "协同学者";

                    // 插入零宽字符撑开光标物理行高，防止空行折叠
                    const space1 = document.createTextNode("\u2060");
                    const space2 = document.createTextNode("\u2060");
                    cursor.appendChild(space1);
                    cursor.appendChild(label);
                    cursor.appendChild(space2);

                    return cursor;
                },
            }),
        ];
    }, [ydoc, awarenessProvider, currentUser]);

    return (
        <div
            className={cn(
                "novel-editor-container relative w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden bg-background",
                className
            )}
            suppressHydrationWarning
        >
            <EditorRoot>
                {/* 1. 物理顶置学术工具栏：紧贴分栏顶端，绝不参与正文滚动，彻底解决悬浮与遮挡 */}
                {showToolbar && isDesktop && (
                    <div className="flex-shrink-0 z-20 w-full">
                        <AcademicQuickToolbar
                            variant="docked"
                            sticky={false}
                            hintRight={
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] border-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>实时协同</span>
                                </div>
                            }
                        />
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/70 dark:via-zinc-800/70 to-transparent" />
                    </div>
                )}

                {/* 2. 独立正文滚动视口：自带有足够的顶部 padding，确保第一行与 Yjs 协同光标标签 100% 舒展展现 */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-5">
                    <EditorContent
                        extensions={extensions}
                        immediatelyRender={false}
                    editorProps={{
                        handleDOMEvents: {
                            keydown: (_view, _event) => {
                                return false;
                            },
                        },
                        handlePaste: (view, event) => {
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
                                    const { content } = extractTitleAndContent(rawText);
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

                            const hasImage = clipboardFiles.some((f) => f.type.startsWith("image/"));
                            if (hasImage) {
                                return handleImagePaste(view, event, onUpload);
                            }

                            const plainText = event.clipboardData?.getData("text/plain");
                            const htmlText = event.clipboardData?.getData("text/html");
                            const isHtmlCodeOrEmpty = !htmlText || /^\s*<pre[\s\S]*<\/pre>\s*$/i.test(htmlText);

                            if (plainText && isHtmlCodeOrEmpty && isMarkdownText(plainText)) {
                                event.preventDefault();
                                const { content } = extractTitleAndContent(plainText);
                                const html = markdownToTiptapHtml(content);
                                const isDocEmpty = view.state.doc.textContent.trim().length === 0;
                                insertHtmlIntoEditor(view, html, { replaceSelection: !isDocEmpty });
                                toast.success("已自动识别并渲染 Markdown 格式内容");
                                return true;
                            }

                            return false;
                        },
                        handleDrop: (view, event, _slice, moved) => {
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
                                    const { content } = extractTitleAndContent(rawText);
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

                            return handleImageDrop(view, event, moved, onUpload);
                        },
                        attributes: {
                            class: cn(
                                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full min-h-[360px] pb-24",
                                contentClassName
                            ),
                        },
                    }}
                    onCreate={({ editor }) => {
                        editorRef.current = editor;
                        onUpdate?.(editor.getJSON());
                    }}
                    onUpdate={({ editor }) => {
                        editorRef.current = editor;
                        onUpdate?.(editor.getJSON());
                    }}
                    className="w-full flex-1 flex flex-col"
                >
                    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-2xl border-0 bg-white/80 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_-6px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.6),inset_0_1px_0.5px_rgba(255,255,255,0.1)] px-1.5 py-2 transition-all">
                        <EditorCommandEmpty className="px-3 py-2 text-xs text-muted-foreground font-medium">
                            没有找到匹配的学术命令
                        </EditorCommandEmpty>
                        <EditorCommandList>
                            {suggestionItems.map((item) => (
                                <EditorCommandItem
                                    key={item.title}
                                    value={item.title}
                                    onCommand={(val) => item.command?.(val)}
                                    className="flex w-full items-center space-x-2.5 rounded-xl px-2.5 py-1.5 text-left text-sm hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 aria-selected:bg-zinc-100/80 dark:aria-selected:bg-zinc-800/70 cursor-pointer transition-colors"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] border-0 text-foreground">
                                        {item.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
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
                    {/* 移动端专属键盘附件快捷工具栏 */}
                    {!isDesktop && <MobileEditorAccessoryBar />}
                </EditorContent>
                </div>
            </EditorRoot>
        </div>
    );
}
