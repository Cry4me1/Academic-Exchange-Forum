"use client";

import { useRef, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import {
    Camera,
    Loader2,
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Globe,
    Clock,
    Languages,
    User,
    Users,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { Locale } from "@/i18n/types";
import {
    PANEL,
    DIVIDER_H,
    REFLEX_GRADIENT,
    REFLEX_LAYER,
    TOP_SEAM,
    AMBER_AURA_SHADOW,
    SERIF_STACK,
    trackPointer,
} from "../components/welcome-glass";

export interface ProfileFormData {
    username: string;
    avatar_url: string;
    gender: string;
    country: string;
    language: string;
    timezone: string;
    bio: string;
}

interface Step2ProfileQuickStartProps {
    userId: string;
    initialData: ProfileFormData;
    onPrev: () => void;
    onNext: (data: ProfileFormData) => void;
}

/** 表单字段：中性图标 + 恒定字重标签 */
function Field({
    id,
    icon: Icon,
    label,
    required,
    aside,
    children,
    className,
}: {
    id: string;
    icon: LucideIcon;
    label: string;
    required?: boolean;
    aside?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between px-1">
                <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    <Icon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    {label}
                    {required && <span className="text-amber-600 dark:text-amber-400">*</span>}
                </Label>
                {aside}
            </div>
            {children}
        </div>
    );
}

export function Step2ProfileQuickStart({
    userId,
    initialData,
    onPrev,
    onNext,
}: Step2ProfileQuickStartProps) {
    const { t, setLocale, isZh } = useI18n();
    const tStep = t.welcome.step2;

    const [formData, setFormData] = useState<ProfileFormData>(initialData);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const popularRegions = isZh
        ? ["中国", "中国香港", "新加坡", "美国", "英国", "日本", "德国", "加拿大", "澳大利亚"]
        : ["United States", "United Kingdom", "China", "Singapore", "Japan", "Germany", "Canada", "Australia"];

    // 处理头像上传至 Supabase Storage
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // 允许重复选择同一文件
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(tStep.imageTypeError);
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            toast.error(tStep.imageSizeError);
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
            toast.success(tStep.uploadSuccess);
        } catch (error: unknown) {
            console.error("Avatar upload failed:", error);
            const message = error instanceof Error ? error.message : "未知错误";
            toast.error(tStep.uploadFail + message);
        } finally {
            setUploading(false);
        }
    };

    const handleLanguageChange = (val: string) => {
        setFormData((prev) => ({ ...prev, language: val }));
        if (val === "zh" || val === "en") {
            setLocale(val as Locale);
        }
    };

    const handleContinue = () => {
        if (!formData.username.trim()) {
            toast.error(tStep.usernameRequiredError);
            return;
        }
        onNext({ ...formData, username: formData.username.trim() });
    };

    const initials = (formData.username || "U").charAt(0).toUpperCase();

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* 头部介绍 */}
            <div className="text-center space-y-2 px-2">
                <h2
                    style={{ fontFamily: SERIF_STACK }}
                    className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                    {tStep.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    {tStep.description}
                </p>
            </div>

            <div onMouseMove={trackPointer} className={cn(PANEL, "group/panel")}>
                <span aria-hidden className={TOP_SEAM} />
                <div aria-hidden className={REFLEX_LAYER} style={{ background: REFLEX_GRADIENT }} />

                <div className="relative z-10">
                    {/* 名片预览：头像 + 昵称 */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 px-6 pt-7 pb-6">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            aria-label={tStep.changeAvatar}
                            className="group/avatar relative shrink-0 rounded-full outline-none transition-transform duration-150 ease-[var(--ease-out-snappy)] active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-ring/40 cursor-pointer disabled:cursor-wait"
                        >
                            <Avatar className="size-20 border-0 shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_12px_32px_-8px_rgba(0,0,0,0.22)] dark:shadow-[0_0_0_4px_rgba(255,255,255,0.08),0_12px_32px_-8px_rgba(0,0,0,0.6)]">
                                <AvatarImage src={formData.avatar_url} alt="学者头像" className="object-cover" />
                                <AvatarFallback
                                    style={{ fontFamily: SERIF_STACK }}
                                    className="text-2xl font-semibold bg-gradient-to-br from-amber-100 to-orange-50 text-amber-700 dark:from-amber-500/20 dark:to-orange-500/10 dark:text-amber-300"
                                >
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            {/* 桌面 hover 磨砂遮罩 */}
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute inset-0 flex items-center justify-center rounded-full bg-zinc-950/45 text-white backdrop-blur-[2px] transition-opacity duration-200",
                                    uploading
                                        ? "opacity-100"
                                        : "opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/avatar:opacity-100"
                                )}
                            >
                                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                            </span>

                            {/* 常驻相机胶囊（触屏可发现） */}
                            <span
                                aria-hidden
                                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/85 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:text-zinc-950"
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />

                        <div className="min-w-0 text-center sm:text-left space-y-1.5">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <h3 className="max-w-[16rem] truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                                    {formData.username || (isZh ? "学者昵称预览" : "Scholar Handle Preview")}
                                </h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.12)] px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]">
                                    <BadgeCheck className="h-3 w-3" />
                                    {tStep.scholarTag}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tStep.modifyTip}</p>
                        </div>
                    </div>

                    <div className={cn(DIVIDER_H, "mx-auto max-w-[92%]")} />

                    {/* 表单网格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 px-6 py-6">
                        {/* 用户名 */}
                        <Field id="username" icon={User} label={tStep.usernameLabel} required>
                            <Input
                                id="username"
                                placeholder={tStep.usernamePlaceholder}
                                value={formData.username}
                                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                                maxLength={30}
                                autoComplete="nickname"
                            />
                        </Field>

                        {/* 性别 */}
                        <Field id="gender" icon={Users} label={tStep.genderLabel}>
                            <Select
                                value={formData.gender}
                                onValueChange={(val) => setFormData((prev) => ({ ...prev, gender: val }))}
                            >
                                <SelectTrigger id="gender" className="h-10 w-full">
                                    <SelectValue placeholder={tStep.genderPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">{tStep.genderMale}</SelectItem>
                                    <SelectItem value="female">{tStep.genderFemale}</SelectItem>
                                    <SelectItem value="other">{tStep.genderOther}</SelectItem>
                                    <SelectItem value="private">{tStep.genderPrivate}</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        {/* 国家/地区（独占整行，快捷胶囊不挤压） */}
                        <Field id="country" icon={Globe} label={tStep.countryLabel} className="md:col-span-2">
                            <Input
                                id="country"
                                placeholder={tStep.countryPlaceholder}
                                value={formData.country}
                                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                                autoComplete="country-name"
                            />
                            <div className="flex flex-wrap gap-1.5 px-1 pt-1">
                                {popularRegions.map((region) => {
                                    const active = formData.country === region;
                                    return (
                                        <button
                                            key={region}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setFormData((prev) => ({ ...prev, country: region }))}
                                            className={cn(
                                                "rounded-full border-0 px-3 py-1 text-[11px] font-medium cursor-pointer select-none",
                                                "transition-[background-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out-snappy)] active:scale-[0.96]",
                                                active
                                                    ? cn("bg-white/95 text-amber-700 dark:bg-zinc-800/90 dark:text-amber-300", AMBER_AURA_SHADOW)
                                                    : "bg-zinc-900/[0.04] text-zinc-500 hover:bg-zinc-900/[0.07] hover:text-zinc-800 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.09] dark:hover:text-zinc-100"
                                            )}
                                        >
                                            {region}
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>

                        {/* 语言 */}
                        <Field id="language" icon={Languages} label={tStep.languageLabel}>
                            <Select value={formData.language} onValueChange={handleLanguageChange}>
                                <SelectTrigger id="language" className="h-10 w-full">
                                    <SelectValue placeholder={tStep.languagePlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="zh">{t.common.chinese}</SelectItem>
                                    <SelectItem value="en">{t.common.english}</SelectItem>
                                    <SelectItem value="ja">{t.common.japanese}</SelectItem>
                                    <SelectItem value="ko">{t.common.korean}</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        {/* 时区 */}
                        <Field id="timezone" icon={Clock} label={tStep.timezoneLabel}>
                            <Select
                                value={formData.timezone}
                                onValueChange={(val) => setFormData((prev) => ({ ...prev, timezone: val }))}
                            >
                                <SelectTrigger id="timezone" className="h-10 w-full">
                                    <SelectValue placeholder={tStep.timezonePlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Asia/Shanghai">{t.settings.timezones.beijing}</SelectItem>
                                    <SelectItem value="Asia/Tokyo">{t.settings.timezones.tokyo}</SelectItem>
                                    <SelectItem value="Europe/London">{t.settings.timezones.london}</SelectItem>
                                    <SelectItem value="America/New_York">{t.settings.timezones.newYork}</SelectItem>
                                    <SelectItem value="America/Los_Angeles">{t.settings.timezones.losAngeles}</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        {/* 个人学术简介 */}
                        <Field
                            id="bio"
                            icon={Sparkles}
                            label={tStep.bioLabel}
                            className="md:col-span-2"
                            aside={
                                <span className="text-[11px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500">
                                    {formData.bio.length} / 300
                                </span>
                            }
                        >
                            <Textarea
                                id="bio"
                                placeholder={tStep.bioPlaceholder}
                                value={formData.bio}
                                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                                rows={3}
                                maxLength={300}
                                className="min-h-24 resize-none"
                            />
                        </Field>
                    </div>
                </div>
            </div>

            {/* 操作控制栏 */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={onPrev} className="group">
                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-snappy)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-0.5" />
                    {tStep.backToStep1}
                </Button>

                <Button type="button" size="lg" onClick={handleContinue} className="group w-full sm:w-auto h-12 px-7">
                    {tStep.nextStep}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-snappy)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5" />
                </Button>
            </div>
        </div>
    );
}
