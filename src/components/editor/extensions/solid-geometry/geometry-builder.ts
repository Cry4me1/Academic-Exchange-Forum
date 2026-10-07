import * as THREE from "three";
import {
    SolidGeometryData,
    GeometryVertex,
    GeometryEdge,
    GeometryFace,
} from "./solid-geometry-types";

/**
 * 创建高分辨率 2D 文字 Sprite（始终面向相机的文字标签）
 */
export function createTextSprite(
    text: string,
    color: string = "#1e293b",
    fontSize: number = 44,
    backgroundColor: string = "rgba(255, 255, 255, 0.75)"
): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 圆角气泡底色
        ctx.fillStyle = backgroundColor;
        const radius = 24;
        const x = 32;
        const y = 20;
        const w = 192;
        const h = 88;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // 细微外轮廓
        ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 字体渲染
        ctx.font = `bold ${fontSize}px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 128, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.6, 0.3, 1);
    return sprite;
}

/**
 * 构建立体几何全套 Three.js 场景对象组
 */
export function buildGeometryGroup(
    data: SolidGeometryData,
    isDark: boolean = false
): THREE.Group {
    const group = new THREE.Group();
    const vertexMap = new Map<string, THREE.Vector3>();

    // 1. 解析顶点
    data.vertices.forEach((v) => {
        const pos = new THREE.Vector3(...v.position);
        vertexMap.set(v.id, pos);

        // 顶点圆球标记
        const sphereGeo = new THREE.SphereGeometry(v.isAuxiliary ? 0.045 : 0.065, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: v.color || (v.isAuxiliary ? "#ef4444" : "#3b82f6"),
            roughness: 0.2,
            metalness: 0.1,
        });
        const pointMesh = new THREE.Mesh(sphereGeo, sphereMat);
        pointMesh.position.copy(pos);
        group.add(pointMesh);

        // 顶点文字标签
        if (data.showLabels !== false && v.label) {
            const labelColor = isDark ? "#f8fafc" : "#0f172a";
            const labelBg = isDark
                ? "rgba(30, 41, 59, 0.85)"
                : "rgba(255, 255, 255, 0.85)";
            const sprite = createTextSprite(v.label, labelColor, 40, labelBg);
            // 稍稍向右上偏移，避免与顶点球重叠
            sprite.position.copy(pos).add(new THREE.Vector3(0.14, 0.14, 0.14));
            group.add(sprite);
        }
    });

    // 2. 棱线与辅助线
    data.edges.forEach((edge) => {
        const p1 = vertexMap.get(edge.from);
        const p2 = vertexMap.get(edge.to);
        if (!p1 || !p2) return;

        const points = [p1, p2];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const edgeColor = edge.color
            ? edge.color
            : isDark
            ? "#cbd5e1"
            : "#475569";

        if (edge.style === "dashed") {
            const dashMat = new THREE.LineDashedMaterial({
                color: edgeColor,
                dashSize: 0.08,
                gapSize: 0.05,
                linewidth: edge.width || 1.5,
                transparent: true,
                opacity: 0.85,
            });
            const line = new THREE.Line(lineGeo, dashMat);
            line.computeLineDistances();
            group.add(line);
        } else {
            const lineMat = new THREE.LineBasicMaterial({
                color: edgeColor,
                linewidth: edge.width || 2,
                transparent: true,
                opacity: 0.95,
            });
            const line = new THREE.Line(lineGeo, lineMat);
            group.add(line);
        }
    });

    // 3. 几何面（半透明物理材质与剖切面）
    if (!data.wireframeOnly && data.faces && data.faces.length > 0) {
        data.faces.forEach((face) => {
            const positions: number[] = [];
            const facePoints = face.vertexIds
                .map((id) => vertexMap.get(id))
                .filter((p): p is THREE.Vector3 => !!p);

            if (facePoints.length >= 3) {
                // 简单多边形扇形三角化
                for (let i = 1; i < facePoints.length - 1; i++) {
                    positions.push(
                        facePoints[0].x, facePoints[0].y, facePoints[0].z,
                        facePoints[i].x, facePoints[i].y, facePoints[i].z,
                        facePoints[i + 1].x, facePoints[i + 1].y, facePoints[i + 1].z
                    );
                }

                const faceGeo = new THREE.BufferGeometry();
                faceGeo.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(positions, 3)
                );
                faceGeo.computeVertexNormals();

                const faceMat = new THREE.MeshPhysicalMaterial({
                    color: face.color || "#0ea5e9",
                    transparent: true,
                    opacity: face.opacity ?? (face.isCrossSection ? 0.38 : 0.18),
                    roughness: 0.1,
                    transmission: 0.3,
                    thickness: 0.5,
                    side: THREE.DoubleSide,
                    depthWrite: false, // 允许看透内部虚线
                });

                const mesh = new THREE.Mesh(faceGeo, faceMat);
                group.add(mesh);

                // 如果是截面，给截面边缘加一道亮色外轮廓光
                if (face.isCrossSection) {
                    const loopPoints = [...facePoints, facePoints[0]];
                    const loopGeo = new THREE.BufferGeometry().setFromPoints(loopPoints);
                    const loopMat = new THREE.LineBasicMaterial({
                        color: face.color || "#0ea5e9",
                        linewidth: 2.5,
                    });
                    const loopLine = new THREE.Line(loopGeo, loopMat);
                    group.add(loopLine);
                }
            }
        });
    }

    // 4. 原生平滑曲面支持（圆柱、圆锥、球体）
    if (!data.wireframeOnly) {
        if (data.shapeType === "cone") {
            const r = data.dimensions.radius || 1.4;
            const h = data.dimensions.height || 2.2;
            const coneGeo = new THREE.ConeGeometry(r, h, 36, 1, true);
            const coneMat = new THREE.MeshPhysicalMaterial({
                color: "#f59e0b",
                transparent: true,
                opacity: 0.15,
                roughness: 0.2,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const coneMesh = new THREE.Mesh(coneGeo, coneMat);
            // 调整中心位置与顶点对齐
            coneMesh.position.y = 0.2;
            group.add(coneMesh);
        } else if (data.shapeType === "cylinder") {
            const r = data.dimensions.radius || 1.2;
            const h = data.dimensions.height || 2.2;
            const cylGeo = new THREE.CylinderGeometry(r, r, h, 36, 1, true);
            const cylMat = new THREE.MeshPhysicalMaterial({
                color: "#10b981",
                transparent: true,
                opacity: 0.15,
                roughness: 0.2,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const cylMesh = new THREE.Mesh(cylGeo, cylMat);
            group.add(cylMesh);
        } else if (data.shapeType === "sphere") {
            const r = data.dimensions.radius || 1.5;
            const sphereGeo = new THREE.SphereGeometry(r, 32, 24);
            const sphereMat = new THREE.MeshPhysicalMaterial({
                color: "#6366f1",
                transparent: true,
                opacity: 0.15,
                roughness: 0.1,
                depthWrite: false,
            });
            const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
            group.add(sphereMesh);
        }
    }

    // 5. 空间直角坐标系 O-xyz 开关
    if (data.showCoordinates || data.shapeType === "coordinate-system") {
        const axisLength = 2.4;
        const origin = new THREE.Vector3(0, 0, 0);

        // X轴（红）
        const dirX = new THREE.Vector3(1, 0, 0);
        const arrowX = new THREE.ArrowHelper(dirX, origin, axisLength, 0xef4444, 0.2, 0.1);
        group.add(arrowX);

        // Y轴（绿）
        const dirY = new THREE.Vector3(0, 1, 0);
        const arrowY = new THREE.ArrowHelper(dirY, origin, axisLength, 0x10b981, 0.2, 0.1);
        group.add(arrowY);

        // Z轴（蓝）
        const dirZ = new THREE.Vector3(0, 0, 1);
        const arrowZ = new THREE.ArrowHelper(dirZ, origin, axisLength, 0x3b82f6, 0.2, 0.1);
        group.add(arrowZ);

        // 坐标平面的浅色参考网格 (XOZ 基底平面)
        const gridHelper = new THREE.GridHelper(4, 8, isDark ? 0x334155 : 0xe2e8f0, isDark ? 0x1e293b : 0xf1f5f9);
        gridHelper.position.y = -0.005;
        group.add(gridHelper);
    }

    // 6. 正方体展开图展开逻辑 (Unfold Progress)
    if (data.shapeType === "cube" && typeof data.unfoldProgress === "number" && data.unfoldProgress > 0) {
        // 创建独立展开图面组
        const p = data.unfoldProgress; // 0 ~ 1
        const angle = p * (Math.PI / 2);
        const size = (data.dimensions.width || 2) / 2;

        const unfoldGroup = new THREE.Group();
        const faceMaterial = new THREE.MeshPhysicalMaterial({
            color: "#3b82f6",
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        // 底面（中心不动）
        const baseGeo = new THREE.PlaneGeometry(size * 2, size * 2);
        const baseMesh = new THREE.Mesh(baseGeo, faceMaterial);
        baseMesh.rotation.x = -Math.PI / 2;
        baseMesh.position.y = -size;
        unfoldGroup.add(baseMesh);

        // 右面：从 x = size 处向外翻倒
        const rightPivot = new THREE.Group();
        rightPivot.position.set(size, -size, 0);
        const rightMesh = new THREE.Mesh(baseGeo, faceMaterial);
        rightMesh.position.set(size, 0, 0);
        rightMesh.rotation.x = -Math.PI / 2;
        rightPivot.add(rightMesh);
        rightPivot.rotation.z = -angle;
        unfoldGroup.add(rightPivot);

        // 左面：从 x = -size 处向外翻倒
        const leftPivot = new THREE.Group();
        leftPivot.position.set(-size, -size, 0);
        const leftMesh = new THREE.Mesh(baseGeo, faceMaterial);
        leftMesh.position.set(-size, 0, 0);
        leftMesh.rotation.x = -Math.PI / 2;
        leftPivot.add(leftMesh);
        leftPivot.rotation.z = angle;
        unfoldGroup.add(leftPivot);

        // 前面：从 z = size 处向外翻倒
        const frontPivot = new THREE.Group();
        frontPivot.position.set(0, -size, size);
        const frontMesh = new THREE.Mesh(baseGeo, faceMaterial);
        frontMesh.position.set(0, 0, size);
        frontMesh.rotation.x = -Math.PI / 2;
        frontPivot.add(frontMesh);
        frontPivot.rotation.x = angle;
        unfoldGroup.add(frontPivot);

        // 后面：从 z = -size 处向外翻倒
        const backPivot = new THREE.Group();
        backPivot.position.set(0, -size, -size);
        const backMesh = new THREE.Mesh(baseGeo, faceMaterial);
        backMesh.position.set(0, 0, -size);
        backMesh.rotation.x = -Math.PI / 2;
        backPivot.add(backMesh);
        backPivot.rotation.x = -angle;
        unfoldGroup.add(backPivot);

        // 顶面：挂在右面末端再翻 90 度
        const topPivot = new THREE.Group();
        topPivot.position.set(size * 2, 0, 0);
        const topMesh = new THREE.Mesh(baseGeo, faceMaterial);
        topMesh.position.set(size, 0, 0);
        topMesh.rotation.x = -Math.PI / 2;
        topPivot.add(topMesh);
        topPivot.rotation.z = -angle;
        rightPivot.add(topPivot);

        group.add(unfoldGroup);
    }

    return group;
}
