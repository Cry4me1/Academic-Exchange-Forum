"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    SolidGeometryAttrs,
    SolidGeometryData,
    GeometryVertex,
    GeometryEdge,
    GeometryFace,
} from "./solid-geometry-types";
import { SOLID_GEOMETRY_PRESETS } from "./presets";
import {
    Sparkles,
    Plus,
    Trash2,
    Layers,
    Box,
    Check,
    X,
    Move3D,
    Type,
    Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SolidGeometryEditorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialAttrs: SolidGeometryAttrs;
    onSave: (attrs: SolidGeometryAttrs) => void;
}

export function SolidGeometryEditorModal({
    open,
    onOpenChange,
    initialAttrs,
    onSave,
}: SolidGeometryEditorModalProps) {
    const [title, setTitle] = useState(initialAttrs.title);
    const [subtitle, setSubtitle] = useState(initialAttrs.subtitle);
    const [presetKey, setPresetKey] = useState(initialAttrs.presetKey);
    const [geometryData, setGeometryData] = useState<SolidGeometryData>(
        JSON.parse(JSON.stringify(initialAttrs.geometryData))
    );

    const [activeTab, setActiveTab] = useState<"preset" | "vertices" | "edges" | "faces" | "settings">("preset");

    // 新增顶点临时输入
    const [newVertexLabel, setNewVertexLabel] = useState("");
    const [newVertexPos, setNewVertexPos] = useState<[number, number, number]>([0, 0, 0]);
    const [newVertexIsAux, setNewVertexIsAux] = useState(true);

    // 新增连线临时输入
    const [newEdgeFrom, setNewEdgeFrom] = useState("");
    const [newEdgeTo, setNewEdgeTo] = useState("");
    const [newEdgeStyle, setNewEdgeStyle] = useState<"solid" | "dashed">("dashed");
    const [newEdgeColor, setNewEdgeColor] = useState("#ef4444");

    // 新增截面输入
    const [newFaceVertices, setNewFaceVertices] = useState("");
    const [newFaceColor, setNewFaceColor] = useState("#0ea5e9");

    // 应用预设
    const applyPreset = (key: string) => {
        const preset = SOLID_GEOMETRY_PRESETS[key];
        if (!preset) return;
        setPresetKey(key);
        setTitle(preset.title);
        setSubtitle(preset.subtitle);
        setGeometryData(JSON.parse(JSON.stringify(preset.geometryData)));
        toast.success(`已切换至【${preset.title}】`);
    };

    // 添加顶点
    const handleAddVertex = () => {
        if (!newVertexLabel.trim()) {
            toast.error("请输入顶点名称 (如 E 或 P1)");
            return;
        }
        const id = newVertexLabel.trim();
        if (geometryData.vertices.some((v) => v.id === id)) {
            toast.error("顶点 ID 已存在，请使用唯一标识");
            return;
        }
        const updatedVertices: GeometryVertex[] = [
            ...geometryData.vertices,
            {
                id,
                label: newVertexLabel.trim(),
                position: newVertexPos,
                isAuxiliary: newVertexIsAux,
                color: newVertexIsAux ? "#ef4444" : "#3b82f6",
            },
        ];
        setGeometryData({ ...geometryData, vertices: updatedVertices });
        setNewVertexLabel("");
        setNewVertexPos([0, 0, 0]);
        toast.success(`已添加点 ${id}`);
    };

    // 删除顶点
    const handleDeleteVertex = (id: string) => {
        setGeometryData({
            ...geometryData,
            vertices: geometryData.vertices.filter((v) => v.id !== id),
            edges: geometryData.edges.filter((e) => e.from !== id && e.to !== id),
        });
    };

    // 添加连线
    const handleAddEdge = () => {
        if (!newEdgeFrom || !newEdgeTo || newEdgeFrom === newEdgeTo) {
            toast.error("请选择不同的起始点与终点");
            return;
        }
        const updatedEdges: GeometryEdge[] = [
            ...geometryData.edges,
            {
                from: newEdgeFrom,
                to: newEdgeTo,
                style: newEdgeStyle,
                color: newEdgeColor,
                width: 2,
            },
        ];
        setGeometryData({ ...geometryData, edges: updatedEdges });
        toast.success(`已添加辅助线 ${newEdgeFrom} - ${newEdgeTo}`);
    };

    // 删除连线
    const handleDeleteEdge = (index: number) => {
        const nextEdges = [...geometryData.edges];
        nextEdges.splice(index, 1);
        setGeometryData({ ...geometryData, edges: nextEdges });
    };

    // 添加截面
    const handleAddFace = () => {
        const ids = newFaceVertices
            .split(/[,，\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (ids.length < 3) {
            toast.error("截面至少需要 3 个共面顶点 (以逗号隔开，如 A, C, C1, A1)");
            return;
        }
        const updatedFaces: GeometryFace[] = [
            ...(geometryData.faces || []),
            {
                id: `section-${Date.now()}`,
                vertexIds: ids,
                color: newFaceColor,
                opacity: 0.35,
                isCrossSection: true,
            },
        ];
        setGeometryData({ ...geometryData, faces: updatedFaces });
        setNewFaceVertices("");
        toast.success("已添加高亮剖切面");
    };

    // 删除面
    const handleDeleteFace = (index: number) => {
        const nextFaces = [...(geometryData.faces || [])];
        nextFaces.splice(index, 1);
        setGeometryData({ ...geometryData, faces: nextFaces });
    };

    // 最终保存
    const handleSave = () => {
        onSave({
            title: title.trim() || "立体几何模型",
            subtitle: subtitle.trim(),
            presetKey,
            geometryData,
        });
        onOpenChange(false);
        toast.success("立体几何配置已更新");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-full p-0 overflow-hidden border-0 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                {/* 标题栏 */}
                <DialogHeader className="p-6 pb-4 border-0">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        <div className="p-2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                            <Box size={18} />
                        </div>
                        <span>配置立体几何模型 (Solid Geometry 3D)</span>
                    </DialogTitle>
                </DialogHeader>

                {/* 渐变消融微光分割缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 选项卡导航 (Apple Liquid Glass 水滴胶囊) */}
                <div className="px-6 pt-3 flex items-center gap-1.5 overflow-x-auto text-xs">
                    {[
                        { key: "preset", label: "经典预设", icon: Sparkles },
                        { key: "vertices", label: `顶点标注 (${geometryData.vertices.length})`, icon: Type },
                        { key: "edges", label: `棱线/辅助线 (${geometryData.edges.length})`, icon: Move3D },
                        { key: "faces", label: `剖切截面 (${geometryData.faces?.length || 0})`, icon: Layers },
                        { key: "settings", label: "显示设置", icon: Sliders },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key as any)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-0 font-medium transition-all cursor-pointer whitespace-nowrap",
                                    active
                                        ? "bg-zinc-950/85 text-white dark:bg-white/90 dark:text-zinc-950 shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.3)]"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                                )}
                            >
                                <Icon size={13} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 内容区域 */}
                <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4 text-xs">
                    {/* 基础标题与副标题 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3">
                        <div>
                            <label className="block text-[11px] text-muted-foreground mb-1">模型标题</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="输入模型名称..."
                                className="w-full px-3 py-1.5 rounded-xl border-0 bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] text-muted-foreground mb-1">学术推演副标题</label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="输入几何关系或证明说明..."
                                className="w-full px-3 py-1.5 rounded-xl border-0 bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]"
                            />
                        </div>
                    </div>

                    {/* 渐变微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/50 dark:via-zinc-800/50 to-transparent" />

                    {/* Tab 1: 经典预设 */}
                    {activeTab === "preset" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {Object.entries(SOLID_GEOMETRY_PRESETS).map(([key, item]) => {
                                const isSelected = presetKey === key;
                                return (
                                    <div
                                        key={key}
                                        onClick={() => applyPreset(key)}
                                        className={cn(
                                            "p-3 rounded-2xl border-0 cursor-pointer transition-all",
                                            "bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-sky-500/10 dark:hover:bg-sky-500/15",
                                            isSelected &&
                                                "bg-sky-500/15 dark:bg-sky-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                                                {item.title}
                                            </span>
                                            {isSelected && (
                                                <span className="p-0.5 rounded-full bg-sky-500 text-white">
                                                    <Check size={11} />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tab 2: 顶点管理 */}
                    {activeTab === "vertices" && (
                        <div className="space-y-3">
                            {/* 新增顶点表单 */}
                            <div className="p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 flex flex-wrap items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="名称 (如 E)"
                                    value={newVertexLabel}
                                    onChange={(e) => setNewVertexLabel(e.target.value)}
                                    className="w-20 px-2.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                />
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span>X:</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newVertexPos[0]}
                                        onChange={(e) => setNewVertexPos([parseFloat(e.target.value) || 0, newVertexPos[1], newVertexPos[2]])}
                                        className="w-14 px-1.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                    />
                                    <span>Y:</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newVertexPos[1]}
                                        onChange={(e) => setNewVertexPos([newVertexPos[0], parseFloat(e.target.value) || 0, newVertexPos[2]])}
                                        className="w-14 px-1.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                    />
                                    <span>Z:</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newVertexPos[2]}
                                        onChange={(e) => setNewVertexPos([newVertexPos[0], newVertexPos[1], parseFloat(e.target.value) || 0])}
                                        className="w-14 px-1.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                    />
                                </div>
                                <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newVertexIsAux}
                                        onChange={(e) => setNewVertexIsAux(e.target.checked)}
                                        className="rounded accent-sky-500"
                                    />
                                    <span>辅助作图点</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddVertex}
                                    className="ml-auto px-3 py-1 rounded-full border-0 bg-sky-500 text-white font-medium text-xs hover:bg-sky-600 transition-colors cursor-pointer"
                                >
                                    添加点
                                </button>
                            </div>

                            {/* 现有顶点列表 */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {geometryData.vertices.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 text-xs"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: v.color || "#3b82f6" }}
                                            />
                                            <span className="font-semibold">{v.label}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                ({v.position.join(", ")})
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteVertex(v.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: 连线与辅助线管理 */}
                    {activeTab === "edges" && (
                        <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 flex flex-wrap items-center gap-2">
                                <select
                                    value={newEdgeFrom}
                                    onChange={(e) => setNewEdgeFrom(e.target.value)}
                                    className="px-2.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                >
                                    <option value="">起始点</option>
                                    {geometryData.vertices.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-muted-foreground">至</span>
                                <select
                                    value={newEdgeTo}
                                    onChange={(e) => setNewEdgeTo(e.target.value)}
                                    className="px-2.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                >
                                    <option value="">目标点</option>
                                    {geometryData.vertices.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={newEdgeStyle}
                                    onChange={(e) => setNewEdgeStyle(e.target.value as any)}
                                    className="px-2.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                >
                                    <option value="solid">实线 (可见棱)</option>
                                    <option value="dashed">虚线 (辅助线/遮挡)</option>
                                </select>
                                <input
                                    type="color"
                                    value={newEdgeColor}
                                    onChange={(e) => setNewEdgeColor(e.target.value)}
                                    className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddEdge}
                                    className="ml-auto px-3 py-1 rounded-full border-0 bg-sky-500 text-white font-medium text-xs hover:bg-sky-600 transition-colors cursor-pointer"
                                >
                                    添加连线
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {geometryData.edges.map((e, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 text-xs"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: e.color || "#64748b" }}
                                            />
                                            <span className="font-semibold">
                                                {e.from} - {e.to}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {e.style === "dashed" ? "(虚线)" : "(实线)"}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteEdge(idx)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: 剖切截面管理 */}
                    {activeTab === "faces" && (
                        <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-800/40 flex flex-wrap items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="输入有序共面点 (如 A, C, C1, A1)"
                                    value={newFaceVertices}
                                    onChange={(e) => setNewFaceVertices(e.target.value)}
                                    className="flex-1 min-w-[200px] px-2.5 py-1 rounded-lg border-0 bg-white dark:bg-zinc-900 text-xs"
                                />
                                <input
                                    type="color"
                                    value={newFaceColor}
                                    onChange={(e) => setNewFaceColor(e.target.value)}
                                    className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddFace}
                                    className="px-3 py-1 rounded-full border-0 bg-sky-500 text-white font-medium text-xs hover:bg-sky-600 transition-colors cursor-pointer"
                                >
                                    添加截面
                                </button>
                            </div>

                            <div className="space-y-2">
                                {geometryData.faces?.map((f, idx) => (
                                    <div
                                        key={f.id || idx}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded"
                                                style={{ backgroundColor: f.color || "#0ea5e9" }}
                                            />
                                            <span className="font-semibold">
                                                截面: {f.vertexIds.join(" - ")}
                                            </span>
                                            {f.isCrossSection && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/15 text-sky-600 dark:text-sky-400">
                                                    高亮截面
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteFace(idx)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 5: 显示设置 */}
                    {activeTab === "settings" && (
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 cursor-pointer">
                                <div>
                                    <span className="font-semibold block text-zinc-900 dark:text-zinc-100">
                                        展示 O-xyz 空间直角坐标系
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        显示红绿蓝三向坐标轴与基底参考网格
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={geometryData.showCoordinates || false}
                                    onChange={(e) =>
                                        setGeometryData({ ...geometryData, showCoordinates: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 cursor-pointer">
                                <div>
                                    <span className="font-semibold block text-zinc-900 dark:text-zinc-100">
                                        显示顶点字母标签
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        在各特征点位置渲染 3D 朝向读者的文字气泡徽章
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={geometryData.showLabels !== false}
                                    onChange={(e) =>
                                        setGeometryData({ ...geometryData, showLabels: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 cursor-pointer">
                                <div>
                                    <span className="font-semibold block text-zinc-900 dark:text-zinc-100">
                                        纯线框线架模式 (Wireframe)
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        隐藏半透明玻璃实体表面，只显示几何骨架棱与辅助线
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={geometryData.wireframeOnly || false}
                                    onChange={(e) =>
                                        setGeometryData({ ...geometryData, wireframeOnly: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* 渐变消融微光分割缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                {/* 底部按钮栏 */}
                <DialogFooter className="p-4 px-6 flex items-center justify-end gap-2 border-0">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2 rounded-full border-0 text-xs font-medium bg-zinc-950/85 hover:bg-zinc-900/95 dark:bg-white/90 dark:text-zinc-950 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] cursor-pointer transition-all"
                    >
                        保存立体几何配置
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
