"use client";

import { bannerGradients } from "@/components/profile/banner-selector";
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
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LinkedAccountsCard } from "@/components/settings/linked-accounts-card";
import { useI18n } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Locale } from "@/i18n/types";
import { Switch } from "@/components/ui/switch";
import { useMessageSound } from "@/hooks/useMessageSound";
import { Volume2, Play } from "lucide-react";

interface ProfileData {
    id: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    gender: string | null;
    bio: string | null;
    country: string | null;
    language: string | null;
    timezone: string | null;
    banner_style: string | null;
    banner_url: string | null;
}

export default function ProfileSettingsPage() {
    const { t, setLocale, isZh } = useI18n();
    const tSettings = t.settings;

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const { soundEnabled, setSoundEnabled, testSound } = useMessageSound();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    // 表单状态
    const [formData, setFormData] = useState({
        username: "",
        gender: "",
        bio: "",
        country: "",
        language: "zh",
        timezone: "",
    });

    // 获取当前用户的profile
    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Failed to load profile:", error);
                toast.error(tSettings.loadError);
            } else if (data) {
                setProfile(data);
                setFormData({
                    username: data.username || "",
                    gender: data.gender || "",
                    bio: data.bio || "",
                    country: data.country || "",
                    language: data.language || "zh",
                    timezone: data.timezone || "",
                });
            }
            setLoading(false);
        }
        loadProfile();
    }, [supabase, router, tSettings.loadError]);

    // 语言变更联动
    const handleLanguageChange = (val: string) => {
        setFormData((prev) => ({ ...prev, language: val }));
        if (val === "zh" || val === "en") {
            setLocale(val as Locale);
        }
    };

    // 头像上传
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        if (!file.type.startsWith("image/")) {
            toast.error(t.welcome.step2.imageTypeError);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t.welcome.step2.imageSizeError);
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            toast.success(t.welcome.step2.uploadSuccess);
        } catch (error: any) {
            console.error("Avatar upload error:", error);
            toast.error(t.welcome.step2.uploadFail + error.message);
        } finally {
            setUploading(false);
        }
    };

    // 保存表单
    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    username: formData.username || null,
                    gender: formData.gender || null,
                    bio: formData.bio || null,
                    country: formData.country || null,
                    language: formData.language || null,
                    timezone: formData.timezone || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (error) throw error;

            toast.success(tSettings.saveSuccess);
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(tSettings.saveError + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const initials = (formData.username || profile?.email || "U").charAt(0).toUpperCase();
    const currentGradient = bannerGradients.find(g => g.id === profile?.banner_style)?.class || bannerGradients[0].class;

    return (
        <div className={`min-h-screen ${currentGradient} transition-colors duration-500 relative pb-20`}>
            {/* 全局背景装饰 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-white/10 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
                {/* 顶栏控制 */}
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground bg-white/30 hover:bg-white/50 dark:bg-card/40 dark:hover:bg-card/60 backdrop-blur-md px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md w-fit"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {tSettings.backToDashboard}
                    </Link>

                    <LanguageSwitcher variant="toggle" />
                </div>

                <Card className="shadow-lg border-border/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        {/* 头像和基本信息 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* 头像 */}
                                <div className="relative group">
                                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                                        <AvatarImage src={profile?.avatar_url || ""} alt="头像" />
                                        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title={t.welcome.step2.changeAvatar}
                                    >
                                        {uploading ? (
                                             <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-white" />
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
                                <div>
                                    <h1 className="text-xl font-bold">
                                        {formData.username || (isZh ? "未设置用户名" : "Unnamed Scholar")}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {saving ? tSettings.saving : tSettings.saveProfile}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* 表单字段 - 两列布局 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 用户名/昵称 */}
                            <div className="space-y-2">
                                <Label htmlFor="username">{tSettings.usernameLabel}</Label>
                                <Input
                                    id="username"
                                    placeholder={tSettings.usernamePlaceholder}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            {/* 性别 */}
                            <div className="space-y-2">
                                <Label htmlFor="gender">{tSettings.genderLabel}</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder={tSettings.genderPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">{t.welcome.step2.genderMale}</SelectItem>
                                        <SelectItem value="female">{t.welcome.step2.genderFemale}</SelectItem>
                                        <SelectItem value="other">{t.welcome.step2.genderOther}</SelectItem>
                                        <SelectItem value="private">{t.welcome.step2.genderPrivate}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 国家/地区 */}
                            <div className="space-y-2">
                                <Label htmlFor="country">{tSettings.countryLabel}</Label>
                                <Input
                                    id="country"
                                    placeholder={tSettings.countryPlaceholder}
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>

                            {/* 语言 */}
                            <div className="space-y-2">
                                <Label htmlFor="language">{tSettings.languageLabel}</Label>
                                <Select
                                    value={formData.language}
                                    onValueChange={handleLanguageChange}
                                >
                                    <SelectTrigger id="language">
                                        <SelectValue placeholder={tSettings.languagePlaceholder} />
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
                                <Label htmlFor="timezone">{tSettings.timezoneLabel}</Label>
                                <Select
                                    value={formData.timezone}
                                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                                >
                                    <SelectTrigger id="timezone">
                                        <SelectValue placeholder={tSettings.timezonePlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia/Shanghai">{tSettings.timezones.beijing}</SelectItem>
                                        <SelectItem value="Asia/Tokyo">{tSettings.timezones.tokyo}</SelectItem>
                                        <SelectItem value="Europe/London">{tSettings.timezones.london}</SelectItem>
                                        <SelectItem value="America/New_York">{tSettings.timezones.newYork}</SelectItem>
                                        <SelectItem value="America/Los_Angeles">{tSettings.timezones.losAngeles}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 个人简介 - 全宽 */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">{tSettings.bioLabel}</Label>
                            <Textarea
                                id="bio"
                                placeholder={tSettings.bioPlaceholder}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        {/* 邮箱显示 */}
                        <div className="pt-4 border-t border-border/50">
                            <h3 className="text-sm font-semibold mb-3">{tSettings.emailTitle}</h3>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{profile?.email}</p>
                                    <p className="text-xs text-muted-foreground">{tSettings.primaryEmail}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 消息与提示音偏好 Card */}
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl md:rounded-3xl overflow-hidden mt-6">
                    <CardHeader className="pb-3 border-0">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Volume2 className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                    消息与提示音偏好
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    管理即时聊天与站内消息的声音反馈
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2 pb-6 space-y-4">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 backdrop-blur-md">
                            <div className="space-y-0.5 pr-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        私信提示音
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                                        液态晶体音效
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    收到新私信时播放通透纯净的双音晶体水滴音效
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        testSound();
                                        toast.success("正在试听私信提示音");
                                    }}
                                    className="h-8 px-3 rounded-full text-xs font-medium border-0 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)]"
                                >
                                    <Play className="h-3 w-3 mr-1 text-emerald-500 fill-emerald-500" />
                                    试听
                                </Button>
                                <Switch
                                    checked={soundEnabled}
                                    onCheckedChange={setSoundEnabled}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 绑定账号 Card */}
                <LinkedAccountsCard />
            </div>
        </div>
    );
}
