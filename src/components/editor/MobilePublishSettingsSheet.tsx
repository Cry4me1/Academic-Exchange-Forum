"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, HelpCircle, Plus, SlidersHorizontal, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LiquidTagSelector } from "@/components/posts/LiquidTagSelector";
import { PostCoverUploader } from "./PostCoverUploader";

interface MobilePublishSettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    availableTags: string[];
    selectedTags: string[];
    onTagToggle: (tag: string) => void;
    myCollections: Array<{ id: string; name: string; post_count?: number }>;
    selectedCollectionId: string;
    onSelectCollection: (id: string) => void;
    onCreateCollection: () => void;
    coverImage: string | null;
    onCoverChange: (url: string | null) => void;
    isHelpWanted: boolean;
    onHelpWantedChange: (checked: boolean) => void;
}

export function MobilePublishSettingsSheet({
    isOpen,
    onClose,
    availableTags,
    selectedTags,
    onTagToggle,
    myCollections,
    selectedCollectionId,
    onSelectCollection,
    onCreateCollection,
    coverImage,
    onCoverChange,
    isHelpWanted,
    onHelpWantedChange,
}: MobilePublishSettingsSheetProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
                    {/* 半透明环境光晕遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-zinc-950/45 dark:bg-black/65 backdrop-blur-xs"
                    />

                    {/* 底部向上滑动的大曲率毛玻璃面板 */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className={cn(
                            "relative z-10 w-full max-h-[82vh] flex flex-col rounded-t-[28px] border-0",
                            "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl",
                            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_-12px_40px_-8px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_-12px_40px_-8px_rgba(0,0,0,0.7)]",
                            "pb-safe select-none"
                        )}
                    >
                        {/* 顶部抓手条 */}
                        <div className="pt-3 pb-1 flex justify-center shrink-0">
                            <div className="w-10 h-1 rounded-full bg-zinc-300/80 dark:bg-zinc-700/80" />
                        </div>

                        {/* 抽屉头部 */}
                        <div className="flex items-center justify-between px-5 py-2.5 shrink-0">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    发布元数据设置
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-0"
                            >
                                <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                        </div>

                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

                        {/* 表单内容区 */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-none">
                            {/* 1. 学科标签 */}
                            <LiquidTagSelector
                                availableTags={availableTags}
                                selectedTags={selectedTags}
                                onTagToggle={onTagToggle}
                                maxTags={3}
                            />

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent dark:via-zinc-800/70" />

                            {/* 2. 归入专栏 */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                        <BookOpen className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                                        归入专栏
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={onCreateCollection}
                                        className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" strokeWidth={1.75} />
                                        新建专栏
                                    </button>
                                </div>

                                <Select
                                    value={selectedCollectionId}
                                    onValueChange={onSelectCollection}
                                >
                                    <SelectTrigger className="w-full h-10 px-3.5 rounded-full border-0 bg-zinc-200/40 dark:bg-white/[0.05] text-xs font-medium cursor-pointer">
                                        <SelectValue placeholder="不归入任何专栏" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl p-1.5">
                                        <SelectItem value="none" className="text-xs rounded-xl cursor-pointer">
                                            不归入专栏 (独立发布)
                                        </SelectItem>
                                        {myCollections.map((col) => (
                                            <SelectItem key={col.id} value={col.id} className="text-xs rounded-xl cursor-pointer">
                                                {col.name} ({col.post_count ?? 0} 篇)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent dark:via-zinc-800/70" />

                            {/* 3. 设为求助开关 */}
                            <div className="flex items-center justify-between py-1">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                        <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                                        高亮求助状态
                                    </Label>
                                    <p className="text-[11px] text-zinc-400">在论坛流中标记为待解决难题，吸引同行破局</p>
                                </div>
                                <Switch
                                    checked={isHelpWanted}
                                    onCheckedChange={onHelpWantedChange}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent dark:via-zinc-800/70" />

                            {/* 4. 封面图片 */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                    文章题图封面
                                </Label>
                                <PostCoverUploader
                                    coverImage={coverImage}
                                    onChange={onCoverChange}
                                />
                            </div>

                            {/* 确认完成配置按钮 */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full h-10 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-medium border-0 shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                                >
                                    <Check className="h-4 w-4" />
                                    <span>确认设置</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
