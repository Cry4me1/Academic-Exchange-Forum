"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR =
    "a, button, [role='button'], input, textarea, select, summary, label, .cursor-pointer";

const REST_SHADOW = [
    "inset 0 1.5px 2px rgba(255, 255, 255, 0.98)",
    "inset 0 0 0 1px rgba(255, 255, 255, 0.72)",
    "inset 0 -2px 5px rgba(245, 158, 11, 0.24)",
    "0 8px 24px -3px rgba(15, 23, 42, 0.12)",
    "0 4px 14px -2px rgba(245, 158, 11, 0.18)",
].join(", ");

const HOVER_SHADOW = [
    "inset 0 1.5px 2.5px rgba(255, 255, 255, 1)",
    "inset 0 0 0 1px rgba(255, 255, 255, 0.86)",
    "inset 0 -2.5px 6px rgba(245, 158, 11, 0.34)",
    "0 12px 30px -4px rgba(245, 158, 11, 0.28)",
    "0 6px 18px -3px rgba(15, 23, 42, 0.12)",
].join(", ");

/**
 * Apple Liquid Glass 液态光学水滴跟随器
 * - 三层无边框光学体积：柔和琥珀环境晕 + 折射弯月面液态水滴 + 琥珀珠光微核
 * - 兼容浅色（#fafafc）与深色（#07090e）双主题对比度，不依赖系统动效开关拦截
 * - 纯 GPU transform 合成，静止自动休眠 rAF，移动即刻唤醒
 */
export function CursorFollower() {
    const dotRef = useRef<HTMLDivElement | null>(null);
    const dropletRef = useRef<HTMLDivElement | null>(null);
    const auraRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const dot = dotRef.current;
        const droplet = dropletRef.current;
        const aura = auraRef.current;
        if (!dot || !droplet || !aura) return;

        let mouseX = -100;
        let mouseY = -100;
        let prevMouseX = -100;
        let prevMouseY = -100;

        let blobX = -100;
        let blobY = -100;
        let currentAngle = 0;
        let currentHoverScale = 1;

        let isHovered = false;
        let isVisible = false;
        let isInitialized = false;
        let rafId: number | null = null;
        let isDestroyed = false;

        // 表面张力动能与双频水波相位
        let energy = 0;
        let phase1 = 0;
        let phase2 = 0;

        // 8 维有机圆角弹簧状态
        let tlX = 50, trX = 50, brX = 50, blX = 50;
        let tlY = 50, trY = 50, brY = 50, blY = 50;
        let vTlX = 0, vTrX = 0, vBrX = 0, vBlX = 0;
        let vTlY = 0, vTrY = 0, vBrY = 0, vBlY = 0;

        const applyHoverVisuals = (hovered: boolean) => {
            if (!isVisible) {
                dot.style.opacity = "0";
                droplet.style.opacity = "0";
                aura.style.opacity = "0";
                return;
            }
            dot.style.opacity = hovered ? "0.5" : "1";
            droplet.style.opacity = "1";
            aura.style.opacity = hovered ? "1" : "0.85";
            droplet.style.boxShadow = hovered ? HOVER_SHADOW : REST_SHADOW;
        };

        const wakeRenderLoop = () => {
            if (rafId === null && !isDestroyed) {
                rafId = requestAnimationFrame(render);
            }
        };

        const render = () => {
            rafId = null;
            if (isDestroyed) return;

            // 1. 液态质心平滑阻尼跟随（0.10 呈现清晰可见的丝滑拖尾惯性）
            const dx = mouseX - blobX;
            const dy = mouseY - blobY;
            blobX += dx * 0.1;
            blobY += dy * 0.1;

            // 2. 瞬时指针速度与切向旋转
            const stepX = mouseX - prevMouseX;
            const stepY = mouseY - prevMouseY;
            const speed = Math.min(Math.hypot(stepX, stepY), 100);
            prevMouseX = mouseX;
            prevMouseY = mouseY;

            if (speed > 0.5) {
                const targetAngle = Math.atan2(stepY, stepX) * (180 / Math.PI);
                let diff = (targetAngle - currentAngle) % 360;
                if (diff < -180) diff += 360;
                if (diff > 180) diff -= 360;
                currentAngle += diff * 0.18;
            }

            // 3. 水滴层流拉伸与悬停缩放（纯 GPU scale 驱动）
            energy = energy * 0.93 + speed * 0.1;
            phase1 += 0.15;
            phase2 += 0.24;

            const targetHoverScale = isHovered ? 1.34 : 1;
            currentHoverScale += (targetHoverScale - currentHoverScale) * 0.14;

            const stretch = Math.min(energy * 0.015, 0.85);
            const scaleX = currentHoverScale * (1 + stretch);
            const scaleY = currentHoverScale * Math.max(0.56, 1 - stretch * 0.48);

            // 4. 8 维圆角表面张力弹性形变（停下后优雅荡漾收敛为正圆）
            const deform = Math.min(energy * 1.35, 58);
            const w1 = Math.sin(phase1) * Math.min(energy * 0.55, 22);
            const w2 = Math.cos(phase2) * Math.min(energy * 0.42, 16);
            const wSum = w1 + w2;

            const k = 0.06;
            const damp = 0.84;

            vTlX = (vTlX + (50 + deform * 1.4 + wSum - tlX) * k) * damp;
            vTrX = (vTrX + (50 - deform * 1.1 - w1 - trX) * k) * damp;
            vBrX = (vBrX + (50 + deform * 1.25 - wSum - brX) * k) * damp;
            vBlX = (vBlX + (50 - deform * 1.3 + w2 - blX) * k) * damp;

            vTlY = (vTlY + (50 - deform * 1.25 - w2 - tlY) * k) * damp;
            vTrY = (vTrY + (50 + deform * 1.3 + wSum - trY) * k) * damp;
            vBrY = (vBrY + (50 - deform * 1.4 - w1 - brY) * k) * damp;
            vBlY = (vBlY + (50 + deform * 1.15 + wSum - blY) * k) * damp;

            tlX += vTlX; trX += vTrX; brX += vBrX; blX += vBlX;
            tlY += vTlY; trY += vTrY; brY += vBrY; blY += vBlY;

            const clampR = (v: number) => Math.max(16, Math.min(84, v)).toFixed(1);

            droplet.style.borderRadius =
                `${clampR(tlX)}% ${clampR(trX)}% ${clampR(brX)}% ${clampR(blX)}% / ` +
                `${clampR(tlY)}% ${clampR(trY)}% ${clampR(brY)}% ${clampR(blY)}%`;
            droplet.style.transform =
                `translate3d(${blobX.toFixed(2)}px, ${blobY.toFixed(2)}px, 0) ` +
                `translate(-50%, -50%) rotate(${currentAngle.toFixed(1)}deg) ` +
                `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;

            const auraScale = isHovered ? 1.22 : 1;
            aura.style.transform =
                `translate3d(${blobX.toFixed(2)}px, ${blobY.toFixed(2)}px, 0) ` +
                `translate(-50%, -50%) scale(${auraScale})`;

            // 5. 静止自动休眠：动能与位移完全收敛后暂停 rAF，下次移动即刻唤醒
            const unsettled =
                Math.hypot(dx, dy) > 0.12 ||
                energy > 0.04 ||
                Math.abs(targetHoverScale - currentHoverScale) > 0.004 ||
                Math.abs(tlX - 50) > 0.12;

            if (unsettled && isVisible) {
                rafId = requestAnimationFrame(render);
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isInitialized) {
                isInitialized = true;
                prevMouseX = mouseX;
                prevMouseY = mouseY;
                blobX = mouseX;
                blobY = mouseY;
            }

            const target = e.target instanceof Element ? e.target : null;
            const nextHovered = Boolean(target?.closest(INTERACTIVE_SELECTOR));

            if (!isVisible || nextHovered !== isHovered) {
                isVisible = true;
                isHovered = nextHovered;
                applyHoverVisuals(isHovered);
            }

            const dotScale = isHovered ? 0.75 : 1;
            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`;

            wakeRenderLoop();
        };

        const onMouseLeave = () => {
            isVisible = false;
            applyHoverVisuals(false);
        };

        const onMouseEnter = () => {
            if (!isInitialized) return;
            isVisible = true;
            applyHoverVisuals(isHovered);
            wakeRenderLoop();
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });
        document.addEventListener("mouseleave", onMouseLeave);
        document.addEventListener("mouseenter", onMouseEnter);

        return () => {
            isDestroyed = true;
            if (rafId !== null) cancelAnimationFrame(rafId);
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseleave", onMouseLeave);
            document.removeEventListener("mouseenter", onMouseEnter);
        };
    }, []);

    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
        >
            {/* 1. 外围温润琥珀漫射微光晕 */}
            <div
                ref={auraRef}
                className="pointer-events-none absolute left-0 top-0 h-36 w-36 rounded-full border-0 opacity-0 transition-opacity duration-300 ease-out"
                style={{
                    willChange: "transform, opacity",
                    background:
                        "radial-gradient(circle, rgba(245, 158, 11, 0.26) 0%, rgba(251, 146, 60, 0.11) 45%, rgba(254, 215, 170, 0.03) 68%, transparent 76%)",
                    filter: "blur(16px)",
                }}
            />

            {/* 2. 中层液态玻璃水滴：折射滤镜 + 菲涅尔内高光 + 次表面琥珀焦散阴影 */}
            <div
                ref={dropletRef}
                className="pointer-events-none absolute left-0 top-0 h-12 w-12 overflow-hidden border-0 opacity-0 transition-[opacity,box-shadow] duration-200 ease-out"
                style={{
                    willChange: "transform, border-radius",
                    backdropFilter: "blur(4px) saturate(180%) contrast(105%)",
                    WebkitBackdropFilter: "blur(4px) saturate(180%) contrast(105%)",
                    background:
                        "linear-gradient(135deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.08) 48%, rgba(245, 158, 11, 0.14) 100%)",
                    boxShadow: REST_SHADOW,
                }}
            >
                {/* 顶部菲涅尔镜面弧形高光 */}
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-[46%]"
                    style={{
                        background:
                            "radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.2) 48%, transparent 76%)",
                    }}
                />

                {/* 底部次表面温润琥珀反光 */}
                <div
                    className="pointer-events-none absolute inset-x-2 bottom-0 h-[30%] opacity-80"
                    style={{
                        background:
                            "radial-gradient(ellipse at 50% 100%, rgba(245, 158, 11, 0.34) 0%, transparent 78%)",
                    }}
                />
            </div>

            {/* 3. 核心琥珀珠光微点（无硬线框，浅色/深色背景均清晰可见） */}
            <div
                ref={dotRef}
                className="pointer-events-none absolute left-0 top-0 h-2 w-2 rounded-full border-0 bg-gradient-to-br from-white via-amber-300 to-amber-500 opacity-0 transition-opacity duration-150 shadow-[0_0_10px_rgba(245,158,11,0.8),0_1px_3px_rgba(15,23,42,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.95)]"
                style={{ willChange: "transform, opacity" }}
            />
        </div>
    );
}
