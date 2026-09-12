import React from "react";
import {
    Atom,
    Binary,
    BookOpen,
    Boxes,
    Compass,
    Cpu,
    Dna,
    Orbit,
    Palette,
    Sigma,
    type LucideIcon,
} from "lucide-react";

export type LiquidGlassPattern =
    | "siri-aurora"       // 极光流体波光
    | "emerald-dew"       // 薄荷露珠水光
    | "nebula-velvet"     // 星云丝绒琉璃
    | "cyber-fluid"       // 深渊赛博液态
    | "celestial-rings"   // 视界引力天体环
    | "solar-amber"       // 琥珀日落流波
    | "vintage-cognac"    // 古典干邑琉璃
    | "berry-mirage"      // 浆果晚霞水光
    | "glacier-ice"       // 冰川通透冰晶
    | "liquid-titanium";  // 液态水银钛合金

export interface CollectionCoverPreset {
    id: string;
    name: string;
    enName: string;
    subject: string;
    icon: LucideIcon;
    fallbackEmoji: string;
    class: string;
    primaryOrb: string;     // 主液态光球色彩
    secondaryOrb: string;   // 辅助液态光球色彩
    tertiaryOrb?: string;   // 弥散液态光球色彩
    accentColor: string;    // 前景高光与图标色
    glassBorder: string;    // 玻璃高光边框色
    liquidPattern: LiquidGlassPattern;
    description: string;
}

export const COLLECTION_COVER_PRESETS: CollectionCoverPreset[] = [
    {
        id: "preset-academic",
        name: "极光流体",
        enName: "INTELLIGENCE AURORA",
        subject: "理论物理与前沿科技",
        icon: Atom,
        fallbackEmoji: "⚛️",
        class: "bg-slate-950",
        primaryOrb: "rgba(56, 189, 248, 0.45)",      // 极光青
        secondaryOrb: "rgba(217, 70, 239, 0.35)",    // 霓虹洋红
        tertiaryOrb: "rgba(99, 102, 241, 0.4)",      // 靛蓝
        accentColor: "#38bdf8",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "siri-aurora",
        description: "极光漫射流光，双色液态有机流动",
    },
    {
        id: "preset-science",
        name: "薄荷露珠",
        enName: "EMERALD DEW",
        subject: "生命科学与医学",
        icon: Dna,
        fallbackEmoji: "🧬",
        class: "bg-zinc-950",
        primaryOrb: "rgba(52, 211, 153, 0.45)",      // 翡翠薄荷
        secondaryOrb: "rgba(45, 212, 191, 0.35)",    // 水晶青绿
        tertiaryOrb: "rgba(16, 185, 129, 0.3)",      // 森林暗翠
        accentColor: "#34d399",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "emerald-dew",
        description: "晨曦露珠般晶莹透亮的液态水光与透光折射",
    },
    {
        id: "preset-math",
        name: "星云丝绒",
        enName: "NEBULA VELVET",
        subject: "纯粹数学与几何",
        icon: Sigma,
        fallbackEmoji: "∑",
        class: "bg-slate-950",
        primaryOrb: "rgba(192, 132, 252, 0.45)",     // 丝绒紫
        secondaryOrb: "rgba(244, 114, 182, 0.35)",   // 浅桃粉
        tertiaryOrb: "rgba(129, 140, 248, 0.35)",    // 冰蓝
        accentColor: "#c084fc",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "nebula-velvet",
        description: "visionOS 深度紫罗兰微光，柔和高雅的丝绒折射",
    },
    {
        id: "preset-tech",
        name: "赛博水银",
        enName: "CYBER MERCURY",
        subject: "计算机与算法系统",
        icon: Cpu,
        fallbackEmoji: "⚡",
        class: "bg-zinc-950",
        primaryOrb: "rgba(96, 165, 250, 0.45)",      // 钛金海蓝
        secondaryOrb: "rgba(34, 211, 238, 0.35)",    // 冰川青
        tertiaryOrb: "rgba(59, 130, 246, 0.3)",
        accentColor: "#60a5fa",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "cyber-fluid",
        description: "macOS 流动海蓝壁纸质感，平滑液态光带",
    },
    {
        id: "preset-cosmos",
        name: "天体引力",
        enName: "CELESTIAL GLASS",
        subject: "天体物理与深空",
        icon: Orbit,
        fallbackEmoji: "🪐",
        class: "bg-slate-950",
        primaryOrb: "rgba(129, 140, 248, 0.45)",     // 群青深靛
        secondaryOrb: "rgba(99, 102, 241, 0.4)",     // 深星系蓝
        tertiaryOrb: "rgba(168, 85, 247, 0.3)",
        accentColor: "#818cf8",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "celestial-rings",
        description: "黑洞视界与引力透镜弯曲光晕，沉浸式深空琉璃",
    },
    {
        id: "preset-nature",
        name: "日光琥珀",
        enName: "SOLAR AMBER",
        subject: "地球科学与环境",
        icon: Compass,
        fallbackEmoji: "🧭",
        class: "bg-neutral-950",
        primaryOrb: "rgba(251, 191, 36, 0.45)",      // 琥珀金
        secondaryOrb: "rgba(249, 115, 22, 0.35)",    // 暖阳橙
        tertiaryOrb: "rgba(234, 88, 12, 0.25)",
        accentColor: "#fbbf24",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "solar-amber",
        description: "加州夕阳浸润的流动琥珀，温润澄澈的光泽感",
    },
    {
        id: "preset-philosophy",
        name: "古典干邑",
        enName: "VINTAGE COGNAC",
        subject: "人文思想与古典文哲",
        icon: BookOpen,
        fallbackEmoji: "📜",
        class: "bg-neutral-950",
        primaryOrb: "rgba(217, 119, 6, 0.4)",        // 典雅古铜
        secondaryOrb: "rgba(180, 83, 9, 0.35)",      // 干邑暖木
        tertiaryOrb: "rgba(120, 53, 15, 0.3)",
        accentColor: "#f59e0b",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "vintage-cognac",
        description: "沉稳厚重的经典干邑琉璃，透出人文思想的温润余辉",
    },
    {
        id: "preset-art",
        name: "晚霞浆果",
        enName: "BERRY MIRAGE",
        subject: "艺术哲学与设计",
        icon: Palette,
        fallbackEmoji: "🎨",
        class: "bg-zinc-950",
        primaryOrb: "rgba(244, 63, 94, 0.45)",       // 浆果玫红
        secondaryOrb: "rgba(236, 72, 153, 0.35)",    // 晚霞珊瑚
        tertiaryOrb: "rgba(168, 85, 247, 0.3)",
        accentColor: "#f43f5e",
        glassBorder: "rgba(255, 255, 255, 0.35)",
        liquidPattern: "berry-mirage",
        description: "液态浆果霓虹，棱镜折射光谱",
    },
    {
        id: "preset-blueprint",
        name: "冰川纯水",
        enName: "GLACIER ICE",
        subject: "精密工程与建筑",
        icon: Boxes,
        fallbackEmoji: "📐",
        class: "bg-slate-950",
        primaryOrb: "rgba(59, 130, 246, 0.45)",      // 纯净蔚蓝
        secondaryOrb: "rgba(147, 197, 253, 0.35)",   // 冰川银青
        tertiaryOrb: "rgba(30, 64, 175, 0.3)",
        accentColor: "#93c5fd",
        glassBorder: "rgba(255, 255, 255, 0.4)",
        liquidPattern: "glacier-ice",
        description: "高折射率的纯净冰川厚玻璃，通透无瑕的晶体切面",
    },
    {
        id: "preset-monochrome",
        name: "液态钛金",
        enName: "LIQUID TITANIUM",
        subject: "数理逻辑与纯粹理性",
        icon: Binary,
        fallbackEmoji: "01",
        class: "bg-black",
        primaryOrb: "rgba(255, 255, 255, 0.25)",     // 纯白高光
        secondaryOrb: "rgba(148, 163, 184, 0.2)",    // 钛金属灰
        tertiaryOrb: "rgba(71, 85, 105, 0.25)",
        accentColor: "#f8fafc",
        glassBorder: "rgba(255, 255, 255, 0.45)",
        liquidPattern: "liquid-titanium",
        description: "高精液态钛金属质感，极致纯粹的黑白高光",
    },
];

export function getCollectionCoverPreset(coverStyle?: string | null): CollectionCoverPreset {
    if (!coverStyle) return COLLECTION_COVER_PRESETS[0];
    return COLLECTION_COVER_PRESETS.find(p => p.id === coverStyle) || COLLECTION_COVER_PRESETS[0];
}
