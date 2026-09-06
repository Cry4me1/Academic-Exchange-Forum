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
import { useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import BubbleMenu from "./BubbleMenu";
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
import type * as Y from "yjs";

interface NovelCollabEditorProps {
    ydoc: Y.Doc;
    awarenessProvider: { awareness: any };
    currentUser: { name: string; color: string };
    onUpdate?: (value: JSONContent) => void;
}

/**
 * 基于 Novel 的协作编辑器
 * 复用发帖页面的全部 UI：代码块语言选择、slash 命令、BubbleMenu、图片上传等
 * 同时注入 Yjs Collaboration + CollaborationCursor 扩展
 */
export default function NovelCollabEditor({
    ydoc,
    awarenessProvider,
    currentUser,
    onUpdate,
}: NovelCollabEditorProps) {
    // 合并默认扩展（禁用 history）+ 协作扩展
    const extensions = useMemo(() => {
        const baseExtensions = createExtensions({
            disableHistory: true,
            placeholder: "输入 '/' 唤起命令，开始协作笔记...",
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
                    cursor.classList.add("collaboration-cursor__caret");
                    cursor.style.borderColor = user.color;

                    const label = document.createElement("div");
                    label.classList.add("collaboration-cursor__label");
                    label.style.backgroundColor = user.color;
                    label.textContent = user.name;
                    cursor.appendChild(label);

                    return cursor;
                },
            }),
        ];
    }, [ydoc, awarenessProvider, currentUser]);

    return (
        <div className="novel-editor-container relative w-full h-full">
            <EditorRoot>
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
                            class: "prose prose-sm dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-4 min-h-[200px]",
                        },
                    }}
                    onUpdate={({ editor }) => {
                        onUpdate?.(editor.getJSON());
                    }}
                    className="w-full h-full"
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
                                        <p className="font-medium">
                                            {item.title}
                                        </p>
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
                    <SlashAISelector />
                </EditorContent>
            </EditorRoot>
        </div>
    );
}
