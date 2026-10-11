"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertOctagon,
    AlertTriangle,
    ArrowLeft,
    Ban,
    BookOpen,
    CheckCircle2,
    Clock,
    Database,
    FileCheck,
    FileCode,
    FileLock2,
    FileSpreadsheet,
    FileText,
    Flame,
    Gavel,
    Globe,
    Handshake,
    HardDrive,
    HeartHandshake,
    ImageIcon,
    Lock,
    MessageSquare,
    Scale,
    ScrollText,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserX,
    Users,
    Zap,
    Coins,
    CreditCard,
    Receipt,
    RefreshCw,
    AlertCircle,
    HelpCircle,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function RulesClient() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [currentTab, setCurrentTab] = useState<string>(
        tabParam === "guidelines"
            ? "guidelines"
            : tabParam === "credits"
            ? "credits"
            : "terms"
    );

    useEffect(() => {
        if (tabParam === "guidelines" || tabParam === "terms" || tabParam === "credits") {
            setCurrentTab(tabParam);
        }
    }, [tabParam]);

    return (
        <div className="relative min-h-screen bg-background">
            {/* 动态氛围背景 */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
                <div className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full bg-blue-500/8 blur-[100px]" />
            </div>

            <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6">
                {/* 顶部返回与元信息 */}
                <div className="mb-8 flex items-center justify-between">
                    <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            返回主页
                        </Link>
                    </Button>
                    <Badge variant="outline" className="gap-1.5 py-1 px-3 border-0 bg-primary/10 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        法律文件 & 行为公约 v2026.1
                    </Badge>
                </div>

                {/* 页面主标题 */}
                <div className="mb-8 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                        <Shield className="w-3.5 h-3.5" />
                        Scholarly 平台治理与合规中心
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                        法律协议与社区准则
                    </h1>
                    <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
                        Scholarly 致力于打造专业、严谨、开放且合规的学术交流共同体。请学者们仔细查阅下方用户协议、积分服务条款与社区公约。
                    </p>
                </div>

                {/* 三支柱 Tab 切换 */}
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full space-y-8">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 p-1.5 bg-muted/60 border-0 rounded-2xl h-auto backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.15)]">
                        <TabsTrigger
                            value="terms"
                            className="py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <ScrollText className="w-4 h-4 text-primary" />
                            <span>📜 用户协议</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="credits"
                            className="py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span>🪙 积分服务条款</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="guidelines"
                            className="py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <HeartHandshake className="w-4 h-4 text-emerald-500" />
                            <span>📋 社区公约</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ========================================================================= */}
                    {/* TAB 1: 📜 用户协议（法律文件） */}
                    {/* ========================================================================= */}
                    <TabsContent value="terms" className="space-y-6 focus-visible:outline-none">
                        {/* 协议性质卡片 */}
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3.5">
                            <FileCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-foreground">协议性质说明</p>
                                <p className="text-muted-foreground mt-0.5">
                                    本协议为您与 Scholarly 平台之间具有法律效力的服务合同。注册、登录或使用本平台即代表您已完整阅读并同意受本协议所有条款约束。
                                </p>
                            </div>
                        </div>

                        {/* 1. 免责声明 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Scale className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第一条：免责声明</CardTitle>
                                        <CardDescription>平台定位与内容独立责任声明</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-semibold text-amber-800 dark:text-amber-300">
                                    “本站为个人学术兴趣交流平台，内容由用户自行发布，不代表本站立场”
                                </div>
                                <p className="text-muted-foreground">
                                    1.1 Scholarly 平台为广大研学者提供学术讨论、代码分享、文献解读与同行评审的技术载体与信息存储空间服务。
                                </p>
                                <p className="text-muted-foreground">
                                    1.2 用户在平台发表的所有文章、评论、公式、数据及观点，均属发布者个人行为，并不代表本平台立场。平台不对用户发布内容的准确性、完整性、学术有效性或适用性作任何明示或暗示的担保。学者在参考、引用相关内容时应保持学术审慎并自行承担相应风险。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 2. 数据留存说明 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第二条：数据留存说明</CardTitle>
                                        <CardDescription>文字消息持久化与附件生命周期规则</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-semibold text-blue-800 dark:text-blue-300">
                                    “文字消息永久保存，文件7天后自动删除”
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                                        <h4 className="font-medium text-foreground flex items-center gap-1.5">
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                            文字记录持久化
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            <strong>“文字消息记录将被永久保存，用于保障社区安全与处理纠纷”</strong>。公开研讨、文章评论及点对点私信文字记录将加密永久存档，用于学术脉络查阅及合规纠纷取证。
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                                        <h4 className="font-medium text-foreground flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            文件自动销毁
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            <strong>“上传的文件将在7天后自动删除，请及时保存重要内容”</strong>。私信传输或临时上传的文件（文档、代码包、音视频等）自上传时起保留 7 天，到期后系统物理清除且无法恢复，请用户及时本地保存。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. 用户义务 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第三条：用户义务</CardTitle>
                                        <CardDescription>守法合规与图片/多媒体内容责任</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-semibold text-emerald-800 dark:text-emerald-300">
                                    “不得发布违法违规内容”
                                </div>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground text-xs sm:text-sm pl-1">
                                    <li>
                                        <strong>合法守规承诺：</strong>用户承诺在使用本平台服务时，严格遵守国家各项法律法规，不得利用平台制作、复制、发布、传播任何违法违规信息。
                                    </li>
                                    <li>
                                        <strong>图片与多媒体责任自负：</strong><strong>用户对所上传的所有图片、图表、附件等内容独立承担全部内容责任与版权责任</strong>。严禁盗用他人版权图表，引用学术插图必须注明 Citation 来源。
                                    </li>
                                    <li>
                                        <strong>网络安全维护：</strong>严禁利用漏洞攻击系统、注入恶意脚本（包括含 XSS 攻击的 SVG 图片）、爬取敏感信息或干扰服务器正常运行。
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 4. 账号管理 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第四条：账号管理</CardTitle>
                                        <CardDescription>账号安全责任与身份管理</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-violet-500/10 border border-violet-500/20 font-semibold text-violet-800 dark:text-violet-300">
                                    “用户对自己的账号行为负责”
                                </div>
                                <p className="text-muted-foreground">
                                    4.1 用户应当妥善保管个人账号密码与绑定凭证。凡使用该账号登录后进行的一切操作（包括发帖、评论、修改资料、积分消费、决斗下注等），均视为用户本人行为，由此产生的全部法律后果均由该用户自行承担。
                                </p>
                                <p className="text-muted-foreground">
                                    4.2 严禁将账号转让、出借、租售给他人使用。如发现账号存在未经授权的异常登录，应立即通过平台重置密码或联系管理员。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 5. 终止权 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                                        <Gavel className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第五条：终止权与治理措施</CardTitle>
                                        <CardDescription>平台处置违规行为的法定权利</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 font-semibold text-red-800 dark:text-red-300">
                                    “本站有权删除违规内容或封禁账号”
                                </div>
                                <p className="text-muted-foreground">
                                    5.1 若用户违反法律法规、本用户协议或社区公约，<strong>本站有权在无需事先通知的情况下，独立判断并采取警告、隐藏内容、删除帖子/评论/图片、扣除积分、限制功能直至永久封禁账号等处置措施</strong>。
                                </p>
                                <p className="text-muted-foreground">
                                    5.2 对涉及严重违法或侵权的违规证据，平台将依法予以留存，并在司法机关依法调取时予以配合。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 6. 隐私政策 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                        <FileLock2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第六条：隐私政策</CardTitle>
                                        <CardDescription>信息收集范围与隐私保护承诺</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-semibold text-cyan-800 dark:text-cyan-300">
                                    “本站收集哪些信息、如何保护”
                                </div>
                                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                                    <p>
                                        <strong>1. 收集范围（最小必要原则）：</strong>
                                    </p>
                                    <ul className="list-disc list-inside pl-2 space-y-1">
                                        <li>账户基础信息：注册邮箱、学者用户名、头像及个人学术简介；</li>
                                        <li>学术认证信息：自主绑定的第三方学术平台标识（如洛谷 OJ ID 等）；</li>
                                        <li>操作与安全日志：登录时间、操作记录、防刷安全 IP 等（仅用于维护系统安全）。</li>
                                    </ul>
                                    <p className="mt-2">
                                        <strong>2. 如何保护：</strong>
                                    </p>
                                    <ul className="list-disc list-inside pl-2 space-y-1">
                                        <li>全站采用传输层 HTTPS 加密与数据库行级安全策略（RLS），防止未授权访问；</li>
                                        <li>绝不向任何第三方商业实体出售、出租或非法共享学者隐私数据；</li>
                                        <li>敏感密钥与系统配置均在隔离环境安全运行。</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 2: 🪙 积分服务条款（充值与虚拟权益条款） */}
                    {/* ========================================================================= */}
                    <TabsContent value="credits" className="space-y-6 focus-visible:outline-none">
                        {/* 协议性质与快速指引卡片 */}
                        <div className="rounded-3xl border-0 bg-amber-500/10 dark:bg-amber-500/5 p-6 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(245,158,11,0.08),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-lg text-foreground">
                                            《Scholarly 积分与充值服务使用条款》
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                            生效版本 v2026.1
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        欢迎使用 Scholarly 学者积分充值与数字化特权服务。请您在充值或使用积分前，完整仔细阅读本协议。<strong>当您点击充值、勾选同意、输入支付凭证或以任何方式确认支付，即视为您已充分知悉并无保留同意本协议全部条款约束。</strong>
                                    </p>
                                    <div className="pt-2 flex flex-wrap gap-2 text-xs">
                                        <span className="px-3 py-1 rounded-full bg-background/80 text-foreground/80 font-medium shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                                            ⚠️ 非法定货币·不可提现
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-background/80 text-foreground/80 font-medium shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                                            🛡️ 7天未消费退款机制
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-background/80 text-foreground/80 font-medium shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                                            ⏳ 365天有效期·先进先出
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-background/80 text-foreground/80 font-medium shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                                            🔬 AI 学术辅助参考免责
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 第一条：服务定义与主体 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第一条：服务定义与主体</CardTitle>
                                        <CardDescription>平台法律主体与服务凭证属性界定</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    1.1 <strong>服务主体：</strong>本协议由 Scholarly 学术论坛平台运营实体（以下简称“本平台”或“Scholarly”）与充值或使用积分服务的注册学者用户（以下简称“用户”或“您”）共同订立。
                                </p>
                                <p className="text-muted-foreground">
                                    1.2 <strong>学者积分（Scholarly Credits）：</strong>指用户通过法定货币在平台充值购买、或通过平台官方学术贡献奖励无偿获取的，<strong>仅限在 Scholarly 平台生态内兑换特定数字化学术计算、模型调用及增值特权服务的虚拟计量凭据</strong>。
                                </p>
                                <p className="text-muted-foreground">
                                    1.3 <strong>适用服务范围：</strong>积分可用于平台公示的数字化学术功能，包括但不限于 Ask AI 学术研讨、长文本论文深度解析、复杂公式/代码推理、学术竞技对决互动等专项增值算力服务。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第二条：积分法律性质与非货币属性（核心合规声明） */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <Scale className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第二条：积分法律性质与权利边界</CardTitle>
                                        <CardDescription>虚拟资产定性与反金融化、反炒作严正声明</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold text-xs sm:text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                    “Scholarly 积分属纯数字化虚拟服务凭据，绝非法定货币或金融投资品，不可转让、不可倒卖、严禁反向提现或兑换现金。”
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="p-4 rounded-2xl bg-muted/30 space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                                        <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                                            <Ban className="w-4 h-4 text-rose-500" />
                                            不可反向兑现与转让
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            积分任何情况下均<strong>不支持提现为人民币或其他法定货币</strong>，不支持在不同账号之间转赠、继承、质押或出借，亦不支持任何场外黑市交易。
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/30 space-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                                        <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                                            严禁场外倒卖与套现
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            任何未经平台许可的私下交易买卖积分行为均属严重违规。由此导致的一切账户被封禁、资金受骗等损失由违规用户完全自行承担。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 第三条：充值资费、计费标准与支付渠道 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第三条：充值资费与合规支付</CardTitle>
                                        <CardDescription>兑换汇率、阶梯套餐及合法资金渠道规则</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    3.1 <strong>基准换算比例：</strong>平台积分与人民币基准兑换比例为：<strong>1 元人民币（CNY）= 10 学者积分</strong>。平台可能推出阶梯套餐或限时优惠，实际价格以支付界面实时展示为准。
                                </p>
                                <p className="text-muted-foreground">
                                    3.2 <strong>赠送积分规则：</strong>各充值套餐中附赠的额外积分属于平台向学者的无偿鼓励权益，<strong>不具有现金对价</strong>。在消费时系统将按规则扣减，任何退款计算中赠送积分均不折算任何退款金额。
                                </p>
                                <p className="text-muted-foreground">
                                    3.3 <strong>支付方式合规：</strong>用户充值必须使用由平台接入的、具有合法资质的第三方支付渠道（如支付宝、微信支付等）。严禁使用非法资金、涉案银行卡或恶意透支信用卡进行充值。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第四条：数字化在线交付与消费扣费确认 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第四条：数字化即时交付与扣费确认</CardTitle>
                                        <CardDescription>充值即时到账履约与服务调用实时扣除</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    4.1 <strong>即时交付确认：</strong>用户完成款项支付后，第三方支付机构返回支付凭证，系统将即时向用户账户注入相应积分。<strong>积分到账即表明数字化虚拟商品已交付完毕且合同主项履约完成</strong>。
                                </p>
                                <p className="text-muted-foreground">
                                    4.2 <strong>服务实时扣费：</strong>当用户调用 Ask AI、长文本研读或使用算力服务时，系统依据该功能当时公布的费率即时扣减账户积分。扣减操作在系统响应发起时生效且不可逆撤销。
                                </p>
                                <p className="text-muted-foreground">
                                    4.3 <strong>透明账单流水：</strong>用户可随时前往「个人中心 - 积分与资产」查验每一笔充值、赠送及消费消耗的明细日志与余额变动。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第五条：退款政策与售后规则（支付风控核心条款） */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <RefreshCw className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第五条：退款政策与售后保障</CardTitle>
                                        <CardDescription>数字商品法定免退原则与 7 天未消费退款机制</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-900 dark:text-purple-200 font-semibold text-xs sm:text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                    “根据《消费者权益保护法》第二十五条数字化商品原则，积分购买后仅在 7 天内且完全未产生任何消费的情况下支持退款；一经消费不支持退款。”
                                </div>
                                <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                                    <div className="flex items-start gap-2 p-3 rounded-2xl bg-muted/20">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-foreground">7 天全额无消费退款支持：</strong>
                                            充值完成之日起 7 个自然日内，若该笔订单所获充值积分及赠送积分<strong>完全未被任何服务消耗使用</strong>，用户可联系平台客服申请退款。经系统核实验证后，平台扣除第三方支付通道收取的必要手续费（0.6%）后原路退回支付账户，处理周期为 3-5 个工作日。
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 rounded-2xl bg-muted/20">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-foreground">明确不予支持退款的情形：</strong>
                                            <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
                                                <li>自充值成功之日起已超过 7 个自然日；</li>
                                                <li>充值所获积分已经发生任何消耗或调用（哪怕仅消耗 1 积分，该笔订单亦丧失未消费退款资格）；</li>
                                                <li>免费获赠积分、系统活动奖励或社区学术成果贡献所获积分；</li>
                                                <li>因严重违反社区公约或法律法规被封禁处罚的账户。</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 p-3 rounded-2xl bg-muted/20">
                                        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <div>
                                            <strong className="text-foreground">异常交易申诉通道：</strong>
                                            如遇因网络故障导致的“已扣款未到账”或“重复扣款”，用户可向官方提供扣款凭证与订单号，经核实后平台将在 24 小时内完成补单或原路退还重复支付款项。
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 第六条：积分有效期与生命周期规则 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第六条：积分有效期与生命周期</CardTitle>
                                        <CardDescription>365 天有效期与先进先出自动扣减原则</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    6.1 <strong>有效期时限：</strong>充值获取的积分自充值成功之日起算，<strong>有效期为 365 个自然日（1 年）</strong>。逾期未使用的积分将自动清零失效，请您及时规划使用。
                                </p>
                                <p className="text-muted-foreground">
                                    6.2 <strong>先进先出（FIFO）原则：</strong>为最大化保障用户权益，系统在扣除积分时，自动遵循“先进先出”顺序，优先扣除最临近失效日期的积分批次。
                                </p>
                                <p className="text-muted-foreground">
                                    6.3 <strong>账号注销清算：</strong>若用户主动申请注销 Scholarly 账号，账号内尚未消耗完毕的剩余积分将在注销成功时一并清空作废，平台不予折现或退款。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第七条：使用规范与安全反洗钱风控 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第七条：使用规范与反作弊风控</CardTitle>
                                        <CardDescription>严禁洗钱、恶意套现与黑灰产攻击</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    7.1 <strong>禁止违规行为：</strong>用户在使用积分及充值服务时，严格禁止：
                                </p>
                                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground pl-1">
                                    <li>利用支付通道或系统 Bug 实施虚假支付、信用卡恶意套现、洗钱或金融诈骗；</li>
                                    <li>使用脚本、外挂、爬虫等非正常工具批量自动化刷取积分或并发恶意消耗算力服务；</li>
                                    <li>利用兑换的 AI 算力生成违法违规、侵犯国家安全、色情暴恐、侵犯知识产权或学术造假的内容。</li>
                                </ul>
                                <p className="text-muted-foreground">
                                    7.2 <strong>处置措施：</strong>一经发现上述行为，Scholarly 有权立即冻结交易、追回非法获取的全部积分、停用账号功能直至永久封禁，并不予退款，同时保留依法追究法律责任的权利。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第八条：未成年人特别保护 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第八条：未成年人特别保护条款</CardTitle>
                                        <CardDescription>监护人责任与理性消费指导</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    8.1 若您为未满 18 周岁的未成年人，请在法定监护人的指导、陪同下阅读本条款，且<strong>必须获得法定监护人的明确同意后方可进行充值支付操作</strong>。
                                </p>
                                <p className="text-muted-foreground">
                                    8.2 法定监护人应履行好监护职责，妥善保管支付账户密码。若监护人发现被监护人未经允许进行大额充值，请及时联系客服提供监护人证明材料，平台将在法律规定框架内予以妥善核查处理。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第九条：AI 成果参考性质与免责声明 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第九条：AI 成果参考性质与免责声明</CardTitle>
                                        <CardDescription>学术研讨参考定位与不可抗力免责</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    9.1 <strong>学术参考性说明：</strong>Scholarly 平台积分兑换的 AI 深度研读与计算分析成果均由人工智能模型计算生成，<strong>仅供学者进行科研探讨与灵感启发参考，不构成经过学术委员会同行评审的终局结论、亦不构成任何专业法律、医疗或商业建议</strong>。学者应当自行审慎验算与复核。
                                </p>
                                <p className="text-muted-foreground">
                                    9.2 <strong>不可抗力与运维：</strong>鉴于网络服务的特殊性，因电信运营商通信故障、大型 DDoS 恶意攻击、基础大模型上游接口临时熔断调整或支付通道系统升级等不可抗力导致的服务短暂波动，平台将积极组织维护抢修，并在合理范围内给予积分补偿，但不承担由此衍生的连带损失责任。
                                </p>
                            </CardContent>
                        </Card>

                        {/* 第十条：条款修订、通知与管辖法律 */}
                        <Card className="border-0 rounded-3xl bg-card/60 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.2)]">
                                        <Gavel className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">第十条：条款修订与法律管辖</CardTitle>
                                        <CardDescription>规则更新公示机制与争议裁决约定</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <p className="text-muted-foreground">
                                    10.1 <strong>条款修订：</strong>Scholarly 保留根据法律法规更新或平台运营实际需要调整积分资费与服务条款的权利。修改后的条款将在平台公示后生效。若用户在条款变更后继续充值或使用积分，即视为接受最新修订条款。
                                </p>
                                <p className="text-muted-foreground">
                                    10.2 <strong>争议解决：</strong>本条款的订立、执行与解释均适用中华人民共和国大陆地区法律。因本条款履行产生的任何争议，双方应首先友好协商；协商不成的，任何一方均可向平台运营方住所地有管辖权的人民法院提起诉讼。
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB 3: 📋 社区公约（行为准则） */}
                    {/* ========================================================================= */}
                    <TabsContent value="guidelines" className="space-y-6 focus-visible:outline-none">
                        {/* 社区愿景卡片 */}
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3.5">
                            <Handshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-emerald-800 dark:text-emerald-300">社区公约宣言</p>
                                <p className="text-muted-foreground mt-0.5">
                                    社区公约是我们共同守护的学术精神与文明家园准则。无论您的学术资历深浅，在这里我们以理服人、平等探讨、共同探索知识边界。
                                </p>
                            </div>
                        </div>

                        {/* 1. 价值观 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                                        <HeartHandshake className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">一、核心价值观</CardTitle>
                                        <CardDescription>Scholarly 倡导的学术文化与研讨风尚</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-pink-500/10 border border-pink-500/20 font-semibold text-pink-800 dark:text-pink-300">
                                    “理性讨论、尊重他人、拒绝人身攻击”
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-center">
                                        <span className="font-semibold text-foreground block mb-1">🔍 理性求真</span>
                                        <span className="text-xs text-muted-foreground">以事实为依据，以逻辑与数据论证学术观点</span>
                                    </div>
                                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-center">
                                        <span className="font-semibold text-foreground block mb-1">🤝 尊重包容</span>
                                        <span className="text-xs text-muted-foreground">尊重学术异见与跨学科视角，虚心听取批评</span>
                                    </div>
                                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-center">
                                        <span className="font-semibold text-foreground block mb-1">🛡️ 杜绝霸凌</span>
                                        <span className="text-xs text-muted-foreground">严厉抵制针对个人的贬损、辱骂与学术霸凌</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. 允许什么 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">二、鼓励与倡导（允许什么）</CardTitle>
                                        <CardDescription>我们全力支持的优质学术行为</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-semibold text-emerald-800 dark:text-emerald-300">
                                    “鼓励发布原创观点、学术问题、经验分享”
                                </div>
                                <ul className="grid gap-2.5 text-xs sm:text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <span><strong>原创学术见解：</strong>前沿论文研读笔记、算法设计构想、实验设计与数据复现心得。</span>
                                    </li>
                                    <li className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                                        <FileCode className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span><strong>高质量学术问答：</strong>遇到学术瓶颈或代码 Bug 时，提供详实的最小复现代码与数学推导过程提问。</span>
                                    </li>
                                    <li className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
                                        <BookOpen className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                        <span><strong>科研避坑与经验：</strong>学术工具链使用教程、LaTeX 排版经验、论文投稿与同行评议经验交流。</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* 3. 禁止什么 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                        <Ban className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">三、严格禁止行为（禁止什么）</CardTitle>
                                        <CardDescription>社区坚决零容忍的红线行为</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 font-semibold text-destructive">
                                    “严禁政治敏感、色情、暴力、广告、版权侵权内容”
                                </div>
                                <div className="grid gap-2.5 sm:grid-cols-2 text-xs sm:text-sm">
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 违法与敏感信息</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁发布涉政敏感、危害国家安全、破坏社会稳定、暴恐极端或淫秽色情内容。
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 广告营销与灌水</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁发布商业广告、灰色推广引流链接、利用机器人或自动化脚本批量灌水刷屏。
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 版权侵权与抄袭</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁抄袭剽窃他人成果、未经授权盗用他人图片或受保护的学术图表。
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                                        <strong className="text-foreground block">🚫 作弊与恶意刷分</strong>
                                        <p className="text-muted-foreground text-xs">
                                            严禁利用平台技术漏洞或小号刷取信誉积分、恶意操纵决斗胜负等作弊行为。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. 惩罚机制 */}
                        <Card className="border-border/70 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <AlertOctagon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">四、惩罚机制（阶梯处罚）</CardTitle>
                                        <CardDescription>透明、公正的治理执行标准</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-semibold text-amber-800 dark:text-amber-300">
                                    “第一次警告、第二次删帖、第三次封号”
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                                    <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                                        <Badge variant="outline" className="text-amber-600 border-amber-500/40">
                                            Step 1
                                        </Badge>
                                        <h4 className="font-semibold text-foreground">第一次违规：警告</h4>
                                        <p className="text-xs text-muted-foreground">
                                            发送站内信正式警告，提示具体违规条款，扣除违规所获积分并要求在限定时间内整改。
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-1.5">
                                        <Badge variant="outline" className="text-orange-600 border-orange-500/40">
                                            Step 2
                                        </Badge>
                                        <h4 className="font-semibold text-foreground">第二次违规：删帖/禁言</h4>
                                        <p className="text-xs text-muted-foreground">
                                            管理员直接下架并删除违规文章、评论或图片，并对账号实施 24~72 小时禁言或发帖功能限制。
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/5 space-y-1.5">
                                        <Badge variant="outline" className="text-red-600 border-red-500/40">
                                            Step 3
                                        </Badge>
                                        <h4 className="font-semibold text-destructive">第三次违规：封号</h4>
                                        <p className="text-xs text-muted-foreground">
                                            情节严重或屡教不改者，平台将永久封禁账号，终止一切服务，IP 计入限制名单。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Separator className="my-10" />

                {/* 底部声明 */}
                <div className="text-center text-xs text-muted-foreground space-y-2">
                    <p>感谢您与我们共同守护 Scholarly 学术社区的纯净、开放与严谨。</p>
                    <p>© {new Date().getFullYear()} Scholarly. 让知识自由流动，让思想深刻碰撞。</p>
                </div>
            </div>
        </div>
    );
}
