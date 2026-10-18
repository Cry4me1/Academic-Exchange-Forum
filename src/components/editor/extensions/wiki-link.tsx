import { mergeAttributes, Node } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
    useCallback,
} from "react";
import { cn } from "@/lib/utils";
import { PluginKey } from "prosemirror-state";
import { Paperclip } from "lucide-react";

// ============================================================
// 1. WikiLink Suggestion Plugin Key
// ============================================================
const wikiLinkPluginKey = new PluginKey("wikiLink");

// ============================================================
// 2. WikiLink Search Result Interface
// ============================================================
export interface WikiLinkItem {
    postId: string;
    title: string;
}

// ============================================================
// 3. WikiLink Inline Node
// ============================================================
export const WikiLink = Node.create({
    name: "wikiLink",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            postId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-post-id"),
                renderHTML: (attributes) => ({
                    "data-post-id": attributes.postId,
                }),
            },
            title: {
                default: null,
                parseHTML: (element) => {
                    const raw = element.textContent?.trim() ?? "";
                    return raw.replace(/^[📎🔗\s]+/, "");
                },
                renderHTML: () => ({}),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "a[data-wiki-link]",
            },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            "a",
            mergeAttributes(HTMLAttributes, {
                "data-wiki-link": "",
                href: `/posts/${node.attrs.postId}`,
                class: "wiki-link",
            }),
            node.attrs.title,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(WikiLinkNodeView);
    },

    addOptions() {
        return {
            suggestion: {
                char: "[[",
                pluginKey: wikiLinkPluginKey,
                findSuggestionMatch: ({ $position }: any) => {
                    const text = $position.parent.textBetween(
                        0,
                        $position.parentOffset,
                        null,
                        "\ufffc"
                    );
                    // 匹配 [[ 且后面可以跟任意非 ] 的字符（支持中文）
                    const regex = /\[\[([^\]]*)$/;
                    const match = regex.exec(text);
                    if (match) {
                        const from = $position.pos - match[0].length;
                        const to = $position.pos;
                        return {
                            range: { from, to },
                            query: match[1],
                            text: match[0],
                        };
                    }
                    return null;
                },
                items: async ({ query }: { query: string }) => {
                    try {
                        const res = await fetch(
                            `/api/posts/search?q=${encodeURIComponent(query || "")}`,
                        );
                        if (!res.ok) return [];
                        const data = await res.json();
                        return (data ?? []).map((item: any) => ({
                            postId: item.id ?? item.postId,
                            title: item.title,
                        })) as WikiLinkItem[];
                    } catch {
                        return [];
                    }
                },
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: any;
                    range: any;
                    props: WikiLinkItem;
                }) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange({ from: range.from, to: range.to })
                        .insertContentAt(range.from, [
                            {
                                type: "wikiLink",
                                attrs: {
                                    postId: props.postId,
                                    title: props.title,
                                },
                            },
                            { type: "text", text: " " },
                        ])
                        .run();
                },
                render: renderWikiLinkItems,
            } as Partial<SuggestionOptions<WikiLinkItem>>,
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

// ============================================================
// 4. React Node View — inline badge with 📎 icon
// ============================================================
function WikiLinkNodeView({ node }: { node: any }) {
    const { postId, title } = node.attrs;
    const cleanTitle = (title || "引用帖子").replace(/^[📎🔗\s]+/, "");

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            window.open(`/posts/${postId}`, "_blank");
        },
        [postId],
    );

    return (
        <NodeViewWrapper as="span" className="inline-block align-middle mx-1">
            <a
                href={`/posts/${postId}`}
                onClick={handleClick}
                data-wiki-link=""
                data-post-id={postId}
                className={cn(
                    "group inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                    "text-xs font-medium no-underline cursor-pointer border-0",
                    "bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700/90",
                    "text-foreground/90 hover:text-primary backdrop-blur-xl",
                    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.06)]",
                    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.35)]",
                    "hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_0_12px_rgba(14,165,233,0.18)]",
                    "dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_0_16px_rgba(14,165,233,0.25)]",
                    "transition-all duration-200 active:scale-[0.98]"
                )}
            >
                <span className="w-4 h-4 rounded-full bg-sky-500/10 dark:bg-sky-400/15 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.15)]">
                    <Paperclip className="w-2.5 h-2.5" />
                </span>
                <span className="truncate max-w-[280px] sm:max-w-[360px]">{cleanTitle}</span>
            </a>
        </NodeViewWrapper>
    );
}

// ============================================================
// 5. Suggestion Dropdown List — forwardRef component
// ============================================================
const WikiLinkList = forwardRef<any, any>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex(
                    (selectedIndex + props.items.length - 1) %
                        props.items.length,
                );
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex(
                    (selectedIndex + 1) % props.items.length,
                );
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) {
        return (
            <div className="flex flex-col overflow-hidden rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl text-popover-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_16px_48px_-4px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_16px_48px_-4px_rgba(0,0,0,0.5)] p-3">
                <span className="text-xs text-muted-foreground px-2 py-1 font-medium">
                    输入关键词搜索帖子…
                </span>
            </div>
        );
    }

    return (
        <div className="flex z-50 flex-col overflow-hidden rounded-2xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl text-popover-foreground shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_16px_48px_-4px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_16px_48px_-4px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 p-1.5 min-w-[260px]">
            <div className="max-h-[300px] overflow-y-auto p-1 space-y-0.5">
                {props.items.map((item: WikiLinkItem, index: number) => (
                    <button
                        key={item.postId}
                        type="button"
                        className={cn(
                            "flex w-full select-none items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-all duration-150 cursor-pointer border-0",
                            index === selectedIndex
                                ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_0_10px_rgba(14,165,233,0.15)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_0_12px_rgba(14,165,233,0.25)]"
                                : "text-foreground/80 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60",
                        )}
                        onClick={() => selectItem(index)}
                    >
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs">📄</span>
                        <span className="truncate">{item.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

WikiLinkList.displayName = "WikiLinkList";

// ============================================================
// 6. Tippy.js Render Functions (matches slash-command pattern)
// ============================================================
export function renderWikiLinkItems() {
    let component: ReactRenderer<any>;
    let popup: Instance[];

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(WikiLinkList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            // @ts-ignore
            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            });
        },
        onUpdate(props: any) {
            component?.updateProps(props);
            if (!props.clientRect) {
                return;
            }
            popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
            });
        },
        onKeyDown(props: any) {
            if (props.event.key === "Escape") {
                popup?.[0].hide();
                return true;
            }
            return component?.ref?.onKeyDown(props);
        },
        onExit() {
            popup?.[0].destroy();
            component?.destroy();
        },
    };
};

// ============================================================
// 7. Read-only WikiLink Node (for NovelViewer / viewer-extensions)
//    — No Suggestion plugin, no editor interaction, pure rendering
// ============================================================
export const WikiLinkViewer = Node.create({
    name: "wikiLink",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            postId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-post-id"),
                renderHTML: (attributes) => ({
                    "data-post-id": attributes.postId,
                }),
            },
            title: {
                default: null,
                parseHTML: (element) => {
                    const raw = element.textContent?.trim() ?? "";
                    return raw.replace(/^[📎🔗\s]+/, "");
                },
                renderHTML: () => ({}),
            },
        };
    },

    parseHTML() {
        return [{ tag: "a[data-wiki-link]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        const rawTitle = node.attrs.title || "引用帖子";
        const title = rawTitle.replace(/^[📎🔗\s]+/, "");
        return [
            "a",
            mergeAttributes(HTMLAttributes, {
                "data-wiki-link": "",
                "data-post-id": node.attrs.postId,
                href: `/posts/${node.attrs.postId}`,
                class: cn(
                    "wiki-link group inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                    "text-xs font-medium no-underline cursor-pointer border-0 align-middle mx-1",
                    "bg-white/80 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-700/90",
                    "text-foreground/90 hover:text-primary backdrop-blur-xl",
                    "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.06)]",
                    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.35)]",
                    "hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.95),0_0_12px_rgba(14,165,233,0.18)]",
                    "dark:hover:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_0_16px_rgba(14,165,233,0.25)]",
                    "transition-all duration-200 active:scale-[0.98]"
                ),
                target: "_blank",
                rel: "noopener noreferrer",
            }),
            [
                "span",
                {
                    class:
                        "w-4 h-4 rounded-full bg-sky-500/10 dark:bg-sky-400/15 flex items-center justify-center shrink-0 text-[10px] text-sky-600 dark:text-sky-400 shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_0.5px_0.5px_rgba(255,255,255,0.15)]",
                },
                "📎",
            ],
            [
                "span",
                { class: "truncate max-w-[280px] sm:max-w-[360px]" },
                title,
            ],
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(WikiLinkNodeView);
    },
});
