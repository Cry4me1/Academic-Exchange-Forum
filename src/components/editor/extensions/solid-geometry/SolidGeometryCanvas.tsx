"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useTheme } from "next-themes";
import {
    RotateCw,
    Compass,
    Eye,
    Maximize2,
    Minimize2,
    Sliders,
    Layers,
    Move3D,
    FoldVertical,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SolidGeometryData } from "./solid-geometry-types";
import { buildGeometryGroup } from "./geometry-builder";
import { motion, AnimatePresence } from "framer-motion";

interface SolidGeometryCanvasProps {
    data: SolidGeometryData;
    height?: number | string;
    className?: string;
    onUpdateData?: (updated: Partial<SolidGeometryData>) => void;
    allowInteractiveAdjust?: boolean;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export default function SolidGeometryCanvas({
    data,
    height = 380,
    className,
    onUpdateData,
    allowInteractiveAdjust = true,
    isFullscreen = false,
    onToggleFullscreen,
}: SolidGeometryCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const currentGroupRef = useRef<THREE.Group | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const [isAutoRotate, setIsAutoRotate] = useState(false);
    const isAutoRotateRef = useRef(false);
    isAutoRotateRef.current = isAutoRotate;

    const [wireframeOnly, setWireframeOnly] = useState(data.wireframeOnly || false);
    const [showCoordinates, setShowCoordinates] = useState(data.showCoordinates || false);
    const [unfoldProgress, setUnfoldProgress] = useState(data.unfoldProgress || 0);
    const [showSliders, setShowSliders] = useState(false);

    // 默认等轴测相机视角
    const resetCamera = useCallback(() => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(3.5, 3.2, 4.5);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
    }, []);

    // 初始化 Three.js 场景
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        const width = container.clientWidth || 500;
        const heightPx = typeof height === "number" ? height : container.clientHeight || 360;

        // 1. Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // 2. Camera
        const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
        camera.position.set(3.5, 3.2, 4.5);
        cameraRef.current = camera;

        // 3. Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, heightPx);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        rendererRef.current = renderer;

        // 4. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 10, 0);
        scene.add(hemiLight);

        // 5. Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 0.9;
        controls.panSpeed = 0.6;
        controls.minDistance = 1.5;
        controls.maxDistance = 18;
        controlsRef.current = controls;

        // 6. Animation loop
        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);
            if (controlsRef.current) {
                if (isAutoRotateRef.current) {
                    controlsRef.current.autoRotate = true;
                    controlsRef.current.autoRotateSpeed = 2.0;
                } else {
                    controlsRef.current.autoRotate = false;
                }
                controlsRef.current.update();
            }
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };
        animate();

        // 7. Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width: newW, height: newH } = entry.contentRect;
                if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
                    cameraRef.current.aspect = newW / newH;
                    cameraRef.current.updateProjectionMatrix();
                    rendererRef.current.setSize(newW, newH);
                }
            }
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
            controls.dispose();
            renderer.dispose();
        };
    }, [height]);

    // 自动旋转状态变动联动
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isAutoRotate;
        }
    }, [isAutoRotate]);

    // 重新构建 3D 几何图形
    useEffect(() => {
        if (!sceneRef.current) return;
        const scene = sceneRef.current;

        // 移除旧几何对象组
        if (currentGroupRef.current) {
            scene.remove(currentGroupRef.current);
            currentGroupRef.current.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry?.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material?.dispose();
                    }
                }
            });
            currentGroupRef.current = null;
        }

        // 合并最新配置
        const mergedData: SolidGeometryData = {
            ...data,
            wireframeOnly,
            showCoordinates,
            unfoldProgress,
        };

        const group = buildGeometryGroup(mergedData, isDark);
        scene.add(group);
        currentGroupRef.current = group;
    }, [data, wireframeOnly, showCoordinates, unfoldProgress, isDark]);

    // 处理展开图滑块拖动
    const handleUnfoldChange = (val: number) => {
        setUnfoldProgress(val);
        onUpdateData?.({ unfoldProgress: val });
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative group/canvas w-full overflow-hidden select-none border-0 rounded-3xl",
                "bg-gradient-to-b from-slate-50/60 via-slate-100/40 to-slate-200/50 dark:from-zinc-900/60 dark:via-zinc-900/40 dark:to-zinc-950/60",
                "backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)]",
                isFullscreen && "h-full min-h-[460px] rounded-2xl",
                className
            )}
            style={{ height: isFullscreen ? "100%" : height }}
        >
            {/* Three.js Canvas */}
            <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing outline-none" />

            {/* Apple Liquid Glass: 悬浮水滴胶囊工具栏 */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 rounded-full border-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-opacity duration-200">
                {/* 重置等轴测视角 */}
                <button
                    type="button"
                    onClick={resetCamera}
                    title="重置视角 (Isometric)"
                    className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer border-0"
                >
                    <Compass size={15} />
                </button>

                {/* 展台自动旋转 */}
                <button
                    type="button"
                    onClick={() => setIsAutoRotate(!isAutoRotate)}
                    title={isAutoRotate ? "暂停自转" : "开启展台自转"}
                    className={cn(
                        "p-1.5 rounded-full transition-all cursor-pointer border-0",
                        isAutoRotate
                            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    )}
                >
                    <RotateCw size={15} className={cn(isAutoRotate && "animate-spin [animation-duration:4s]")} />
                </button>

                {/* 仅线框 / 半透明实体切换 */}
                <button
                    type="button"
                    onClick={() => {
                        const newVal = !wireframeOnly;
                        setWireframeOnly(newVal);
                        onUpdateData?.({ wireframeOnly: newVal });
                    }}
                    title={wireframeOnly ? "显示半透明表面" : "仅显示线框与辅助线"}
                    className={cn(
                        "p-1.5 rounded-full transition-all cursor-pointer border-0",
                        wireframeOnly
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    )}
                >
                    <Layers size={15} />
                </button>

                {/* 空间直角坐标系开关 */}
                <button
                    type="button"
                    onClick={() => {
                        const newVal = !showCoordinates;
                        setShowCoordinates(newVal);
                        onUpdateData?.({ showCoordinates: newVal });
                    }}
                    title={showCoordinates ? "隐藏空间坐标系 O-xyz" : "显示空间坐标系 O-xyz"}
                    className={cn(
                        "p-1.5 rounded-full transition-all cursor-pointer border-0",
                        showCoordinates
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                            : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                    )}
                >
                    <Move3D size={15} />
                </button>

                {/* 正方体展开图展开面板 */}
                {data.shapeType === "cube" && allowInteractiveAdjust && (
                    <button
                        type="button"
                        onClick={() => setShowSliders(!showSliders)}
                        title="多面体展开图动画控制"
                        className={cn(
                            "p-1.5 rounded-full transition-all cursor-pointer border-0",
                            showSliders || unfoldProgress > 0
                                ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]"
                                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                        )}
                    >
                        <FoldVertical size={15} />
                    </button>
                )}

                {/* 全屏切换 */}
                {onToggleFullscreen && (
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? "退出全屏" : "全屏沉浸模式"}
                        className="p-1.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer border-0"
                    >
                        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </button>
                )}
            </div>

            {/* 正方体展开图展开滑块悬浮药丸 */}
            <AnimatePresence>
                {showSliders && data.shapeType === "cube" && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-14 right-3 flex items-center gap-3 px-3.5 py-2 rounded-full border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] text-xs"
                    >
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 shrink-0">
                            平面展开图
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={unfoldProgress}
                            onChange={(e) => handleUnfoldChange(parseFloat(e.target.value))}
                            className="w-24 h-1.5 accent-sky-500 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">
                            {Math.round(unfoldProgress * 100)}%
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 左下角操作提示光晕胶囊 */}
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-[10px] text-zinc-500 dark:text-zinc-400 pointer-events-none shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500/70 animate-pulse" />
                <span>左键拖拽旋转 · 滚轮缩放 · 右键平移</span>
            </div>
        </div>
    );
}
