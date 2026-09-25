"use client";

import { ChatList } from "@/components/chat/ChatList";
import { MessageSoundToggle } from "@/components/chat/MessageSoundToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriends } from "@/hooks/useFriends";
import { useMessages } from "@/hooks/useMessages";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare, Search, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const ChatWindow = dynamic(
    () => import("@/components/chat/ChatWindow").then((mod) => mod.ChatWindow),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 dark:text-zinc-500">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">加载对话中...</p>
            </div>
        ),
    }
);

function MessagesLoading() {
    return (
        <div className="flex items-center justify-center h-[100dvh] bg-background">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
    );
}

function MessagesContent() {
    const searchParams = useSearchParams();
    const initialPartnerId = searchParams.get("user");

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{
        username: string | null;
        avatar_url: string | null;
    } | null>(null);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
        initialPartnerId
    );

    // 监听聊天会话激活状态，在移动端自动通知全局底栏退避，让出输入框
    useEffect(() => {
        if (selectedPartnerId) {
            window.dispatchEvent(new CustomEvent("chat-active-change", { detail: { active: true } }));
        } else {
            window.dispatchEvent(new CustomEvent("chat-active-change", { detail: { active: false } }));
        }
        return () => {
            window.dispatchEvent(new CustomEvent("chat-active-change", { detail: { active: false } }));
        };
    }, [selectedPartnerId]);
    const [selectedPartner, setSelectedPartner] = useState<{
        name: string;
        email: string;
        avatar: string | null;
    } | null>(null);
    const [partnerLoading, setPartnerLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const supabase = createClient();

    // 获取当前用户
    useEffect(() => {
        let isMounted = true;
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && isMounted) {
                    setCurrentUserId(user.id);

                    // 获取用户 profile
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username, avatar_url")
                        .eq("id", user.id)
                        .single();

                    if (isMounted) {
                        setCurrentUser(profile || null);
                    }
                }
            } catch (err) {
                console.error("获取当前用户信息失败:", err);
            }
        };
        getUser();

        return () => {
            isMounted = false;
        };
    }, [supabase]);

    const { conversations, conversationsLoading } = useMessages(currentUserId);
    const { friends } = useFriends(currentUserId);

    // 选择对话时获取对方信息
    useEffect(() => {
        let isMounted = true;
        if (selectedPartnerId && currentUserId) {
            const fetchPartnerInfo = async () => {
                setPartnerLoading(true);
                try {
                    const { data, error } = await supabase
                        .from("profiles")
                        .select("username, email, avatar_url")
                        .eq("id", selectedPartnerId)
                        .single();

                    if (isMounted) {
                        if (data && !error) {
                            const displayName =
                                data.username ||
                                (data.email ? data.email.split("@")[0] : "") ||
                                "用户";
                            setSelectedPartner({
                                name: displayName,
                                email: data.email || "",
                                avatar: data.avatar_url || null,
                            });
                        } else {
                            // 如果在 profiles 未查到，尝试从好友或已有对话中提取
                            const friendObj = friends.find(f => f.friend.id === selectedPartnerId);
                            const convObj = conversations.find(c => c.partnerId === selectedPartnerId);
                            const fallbackName = friendObj?.friend.username ||
                                (friendObj?.friend.email ? friendObj.friend.email.split("@")[0] : null) ||
                                convObj?.partnerUsername ||
                                (convObj?.partnerEmail ? convObj.partnerEmail.split("@")[0] : null) ||
                                "用户";

                            setSelectedPartner({
                                name: fallbackName,
                                email: friendObj?.friend.email || convObj?.partnerEmail || "",
                                avatar: friendObj?.friend.avatar_url || convObj?.partnerAvatarUrl || null,
                            });
                        }
                    }
                } catch (err) {
                    console.error("获取对话对方信息失败:", err);
                    if (isMounted) {
                        setSelectedPartner({
                            name: "用户",
                            email: "",
                            avatar: null,
                        });
                    }
                } finally {
                    if (isMounted) {
                        setPartnerLoading(false);
                    }
                }
            };
            fetchPartnerInfo();
        } else {
            setSelectedPartner(null);
        }

        return () => {
            isMounted = false;
        };
    }, [selectedPartnerId, currentUserId, supabase, friends, conversations]);

    // 过滤对话
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;
        const name = conv.partnerUsername || conv.partnerEmail || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!currentUserId) {
        return <MessagesLoading />;
    }

    return (
        <div className="flex h-[100dvh] bg-background/95 relative overflow-hidden">
            {/* 左侧对话列表 */}
            <div
                className={cn(
                    "w-full md:w-80 lg:w-[320px] xl:w-[360px] border-0 flex flex-col bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shrink-0 relative z-10",
                    selectedPartnerId && "hidden md:flex"
                )}
            >
                {/* 右侧垂直消融微光缝 */}
                <div className="hidden md:block absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent pointer-events-none" />

                {/* 头部 */}
                <div className="p-3.5 relative">
                    <div className="flex items-center justify-between mb-2.5">
                        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            私信
                        </h1>
                        <MessageSoundToggle />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <Input
                            placeholder="搜索对话..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-xs border-0 bg-zinc-100/80 dark:bg-zinc-900/70 backdrop-blur-md rounded-full shadow-[inset_0_1px_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.4),0_1px_0.5px_rgba(255,255,255,0.06)] focus-visible:ring-1 focus-visible:ring-zinc-400/50 transition-all placeholder:text-zinc-400"
                        />
                    </div>
                    {/* 头部底部消融光缝 */}
                    <div className="absolute bottom-0 left-3.5 right-3.5 h-[1px] bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent" />
                </div>

                {/* 好友快捷栏 - 横向轻量展示 */}
                {friends.length > 0 && (
                    <div className="px-3.5 py-2 relative bg-zinc-50/40 dark:bg-zinc-900/20 backdrop-blur-md">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 mb-1.5">
                            <Users className="h-3 w-3" />
                            <span>好友 ({friends.length})</span>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {friends.map((f) => {
                                const isSelected = selectedPartnerId === f.friend.id;
                                return (
                                    <button
                                        key={f.friendshipId}
                                        onClick={() => setSelectedPartnerId(f.friend.id)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all active:scale-[0.97]",
                                            isSelected
                                                ? "bg-zinc-950/90 text-white dark:bg-white dark:text-zinc-950 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25),inset_0_1px_0.5px_rgba(255,255,255,0.35)] dark:shadow-[0_4px_12px_-2px_rgba(255,255,255,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.9)]"
                                                : "border-0 bg-white/75 dark:bg-zinc-850/60 text-zinc-700 dark:text-zinc-300 hover:bg-white/95 dark:hover:bg-zinc-800/80 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1),0_2px_8px_-2px_rgba(0,0,0,0.3)]"
                                        )}
                                    >
                                        {f.friend.username || (f.friend.email ? f.friend.email.split("@")[0] : "好友")}
                                    </button>
                                );
                            })}
                        </div>
                        {/* 好友栏底部消融光缝 */}
                        <div className="absolute bottom-0 left-3.5 right-3.5 h-[1px] bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-zinc-800/60 to-transparent" />
                    </div>
                )}

                {/* 对话列表 */}
                <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    {conversationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        <ChatList
                            conversations={filteredConversations}
                            selectedPartnerId={selectedPartnerId || undefined}
                            onSelectConversation={setSelectedPartnerId}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 p-8">
                            <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-xs text-center font-medium">暂无对话</p>
                            <p className="text-[11px] text-center mt-0.5 text-zinc-400/80">
                                点击上方好友开始聊天
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧聊天窗口 */}
            <div
                className={cn(
                    "flex-1 min-w-0 flex flex-col h-full bg-background/50 relative",
                    !selectedPartnerId && "hidden md:flex md:items-center md:justify-center"
                )}
            >
                {selectedPartnerId ? (
                    partnerLoading && !selectedPartner ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                        </div>
                    ) : selectedPartner ? (
                        <ChatWindow
                            currentUserId={currentUserId}
                            partnerId={selectedPartnerId}
                            partnerName={selectedPartner.name}
                            partnerEmail={selectedPartner.email}
                            partnerAvatar={selectedPartner.avatar}
                            currentUserName={currentUser?.username || undefined}
                            currentUserAvatar={currentUser?.avatar_url}
                            onBack={() => setSelectedPartnerId(null)}
                            className="h-full"
                        />
                    ) : (
                        <div className="text-center text-zinc-400 dark:text-zinc-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-base font-medium">未能加载该对话</p>
                            <p className="text-xs mt-1">请尝试重新选择对话或好友</p>
                        </div>
                    )
                ) : (
                    <div className="text-center text-zinc-400 dark:text-zinc-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium text-zinc-600 dark:text-zinc-300">选择一个对话</p>
                        <p className="text-xs mt-1 text-zinc-400">从左侧列表选择或搜索好友开始聊天</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<MessagesLoading />}>
            <MessagesContent />
        </Suspense>
    );
}
