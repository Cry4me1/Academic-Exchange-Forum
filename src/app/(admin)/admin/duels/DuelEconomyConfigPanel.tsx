"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens";
import {
  DEFAULT_DUEL_CONFIG,
  type DuelConfig,
  type DuelEconomyConfig,
} from "@/lib/duel-config";
import { updateDuelConfigAction } from "@/lib/admin/duels";
import {
  Clock,
  Coins,
  HeartPulse,
  Loader2,
  RotateCcw,
  Save,
  Trophy,
} from "lucide-react";

interface DuelEconomyConfigPanelProps {
  config: DuelConfig;
  canEditConfig: boolean;
  onConfigSaved: (nextConfig: DuelConfig) => void;
}

const ROUND_CANDIDATES = [1, 3, 5, 7, 9, 11] as const;

export function DuelEconomyConfigPanel({
  config,
  canEditConfig,
  onConfigSaved,
}: DuelEconomyConfigPanelProps) {
  const [form, setForm] = useState<DuelEconomyConfig>(config.economy);
  const [isPending, startTransition] = useTransition();

  const toggleAllowedRound = (roundVal: number) => {
    if (!canEditConfig) return;
    setForm((prev) => {
      const exists = prev.allowed_rounds.includes(roundVal);
      if (exists && prev.allowed_rounds.length <= 1) {
        toast.error("至少需保留一种可选回合赛制");
        return prev;
      }
      const next = exists
        ? prev.allowed_rounds.filter((r) => r !== roundVal)
        : [...prev.allowed_rounds, roundVal].sort((a, b) => a - b);
      return { ...prev, allowed_rounds: next };
    });
  };

  const handleReset = () => {
    setForm(DEFAULT_DUEL_CONFIG.economy);
    toast.info("已恢复默认经济与风控阈值，点击保存后生效");
  };

  const handleSave = () => {
    if (!canEditConfig) return;
    if (form.min_bet_amount > form.max_bet_amount) {
      toast.error("单笔最小质押声望不能大于单笔最大质押声望");
      return;
    }

    startTransition(async () => {
      const res = await updateDuelConfigAction({
        referee: config.referee,
        economy: form,
      });
      if (!res.success || !res.config) {
        toast.error(res.error || "保存经济与风控配置失败");
        return;
      }
      setForm(res.config.economy);
      onConfigSaved(res.config);
      toast.success("对决经济参数与数据库触发器风控规则已同步生效");
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 卡片 1：发起费门槛与未开赛自动全额退费 */}
        <div
          onMouseMove={trackPointer120fps}
          className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                发起门槛与自动退费保护
              </h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                由 PostgreSQL 原子 RPC 与状态跃迁触发器双重兜底保障
              </p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              发起学术对决消耗积分（设为 0 则全站免费发起）
            </label>
            <input
              type="number"
              min={0}
              max={10000}
              disabled={!canEditConfig}
              value={form.creation_fee}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  creation_fee: Number(e.target.value),
                }))
              }
              className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums text-zinc-900 dark:text-zinc-100 outline-none"
            />
          </div>

          <div className="rounded-2xl border-0 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                未开赛取消 / 拒战 100% 自动全额退费
              </p>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                开启后，当待应战（pending）对决被发起方主动撤回、受邀方婉拒或管理员清理流局时，自动向发起方 100% 退回所扣积分并同步关闭待处理邀请。
              </p>
            </div>
            <Switch
              className="border-0"
              disabled={!canEditConfig}
              checked={form.auto_refund_on_pending_cancel}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  auto_refund_on_pending_cancel: checked,
                }))
              }
            />
          </div>
        </div>

        {/* 卡片 2：生命值 LP、负分 KO 与可选回合赛制 */}
        <div
          onMouseMove={trackPointer120fps}
          className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                赛场生命值 (LP) 与 KO 赛制规则
              </h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                控制初始生命点数、负分直接击倒线及前台可选回合数
              </p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                双方初始生命值 LP (10-500)
              </span>
              <input
                type="number"
                min={10}
                max={500}
                disabled={!canEditConfig}
                value={form.initial_lp}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    initial_lp: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                累计负分 KO 阈值 (负值)
              </span>
              <input
                type="number"
                max={-5}
                disabled={!canEditConfig}
                value={form.negative_ko_threshold}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    negative_ko_threshold: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              前台发起挑战允许选择的回合数（多选水滴胶囊）
            </span>
            <div className="flex flex-wrap gap-2">
              {ROUND_CANDIDATES.map((r) => {
                const selected = form.allowed_rounds.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={!canEditConfig}
                    onClick={() => toggleAllowedRound(r)}
                    className={cn(
                      "rounded-full border-0 px-4 py-1.5 text-xs font-medium tabular-nums transition-all cursor-pointer",
                      selected
                        ? "bg-sky-500/20 text-sky-800 dark:text-sky-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)]"
                        : "bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {r} 回合制
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 卡片 3：胜负学术声望奖惩与观战质押风控 */}
        <div
          onMouseMove={trackPointer120fps}
          className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                学术声望结算与观战质押限额
              </h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                联动完赛触发器 handle_duel_end 与质押下单 RPC place_duel_bet
              </p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                获胜方奖励声望 (+)
              </span>
              <input
                type="number"
                min={0}
                max={200}
                disabled={!canEditConfig}
                value={form.win_reputation_reward}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    win_reputation_reward: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                落败方扣除声望 (-)
              </span>
              <input
                type="number"
                min={0}
                max={200}
                disabled={!canEditConfig}
                value={form.loss_reputation_penalty}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    loss_reputation_penalty: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                质押最低学者等级 Lv.
              </span>
              <input
                type="number"
                min={1}
                max={10}
                disabled={!canEditConfig}
                value={form.min_bet_level}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    min_bet_level: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                单笔最小质押额
              </span>
              <input
                type="number"
                min={1}
                max={1000}
                disabled={!canEditConfig}
                value={form.min_bet_amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    min_bet_amount: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                单笔最大质押额
              </span>
              <input
                type="number"
                min={10}
                max={100000}
                disabled={!canEditConfig}
                value={form.max_bet_amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_bet_amount: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-3.5 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>
          </div>
        </div>

        {/* 卡片 4：异常监控雷达超时告警窗口 */}
        <div
          onMouseMove={trackPointer120fps}
          className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-6 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                异常雷达超时监控窗口
              </h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                用于判定停滞对决、原帖死锁风险以及逾期未应战挑战邀请
              </p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                交锋停滞告警阈值（小时）
              </span>
              <input
                type="number"
                min={1}
                max={720}
                disabled={!canEditConfig}
                value={form.stall_warning_hours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    stall_warning_hours: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                挑战邀请逾期阈值（小时）
              </span>
              <input
                type="number"
                min={1}
                max={720}
                disabled={!canEditConfig}
                value={form.invite_expire_hours}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    invite_expire_hours: Number(e.target.value),
                  }))
                }
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.07] px-4 py-2 text-xs font-medium tabular-nums outline-none"
              />
            </label>
          </div>

          <p className="text-xs leading-relaxed font-medium text-zinc-500 dark:text-zinc-400">
            提示：当进行中对决超过停滞阈值且关联了社区帖子时，将在「异常雷达与仲裁」面板高亮提示锁帖死锁风险，方便版主一键解除锁定或切换发言方。
          </p>
        </div>
      </div>

      {/* 保存操作栏 */}
      <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] flex flex-wrap items-center justify-between gap-3">
        {canEditConfig ? (
          <>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-500/12 hover:bg-zinc-500/20 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 active:scale-[0.97] transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置为系统默认值
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={MOTION_SPRINGS.hapticTap}
              disabled={isPending}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-6 py-2.5 text-xs font-medium shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              保存经济与风控配置
            </motion.button>
          </>
        ) : (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            当前角色为只读/版主视图，修改全局经济参数需管理员（admin）及以上权限。
          </p>
        )}
      </div>
    </div>
  );
}
