"use client";

import { Button } from "@/components/ui/button";
import { EditorBubble, useEditor } from "novel";
import { Fragment, type ReactNode } from "react";
import { AISelector } from "./ai-selector";
import { Sparkles } from "lucide-react";

interface GenerativeMenuSwitchProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
    const { editor } = useEditor();

    return (
        <EditorBubble
            tippyOptions={{
                placement: open ? "top-start" : "top",
                appendTo: () => document.body,
                onHidden: () => {
                    onOpenChange(false);
                },
                popperOptions: {
                    strategy: "fixed",
                    modifiers: [
                        {
                            name: "flip",
                            options: {
                                fallbackPlacements: ["bottom-start", "bottom", "top"],
                                padding: 16,
                            },
                        },
                        {
                            name: "preventOverflow",
                            options: {
                                boundary: "viewport",
                                padding: 8,
                                altAxis: true,
                                tether: false,
                            },
                        },
                    ],
                },
                maxWidth: "90vw",
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
        >
            {open && <AISelector open={open} onOpenChange={onOpenChange} />}
            {!open && (
                <Fragment>
                    <Button
                        className="gap-1.5 rounded-none text-zinc-700 dark:text-zinc-200 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium"
                        variant="ghost"
                        onClick={() => onOpenChange(true)}
                        size="sm"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                        Ask AI
                    </Button>
                    {children}
                </Fragment>
            )}
        </EditorBubble>
    );
};

export default GenerativeMenuSwitch;
