"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Award,
  Edit,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { VipLevelConfigRow } from "@/lib/admin/credits";
import { updateVipLevelConfig, recalculateAllScholarLevels } from "@/lib/admin/credits";

interface Props {
  initialConfig: VipLevelConfigRow[];
  adminRole: string;
}

export function VipConfigPanel({ initialConfig, adminRole }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [editingLevel, setEditingLevel] = useState<VipLevelConfigRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRecalculating, startRecalculateTransition] = useTransition();

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: "",
    title: "",
    min_exp: 0,
    min_posts: 0,
    min_likes: 0,
    min_contributions: 0,
    monthly_bonus: 100,
    perks: [] as string[],
    is_active: true,
    newPerk: "",
  });

  const openEdit = (level: VipLevelConfigRow) => {
    setEditingLevel(level);
    setEditForm({
      name: level.name,
      title: level.title,
      min_exp: level.min_exp ?? 0,
      min_posts: level.min_posts ?? 0,
      min_likes: level.min_likes ?? 0,
      min_contributions: level.min_contributions ?? 0,
      monthly_bonus: Number(level.monthly_bonus ?? 100),
      perks: [...level.perks],
      is_active: level.is_active,
      newPerk: "",
    });
  };

  const handleSave = () => {
    if (!editingLevel) return;

    startTransition(async () => {
      try {
        await updateVipLevelConfig(editingLevel.level, {
          name: editForm.name,
          title: editForm.title,
          min_exp: editForm.min_exp,
          min_posts: editForm.min_posts,
          min_likes: editForm.min_likes,
          min_contributions: editForm.min_contributions,
          monthly_bonus: editForm.monthly_bonus,
          perks: editForm.perks,
          is_active: editForm.is_active,
        });

        setConfig((prev) =>
          prev.map((c) =>
            c.level === editingLevel.level
              ? {
                  ...c,
                  name: editForm.name,
                  title: editForm.title,
                  min_exp: editForm.min_exp,
                  min_posts: editForm.min_posts,
                  min_likes: editForm.min_likes,
                  min_contributions: editForm.min_contributions,
                  monthly_bonus: editForm.monthly_bonus,
                  perks: editForm.perks,
                  is_active: editForm.is_active,
                }
              : c
          )
        );

        setEditingLevel(null);
        toast.success(`Lv${editingLevel.level} 学者配置已更新并同步`);
      } catch (err) {
        toast.error(`保存失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    });
  };

  const handleRecalculateAll = () => {
    startRecalculateTransition(async () => {
      try {
        await recalculateAllScholarLevels();
        toast.success("全站学者等级已根据最新门槛重新核算完毕！");
      } catch (err) {
        toast.error(`全网重算失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    });
  };

  const addPerk = () => {
    if (editForm.newPerk.trim()) {
      setEditForm((prev) => ({
        ...prev,
        perks: [...prev.perks, prev.newPerk.trim()],
        newPerk: "",
      }));
    }
  };

  const removePerk = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与一键重算运维 CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Award className="h-5 w-5 text-zinc-500" />
            学者等级体系与阶梯门槛
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            由学术产出、同行认可与社区共建三维驱动，支持调整各等级 EXP 阈值、硬性门槛与每月研讨津贴
          </p>
        </div>

        <Button
          onClick={handleRecalculateAll}
          disabled={isRecalculating}
          className="h-9 px-4 rounded-full border-0 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)] shrink-0"
        >
          {isRecalculating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              正在全网重新核算...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              一键全站重新核算等级
            </>
          )}
        </Button>
      </div>

      {/* 学者等级阶梯卡片群 (Lv1 ~ Lv6 纯中性 Apple Liquid Glass 风格) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.map((level) => (
          <div
            key={level.level}
            className={`rounded-2xl border-0 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl p-5 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_20px_-2px_rgba(0,0,0,0.3)] transition-all ${
              !level.is_active ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {level.name}
                </span>
                {!level.is_active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                    已禁用
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(level)}
                className="h-7 w-7 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* 门槛网格 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <span className="text-[10px] text-zinc-400 block">综合 EXP</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {level.min_exp ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <span className="text-[10px] text-zinc-400 block">每月研讨津贴</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  +{level.monthly_bonus ?? 100} 积分
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <span className="text-[10px] text-zinc-400 block">有效发帖要求</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  $\ge$ {level.min_posts ?? 0} 篇
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                <span className="text-[10px] text-zinc-400 block">累计获赞要求</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  $\ge$ {level.min_likes ?? 0} 次
                </span>
              </div>
            </div>

            {/* 渐变消融微光缝 */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

            {/* 特权清单 */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-medium">特权配置</span>
              <div className="flex flex-wrap gap-1">
                {level.perks.map((perk, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    {perk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑学者等级模态弹窗 */}
      <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent className="max-w-md rounded-3xl border-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.85),0_16px_48px_-8px_rgba(0,0,0,0.2)] p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              配置 {editingLevel?.name} 学者等级
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              设置该等级的晋升经验、硬性学术门槛以及每月津贴
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cfg-exp">所需综合 EXP</Label>
                <Input
                  id="cfg-exp"
                  type="number"
                  value={editForm.min_exp}
                  onChange={(e) => setEditForm({ ...editForm, min_exp: parseInt(e.target.value) || 0 })}
                  className="rounded-full border-zinc-200 dark:border-zinc-800 font-mono text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cfg-bonus">每月研讨津贴 (积分)</Label>
                <Input
                  id="cfg-bonus"
                  type="number"
                  value={editForm.monthly_bonus}
                  onChange={(e) => setEditForm({ ...editForm, monthly_bonus: parseInt(e.target.value) || 100 })}
                  className="rounded-full border-zinc-200 dark:border-zinc-800 font-mono text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cfg-posts">有效发帖最低门槛</Label>
                <Input
                  id="cfg-posts"
                  type="number"
                  value={editForm.min_posts}
                  onChange={(e) => setEditForm({ ...editForm, min_posts: parseInt(e.target.value) || 0 })}
                  className="rounded-full border-zinc-200 dark:border-zinc-800 font-mono text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cfg-likes">累计获赞最低门槛</Label>
                <Input
                  id="cfg-likes"
                  type="number"
                  value={editForm.min_likes}
                  onChange={(e) => setEditForm({ ...editForm, min_likes: parseInt(e.target.value) || 0 })}
                  className="rounded-full border-zinc-200 dark:border-zinc-800 font-mono text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>特权条目</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {editForm.perks.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50">
                    <span>{p}</span>
                    <button type="button" onClick={() => removePerk(idx)} className="text-zinc-400 hover:text-rose-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="新增特权条目描述..."
                  value={editForm.newPerk}
                  onChange={(e) => setEditForm({ ...editForm, newPerk: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPerk())}
                  className="rounded-full border-zinc-200 dark:border-zinc-800 text-xs h-8"
                />
                <Button type="button" size="sm" onClick={addPerk} className="h-8 rounded-full border-0 px-3 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="cfg-active">启用该等级</Label>
              <Switch
                id="cfg-active"
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="ghost"
              onClick={() => setEditingLevel(null)}
              className="rounded-full text-xs h-9"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-full border-0 text-xs h-9 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.3)]"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              保存并同步全站
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
