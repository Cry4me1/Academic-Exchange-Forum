import { LiquidPythonSandbox } from "@/components/lab/LiquidPythonSandbox";
import { ArrowLeft, Cpu } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "计算实验室 - Scholarly",
  description: "PyTorch 动态计算图推演、自动求导验证与学术图表实时生成",
};

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 返回与导航条 */}
        <div className="flex items-center justify-between">
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-0 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] hover:bg-white/90 dark:hover:bg-zinc-800/60 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 opacity-60" />
            <span>实验室</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border-0 bg-white/40 dark:bg-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90" />
              CUDA 12.4
            </span>
          </div>
        </div>

        {/* 顶部标题栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border-0 bg-white/60 dark:bg-zinc-950/40 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
              <Cpu className="h-6 w-6 text-zinc-800 dark:text-zinc-200" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-medium tracking-tight text-foreground font-title">
                  计算演练室
                </h1>
                <span className="inline-flex items-center text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                  PyTorch
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                基于物理硬件加速单元，实时推演自动求导与张量运算，即时绘制学术收敛图表。
              </p>
            </div>
          </div>
        </div>

        {/* 核心 Apple Liquid Glass 交互组件 */}
        <LiquidPythonSandbox />

      </div>
    </div>
  );
}
