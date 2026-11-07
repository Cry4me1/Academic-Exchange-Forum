"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens";
import { getAdminDuelsList, type AdminDuelRow } from "@/lib/admin/duels";
import type { ArbitrationMode } from "./DuelAnomalyPanel";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  ExternalLink,
  Eye,
  Gavel,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Swords,
  Unlock,
} from "lucide-react";

interface DuelListPanelProps {
  initialData: { data: AdminDuelRow[]; total: number };
  canModerate: boolean;
  isSuperAdmin: boolean;
  onInspectDuel: (duelId: string) => void;
  onOpenArbitration: (
    duel: AdminDuelRow,
    defaultAction?: ArbitrationMode
  ) => void;
  refreshSignal: number;
}

const STATUS_OPTIONS = [
  { value: "all", label: "全部对决" },
  { value: "active", label: "交锋中" },
  { value: "pending", label: "待应战" },
  { value: "completed", label: "已完赛" },
  { value: "cancelled", label: "已取消" },
] as const;

const KO_OPTIONS = [
  { value: "all", label: "全部赛果" },
  { value: "normal", label: "常规积分赛" },
  { value: "any_ko", label: "触发 KO / 裁决" },
  { value: "negative_score", label: "负分 KO" },
  { value: "lp_zero", label: "LP 归零" },
  { value: "surrender", label: "主动认输" },
  { value: "admin_arbitration", label: "人工仲裁" },
] as const;

const STATUS_BADGE: Record<
  AdminDuelRow["status"],
  { label: string; cls: string }
> = {
  pending: {
    label: "待应战",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  active: {
    label: "交锋中",
    cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  completed: {
    label: "已完赛",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  cancelled: {
    label: "已取消",
    cls: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  },
};

const KO_BADGE_TEXT: Record<string, string> = {
  negative_score: "负分 KO",
  lp_zero: "LP 归零 KO",
  surrender: "认输完赛",
  admin_arbitration: "管理员裁决",
  admin_rollback: "超管回滚",
};

const PAGE_SIZE = 15;

export function DuelListPanel({
  initialData,
  canModerate,
  isSuperAdmin,
  onInspectDuel,
  onOpenArbitration,
  refreshSignal,
}: DuelListPanelProps) {
  const [rows, setRows] = useState<AdminDuelRow[]>(initialData.data);
  const [total, setTotal] = useState<number>(initialData.total);
  const [status, setStatus] = useState<string>("all");
  const [koFilter, setKoFilter] = useState<string>("all");
  const [linkedPostOnly, setLinkedPostOnly] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const isFirstMount = useRef(true);

  const fetchList = useCallback(
    async (opts?: { targetPage?: number; searchOverride?: string }) => {
      const targetPage = opts?.targetPage ?? page;
      const targetSearch = opts?.searchOverride ?? appliedSearch;
      setLoading(true);
      try {
        const res = await getAdminDuelsList({
          status,
          koFilter,
          linkedPostOnly,
          search: targetSearch,
          page: targetPage,
          pageSize: PAGE_SIZE,
        });
        setRows(res.data);
        setTotal(res.total);
      } catch (err) {
        toast.error(
          "加载对决列表失败：" +
            (err instanceof Error ? err.message : "网络异常")
        );
      } finally {
        setLoading(false);
      }
    },
    [status, koFilter, linkedPostOnly, appliedSearch, page]
  );

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    void fetchList();
  }, [fetchList, refreshSignal]);

  const handleStatusChange = (val: string) => {
    setPage(1);
    setStatus(val);
  };

  const handleKoChange = (val: string) => {
    setPage(1);
    setKoFilter(val);
  };

  const handleToggleLinkedPost = () => {
    setPage(1);
    setLinkedPostOnly((prev) => !prev);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* 液态毛玻璃多维筛选舱 */}
      <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-5 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 状态胶囊组（锁死 font-medium 零布局跳动） */}
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.06] p-1">
            {STATUS_OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusChange(opt.value)}
                  className={cn(
                    "relative rounded-full border-0 px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    active
                      ? "text-zinc-950 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="duel-list-status-pill"
                      transition={MOTION_SPRINGS.fluidPill}
                      className="absolute inset-0 rounded-full border-0 bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.14)]"
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* 辩题 / UUID 搜索框 */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="搜索辩题关键词或对决 UUID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.06] pl-9 pr-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]"
              />
            </div>
            <button
              type="submit"
              className="rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 px-4 py-2 text-xs font-medium active:scale-[0.97] transition-all cursor-pointer"
            >
              查询
            </button>
            <button
              type="button"
              onClick={() => void fetchList()}
              disabled={loading}
              className="inline-flex size-8 items-center justify-center rounded-full border-0 bg-zinc-900/[0.05] hover:bg-zinc-900/[0.1] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-600 dark:text-zinc-300 active:scale-[0.96] transition-all cursor-pointer"
              title="刷新列表"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
            </button>
          </form>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

        {/* 二级赛果与关联锁帖过滤 */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {KO_OPTIONS.map((ko) => {
              const active = koFilter === ko.value;
              return (
                <button
                  key={ko.value}
                  type="button"
                  onClick={() => handleKoChange(ko.value)}
                  className={cn(
                    "rounded-full border-0 px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "bg-sky-500/18 text-sky-800 dark:text-sky-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]"
                      : "bg-zinc-900/[0.03] hover:bg-zinc-900/[0.07] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  {ko.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleToggleLinkedPost}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border-0 px-3.5 py-1 text-xs font-medium transition-all cursor-pointer",
              linkedPostOnly
                ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)]"
                : "bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300"
            )}
          >
            <Lock className="h-3 w-3 shrink-0" />
            仅看关联社区原帖局
          </button>
        </div>
      </div>

      {/* 对决列表主体 */}
      {loading && rows.length === 0 ? (
        <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
          <p className="text-sm font-medium">正在检索对决全景数据...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 p-16 flex flex-col items-center justify-center gap-2 text-zinc-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]">
          <Swords className="h-8 w-8 text-zinc-400" />
          <p className="text-sm font-medium">当前筛选条件下暂无对决记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((duel) => {
            const st = STATUS_BADGE[duel.status];
            const canAct =
              canModerate &&
              (duel.status === "active" ||
                duel.status === "pending" ||
                Boolean(duel.post?.is_locked) ||
                (isSuperAdmin && duel.status === "completed"));

            return (
              <div
                key={duel.id}
                onMouseMove={trackPointer120fps}
                className="group relative overflow-hidden rounded-3xl border-0 bg-white/75 hover:bg-white/85 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65 p-5 backdrop-blur-2xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.92),0_8px_32px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
              >
                {/* 120fps 纯白环境光随鼠动反射 */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden"
                  style={{
                    background:
                      "radial-gradient(220px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.65), transparent 80%)",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:block"
                  style={{
                    background:
                      "radial-gradient(220px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08), transparent 80%)",
                  }}
                />

                <div className="relative space-y-3.5">
                  {/* 第一行：状态胶囊、KO 标签、原帖状态与操作按钮 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border-0 px-3 py-0.5 text-xs font-medium",
                          st.cls
                        )}
                      >
                        {st.label}
                      </span>
                      <span className="rounded-full border-0 bg-zinc-900/[0.05] dark:bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
                        第 {duel.current_round}/{duel.max_rounds} 回合
                      </span>
                      {duel.ko_type && (
                        <span className="rounded-full border-0 bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                          {KO_BADGE_TEXT[duel.ko_type] || duel.ko_type}
                        </span>
                      )}
                      {duel.post && (
                        <Link
                          href={`/posts/${duel.post.id}`}
                          target="_blank"
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium transition-colors",
                            duel.post.is_locked
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-500/20"
                          )}
                        >
                          {duel.post.is_locked ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                          <span className="max-w-[160px] truncate">
                            {duel.post.is_locked ? "锁帖保护中" : "原帖已解锁"}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400 tabular-nums hidden sm:inline">
                        {new Date(duel.created_at).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => onInspectDuel(duel.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-900/[0.06] hover:bg-zinc-900/[0.12] dark:bg-white/[0.08] dark:hover:bg-white/[0.15] px-3.5 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-100 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-sky-500" />
                        巡检回放
                      </button>
                      {canAct && (
                        <button
                          type="button"
                          onClick={() => onOpenArbitration(duel)}
                          className="inline-flex items-center gap-1.5 rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 px-3.5 py-1.5 text-xs font-medium shadow-[0_4px_12px_-2px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.35)] active:scale-[0.97] transition-all cursor-pointer"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          {duel.status === "completed" ? "冲正回滚" : "仲裁干预"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 第二行：辩题标题 */}
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {duel.topic}
                    </h4>
                    {duel.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {duel.description}
                      </p>
                    )}
                  </div>

                  {/* 第三行：对称选手比分与 LP 状态条 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border-0 bg-sky-500/[0.06] dark:bg-sky-500/[0.09] px-3.5 py-2.5">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="rounded-full border-0 bg-sky-500/20 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300 shrink-0">
                          {duel.challenger_position}
                        </span>
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          @{duel.challenger?.username || "未知学者"}
                        </span>
                        {duel.winner_id &&
                          duel.winner_id === duel.challenger_id && (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums shrink-0">
                        <span>得分 {duel.challenger_score}</span>
                        <span>LP {duel.challenger_lp}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl border-0 bg-amber-500/[0.06] dark:bg-amber-500/[0.09] px-3.5 py-2.5">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="rounded-full border-0 bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0">
                          {duel.opponent_position}
                        </span>
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {duel.opponent
                            ? `@${duel.opponent.username}`
                            : "等待学者应战"}
                        </span>
                        {duel.winner_id &&
                          duel.winner_id === duel.opponent_id && (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums shrink-0">
                        <span>得分 {duel.opponent_score}</span>
                        <span>LP {duel.opponent_lp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页底栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1 text-xs font-medium text-zinc-500 tabular-nums">
        <span>
          共 {total} 场对决 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-full border-0 bg-white/75 dark:bg-zinc-900/60 px-3.5 py-1.5 text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)] disabled:opacity-40 active:scale-[0.97] transition-all cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded-full border-0 bg-white/75 dark:bg-zinc-900/60 px-3.5 py-1.5 text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.04)] disabled:opacity-40 active:scale-[0.97] transition-all cursor-pointer"
          >
            下一页
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
