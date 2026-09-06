"use client";

import { CommandGroup, CommandItem, CommandSeparator, CommandInput } from "@/components/ui/command";
import { useEditor } from "novel";
import { Check, TextQuote, TrashIcon, RefreshCcw, Send } from "lucide-react";
import { useState } from "react";
// import { Button } from "@/components/ui/button"; // CommandInput is inside Command, custom buttons might need structure adjustment

interface AICompletionCommandsProps {
    completion: string;
    onDiscard: () => void;
}

const AICompletionCommands = ({ completion, onDiscard }: AICompletionCommandsProps) => {
    const { editor } = useEditor();
    const [feedback, setFeedback] = useState("");

    if (!editor) return null;

    return (
        <div className="p-1">
            <CommandGroup heading="采纳建议">
                <CommandItem
                    className="gap-2.5 px-3 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                    value="insert"
                    onSelect={() => {
                        const selection = editor.view.state.selection;
                        const docSize = editor.view.state.doc.content.size;
                        const insertPos = Math.min(selection.to + 1, docSize);

                        editor
                            .chain()
                            .focus()
                            .insertContentAt(insertPos, completion)
                            .run();
                        onDiscard();
                    }}
                >
                    <TextQuote className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                    <span>采纳并在当前光标下方插入</span>
                </CommandItem>
                <CommandItem
                    className="gap-2.5 px-3 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                    value="replace"
                    onSelect={() => {
                        const selection = editor.view.state.selection;

                        editor
                            .chain()
                            .focus()
                            .insertContentAt(
                                {
                                    from: selection.from,
                                    to: selection.to,
                                },
                                completion
                            )
                            .run();
                        onDiscard();
                    }}
                >
                    <Check className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                    <span>替换当前选中内容</span>
                </CommandItem>
            </CommandGroup>

            <CommandSeparator className="my-1 bg-border/60" />

            <CommandGroup heading="操作">
                <CommandItem
                    onSelect={onDiscard}
                    value="discard"
                    className="gap-2.5 px-3 py-2 text-xs cursor-pointer rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>舍弃此内容</span>
                </CommandItem>
            </CommandGroup>
        </div>
    );
};

export default AICompletionCommands;
