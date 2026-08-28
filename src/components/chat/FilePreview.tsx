"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    formatFileSize,
    getFileCategory,
    getRemainingTime,
    isFileExpired,
    isImage,
    isVideo,
    type MessageAttachment,
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Archive,
    Code,
    Download,
    ExternalLink,
    File,
    FileImage,
    FileText,
    Image as ImageIcon,
    Play,
    Video,
    X,
} from "lucide-react";
import { useState } from "react";

interface FilePreviewProps {
    attachment: MessageAttachment;
    className?: string;
}

// 文件类型图标映射
const FileIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    image: ImageIcon,
    video: Video,
    document: FileText,
    archive: Archive,
    code: Code,
    other: File,
};

export function FilePreview({ attachment, className }: FilePreviewProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [imageError, setImageError] = useState(false);

    const category = getFileCategory(attachment.fileType);
    const IconComponent = FileIconMap[category] || File;
    const expired = attachment.isExpired || isFileExpired(attachment.expiresAt);

    // 处理文件下载
    const handleDownload = () => {
        if (expired) return;

        const downloadUrl = `/api/messages/download?attachmentId=${attachment.id}`;

        const a = document.createElement("a");
        a.href = downloadUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // ===== 过期文件：精致小巧警告卡片 =====
    if (expired) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl max-w-[260px]",
                    "bg-zinc-50 dark:bg-zinc-900",
                    "border border-zinc-200 dark:border-zinc-800",
                    className
                )}
            >
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    <FileImage className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                        {attachment.fileName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            文件已过期
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // ===== 图片预览：固定比例圆角 =====
    if (isImage(attachment.fileType) && !imageError) {
        return (
            <>
                <div
                    className={cn(
                        "relative group cursor-pointer rounded-xl overflow-hidden max-w-[280px]",
                        className
                    )}
                    onClick={() => setShowPreview(true)}
                >
                    <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={attachment.publicUrl}
                            alt={attachment.fileName}
                            className="w-full h-full object-cover rounded-xl"
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                    </div>
                    {/* Hover 遮罩 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                    {/* 底部渐变信息条 */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-[11px] text-white truncate">{attachment.fileName}</p>
                    </div>
                </div>

                {/* 图片预览对话框 */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby={undefined}>
                        <DialogHeader className="absolute top-2 right-2 z-10">
                            <DialogTitle className="sr-only">{attachment.fileName}</DialogTitle>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => setShowPreview(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="relative bg-zinc-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={attachment.publicUrl}
                                alt={attachment.fileName}
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                        </div>
                        <div className="p-4 flex items-center justify-between bg-white dark:bg-zinc-900">
                            <div className="min-w-0 flex-1 mr-4">
                                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                    {attachment.fileName}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatFileSize(attachment.fileSize)} · {getRemainingTime(attachment.expiresAt)}
                                </p>
                            </div>
                            <Button onClick={handleDownload} size="sm" className="rounded-lg">
                                <Download className="h-4 w-4 mr-1.5" />
                                下载
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ===== 视频预览 =====
    if (isVideo(attachment.fileType)) {
        return (
            <>
                <div
                    className={cn(
                        "relative group cursor-pointer rounded-xl overflow-hidden max-w-[280px]",
                        className
                    )}
                    onClick={() => setShowPreview(true)}
                >
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
                        <video
                            src={attachment.publicUrl}
                            className="w-full h-full object-cover rounded-xl"
                            preload="metadata"
                        />
                    </div>
                    {/* 播放按钮 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-11 w-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Play className="h-5 w-5 text-zinc-800 ml-0.5" />
                        </div>
                    </div>
                    {/* 底部信息 */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-[11px] text-white truncate">{attachment.fileName}</p>
                    </div>
                </div>

                {/* 视频预览对话框 */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby={undefined}>
                        <DialogHeader className="p-4 pb-0">
                            <DialogTitle className="truncate text-sm">{attachment.fileName}</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <video
                                src={attachment.publicUrl}
                                controls
                                autoPlay
                                className="w-full h-auto max-h-[70vh] rounded-xl"
                            />
                        </div>
                        <div className="p-4 pt-0 flex items-center justify-between">
                            <p className="text-xs text-zinc-500">
                                {formatFileSize(attachment.fileSize)} · {getRemainingTime(attachment.expiresAt)}
                            </p>
                            <Button onClick={handleDownload} size="sm" className="rounded-lg">
                                <Download className="h-4 w-4 mr-1.5" />
                                下载
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ===== 其他文件类型 =====
    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl max-w-[280px] cursor-pointer transition-colors",
                "bg-zinc-50 dark:bg-zinc-800/50",
                "border border-zinc-200 dark:border-zinc-700",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                className
            )}
            onClick={handleDownload}
        >
            <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <IconComponent className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {attachment.fileName}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {formatFileSize(attachment.fileSize)} · {getRemainingTime(attachment.expiresAt)}
                </p>
            </div>
            <Download className="h-4 w-4 flex-shrink-0 text-zinc-400" />
        </div>
    );
}

// 简化的附件列表预览
interface AttachmentListProps {
    attachments: MessageAttachment[];
    className?: string;
}

export function AttachmentList({ attachments, className }: AttachmentListProps) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className={cn("space-y-2 mt-2", className)}>
            {attachments.map((attachment) => (
                <FilePreview key={attachment.id} attachment={attachment} />
            ))}
        </div>
    );
}
