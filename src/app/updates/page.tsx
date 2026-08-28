import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle2,
    Code,
    Cloud,
    Compass,
    Crown,
    EyeOff,
    FileCode,
    FileText,
    GitMerge,
    Globe,
    GraduationCap,
    Heart,
    Image as ImageIcon,
    Languages,
    Layers,
    LayoutDashboard,
    Lock,
    MessageSquare,
    MessageSquareCode,
    Palette,
    PenTool,
    Printer,
    Rocket,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    Star,
    User,
    Users,
    Zap,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { ZoomableImage } from "@/components/ui/zoomable-image";

export const metadata: Metadata = {
    title: "更新日志 - Scholarly",
    description: "Scholarly 学术论坛的最新更新与改进记录",
};

export default function UpdatesPage() {
    return (
        <div className="relative min-h-screen">
            {/* ═══════════════════════════════════════════════════════  */}
            {/* Animated Background Layer – CSS-only floating particles */}
            {/* ═══════════════════════════════════════════════════════  */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
                {/* Large blurred gradient orbs that slowly drift */}
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-[drift_18s_ease-in-out_infinite_alternate]" />
                <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px] animate-[drift_22s_ease-in-out_infinite_alternate-reverse]" />
                <div className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full bg-amber-500/8 blur-[100px] animate-[drift_20s_ease-in-out_infinite_alternate]" />
            </div>

            <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6">
                {/* Back button */}
                <div className="mb-8">
                    <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            返回控制台
                        </Link>
                    </Button>
                </div>

                {/* ═══════════════════════════════════════════  */}
                {/* Hero Header with animated gradient text      */}
                {/* ═══════════════════════════════════════════  */}
                <div className="relative mb-16 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm animate-[fadeInDown_0.6s_ease-out]">
                        <Rocket className="w-4 h-4" />
                        正式版发布
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl animate-[fadeInDown_0.8s_ease-out]">
                        <span className="bg-gradient-to-r from-primary via-violet-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                            更新日志
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out]">
                        Scholarly 的演进历程与最新功能发布 —— 从内测走向正式，感谢每一位先行者的陪伴
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 md:ml-6 space-y-12">

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v1.1.7 – 全栈双语国际化 & 封面图与三大UI重构 🚀   ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 animate-[fadeInUp_0.7s_ease-out]">
                        {/* Pulsing timeline dot for the latest version */}
                        <div className="absolute -left-[7px] top-2 flex items-center justify-center">
                            <span className="absolute h-4 w-4 rounded-full bg-primary/40 animate-ping" />
                            <span className="relative h-3.5 w-3.5 rounded-full bg-gradient-to-br from-primary to-violet-500 ring-4 ring-background shadow-lg shadow-primary/30" />
                        </div>

                        <div className="flex flex-col gap-3 mb-5">
                            <time className="text-sm text-muted-foreground font-mono">2026-08-28</time>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                                <span className="bg-gradient-to-r from-primary via-violet-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                                    v1.1.7
                                </span>
                                <span className="text-foreground">— 全站双语国际化 & 16:9 封面图与三大 UI 深度重构</span>
                                <Badge variant="default" className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 animate-[pulse_2s_ease-in-out_infinite] text-xs px-3 py-1">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    最新版本
                                </Badge>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                                迈向国际化学术交流与极致现代美学。v1.1.7 带来了全站中英双语国际化（i18n）架构无缝切换、16:9 帖子封面图上传与正文智能配图提取、主页/编辑器/个人主页三大核心 UI 深度重构，并全新上线沉浸式新手引导、6 步互动教学营、用户搜索学术名片卡与聊天室语法高亮代码块。
                            </p>
                        </div>

                        {/* Main Card with gradient border effect */}
                        <div className="relative group mb-12">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-violet-500/50 to-amber-500/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                            <Card className="relative border-0 bg-card/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                        全新功能与重大改进
                                    </CardTitle>
                                    <CardDescription>
                                        中英全站多语言、16:9 封面系统与配图提取、主页/编辑器/个人主页重构、迎新向导、实战教学营与聊天代码高亮。
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6 pb-8">
                                    {/* Feature 1 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                                <Globe className="w-4 h-4" />
                                            </span>
                                            英、汉语全站国际化多语言体系 (i18n)
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>构建轻量级全栈双语架构，打破语言壁垒，助力全球学者无障碍研讨：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>全站双语平滑切换</strong>：搭载轻量化 i18n 状态引擎与静态类型安全字典，覆盖主页导航、控制台模块、个人设置、帖子卡片与迎新向导。</li>
                                                <li><strong>智能语言持久化</strong>：支持在顶部导航及控制台中一键在“简体中文”与“English”之间快速切换，自动记忆用户偏好并自适应加载。</li>
                                                <li><strong>国际化学术词汇规范</strong>：针对学术论文导出、同行评审、学术对决等专业模块进行了精确的学术英文术语标准化映射。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 2 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                                                <ImageIcon className="w-4 h-4" />
                                            </span>
                                            帖子 16:9 标准封面图系统与智能配图提取
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>大幅增强学术文章的视觉表现力，让优质学术成果更具吸引力：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>多样化封面设置</strong>：支持本地 16:9 比例图片拖拽与极速上传（自带格式与 2MB 大小校验），并支持公开网络图片直链设置。</li>
                                                <li><strong>正文配图智能提取</strong>：独创富文本 AST 树递归解析引擎，自动侦测并捕获 Novel 富文本正文中的全部学术图表与实验配图，支持一键选取设为封面。</li>
                                                <li><strong>瀑布流卡片优雅呈现</strong>：在控制台主页（PostCard）及文章详情页中，以标准 16:9 比例与平滑缩放动效呈现高质量封面。</li>
                                            </ul>

                                            {/* Screenshot: 封面图与编辑器 */}
                                            <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs">
                                                <div className="relative aspect-[1024/507] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                    <ZoomableImage
                                                        src="/updates/v1-1-7/editor-cover-uploader.png"
                                                        alt="帖子编辑器 16:9 封面图上传器界面"
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 768px) 100vw, 800px"
                                                        caption="帖子编辑器 16:9 封面图上传与正文智能配图提取面板"
                                                    />
                                                </div>
                                                <div className="py-1.5 px-3 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                                    <span>▲ 帖子编辑器中集成的 16:9 封面图上传、网络链接与正文智能配图提取面板</span>
                                                    <span className="text-[10px] text-primary/80 font-medium">（支持双击放大查看）</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 3 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                                <LayoutDashboard className="w-4 h-4" />
                                            </span>
                                            全站三大核心 UI 深度重构（主页 / 编辑器 / 个人主页）
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>采用现代化毛玻璃拟态、流光边框（Border Beam）与动态粒子特效，全面重塑视觉与交互体验：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>控制台主页 (Dashboard) 重构</strong>：全新重构了 FeedTabs 标签切换器、StoryBanner 故事横幅、热门标签云（TagCloud）、AI 语义提问卡片与右侧在线好友学术名片。</li>
                                                <li><strong>帖子编辑器 (Editor) 重构</strong>：全新 Novel 学术级富文本编辑器，工具栏交互升级、封面图快捷面板、学术元数据与侧边栏审稿抽屉深度融合。</li>
                                                <li><strong>个人主页 (Profile) 重构</strong>：上线个性化学术 Banner 渐变选择器、洛谷 (Luogu) 等第三方账号双向绑定卡片、学术成就与战力勋章展示矩阵。</li>
                                            </ul>

                                            {/* Screenshots for Dashboard & Profile */}
                                            <div className="mt-4 space-y-4">
                                                <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs">
                                                    <div className="relative aspect-[1024/508] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                        <ZoomableImage
                                                            src="/updates/v1-1-7/dashboard-redesign.png"
                                                            alt="控制台主页 UI 重构界面"
                                                            fill
                                                            className="object-contain"
                                                            sizes="(max-width: 768px) 100vw, 800px"
                                                            caption="控制台主页 (Dashboard) 现代化毛玻璃瀑布流与双语切换"
                                                        />
                                                    </div>
                                                    <div className="py-1.5 px-3 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                                        <span>▲ 控制台主页 (Dashboard) 现代化毛玻璃瀑布流、双语切换与多模块交互设计</span>
                                                        <span className="text-[10px] text-primary/80 font-medium">（支持双击放大查看）</span>
                                                    </div>
                                                </div>

                                                <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs">
                                                    <div className="relative aspect-[1024/509] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                        <ZoomableImage
                                                            src="/updates/v1-1-7/profile-banner-redesign.png"
                                                            alt="个人主页 UI 重构界面"
                                                            fill
                                                            className="object-contain"
                                                            sizes="(max-width: 768px) 100vw, 800px"
                                                            caption="个人主页 (Profile) 学术 Banner 渐变更换与成就勋章"
                                                        />
                                                    </div>
                                                    <div className="py-1.5 px-3 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                                        <span>▲ 个人主页 (Profile) 学术 Banner 渐变更换、战力徽章与帖子归档展示</span>
                                                        <span className="text-[10px] text-primary/80 font-medium">（支持双击放大查看）</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 4 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <GraduationCap className="w-4 h-4" />
                                            </span>
                                            新手迎新向导 (Onboarding) 与 6 步互动式新手教学营
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>零门槛引导新学者探索平台强大功能，打造沉浸式学术成长旅程：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>3 步迎新向导</strong>：学术诚信准则与条款签署、个人学者名片极速设置、主题工作室个性化定制。</li>
                                                <li><strong>6 步互动式教学营</strong>：涵盖 Novel 富文本排版、出版级 PDF 导出、学术对决 Arena、实时学术私聊、积分成长体系与 AI 语义审稿实战。</li>
                                                <li><strong>结业勋章与成就弹窗</strong>：学员通关全部实操关卡后，自动触发高规格结业证书与专属成就勋章弹窗奖励。</li>
                                            </ul>

                                            {/* Screenshots for Onboarding 3 Steps */}
                                            <div className="mt-4 space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {/* Step 1 */}
                                                    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs flex flex-col">
                                                        <div className="relative aspect-[920/1024] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                            <ZoomableImage
                                                                src="/updates/v1-1-7/onboarding-step1-guidelines.png"
                                                                alt="迎新向导第 1 步：学术诚信公约与服务协议签署"
                                                                fill
                                                                className="object-contain"
                                                                sizes="(max-width: 768px) 100vw, 300px"
                                                                caption="迎新向导第 1 步：学术公约与协议签署"
                                                            />
                                                        </div>
                                                        <div className="py-2 px-2.5 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground">
                                                            <span className="font-medium text-foreground block mb-0.5">第 1 步 · 诚信公约</span>
                                                            合规自律与法律协议签署
                                                        </div>
                                                    </div>

                                                    {/* Step 2 */}
                                                    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs flex flex-col">
                                                        <div className="relative aspect-[841/1024] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                            <ZoomableImage
                                                                src="/updates/v1-1-7/onboarding-step2-profile.png"
                                                                alt="迎新向导第 2 步：打造学者专属名片快速建档"
                                                                fill
                                                                className="object-contain"
                                                                sizes="(max-width: 768px) 100vw, 300px"
                                                                caption="迎新向导第 2 步：学者专属名片快速建档"
                                                            />
                                                        </div>
                                                        <div className="py-2 px-2.5 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground">
                                                            <span className="font-medium text-foreground block mb-0.5">第 2 步 · 学者建档</span>
                                                            基础资料与研究方向速填
                                                        </div>
                                                    </div>

                                                    {/* Step 3 */}
                                                    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs flex flex-col">
                                                        <div className="relative aspect-[884/1024] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                            <ZoomableImage
                                                                src="/updates/v1-1-7/onboarding-step3-theme.png"
                                                                alt="迎新向导第 3 步：个性化主页背景主题工作室"
                                                                fill
                                                                className="object-contain"
                                                                sizes="(max-width: 768px) 100vw, 300px"
                                                                caption="迎新向导第 3 步：个性化主页背景主题工作室"
                                                            />
                                                        </div>
                                                        <div className="py-2 px-2.5 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground">
                                                            <span className="font-medium text-foreground block mb-0.5">第 3 步 · 主题工作室</span>
                                                            空间氛围色系沉浸定制
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center text-[11px] text-muted-foreground pt-1 flex items-center justify-center gap-1">
                                                    <span>▲ 沉浸式 3 步迎新向导流程实景</span>
                                                    <span className="text-[10px] text-primary/80 font-medium">（支持双击放大查看）</span>
                                                </div>

                                                {/* Screenshot: 新手实真实训营 */}
                                                <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs">
                                                    <div className="relative aspect-[986/1024] w-full max-w-2xl mx-auto overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                        <ZoomableImage
                                                            src="/updates/v1-1-7/tutorial-camp.png"
                                                            alt="Scholarly 学术社区 全真实操训练营实景"
                                                            fill
                                                            className="object-contain"
                                                            sizes="(max-width: 768px) 100vw, 700px"
                                                            caption="Scholarly 学术社区 全真实操训练营 (Step 1 学术创作技能实战)"
                                                        />
                                                    </div>
                                                    <div className="py-1.5 px-3 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                                        <span>▲ 1:1 真实业务沙盒驱动的 6 步新手实操训练营交互界面</span>
                                                        <span className="text-[10px] text-primary/80 font-medium">（支持双击放大查看）</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 5 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                                                <MessageSquareCode className="w-4 h-4" />
                                            </span>
                                            学术聊天界面 UI 重构与多语言代码块高亮
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>赋能高质量学术代码沟通，打造开发者与学者友好的即时通信环境：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>ChatCodeBlock 高亮组件</strong>：基于 highlight.js 深度定制，支持 C++、Python、TypeScript 等数十种语言的高亮与 Tag 识别。</li>
                                                <li><strong>一键复制代码与防转义解析</strong>：提供代码块一键复制与反馈动效，内置 HTML 实体反转义解析器，杜绝代码排版错乱。</li>
                                                <li><strong>气泡排版与附件预览</strong>：聊天气泡与文件/学术论文附件预览卡片全面升级，阅读与下载体验倍增。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 6 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
                                                <Search className="w-4 h-4" />
                                            </span>
                                            全局用户搜索卡片 (UserSearchCard)
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>快速发现同行学者，促进学术人脉与跨学科合作：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>精致学者搜索卡片</strong>：全局搜索与发现页中呈现学者头像、VIP 标识、学术头衔、粉丝/发帖统计与个人简介。</li>
                                                <li><strong>一键关注与名片穿梭</strong>：支持在卡片上直接执行关注/取消关注操作，并支持平滑跳转至学者个人主页。</li>
                                            </ul>

                                            {/* Screenshot: 用户搜索卡片 */}
                                            <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-xs">
                                                <div className="relative aspect-[1024/637] w-full overflow-hidden bg-zinc-950/5 dark:bg-zinc-950/40">
                                                    <ZoomableImage
                                                        src="/updates/v1-1-7/user-search-card.png"
                                                        alt="学者用户搜索卡片与名片交互"
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 768px) 100vw, 800px"
                                                        caption="学者用户搜索卡片 (UserSearchCard) 与即时关注互动"
                                                    />
                                                </div>
                                                <div className="py-1.5 px-3 border-t border-border/40 bg-background/60 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                                    <span>▲ 全局搜索结果中呈现的学者学术名片卡 (UserSearchCard) 与即时关注互动</span>
                                                    <span className="text-[10px] text-primary/80 font-medium">（支持双击放大查看）</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v1.1.6 – 出版级学术PDF导出 & 专属邀请与AI审核 🚀 ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 opacity-85 hover:opacity-100 transition-opacity duration-300">
                        {/* Normal timeline dot */}
                        <div className="absolute -left-[5px] top-2 flex items-center justify-center">
                            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600 ring-4 ring-background" />
                        </div>

                        <div className="flex flex-col gap-3 mb-5">
                            <time className="text-sm text-muted-foreground font-mono">2026-08-22</time>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                                <span className="text-foreground">
                                    v1.1.6
                                </span>
                                <span className="text-muted-foreground">— 学术出版级 PDF 导出 & 邀请制与 AI 审稿</span>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                                追求学术严谨与极致阅读。v1.1.6 重磅推出标准学术出版级单栏/双栏 PDF 导出系统与 LaTeX 源码包生成，全面落地超级管理员专属学术邀请制体系，上线多模态 AI 审稿与敏感安全防线，并重构了 60FPS 呼吸式沉浸阅读与学术要素平滑索引。
                            </p>
                        </div>

                        {/* Main Card with gradient border effect */}
                        <div className="relative group mb-12">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-violet-500/50 to-amber-500/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                            <Card className="relative border-0 bg-card/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                        全新功能与改进
                                    </CardTitle>
                                    <CardDescription>
                                        标准单/双栏学术 PDF 导出、学术邀请制、多模态 AI 审核、60FPS 沉浸阅读与专栏连载体系。
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6 pb-8">
                                    {/* Feature 1 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                                                <Printer className="w-4 h-4" />
                                            </span>
                                            标准学术排版 PDF 导出系统 (Nature / IEEE 格式)
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>一键将论坛长文与研讨论文导出为具备正式出版品相的标准学术 PDF：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>单栏 / 双栏自适应排版</strong>：支持 arXiv / Nature 经典单栏与 IEEE / ACM 紧凑双栏学术排版自由切换，自动编排页眉、论文大标题、作者名片、要素提要与 BibTeX 引用代码。</li>
                                                <li><strong>KaTeX 矢量公式与无截断分页</strong>：严格注入 `@media print` 与 `break-inside: avoid` 规则，确保复杂高阶矩阵公式、代码块、定理证明块与 Mermaid 图表在分页处不被生硬截断。</li>
                                                <li><strong>LaTeX (.tex) & Markdown 源码导出</strong>：遵循 RFC 6266 标准完美兼容中文文件名下载，提供完整的编译级 LaTeX 宏包源码包导出。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 2 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                                <Lock className="w-4 h-4" />
                                            </span>
                                            超级管理员专属学术邀请制体系与公开看板
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>打造高质量严谨学术交流圈，保障高水平学者社区氛围：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>严谨邀请准入</strong>：全面启用邀请码注册制，支持邀请码批量生成、使用次数限制、有效期控制与管理员一键批量清理。</li>
                                                <li><strong>公开可视化看板</strong>：上线 `/invite-820` 专属邀请状态看板与邀请链路追踪，直观掌握学术同仁的入驻轨迹。</li>
                                                <li><strong>全模式智能登录</strong>：无缝融合邮箱登录、自定义用户名注册与洛谷 (Luogu) 凭证绑定，支持智能回填邀请码。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 3 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <Shield className="w-4 h-4" />
                                            </span>
                                            多模态内容智能安全审核体系 (AI 审稿 + 敏感词拦截)
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>构建 AI 大模型语义评分与多层级安全防御网：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>AI 语义审稿与评分</strong>：对新发布学术长文自动生成 0~100 分 AI 质量与安全性评分（`ai_score`），精准识别学术违规与灌水内容。</li>
                                                <li><strong>多层防御与待审队列</strong>：命中敏感词或疑似风险的帖子自动拦截进入管理员审稿队列（Pending），全方位保护社区内容纯净。</li>
                                                <li><strong>邮件实时预警推送</strong>：帖子进入待审状态时自动向管理员和作者推送邮件提交通知，审核结果即时双向闭环。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 4 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                                <BookOpen className="w-4 h-4" />
                                            </span>
                                            60FPS 呼吸式沉浸阅读与学术要素平滑索引
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>消除任何视觉形变与卡顿，带来沉浸无干扰的学术研读环境：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>恒定阅读宽度与呼吸缓动</strong>：锁定 768px 国际标准单栏学术阅读排版宽度，两侧边栏以 300ms `cubic-bezier(0.22, 1, 0.36, 1)` 柔和淡出折叠，彻底根除正文文字重新断行与 LaTeX 公式形变撕裂。</li>
                                                <li><strong>学术要素确定性索引</strong>：定义、定理、证明、引理环境块生成确定性序号索引，彻底解决锚点点击失效问题。</li>
                                                <li><strong>三次方平滑滚动与脉冲高亮</strong>：`requestAnimationFrame` 高精度数学缓动滚动直达目标学术块，并伴随蓝紫脉冲呼吸发光（Pulse Glow）提示。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 5 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                                                <Layers className="w-4 h-4" />
                                            </span>
                                            专栏连载体系、全站匿名制改造与 Realtime 架构优化
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>赋能成体系的学术知识沉淀，捍卫学者自由探索隐私：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>专栏连载体系</strong>：支持作者创建个人学术专栏、自定义预设精美封面、收录关联帖子，并在正文侧边栏展示连载进度追踪。</li>
                                                <li><strong>全站匿名制改造</strong>：彻底清除真实姓名依赖，保障全站匿名学术研讨与学术自由表达。</li>
                                                <li><strong>Realtime 架构解耦</strong>：彻底修复 Realtime Channel 订阅碰撞与好友列表 Null 异常，社交互动更轻快稳定。</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v1.1.5 – 学术图像引擎与多端快捷入驻             ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12">
                        {/* Normal timeline dot */}
                        <div className="absolute -left-[5px] top-2 flex items-center justify-center">
                            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600 ring-4 ring-background" />
                        </div>

                        <div className="flex flex-col gap-3 mb-5">
                            <time className="text-sm text-muted-foreground font-mono">2026-07-05</time>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                                <span className="text-foreground">
                                    v1.1.5
                                </span>
                                <span className="text-muted-foreground">— 交互数学引擎 & 快捷学术准入</span>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                                突破视觉与便捷极限。v1.1.5 带来全新交互式函数图像绘制引擎，在正文 LaTeX 表达式中一键拉开画板，呈献手绘渐显图像；同时扩展了多渠道的账号支持（洛谷账号登录绑定与自定义用户名注册），并支持游客无缝预览学术内容，为社区注入更广泛的学术活力。
                            </p>
                        </div>

                        {/* Main Card with gradient border effect */}
                        <div className="relative group mb-12">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-violet-500/50 to-amber-500/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                            <Card className="relative border-0 bg-card/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                        全新功能与改进
                                    </CardTitle>
                                    <CardDescription>
                                        文内自适应函数渲染、洛谷绑定、用户名准入及游客无缝预览。
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-6 pb-8">
                                    {/* Feature 1 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                                <Activity className="w-4 h-4" />
                                            </span>
                                            手绘渐现数学图像引擎 (Desmos 深度融合)
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>为数学、物理、算法等跨学科帖子带来革命性的动态渲染效果：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>智能函数判定</strong>：在阅读模式下，系统能够精准识别 LaTeX 行内及块级函数公式，在不破坏正文排版的情况下，于公式极右侧优雅浮现“绘制”按钮。</li>
                                                <li><strong>上下拉开空位</strong>：采用平滑的 Framer Motion 高度拉伸面板，一键拉开正文物理空间，高亮展示极具高级感的绘图画板。</li>
                                                <li><strong>自左向右手绘渐显</strong>：Desmos API 与 `requestAnimationFrame` 深度结合，使函数线条如同实体画笔般从左到右实时画出，提供顶级学术视觉体验。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 2 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                                                <Users className="w-4 h-4" />
                                            </span>
                                            洛谷账号绑定与用户名自由注册
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>扩展社区学术多元性，打造更加自由、与算法社区无缝衔接的准入体验：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>用户名自主注册</strong>：突破单一登录限制，全面开放基于自定义用户名的直接注册与认证渠道。</li>
                                                <li><strong>洛谷 (Luogu) 绑定登录</strong>：为算法爱好者与 OI 选手特别定制，支持一键关联绑定洛谷凭证。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/60" />

                                    {/* Feature 3 */}
                                    <div className="space-y-3">
                                        <h3 className="text-base font-bold flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                                                <Layers className="w-4 h-4" />
                                            </span>
                                            游客免登录无缝预览
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>降低学术交流准入门槛，让知识传播更加迅速：</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>游客只读预览</strong>：未注册或未登录用户现在能够以游客身份，直接浏览论坛中的公开精选学术帖子，极大优化外部 SEO 与知识分享链路。</li>
                                            </ul>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v1.1.0 – 织网学术图谱与5倍延迟提速 🚀           ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 opacity-80 hover:opacity-100 transition-opacity duration-300">
                        {/* Normal timeline dot for older stable version */}
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 ring-4 ring-background" />

                        <div className="flex flex-col gap-3 mb-5">
                            <time className="text-sm text-muted-foreground font-mono">2026-05-23</time>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    v1.1.0
                                </span>
                                <span className="text-foreground">— 织网学术图谱 & 5倍延迟提速</span>
                                <Badge variant="default" className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 animate-[pulse_2s_ease-in-out_infinite] text-xs px-3 py-1">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    重大更新
                                </Badge>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                                织网互联，快无边界。v1.1.0 带来两大重磅底层升级：我们利用 WikiLink 双向链接与 1024 维 AI 语义大模型，编织了现代化学术图谱；同时，通过全方位的服务端多级缓存与骨架屏，实现了中国地区极具震撼力的 5 倍提速！
                            </p>
                        </div>

                        {/* Main Card with gradient border effect */}
                        <div className="relative group mb-12">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-violet-500/50 to-amber-500/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                            <Card className="relative border-0 bg-card/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                        三大支柱升级
                                    </CardTitle>
                                    <CardDescription>
                                        网状知识互联、自适应多端大模型语义推荐与极具震撼的中国区爆速访问性能。
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-8 pb-8">

                                    {/* 1. 双向链接与反向引用 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 group-hover/feature:bg-indigo-500 group-hover/feature:text-white transition-colors duration-300">
                                                <GitMerge className="w-4 h-4" />
                                            </span>
                                            双向链接与反向引用 (WikiLink)
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>引入行内卡片级学术引流，像维基百科一样把知识网状交织。</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>WikiLink 双括号触发</strong>：编辑器中输入 <code className="text-primary bg-primary/5 px-1 py-0.5 rounded font-mono">[[</code> 立即捕获，唤醒悬浮联想下拉框，模糊检索全站帖子。</li>
                                                <li><strong>知识网络织网</strong>：行内自动渲染具有拟物微光感和悬浮交互的跨帖子学术 Badge，读者可极速穿梭探讨。</li>
                                                <li><strong>反向引用 (Backlinks)</strong>：文章底部自动呈现“引用了本篇讨论的学术脉络”卡片，包含引用者头像与发帖时钟，呈现清晰的学术引用链路。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* 2. AI 1024维语义推荐与概念气泡 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover/feature:bg-amber-500 group-hover/feature:text-white transition-colors duration-300">
                                                <Sparkles className="w-4 h-4" />
                                            </span>
                                            AI 语义推荐与“具体相似”概念气泡
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>对接 1024 维先进大模型，拒绝相似度黑盒，指明在哪些概念上相似。</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>豆包 & Cohere 1024维自适应开发</strong>：全面支持字节跳动豆包（Doubao-embedding-large）与 Cohere 多语言向量模型，智能封装与自适应请求分流。</li>
                                                <li><strong>高精度 HNSW 检索</strong>：搭载 Supabase pgvector 高性能 HNSW 索引余弦相似度检索，毫秒级快速匹配。</li>
                                                <li><strong>学术词条共鸣发现 (共同概念)</strong>：自动分析并计算交叉标签与标题共鸣短词，在卡片下方渲染出诸如 <code className="text-amber-500 font-medium">#图论</code>、<code className="text-amber-500 font-medium">#数论</code> 的分类气泡，明确指出“具体为什么相似”。</li>
                                                <li><strong>优雅标签降级</strong>：当发生任何网络或三方额度限制时，系统自动无感降级为 100% 离线和免费的标签交集匹配 (match_posts_by_tags) 检索，并自动注入 80% 置信度防止前端 `NaN%` 报错，筑牢多维坚固防线。</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* 3. 中国地区延迟 5 倍提速 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover/feature:bg-emerald-500 group-hover/feature:text-white transition-colors duration-300">
                                                <Zap className="w-4 h-4" />
                                            </span>
                                            中国地区访问延迟 5 倍级爆速优化
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>彻底解决跨国网络物理地理延迟阻隔，带给国内用户极致流畅首屏。</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li><strong>unstable_cache 服务端多级缓存层</strong>：为最新 Feed、热门排行、热门标签和系统统计，构建了多级云端缓存层。高频并发访问直接在缓存读取，避开高延迟拉取东京数据库的网络开销。</li>
                                                <li><strong>字体预处理与首屏阻塞破除</strong>：本地集成并预加载 `Geist` 学术英文字体文件，彻底击穿国内请求外部网络资源所带来的阻塞延迟。</li>
                                                <li><strong>渐进式流光骨架屏 (Skeleton Loading)</strong>：为控制台、最新趋势和帖子详情页量身定做流光动效占位，首屏首字渲染延迟一举跨入毫秒级，感官速度激升 5 倍！</li>
                                            </ul>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v1.0.0 – 正式版发布 🎉                         ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 opacity-80 hover:opacity-100 transition-opacity duration-300">
                        {/* Normal timeline dot for older stable version */}
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 ring-4 ring-background" />

                        <div className="flex flex-col gap-3 mb-5">
                            <time className="text-sm text-muted-foreground font-mono">2026-02-28</time>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-3">
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    v1.0.0
                                </span>
                                <span className="text-foreground">— 正式版发布</span>
                                <Badge variant="default" className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 animate-[pulse_2s_ease-in-out_infinite] text-xs px-3 py-1">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    正式版
                                </Badge>
                            </h2>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                                历经数月的精心打磨，Scholarly 正式踏入 1.0 时代。这是一个里程碑式的版本——从内测到正式上线，承载着我们对学术交流体验的极致追求。
                            </p>
                        </div>

                        {/* Main Card with gradient border effect */}
                        <div className="relative group">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/50 via-violet-500/50 to-amber-500/50 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                            <Card className="relative border-0 bg-card/80 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
                                {/* Subtle gradient overlay at top */}
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-amber-500" />

                                <CardHeader className="pt-8">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Rocket className="w-5 h-5 text-primary" />
                                        四大核心升级
                                    </CardTitle>
                                    <CardDescription>
                                        全方位提升学术交流体验，每一个功能都为你精心设计
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-8 pb-8">

                                    {/* Feature 1: Dashboard 帖子卡片升级 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover/feature:bg-blue-500 group-hover/feature:text-white transition-colors duration-300">
                                                <LayoutDashboard className="w-4 h-4" />
                                            </span>
                                            Dashboard 帖子卡片全面升级
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>焕然一新的内容展示方式，让每一篇帖子都光彩夺目。</p>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5">
                                                <li>全新卡片视觉设计：圆角玻璃态风格，支持渐变色彩与微光动画</li>
                                                <li>丰富的元信息展示：作者头像、VIP 徽章、阅读量、评论数一览无余</li>
                                                <li>智能内容预览：自动截取高质量摘要，支持 LaTeX 公式片段展示</li>
                                                <li>交互动效升级：悬停缩放、点赞粒子特效、平滑过渡动画</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Feature 2: 帖子详情页阅读体验提升 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover/feature:bg-emerald-500 group-hover/feature:text-white transition-colors duration-300">
                                                <BookOpen className="w-4 h-4" />
                                            </span>
                                            帖子详情页 · 沉浸式阅读体验
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>学术阅读应该是一种享受，而非负担。</p>
                                            <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">沉浸模式</span>
                                                    <p className="text-xs leading-relaxed">一键进入无干扰阅读环境，自动隐藏侧边栏与导航，专注内容本身</p>
                                                </div>
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">智能目录</span>
                                                    <p className="text-xs leading-relaxed">浮动 TOC 侧边栏，自动高亮当前章节，支持平滑滚动跳转</p>
                                                </div>
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">排版优化</span>
                                                    <p className="text-xs leading-relaxed">优雅的排版间距、段落样式、引用块风格，阅读舒适度大幅提升</p>
                                                </div>
                                                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors duration-300">
                                                    <span className="font-medium text-foreground text-xs uppercase tracking-wider">评论增强</span>
                                                    <p className="text-xs leading-relaxed">评论排序、折叠回复、楼中楼、实时更新，讨论更高效</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Feature 3: VIP 系统 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover/feature:bg-gradient-to-br group-hover/feature:from-amber-500 group-hover/feature:to-yellow-400 group-hover/feature:text-white transition-all duration-300">
                                                <Crown className="w-4 h-4" />
                                            </span>
                                            VIP 会员系统正式上线
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>尊贵身份，专属权益，让学术之旅更加精彩。</p>
                                            <div className="mt-3 relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-violet-500/5 p-4">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
                                                <ul className="space-y-2.5 relative">
                                                    <li className="flex items-start gap-2.5">
                                                        <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <span><strong className="text-foreground">多等级体系：</strong>从 VIP 1 到 VIP 6，层层解锁专属特权与标识</span>
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <span><strong className="text-foreground">专属徽章：</strong>精美的 VIP 等级徽章，在社区中闪耀你的身份</span>
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                        <span><strong className="text-foreground">特权功能：</strong>优先审核、专属主题色、更大附件上传额度等</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Feature 4: 个人主页颜色自定义 */}
                                    <div className="space-y-3 group/feature">
                                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-foreground">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 group-hover/feature:bg-gradient-to-br group-hover/feature:from-pink-500 group-hover/feature:to-rose-400 group-hover/feature:text-white transition-all duration-300">
                                                <Palette className="w-4 h-4" />
                                            </span>
                                            个人主页 · 颜色自定义
                                        </h3>
                                        <div className="pl-10 text-sm text-muted-foreground space-y-2">
                                            <p>你的主页，你做主。支持全站配色方案自定义。</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {/* Color palette preview dots */}
                                                {[
                                                    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
                                                    "bg-pink-500", "bg-rose-500", "bg-cyan-500", "bg-orange-500",
                                                ].map((color, i) => (
                                                    <div
                                                        key={color}
                                                        className={`h-6 w-6 rounded-full ${color} shadow-lg ring-2 ring-background hover:scale-125 transition-transform duration-200`}
                                                        style={{ animationDelay: `${i * 100}ms` }}
                                                    />
                                                ))}
                                            </div>
                                            <ul className="list-disc list-outside ml-4 space-y-1.5 mt-3">
                                                <li>提供多种精选配色方案</li>
                                                <li>支持多种渐变色主题，他人可见你的主页风格</li>
                                                <li>个人偏好自动同步，多端体验一致，让你的主页更加个性化</li>
                                            </ul>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════  */}
                    {/*  🎯 内测 → 正式版 分界线                                */}
                    {/* ═══════════════════════════════════════════════════════  */}
                    <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-500 dark:from-zinc-500 dark:to-zinc-600 ring-4 ring-background" />
                        </div>

                        <div className="relative my-4">
                            {/* Decorative horizontal line */}
                            <div className="absolute inset-0 flex items-center" aria-hidden>
                                <div className="w-full border-t-2 border-dashed border-zinc-300 dark:border-zinc-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-4 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                    <Activity className="w-4 h-4" />
                                    以下为内测阶段版本 (Alpha / Beta)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ╔══════════════════════════════════════════════════╗ */}
                    {/* ║  v0.8.0 – 基础设施升级与私信增强                ║ */}
                    {/* ╚══════════════════════════════════════════════════╝ */}
                    <div className="relative pl-8 md:pl-12 opacity-75 hover:opacity-100 transition-opacity duration-300">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-25</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.8.0 - 基础设施升级与私信增强
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <Card className="border-border/40 bg-card/30">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    核心升级概览
                                </CardTitle>
                                <CardDescription>
                                    本次更新主要集中在后端基础设施的迁移优化，以及用户私信体验的全面升级。
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">

                                {/* Feature Block 1: R2 Migration */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                        <Cloud className="w-4 h-4 text-blue-500" />
                                        存储架构迁移 (Supabase → Cloudflare R2)
                                    </h3>
                                    <div className="pl-6 text-sm text-muted-foreground space-y-2">
                                        <p>
                                            为了提供更快的全球访问速度和更高的可靠性，我们将文件存储系统从 Supabase Storage 完整迁移至 <strong>Cloudflare R2</strong>。
                                        </p>
                                        <ul className="list-disc list-outside ml-4 space-y-1">
                                            <li>大幅降低文件加载延迟，优化图片与附件的传输性能。</li>
                                            <li>更灵活的存储策略，为未来的大规模学术资源托管打下基础。</li>
                                        </ul>
                                    </div>
                                </div>

                                <Separator />

                                {/* Feature Block 2: Private Messaging */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                        <MessageSquare className="w-4 h-4 text-purple-500" />
                                        私信系统 2.0
                                    </h3>
                                    <div className="pl-6 text-sm text-muted-foreground space-y-2">
                                        <p>
                                            学术交流不仅仅是文字。我们重构了私信编辑器，并在底层对接了新的 R2 存储服务，带来了以下新特性：
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4 mt-3">
                                            <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-3">
                                                <FileText className="w-5 h-5 text-indigo-500 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-foreground block mb-1">文件传输</span>
                                                    支持发送图片、文档等各类学术资料。内置文件预览功能，体验流畅。
                                                </div>
                                            </div>
                                            <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-3">
                                                <ShieldCheck className="w-5 h-5 text-green-500 mt-0.5" />
                                                <div>
                                                    <span className="font-medium text-foreground block mb-1">隐私与安全</span>
                                                    <ul className="list-disc ml-4 text-xs">
                                                        <li>附件 7 天自动过期清理，减少冗余并保护隐私。</li>
                                                        <li>支持 2 分钟内消息撤回，避免误发尴尬。</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* v0.7.0 */}
                    <div className="relative pl-8 md:pl-12 opacity-65 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-10</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.7.0 - 深度学术阅读体验
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <Card className="border-border/40 bg-card/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-emerald-500" />
                                    沉浸式阅读与公式引擎
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-primary" />
                                            KaTeX 公式引擎
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            全面引入 KaTeX 渲染引擎，支持复杂的数学与化学方程式实时预览，渲染速度提升 300%。
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-primary" />
                                            智能沉浸模式
                                        </h4>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* v0.6.0 */}
                    <div className="relative pl-8 md:pl-12 opacity-55 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/25 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-05</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.6.0 - 深度协作
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <Card className="border-border/40 bg-card/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-blue-500" />
                                    团队协作系统
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="bg-primary/10 text-primary rounded-full p-1 h-fit mt-0.5">
                                            <Users className="w-3 h-3" />
                                        </span>
                                        <span>
                                            <strong className="text-foreground">问题提出系统：</strong>
                                            支持帖主采纳回答
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* v0.5.0 */}
                    <div className="relative pl-8 md:pl-12 opacity-50 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-muted-foreground/20 ring-4 ring-background" />

                        <div className="flex flex-col gap-2 mb-4">
                            <time className="text-sm text-muted-foreground font-mono">2026-01-03</time>
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                v0.5.0 - 社区基石
                                <Badge variant="secondary" className="text-xs">内测版</Badge>
                            </h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-muted p-2 rounded-md">
                                    <Users className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">学者身份体系上线</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        集成了 ORCID 认证登陆，建立了基于贡献质量的动态声望算法。
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 bg-muted p-2 rounded-md">
                                    <PenTool className="w-5 h-5 text-pink-500" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Markdown 增强版编辑器</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        完整支持 Mermaid 流程图、甘特图以及学术表格扩展。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════  */}
                {/*  🎉 欢迎语模块                                          */}
                {/* ═══════════════════════════════════════════════════════  */}
                <div className="mt-20 relative overflow-hidden rounded-2xl border border-primary/20">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-amber-500/10" />
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />

                    <div className="relative px-8 py-12 text-center space-y-5">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-xl shadow-primary/25 animate-[bounce_3s_ease-in-out_infinite]">
                                <Heart className="w-8 h-8" />
                            </div>
                        </div>

                        <div className="space-y-3 max-w-lg mx-auto">
                            <h3 className="text-2xl font-extrabold tracking-tight">
                                欢迎来到{" "}
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    Scholarly
                                </span>
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                感谢每一位在内测阶段陪伴我们的先行者，你们的反馈让 Scholarly 走到了今天。
                                今天，我们正式向所有学术爱好者敞开大门——
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                                无论你是学生、老师，还是对知识充满好奇的探索者，
                                <br />
                                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                    Scholarly 都是属于你的学术家园。
                                </span>
                            </p>
                            <p className="text-muted-foreground text-sm italic">
                                &ldquo;知识因分享而永恒，思想因碰撞而闪光。&rdquo;
                            </p>
                        </div>

                        <div className="pt-4">
                            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 group">
                                <Link href="/dashboard" className="flex items-center gap-2">
                                    开始探索
                                    <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Made by signature */}
                <div className="mt-12 pb-4 text-center">
                    <p className="text-sm text-muted-foreground/60 flex items-center justify-center gap-1.5">
                        Made with <Heart className="w-3.5 h-3.5 text-pink-500 animate-pulse" /> by{" "}
                        <span className="font-semibold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                            Hansszh
                        </span>
                    </p>
                </div>

            </div>

            {/* ═══════════════════════════════════════════  */}
            {/* Custom CSS Keyframes                        */}
            {/* ═══════════════════════════════════════════  */}
            <style>{`
                @keyframes drift {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(40px, 30px) scale(1.1); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
            `}</style>
        </div>
    );
}
