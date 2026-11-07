"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens";
import {
  DEFAULT_DUEL_CONFIG,
  DUEL_REFEREE_PRESETS,
  type DuelConfig,
  type DuelRefereeConfig,
  type DuelRefereePresetKey,
  type DuelScoreResult,
} from "@/lib/duel-config";
import { updateDuelConfigAction } from "@/lib/admin/duels";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";

interface DuelRefereeConfigPanelProps {
  config: DuelConfig;
  canEditConfig: boolean;
  canRunSandbox: boolean;
  onConfigSaved: (nextConfig: DuelConfig) => void;
}

const MODEL_SUGGESTIONS = [
  "deepseek-v4-flash",
  "deepseek-chat",
  "deepseek-reasoner",
] as const;

const SANDBOX_SAMPLES = [
  {
    label: "优质学术论证样例",
    topic: "经典牛顿力学在当代工程教育中是否仍应占据核心课时",
    position: "正方",
    content:
      "在低速宏观尺度（v << c）下，洛伦兹因子 γ = 1 / sqrt(1 - v²/c²) 与 1 的偏差小于 10⁻¹²。桥梁结构力学、航天器近地轨道机动以及流体力学纳维-斯托克斯方程的工程求解，全部建立在牛顿矢量力学与变分原理之上。过早削减经典力学课时，会导致学生在尚未建立守恒律物理直觉时陷入纯算符推演，反而不利于后续理解拉格朗日与哈密顿力学的统一框架。",
  },
  {
    label: "滑坡谬误反例",
    topic: "中学数学竞赛集训是否应当允许使用图形计算器辅助探索",
    position: "反方",
    content:
      "一旦允许学生在平时训练里碰一次图形计算器，他们就会彻底依赖机器而放弃手算推导；只要放弃手算，代数变形能力就会归零；代数能力归零后整个一代人都将丧失抽象思维能力，最终导致基础数学研究彻底停滞！因此绝对不能允许任何辅助工具进入课堂。",
  },
  {
    label: "空洞口号反例",
    topic: "开源大模型是否会在三年内全面超越闭源商业模型",
    position: "正方",
    content:
      "我觉得开源肯定赢，因为人多力量大，大家都支持开源，闭源模型肯定不行，这是显而易见的历史必然趋势，不需要解释。",
  },
] as const;

export function DuelRefereeConfigPanel({
  config,
  canEditConfig,
  canRunSandbox,
  onConfigSaved,
}: DuelRefereeConfigPanelProps) {
  const [form, setForm] = useState<DuelRefereeConfig>(config.referee);
  const [showPresetDetail, setShowPresetDetail] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 在线演练沙盒状态
  const [sandboxTopic, setSandboxTopic] = useState<string>(
    SANDBOX_SAMPLES[0].topic
  );
  const [sandboxPosition, setSandboxPosition] = useState<string>(
    SANDBOX_SAMPLES[0].position
  );
  const [sandboxContent, setSandboxContent] = useState<string>(
    SANDBOX_SAMPLES[0].content
  );
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxDurationMs, setSandboxDurationMs] = useState<number | null>(
    null
  );
  const [sandboxResult, setSandboxResult] = useState<DuelScoreResult | null>(
    null
  );

  const maxRoundScore =
    (Number(form.max_evidence_score) || 0) +
    (Number(form.max_citation_score) || 0) +
    (Number(form.max_logic_score) || 0);

  const handleSave = () => {
    if (!canEditConfig) return;
    startTransition(async () => {
      const res = await updateDuelConfigAction({
        referee: form,
        economy: config.economy,
      });
      if (!res.success || !res.config) {
        toast.error(res.error || "保存 AI 裁判配置失败");
        return;
      }
      setForm(res.config.referee);
      onConfigSaved(res.config);
      toast.success("AI 裁判人格与赋分规则已保存，全站 30 秒内热生效");
    });
  };

  const handleResetDefault = () => {
    setForm(DEFAULT_DUEL_CONFIG.referee);
    toast.info("已载入默认裁判参数（初高中亲和启发预设），点击保存后生效");
  };

  const handleRunSandbox = async () => {
    if (!sandboxTopic.trim() || !sandboxContent.trim()) {
      toast.error("请填写沙盒测试辩题与测试论点内容");
      return;
    }
    setSandboxRunning(true);
    try {
      const resp = await fetch("/api/admin/duels/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "sandbox",
          sandboxInput: {
            topic: sandboxTopic.trim(),
            position: sandboxPosition,
            content: sandboxContent.trim(),
          },
          overrideRefereeConfig: form,
        }),
      });
      const json = (await resp.json()) as {
        success?: boolean;
        error?: string;
        durationMs?: number;
        scoreData?: DuelScoreResult;
      };
      if (!resp.ok || !json.success || !json.scoreData) {
        toast.error(json.error || "沙盒试评失败");
        return;
      }
      setSandboxDurationMs(json.durationMs ?? 0);
      setSandboxResult(json.scoreData);
      toast.success("AI 裁判沙盒演练完成（未写入任何业务表）");
    } catch (err) {
      toast.error(
        "沙盒调用失败：" + (err instanceof Error ? err.message : "网络错误")
      );
    } finally {
      setSandboxRunning(false);
    }
  };

  const presetEntries = Object.entries(DUEL_REFEREE_PRESETS) as Array<
    [DuelRefereePresetKey, (typeof DUEL_REFEREE_PRESETS)[DuelRefereePresetKey]]
  >;
  const currentPresetMeta = DUEL_REFEREE_PRESETS[form.active_preset];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* 左侧 7 列：AI 裁判规则与人格预设热配置 */}
      <div className="xl:col-span-7 space-y-5">
        {/* 1. 裁判人格预设卡片矩阵 */}
        <div
          onMouseMove={trackPointer120fps}
          className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  AI 裁判人格预设引擎
                </h3>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  默认完整保留初高中生讨论亲和预设，支持按赛事规格一键切换审稿严苛度
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPresetDetail((v) => !v)}
              className="rounded-full border-0 bg-zinc-900/[0.05] hover:bg-zinc-900/[0.1] dark:bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              {showPresetDetail ? "收起提示词底稿" : "预览当前预设底稿"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {presetEntries.map(([key, meta]) => {
              const selected = form.active_preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!canEditConfig}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, active_preset: key }))
                  }
                  className={cn(
                    "rounded-2xl border-0 p-4 text-left transition-all cursor-pointer disabled:cursor-not-allowed",
                    selected
                      ? "bg-sky-500/15 text-sky-950 dark:text-sky-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_6px_18px_-4px_rgba(14,165,233,0.22)]"
                      : "bg-zinc-900/[0.035] hover:bg-zinc-900/[0.07] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="rounded-full border-0 bg-white/75 dark:bg-zinc-800/80 px-2.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                      {meta.badge}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold">{meta.label}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {meta.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {showPresetDetail && (
            <div className="rounded-2xl border-0 bg-zinc-900/[0.04] dark:bg-black/30 p-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                角色设定：{currentPresetMeta.personaHeader}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {currentPresetMeta.qualityRule}
              </p>
            </div>
          )}

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          {/* 模型与思维链开关 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                DeepSeek 推理模型标识
              </label>
              <input
                type="text"
                disabled={!canEditConfig}
                value={form.model}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, model: e.target.value }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {MODEL_SUGGESTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={!canEditConfig}
                    onClick={() => setForm((prev) => ({ ...prev, model: m }))}
                    className={cn(
                      "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                      form.model === m
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-500/10 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-0 bg-zinc-900/[0.035] dark:bg-white/[0.04] p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  启用 Thinking 深度思维链
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  开启后模型将在内部先推演双方因果漏洞再输出 JSON 分数，判罚准确度显著更高。
                </p>
              </div>
              <Switch
                className="border-0"
                disabled={!canEditConfig}
                checked={form.thinking_enabled}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, thinking_enabled: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* 2. 四维评分权重、谬误惩罚与反作弊参数 */}
        <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              四维赋分上限与反作弊参数
            </h3>
            <span className="rounded-full border-0 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
              单回合理论最高得分：+{maxRoundScore} 分
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                证据维度满分 (1-20)
              </span>
              <input
                type="number"
                min={1}
                max={20}
                disabled={!canEditConfig}
                value={form.max_evidence_score}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_evidence_score: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                引用/论据满分 (1-20)
              </span>
              <input
                type="number"
                min={1}
                max={20}
                disabled={!canEditConfig}
                value={form.max_citation_score}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_citation_score: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                逻辑交锋满分 (1-20)
              </span>
              <input
                type="number"
                min={1}
                max={20}
                disabled={!canEditConfig}
                value={form.max_logic_score}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_logic_score: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                谬误扣分 (负值)
              </span>
              <input
                type="number"
                max={-1}
                disabled={!canEditConfig}
                value={form.fallacy_penalty}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fallacy_penalty: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                谬误扣减 LP
              </span>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canEditConfig}
                value={form.fallacy_lp_deduction}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fallacy_lp_deduction: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                复读去重阈值
              </span>
              <input
                type="number"
                step="0.05"
                min={0.3}
                max={0.95}
                disabled={!canEditConfig}
                value={form.jaccard_threshold}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    jaccard_threshold: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                最短字数下限
              </span>
              <input
                type="number"
                min={5}
                max={500}
                disabled={!canEditConfig}
                value={form.min_content_length}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    min_content_length: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                单回合字数上限
              </span>
              <input
                type="number"
                min={500}
                max={30000}
                disabled={!canEditConfig}
                value={form.max_content_length}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_content_length: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              附加自定义裁判纪律指令（选填，将动态注入 System Prompt 尾部）
            </label>
            <textarea
              rows={3}
              disabled={!canEditConfig}
              placeholder="例如：若一方给出可验证的数学反例或代码复现步骤，应在逻辑交锋维度优先给予满分..."
              value={form.custom_instructions}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  custom_instructions: e.target.value,
                }))
              }
              className="w-full rounded-2xl border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] p-3.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {canEditConfig ? (
              <>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/20 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  恢复默认预设参数
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={MOTION_SPRINGS.hapticTap}
                  disabled={isPending}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-5 py-2.5 text-xs font-medium shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)] disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  保存裁判配置（30秒热生效）
                </motion.button>
              </>
            ) : (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                当前角色为只读/版主视图，修改全局 AI 裁判配置需管理员（admin）及以上权限。
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 右侧 5 列：AI 裁判在线演练沙盒 */}
      <div className="xl:col-span-5 rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              AI 裁判在线演练沙盒
            </h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              实时套用左侧未保存表单参数进行无痕干跑测试，零数据库写入
            </p>
          </div>
        </div>

        {/* 快速样例胶囊 */}
        <div className="flex flex-wrap gap-1.5">
          {SANDBOX_SAMPLES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setSandboxTopic(sample.topic);
                setSandboxPosition(sample.position);
                setSandboxContent(sample.content);
              }}
              className="rounded-full border-0 bg-zinc-900/[0.05] hover:bg-zinc-900/[0.1] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] px-3 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              载入：{sample.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              沙盒测试辩题
            </label>
            <input
              type="text"
              value={sandboxTopic}
              onChange={(e) => setSandboxTopic(e.target.value)}
              className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              模拟发言方立场
            </span>
            <div className="inline-flex rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.06] p-1 gap-1">
              {["正方", "反方"].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setSandboxPosition(pos)}
                  className={cn(
                    "rounded-full border-0 px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    sandboxPosition === pos
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                      : "text-zinc-500"
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              测试论点正文
            </label>
            <textarea
              rows={5}
              value={sandboxContent}
              onChange={(e) => setSandboxContent(e.target.value)}
              className="w-full rounded-2xl border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] p-3.5 text-xs leading-relaxed font-medium text-zinc-900 dark:text-zinc-100 outline-none"
            />
          </div>

          {canRunSandbox ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={MOTION_SPRINGS.hapticTap}
              disabled={sandboxRunning}
              onClick={() => void handleRunSandbox()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-5 py-2.5 text-xs font-medium shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] disabled:opacity-50 cursor-pointer"
            >
              {sandboxRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  DeepSeek 裁判正在推演打分...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  运行沙盒试评（不写库）
                </>
              )}
            </motion.button>
          ) : (
            <p className="text-center text-xs font-medium text-zinc-400">
              调用在线大模型沙盒需版主（moderator）及以上权限
            </p>
          )}
        </div>

        {/* 沙盒演练结果回显 */}
        {sandboxResult && (
          <div className="rounded-2xl border-0 bg-zinc-900/[0.04] dark:bg-white/[0.05] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                沙盒判分结果（预设：{currentPresetMeta.label}）
              </span>
              {sandboxDurationMs !== null && (
                <span className="text-zinc-400 tabular-nums">
                  耗时 {(sandboxDurationMs / 1000).toFixed(2)}s
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs font-medium tabular-nums">
              <span className="rounded-full border-0 bg-sky-500/15 px-2.5 py-0.5 text-sky-700 dark:text-sky-300">
                证据 +{sandboxResult.evidenceScore}
              </span>
              <span className="rounded-full border-0 bg-indigo-500/15 px-2.5 py-0.5 text-indigo-700 dark:text-indigo-300">
                引用 +{sandboxResult.citationScore}
              </span>
              <span className="rounded-full border-0 bg-emerald-500/15 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-300">
                逻辑 +{sandboxResult.logicScore}
              </span>
              {sandboxResult.hasFallacy && (
                <span className="inline-flex items-center gap-1 rounded-full border-0 bg-rose-500/20 px-2.5 py-0.5 text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-3 w-3" />
                  {sandboxResult.fallacyType || "逻辑谬误"}{" "}
                  {sandboxResult.fallacyPenalty}
                </span>
              )}
              <span className="rounded-full border-0 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-0.5 font-semibold">
                总分{" "}
                {sandboxResult.totalScore > 0
                  ? `+${sandboxResult.totalScore}`
                  : sandboxResult.totalScore}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {sandboxResult.analysis}
            </p>

            {(sandboxResult.highlights.length > 0 ||
              sandboxResult.weaknesses.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                {sandboxResult.highlights.length > 0 && (
                  <div className="rounded-2xl border-0 bg-emerald-500/[0.08] p-2.5 space-y-1">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      论证亮点
                    </div>
                    {sandboxResult.highlights.map((h, idx) => (
                      <p key={idx} className="text-zinc-600 dark:text-zinc-300">
                        · {h}
                      </p>
                    ))}
                  </div>
                )}
                {sandboxResult.weaknesses.length > 0 && (
                  <div className="rounded-2xl border-0 bg-amber-500/[0.08] p-2.5 space-y-1">
                    <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      改进空间
                    </div>
                    {sandboxResult.weaknesses.map((w, idx) => (
                      <p key={idx} className="text-zinc-600 dark:text-zinc-300">
                        · {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
