"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ZoomableImageProps extends Omit<ImageProps, "onClick"> {
    containerClassName?: string;
    caption?: string;
}

export function ZoomableImage({
    src,
    alt,
    containerClassName,
    caption,
    className,
    ...props
}: ZoomableImageProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    // 重置缩放与位移
    const resetZoom = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const handleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resetZoom();
        setIsOpen(true);
    };

    const handleClose = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsOpen(false);
        resetZoom();
    };

    // 双击在 1x 与 2x 缩放之间切换
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (scale > 1) {
            resetZoom();
        } else {
            setScale(2);
        }
    };

    const zoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale((prev) => Math.min(prev + 0.5, 4));
    };

    const zoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale((prev) => {
            const next = Math.max(prev - 0.5, 1);
            if (next === 1) setPosition({ x: 0, y: 0 });
            return next;
        });
    };

    // ESC 键关闭
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                resetZoom();
            }
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, resetZoom]);

    const imageSrc = typeof src === "string" ? src : (src as any)?.src || "";

    return (
        <>
            {/* 缩略图容器 */}
            <div
                className={cn(
                    "group/zoom relative cursor-zoom-in select-none",
                    props.fill ? "w-full h-full inset-0" : "",
                    containerClassName
                )}
                onClick={handleOpen}
                onDoubleClick={handleOpen}
                title="双击或点击放大查看"
            >
                <Image
                    src={src}
                    alt={alt || "图片预览"}
                    className={cn(
                        "transition-transform duration-300 group-hover/zoom:scale-[1.015]",
                        className
                    )}
                    {...props}
                />

                {/* 悬浮提示角标 */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-medium shadow-xl border border-white/15">
                        <Maximize2 className="h-3 w-3 text-primary" />
                        双击 / 点击全屏
                    </span>
                </div>
            </div>

            {/* 通过 Portal 挂载到 document.body，彻底逃逸父级 backdrop-blur 和 overflow 限制 */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-6 select-none"
                                onClick={handleClose}
                            >
                                {/* 顶部控制栏 */}
                                <div
                                    className="w-full max-w-6xl flex items-center justify-between z-10 shrink-0 mb-3"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm font-semibold truncate max-w-[65%]">
                                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        <span className="truncate">{alt || caption || "图片预览"}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-full px-2.5 py-1 shadow-2xl">
                                        <button
                                            type="button"
                                            onClick={zoomOut}
                                            disabled={scale <= 1}
                                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded-full hover:bg-white/10"
                                            title="缩小"
                                        >
                                            <ZoomOut className="h-4 w-4" />
                                        </button>
                                        <span className="text-[11px] font-mono font-medium text-zinc-200 px-1.5 select-none min-w-[3.2rem] text-center">
                                            {Math.round(scale * 100)}%
                                        </span>
                                        <button
                                            type="button"
                                            onClick={zoomIn}
                                            disabled={scale >= 4}
                                            className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded-full hover:bg-white/10"
                                            title="放大"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </button>
                                        {scale !== 1 && (
                                            <button
                                                type="button"
                                                onClick={resetZoom}
                                                className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/10 ml-0.5"
                                                title="重置缩放 (100%)"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <div className="h-4 w-px bg-zinc-700 mx-1" />
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors rounded-full hover:bg-rose-500/15"
                                            title="关闭预览 (Esc)"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 大图展示主区域 */}
                                <div
                                    className="flex-1 w-full max-w-6xl flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing"
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={handleDoubleClick}
                                >
                                    <motion.div
                                        drag={scale > 1}
                                        dragConstraints={{
                                            left: -((scale - 1) * 500),
                                            right: (scale - 1) * 500,
                                            top: -((scale - 1) * 400),
                                            bottom: (scale - 1) * 400,
                                        }}
                                        dragElastic={0.15}
                                        animate={{
                                            scale: scale,
                                            x: position.x,
                                            y: position.y,
                                        }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        className="relative max-w-full max-h-full flex items-center justify-center"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageSrc}
                                            alt={alt || "高清大图预览"}
                                            className="max-h-[82vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10 bg-zinc-900/40 pointer-events-none"
                                        />
                                    </motion.div>
                                </div>

                                {/* 底部提示与说明 */}
                                <div className="mt-2 text-center text-xs text-zinc-400/80 pointer-events-none shrink-0">
                                    {caption && <p className="mb-0.5 text-zinc-300 font-medium">{caption}</p>}
                                    <p className="text-[11px] text-zinc-500">
                                        双击切换 200% 细节放大 · 支持拖拽平移 · 按 Esc 键关闭
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
