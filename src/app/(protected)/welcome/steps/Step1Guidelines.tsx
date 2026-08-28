"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    ScrollText,
    Clock,
    ImageIcon,
    Scale,
    FileText,
    ArrowRight,
    Loader2,
    ShieldAlert,
    Database,
    MessageSquare,
    UserCheck,
    Gavel,
    Shield,
    HeartHandshake,
    AlertTriangle,
    Ban,
    FileCheck,
    Sparkles,
    ExternalLink,
} from "lucide-react";
import { recordTermsAcceptance } from "@/actions/onboarding";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/i18n/context";

interface Step1GuidelinesProps {
    onNext: () => void;
}

export function Step1Guidelines({ onNext }: Step1GuidelinesProps) {
    const { t } = useI18n();
    const tStep = t.welcome.step1;

    const [currentTab, setCurrentTab] = useState<string>("terms");
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!agreed) {
            toast.error(tStep.agreeError);
            return;
        }

        setSubmitting(true);
        try {
            const res = await recordTermsAcceptance();
            if (!res.success) {
                toast.error(res.error || t.common.error);
                return;
            }
            toast.success(tStep.signSuccess);
            onNext();
        } catch (err: any) {
            console.error("公约提交失败:", err);
            toast.error(t.common.networkError);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* 头部介绍 */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    {tStep.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {tStep.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {tStep.description}
                </p>
            </div>

            {/* 核心公约条款嵌入容器（直接内嵌完整 /rules 体系） */}
            <Card className="border-border/70 bg-card/85 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 border-primary/30 text-primary py-0.5 px-2.5">
                                <Sparkles className="w-3 h-3" />
                                {tStep.agreementNote}
                            </Badge>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                · 请切换 Tab 仔细查阅完整条款
                            </span>
                        </div>

                        {/* 独立打开 /rules */}
                        <Link
                            href="/rules"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium self-end sm:self-auto"
                        >
                            {tStep.openRulesWindow}
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* 双 Tab 切换 */}
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full pt-2">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/60 border border-border/50 rounded-xl h-auto">
                            <TabsTrigger
                                value="terms"
                                className="py-2 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                                <ScrollText className="w-4 h-4 text-primary" />
                                <span>{tStep.termsTab}</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="guidelines"
                                className="py-2 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                                <HeartHandshake className="w-4 h-4 text-emerald-500" />
                                <span>{tStep.guidelinesTab}</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent className="p-0">
                    <ScrollArea className="h-[420px] p-5 text-sm text-foreground/90">
                        {currentTab === "terms" && (
                            <div className="space-y-4">
                                {/* 协议性质说明 */}
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
                                    <FileCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm">
                                        <p className="font-semibold text-foreground">{tStep.termsNatureTitle}</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            {tStep.termsNatureDesc}
                                        </p>
                                    </div>
                                </div>

                                {/* 1. 免责声明 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                                            <Scale className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.sec1Title}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-medium text-amber-800 dark:text-amber-300 text-xs">
                                        {tStep.sec1Highlight}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tStep.sec1P1}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tStep.sec1P2}
                                    </p>
                                </div>

                                {/* 2. 数据留存说明 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                            <Database className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.sec2Title}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-medium text-blue-800 dark:text-blue-300 text-xs">
                                        {tStep.sec2Highlight}
                                    </div>
                                    <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                                        <div className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-1">
                                            <h5 className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                                {tStep.sec2TextCardTitle}
                                            </h5>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {tStep.sec2TextCardDesc}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-1">
                                            <h5 className="font-medium text-xs text-foreground flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                {tStep.sec2FileCardTitle}
                                            </h5>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                {tStep.sec2FileCardDesc}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 用户义务与多媒体责任 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <FileCheck className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.sec3Title}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-medium text-emerald-800 dark:text-emerald-300 text-xs">
                                        {tStep.sec3Highlight}
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                                        <li>
                                            <strong>{tStep.sec3Li1Title}</strong>{tStep.sec3Li1Desc}
                                        </li>
                                        <li>
                                            <strong>{tStep.sec3Li2Title}</strong>{tStep.sec3Li2Desc}
                                        </li>
                                        <li>
                                            <strong>{tStep.sec3Li3Title}</strong>{tStep.sec3Li3Desc}
                                        </li>
                                    </ul>
                                </div>

                                {/* 4. 账号管理与平台处置权利 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600">
                                            <UserCheck className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.sec4Title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tStep.sec4Desc}
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentTab === "guidelines" && (
                            <div className="space-y-4">
                                {/* 社区宗旨 */}
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3">
                                    <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm">
                                        <p className="font-semibold text-foreground">{tStep.guidelinesSpiritTitle}</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            {tStep.guidelinesSpiritDesc}
                                        </p>
                                    </div>
                                </div>

                                {/* 第一章：学术诚信规范 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                            <Scale className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.chap1Title}</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                                        <li>
                                            <strong>{tStep.chap1Li1Title}</strong>{tStep.chap1Li1Desc}
                                        </li>
                                        <li>
                                            <strong>{tStep.chap1Li2Title}</strong>{tStep.chap1Li2Desc}
                                        </li>
                                        <li>
                                            <strong>{tStep.chap1Li3Title}</strong>{tStep.chap1Li3Desc}
                                        </li>
                                    </ul>
                                </div>

                                {/* 第二章：言论与研讨准则 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.chap2Title}</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground leading-relaxed pl-1">
                                        <li>
                                            <strong>{tStep.chap2Li1Title}</strong>{tStep.chap2Li1Desc}
                                        </li>
                                        <li>
                                            <strong>{tStep.chap2Li2Title}</strong>{tStep.chap2Li2Desc}
                                        </li>
                                        <li>
                                            <strong>{tStep.chap2Li3Title}</strong>{tStep.chap2Li3Desc}
                                        </li>
                                    </ul>
                                </div>

                                {/* 第三章：同行审议与安全防线 */}
                                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                        <span>{tStep.chap3Title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {tStep.chap3Desc}
                                    </p>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* 签署确认与下一步控制 */}
            <div className="pt-2 flex flex-col items-center space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none group px-4 py-2.5 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/60 transition-all shadow-sm">
                    <Checkbox
                        id="terms-check"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(!!checked)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 rounded-md"
                    />
                    <span className="text-xs sm:text-sm text-foreground/90 group-hover:text-foreground">
                        {tStep.agreeCheckboxLabel}{" "}
                        <span className="font-semibold text-primary">{tStep.agreeTermsLink}</span>与
                        <span className="font-semibold text-primary">{tStep.agreeGuidelinesLink}</span>
                    </span>
                </label>

                <Button
                    size="lg"
                    disabled={!agreed || submitting}
                    onClick={handleConfirm}
                    className="w-full sm:w-80 h-12 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary via-violet-600 to-primary bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-lg shadow-primary/25 group cursor-pointer"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {tStep.submittingButton}
                        </>
                    ) : (
                        <>
                            {tStep.submitButton}
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
