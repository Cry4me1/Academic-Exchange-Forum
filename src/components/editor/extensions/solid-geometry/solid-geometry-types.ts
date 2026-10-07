export type SolidGeometryType =
    | "cube"
    | "tetrahedron"
    | "prism"
    | "cylinder"
    | "cone"
    | "sphere"
    | "coordinate-system"
    | "custom";

export interface GeometryVertex {
    id: string;
    label: string;
    position: [number, number, number];
    color?: string;
    isAuxiliary?: boolean;
}

export interface GeometryEdge {
    from: string;
    to: string;
    style: "solid" | "dashed";
    color?: string;
    width?: number;
    label?: string;
}

export interface GeometryFace {
    id: string;
    vertexIds: string[];
    color?: string;
    opacity?: number;
    isCrossSection?: boolean;
}

export interface SolidGeometryData {
    shapeType: SolidGeometryType;
    dimensions: {
        width?: number;
        depth?: number;
        height?: number;
        radius?: number;
        segments?: number;
    };
    vertices: GeometryVertex[];
    edges: GeometryEdge[];
    faces?: GeometryFace[];
    showCoordinates?: boolean;
    showLabels?: boolean;
    wireframeOnly?: boolean;
    cuttingPlane?: {
        enabled: boolean;
        axis: "x" | "y" | "z";
        position: number;
    };
    unfoldProgress?: number;
}

export interface SolidGeometryAttrs {
    title: string;
    subtitle: string;
    presetKey: string;
    geometryData: SolidGeometryData;
}
