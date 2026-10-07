"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
    Box,
    Edit3,
    Trash2,
    Sparkles,
    ChevronDown,
    Copy,
    Check,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    SolidGeometryAttrs,
    SolidGeometryData,
} from "./solid-geometry-types";
import { SOLID_GEOMETRY_PRESETS } from "./presets";
import { SolidGeometryEditorModal } from "./SolidGeometryEditorModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// 动态客户端加载 Three.js 交互画布，保证 SSR 安全与极致首屏性能
const SolidGeometryCanvas = dynamic(
    () => import("./SolidGeometryCanvas"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[380px] rounded-3xl bg-slate-100/50 dark:bg-zinc-900/50 backdrop-blur-xl animate-pulse flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <Box size={24} className="text-sky-500 animate-bounce" />
                <span>正在加载立体几何 3D 空间视轨...</span>
            </div>
        ),
    }
);

export function SolidGeometryComponent({
    node,
    updateAttributes,
    editor,
    deleteNode,
}: NodeViewProps) {
    const isEditable = editor?.isEditable ?? false;
    const defaultPreset = SOLID_GEOMETRY_PRESETS["cube-diagonal-section"];

    // 挂载状态（确保 SSR 安全与 Portal）
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // 从 TipTap node.attrs 读取属性
    const title = (node.attrs.title as string) || defaultPreset.title;
    const subtitle = (node.attrs.subtitle as string) || defaultPreset.subtitle;
    const presetKey = (node.attrs.presetKey as string) || defaultPreset.presetKey;
    const geometryData = (node.attrs.geometryData as SolidGeometryData) || defaultPreset.geometryData;

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 全屏时背景页面防滚动与 ESC 监听
    useEffect(() => {
        if (!isFullscreen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullscreen]);

    // 局部更新几何数据
    const handleUpdateData = (partial: Partial<SolidGeometryData>) => {
        const nextData = {
            ...geometryData,
            ...partial,
        };
        updateAttributes({
            geometryData: nextData,
        });
    };

    // 保存弹窗完整配置
    const handleSaveAttrs = (newAttrs: SolidGeometryAttrs) => {
        updateAttributes(newAttrs);
    };

    // 一键切换内置学术预设
    const handleSwitchPreset = (key: string) => {
        const preset = SOLID_GEOMETRY_PRESETS[key];
        if (!preset) return;
        updateAttributes({
            title: preset.title,
            subtitle: preset.subtitle,
            presetKey: key,
            geometryData: JSON.parse(JSON.stringify(preset.geometryData)),
        });
        toast.success(`已切换至【${preset.title}】`);
    };

    // 复制参数 JSON
    const handleCopyConfig = () => {
        const configJson = JSON.stringify(
            { title, subtitle, presetKey, geometryData },
            null,
            2
        );
        navigator.clipboard.writeText(configJson);
        setIsCopied(true);
        toast.success("已复制立体几何配置 JSON");
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <NodeViewWrapper
            tabIndex={-1}
            data-type="solid-geometry"
            className="scholarly-solid-geometry-wrapper bg-transparent my-8 select-none outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&.ProseMirror-selectednode]:outline-none [&.ProseMirror-selectednode]:!bg-transparent [&.ProseMirror-selectednode]:ring-0 [&.ProseMirror-selectednode]:shadow-none block not-prose w-full"
        >
            {/* 行内视图卡片：Apple Liquid Glass 无边框流体毛玻璃 */}
            {isFullscreen ? (
                /* 全屏时文内显示的防塌陷占位微岛 */
                <div className="relative overflow-hidden rounded-3xl border-0 w-full p-8 text-center bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl flex flex-col items-center justify-center gap-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] outline-none focus:outline-none ring-0">
                    <div className="p-3 rounded-full bg-sky-500/10 text-sky-500">
                        <Maximize2 size={22} />
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        当前立体几何模型已在全屏剧场视界中展示
                    </div>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        你正在无干扰的全屏视界中进行 360° 视轨旋转与空间几何推演。按 ESC 键或点击下方按钮即可收起。
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="mt-1 px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 cursor-pointer transition-all shadow-sm outline-none focus:outline-none ring-0"
                    >
                        收起并返回正文
                    </button>
                </div>
            ) : (
                <div
                    className={cn(
                        "relative w-full rounded-3xl overflow-hidden border-0",
                        "bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl",
                        "shadow-[0_12px_40px_-4px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]",
                        "dark:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]",
                        "transition-all duration-300 group/card outline-none focus:outline-none ring-0"
                    )}
                >
                    {/* 顶部学术信息标题条 */}
                    <div className="flex items-center justify-between p-4 px-5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] shrink-0">
                                <Box size={18} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                    {title}
                                </h4>
                                {subtitle && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 右侧工具栏按钮 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* 复制配置 */}
                            <button
                                type="button"
                                onClick={handleCopyConfig}
                                title="复制几何参数配置"
                                className="p-1.5 rounded-full border-0 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>

                            {/* 作者模式下的专属操作 */}
                            {isEditable && (
                                <>
                                    {/* 快速切换预设下拉 */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-full border-0 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)]"
                                            >
                                                <Sparkles size={12} className="text-amber-500" />
                                                <span>更换模型</span>
                                                <ChevronDown size={11} className="text-muted-foreground" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-56 rounded-2xl border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] p-1.5 text-xs"
                                        >
                                            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                                学术经典立体几何预设
                                            </DropdownMenuLabel>
                                            {Object.entries(SOLID_GEOMETRY_PRESETS).map(([key, item]) => (
                                                <DropdownMenuItem
                                                    key={key}
                                                    onSelect={() => handleSwitchPreset(key)}
                                                    className="cursor-pointer rounded-xl flex items-center justify-between"
                                                >
                                                    <span>{item.title.split("(")[0]}</span>
                                                    {presetKey === key && (
                                                        <Check size={12} className="text-sky-500" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* 编辑配置按钮 */}
                                    <button
                                        type="button"
                                        onClick={() => setIsEditorOpen(true)}
                                        className="flex items-center gap-1 px-3 py-1 rounded-full border-0 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-all cursor-pointer shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                                    >
                                        <Edit3 size={12} />
                                        <span>编辑参数</span>
                                    </button>

                                    {/* 删除块 */}
                                    <button
                                        type="button"
                                        onClick={deleteNode}
                                        title="删除立体几何组件"
                                        className="p-1.5 rounded-full border-0 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 渐变消融微光内部光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 3D 渲染画布主视口 */}
                    <div className="p-2 sm:p-3">
                        <SolidGeometryCanvas
                            data={geometryData}
                            height={380}
                            onUpdateData={handleUpdateData}
                            allowInteractiveAdjust={true}
                            isFullscreen={false}
                            onToggleFullscreen={() => setIsFullscreen(true)}
                        />
                    </div>
                </div>
            )}

            {/* 全屏沉浸演示剧场 (Theater Presentation Mode)：通过 Portal 挂载到 body，彻底消除包含块裁切与变形 */}
            {mounted && isFullscreen && createPortal(
                <div
                    className="fixed inset-0 z-[70] bg-zinc-950/80 dark:bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200 select-none"
                    onClick={() => setIsFullscreen(false)}
                >
                    <div
                        className="relative w-full max-w-5xl h-[88vh] max-h-[860px] flex flex-col rounded-3xl border-0 overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.15)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 顶部标题栏 */}
                        <div className="flex items-center justify-between p-4 px-6 shrink-0 border-b border-zinc-200/50 dark:border-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <Box size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                        {title}
                                    </h3>
                                    {subtitle && (
                                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFullscreen(false)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-0 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                            >
                                <Minimize2 size={14} />
                                <span>退出全屏</span>
                            </button>
                        </div>

                        {/* 沉浸式 3D Canvas：充满剩余高度 */}
                        <div className="flex-1 w-full min-h-0 relative p-3">
                            <SolidGeometryCanvas
                                data={geometryData}
                                height="100%"
                                className="h-full rounded-2xl"
                                onUpdateData={handleUpdateData}
                                allowInteractiveAdjust={true}
                                isFullscreen={true}
                                onToggleFullscreen={() => setIsFullscreen(false)}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* 可视化配置抽屉模态框 */}
            {isEditable && (
                <SolidGeometryEditorModal
                    open={isEditorOpen}
                    onOpenChange={setIsEditorOpen}
                    initialAttrs={{
                        title,
                        subtitle,
                        presetKey,
                        geometryData,
                    }}
                    onSave={handleSaveAttrs}
                />
            )}
        </NodeViewWrapper>
    );
}

export default SolidGeometryComponent;
