"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  RotateCcw,
  Terminal,
  Image as ImageIcon,
  Copy,
  Check,
  Cpu,
} from "lucide-react";

// 学术底层算法推演案例
const STARTER_CODES = [
  {
    id: "autograd",
    title: "Autograd · 动态求导机制",
    code: `import torch

# 自动挂载最佳算力设备 (优先 NVIDIA CUDA 显卡)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"计算后端: {device.upper()} (PyTorch {torch.__version__})")

# 声明动态计算图叶子张量
x = torch.tensor([3.0], requires_grad=True, device=device)
y = x ** 2 + 2 * x + 1

# 触发反向传播链式求导: dy/dx = 2x + 2
y.backward()

print(f"函数前向值: y(3) = {y.item()}")
print(f"反向梯度值: dy/dx(3) = {x.grad.item()} (理论解析值: 8.0)")
`,
  },
  {
    id: "tensor",
    title: "Tensor · 张量广播与矩阵变换",
    code: `import torch

device = 'cuda' if torch.cuda.is_available() else 'cpu'

# 批量样本矩阵与权重矩阵
batch_x = torch.randn(4, 8, device=device)
weights = torch.randn(8, 2, requires_grad=True, device=device)
bias = torch.zeros(2, requires_grad=True, device=device)

# 线性仿射映射: Y = X @ W + b
output = torch.matmul(batch_x, weights) + bias
loss = output.sum()
loss.backward()

print(f"输入特征维度: {tuple(batch_x.shape)}")
print(f"前向输出维度: {tuple(output.shape)}")
print(f"权重梯度维度: {tuple(weights.grad.shape)}")
print("矩阵算子与梯度传递校验通过。")
`,
  },
  {
    id: "optimizer",
    title: "Optimizer · 损失收敛可视化",
    code: `import torch
import matplotlib.pyplot as plt

device = 'cuda' if torch.cuda.is_available() else 'cpu'

# 凸优化目标: 寻找使 (w - 5)^2 最小的参数 w
w = torch.tensor([1.0], requires_grad=True, device=device)
lr = 0.08
losses = []

for step in range(25):
    loss = (w - 5.0) ** 2
    losses.append(loss.item())
    
    loss.backward()
    with torch.no_grad():
        w -= lr * w.grad
        w.grad.zero_()

print(f"优化收敛: 最优解 w = {w.item():.4f} (目标理论值: 5.0)")

# 绘制学术收敛折线图
plt.figure(figsize=(6, 3))
plt.plot(losses, marker='o', markersize=3.5, color='#38bdf8', linewidth=1.8, label='MSE Loss')
plt.title('Optimization Convergence Curve', color='white', fontsize=11)
plt.xlabel('Iterations', color='#94a3b8', fontsize=9)
plt.ylabel('Loss Value', color='#94a3b8', fontsize=9)
plt.tick_params(colors='#94a3b8', labelsize=8)
plt.grid(True, linestyle='--', alpha=0.15)
plt.legend(frameon=False, labelcolor='white')
plt.tight_layout()
plt.show()
`,
  },
];

export function LiquidPythonSandbox() {
  const [activeTemplateId, setActiveTemplateId] = useState(STARTER_CODES[0].id);
  const [code, setCode] = useState(STARTER_CODES[0].code);
  const [output, setOutput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "gallery">("terminal");
  const [isCopied, setIsCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSelectTemplate = (item: (typeof STARTER_CODES)[0]) => {
    setActiveTemplateId(item.id);
    setCode(item.code);
    setOutput("");
    setImages([]);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // 忽略
    }
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("");
    setImages([]);
    setActiveTab("terminal");

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/sandbox/execute-or-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, forceRerun: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errJson = await res.json();
        setOutput(`[错误] ${errJson.error || "执行失败"}`);
        setIsRunning(false);
        return;
      }

      const data = await res.json();
      setOutput(data.stdout || "");
      if (data.stderr) {
        setOutput((prev) => (prev ? prev + "\n" + data.stderr : data.stderr));
      }
      if (data.images && data.images.length > 0) {
        setImages(data.images);
        setActiveTab("gallery");
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setOutput(`[网络异常] ${e.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 rounded-3xl border-0 bg-white/60 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-[0_12px_40px_-6px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)] dark:shadow-[0_12px_40px_-6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] p-6 transition-all duration-300">
      
      {/* 顶部标题与控制水滴胶囊栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                计算实验室
              </h3>
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                CUDA 硬件加速就绪
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              支持 PyTorch 2.6 张量图谱推演、自动求导与学术绘图
            </p>
          </div>
        </div>

        {/* 右侧微交互水滴胶囊群 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? "已复制" : "复制"}
          </button>

          <button
            onClick={() => {
              const cur = STARTER_CODES.find((c) => c.id === activeTemplateId);
              if (cur) setCode(cur.code);
              setOutput("");
              setImages([]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-all shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>

          {/* 核心运行胶囊 */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full border-0 text-xs font-medium transition-all ${
              isRunning
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-80"
                : "bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-[0_4px_14px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95"
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                正在推演...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                运行
              </>
            )}
          </button>
        </div>
      </div>

      {/* 渐变消融内部细缝 */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-white/10 to-transparent my-1" />

      {/* 算法模式水滴标签切换 */}
      <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
        {STARTER_CODES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelectTemplate(t)}
            className={`text-xs px-3 py-1 rounded-full border-0 font-medium transition-all shrink-0 ${
              activeTemplateId === t.id
                ? "bg-zinc-900 text-white dark:bg-white/15 dark:text-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* 编辑区与控制台输出面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        {/* 代码输入区 */}
        <div className="flex flex-col rounded-2xl border-0 bg-[#0c0d0e] text-zinc-100 p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] h-[390px]">
          <div className="flex items-center justify-between pb-2 text-[11px] text-zinc-500 font-mono">
            <span>script.py</span>
            <span>Python 3.13</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 bg-transparent resize-none font-mono text-xs leading-relaxed text-zinc-200 focus:outline-none focus:ring-0 select-text selection:bg-white/20"
          />
        </div>

        {/* 结果输出面板 */}
        <div className="flex flex-col rounded-2xl border-0 bg-[#090a0b] text-zinc-200 p-4 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] h-[390px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 text-xs">
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-full">
              <button
                onClick={() => setActiveTab("terminal")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  activeTab === "terminal"
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal className="w-3 h-3" />
                终端
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  activeTab === "gallery"
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                图表 ({images.length})
              </button>
            </div>
            {images.length > 0 && (
              <span className="text-[11px] text-zinc-400 font-mono">
                已捕获 {images.length} 幅图像
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto rounded-xl bg-black/40 p-3 font-mono text-[11px] text-zinc-300">
            {activeTab === "terminal" ? (
              output ? (
                <pre className="whitespace-pre-wrap leading-relaxed select-text">{output}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                  <Terminal className="w-5 h-5 opacity-40" />
                  <span>点击「运行」观察计算图前向与反向传播</span>
                </div>
              )
            ) : images.length > 0 ? (
              <div className="flex flex-col gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden bg-black p-1">
                    <img
                      src={`data:image/png;base64,${img}`}
                      alt={`Matplotlib Output ${idx + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                <ImageIcon className="w-5 h-5 opacity-40" />
                <span>调用 plt.show() 自动在此挂载高分辨率学术图表</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
