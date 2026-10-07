import { SolidGeometryAttrs, SolidGeometryData } from "./solid-geometry-types";

export const SOLID_GEOMETRY_PRESETS: Record<string, SolidGeometryAttrs> = {
    "cube-diagonal-section": {
        title: "正方体与体对角面截面 (ABCD - A₁B₁C₁D₁)",
        subtitle: "立体几何经典模型：对角面截面 A₁C₁CA 与体对角线 B₁D 异面垂直判定",
        presetKey: "cube-diagonal-section",
        geometryData: {
            shapeType: "cube",
            dimensions: { width: 2, depth: 2, height: 2 },
            vertices: [
                { id: "A", label: "A", position: [-1, -1, 1], color: "#3b82f6" },
                { id: "B", label: "B", position: [1, -1, 1], color: "#3b82f6" },
                { id: "C", label: "C", position: [1, -1, -1], color: "#3b82f6" },
                { id: "D", label: "D", position: [-1, -1, -1], color: "#3b82f6" },
                { id: "A1", label: "A₁", position: [-1, 1, 1], color: "#3b82f6" },
                { id: "B1", label: "B₁", position: [1, 1, 1], color: "#3b82f6" },
                { id: "C1", label: "C₁", position: [1, 1, -1], color: "#3b82f6" },
                { id: "D1", label: "D₁", position: [-1, 1, -1], color: "#3b82f6" },
                { id: "O", label: "O", position: [0, -1, 0], color: "#f59e0b", isAuxiliary: true },
            ],
            edges: [
                // 底面
                { from: "A", to: "B", style: "solid" },
                { from: "B", to: "C", style: "solid" },
                { from: "C", to: "D", style: "dashed" },
                { from: "D", to: "A", style: "dashed" },
                // 顶面
                { from: "A1", to: "B1", style: "solid" },
                { from: "B1", to: "C1", style: "solid" },
                { from: "C1", to: "D1", style: "solid" },
                { from: "D1", to: "A1", style: "solid" },
                // 侧棱
                { from: "A", to: "A1", style: "solid" },
                { from: "B", to: "B1", style: "solid" },
                { from: "C", to: "C1", style: "solid" },
                { from: "D", to: "D1", style: "dashed" },
                // 辅助线：体对角线 B1D 与对角线 AC, A1C1
                { from: "B1", to: "D", style: "dashed", color: "#ef4444", width: 2, label: "体对角线" },
                { from: "A", to: "C", style: "dashed", color: "#0ea5e9", width: 1.5 },
                { from: "A1", to: "C1", style: "solid", color: "#0ea5e9", width: 1.5 },
                { from: "A1", to: "O", style: "dashed", color: "#f59e0b", width: 1.5 },
            ],
            faces: [
                // 对角截面 A1C1CA
                {
                    id: "section-A1C1CA",
                    vertexIds: ["A", "C", "C1", "A1"],
                    color: "#0ea5e9",
                    opacity: 0.35,
                    isCrossSection: true,
                },
            ],
            showCoordinates: false,
            showLabels: true,
            wireframeOnly: false,
            unfoldProgress: 0,
        },
    },
    "tetrahedron-height": {
        title: "正四面体与空间高线 (P - ABC)",
        subtitle: "外心垂足投影、侧面等腰三角形与二面角推导",
        presetKey: "tetrahedron-height",
        geometryData: {
            shapeType: "tetrahedron",
            dimensions: { width: 2.2, height: 1.8 },
            vertices: [
                { id: "P", label: "P", position: [0, 1.3, 0], color: "#8b5cf6" },
                { id: "A", label: "A", position: [-1.2, -0.7, 0.7], color: "#3b82f6" },
                { id: "B", label: "B", position: [1.2, -0.7, 0.7], color: "#3b82f6" },
                { id: "C", label: "C", position: [0, -0.7, -1.3], color: "#3b82f6" },
                { id: "H", label: "H", position: [0, -0.7, 0.03], color: "#ef4444", isAuxiliary: true },
                { id: "M", label: "M", position: [0, -0.7, 0.7], color: "#10b981", isAuxiliary: true },
            ],
            edges: [
                { from: "A", to: "B", style: "solid" },
                { from: "B", to: "C", style: "dashed" },
                { from: "C", to: "A", style: "dashed" },
                { from: "P", to: "A", style: "solid" },
                { from: "P", to: "B", style: "solid" },
                { from: "P", to: "C", style: "dashed" },
                // 空间高线与中线辅助线
                { from: "P", to: "H", style: "dashed", color: "#ef4444", width: 2, label: "高线 PH" },
                { from: "P", to: "M", style: "solid", color: "#10b981", width: 1.5, label: "斜高 PM" },
                { from: "C", to: "M", style: "dashed", color: "#10b981", width: 1.5 },
            ],
            faces: [
                // 底面 ABC
                {
                    id: "base-ABC",
                    vertexIds: ["A", "B", "C"],
                    color: "#64748b",
                    opacity: 0.15,
                },
                // 截面 PCM (二面角平面)
                {
                    id: "section-PCM",
                    vertexIds: ["P", "C", "M"],
                    color: "#8b5cf6",
                    opacity: 0.3,
                    isCrossSection: true,
                },
            ],
            showCoordinates: false,
            showLabels: true,
            wireframeOnly: false,
        },
    },
    "prism-cross-section": {
        title: "直三棱柱与倾斜截面 (ABC - A₁B₁C₁)",
        subtitle: "侧棱中截面交割多边形与空间向量法向量解法",
        presetKey: "prism-cross-section",
        geometryData: {
            shapeType: "prism",
            dimensions: { width: 2, depth: 1.6, height: 2.4 },
            vertices: [
                // 底面
                { id: "A", label: "A", position: [-1, -1.2, 0.8], color: "#3b82f6" },
                { id: "B", label: "B", position: [1, -1.2, 0.8], color: "#3b82f6" },
                { id: "C", label: "C", position: [0, -1.2, -0.9], color: "#3b82f6" },
                // 顶面
                { id: "A1", label: "A₁", position: [-1, 1.2, 0.8], color: "#3b82f6" },
                { id: "B1", label: "B₁", position: [1, 1.2, 0.8], color: "#3b82f6" },
                { id: "C1", label: "C₁", position: [0, 1.2, -0.9], color: "#3b82f6" },
                // 截面特征点 E, F, G
                { id: "E", label: "E", position: [-1, -0.2, 0.8], color: "#10b981", isAuxiliary: true },
                { id: "F", label: "F", position: [1, 0.3, 0.8], color: "#10b981", isAuxiliary: true },
                { id: "G", label: "G", position: [0, 0.6, -0.9], color: "#10b981", isAuxiliary: true },
            ],
            edges: [
                // 底面
                { from: "A", to: "B", style: "solid" },
                { from: "B", to: "C", style: "dashed" },
                { from: "C", to: "A", style: "dashed" },
                // 顶面
                { from: "A1", to: "B1", style: "solid" },
                { from: "B1", to: "C1", style: "solid" },
                { from: "C1", to: "A1", style: "solid" },
                // 侧棱
                { from: "A", to: "A1", style: "solid" },
                { from: "B", to: "B1", style: "solid" },
                { from: "C", to: "C1", style: "dashed" },
                // 截面边
                { from: "E", to: "F", style: "solid", color: "#10b981", width: 2 },
                { from: "F", to: "G", style: "dashed", color: "#10b981", width: 2 },
                { from: "G", to: "E", style: "dashed", color: "#10b981", width: 2 },
            ],
            faces: [
                // 倾斜截面 EFG
                {
                    id: "section-EFG",
                    vertexIds: ["E", "F", "G"],
                    color: "#10b981",
                    opacity: 0.35,
                    isCrossSection: true,
                },
            ],
            showCoordinates: false,
            showLabels: true,
            wireframeOnly: false,
        },
    },
    "cone-axial-section": {
        title: "圆锥与轴截面 (S - O)",
        subtitle: "母线、旋转体对称轴、高与底面圆的勾股空间结构",
        presetKey: "cone-axial-section",
        geometryData: {
            shapeType: "cone",
            dimensions: { radius: 1.4, height: 2.2, segments: 32 },
            vertices: [
                { id: "S", label: "S", position: [0, 1.4, 0], color: "#f59e0b" },
                { id: "O", label: "O", position: [0, -1.0, 0], color: "#f59e0b", isAuxiliary: true },
                { id: "A", label: "A", position: [-1.4, -1.0, 0], color: "#3b82f6" },
                { id: "B", label: "B", position: [1.4, -1.0, 0], color: "#3b82f6" },
                { id: "C", label: "C", position: [0, -1.0, 1.4], color: "#3b82f6" },
            ],
            edges: [
                { from: "S", to: "A", style: "solid", color: "#3b82f6", width: 1.5 },
                { from: "S", to: "B", style: "solid", color: "#3b82f6", width: 1.5 },
                { from: "S", to: "O", style: "dashed", color: "#ef4444", width: 2, label: "轴高 SO" },
                { from: "O", to: "A", style: "dashed", color: "#f59e0b", width: 1.5, label: "半径 r" },
                { from: "O", to: "B", style: "dashed", color: "#f59e0b", width: 1.5 },
                { from: "O", to: "C", style: "dashed", color: "#f59e0b", width: 1.5 },
            ],
            faces: [
                // 轴截面 SAB
                {
                    id: "section-SAB",
                    vertexIds: ["S", "A", "B"],
                    color: "#f59e0b",
                    opacity: 0.32,
                    isCrossSection: true,
                },
            ],
            showCoordinates: false,
            showLabels: true,
            wireframeOnly: false,
        },
    },
    "spatial-coordinates": {
        title: "空间直角坐标系与空间向量 (O - xyz)",
        subtitle: "立体几何解析向量法、空间点 M(x, y, z) 投影与平面法向量",
        presetKey: "spatial-coordinates",
        geometryData: {
            shapeType: "coordinate-system",
            dimensions: { width: 2.5, depth: 2.5, height: 2.5 },
            vertices: [
                { id: "O", label: "O", position: [0, 0, 0], color: "#64748b" },
                { id: "X", label: "x", position: [2.2, 0, 0], color: "#ef4444" },
                { id: "Y", label: "y", position: [0, 2.2, 0], color: "#10b981" },
                { id: "Z", label: "z", position: [0, 0, 2.2], color: "#3b82f6" },
                { id: "M", label: "M(1.2, 1.4, 1.0)", position: [1.2, 1.4, 1.0], color: "#8b5cf6" },
                { id: "Mxoy", label: "M'(x, y, 0)", position: [1.2, 1.4, 0], color: "#8b5cf6", isAuxiliary: true },
                { id: "Mx", label: "x₀", position: [1.2, 0, 0], color: "#ef4444", isAuxiliary: true },
                { id: "My", label: "y₀", position: [0, 1.4, 0], color: "#10b981", isAuxiliary: true },
            ],
            edges: [
                // 坐标轴
                { from: "O", to: "X", style: "solid", color: "#ef4444", width: 2.5 },
                { from: "O", to: "Y", style: "solid", color: "#10b981", width: 2.5 },
                { from: "O", to: "Z", style: "solid", color: "#3b82f6", width: 2.5 },
                // 空间向量 OM
                { from: "O", to: "M", style: "solid", color: "#8b5cf6", width: 3, label: "r = OM" },
                // 空间投影辅助虚线
                { from: "M", to: "Mxoy", style: "dashed", color: "#8b5cf6", width: 1.5 },
                { from: "Mxoy", to: "Mx", style: "dashed", color: "#64748b", width: 1.2 },
                { from: "Mxoy", to: "My", style: "dashed", color: "#64748b", width: 1.2 },
            ],
            faces: [
                // 投影盒底面
                {
                    id: "proj-box",
                    vertexIds: ["O", "Mx", "Mxoy", "My"],
                    color: "#8b5cf6",
                    opacity: 0.15,
                },
            ],
            showCoordinates: true,
            showLabels: true,
            wireframeOnly: false,
        },
    },
};
