"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Eye,
  BookOpen,
  ImageIcon,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import NovelViewer from "@/components/editor/NovelViewer";
import { extractPlainTextFromContent, extractImageUrls } from "@/lib/moderation/utils";

interface ModerationLogItem {
  id: string;
  post_id: string | null;
  author_id: string;
  content_hash: string;
  title?: string | null;
  content_snapshot?: any;
  cover_image?: string | null;
  tags?: string[] | null;
  model_name: string;
  score: number;
  risk_level: string;
  reason: string | null;
  detected_tags: string[] | null;
  matched_sensitive_words: string[] | null;
  final_action: string;
  cost_tokens: number;
  latency_ms: number;
  is_cached: boolean;
  created_at: string;
  post: { title: string } | null;
  profile: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface ModerationLogsClientProps {
  logs: ModerationLogItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  riskFilter: string;
  actionFilter: string;
}

const ACTION_MAP: Record<string, { label: string; color: string; icon: any }> = {
  auto_approved: { label: "AI 自动通过", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: ShieldCheck },
  auto_pending: { label: "转入待审", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertTriangle },
  auto_rejected: { label: "自动拦截", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  manual_approved: { label: "人工放行", color: "bg-teal-500/10 text-teal-600 border-teal-500/20", icon: ShieldCheck },
  manual_rejected: { label: "人工驳回", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
};

export function ModerationLogsClient({
  logs,
  totalCount,
  currentPage,
  pageSize,
  riskFilter: initialRiskFilter,
  actionFilter: initialActionFilter,
}: ModerationLogsClientProps) {
  const router = useRouter();
  const [previewSnapshot, setPreviewSnapshot] = useState<ModerationLogItem | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleFilter = (key: string, val: string) => {
    const params = new URLSearchParams();
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    if (initialActionFilter) params.set("action", initialActionFilter);

    if (val && val !== "all") {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    router.push(`/admin/logs/moderation?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (initialRiskFilter) params.set("risk", initialRiskFilter);
    if (initialActionFilter) params.set("action", initialActionFilter);
    params.set("page", page.toString());
    router.push(`/admin/logs/moderation?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI 审核审计日志</h2>
          <p className="text-sm text-muted-foreground">
            追踪全站文章的初审决策记录、大模型 Token 用量与敏感词命中审计
          </p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={initialRiskFilter || "all"}
          onValueChange={(val) => handleFilter("risk", val)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="AI 风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部风险等级</SelectItem>
            <SelectItem value="safe">安全 (Safe)</SelectItem>
            <SelectItem value="sensitive">敏感 (Sensitive)</SelectItem>
            <SelectItem value="dangerous">高危 (Dangerous)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={initialActionFilter || "all"}
          onValueChange={(val) => handleFilter("action", val)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="处置动作" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部处置动作</SelectItem>
            <SelectItem value="auto_approved">AI 自动通过</SelectItem>
            <SelectItem value="auto_pending">转入待审</SelectItem>
            <SelectItem value="auto_rejected">自动拦截</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 日志表格 */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">文章 / 内容摘要</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">作者</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">AI 评分</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">处置动作</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">模型 & 性能</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无审核日志记录
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const author = log.profile;
                  const act = ACTION_MAP[log.final_action] || {
                    label: log.final_action,
                    color: "bg-muted text-muted-foreground",
                    icon: Sparkles,
                  };
                  const ActionIcon = act.icon;

                  const isBanner = log.detected_tags?.includes("banner") || log.detected_tags?.includes("profile_banner");
                  const isCover = log.detected_tags?.includes("post_cover");
                  const isContentImage = log.detected_tags?.includes("post_content_image");
                  const isComment = log.detected_tags?.includes("comment") || log.detected_tags?.includes("学术评论");
                  const displayTitle = log.title || log.post?.title || (
                    isBanner ? "🖼️ 个人主页 Banner 审核" :
                    isCover ? "🖼️ 帖子封面上传审核" :
                    isContentImage ? "🖼️ 帖子正文配图审核" :
                    isComment ? "💬 评论内容安全审核" :
                    "未命名或已拦截提交"
                  );

                  return (
                    <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                            {displayTitle}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={log.reason || ""}>
                            {log.reason || "无评判理由"}
                          </p>
                          {log.matched_sensitive_words && log.matched_sensitive_words.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {log.matched_sensitive_words.map((w) => (
                                <Badge key={w} variant="destructive" className="text-[10px] px-1 py-0">
                                  命中: {w}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={author?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(author?.username || "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {author?.username || "学者"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-sm font-bold ${
                              log.score >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : log.score >= 60
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {log.score}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {log.risk_level}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge variant="outline" className={`gap-1 text-xs ${act.color}`}>
                            <ActionIcon className="h-3 w-3" />
                            {act.label}
                          </Badge>
                          {log.content_snapshot && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewSnapshot(log)}
                              className="h-6 px-2 text-[11px] rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-0 gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              查看快照
                            </Button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {log.is_cached ? (
                              <Badge variant="secondary" className="text-[10px] px-1 bg-violet-500/10 text-violet-600 border-violet-500/20">
                                ⚡ 缓存命中
                              </Badge>
                            ) : (
                              <span className="font-mono text-[11px]">{log.model_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5" />
                              {log.cost_tokens} tok
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {log.latency_ms}ms
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {log.created_at ? formatDistanceToNow(log.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 页（共 {totalCount} 条记录）
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 审核快照详情预览弹窗 */}
      <Dialog open={!!previewSnapshot} onOpenChange={(open) => !open && setPreviewSnapshot(null)}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col border-0 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-[0_16px_64px_-12px_rgba(0,0,0,0.25)]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 font-bold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              {previewSnapshot?.title || previewSnapshot?.post?.title || "内容审核快照详情"}
            </DialogTitle>
            <DialogDescription>
              作者：{previewSnapshot?.profile?.username || "学者"} |
              记录时间：{previewSnapshot?.created_at ? new Date(previewSnapshot.created_at).toLocaleString("zh-CN") : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
            {/* 审核诊断 */}
            <div className="p-4 rounded-2xl border-0 bg-muted/40 text-sm space-y-2 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-foreground">初审诊断分析：</span>
                <Badge
                  className={`rounded-full border-0 text-xs px-2.5 py-0.5 ${
                    (previewSnapshot?.score ?? 0) >= 80
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : (previewSnapshot?.score ?? 0) >= 60
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}
                >
                  健康分 {previewSnapshot?.score}
                </Badge>
                <Badge variant="outline" className="rounded-full border-0 text-xs capitalize">
                  {previewSnapshot?.risk_level}
                </Badge>
                <Badge variant="secondary" className="rounded-full border-0 text-xs">
                  {previewSnapshot?.final_action}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {previewSnapshot?.reason || "无评判理由"}
              </p>
              {previewSnapshot?.matched_sensitive_words && previewSnapshot.matched_sensitive_words.length > 0 && (
                <p className="text-xs text-red-500 font-semibold">
                  ⚠️ 命中的敏感词库：{previewSnapshot.matched_sensitive_words.join("、")}
                </p>
              )}
              <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-3 flex-wrap">
                <span>审核模型: {previewSnapshot?.model_name}</span>
                <span>•</span>
                <span>耗时: {previewSnapshot?.latency_ms}ms</span>
                {(previewSnapshot?.cost_tokens ?? 0) > 0 && (
                  <>
                    <span>•</span>
                    <span>消耗 Token: {previewSnapshot?.cost_tokens}</span>
                  </>
                )}
              </div>
            </div>

            {/* 封面图预览 */}
            {previewSnapshot?.cover_image && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">封面图片：</span>
                <div className="relative aspect-[21/9] w-full max-h-48 rounded-2xl overflow-hidden border-0 bg-muted shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSnapshot.cover_image}
                    alt="封面图"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* 正文快照渲染 */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">正文快照数据：</span>
              {previewSnapshot?.content_snapshot ? (
                <div className="p-4 rounded-2xl border-0 bg-card/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                  {typeof previewSnapshot.content_snapshot === "object" && previewSnapshot.content_snapshot?.type === "doc" ? (
                    <NovelViewer initialValue={previewSnapshot.content_snapshot} />
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {extractPlainTextFromContent(previewSnapshot.content_snapshot)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-2xl text-center text-xs text-muted-foreground bg-muted/20">
                  暂无正文快照数据
                </div>
              )}
            </div>

            {/* 提取配图图表 */}
            {(() => {
              const images = extractImageUrls(previewSnapshot?.content_snapshot);
              if (images.length === 0) return null;
              return (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span>正文配图 ({images.length} 张)：</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-video rounded-2xl overflow-hidden border-0 bg-muted/40 hover:opacity-90 transition-opacity shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]"
                      >
                        <img
                          src={src}
                          alt={`配图 ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/60 text-[10px] text-white">
                          点击放大
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button variant="outline" className="rounded-full border-0" onClick={() => setPreviewSnapshot(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
