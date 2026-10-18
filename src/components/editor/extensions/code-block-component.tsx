"use client";

import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
  Check,
  ChevronDown,
  Copy,
  Play,
  RotateCcw,
  Terminal,
  Image as ImageIcon,
  ChevronUp,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// 常用编程语言列表
const LANGUAGES = [
  { value: "", label: "自动检测" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "latex", label: "LaTeX" },
  { value: "plaintext", label: "纯文本" },
];

async function getCodeHash(str: string): Promise<string> {
  try {
    const normalized = str.trim().replace(/\r\n/g, "\n");
    const buffer = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

interface ExecutionResult {
  cached: boolean;
  stdout: string;
  stderr: string;
  images: string[];
  execution_time_ms: number;
  first_run_user_name?: string;
  first_run_at?: string;
  hit_count?: number;
}

export function CodeBlockComponent({
  node,
  updateAttributes,
  extension,
}: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 快照与执行状态
  const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
  const [snapshotMeta, setSnapshotMeta] = useState<{
    first_run_user_name?: string;
    execution_time_ms?: number;
  } | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<"stdout" | "visual">("stdout");

  const language = (node.attrs.language || "").toLowerCase();
  const isPython = language === "python" || language === "py";
  const currentLabel =
    LANGUAGES.find((l) => l.value === language)?.label ||
    node.attrs.language ||
    "自动检测";

  const isEditable = extension.options.editable !== false;

  // 轻量探针感知是否已有学者运行过
  useEffect(() => {
    if (!isPython) return;

    let isMounted = true;
    const probeCache = async () => {
      const codeText = node.textContent;
      if (!codeText || !codeText.trim()) return;

      const hash = await getCodeHash(codeText);
      if (!hash || !isMounted) return;

      try {
        const res = await fetch(`/api/sandbox/execute-or-cache?hash=${hash}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.hasCached && isMounted) {
          setHasCachedSnapshot(true);
          setSnapshotMeta({
            first_run_user_name: data.first_run_user_name,
            execution_time_ms: data.execution_time_ms,
          });
        }
      } catch {
        // 静默处理探针网络
      }
    };

    probeCache();
    return () => {
      isMounted = false;
    };
  }, [node.textContent, isPython]);

  // 点击运行逻辑
  const handleToggleRun = async (forceRerun = false) => {
    if (isRunning) return;

    // 若已经处于展示态且未强制重跑，仅做收起折叠
    if (execResult && !forceRerun) {
      setShowResult((prev) => !prev);
      return;
    }

    setIsRunning(true);
    setShowResult(true);

    try {
      const codeText = node.textContent;
      const res = await fetch("/api/sandbox/execute-or-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeText, forceRerun }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setExecResult({
          cached: false,
          stdout: "",
          stderr: errJson.error || "执行异常，请检查语法或依赖",
          images: [],
          execution_time_ms: 0,
        });
        return;
      }

      const data: ExecutionResult = await res.json();
      setExecResult(data);
      setHasCachedSnapshot(true);
      setSnapshotMeta({
        first_run_user_name: data.first_run_user_name,
        execution_time_ms: data.execution_time_ms,
      });

      if (data.images && data.images.length > 0) {
        setActiveTab("visual");
      } else {
        setActiveTab("stdout");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "网络通信失败";
      setExecResult({
        cached: false,
        stdout: "",
        stderr: msg,
        images: [],
        execution_time_ms: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleCopy = useCallback(() => {
    const text = node.textContent;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [node]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang || null });
      setShowDropdown(false);
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-6 rounded-2xl overflow-hidden border-0 bg-[#0c0d0e] shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
      
      {/* 顶部工具栏: 极简纯净排版 */}
      <div className="flex items-center justify-between h-9 px-4 bg-zinc-900/60 backdrop-blur-xl border-0 select-none">
        
        {/* 左侧: 语言指示 */}
        <div className="flex items-center gap-2.5" ref={dropdownRef}>
          {isEditable ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDropdown((prev) => !prev);
                }}
              >
                <span>{currentLabel}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-40 bg-zinc-900/95 border-0 rounded-xl shadow-2xl py-1 max-h-56 overflow-y-auto z-[9999] backdrop-blur-2xl">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors cursor-pointer ${
                        language === lang.value
                          ? "text-zinc-100 bg-white/10 font-medium"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLanguageChange(lang.value);
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 font-medium">
                {currentLabel}
              </span>
              {isPython && hasCachedSnapshot && (
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.4)]" />
                  已复现
                </span>
              )}
            </div>
          )}
        </div>

        {/* 右侧: 水滴胶囊功能键 */}
        <div className="flex items-center gap-2">
          
          {/* 运行 / 查看结果胶囊 */}
          {isPython && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleToggleRun(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border-0 transition-all cursor-pointer ${
                isRunning
                  ? "bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-80"
                  : showResult
                  ? "bg-white/15 hover:bg-white/20 text-zinc-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]"
                  : hasCachedSnapshot
                  ? "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] active:scale-[0.98]"
                  : "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] active:scale-[0.98]"
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>计算中</span>
                </>
              ) : showResult ? (
                <>
                  <ChevronUp className="w-3 h-3 opacity-60" />
                  <span>收起</span>
                </>
              ) : hasCachedSnapshot ? (
                <>
                  <Play className="w-2.5 h-2.5 fill-current opacity-70" />
                  <span>查看结果</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current opacity-70" />
                  <span>运行</span>
                </>
              )}
            </button>
          )}

          {/* 复制代码 */}
          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors cursor-pointer"
            onClick={handleCopy}
            title="复制代码"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* 消融细缝 */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* 代码内容 */}
      <pre className="!rounded-none !mt-0 !border-0 bg-transparent px-4 py-3.5 font-mono text-xs leading-relaxed text-zinc-200 overflow-x-auto selection:bg-white/20">
        <NodeViewContent as="code" />
      </pre>

      {/* 结果折叠区: 克制细腻的控制台抽屉 */}
      {showResult && (
        <div className="border-0 bg-[#090a0b]/90 backdrop-blur-2xl transition-all duration-200">
          
          {/* 光缝分割 */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />

          {/* 控制台元信息条 */}
          <div className="flex items-center justify-between h-8 px-4 text-[11px] text-zinc-400 font-mono">
            
            {/* 左侧状态 */}
            <div className="flex items-center gap-2">
              {execResult?.cached ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                  <span>快照命中</span>
                  {execResult.execution_time_ms ? (
                    <span className="text-zinc-500">· {execResult.execution_time_ms}ms</span>
                  ) : null}
                  {execResult.first_run_user_name ? (
                    <span className="text-zinc-500">· @{execResult.first_run_user_name} 验证</span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>首次运算已归档</span>
                  {execResult?.execution_time_ms ? (
                    <span className="text-zinc-500">· {execResult.execution_time_ms}ms</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* 右侧: Tab 切换与重新运行 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("stdout")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    activeTab === "stdout"
                      ? "bg-white/10 text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>终端</span>
                </button>
                {execResult?.images && execResult.images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("visual")}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                      activeTab === "visual"
                        ? "bg-white/10 text-zinc-200"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>图表 ({execResult.images.length})</span>
                  </button>
                )}
              </div>

              {/* 重新运行按键 */}
              <button
                type="button"
                onClick={() => handleToggleRun(true)}
                disabled={isRunning}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="重新在显卡中复算并更新快照"
              >
                <RotateCcw className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
                <span>重跑</span>
              </button>
            </div>
          </div>

          {/* 内容区 */}
          <div className="px-4 py-3 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto">
            {isRunning ? (
              <div className="py-6 flex items-center justify-center text-zinc-500 gap-2 font-mono text-xs">
                <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span>GPU 硬件正在加速计算计算图...</span>
              </div>
            ) : activeTab === "stdout" ? (
              execResult?.stdout || execResult?.stderr ? (
                <div className="space-y-1">
                  {execResult.stdout && (
                    <pre className="whitespace-pre-wrap select-text text-zinc-300 font-mono">
                      {execResult.stdout}
                    </pre>
                  )}
                  {execResult.stderr && (
                    <pre className="whitespace-pre-wrap select-text text-rose-400/90 font-mono">
                      {execResult.stderr}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="py-2 text-zinc-500">执行完毕，无标准输出。</div>
              )
            ) : execResult?.images && execResult.images.length > 0 ? (
              <div className="flex flex-col gap-3 py-1">
                {execResult.images.map((base64Str, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden bg-black p-1 shadow-sm">
                    <img
                      src={`data:image/png;base64,${base64Str}`}
                      alt={`Visual Output ${idx + 1}`}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-zinc-500">未检测到绘图输出。</div>
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
