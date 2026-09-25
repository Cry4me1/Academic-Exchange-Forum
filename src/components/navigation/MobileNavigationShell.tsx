"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MobileTabBar } from "@/components/dashboard/MobileTabBar";
import { MobileGlassDrawer } from "./MobileGlassDrawer";

interface MobileNavigationShellProps {
    currentUserId: string;
}

export function MobileNavigationShell({ currentUserId }: MobileNavigationShellProps) {
    const pathname = usePathname();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isInChat, setIsInChat] = useState(false);

    const handleToggleDrawer = useCallback(() => {
        setIsDrawerOpen((prev) => !prev);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    // 监听移动端聊天激活状态（解决聊天窗口输入框被全局底栏遮挡的问题）
    useEffect(() => {
        const handleChatState = (e: Event) => {
            const customEvent = e as CustomEvent<{ active: boolean }>;
            setIsInChat(Boolean(customEvent?.detail?.active));
        };

        window.addEventListener("chat-active-change", handleChatState);

        // 如果路由切换离开私信页面，自动复位聊天状态
        if (!pathname.startsWith("/messages")) {
            setIsInChat(false);
        }

        return () => {
            window.removeEventListener("chat-active-change", handleChatState);
        };
    }, [pathname]);

    // 智能隐藏规则：
    // 1. 文章详情阅读页（包含独立的移动端阅读底栏）
    // 2. 发帖或编辑页（全屏沉浸创作画布，防输入法弹起顶高）
    // 3. 正在私信对话中（让输入法和聊天输入框独占底部，不被遮挡）
    // 4. 打印模式与欢迎签约页
    const isPostDetail = pathname.startsWith("/posts/") && !pathname.endsWith("/history") && !pathname.includes("/edit");
    const isEditing = pathname === "/posts/new" || pathname.includes("/edit");
    const isWelcome = pathname.startsWith("/welcome");
    const isPrint = pathname.includes("/print");

    const shouldHideTabBar = isPostDetail || isEditing || isWelcome || isPrint || isInChat;

    return (
        <>
            {!shouldHideTabBar && (
                <MobileTabBar
                    currentUserId={currentUserId}
                    isDrawerOpen={isDrawerOpen}
                    onOpenDrawer={handleToggleDrawer}
                    onToggleDrawer={handleToggleDrawer}
                />
            )}
            <MobileGlassDrawer
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                currentUserId={currentUserId}
            />
        </>
    );
}

