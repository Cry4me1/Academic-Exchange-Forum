"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Sparkles,
    CloudRain,
    Flower2,
    Snowflake,
    Trees,
    Check,
    Power,
    Eye,
    Globe2,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    startFallingEffect,
    FallingEffectType,
    FallingInstance,
} from "@/lib/effects/natural-falling";

const STORAGE_KEY_ENABLED = "scholarly_profile_falling_enabled";
const STORAGE_KEY_TYPE = "scholarly_profile_falling_type";

interface EffectPreset {
    id: FallingEffectType;
    name: string;
    subName: string;
    season: string;
    icon: any;
    tagline: string;
    activeAura: string;
    iconColor: string;
}

const EFFECT_PRESETS: EffectPreset[] = [
    {
        id: "petal",
        name: "落樱纷飞",
        subName: "春樱",
        season: "春季",
        icon: Flower2,
        tagline: "随风摇曳，落英缤纷",
        activeAura:
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_0_20px_rgba(244,114,182,0.28)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_0_20px_rgba(244,114,182,0.2)]",
        iconColor: "text-pink-500 dark:text-pink-400",
    },
    {
        id: "rain",
        name: "空山细雨",
        subName: "夏雨",
        season: "夏季",
        icon: CloudRain,
        tagline: "晶莹雨丝，水花微溅",
        activeAura:
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_0_20px_rgba(14,165,233,0.28)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_0_20px_rgba(14,165,233,0.2)]",
        iconColor: "text-sky-500 dark:text-sky-400",
    },
    {
        id: "leaf",
        name: "金枫醉染",
        subName: "秋枫",
        season: "秋季",
        icon: Trees,
        tagline: "银杏醉金，红枫自旋",
        activeAura:
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_0_20px_rgba(245,158,11,0.28)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_0_20px_rgba(245,158,11,0.2)]",
        iconColor: "text-amber-500 dark:text-amber-400",
    },
    {
        id: "snow",
        name: "初雪静谧",
        subName: "冬雪",
        season: "冬季",
        icon: Snowflake,
        tagline: "纷飞纯净，轻缓飘零",
        activeAura:
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_0_20px_rgba(168,85,247,0.25)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2),0_0_20px_rgba(168,85,247,0.18)]",
        iconColor: "text-indigo-400 dark:text-indigo-300",
    },
];

interface FallingEffectControllerProps {
    targetUserFallingEffect?: string | null;
    isOwnProfile?: boolean;
    targetUserId?: string;
    targetUserName?: string;
    onEffectChange?: (newEffect: string | null) => void;
    className?: string;
}

export function FallingEffectController({
    targetUserFallingEffect,
    isOwnProfile = false,
    targetUserId,
    targetUserName = "该学者",
    onEffectChange,
    className,
}: FallingEffectControllerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [activeType, setActiveType] = useState<FallingEffectType>("petal");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const effectInstanceRef = useRef<FallingInstance | null>(null);
    const supabase = createClient();

    // 120fps 光随鼠动原生 CSS 变量写入
    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
        e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
    };

    // 核心初始化逻辑：严格满足用户“别人访问时如果该用户开了，别人一定可以看见且不要关闭”
    useEffect(() => {
        if (!isOwnProfile) {
            // 【访客视角】：如果主页主人开启了某种特效，访客必然自动开启，并直接展示主人的设置且不要关闭
            if (
                targetUserFallingEffect &&
                ["petal", "rain", "leaf", "snow"].includes(targetUserFallingEffect)
            ) {
                setIsEnabled(true);
                setActiveType(targetUserFallingEffect as FallingEffectType);
            } else {
                setIsEnabled(false);
            }
        } else {
            // 【主人视角】：优先读取数据库配置，若为空则读取本地备份
            if (
                targetUserFallingEffect &&
                ["petal", "rain", "leaf", "snow"].includes(targetUserFallingEffect)
            ) {
                setIsEnabled(true);
                setActiveType(targetUserFallingEffect as FallingEffectType);
            } else if (targetUserFallingEffect === null || targetUserFallingEffect === "") {
                setIsEnabled(false);
            } else {
                try {
                    const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED) === "true";
                    const savedType = localStorage.getItem(STORAGE_KEY_TYPE) as FallingEffectType;
                    setIsEnabled(savedEnabled);
                    if (savedType && ["petal", "rain", "leaf", "snow"].includes(savedType)) {
                        setActiveType(savedType);
                    }
                } catch {
                    setIsEnabled(false);
                }
            }
        }
        setIsLoaded(true);
    }, [targetUserFallingEffect, isOwnProfile]);

    // 物理动效引擎调度与生命周期维护（严禁自动关闭，fadeOut: false，持续飘落）
    useEffect(() => {
        if (!isLoaded) return;

        // 销毁旧实例
        if (effectInstanceRef.current) {
            effectInstanceRef.current.destroy();
            effectInstanceRef.current = null;
        }

        // 启动特效：fadeOut 保持 false，永不超时关闭
        if (isEnabled) {
            effectInstanceRef.current = startFallingEffect({
                open: true,
                effectType: activeType,
                fadeIn: true,
                fadeOut: false, // 严格持续飘落，绝不自动关闭
            });
        }

        return () => {
            if (effectInstanceRef.current) {
                effectInstanceRef.current.destroy();
                effectInstanceRef.current = null;
            }
        };
    }, [isEnabled, activeType, isLoaded]);

    // 主人切换或开关特效并持久化保存至 Supabase profiles 表
    const handleToggleEffect = async (newEnabled: boolean, newType?: FallingEffectType) => {
        const typeToSet = newType || activeType;
        setIsEnabled(newEnabled);
        if (newType) {
            setActiveType(newType);
        }

        // 如果是自己的主页，同步持久化至 Supabase
        if (isOwnProfile && targetUserId) {
            setIsSaving(true);
            const valueToSave = newEnabled ? typeToSet : null;

            try {
                const { error } = await supabase
                    .from("profiles")
                    .update({ falling_effect: valueToSave })
                    .eq("id", targetUserId);

                if (error) {
                    console.error("Failed to update profile falling effect:", error);
                    toast.error("保存主页视效失败，请检查网络后再试");
                } else {
                    onEffectChange?.(valueToSave);
                    const presetName =
                        EFFECT_PRESETS.find((p) => p.id === typeToSet)?.name || "四季视效";
                    if (newEnabled) {
                        toast.success(`主页已设为【${presetName}】，来访学者将自动呈现并持续飘落`);
                    } else {
                        toast.success("已关闭主页背景视效");
                    }
                }
            } catch (err) {
                console.error("Update error:", err);
            } finally {
                setIsSaving(false);
            }
        }

        // 写入本地 localStorage
        try {
            localStorage.setItem(STORAGE_KEY_ENABLED, newEnabled ? "true" : "false");
            localStorage.setItem(STORAGE_KEY_TYPE, typeToSet);
        } catch {
            // ignore
        }
    };

    const currentPreset = EFFECT_PRESETS.find((p) => p.id === activeType) || EFFECT_PRESETS[0];
    const CurrentIcon = currentPreset.icon;

    return (
        <div className={cn("relative inline-block select-none", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onMouseMove={handleMouseMove}
                        title={
                            isOwnProfile
                                ? "设置我的主页四季自然飘落装扮"
                                : `${targetUserName} 的主页四季自然视效`
                        }
                        className={cn(
                            "relative overflow-hidden group/ambient flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-0 text-xs font-medium cursor-pointer transition-all duration-300",
                            // Apple Liquid Glass 三层物理光学设计
                            "bg-white/75 hover:bg-white/90 dark:bg-zinc-900/60 dark:hover:bg-zinc-900/80 backdrop-blur-xl",
                            isEnabled
                                ? cn(
                                      "text-zinc-900 dark:text-zinc-100",
                                      currentPreset.activeAura
                                  )
                                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-2px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12),0_4px_16px_-2px_rgba(0,0,0,0.3)]"
                        )}
                    >
                        {/* 120fps 光随鼠动折射高光 */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-0 group-hover/ambient:opacity-100 transition-opacity duration-300 rounded-full"
                            style={{
                                background:
                                    "radial-gradient(90px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.45), transparent 80%)",
                            }}
                        />

                        {/* 图标与微流动光晕 */}
                        <span className="relative flex items-center justify-center">
                            <CurrentIcon
                                className={cn(
                                    "h-3.5 w-3.5 transition-transform duration-300 group-hover/ambient:rotate-12",
                                    isEnabled
                                        ? currentPreset.iconColor
                                        : "text-zinc-400 dark:text-zinc-500"
                                )}
                            />
                            {isEnabled && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            )}
                        </span>

                        {/* 状态文案：字体锁定 font-medium，严格零布局跳动 */}
                        <span className="relative font-medium tracking-tight">
                            {isEnabled
                                ? isOwnProfile
                                    ? `主页·${currentPreset.subName}`
                                    : `学者空间·${currentPreset.subName}`
                                : "四季飘落"}
                        </span>

                        {/* 状态微胶囊小指示器 */}
                        <span
                            className={cn(
                                "relative px-1.5 py-0.2 text-[10px] rounded-full font-medium transition-colors",
                                isEnabled
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-zinc-200/60 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400"
                            )}
                        >
                            {isEnabled ? "呈现中" : "关闭"}
                        </span>
                    </motion.button>
                </PopoverTrigger>

                {/* 大曲率 Apple Liquid Glass 面板 */}
                <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-80 sm:w-88 p-4 sm:p-5 rounded-3xl border-0 bg-white/85 dark:bg-zinc-900/75 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_16px_48px_-8px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.16),0_16px_48px_-8px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                >
                    {/* 面板头部：标题与总开关 */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                    {isOwnProfile ? "我的主页四季装扮" : `${targetUserName}的主页景致`}
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                    {isOwnProfile
                                        ? "设定后所有来访学者均可欣赏此景致"
                                        : "该学者开启了空间自然飘落视效"}
                                </p>
                            </div>
                        </div>

                        {/* 水滴胶囊物理总开关 (主人可随时开关持久化，访客可本地临时静止) */}
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isSaving}
                            onClick={() => handleToggleEffect(!isEnabled)}
                            aria-label={isEnabled ? "关闭飘落特效" : "开启飘落特效"}
                            className={cn(
                                "relative w-12 h-6 rounded-full border-0 p-0.5 transition-all duration-300 cursor-pointer shadow-[inset_0_1px_1px_rgba(0,0,0,0.1)]",
                                isEnabled
                                    ? "bg-zinc-950 dark:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
                                    : "bg-zinc-200 dark:bg-zinc-800"
                            )}
                        >
                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={cn(
                                    "w-5 h-5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] flex items-center justify-center transition-colors",
                                    isEnabled
                                        ? "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white translate-x-6"
                                        : "bg-white text-zinc-400 dark:bg-zinc-700 dark:text-zinc-300 translate-x-0"
                                )}
                            >
                                <Power className="h-2.5 w-2.5" strokeWidth={2.5} />
                            </motion.div>
                        </motion.button>
                    </div>

                    {/* 渐变消融微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-3.5" />

                    {/* 四季特效选项网格 */}
                    <div className="space-y-1.5">
                        <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 px-1 mb-2 flex items-center justify-between">
                            <span>{isOwnProfile ? "选择主页装扮效果" : "当前主页效果"}</span>
                            <span className="text-[10px] text-zinc-400">
                                {isOwnProfile ? "点击切换并自动保存" : "沉浸式自然下落"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {EFFECT_PRESETS.map((preset) => {
                                const Icon = preset.icon;
                                const isSelected = isEnabled && activeType === preset.id;

                                return (
                                    <motion.button
                                        key={preset.id}
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onMouseMove={handleMouseMove}
                                        onClick={() => {
                                            handleToggleEffect(true, preset.id);
                                        }}
                                        className={cn(
                                            "relative overflow-hidden group/card p-3 rounded-2xl border-0 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[76px]",
                                            isSelected
                                                ? cn(
                                                      "bg-white/90 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100",
                                                      preset.activeAura
                                                  )
                                                : "bg-zinc-100/60 hover:bg-zinc-100/90 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.06)]"
                                        )}
                                    >
                                        {/* 120fps 光随鼠动折射高光 */}
                                        <div
                                            className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 rounded-2xl"
                                            style={{
                                                background:
                                                    "radial-gradient(100px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.4), transparent 80%)",
                                            }}
                                        />

                                        {/* 顶部图标与季节 Badge */}
                                        <div className="flex items-center justify-between w-full">
                                            <div
                                                className={cn(
                                                    "w-7 h-7 rounded-xl flex items-center justify-center transition-colors",
                                                    isSelected
                                                        ? "bg-zinc-100 dark:bg-zinc-700/80 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]"
                                                        : "bg-zinc-200/50 dark:bg-zinc-800/60"
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "h-3.5 w-3.5",
                                                        isSelected ? preset.iconColor : "text-zinc-400"
                                                    )}
                                                />
                                            </div>

                                            {isSelected ? (
                                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shadow-xs">
                                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                    {preset.season}
                                                </span>
                                            )}
                                        </div>

                                        {/* 特效标题与诗意副标：严格零布局跳动，字重恒定 font-medium */}
                                        <div className="mt-2">
                                            <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                                                {preset.name}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal truncate mt-0.5">
                                                {preset.tagline}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 渐变消融微光缝 */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent my-3.5" />

                    {/* 底部贴心状态条 */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 px-1 font-medium">
                        <span className="flex items-center gap-1.5">
                            <span
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    isEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
                                )}
                            />
                            <span>
                                {isEnabled
                                    ? `当前呈现: ${currentPreset.name}（持续飘落）`
                                    : "当前效果: 已关闭"}
                            </span>
                        </span>
                        <span className="text-[10px] text-zinc-400 opacity-80">
                            {isOwnProfile ? "访客来访可见" : "全屏独立图层"}
                        </span>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
