import { mergeAttributes, Node } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import { MentionList, type MentionItem } from "./MentionList";
import { PluginKey } from "prosemirror-state";
import { Sparkles } from "lucide-react";

export const mentionPluginKey = new PluginKey("mention");

export const SCHOLARLY_AI_ID = "00000000-0000-0000-0000-0000000000a1";

export const SCHOLARLY_AI_DEFAULT_ITEM: MentionItem = {
    id: SCHOLARLY_AI_ID,
    username: "Scholarly AI",
    full_name: "Scholarly AI 官方助手",
    avatar_url: "/scholarly-ai-avatar.jpg",
    special_title: "学术智能体",
    vip_level: 6,
    is_verified: true,
    is_ai: true,
    relationship: "ai",
};

// 内存级候选人缓存，初始立即包含 Scholarly AI
let cachedDefaultList: MentionItem[] = [SCHOLARLY_AI_DEFAULT_ITEM];
let isPreloading = false;
let hasPreloaded = false;

// 搜索关键词内存级缓存，避免相同字符反复请求
const searchCache = new Map<string, MentionItem[]>();
let activeAbortController: AbortController | null = null;

/**
 * 提前在后台静默拉取好友与候选学者到浏览器内存中
 */
export async function preloadMentionCandidates() {
    if (hasPreloaded || isPreloading) return;
    isPreloading = true;
    try {
        const res = await fetch("/api/users/mention-search", { cache: "no-store" });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                cachedDefaultList = data;
                hasPreloaded = true;
            }
        }
    } catch {
        // 静默失败，保持默认 Scholarly AI
    } finally {
        isPreloading = false;
    }
}

// 客户端载入模块时立即在后台预热缓存
if (typeof window !== "undefined") {
    setTimeout(preloadMentionCandidates, 0);
}

/**
 * 编辑器中的 Mention 交互节点视图
 */
function MentionNodeView({ node }: { node: any }) {
    const { id, label, is_ai } = node.attrs;
    const isAi = is_ai || id === SCHOLARLY_AI_ID || label === "Scholarly AI";

    return (
        <NodeViewWrapper as="span" className="inline-block mx-0.5">
            {isAi ? (
                <span
                    data-type="mention"
                    data-id={id}
                    data-label={label}
                    data-is-ai="true"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-cyan-500/15 text-purple-600 dark:text-purple-300 font-semibold text-xs border border-purple-500/30 shadow-xs cursor-default select-none"
                >
                    <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                    <span>@{label}</span>
                </span>
            ) : (
                <span
                    data-type="mention"
                    data-id={id}
                    data-label={label}
                    className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 bg-primary/10 text-primary font-medium text-xs hover:bg-primary/20 transition-colors cursor-default select-none border border-primary/20"
                >
                    <span>@{label}</span>
                </span>
            )}
        </NodeViewWrapper>
    );
}

/**
 * Tippy.js 浮窗挂载与生命周期管理
 */
export function renderMentionItems() {
    let component: ReactRenderer<any>;
    let popup: Instance[];

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(MentionList, {
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
                duration: [50, 50],
                animation: false,
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
                popup?.[0]?.hide();
                return true;
            }
            return component?.ref?.onKeyDown(props);
        },
        onExit() {
            popup?.[0]?.destroy();
            component?.destroy();
        },
    };
}

/**
 * 模糊序列与子串匹配算法（支持拼音缩写/子序列/大小写容错）
 */
function fuzzyMatchText(text: string | undefined | null, pattern: string): boolean {
    if (!text) return false;
    const t = text.toLowerCase();
    const p = pattern.toLowerCase().trim();
    if (t.includes(p)) return true;
    const tNoSpace = t.replace(/\s+/g, "");
    const pNoSpace = p.replace(/\s+/g, "");
    if (tNoSpace.includes(pNoSpace)) return true;
    let patternIdx = 0;
    for (let i = 0; i < t.length && patternIdx < p.length; i++) {
        if (t[i] === p[patternIdx]) patternIdx++;
    }
    return patternIdx === p.length;
}

function matchesItem(item: MentionItem, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    if (item.is_ai || item.id === SCHOLARLY_AI_ID) {
        return (
            fuzzyMatchText("scholarly ai", q) ||
            fuzzyMatchText("学术智能体", q) ||
            fuzzyMatchText("学术助手", q) ||
            fuzzyMatchText("学术智脑", q) ||
            q.includes("ai") ||
            q.includes("学术") ||
            q.includes("助手") ||
            q.includes("智能") ||
            q.includes("智脑")
        );
    }

    return (
        fuzzyMatchText(item.username, q) ||
        fuzzyMatchText(item.special_title, q) ||
        fuzzyMatchText(item.academic_title, q) ||
        fuzzyMatchText(item.bio, q)
    );
}

/**
 * 完整带有输入提示的 Mention 扩展（用于评论输入框）
 */
export const Mention = Node.create({
    name: "mention",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (el) => el.getAttribute("data-id"),
                renderHTML: (attrs) => ({ "data-id": attrs.id }),
            },
            label: {
                default: null,
                parseHTML: (el) => el.getAttribute("data-label") || el.textContent?.replace(/^@/, ""),
                renderHTML: (attrs) => ({ "data-label": attrs.label }),
            },
            is_ai: {
                default: false,
                parseHTML: (el) => el.getAttribute("data-is-ai") === "true",
                renderHTML: (attrs) => (attrs.is_ai ? { "data-is-ai": "true" } : {}),
            },
        };
    },

    parseHTML() {
        return [
            { tag: "span[data-type=\"mention\"]" },
            { tag: "a[data-type=\"mention\"]" },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const isAi = node.attrs.is_ai || node.attrs.id === SCHOLARLY_AI_ID || node.attrs.label === "Scholarly AI";
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-type": "mention",
                "data-id": node.attrs.id,
                "data-label": node.attrs.label,
                ...(isAi ? { "data-is-ai": "true" } : {}),
                class: isAi ? "mention-ai" : "mention",
            }),
            `@${node.attrs.label}`,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(MentionNodeView);
    },

    addOptions() {
        return {
            suggestion: {
                char: "@",
                pluginKey: mentionPluginKey,
                items: async ({ query }: { query: string }) => {
                    const q = (query || "").trim().toLowerCase();

                    // 1. 无查询词时（用户刚刚键入 @）：零延迟，直接从内存数组瞬间返回（0ms 响应）！
                    if (!q) {
                        if (!hasPreloaded) {
                            preloadMentionCandidates();
                        }
                        return cachedDefaultList;
                    }

                    // 2. 检查内存搜索缓存
                    if (searchCache.has(q)) {
                        return searchCache.get(q)!;
                    }

                    // 3. 本地快速模糊匹配（过滤已缓存的 AI 或好友）
                    const localMatches = cachedDefaultList.filter((item) => matchesItem(item, q));

                    // 4. 异步并发拉取全站学者结果进行补充（自动中止上一次未完成的请求）
                    if (activeAbortController) {
                        activeAbortController.abort();
                    }
                    activeAbortController = new AbortController();
                    const currentController = activeAbortController;

                    try {
                        const res = await fetch(
                            `/api/users/mention-search?q=${encodeURIComponent(q)}`,
                            { signal: currentController.signal }
                        );

                        if (res.ok) {
                            const data: MentionItem[] = await res.json();
                            if (Array.isArray(data)) {
                                // 合并本地匹配与全站远程搜索结果，按 ID 去重
                                const map = new Map<string, MentionItem>();
                                for (const item of localMatches) {
                                    map.set(item.id, item);
                                }
                                for (const item of data) {
                                    map.set(item.id, item);
                                }
                                const merged = Array.from(map.values());
                                if (merged.length > 0) {
                                    searchCache.set(q, merged);
                                    return merged;
                                }
                            }
                        }
                    } catch (err: any) {
                        if (err?.name === "AbortError") {
                            // 请求被中止，返回本地匹配
                            return localMatches;
                        }
                    }

                    // 网络未返回或无全站新结果时，使用本地匹配结果
                    const fallback = localMatches.length > 0 ? localMatches : [];
                    searchCache.set(q, fallback);
                    return fallback;
                },
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: any;
                    range: any;
                    props: MentionItem;
                }) => {
                    const isAi = props.is_ai || props.id === SCHOLARLY_AI_ID;
                    editor
                        .chain()
                        .focus()
                        .deleteRange({ from: range.from, to: range.to })
                        .insertContentAt(range.from, [
                            {
                                type: "mention",
                                attrs: {
                                    id: props.id,
                                    label: props.username,
                                    is_ai: isAi,
                                },
                            },
                            { type: "text", text: " " },
                        ])
                        .run();
                },
                render: renderMentionItems,
            } as Partial<SuggestionOptions<MentionItem>>,
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

/**
 * 只读 Mention 节点（供 NovelViewer 渲染使用）
 */
export const MentionViewerNode = Node.create({
    name: "mention",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-id"),
                renderHTML: (attributes) => ({ "data-id": attributes.id }),
            },
            label: {
                default: null,
                parseHTML: (element) =>
                    element.getAttribute("data-label") || element.textContent?.replace(/^@/, ""),
                renderHTML: (attributes) => ({ "data-label": attributes.label }),
            },
            is_ai: {
                default: false,
                parseHTML: (element) => element.getAttribute("data-is-ai") === "true",
                renderHTML: (attributes) =>
                    attributes.is_ai ? { "data-is-ai": "true" } : {},
            },
        };
    },

    parseHTML() {
        return [
            { tag: "span[data-type=\"mention\"]" },
            { tag: "a[data-type=\"mention\"]" },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const isAi =
            node.attrs.is_ai ||
            node.attrs.id === SCHOLARLY_AI_ID ||
            node.attrs.label === "Scholarly AI";

        return [
            "a",
            mergeAttributes(HTMLAttributes, {
                "data-type": "mention",
                "data-id": node.attrs.id,
                href: isAi ? "#" : `/user/${node.attrs.id}`,
                class: isAi
                    ? "mention-ai inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-cyan-500/15 text-purple-600 dark:text-purple-300 font-semibold text-xs border border-purple-500/30 shadow-xs cursor-pointer select-none no-underline hover:opacity-90 transition-opacity"
                    : "mention inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 bg-primary/10 text-primary font-medium text-xs hover:bg-primary/20 hover:underline transition-colors cursor-pointer select-none no-underline border border-primary/20",
            }),
            `@${node.attrs.label}`,
        ];
    },
});
