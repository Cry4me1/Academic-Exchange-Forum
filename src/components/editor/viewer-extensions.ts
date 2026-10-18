import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";
import { TextStyle } from "@tiptap/extension-text-style";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { mergeAttributes, Node } from "@tiptap/core";
import { all, createLowlight } from "lowlight";
import {
    CodeBlockLowlight,
    HorizontalRule,
    StarterKit,
    TaskItem,
    TaskList,
    TiptapLink,
} from "novel";
import { CodeBlockComponent } from "./extensions/code-block-component";
import { CustomImage } from "./extensions/custom-image";
import { MermaidBlock } from "./extensions/mermaid-block";
import { AcademicBlock } from "./extensions/academic-block/academic-block";
import { CrossRefNode } from "./extensions/cross-ref/cross-ref-node";
import { SidenoteNode } from "./extensions/sidenote/sidenote-node";
import { MentionViewerNode } from "./extensions/mention";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { AlgorithmStepperNode } from "./extensions/algorithm-stepper/algorithm-stepper-node";
import { SolidGeometryNode } from "./extensions/solid-geometry/solid-geometry-node";

// Explicitly create lowlight instance
const lowlight = createLowlight(all);

const codeBlockLowlight = CodeBlockLowlight.configure({
    lowlight,
}).extend({
    addOptions() {
        return {
            ...this.parent?.(),
            editable: false,
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockComponent);
    },
});

// Configure Mathematics extension (v2 uses regex decorations)
const mathExtension = Mathematics.configure({
    // Standard dollar sign syntax for inline math: $E=mc^2$
    regex: /\$([^\$]+)\$/gi,
    katexOptions: {
        strict: "ignore",
        throwOnError: false,
    },
});

import { cn } from "@/lib/utils";

/**
 * Read-only WikiLink node — pure HTML, no React NodeView, no Suggestion plugin.
 * Renders as a styled <a> tag that links to the referenced post.
 */
const WikiLinkViewerNode = Node.create({
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
});

/**
 * Viewer-specific extensions (readonly, no slash commands or drag handles)
 */
export const viewerExtensions: any[] = [
    StarterKit.configure({
        bulletList: {
            HTMLAttributes: {
                class: "list-disc list-outside leading-3 -mt-2",
            },
        },
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal list-outside leading-3 -mt-2",
            },
        },
        listItem: {
            HTMLAttributes: {
                class: "leading-normal -mb-2",
            },
        },
        blockquote: {
            HTMLAttributes: {
                class: "border-l-4 border-primary",
            },
        },
        codeBlock: false,
        code: {
            HTMLAttributes: {
                class: "rounded-md bg-muted px-1.5 py-1 font-mono font-medium",
                spellcheck: "false",
            },
        },
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
    }),
    // Core extensions
    TiptapLink.configure({
        openOnClick: true, // Allow clicking links in viewer
    }),
    CustomImage,
    TaskList,
    TaskItem.configure({
        nested: true,
    }),
    HorizontalRule,
    // Custom extensions
    codeBlockLowlight,
    // Math extension (v2)
    mathExtension,
    // Mermaid flowchart block
    MermaidBlock,
    // Text styling extensions for color
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
    // WikiLink node — pure HTML rendering, no React NodeView
    WikiLinkViewerNode,
    // Academic extensions
    AcademicBlock,
    CrossRefNode,
    SidenoteNode,
    AlgorithmStepperNode,
    SolidGeometryNode,
    // Mention node
    MentionViewerNode,
    // Table extensions (Readonly in viewer)
    Table.configure({
        resizable: false,
        HTMLAttributes: {
            class: "scholarly-liquid-table",
        },
    }),
    TableRow,
    TableHeader,
    TableCell,
];
