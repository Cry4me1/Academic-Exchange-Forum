"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MathText } from "@/components/ui/math-text";
import {
    Search,
    Send,
    Paperclip,
    Clock,
    FileCode,
    Lock,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TutorialTaskChecklist, type TaskItem } from "@/components/tutorials/TutorialTaskChecklist";

interface Step4MessagesTourProps {
    onPrev: () => void;
    onNext: () => void;
    completedTaskIds: string[];
    onCompleteTask: (taskId: string) => void;
    onCompleteAllTasks: (taskIds: string[]) => void;
}

interface MessageItem {
    id: string;
    sender: "other" | "me";
    text: string;
    hasFile?: boolean;
    fileName?: string;
    fileSize?: string;
    ttlLabel?: string;
    createdAt: string;
}

interface ContactMeta {
    id: string;
    name: string;
    title: string;
    avatar: string;
    isOnline: boolean;
    time: string;
    autoReply: string;
}

const CONTACTS: ContactMeta[] = [
    {
        id: "c1",
        name: "李院士",
        title: "拓扑量子物理学者",
        avatar: "李",
        isOnline: true,
        time: "14:32",
        autoReply:
            "收到！建议重点核对 $\\Delta_0 / k_B T > 12$ 温区下的准粒子弛豫曲线，文字讨论我们会长期留存备查。",
    },
    {
        id: "c2",
        name: "张教授",
        title: "分布式共识系统研究员",
        avatar: "张",
        isOnline: true,
        time: "昨天",
        autoReply:
            "很棒的思路！在广域网异步抖动下将视图切换复杂度压到 $O(n)$ 极具工程价值，我们可以合写一篇快报。",
    },
    {
        id: "c3",
        name: "王研究员",
        title: "AI 多模态审校组",
        avatar: "王",
        isOnline: false,
        time: "周三",
        autoReply:
            "感谢反馈！补充附录数据后即可在帖子详情页一键重新召唤 Reviewer #2 更新评审报告。",
    },
];

const INITIAL_CONVERSATIONS: Record<string, MessageItem[]> = {
    c1: [
        {
            id: "c1-m1",
            sender: "other",
            text: "您好！附录中的拓扑超导相变原始仿真数据已打包发送。为节约冷存储并保护未发表原始数据隐私，大体积附件将在 7 天后自动物理销毁，请及时转存：",
            hasFile: true,
            fileName: "majorana_braiding_raw_sim.h5",
            fileSize: "18.4 MB",
            ttlLabel: "剩余 6 天 22 小时清理",
            createdAt: "14:30",
        },
        {
            id: "c1-m2",
            sender: "me",
            text: "收到，十分感谢李院士！我正在用站内的 Nature 双栏阅读器核对塞曼分裂能阈值 $V_Z > \\sqrt{\\Delta_0^2 + \\mu^2}$。",
            createdAt: "14:32",
        },
    ],
    c2: [
        {
            id: "c2-m1",
            sender: "other",
            text: "关于跨地域 Raft 与 HotStuff 协议在广域网下的尾延迟对比，我整理了节点规模 $N \\in [4, 64]$ 的压测日志供参考：",
            hasFile: true,
            fileName: "geo_consensus_latency_bench.parquet",
            fileSize: "9.2 MB",
            ttlLabel: "剩余 4 天 11 小时清理",
            createdAt: "昨天 19:15",
        },
    ],
    c3: [
        {
            id: "c3-m1",
            sender: "other",
            text: "您好，您提交的《高容错非阿贝尔逻辑门》初稿已通过合规校验，公式推导完整度评分 9.8 / 10。",
            createdAt: "周三 10:08",
        },
    ],
};

export function Step4MessagesTour({
    onPrev,
    onNext,
    completedTaskIds,
    onCompleteTask,
    onCompleteAllTasks,
}: Step4MessagesTourProps) {
    const [selectedContactId, setSelectedContactId] = useState("c1");
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadMap, setUnreadMap] = useState<Record<string, number>>({
        c1: 0,
        c2: 1,
        c3: 1,
    });
    const [conversations, setConversations] =
        useState<Record<string, MessageItem[]>>(INITIAL_CONVERSATIONS);
    const [inputText, setInputText] = useState("");
    const [typingContactId, setTypingContactId] = useState<string | null>(null);
    const [showRetentionDetail, setShowRetentionDetail] = useState(false);

    const taskDefs = useMemo<TaskItem[]>(
        () => [
            {
                id: "switch-chat",
                title: "1. 切换不同领域的同行学者会话",
                description: "点击左侧联系人列表中的‘张教授’或‘王研究员’，切换各自独立的学术研讨上下文。",
                isCompleted: completedTaskIds.includes("switch-chat"),
            },
            {
                id: "send-message",
                title: "2. 发送研讨消息或模拟上传实验数据包",
                description: "在右侧输入框发送文字（支持 $公式$）或点击回形针胶囊发送模拟实验附件。",
                isCompleted: completedTaskIds.includes("send-message"),
            },
            {
                id: "inspect-7day-file",
                title: "3. 透视‘文字永久留存 + 附件 7 天自动销毁’架构",
                description: "点击聊天流中的任意附件卡片，查看 Scholarly 双轨数据生命周期与隐私保护机制。",
                isCompleted: completedTaskIds.includes("inspect-7day-file"),
            },
        ],
        [completedTaskIds]
    );

    const filteredContacts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return CONTACTS;
        return CONTACTS.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const currentContact =
        CONTACTS.find((c) => c.id === selectedContactId) || CONTACTS[0];
    const currentMessages = conversations[currentContact.id] || [];

    const handleSelectContact = (id: string) => {
        setSelectedContactId(id);
        setUnreadMap((prev) => ({ ...prev, [id]: 0 }));
        if (id !== "c1") {
            onCompleteTask("switch-chat");
        }
    };

    const triggerSimulatedReply = (contact: ContactMeta) => {
        setTypingContactId(contact.id);
        setTimeout(() => {
            setConversations((prev) => {
                const list = prev[contact.id] || [];
                // 避免重复刷屏回复，最多自动回复一次或按需追加
                return {
                    ...prev,
                    [contact.id]: [
                        ...list,
                        {
                            id: `reply-${Date.now()}`,
                            sender: "other",
                            text: contact.autoReply,
                            createdAt: "刚刚",
                        },
                    ],
                };
            });
            setTypingContactId(null);
        }, 850);
    };

    const handleSendMessage = () => {
        const trimmed = inputText.trim();
        if (!trimmed) {
            toast.error("请输入学术研讨内容后再发送");
            return;
        }

        const newMsg: MessageItem = {
            id: `msg-${Date.now()}`,
            sender: "me",
            text: trimmed,
            createdAt: "刚刚",
        };

        setConversations((prev) => ({
            ...prev,
            [currentContact.id]: [...(prev[currentContact.id] || []), newMsg],
        }));
        setInputText("");
        onCompleteTask("send-message");
        toast.success("文字与公式消息已端到端加密并永久留存");
        triggerSimulatedReply(currentContact);
    };

    const handleSimulateSendAttachment = () => {
        const attachmentMsg: MessageItem = {
            id: `file-${Date.now()}`,
            sender: "me",
            text: "我刚导出了最新一轮蒙特卡洛误差收敛曲线原始矩阵，请查收：",
            hasFile: true,
            fileName: "qec_threshold_sweep_v2.npz",
            fileSize: "12.6 MB",
            ttlLabel: "剩余 6 天 23 小时清理",
            createdAt: "刚刚",
        };

        setConversations((prev) => ({
            ...prev,
            [currentContact.id]: [...(prev[currentContact.id] || []), attachmentMsg],
        }));
        onCompleteTask("send-message");
        onCompleteTask("inspect-7day-file");
        setShowRetentionDetail(true);
        toast.success("模拟实验附件已发送，已自动挂载 7 天到期销毁计时器");
    };

    const handleInspectAttachment = () => {
        setShowRetentionDetail(true);
        onCompleteTask("inspect-7day-file");
        toast.success("已点亮 7 天附件自动清理机制实操任务");
    };

    return (
        <div className="space-y-6">
            {/* 顶栏实操任务清单卡片 */}
            <TutorialTaskChecklist
                tasks={taskDefs}
                onTaskClick={(id) => {
                    onCompleteTask(id);
                    if (id === "inspect-7day-file") setShowRetentionDetail(true);
                    toast.success("已标记该项私信实操完成");
                }}
                onMarkAllDone={() =>
                    onCompleteAllTasks(["switch-chat", "send-message", "inspect-7day-file"])
                }
                stepTitle="Step 4 · 实时学术私信与 7 天附件自动清理机制"
                stepBadge="3 项实操体验"
                hintText="左侧切换不同学者查看独立会话流，支持输入 LaTeX 公式对话，或点击回形针胶囊测试 7 天时效附件。"
            />

            {/* 双轨数据存储透视提示卡（点击附件或发送附件后优雅展示） */}
            {showRetentionDetail && (
                <div className="rounded-3xl border-0 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1] backdrop-blur-xl px-5 py-3.5 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="text-xs leading-relaxed">
                            <p className="font-medium text-emerald-900 dark:text-emerald-200">
                                Scholarly 双轨数据时效架构已激活
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-300">
                                1. <strong>学术文字与公式永久加密留存</strong>，随时检索回溯推导脉络；2. <strong>临时大体积实验附件 7 天到期物理清理</strong>，杜绝未公开原始数据长期泄露风险。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 1:1 无边框液态玻璃双栏私聊舱 */}
            <div className="rounded-3xl border-0 bg-white/75 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.42),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden">
                <div className="flex flex-col md:flex-row md:h-[520px]">
                    {/* 左侧会话列表 (宽 32%) */}
                    <div className="md:w-[33%] flex flex-col bg-zinc-900/[0.02] dark:bg-white/[0.02]">
                        {/* 搜索药丸栏 */}
                        <div className="p-3.5">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索同行学者或研究方向..."
                                    className="h-8 pl-9 rounded-full border-0 text-xs bg-white/85 dark:bg-zinc-900/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                                />
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                        {/* 联系人列表（锁定 font-medium 零布局跳动） */}
                        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                            {filteredContacts.map((contact) => {
                                const isSelected = selectedContactId === contact.id;
                                const contactMsgs = conversations[contact.id] || [];
                                const lastMsg = contactMsgs[contactMsgs.length - 1];
                                const unread = unreadMap[contact.id] || 0;

                                return (
                                    <button
                                        key={contact.id}
                                        type="button"
                                        onClick={() => handleSelectContact(contact.id)}
                                        className={cn(
                                            "w-full flex items-start gap-3 p-3 rounded-2xl border-0 text-left font-medium transition-[transform,background-color,box-shadow] duration-150 cursor-pointer active:scale-[0.985]",
                                            isSelected
                                                ? "bg-white/95 dark:bg-zinc-800/90 shadow-[0_4px_18px_-2px_rgba(14,165,233,0.14),inset_0_1px_0.5px_rgba(255,255,255,0.95)]"
                                                : "hover:bg-white/60 dark:hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-10 w-10 border-0 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                                                <AvatarFallback className="bg-sky-500/15 text-sky-700 dark:text-sky-300 font-medium text-xs">
                                                    {contact.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={cn(
                                                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900",
                                                    contact.isOnline ? "bg-emerald-500" : "bg-zinc-400"
                                                )}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <h4 className="text-xs font-medium truncate text-zinc-900 dark:text-zinc-100">
                                                    {contact.name}
                                                </h4>
                                                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                                    {contact.time}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-normal">
                                                {lastMsg ? lastMsg.text : contact.title}
                                            </p>
                                        </div>

                                        {/* 恒定槽位未读指示 */}
                                        <div className="w-4 flex justify-end shrink-0 mt-1">
                                            {unread > 0 && (
                                                <span className="h-4 w-4 rounded-full bg-sky-500 text-white text-[10px] font-mono tabular-nums flex items-center justify-center">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 垂直渐变消融内部光缝 */}
                    <div className="hidden md:block w-[1px] self-stretch bg-gradient-to-b from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                    {/* 右侧实时聊天窗口 */}
                    <div className="flex-1 flex flex-col min-h-[420px]">
                        {/* 窗口顶栏 */}
                        <div className="px-5 py-3.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-9 w-9 border-0 shrink-0">
                                    <AvatarFallback className="bg-sky-500/15 text-sky-700 dark:text-sky-300 font-medium text-xs">
                                        {currentContact.avatar}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {currentContact.name}
                                        </h4>
                                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full border-0 bg-zinc-900/[0.045] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300">
                                            {currentContact.title}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        {currentContact.isOnline ? "● 学术在线 · 支持公式直渲" : "○ 离线留言模式"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full border-0 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300 text-[10px] font-medium">
                                    <Lock className="h-3 w-3" />
                                    <span>文字永久加密</span>
                                </span>
                                <Link href="/messages" prefetch={false}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] gap-1 active:scale-[0.97] cursor-pointer"
                                    >
                                        <span>真实验讨室</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                        {/* 消息气泡流 */}
                        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-zinc-100/45 dark:bg-zinc-950/35">
                            {currentMessages.map((msg) => {
                                const isMe = msg.sender === "me";
                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex flex-col gap-1",
                                            isMe ? "items-end" : "items-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-md p-3.5 rounded-2xl border-0 text-xs leading-relaxed space-y-2.5",
                                                isMe
                                                    ? "bg-zinc-950/90 text-white dark:bg-white/92 dark:text-zinc-950 shadow-[0_4px_16px_rgba(0,0,0,0.14),inset_0_1px_0.5px_rgba(255,255,255,0.3)]"
                                                    : "bg-white/90 dark:bg-zinc-800/85 text-zinc-800 dark:text-zinc-100 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0.5px_rgba(255,255,255,0.9)]"
                                            )}
                                        >
                                            <MathText text={msg.text} inlineOnly />

                                            {msg.hasFile && (
                                                <button
                                                    type="button"
                                                    onClick={handleInspectAttachment}
                                                    className={cn(
                                                        "w-full text-left p-2.5 rounded-2xl border-0 flex items-center justify-between gap-3 transition-[transform,background-color] duration-150 active:scale-[0.985] cursor-pointer",
                                                        isMe
                                                            ? "bg-white/12 hover:bg-white/18 text-white dark:bg-zinc-900/10 dark:hover:bg-zinc-900/15 dark:text-zinc-900"
                                                            : "bg-zinc-100/90 hover:bg-amber-500/[0.09] dark:bg-zinc-900/75 dark:hover:bg-amber-500/[0.12] text-zinc-900 dark:text-zinc-100"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileCode className="h-4 w-4 text-sky-500 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-mono text-[11px] font-medium truncate">
                                                                {msg.fileName}
                                                            </p>
                                                            <span className="text-[10px] opacity-70">
                                                                {msg.fileSize} · 点击查看清理策略
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-0 bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-medium shrink-0">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{msg.ttlLabel}</span>
                                                    </span>
                                                </button>
                                            )}
                                        </div>

                                        <span className="text-[10px] font-mono text-zinc-400 px-1">
                                            {msg.createdAt}
                                        </span>
                                    </div>
                                );
                            })}

                            {typingContactId === currentContact.id && (
                                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-0 bg-white/80 dark:bg-zinc-800/80 text-[11px] text-zinc-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-ping" />
                                    <span>{currentContact.name} 正在输入学术回复...</span>
                                </div>
                            )}
                        </div>

                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />

                        {/* 底部输入控制坞 */}
                        <div className="p-3.5 flex flex-wrap sm:flex-nowrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSimulateSendAttachment}
                                title="模拟发送一个带 7 天自动清理倒计时的实验数据包"
                                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border-0 text-xs font-medium bg-amber-500/[0.12] hover:bg-amber-500/[0.18] text-amber-800 dark:text-amber-300 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] transition-[transform,background-color] duration-150 active:scale-[0.97] shrink-0 cursor-pointer"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                                <span>发实验附件</span>
                            </button>

                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSendMessage();
                                }}
                                placeholder="输入研讨消息（如：已验证 $\tau > 100\mu s$），按 Enter 发送..."
                                className="flex-1 h-9 px-4 rounded-full border-0 text-xs bg-white/85 dark:bg-zinc-900/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                            />

                            <Button
                                size="sm"
                                onClick={handleSendMessage}
                                className="h-9 px-4 rounded-full border-0 text-xs font-medium gap-1.5 bg-zinc-950/90 hover:bg-zinc-900 text-white dark:bg-white/92 dark:text-zinc-950 shrink-0 active:scale-[0.97] cursor-pointer"
                            >
                                <Send className="h-3.5 w-3.5" />
                                <span>发送</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部导航操作条 */}
            <div className="flex items-center justify-between pt-1">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPrev}
                    className="h-11 px-5 rounded-full border-0 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08] dark:bg-white/[0.05] gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>上一步：学术决斗场</span>
                </Button>

                <Button
                    size="lg"
                    onClick={onNext}
                    className="h-11 px-6 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/90 hover:bg-zinc-900 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/92 dark:hover:bg-white dark:text-zinc-950 gap-2 active:scale-[0.97] cursor-pointer"
                >
                    <span>下一步：积分流转与学者特权</span>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
