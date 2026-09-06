"use client";

import { useEffect, useState, useRef } from "react";
import { useEditor } from "novel";
import { AISelector } from "./ai-selector";

export const SlashAISelector = () => {
    const { editor } = useEditor();
    const [open, setOpen] = useState(false);
    const [initialOption, setInitialOption] = useState<string | undefined>(undefined);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleTriggerContinue = (e?: any) => {
            if (!editor) return;
            const { view } = editor;

            let top = 0;
            let left = 0;

            // 1. 尝试获取光标所在坐标
            try {
                const coords = view.coordsAtPos(view.state.selection.from);
                if (coords && coords.bottom > 80) {
                    top = coords.bottom + 10;
                    left = coords.left;
                }
            } catch (err) {
                console.warn("coordsAtPos fallback", err);
            }

            // 2. 若光标坐标无效（如未聚焦），使用自定义事件携带的位置（如工具栏按钮正下方）
            if (top === 0 && e?.detail?.position) {
                top = e.detail.position.top;
                left = e.detail.position.left;
            }

            // 3. 终极回退：定位在编辑器正文画布左上方
            if (top === 0) {
                try {
                    const rect = view.dom.getBoundingClientRect();
                    top = rect.top + 30;
                    left = rect.left + 24;
                } catch {
                    top = 180;
                    left = 40;
                }
            }

            // 设置位置和初始选项
            setPosition({ top, left });
            setInitialOption("continue");
            setOpen(true);
        };

        const handleTriggerAsk = (e?: any) => {
            if (!editor) return;
            const { view } = editor;
            let top = 0;
            let left = 0;

            try {
                const coords = view.coordsAtPos(view.state.selection.from);
                if (coords && coords.bottom > 80) {
                    top = coords.bottom + 10;
                    left = coords.left;
                }
            } catch {
                // ignore
            }

            if (top === 0 && e?.detail?.position) {
                top = e.detail.position.top;
                left = e.detail.position.left;
            }

            if (top === 0) {
                const rect = view.dom.getBoundingClientRect();
                top = rect.top + 30;
                left = rect.left + 24;
            }

            setPosition({ top, left });
            setInitialOption(undefined); // undefined means "ask" input mode
            setOpen(true);
        };

        window.addEventListener("trigger-ai-continue", handleTriggerContinue);
        window.addEventListener("trigger-ai-ask", handleTriggerAsk);

        return () => {
            window.removeEventListener("trigger-ai-continue", handleTriggerContinue);
            window.removeEventListener("trigger-ai-ask", handleTriggerAsk);
        };
    }, [editor]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                // 恢复编辑器焦点
                editor?.commands.focus();
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, editor]);

    if (!open) return null;

    return (
        <div
            ref={menuRef}
            style={{
                position: "fixed",
                top: position.top,
                left: Math.max(16, Math.min(position.left, typeof window !== "undefined" ? window.innerWidth - 460 : position.left)),
                zIndex: 99999,
            }}
            className="shadow-2xl rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-background/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        >
            <AISelector
                open={open}
                onOpenChange={setOpen}
                initialOption={initialOption}
            />
        </div>
    );
};
