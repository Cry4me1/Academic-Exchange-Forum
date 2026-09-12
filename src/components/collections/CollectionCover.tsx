"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getCollectionCoverPreset, type LiquidGlassPattern } from "./CollectionCoverPresets";

interface CollectionCoverProps {
    coverUrl?: string | null;
    coverStyle?: string | null;
    size?: "sm" | "md" | "lg" | "hero";
    showEmblem?: boolean;
    showWatermark?: boolean;
    className?: string;
    children?: React.ReactNode;
}

/**
 * 流体光波与液态焦散折射 (Liquid Caustics & Flow Waves)
 */
function LiquidGlassWave({ pattern, accentColor }: { pattern: LiquidGlassPattern; accentColor: string }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 400 240"
        >
            <defs>
                <linearGradient id={`grad-flow-${pattern}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                    <stop offset="45%" stopColor={accentColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>

                <linearGradient id={`grad-arc-${pattern}`} x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                    <stop offset="60%" stopColor={accentColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* 流水状贝塞尔曲线光带 */}
            <path
                d="M -30,60 C 90,-20 180,180 290,70 C 350,10 390,90 440,40 L 440,260 L -30,260 Z"
                fill={`url(#grad-flow-${pattern})`}
                opacity="0.55"
            />

            {/* 液态折射光弧 */}
            <path
                d="M -20,150 C 80,80 180,220 280,110 C 340,50 380,140 430,90"
                fill="none"
                stroke={`url(#grad-arc-${pattern})`}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.8"
            />

            {/* 细腻的高光次光弧 */}
            <path
                d="M 10,180 C 110,110 200,240 300,140 C 360,80 400,160 440,120"
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeDasharray="4 6"
                opacity="0.4"
            />

            {/* 柔光椭圆流体环 */}
            <ellipse
                cx="290"
                cy="70"
                rx="70"
                ry="35"
                transform="rotate(-18 290 70)"
                fill="none"
                stroke={`url(#grad-arc-${pattern})`}
                strokeWidth="1.2"
                opacity="0.45"
            />
        </svg>
    );
}

export function CollectionCover({
    coverUrl,
    coverStyle,
    size = "md",
    showEmblem = true,
    showWatermark = true,
    className,
    children,
}: CollectionCoverProps) {
    const preset = getCollectionCoverPreset(coverStyle);
    const IconComponent = preset.icon;

    // 自定义上传图片时的渲染
    if (coverUrl) {
        return (
            <div className={cn("relative w-full h-full overflow-hidden bg-slate-950 select-none", className)}>
                <Image
                    src={coverUrl}
                    alt="Collection Cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out"
                />
                {/* 磨砂防眩渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
                {children}
            </div>
        );
    }

    const isSm = size === "sm";
    const isLg = size === "lg";
    const isHero = size === "hero";

    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden select-none flex flex-col justify-between",
                preset.class,
                className
            )}
        >
            {/* === 液态玻璃层 1: 多重有机流动液态光斑 (Metaball Liquid Orbs) === */}
            <div
                className="absolute -top-[15%] -left-[15%] w-[85%] h-[85%] rounded-full blur-[50px] sm:blur-[68px] pointer-events-none opacity-85 transition-transform duration-1000"
                style={{ backgroundColor: preset.primaryOrb }}
            />
            <div
                className="absolute -bottom-[20%] -right-[15%] w-[80%] h-[80%] rounded-full blur-[48px] sm:blur-[64px] pointer-events-none opacity-75"
                style={{ backgroundColor: preset.secondaryOrb }}
            />
            {preset.tertiaryOrb && (
                <div
                    className="absolute top-[30%] left-[35%] w-[55%] h-[55%] rounded-full blur-[42px] pointer-events-none opacity-50"
                    style={{ backgroundColor: preset.tertiaryOrb }}
                />
            )}

            {/* === 液态玻璃层 2: 流水波光与折射曲面光弧 === */}
            <LiquidGlassWave pattern={preset.liquidPattern} accentColor={preset.accentColor} />

            {/* === 液态玻璃层 3: 顶边镜面切光高光 (Specular Glass Highlight) === */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-10" />

            {/* === 液态玻璃层 4: 细微透光暗角与柔光 === */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/60 pointer-events-none" />

            {/* 顶部玻璃胶囊水印 */}
            {showWatermark && !isSm && (
                <div className="relative z-20 flex items-center justify-between px-3.5 pt-3 pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                        <span
                            className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse"
                            style={{ backgroundColor: preset.accentColor, color: preset.accentColor }}
                        />
                        <span className="text-[10px] font-medium tracking-tight text-white/90">
                            {preset.name}
                        </span>
                    </div>

                    <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">
                        {preset.enName}
                    </span>
                </div>
            )}

            {/* === 液态玻璃层 5: 超椭圆液态玻璃微标 (Squircle Glass Emblem) === */}
            {showEmblem && (
                <div
                    className={cn(
                        "relative z-20 flex-1 flex items-center justify-center p-2",
                        // 当有底部标题/遮罩内容槽时，底移安全距离，让徽标优雅处于上半部分视觉焦点，杜绝被遮挡
                        children ? "pb-14 sm:pb-16 pt-1" : ""
                    )}
                >
                    <div
                        className={cn(
                            "relative flex items-center justify-center transition-all duration-500 group-hover:scale-105",
                            // 标志性超椭圆与高折射率玻璃质感
                            "backdrop-blur-2xl bg-white/[0.14] dark:bg-white/[0.09]",
                            "border border-white/30 border-t-white/60 border-b-black/30",
                            isSm && "p-2 rounded-xl shadow-lg",
                            size === "md" && "p-3 rounded-[20px]",
                            (isLg || isHero) && "p-3.5 sm:p-4 rounded-[24px]"
                        )}
                        style={{
                            boxShadow: `
                                inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.5),
                                inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.25),
                                0 14px 32px -6px rgba(0, 0, 0, 0.45),
                                0 0 20px 2px ${preset.primaryOrb}
                            `,
                        }}
                    >
                        {/* 玻璃内表面菲涅尔微光弧 */}
                        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-white/[0.1] to-white/[0.3] pointer-events-none" />

                        <IconComponent
                            className={cn(
                                "relative z-10 transition-transform duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
                                isSm && "w-4 h-4",
                                size === "md" && "w-6 h-6",
                                isLg && "w-8 h-8 sm:w-9 sm:h-9",
                                isHero && "w-12 h-12"
                            )}
                            style={{ color: preset.accentColor }}
                        />
                    </div>
                </div>
            )}

            {/* 底部自定义插槽 */}
            {children && <div className="relative z-20 w-full">{children}</div>}
        </div>
    );
}
