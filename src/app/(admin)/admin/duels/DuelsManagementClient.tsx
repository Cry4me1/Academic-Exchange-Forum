"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/admin/StatsCard";
import { cn } from "@/lib/utils";
import { MOTION_SPRINGS } from "@/lib/motion-tokens";
import type { AdminRole } from "@/lib/admin/permissions";
import type { DuelConfig } from "@/lib/duel-config";
import {
  getDuelAdminStats,
  getDuelAnomalies,
  type AdminDuelRow,
  type DuelAdminStats,
  type DuelAnomaliesData,
} from "@/lib/admin/duels";
import { DuelListPanel } from "./DuelListPanel";
import {
  DuelAnomalyPanel,
  DuelArbitrationDialog,
  type ArbitrationMode,
} from "./DuelAnomalyPanel";
import { DuelRefereeConfigPanel } from "./DuelRefereeConfigPanel";
import { DuelEconomyConfigPanel } from "./DuelEconomyConfigPanel";
import { DuelInspectDrawer } from "./DuelInspectDrawer";
import {
  Bot,
  Coins,
  ExternalLink,
  Lock,
  ShieldAlert,
  Swords,
  Trophy,
} from "lucide-react";

interface DuelsManagementClientProps {
  adminRole: AdminRole;
  initialConfig: DuelConfig;
  initialStats: DuelAdminStats;
  initialDuels: { data: AdminDuelRow[]; total: number };
  initialAnomalies: DuelAnomaliesData;
}

type MainWorkbenchTab = "list" | "anomalies" | "referee" | "economy";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "超级管理员（含完赛冲正权）",
  admin: "管理员（全量治理与热配）",
  moderator: "版主（巡检、仲裁与沙盒）",
  analyst: "数据分析师（全景只读巡检）",
};

export function DuelsManagementClient({
  adminRole,
  initialConfig,
  initialStats,
  initialDuels,
  initialAnomalies,
}: DuelsManagementClientProps) {
  const [activeTab, setActiveTab] = useState<MainWorkbenchTab>("list");
  const [config, setConfig] = useState<DuelConfig>(initialConfig);
  const [stats, setStats] = useState<DuelAdminStats>(initialStats);
  const [anomalies, setAnomalies] =
    useState<DuelAnomaliesData>(initialAnomalies);
  const [listRefreshSignal, setListRefreshSignal] = useState<number>(0);

  // 巡检抽屉状态
  const [inspectDuelId, setInspectDuelId] = useState<string | null>(null);
  const [inspectOpen, setInspectOpen] = useState<boolean>(false);

  // 原子仲裁弹窗状态
  const [arbitrateTarget, setArbitrateTarget] = useState<AdminDuelRow | null>(
    null
  );
  const [arbitrateDefaultAction, setArbitrateDefaultAction] = useState<
    ArbitrationMode | undefined
  >(undefined);
  const [arbitrateOpen, setArbitrateOpen] = useState<boolean>(false);

  const canModerate =
    adminRole === "moderator" ||
    adminRole === "admin" ||
    adminRole === "super_admin";
  const canEditConfig =
    adminRole === "admin" || adminRole === "super_admin";
  const isSuperAdmin = adminRole === "super_admin";

  const refreshOverviewAndAnomalies = useCallback(
    async (overrideCfg?: DuelConfig) => {
      const targetCfg = overrideCfg ?? config;
      const [nextStats, nextAnomalies] = await Promise.all([
        getDuelAdminStats(targetCfg),
        getDuelAnomalies(targetCfg),
      ]);
      setStats(nextStats);
      setAnomalies(nextAnomalies);
      setListRefreshSignal((n) => n + 1);
    },
    [config]
  );

  const handleOpenInspect = (duelId: string) => {
    setInspectDuelId(duelId);
    setInspectOpen(true);
  };

  const handleOpenArbitration = (
    duel: AdminDuelRow,
    defaultAction?: ArbitrationMode
  ) => {
    setArbitrateTarget(duel);
    setArbitrateDefaultAction(defaultAction);
    setArbitrateOpen(true);
  };

  const handleConfigSaved = (nextCfg: DuelConfig) => {
    setConfig(nextCfg);
    void refreshOverviewAndAnomalies(nextCfg);
  };

  const mainTabs = [
    {
      id: "list" as const,
      label: "对决全景巡检",
      icon: Swords,
      badge: stats.totalDuels,
    },
    {
      id: "anomalies" as const,
      label: "异常雷达与仲裁",
      icon: ShieldAlert,
      badge: stats.totalAnomalyCount,
      alert: stats.totalAnomalyCount > 0,
    },
    {
      id: "referee" as const,
      label: "AI 裁判与演练沙盒",
      icon: Bot,
    },
    {
      id: "economy" as const,
      label: "经济与风控配置",
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* 顶部标题舱 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-0 bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_8px_20px_-4px_rgba(14,165,233,0.2)]">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                学术对决治理与 AI 裁判中枢
              </h1>
              <span className="rounded-full border-0 bg-zinc-900/[0.06] dark:bg-white/[0.08] px-3 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {ROLE_LABELS[adminRole]}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              覆盖回合 LaTeX 巡检改判、孤儿回合补评、锁帖死锁解救、未开赛 100% 自动退费与 DeepSeek 裁判热配置
            </p>
          </div>
        </div>

        <Link
          href="/duels"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full border-0 bg-white/75 hover:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_-2px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-all"
        >
          前往前台学术对决大厅
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 顶部 4 大核心指标看板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="学术对决总场次"
          value={stats.totalDuels}
          subtitle={`交锋中 ${stats.activeDuels} · 待应战 ${stats.pendingDuels} · 已完赛 ${stats.completedDuels}`}
          icon={<Swords className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
          gradient="from-sky-500/15 to-cyan-500/10"
        />
        <StatsCard
          title="异常雷达待办告警"
          value={stats.totalAnomalyCount}
          subtitle={`AI 漏评孤儿回合 ${stats.orphanRoundsCount} 条`}
          icon={
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          }
          gradient="from-amber-500/15 to-orange-500/10"
        />
        <StatsCard
          title="关联原帖防篡改锁定中"
          value={stats.lockedPostsCount}
          subtitle="进行中对决自动锁定关联社区原帖"
          icon={<Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          gradient="from-indigo-500/15 to-sky-500/10"
        />
        <StatsCard
          title="活跃观战质押声望池"
          value={stats.activeBetPoolAmount}
          subtitle={`当前发起费 ${config.economy.creation_fee} 积分 · ${config.economy.auto_refund_on_pending_cancel ? "未开赛全额退" : "关闭自动退"}`}
          icon={
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          }
          gradient="from-emerald-500/15 to-teal-500/10"
        />
      </div>

      {/* 四大子工作台水滴胶囊导航栏（严格锁死 font-medium 零布局跳动） */}
      <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border-0 bg-white/70 dark:bg-zinc-900/55 p-1.5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_24px_-4px_rgba(0,0,0,0.4)]">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full border-0 px-4 py-2 text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="duels-admin-main-tab"
                  transition={MOTION_SPRINGS.fluidPill}
                  className="absolute inset-0 rounded-full border-0 bg-zinc-950/[0.07] dark:bg-white/[0.12] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18)]"
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
              <span className="relative z-10">{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span
                  className={cn(
                    "relative z-10 rounded-full border-0 px-2 py-0.5 text-[10px] font-medium tabular-nums",
                    tab.alert
                      ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                      : "bg-zinc-900/[0.06] dark:bg-white/[0.1] text-zinc-600 dark:text-zinc-300"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 子工作台视图切换 */}
      {activeTab === "list" && (
        <DuelListPanel
          initialData={initialDuels}
          canModerate={canModerate}
          isSuperAdmin={isSuperAdmin}
          onInspectDuel={handleOpenInspect}
          onOpenArbitration={handleOpenArbitration}
          refreshSignal={listRefreshSignal}
        />
      )}

      {activeTab === "anomalies" && (
        <DuelAnomalyPanel
          anomalies={anomalies}
          economyConfig={config.economy}
          canModerate={canModerate}
          onInspectDuel={handleOpenInspect}
          onOpenArbitration={handleOpenArbitration}
          onRefresh={() => refreshOverviewAndAnomalies()}
        />
      )}

      {activeTab === "referee" && (
        <DuelRefereeConfigPanel
          config={config}
          canEditConfig={canEditConfig}
          canRunSandbox={canModerate}
          onConfigSaved={handleConfigSaved}
        />
      )}

      {activeTab === "economy" && (
        <DuelEconomyConfigPanel
          config={config}
          canEditConfig={canEditConfig}
          onConfigSaved={handleConfigSaved}
        />
      )}

      {/* 右侧全维度巡检回放抽屉 */}
      <DuelInspectDrawer
        duelId={inspectDuelId}
        open={inspectOpen}
        onOpenChange={setInspectOpen}
        canModerate={canModerate}
        isSuperAdmin={isSuperAdmin}
        onOpenArbitration={(duel) => {
          setInspectOpen(false);
          handleOpenArbitration(duel);
        }}
        onMutated={() => void refreshOverviewAndAnomalies()}
      />

      {/* 原子事务仲裁干预对话框 */}
      <DuelArbitrationDialog
        duel={arbitrateTarget}
        open={arbitrateOpen}
        onOpenChange={setArbitrateOpen}
        defaultAction={arbitrateDefaultAction}
        isSuperAdmin={isSuperAdmin}
        onSuccess={() => void refreshOverviewAndAnomalies()}
      />
    </div>
  );
}
