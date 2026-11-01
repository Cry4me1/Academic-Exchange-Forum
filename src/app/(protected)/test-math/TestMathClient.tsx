"use client";

import NovelViewer from "@/components/editor/NovelViewer";
import Link from "next/link";
import { ArrowLeft, Sigma } from "lucide-react";

const mathContent = {
    type: "doc",
    content: [
        {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "KaTeX 数学渲染引擎测试" }],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "行内数学公式示例：质能方程 " },
                { type: "text", text: "$E = mc^2$" },
                { type: "text", text: "，以及勾股定理 " },
                { type: "text", text: "$a^2 + b^2 = c^2$" },
                { type: "text", text: "。" },
            ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "以下为高阶独立块级公式渲染：" },
            ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$" },
            ],
        },
        {
            type: "paragraph",
            content: [
                { type: "text", text: "$$f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi$$" },
            ],
        },
    ],
};

export default function TestMathClient() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-muted-foreground bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-0 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.6)] hover:text-foreground transition-all duration-300"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        返回控制台
                    </Link>
                    <span className="text-xs text-amber-500 font-mono bg-amber-500/10 px-3 py-1 rounded-full">
                        开发环境专用 (Dev Only)
                    </span>
                </div>

                <div className="p-8 rounded-3xl border-0 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.08)] space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                            <Sigma className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">富文本与 KaTeX 渲染基准测试</h1>
                            <p className="text-xs text-muted-foreground">用于验证 NovelViewer 数学扩展与 AST 节点解析兼容性</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-500/5">
                        <NovelViewer initialValue={mathContent} />
                    </div>
                </div>
            </div>
        </div>
    );
}
