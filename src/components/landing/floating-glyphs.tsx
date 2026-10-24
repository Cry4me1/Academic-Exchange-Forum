"use client";

import { motion } from "framer-motion";
import { MathText } from "@/components/ui/math-text";

interface GlyphConfig {
    tex: string;
    x: string;
    y: string;
    size: string;
    blur: string;
    duration: number;
    delay: number;
}

const GLYPHS: GlyphConfig[] = [
    {
        tex: "$\\mathrm{i}\\hbar\\,\\frac{\\partial \\Psi}{\\partial t} = \\hat{H}\\Psi$",
        x: "7%",
        y: "16%",
        size: "text-sm md:text-base",
        blur: "blur-[0.4px]",
        duration: 22,
        delay: 0,
    },
    {
        tex: "$\\nabla \\times \\mathbf{B} = \\mu_0\\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}$",
        x: "76%",
        y: "14%",
        size: "text-xs md:text-sm",
        blur: "blur-[0.8px]",
        duration: 26,
        delay: 2,
    },
    {
        tex: "$\\oint_{\\partial \\Omega} \\omega = \\int_{\\Omega} \\mathrm{d}\\omega$",
        x: "6%",
        y: "78%",
        size: "text-xs md:text-sm",
        blur: "blur-[0.6px]",
        duration: 24,
        delay: 4,
    },
    {
        tex: "$\\mathrm{e}^{\\mathrm{i}\\pi} + 1 = 0$",
        x: "86%",
        y: "74%",
        size: "text-sm md:text-base",
        blur: "blur-[0.3px]",
        duration: 20,
        delay: 1,
    },
    {
        tex: "$\\int_{-\\infty}^{\\infty} \\mathrm{e}^{-x^2}\\,\\mathrm{d}x = \\sqrt{\\pi}$",
        x: "74%",
        y: "44%",
        size: "text-xs md:text-sm",
        blur: "blur-[1px]",
        duration: 28,
        delay: 3,
    },
    {
        tex: "$\\zeta(2) = \\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$",
        x: "14%",
        y: "50%",
        size: "text-xs",
        blur: "blur-[1px]",
        duration: 23,
        delay: 5,
    },
    {
        tex: "$G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$",
        x: "46%",
        y: "88%",
        size: "text-xs md:text-sm",
        blur: "blur-[0.8px]",
        duration: 27,
        delay: 2,
    },
];

export function FloatingGlyphs() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
            {GLYPHS.map((glyph, index) => (
                <motion.div
                    key={index}
                    className={`absolute text-zinc-500/25 dark:text-amber-200/15 ${glyph.size} ${glyph.blur} transition-colors`}
                    style={{ left: glyph.x, top: glyph.y }}
                    animate={{
                        y: [0, -22, 0],
                        x: [0, 10, 0],
                        rotate: [-1.5, 2, -1.5],
                        opacity: [0.16, 0.38, 0.16],
                    }}
                    transition={{
                        duration: glyph.duration,
                        repeat: Infinity,
                        delay: glyph.delay,
                        ease: "easeInOut",
                    }}
                >
                    <MathText text={glyph.tex} inlineOnly />
                </motion.div>
            ))}
        </div>
    );
}
