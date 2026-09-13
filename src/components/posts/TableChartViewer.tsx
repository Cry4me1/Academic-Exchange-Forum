"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Table, BarChart2, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParsedTableData {
    categoryKey: string;
    headers: string[];
    numericColumns: string[];
    data: Record<string, any>[];
}

/**
 * 智能解析 HTML 表格数据，嗅探是否包含可可视化的数值列
 */
export function parseTableData(tableEl: HTMLTableElement): ParsedTableData | null {
    const rows = Array.from(tableEl.querySelectorAll("tr"));
    if (rows.length < 2) return null;

    // 1. 获取表头单元格
    const headerRow = rows[0];
    const headerCells = Array.from(headerRow.querySelectorAll("th, td"));
    const headers = headerCells.map((c) => c.textContent?.trim() || "");
    if (headers.length < 2) return null;

    // 2. 获取数据行
    const dataRows = rows.slice(1);
    const numericColumns: string[] = [];

    // 检测哪些列是数值列 (至少 50% 以上的数据格能解析出有效数字)
    for (let colIdx = 1; colIdx < headers.length; colIdx++) {
        const colName = headers[colIdx];
        if (!colName) continue;
        let numCount = 0;
        let totalCount = 0;

        for (const row of dataRows) {
            const cells = Array.from(row.querySelectorAll("th, td"));
            if (cells[colIdx]) {
                totalCount++;
                const text = cells[colIdx].textContent?.trim() || "";
                const cleaned = text.replace(/[%mskKMGBx±+]/g, "").trim();
                const num = parseFloat(cleaned);
                if (!isNaN(num) && isFinite(num)) {
                    numCount++;
                }
            }
        }

        if (totalCount > 0 && numCount / totalCount >= 0.5) {
            numericColumns.push(colName);
        }
    }

    if (numericColumns.length === 0) {
        return null;
    }

    // 3. 构建 recharts 数据集
    const categoryKey = headers[0] || "类别";
    const data: Record<string, any>[] = [];

    for (const row of dataRows) {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const rowLabel = cells[0]?.textContent?.trim() || `样本 ${data.length + 1}`;
        const item: Record<string, any> = { [categoryKey]: rowLabel };

        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
            const colName = headers[colIdx];
            if (!colName) continue;
            const text = cells[colIdx]?.textContent?.trim() || "";
            const cleaned = text.replace(/[%mskKMGBx±+]/g, "").trim();
            const num = parseFloat(cleaned);
            item[colName] = !isNaN(num) && isFinite(num) ? num : 0;
            item[`${colName}_raw`] = text;
        }
        data.push(item);
    }

    return {
        categoryKey,
        headers,
        numericColumns,
        data,
    };
}

interface TableChartViewerProps {
    tableData: ParsedTableData;
    tableElement: HTMLElement;
}

const PALETTE = [
    "#0ea5e9", // Sky
    "#10b981", // Emerald
    "#8b5cf6", // Violet
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
];

// 自定义 Apple Liquid Glass 风格 Tooltip
const CustomGlassTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div
                className={cn(
                    "p-3 rounded-2xl border-0 select-none text-xs",
                    "backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90",
                    "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.9)]",
                    "dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.15)]"
                )}
            >
                <div className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{label}</span>
                </div>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => {
                        const rawKey = `${entry.dataKey}_raw`;
                        const rawValue = entry.payload?.[rawKey] || entry.value;
                        return (
                            <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span>{entry.name}:</span>
                                </div>
                                <span className="font-semibold text-foreground tabular-nums">
                                    {rawValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

export function TableChartViewer({ tableData, tableElement }: TableChartViewerProps) {
    const [viewMode, setViewMode] = useState<"table" | "bar" | "line">("table");

    // 当切换为图表时隐藏原始 table，切回 table 时恢复显示
    const handleModeChange = (mode: "table" | "bar" | "line") => {
        setViewMode(mode);
        if (mode === "table") {
            tableElement.style.display = "";
        } else {
            tableElement.style.display = "none";
        }
    };

    return (
        <div className="table-chart-viewer-portal my-3">
            {/* 顶栏控制条：Apple Liquid Glass 水滴胶囊 */}
            <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-2xl border-0 backdrop-blur-xl bg-zinc-100/60 dark:bg-zinc-900/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                {/* 左侧学术数据标识 */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span className="hidden sm:inline">学术实验数据可视化</span>
                    <span className="sm:hidden">数据视图</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono">
                        {tableData.numericColumns.length} 项指标
                    </span>
                </div>

                {/* 右侧视图切换胶囊 */}
                <div className="flex items-center p-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 border-0">
                    <button
                        type="button"
                        onClick={() => handleModeChange("table")}
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border-0 cursor-pointer",
                            viewMode === "table"
                                ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Table className="w-3 h-3" />
                        <span>表格</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleModeChange("bar")}
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border-0 cursor-pointer",
                            viewMode === "bar"
                                ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BarChart2 className="w-3 h-3" />
                        <span>柱状图</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleModeChange("line")}
                        className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border-0 cursor-pointer",
                            viewMode === "line"
                                ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <TrendingUp className="w-3 h-3" />
                        <span>折线图</span>
                    </button>
                </div>
            </div>

            {/* 图表渲染展示区 */}
            <AnimatePresence mode="wait">
                {viewMode !== "table" && (
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "w-full h-80 p-4 rounded-2xl border-0 select-none",
                            "backdrop-blur-xl bg-white/50 dark:bg-zinc-900/50",
                            "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.7)]",
                            "dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.1)]"
                        )}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            {viewMode === "bar" ? (
                                <BarChart data={tableData.data} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                    <XAxis
                                        dataKey={tableData.categoryKey}
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        tickLine={false}
                                        axisLine={{ opacity: 0.2 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        tickLine={false}
                                        axisLine={{ opacity: 0.2 }}
                                    />
                                    <RechartsTooltip content={<CustomGlassTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    {tableData.numericColumns.map((col, index) => (
                                        <Bar
                                            key={col}
                                            dataKey={col}
                                            name={col}
                                            fill={PALETTE[index % PALETTE.length]}
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={48}
                                        />
                                    ))}
                                </BarChart>
                            ) : (
                                <LineChart data={tableData.data} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                    <XAxis
                                        dataKey={tableData.categoryKey}
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        tickLine={false}
                                        axisLine={{ opacity: 0.2 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        tickLine={false}
                                        axisLine={{ opacity: 0.2 }}
                                    />
                                    <RechartsTooltip content={<CustomGlassTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    {tableData.numericColumns.map((col, index) => (
                                        <Line
                                            key={col}
                                            type="monotone"
                                            dataKey={col}
                                            name={col}
                                            stroke={PALETTE[index % PALETTE.length]}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, strokeWidth: 1.5, fill: "#fff" }}
                                            activeDot={{ r: 6, stroke: PALETTE[index % PALETTE.length], strokeWidth: 2 }}
                                        />
                                    ))}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TableChartViewer;
