"use client";

import { removeProfileBannerAction, uploadAndAuditBannerAction } from "@/actions/profile-banner";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    Check,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

export interface BannerPreset {
    id: string;
    name: string;
    class: string;
    preview: string;
}

export const bannerGradients: BannerPreset[] = [
    {
        id: "default",
        name: "极光微澜",
        class: "bg-gradient-to-tr from-indigo-500/20 via-sky-500/15 to-purple-500/25 dark:from-indigo-950/60 dark:via-sky-950/40 dark:to-purple-950/60",
        preview: "bg-gradient-to-tr from-indigo-400 via-sky-300 to-purple-400",
    },
    {
        id: "sunset",
        name: "暖阳暮色",
        class: "bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-rose-500/20 dark:from-amber-950/60 dark:via-orange-950/40 dark:to-rose-950/60",
        preview: "bg-gradient-to-tr from-amber-400 via-orange-300 to-rose-400",
    },
    {
        id: "ocean",
        name: "蔚蓝星海",
        class: "bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-teal-500/20 dark:from-cyan-950/60 dark:via-blue-950/40 dark:to-teal-950/60",
        preview: "bg-gradient-to-tr from-cyan-400 via-blue-300 to-teal-400",
    },
    {
        id: "forest",
        name: "翠林幽谷",
        class: "bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-green-500/20 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-green-950/60",
        preview: "bg-gradient-to-tr from-emerald-400 via-teal-300 to-green-400",
    },
    {
        id: "lavender",
        name: "梦幻紫罗兰",
        class: "bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/15 to-pink-500/20 dark:from-fuchsia-950/60 dark:via-purple-950/40 dark:to-pink-950/60",
        preview: "bg-gradient-to-tr from-fuchsia-400 via-purple-300 to-pink-400",
    },
    {
        id: "midnight",
        name: "暗夜星芒",
        class: "bg-gradient-to-tr from-zinc-800/80 via-slate-900/90 to-zinc-950 dark:from-zinc-900 dark:via-slate-950 dark:to-black",
        preview: "bg-gradient-to-tr from-zinc-700 via-slate-800 to-zinc-950",
    },
    {
        id: "frost",
        name: "墨韵青霜",
        class: "bg-gradient-to-tr from-slate-700/40 via-teal-800/30 to-slate-900/60 dark:from-slate-900/70 dark:via-teal-950/60 dark:to-zinc-950",
        preview: "bg-gradient-to-tr from-slate-600 via-teal-700 to-slate-900",
    },
    {
        id: "minimal",
        name: "银灰极简",
        class: "bg-gradient-to-tr from-zinc-200/50 via-zinc-100/40 to-slate-200/60 dark:from-zinc-800/40 dark:via-zinc-900/40 dark:to-slate-900/50",
        preview: "bg-gradient-to-tr from-zinc-300 via-zinc-200 to-slate-300",
    },
];

interface BannerSelectorProps {
    currentStyle: string;
    currentBannerUrl?: string | null;
    onStyleChange: (style: string) => void;
    onBannerUrlChange?: (url: string | null) => void;
    className?: string;
}

export function BannerSelector({
    currentStyle,
    currentBannerUrl,
    onStyleChange,
    onBannerUrlChange,
    className,
}: BannerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [presetLoading, setPresetLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // 物理光随鼠动原生 CSS 变量写入
    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
    };

    // 选中本地文件进行即时本地预览
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("请选择有效的图片文件（支持 PNG、JPG、WebP）");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("图片文件不能超过 5MB，请压缩后上传");
            return;
        }

        setSelectedFile(file);
        const objUrl = URL.createObjectURL(file);
        setPreviewUrl(objUrl);
    };

    // 清除选中的未上传文件
    const handleClearSelected = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // 执行上传并接入安全审核
    const handleUploadAndAudit = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await uploadAndAuditBannerAction(formData);

            if (!res.success) {
                toast.error(res.error || "图片未通过安全审核，请更换图片");
                return;
            }

            if (res.bannerUrl) {
                onBannerUrlChange?.(res.bannerUrl);
                toast.success("个人主页横幅已成功更新！");
                handleClearSelected();
                setIsOpen(false);
            }
        } catch (err: any) {
            console.error("Upload banner error:", err);
            toast.error(err.message || "上传失败，请重试");
        } finally {
            setUploading(false);
        }
    };

    // 移除自定义图片，恢复为纯色渐变
    const handleRemoveCustomBanner = async () => {
        setUploading(true);
        try {
            const res = await removeProfileBannerAction();
            if (!res.success) {
                toast.error(res.error || "恢复失败");
                return;
            }
            onBannerUrlChange?.(null);
            toast.success("已恢复为经典学术渐变封面");
            handleClearSelected();
        } catch (err: any) {
            toast.error(err.message || "操作失败");
        } finally {
            setUploading(false);
        }
    };

    // 选择预设渐变主题
    const handleSelectPreset = async (gradientId: string) => {
        setPresetLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未登录");

            // 如果当前有自定义 Banner，同步清空
            if (currentBannerUrl) {
                await removeProfileBannerAction();
                onBannerUrlChange?.(null);
            }

            const { error } = await supabase
                .from("profiles")
                .update({ banner_style: gradientId })
                .eq("id", user.id);

            if (error) throw error;

            onStyleChange(gradientId);
            toast.success("封面色彩已更新");
            setIsOpen(false);
        } catch (error: any) {
            console.error("Failed to update banner style:", error);
            toast.error("更新封面失败，请重试");
        } finally {
            setPresetLoading(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) handleClearSelected();
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 px-3.5 text-xs font-medium backdrop-blur-xl bg-white/75 hover:bg-white/90 dark:bg-zinc-950/70 dark:hover:bg-zinc-950/85 text-zinc-800 dark:text-zinc-200 border-0 rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15),0_4px_16px_-2px_rgba(0,0,0,0.4)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97]",
                        className
                    )}
                >
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>更换封面</span>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-84 sm:w-96 p-5 pb-6 sm:p-5.5 sm:pb-7 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_20px_50px_-10px_rgba(0,0,0,0.18)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18),0_20px_50px_-10px_rgba(0,0,0,0.65)] rounded-3xl overflow-hidden max-h-[min(88vh,620px)] overflow-y-auto"
                align="end"
            >
                <div className="space-y-3.5">
                    {/* 顶部 Header：优雅极简，无多余商业标语 */}
                    <div className="flex items-center justify-between pb-0.5">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500/80 dark:bg-indigo-400/80 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 tracking-tight">
                                个人主页横幅设置
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                handleClearSelected();
                                setIsOpen(false);
                            }}
                            className="h-6 w-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors border-0 cursor-pointer"
                            title="关闭"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* 渐变消融微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 隐藏的真实文件 Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />

                    {/* 1. 自定义图片上传板块 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span>自定义图片横幅</span>
                            {currentBannerUrl && !previewUrl && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">当前已生效</span>
                            )}
                        </div>

                        {/* 情况 A: 正在预览新选择的文件 */}
                        {previewUrl ? (
                            <div className="relative rounded-2xl overflow-hidden border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6),0_4px_16px_rgba(0,0,0,0.08)] group">
                                <div className="relative w-full h-24 bg-zinc-100 dark:bg-zinc-800">
                                    <Image
                                        src={previewUrl}
                                        alt="待上传横幅预览"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />
                                    <button
                                        type="button"
                                        onClick={handleClearSelected}
                                        disabled={uploading}
                                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer border-0 shadow-sm"
                                        title="取消选择"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="p-2.5 bg-zinc-50/90 dark:bg-zinc-850/90 backdrop-blur-md flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[130px]">
                                        {selectedFile?.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleClearSelected}
                                            disabled={uploading}
                                            className="h-6 px-2.5 text-[11px] font-medium rounded-full border-0 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 cursor-pointer"
                                        >
                                            取消
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleUploadAndAudit}
                                            disabled={uploading}
                                            className="h-6 px-3 text-[11px] font-medium rounded-full border-0 bg-zinc-950/85 hover:bg-zinc-900/95 text-white dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:shadow-[0_4px_12px_-2px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.8)] gap-1 transition-all active:scale-[0.97] cursor-pointer"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>安全审核中...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck className="h-3 w-3" />
                                                    <span>确认并应用</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : currentBannerUrl ? (
                            /* 情况 B: 已有生效的自定义图片 */
                            <div className="relative rounded-2xl overflow-hidden border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.5),0_4px_16px_rgba(0,0,0,0.06)]">
                                <div className="relative w-full h-20 bg-zinc-100 dark:bg-zinc-800">
                                    <Image
                                        src={currentBannerUrl}
                                        alt="当前自定义横幅"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />
                                </div>
                                <div className="p-2 bg-zinc-50/90 dark:bg-zinc-800/90 backdrop-blur-md flex items-center justify-between">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="h-6 px-2.5 text-[11px] font-medium rounded-full border-0 bg-white/75 dark:bg-zinc-700/60 hover:bg-white dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-xs gap-1 cursor-pointer"
                                    >
                                        <RefreshCw className="h-2.5 w-2.5" />
                                        <span>更换新图片</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleRemoveCustomBanner}
                                        disabled={uploading}
                                        className="h-6 px-2.5 text-[11px] font-medium rounded-full border-0 text-red-600 dark:text-red-400 hover:bg-red-500/10 gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="h-2.5 w-2.5" />
                                        <span>恢复渐变</span>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* 情况 C: 尚未上传自定义图片，展示液态玻璃上传卡片 */
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onMouseMove={handleMouseMove}
                                className="group relative w-full h-[72px] rounded-2xl border-0 bg-zinc-100/60 dark:bg-zinc-800/40 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/70 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.2)] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden"
                            >
                                {/* 物理光随鼠动纯白微反射 */}
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: "radial-gradient(120px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.4), transparent 80%)",
                                    }}
                                />
                                <div className="relative z-1 h-6.5 w-6.5 rounded-full bg-white/90 dark:bg-zinc-700/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)]">
                                    <UploadCloud className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                                </div>
                                <span className="relative z-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 tracking-tight">
                                    点击上传自定义图片横幅
                                </span>
                                <span className="relative z-1 text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
                                    支持 PNG、JPG、WebP · 最大 5MB · 建议 1920×480
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 渐变消融微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 2. 经典学术色彩预设板块 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span>经典学术色彩预设</span>
                            <span className="text-[10px] text-zinc-400 font-medium">点击即时应用</span>
                        </div>
                        {/* 4行2列对称网格，底部增加 pb-1 呼吸空间 */}
                        <div className="grid grid-cols-2 gap-2 pt-0.5 pb-1">
                            {bannerGradients.map((gradient) => {
                                const isSelected = !currentBannerUrl && currentStyle === gradient.id;
                                return (
                                    <motion.button
                                        key={gradient.id}
                                        type="button"
                                        disabled={presetLoading || uploading}
                                        onClick={() => handleSelectPreset(gradient.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "group relative h-11 rounded-2xl overflow-hidden border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.45),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 text-left cursor-pointer focus:outline-none",
                                            gradient.preview,
                                            isSelected && "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.95),0_4px_16px_rgba(0,0,0,0.22)] dark:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9),0_4px_20px_rgba(255,255,255,0.2)]"
                                        )}
                                    >
                                        {/* 顶沿物理透光微缝 */}
                                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                                        {isSelected && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/95 dark:bg-zinc-950/90 text-zinc-950 dark:text-white flex items-center justify-center shadow-xs backdrop-blur-md">
                                                <Check className="h-2.5 w-2.5 stroke-[2.8]" />
                                            </div>
                                        )}
                                        <span className="absolute bottom-0 inset-x-0 py-0.5 px-2 text-[9.5px] bg-black/45 backdrop-blur-md text-white font-medium truncate rounded-b-2xl">
                                            {gradient.name}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
