"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
    Camera,
    Loader2,
    ArrowLeft,
    ArrowRight,
    UserCheck,
    Globe,
    Clock,
    Languages,
    User,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/context";
import { Locale } from "@/i18n/types";

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
        } catch (error: any) {
            console.error("Avatar upload failed:", error);
            toast.error(tStep.uploadFail + (error.message || "未知错误"));
        } finally {
            setUploading(false);
        }
    };

    const handleLanguageChange = (val: string) => {
        setFormData({ ...formData, language: val });
        if (val === "zh" || val === "en") {
            setLocale(val as Locale);
        }
    };

    const handleContinue = () => {
        if (!formData.username.trim()) {
            toast.error(tStep.usernameRequiredError);
            return;
        }
        onNext(formData);
    };

    const initials = (formData.username || "U").charAt(0).toUpperCase();

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* 头部介绍 */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                    <UserCheck className="h-4 w-4" />
                    {tStep.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {tStep.title}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {tStep.description}
                </p>
            </div>

            <Card className="border-border/60 bg-card/75 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* 头像区域 */}
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                                <AvatarImage src={formData.avatar_url} alt="学者头像" />
                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/30 via-violet-500/20 to-primary/10 text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            {/* 上传覆盖层 */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-inner"
                                title="点击上传自定义头像"
                            >
                                {uploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                ) : (
                                    <>
                                        <Camera className="h-6 w-6" />
                                        <span className="text-[10px] mt-1 font-medium">{tStep.changeAvatar}</span>
                                    </>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>

                        {/* 名字与提示 */}
                        <div className="text-center sm:text-left space-y-1">
                            <h3 className="text-lg font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                                {formData.username || (isZh ? "学者昵称预览" : "Scholar Handle Preview")}
                                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                                    {tStep.scholarTag}
                                </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {tStep.modifyTip}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                    {/* 表单网格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* 用户名 */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-xs font-semibold flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-primary" />
                                {tStep.usernameLabel} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="username"
                                placeholder={tStep.usernamePlaceholder}
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="h-10 bg-background/80"
                                maxLength={30}
                            />
                        </div>

                        {/* 性别 */}
                        <div className="space-y-2">
                            <Label htmlFor="gender" className="text-xs font-semibold">
                                {tStep.genderLabel}
                            </Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(val) => setFormData({ ...formData, gender: val })}
                            >
                                <SelectTrigger id="gender" className="h-10 bg-background/80">
                                    <SelectValue placeholder={tStep.genderPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">{tStep.genderMale}</SelectItem>
                                    <SelectItem value="female">{tStep.genderFemale}</SelectItem>
                                    <SelectItem value="other">{tStep.genderOther}</SelectItem>
                                    <SelectItem value="private">{tStep.genderPrivate}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 国家/地区 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="country" className="text-xs font-semibold flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5 text-blue-500" />
                                    {tStep.countryLabel}
                                </Label>
                            </div>
                            <Input
                                id="country"
                                placeholder={tStep.countryPlaceholder}
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="h-10 bg-background/80"
                            />
                            {/* 快捷标签 */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {popularRegions.map((region) => (
                                    <button
                                        key={region}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, country: region })}
                                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                                            formData.country === region
                                                ? "bg-primary/10 border-primary/40 text-primary font-medium"
                                                : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {region}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 语言与时区组合 */}
                        <div className="space-y-4">
                            {/* 语言 */}
                            <div className="space-y-2">
                                <Label htmlFor="language" className="text-xs font-semibold flex items-center gap-1.5">
                                    <Languages className="h-3.5 w-3.5 text-emerald-500" />
                                    {tStep.languageLabel}
                                </Label>
                                <Select
                                    value={formData.language}
                                    onValueChange={handleLanguageChange}
                                >
                                    <SelectTrigger id="language" className="h-10 bg-background/80">
                                        <SelectValue placeholder={tStep.languagePlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zh">{t.common.chinese}</SelectItem>
                                        <SelectItem value="en">{t.common.english}</SelectItem>
                                        <SelectItem value="ja">{t.common.japanese}</SelectItem>
                                        <SelectItem value="ko">{t.common.korean}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 时区 */}
                            <div className="space-y-2">
                                <Label htmlFor="timezone" className="text-xs font-semibold flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    {tStep.timezoneLabel}
                                </Label>
                                <Select
                                    value={formData.timezone}
                                    onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                                >
                                    <SelectTrigger id="timezone" className="h-10 bg-background/80">
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
                            </div>
                        </div>
                    </div>

                    {/* 个人学术简介 */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="bio" className="text-xs font-semibold flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                {tStep.bioLabel}
                            </Label>
                            <span className="text-[11px] text-muted-foreground">
                                {formData.bio.length} / 300
                            </span>
                        </div>
                        <Textarea
                            id="bio"
                            placeholder={tStep.bioPlaceholder}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={3}
                            maxLength={300}
                            className="bg-background/80 resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 操作控制栏 */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onPrev}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {tStep.backToStep1}
                </Button>

                <Button
                    type="button"
                    size="lg"
                    onClick={handleContinue}
                    className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/20 font-semibold group"
                >
                    {tStep.nextStep}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}
