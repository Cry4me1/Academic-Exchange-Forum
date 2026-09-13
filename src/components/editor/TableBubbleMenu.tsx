"use client";

import { useEditor } from "novel";
import { BubbleMenu } from "@tiptap/react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Plus,
    Minus,
    Heading,
    Table as TableIcon,
    Trash2,
    ArrowDownToLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface ActionPillProps {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    danger?: boolean;
}

const ActionPill = memo(({ onClick, icon, label, tooltip, danger }: ActionPillProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick();
                }}
                className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-150 border-0 cursor-pointer whitespace-nowrap flex-shrink-0",
                    danger
                        ? "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95"
                        : "text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 active:scale-95"
                )}
            >
                {icon}
                <span>{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="text-xs font-medium px-2.5 py-1 rounded-full border-0 bg-zinc-900/95 dark:bg-zinc-100/95 text-zinc-100 dark:text-zinc-900 shadow-xl whitespace-nowrap z-[100]">
            {tooltip}
        </TooltipContent>
    </Tooltip>
));

ActionPill.displayName = "ActionPill";

export function TableBubbleMenu() {
    const { editor } = useEditor();

    if (!editor) return null;

    return (
        <BubbleMenu
            editor={editor}
            pluginKey="table-bubble-menu"
            shouldShow={({ editor }) => {
                return editor.isActive("table");
            }}
            tippyOptions={{
                duration: 150,
                placement: "top",
                offset: [0, 8],
                zIndex: 80,
                appendTo: () => document.body,
                popperOptions: {
                    strategy: "fixed",
                    modifiers: [
                        {
                            name: "flip",
                            options: {
                                fallbackPlacements: ["bottom", "bottom-start", "top-start"],
                                padding: 16,
                            },
                        },
                        {
                            name: "preventOverflow",
                            options: {
                                boundary: "viewport",
                                padding: 16,
                                altAxis: true,
                                tether: false,
                            },
                        },
                    ],
                },
                maxWidth: "95vw",
            }}
        >
            <TooltipProvider delayDuration={80}>
                <div
                    className={cn(
                        "flex items-center gap-0.5 px-2 py-1 select-none border-0 whitespace-nowrap",
                        // Apple Liquid Glass: 水滴胶囊、通透毛玻璃、菲涅尔高光与柔和漫射阴影
                        "rounded-full backdrop-blur-2xl",
                        "bg-white/92 dark:bg-zinc-900/92",
                        "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.9)]",
                        "dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.15)]"
                    )}
                >
                    {/* 表格微徽标 */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold whitespace-nowrap flex-shrink-0">
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>表格</span>
                    </div>

                    {/* 渐变消融微光缝 */}
                    <div className="w-[1px] h-3.5 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5 flex-shrink-0" />

                    {/* 行管理 */}
                    <ActionPill
                        onClick={() => (editor.chain().focus() as any).addRowAfter().run()}
                        icon={<Plus className="w-3.5 h-3.5 text-emerald-500" />}
                        label="加行"
                        tooltip="在下方添加一行"
                    />
                    <ActionPill
                        onClick={() => (editor.chain().focus() as any).deleteRow().run()}
                        icon={<Minus className="w-3.5 h-3.5 text-amber-500" />}
                        label="删行"
                        tooltip="删除当前行"
                    />

                    {/* 渐变消融微光缝 */}
                    <div className="w-[1px] h-3.5 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5 flex-shrink-0" />

                    {/* 列管理 */}
                    <ActionPill
                        onClick={() => (editor.chain().focus() as any).addColumnAfter().run()}
                        icon={<Plus className="w-3.5 h-3.5 text-emerald-500" />}
                        label="加列"
                        tooltip="在右侧添加一列"
                    />
                    <ActionPill
                        onClick={() => (editor.chain().focus() as any).deleteColumn().run()}
                        icon={<Minus className="w-3.5 h-3.5 text-amber-500" />}
                        label="删列"
                        tooltip="删除当前列"
                    />

                    {/* 渐变消融微光缝 */}
                    <div className="w-[1px] h-3.5 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5 flex-shrink-0" />

                    {/* 表头切换 */}
                    <ActionPill
                        onClick={() => (editor.chain().focus() as any).toggleHeaderRow().run()}
                        icon={<Heading className="w-3.5 h-3.5 text-blue-500" />}
                        label="表头"
                        tooltip="切换首行是否为高亮表头"
                    />

                    {/* 退出表格，在下方插入正文继续写作 */}
                    <ActionPill
                        onClick={() => {
                            const { state } = editor;
                            const { $from } = state.selection;
                            let handled = false;
                            for (let d = $from.depth; d > 0; d--) {
                                if ($from.node(d).type.name === "table") {
                                    const tableEnd = $from.after(d);
                                    editor
                                        .chain()
                                        .focus()
                                        .insertContentAt(tableEnd, { type: "paragraph" })
                                        .setTextSelection(tableEnd + 1)
                                        .run();
                                    handled = true;
                                    break;
                                }
                            }
                            if (!handled) {
                                editor
                                    .chain()
                                    .focus()
                                    .insertContentAt(state.doc.content.size, { type: "paragraph" })
                                    .setTextSelection(state.doc.content.size)
                                    .run();
                            }
                        }}
                        icon={<ArrowDownToLine className="w-3.5 h-3.5 text-sky-500" />}
                        label="换行"
                        tooltip="跳出表格并在下方插入新段落继续正文"
                    />

                    {/* 渐变消融微光缝 */}
                    <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-0.5 flex-shrink-0" />

                    {/* 危险操作：整表删除 */}
                    <ActionPill
                        onClick={() => (editor.chain().focus() as any).deleteTable().run()}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        label="删表"
                        tooltip="彻底删除整个表格"
                        danger
                    />
                </div>
            </TooltipProvider>
        </BubbleMenu>
    );
}

export default TableBubbleMenu;
