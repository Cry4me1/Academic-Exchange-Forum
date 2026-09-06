"use client";

import { onUpload } from "@/lib/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    Camera,
    Check,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    Sparkles,
    Trash2,
    UploadCloud,
} from "lucide-react";
import Image from "next/image";
import type { JSONContent } from "novel";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface PostCoverUploaderProps {
    coverImage: string | null;
    onChange: (url: string | null) => void;
    contentJson?: JSONContent;
    disabled?: boolean;
    compact?: boolean;
}

/**
 * 递归提取 Novel 富文本 JSON 中的所有图片 URL
 */
function extractAllImagesFromJSON(node: any): string[] {
    const images: string[] = [];
    if (!node) return images;

    if (node.type === "image" && node.attrs?.src) {
        images.push(node.attrs.src);
    }

    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            images.push(...extractAllImagesFromJSON(child));
        }
    }

    return Array.from(new Set(images));
}

export function PostCoverUploader({
    coverImage,
    onChange,
    contentJson,
    disabled = false,
    compact = false,
}: PostCoverUploaderProps) {
    const fileInputId = useId();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    const [isExtractPopoverOpen, setIsExtractPopoverOpen] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [hasImageError, setHasImageError] = useState(false);
    const [urlPreviewError, setUrlPreviewError] = useState(false);

    // 当 coverImage 属性改变时重置加载错误状态
    useEffect(() => {
        setHasImageError(false);
    }, [coverImage]);

    // 当用户输入新的 URL 时重置弹窗内的预览错误状态
    useEffect(() => {
        setUrlPreviewError(false);
    }, [urlInput]);

    // 从富文本正文中提取的所有配图
    const contentImages = useMemo(() => {
        return extractAllImagesFromJSON(contentJson);
    }, [contentJson]);

    // 处理本地文件上传
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        await uploadFile(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const uploadFile = async (file: File) => {
        if (disabled || isUploading) return;

        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast.error("仅支持 JPG、PNG、GIF、WebP 格式图片");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error(`图片大小超过限制 (2MB)，当前为 ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            return;
        }

        setIsUploading(true);
        try {
            const uploadedUrl = await onUpload(file);
            if (uploadedUrl) {
                setHasImageError(false);
                onChange(uploadedUrl);
                toast.success("封面设置成功");
            }
        } catch (error: any) {
            console.error("Cover upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    // 拖拽支持
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled || isUploading) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
    };

    // 提交网络图片 URL
    const handleUrlSubmit = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) {
            toast.error("请输入有效的图片链接");
            return;
        }
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            toast.error("图片链接必须以 http:// 或 https:// 开头");
            return;
        }

        setHasImageError(false);
        onChange(trimmed);
        setUrlInput("");
        setIsUrlDialogOpen(false);
        toast.success("已设置网络图片为封面");
    };

    return (
        <div className="space-y-2.5">
            {/* 隐藏的原生文件输入 */}
            <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                disabled={disabled || isUploading}
                onChange={handleFileChange}
            />

            {/* 顶部标题与功能快捷按钮 */}
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
                    封面图
                    <span className="text-[11px] font-normal text-muted-foreground lowercase">
                        (16:9)
                    </span>
                </Label>

                <div className="flex items-center gap-1">
                    {/* 从正文提取配图 */}
                    {contentImages.length > 0 && (
                        <Popover open={isExtractPopoverOpen} onOpenChange={setIsExtractPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled}
                                    className="h-6 text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-1.5 gap-1"
                                >
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    正文配图
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72 p-3 space-y-2">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-xs text-foreground flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        正文中检测到的配图
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        点击任意图片直接设为封面：
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {contentImages.map((imgUrl, idx) => {
                                        const isSelected = coverImage === imgUrl;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    onChange(imgUrl);
                                                    setIsExtractPopoverOpen(false);
                                                    toast.success("已采用正文图片为封面");
                                                }}
                                                className={`relative aspect-[16/9] rounded-md overflow-hidden border transition-all ${
                                                    isSelected
                                                        ? "border-primary ring-2 ring-primary/30"
                                                        : "border-border/60 hover:border-primary/50 hover:scale-[1.03]"
                                                }`}
                                            >
                                                <Image
                                                    src={imgUrl}
                                                    alt={`正文图片 ${idx + 1}`}
                                                    fill
                                                    unoptimized
                                                    referrerPolicy="no-referrer"
                                                    sizes="100px"
                                                    className="object-cover"
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-white drop-shadow-xs" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* 网络链接输入弹窗 */}
                    <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={disabled}
                                className="h-6 text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-1.5 gap-1"
                            >
                                <LinkIcon className="h-3 w-3" strokeWidth={1.75} />
                                链接
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-base font-semibold">输入网络图片链接</DialogTitle>
                                <DialogDescription className="text-xs">
                                    支持公开图床、云存储或网络图片的直链 URL。
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cover-url" className="text-xs">
                                        图片直链 URL
                                    </Label>
                                    <Input
                                        id="cover-url"
                                        placeholder="https://example.com/cover.png"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleUrlSubmit();
                                            }
                                        }}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                {/* 实时缩略图预览与连通性检测 */}
                                {urlInput.trim().startsWith("http") && (
                                    <div className="rounded-xl border border-border/80 overflow-hidden bg-muted/20 p-2.5 space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span className="font-medium">链接解析预览</span>
                                            {urlPreviewError ? (
                                                <span className="text-destructive flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> 图片加载失败，请检查链接或防盗链
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> 格式识别有效
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-border/50 bg-black/5 dark:bg-black/30 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={urlInput.trim()}
                                                alt="网络图片预览"
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover"
                                                onError={() => setUrlPreviewError(true)}
                                                onLoad={() => setUrlPreviewError(false)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsUrlDialogOpen(false)}
                                        className="h-8 text-xs"
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleUrlSubmit}
                                        className="h-8 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                                    >
                                        确认应用
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* 封面展示 / 紧凑 16:9 上传主区域 */}
            <AnimatePresence mode="wait">
                {coverImage ? (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="relative group rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-muted/20 shadow-xs"
                    >
                        <div className="relative w-full aspect-[16/9] bg-zinc-950/5 dark:bg-zinc-950/40">
                            <Image
                                src={coverImage}
                                alt="文章封面预览"
                                fill
                                unoptimized
                                referrerPolicy="no-referrer"
                                sizes="(max-width: 768px) 100vw, 400px"
                                className={`object-cover transition-opacity duration-200 ${
                                    hasImageError ? "opacity-25 blur-xs" : "opacity-100"
                                }`}
                                priority
                                onError={() => {
                                    setHasImageError(true);
                                }}
                            />

                            {/* 图片加载失败时的明显警示 */}
                            {hasImageError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-red-500/10 dark:bg-red-950/30 backdrop-blur-xs z-10 pointer-events-none">
                                    <AlertTriangle className="h-6 w-6 text-red-500 mb-1" />
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        图片加载失败
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        链接失效或被第三方图床防盗链拦截
                                    </p>
                                </div>
                            )}

                            {/* 悬浮遮罩与操作按钮 */}
                            <div className="absolute inset-0 z-20 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    disabled={disabled || isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-7 px-2.5 gap-1 text-[11px] bg-background/90 hover:bg-background text-foreground shadow-xs"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Camera className="h-3 w-3" strokeWidth={1.75} />
                                    )}
                                    更换
                                </Button>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={disabled || isUploading}
                                    onClick={() => {
                                        onChange(null);
                                        setHasImageError(false);
                                        toast.info("已移除封面");
                                    }}
                                    className="h-7 px-2.5 gap-1 text-[11px] shadow-xs"
                                >
                                    <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                                    移除
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                            if (!disabled && !isUploading) {
                                fileInputRef.current?.click();
                            }
                        }}
                        className={`relative group rounded-xl border border-dashed aspect-[16/9] transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${
                            isDragging
                                ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                : "border-zinc-300 dark:border-zinc-800 bg-muted/10 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-muted/20"
                        }`}
                    >
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:scale-105 transition-all">
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UploadCloud className="h-4 w-4" strokeWidth={1.75} />
                                )}
                            </div>
                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                {isUploading ? "正在上传..." : "上传或拖拽封面"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                16:9 比例 · ≤ 2MB
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

