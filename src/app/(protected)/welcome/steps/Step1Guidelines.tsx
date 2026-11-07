"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ScrollText,
    Clock,
    Scale,
    ArrowRight,
    Loader2,
    ShieldAlert,
    Database,
    MessageSquare,
    UserCheck,
    HeartHandshake,
    FileCheck,
    ExternalLink,
    type LucideIcon,
} from "lucide-react";
import { recordTermsAcceptance } from "@/actions/onboarding";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import {
    PANEL,
    TILE,
    DIVIDER_H,
    DIVIDER_V,
    REFLEX_GRADIENT,
    REFLEX_LAYER,
    TOP_SEAM,
    AMBER_AURA_SHADOW,
    SERIF_STACK,
    trackPointer,
} from "../components/welcome-glass";

interface Step1GuidelinesProps {
    onNext: () => void;
}

/* -------------------------------------------------------------------------- */
/*                               条款排版原子组件                               */
/* -------------------------------------------------------------------------- */

type Tone = "amber" | "sky" | "emerald" | "violet" | "indigo" | "rose";

/** 单色温润色调：图标晶片 + 引述底色（低饱和，无边框） */
const TONES: Record<Tone, { chip: string; callout: string }> = {
    amber: {
        chip: "bg-amber-500/[0.12] text-amber-600 dark:text-amber-300",
        callout: "bg-amber-500/[0.08] text-amber-800 dark:text-amber-200",
    },
    sky: {
        chip: "bg-sky-500/[0.12] text-sky-600 dark:text-sky-300",
        callout: "bg-sky-500/[0.08] text-sky-800 dark:text-sky-200",
    },
    emerald: {
        chip: "bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300",
        callout: "bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-200",
    },
    violet: {
        chip: "bg-violet-500/[0.10] text-violet-600 dark:text-violet-300",
        callout: "bg-violet-500/[0.07] text-violet-800 dark:text-violet-200",
    },
    indigo: {
        chip: "bg-indigo-500/[0.10] text-indigo-600 dark:text-indigo-300",
        callout: "bg-indigo-500/[0.07] text-indigo-800 dark:text-indigo-200",
    },
    rose: {
        chip: "bg-rose-500/[0.10] text-rose-600 dark:text-rose-300",
        callout: "bg-rose-500/[0.07] text-rose-800 dark:text-rose-200",
    },
};

function IconChip({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
    return (
        <span
            className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]",
                TONES[tone].chip
            )}
        >
            <Icon className="h-4 w-4" />
        </span>
    );
}

function Section({
    icon,
    tone,
    title,
    children,
}: {
    icon: LucideIcon;
    tone: Tone;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className={cn(TILE, "p-4 sm:p-5 space-y-3")}>
            <h3 className="flex items-center gap-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <IconChip icon={icon} tone={tone} />
                <span>{title}</span>
            </h3>
            {children}
        </section>
    );
}

function Callout({ tone, children }: { tone: Tone; children: ReactNode }) {
    return (
        <p className={cn("rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed", TONES[tone].callout)}>
            {children}
        </p>
    );
}

function Paragraph({ children }: { children: ReactNode }) {
    return <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{children}</p>;
}

function RuleList({ items }: { items: Array<[string, string]> }) {
    return (
        <ul className="space-y-2">
            {items.map(([title, desc]) => (
                <li key={title} className="flex gap-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    <span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{title}</span>
                        {desc}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function Lead({ icon: Icon, tone, title, desc }: { icon: LucideIcon; tone: Tone; title: string; desc: string }) {
    return (
        <div className={cn("flex items-start gap-3 rounded-2xl p-4", TONES[tone].callout)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-0.5">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs leading-relaxed opacity-80">{desc}</p>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*                                   主组件                                    */
/* -------------------------------------------------------------------------- */

export function Step1Guidelines({ onNext }: Step1GuidelinesProps) {
    const { t } = useI18n();
    const tStep = t.welcome.step1;

    const [currentTab, setCurrentTab] = useState<string>("terms");
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLSpanElement>(null);

    /** 阅读进度：直接写 transform，绕过 React 渲染（每帧零重绘开销） */
    const syncProgress = useCallback(() => {
        const el = scrollRef.current;
        const bar = progressRef.current;
        if (!el || !bar) return;
        const max = el.scrollHeight - el.clientHeight;
        const ratio = max <= 0 ? 1 : Math.min(1, el.scrollTop / max);
        bar.style.transform = `scaleX(${ratio})`;
    }, []);

    // 首帧同步：内容不足一屏时进度直接为满
    useEffect(() => {
        syncProgress();
    }, [syncProgress]);

    const handleTabChange = (value: string) => {
        setCurrentTab(value);
        // 切换文档后回到顶部，并在下一帧（内容已替换）重新计算进度
        requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            syncProgress();
        });
    };

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
        } catch (err: unknown) {
            console.error("公约提交失败:", err);
            toast.error(t.common.networkError);
        } finally {
            setSubmitting(false);
        }
    };

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
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                    {tStep.description}
                </p>
            </div>

            {/* 条款主玻璃面板 */}
            <div onMouseMove={trackPointer} className={cn(PANEL, "group/panel")}>
                <span aria-hidden className={TOP_SEAM} />
                <div aria-hidden className={REFLEX_LAYER} style={{ background: REFLEX_GRADIENT }} />

                <div className="relative z-10">
                    {/* 面板头：版本胶囊 + 新窗口打开 */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 pt-5">
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400/60 animate-ping motion-reduce:animate-none" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                            </span>
                            <span>{tStep.agreementNote}</span>
                            <span aria-hidden className={cn(DIVIDER_V, "hidden sm:block")} />
                            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500">{tStep.reviewHint}</span>
                        </div>

                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link href="/rules" target="_blank" rel="noopener noreferrer">
                                {tStep.openRulesWindow}
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>

                    {/* 双文档切换 */}
                    <div className="px-5 sm:px-6 pt-4">
                        <Tabs value={currentTab} onValueChange={handleTabChange}>
                            <TabsList className="flex w-full h-10">
                                <TabsTrigger value="terms" className="text-xs sm:text-sm">
                                    <ScrollText className="h-4 w-4" />
                                    <span>{tStep.termsTab}</span>
                                </TabsTrigger>
                                <TabsTrigger value="guidelines" className="text-xs sm:text-sm">
                                    <HeartHandshake className="h-4 w-4" />
                                    <span>{tStep.guidelinesTab}</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* 阅读进度光缝（消融底轨 + 琥珀进度） */}
                    <div className="relative mx-5 sm:mx-6 mt-4" aria-hidden title={tStep.readProgress}>
                        <div className={DIVIDER_H} />
                        <span
                            ref={progressRef}
                            className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-amber-400/0 via-amber-500/70 to-amber-400/90 transition-transform duration-100 ease-out"
                            style={{ transform: "scaleX(0)" }}
                        />
                    </div>

                    {/* 条款正文（上下边缘渐隐消融） */}
                    <div
                        ref={scrollRef}
                        onScroll={syncProgress}
                        tabIndex={0}
                        className="h-[min(440px,56dvh)] overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 outline-none [mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-28px),transparent)]"
                    >
                        {currentTab === "terms" ? (
                            <div className="space-y-3.5 pb-2">
                                <Lead icon={FileCheck} tone="sky" title={tStep.termsNatureTitle} desc={tStep.termsNatureDesc} />

                                {/* 1. 免责声明 */}
                                <Section icon={Scale} tone="amber" title={tStep.sec1Title}>
                                    <Callout tone="amber">{tStep.sec1Highlight}</Callout>
                                    <Paragraph>{tStep.sec1P1}</Paragraph>
                                    <Paragraph>{tStep.sec1P2}</Paragraph>
                                </Section>

                                {/* 2. 数据留存说明 */}
                                <Section icon={Database} tone="sky" title={tStep.sec2Title}>
                                    <Callout tone="sky">{tStep.sec2Highlight}</Callout>
                                    <div className="grid gap-2.5 sm:grid-cols-2">
                                        {[
                                            { icon: MessageSquare, title: tStep.sec2TextCardTitle, desc: tStep.sec2TextCardDesc },
                                            { icon: Clock, title: tStep.sec2FileCardTitle, desc: tStep.sec2FileCardDesc },
                                        ].map(({ icon: Icon, title, desc }) => (
                                            <div
                                                key={title}
                                                className="rounded-2xl bg-white/70 dark:bg-white/[0.04] p-3.5 space-y-1 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                                            >
                                                <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                                    <Icon className="h-3.5 w-3.5 text-sky-500" />
                                                    {title}
                                                </p>
                                                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>

                                {/* 3. 用户义务与多媒体责任 */}
                                <Section icon={FileCheck} tone="emerald" title={tStep.sec3Title}>
                                    <Callout tone="emerald">{tStep.sec3Highlight}</Callout>
                                    <RuleList
                                        items={[
                                            [tStep.sec3Li1Title, tStep.sec3Li1Desc],
                                            [tStep.sec3Li2Title, tStep.sec3Li2Desc],
                                            [tStep.sec3Li3Title, tStep.sec3Li3Desc],
                                        ]}
                                    />
                                </Section>

                                {/* 4. 账号管理与平台处置权利 */}
                                <Section icon={UserCheck} tone="violet" title={tStep.sec4Title}>
                                    <Paragraph>{tStep.sec4Desc}</Paragraph>
                                </Section>
                            </div>
                        ) : (
                            <div className="space-y-3.5 pb-2">
                                {/* 社区宗旨 */}
                                <Lead
                                    icon={HeartHandshake}
                                    tone="emerald"
                                    title={tStep.guidelinesSpiritTitle}
                                    desc={tStep.guidelinesSpiritDesc}
                                />

                                {/* 第一章：学术诚信规范 */}
                                <Section icon={Scale} tone="sky" title={tStep.chap1Title}>
                                    <RuleList
                                        items={[
                                            [tStep.chap1Li1Title, tStep.chap1Li1Desc],
                                            [tStep.chap1Li2Title, tStep.chap1Li2Desc],
                                            [tStep.chap1Li3Title, tStep.chap1Li3Desc],
                                        ]}
                                    />
                                </Section>

                                {/* 第二章：言论与研讨准则 */}
                                <Section icon={MessageSquare} tone="indigo" title={tStep.chap2Title}>
                                    <RuleList
                                        items={[
                                            [tStep.chap2Li1Title, tStep.chap2Li1Desc],
                                            [tStep.chap2Li2Title, tStep.chap2Li2Desc],
                                            [tStep.chap2Li3Title, tStep.chap2Li3Desc],
                                        ]}
                                    />
                                </Section>

                                {/* 第三章：同行审议与安全防线 */}
                                <Section icon={ShieldAlert} tone="rose" title={tStep.chap3Title}>
                                    <Paragraph>{tStep.chap3Desc}</Paragraph>
                                </Section>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 签署确认与下一步控制 */}
            <div className="flex flex-col items-center gap-4 pt-1">
                <label
                    htmlFor="terms-check"
                    className={cn(
                        "flex w-full max-w-xl cursor-pointer select-none items-start sm:items-center gap-3 rounded-2xl border-0 px-4 py-3 backdrop-blur-xl",
                        "transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out-snappy)] active:scale-[0.99]",
                        agreed
                            ? cn("bg-white/85 dark:bg-zinc-900/70", AMBER_AURA_SHADOW)
                            : "bg-white/60 hover:bg-white/80 dark:bg-zinc-900/45 dark:hover:bg-zinc-900/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_8px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
                    )}
                >
                    <Checkbox
                        id="terms-check"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(!!checked)}
                        className={cn(
                            "mt-0.5 sm:mt-0 h-5 w-5 rounded-full border-0 transition-[background-color,box-shadow] duration-150",
                            "bg-zinc-900/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:bg-white/[0.08] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]",
                            "data-[state=checked]:bg-zinc-950/85 data-[state=checked]:text-white data-[state=checked]:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35)]",
                            "dark:data-[state=checked]:bg-white/90 dark:data-[state=checked]:text-zinc-950",
                            "[&_svg]:h-3 [&_svg]:w-3 [&_svg]:stroke-[3]"
                        )}
                    />
                    <span className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {tStep.agreeCheckboxLabel}{" "}
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">{tStep.agreeTermsLink}</span>
                        {tStep.agreeConnector}
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">{tStep.agreeGuidelinesLink}</span>
                    </span>
                </label>

                <Button
                    size="lg"
                    disabled={!agreed || submitting}
                    onClick={handleConfirm}
                    className="group w-full sm:w-80 h-12 text-sm"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {tStep.submittingButton}
                        </>
                    ) : (
                        <>
                            {tStep.submitButton}
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-snappy)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
