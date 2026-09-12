"use client";

import { createCollection, updateCollection } from "@/app/(protected)/collections/actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Check, Eye, Loader2, Sparkles, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CollectionCover } from "./CollectionCover";
import { COLLECTION_COVER_PRESETS, getCollectionCoverPreset } from "./CollectionCoverPresets";

interface CreateCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCollection?: {
        id: string;
        name: string;
        description?: string | null;
        cover_url?: string | null;
        cover_style?: string;
        is_public: boolean;
    } | null;
    onSuccess?: (collection?: any) => void;
}

export function CreateCollectionDialog({ open, onOpenChange, editingCollection, onSuccess }: CreateCollectionDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [coverTab, setCoverTab] = useState("preset");
    const [coverStyle, setCoverStyle] = useState(COLLECTION_COVER_PRESETS[0].id);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const isEditing = !!editingCollection;
    const currentPreset = getCollectionCoverPreset(coverStyle);

    useEffect(() => {
        if (open) {
            if (editingCollection) {
                setName(editingCollection.name);
                setDescription(editingCollection.description || "");
                setIsPublic(editingCollection.is_public);
                if (editingCollection.cover_url) {
                    setCoverUrl(editingCollection.cover_url);
                    setCoverTab("upload");
                } else {
                    setCoverStyle(editingCollection.cover_style || COLLECTION_COVER_PRESETS[0].id);
                    setCoverTab("preset");
                    setCoverUrl(null);
                }
            } else {
                setName("");
                setDescription("");
                setIsPublic(true);
                setCoverStyle(COLLECTION_COVER_PRESETS[0].id);
                setCoverTab("preset");
                setCoverUrl(null);
            }
        }
    }, [open, editingCollection]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("图片大小不能超过 2MB");
            return;
        }

        setIsUploading(true);
        const supabase = createClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未登录");

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("collection-covers")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("collection-covers")
                .getPublicUrl(fileName);

            setCoverUrl(urlData.publicUrl);
            toast.success("上传成功");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("上传失败，请重试");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("请输入专栏名称");
            return;
        }

        startTransition(async () => {
            const data = {
                name,
                description,
                is_public: isPublic,
                cover_url: coverTab === "upload" ? coverUrl : null,
                cover_style: coverTab === "preset" ? coverStyle : undefined,
            };

            let result;
            if (isEditing) {
                result = await updateCollection(editingCollection.id, data);
            } else {
                result = await createCollection(data);
            }

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditing ? "专栏已更新" : "专栏创建成功");
                onOpenChange(false);
                onSuccess?.("data" in result ? result.data : undefined);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-3xl border-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 select-none">
                <DialogHeader className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] border-0">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                            {isEditing ? "编辑专栏" : "新建专栏"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                        {isEditing ? "个性化调整专栏的视觉封面与同行可见性。" : "打造结构化与沉浸式学术专栏，组织沉淀您的前沿知识体系。"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    {/* 专栏名称 */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="name" className="text-foreground font-medium flex items-center justify-between text-xs">
                            <span>专栏名称 <span className="text-red-500">*</span></span>
                            <span className="text-[11px] text-muted-foreground font-normal">{name.length}/50</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如：量子力学与流体动力学笔记"
                            maxLength={50}
                            className="h-10 rounded-full px-4 bg-zinc-200/40 hover:bg-zinc-200/60 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] focus-visible:ring-1 focus-visible:ring-primary/40 text-sm transition-all outline-none"
                        />
                    </div>

                    {/* 专栏描述 */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="description" className="text-foreground font-medium flex items-center justify-between text-xs">
                            <span>专栏简介 (可选)</span>
                            <span className="text-[11px] text-muted-foreground font-normal">{description.length}/200</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="简短介绍这个专栏的核心课题与研究目的..."
                            className="resize-none rounded-2xl p-3.5 bg-zinc-200/40 hover:bg-zinc-200/60 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] focus-visible:ring-1 focus-visible:ring-primary/40 text-xs leading-relaxed transition-all outline-none"
                            rows={2}
                            maxLength={200}
                        />
                    </div>

                    {/* 封面选择器 */}
                    <div className="grid gap-2.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-foreground font-medium text-xs">专栏封面风格</Label>
                            <span className="text-[11px] text-muted-foreground">流光液态玻璃质感</span>
                        </div>

                        <Tabs value={coverTab} onValueChange={setCoverTab} className="w-full">
                            {/* 分段胶囊控制器 */}
                            <TabsList className="grid w-full grid-cols-2 h-10 p-1 rounded-full bg-zinc-200/40 dark:bg-white/[0.05] border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                <TabsTrigger value="preset" className="rounded-full text-xs font-medium border-0 data-[state=active]:bg-white data-[state=active]:text-zinc-950 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] transition-all cursor-pointer">
                                    精选液态预设
                                </TabsTrigger>
                                <TabsTrigger value="upload" className="rounded-full text-xs font-medium border-0 data-[state=active]:bg-white data-[state=active]:text-zinc-950 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] transition-all cursor-pointer">
                                    自定义上传封面
                                </TabsTrigger>
                            </TabsList>

                            {/* 预设封面 TAB */}
                            <TabsContent value="preset" className="mt-3.5 space-y-3.5 focus-visible:outline-none">
                                {/* 实时效果预览卡片 (Live Liquid Preview) */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5 text-primary" />
                                            <span>实时卡片预览</span>
                                        </span>
                                        <span className="font-mono text-[10px] text-primary/80">
                                            {currentPreset.name} · {currentPreset.enName}
                                        </span>
                                    </div>

                                    {/* 磨砂卡片构图 (16:9 黄金视效比例) */}
                                    <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border-0 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.45)] group">
                                        <CollectionCover
                                            coverStyle={coverStyle}
                                            size="lg"
                                            showWatermark={true}
                                        >
                                            {/* 无缝渐变遮罩，绝不破坏和遮挡中央微标 */}
                                            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5 pt-12 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none">
                                                <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1 drop-shadow-sm">
                                                    {name.trim() || "专栏名称预览"}
                                                </h4>
                                                <p className="text-[10px] text-white/75 line-clamp-1 mt-0.5 font-light">
                                                    {description.trim() || "探索学术边界与沉浸式液态知识拓扑..."}
                                                </p>
                                            </div>
                                        </CollectionCover>
                                    </div>
                                </div>

                                {/* 预设矩阵：2行5列超椭圆玻璃卡片 */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                                    {COLLECTION_COVER_PRESETS.map((preset) => {
                                        const Icon = preset.icon;
                                        const isSelected = coverStyle === preset.id;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => setCoverStyle(preset.id)}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-between p-2 rounded-2xl text-left transition-all duration-300 cursor-pointer overflow-hidden border-0 backdrop-blur-xl",
                                                    isSelected
                                                        ? "scale-[1.04] shadow-[0_0_24px_rgba(255,255,255,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.95)]"
                                                        : "opacity-85 hover:opacity-100 hover:scale-[1.02] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.25)]"
                                                )}
                                                style={{
                                                    minHeight: "76px",
                                                    backgroundColor: preset.class.includes("black") ? "#000000" : "#090d16",
                                                }}
                                            >
                                                {/* 液态弥散微光 */}
                                                <div
                                                    className="absolute -top-3 -left-3 w-14 h-14 rounded-full blur-xl pointer-events-none opacity-80"
                                                    style={{ backgroundColor: preset.primaryOrb }}
                                                />
                                                <div
                                                    className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full blur-xl pointer-events-none opacity-70"
                                                    style={{ backgroundColor: preset.secondaryOrb }}
                                                />

                                                {/* 选中打勾水滴徽标 */}
                                                {isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 z-20 w-4 h-4 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
                                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                    </div>
                                                )}

                                                {/* 超椭圆液态玻璃微标 */}
                                                <div
                                                    className="relative z-10 p-1.5 rounded-xl backdrop-blur-md bg-white/[0.18] border-0 mt-0.5"
                                                    style={{
                                                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.5), 0 4px 10px -2px rgba(0,0,0,0.3)`
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color: preset.accentColor }} />
                                                </div>

                                                {/* 主题中文名称 */}
                                                <span className="relative z-10 text-[11px] font-medium text-white/95 tracking-tight truncate w-full text-center mt-1">
                                                    {preset.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </TabsContent>

                            {/* 自定义上传 TAB */}
                            <TabsContent value="upload" className="mt-3.5 focus-visible:outline-none">
                                <div className="relative border-0 rounded-3xl p-6 flex flex-col items-center justify-center text-center bg-zinc-200/40 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all aspect-[2.4/1] overflow-hidden group">
                                    {coverUrl ? (
                                        <>
                                            <Image src={coverUrl} alt="Cover preview" fill className="object-cover" />
                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setCoverUrl(null)}
                                                    className="rounded-full shadow-lg backdrop-blur-md border-0 bg-white/90 text-zinc-950 hover:bg-white"
                                                >
                                                    重新上传
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {isUploading ? (
                                                <Loader2 className="h-7 w-7 text-primary animate-spin mb-2" />
                                            ) : (
                                                <UploadCloud className="h-7 w-7 text-muted-foreground/80 mb-2 group-hover:text-primary transition-colors" />
                                            )}
                                            <div className="text-xs font-medium text-foreground mb-1">
                                                {isUploading ? "正在解析并上传封面..." : "点击或拖拽上传专栏封面"}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                支持 JPG, PNG, WEBP (建议 16:9 或 3:2，最大 2MB)
                                            </div>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleUpload}
                                                disabled={isUploading}
                                            />
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* 公开/私密开关 */}
                    <div className="flex items-center justify-between rounded-2xl border-0 p-3.5 bg-zinc-200/35 hover:bg-zinc-200/50 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)] transition-all">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-medium text-foreground">公开专栏</Label>
                            <div className="text-[11px] text-muted-foreground">
                                开启后，专栏将在社区流中展示，同行可关注与订阅
                            </div>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                            className="cursor-pointer"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-2 flex items-center justify-end gap-2.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-9 px-5 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200/40 hover:bg-zinc-200/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] transition-all cursor-pointer"
                    >
                        取消
                    </Button>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isPending || isUploading}
                            className="relative overflow-hidden group h-9 px-6 rounded-full border-0 font-medium text-xs sm:text-sm
                                bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] hover:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]
                                dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] dark:hover:shadow-[0_6px_24px_-2px_rgba(255,255,255,0.32),inset_0_1px_1.5px_rgba(255,255,255,1)]
                                backdrop-blur-xl transition-all duration-300 cursor-pointer min-w-[84px] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {/* 顶层液态物理漫射光条 (Liquid Sheen Highlight) */}
                            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/80 to-transparent pointer-events-none" />

                            {/* 鼠标悬浮微光流动反射层 (Liquid Hover Reflex) */}
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/[0.12] dark:via-white/[0.25] to-transparent pointer-events-none" />

                            {isPending ? (
                                <span className="relative z-10 flex items-center gap-1.5">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>处理中...</span>
                                </span>
                            ) : (
                                <span className="relative z-10">{isEditing ? "保存更改" : "创建专栏"}</span>
                            )}
                        </Button>
                    </motion.div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
