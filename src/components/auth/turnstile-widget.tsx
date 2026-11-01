"use client";

import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { preconnect } from "react-dom";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-api-script";
const TURNSTILE_SCRIPT_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onScholarlyTurnstileLoad";

// Cloudflare 官方可见通过测试 Sitekey（仅在非生产环境且未配置环境变量时启用）
const TURNSTILE_DUMMY_SITE_KEY = "1x00000000000000000000AA";

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "flexible" | "compact";

interface TurnstileRenderOptions {
    sitekey: string;
    action?: string;
    theme?: TurnstileTheme;
    size?: TurnstileSize;
    language?: string;
    retry?: "auto" | "never";
    "refresh-expired"?: "auto" | "manual" | "never";
    callback?: (token: string) => void;
    "expired-callback"?: () => void;
    "timeout-callback"?: () => void;
    "error-callback"?: (errorCode?: string) => boolean | void;
}

interface TurnstileApi {
    render: (
        container: HTMLElement | string,
        options: TurnstileRenderOptions
    ) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId?: string) => void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
        __onScholarlyTurnstileLoad?: () => void;
    }
}

let scriptLoadPromise: Promise<TurnstileApi> | null = null;

function loadTurnstileScript(forceReload = false): Promise<TurnstileApi> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Turnstile 仅支持浏览器环境加载"));
    }

    if (!forceReload && window.turnstile) {
        return Promise.resolve(window.turnstile);
    }

    if (forceReload) {
        scriptLoadPromise = null;
        const staleScript = document.getElementById(TURNSTILE_SCRIPT_ID);
        if (staleScript) {
            staleScript.remove();
        }
    }

    if (scriptLoadPromise) {
        return scriptLoadPromise;
    }

    scriptLoadPromise = new Promise<TurnstileApi>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            scriptLoadPromise = null;
            reject(new Error("安全验证组件加载超时，请检查网络连接"));
        }, 12000);

        window.__onScholarlyTurnstileLoad = () => {
            window.clearTimeout(timeoutId);
            if (window.turnstile) {
                resolve(window.turnstile);
            } else {
                scriptLoadPromise = null;
                reject(new Error("安全验证实例初始化失败"));
            }
        };

        const existingScript = document.getElementById(
            TURNSTILE_SCRIPT_ID
        ) as HTMLScriptElement | null;

        if (existingScript) {
            if (window.turnstile) {
                window.clearTimeout(timeoutId);
                resolve(window.turnstile);
                return;
            }
            existingScript.addEventListener(
                "error",
                () => {
                    window.clearTimeout(timeoutId);
                    scriptLoadPromise = null;
                    reject(new Error("无法连接 Cloudflare 安全验证节点"));
                },
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            window.clearTimeout(timeoutId);
            scriptLoadPromise = null;
            script.remove();
            reject(new Error("无法连接 Cloudflare 安全验证节点"));
        };

        document.head.appendChild(script);
    });

    return scriptLoadPromise;
}

function resolveSiteKey(): { siteKey: string | null; isDevFallback: boolean } {
    const configured =
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
        process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY?.trim();
    if (configured) {
        return { siteKey: configured, isDevFallback: false };
    }
    // 默认兜底使用项目配置的已创建 Site Key
    return { siteKey: "0x4AAAAAAFuxuCchhkC60sia", isDevFallback: false };
}

export interface TurnstileWidgetRef {
    reset: () => void;
}

interface TurnstileWidgetProps {
    id?: string;
    label?: string;
    action?: string;
    onTokenChange: (token: string) => void;
    error?: string;
    disabled?: boolean;
}

type WidgetStatus = "loading" | "ready" | "verified" | "expired" | "error";

export const TurnstileWidget = forwardRef<
    TurnstileWidgetRef,
    TurnstileWidgetProps
>(
    (
        {
            id = "turnstile-widget",
            label = "人机安全验证",
            action,
            onTokenChange,
            error,
            disabled = false,
        },
        ref
    ) => {
        // 提前预热与 Cloudflare 边缘验证节点的连接
        preconnect("https://challenges.cloudflare.com");

        const { resolvedTheme } = useTheme();
        const [mounted, setMounted] = useState(false);
        const [status, setStatus] = useState<WidgetStatus>("loading");
        const [widgetError, setWidgetError] = useState<string | null>(null);
        const [reloadSeed, setReloadSeed] = useState(0);

        const containerRef = useRef<HTMLDivElement | null>(null);
        const widgetIdRef = useRef<string | null>(null);
        const onTokenChangeRef = useRef(onTokenChange);

        useEffect(() => {
            onTokenChangeRef.current = onTokenChange;
        }, [onTokenChange]);

        useEffect(() => {
            setMounted(true);
        }, []);

        const { siteKey, isDevFallback } = resolveSiteKey();
        const turnstileTheme: TurnstileTheme =
            resolvedTheme === "dark" ? "dark" : "light";

        const cleanupWidget = useCallback(() => {
            if (
                widgetIdRef.current &&
                typeof window !== "undefined" &&
                window.turnstile
            ) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // 忽略卸载时已销毁的实例异常
                }
            }
            widgetIdRef.current = null;
        }, []);

        const handleManualRetry = useCallback(() => {
            if (disabled) return;
            onTokenChangeRef.current("");
            setWidgetError(null);
            setStatus("loading");

            if (
                widgetIdRef.current &&
                typeof window !== "undefined" &&
                window.turnstile
            ) {
                try {
                    window.turnstile.reset(widgetIdRef.current);
                    setStatus("ready");
                    return;
                } catch {
                    cleanupWidget();
                }
            }

            // 若脚本曾加载失败，强制重拉脚本并重建实例
            loadTurnstileScript(true)
                .then(() => {
                    setReloadSeed((prev) => prev + 1);
                })
                .catch((err: unknown) => {
                    const msg =
                        err instanceof Error
                            ? err.message
                            : "安全验证组件加载失败";
                    setStatus("error");
                    setWidgetError(msg);
                });
        }, [cleanupWidget, disabled]);

        useImperativeHandle(
            ref,
            () => ({
                reset: () => {
                    onTokenChangeRef.current("");
                    setWidgetError(null);
                    if (
                        widgetIdRef.current &&
                        typeof window !== "undefined" &&
                        window.turnstile
                    ) {
                        try {
                            window.turnstile.reset(widgetIdRef.current);
                            setStatus("ready");
                            return;
                        } catch {
                            cleanupWidget();
                        }
                    }
                    setReloadSeed((prev) => prev + 1);
                },
            }),
            [cleanupWidget]
        );

        useEffect(() => {
            if (!mounted) return;

            if (!siteKey) {
                setStatus("error");
                setWidgetError("未配置 NEXT_PUBLIC_TURNSTILE_SITE_KEY");
                onTokenChangeRef.current("");
                return;
            }

            let cancelled = false;
            setStatus("loading");
            setWidgetError(null);
            onTokenChangeRef.current("");

            loadTurnstileScript()
                .then((turnstile) => {
                    if (cancelled || !containerRef.current) return;

                    cleanupWidget();
                    containerRef.current.innerHTML = "";

                    const widgetId = turnstile.render(containerRef.current, {
                        sitekey: siteKey,
                        action,
                        theme: turnstileTheme,
                        size: "flexible",
                        language: "zh-cn",
                        retry: "auto",
                        "refresh-expired": "auto",
                        callback: (token: string) => {
                            if (cancelled) return;
                            setWidgetError(null);
                            setStatus("verified");
                            onTokenChangeRef.current(token);
                        },
                        "expired-callback": () => {
                            if (cancelled) return;
                            setStatus("expired");
                            onTokenChangeRef.current("");
                        },
                        "timeout-callback": () => {
                            if (cancelled) return;
                            setStatus("expired");
                            onTokenChangeRef.current("");
                        },
                        "error-callback": () => {
                            if (cancelled) return;
                            setStatus("error");
                            setWidgetError(
                                "安全验证未完成，请点击右侧重试按钮刷新"
                            );
                            onTokenChangeRef.current("");
                            return true;
                        },
                    });

                    widgetIdRef.current = widgetId;
                    setStatus((prev) =>
                        prev === "verified" ? "verified" : "ready"
                    );
                })
                .catch((err: unknown) => {
                    if (cancelled) return;
                    const msg =
                        err instanceof Error
                            ? err.message
                            : "安全验证组件加载失败";
                    setStatus("error");
                    setWidgetError(msg);
                    onTokenChangeRef.current("");
                });

            return () => {
                cancelled = true;
                cleanupWidget();
            };
        }, [mounted, siteKey, action, turnstileTheme, reloadSeed, cleanupWidget]);

        const isUnmountedScriptError =
            status === "error" && !widgetIdRef.current;
        const bottomError = isUnmountedScriptError
            ? error
            : error || widgetError;

        const statusBadgeText =
            status === "verified"
                ? "验证已通过"
                : status === "loading"
                ? "正在连接节点"
                : status === "expired"
                ? "凭证已过期"
                : status === "error"
                ? "连接受阻"
                : isDevFallback
                ? "Cloudflare · 测试密钥"
                : "Cloudflare 智能防护";

        return (
            <div className="space-y-2" id={id}>
                <div className="flex items-center justify-between gap-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                        <span>{label}</span>
                    </Label>

                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-200",
                            status === "verified"
                                ? "bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300"
                                : status === "error" || status === "expired"
                                ? "bg-rose-500/[0.12] text-rose-600 dark:text-rose-300"
                                : "bg-zinc-500/[0.08] text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400"
                        )}
                    >
                        {statusBadgeText}
                    </span>
                </div>

                {/* 无边框液态毛玻璃承载仓：严格锁定 65px 舞台高度保障零布局跳动 (0px CLS) */}
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl border-0 p-2 backdrop-blur-xl transition-shadow duration-200",
                        "bg-white/65 dark:bg-zinc-950/45",
                        status === "verified"
                            ? "shadow-[0_0_0_1.5px_rgba(16,185,129,0.28),0_4px_20px_-4px_rgba(16,185,129,0.14),inset_0_1px_0.5px_rgba(255,255,255,0.88)] dark:shadow-[0_0_0_1.5px_rgba(16,185,129,0.34),0_4px_20px_-4px_rgba(16,185,129,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                            : error || widgetError
                            ? "shadow-[0_0_0_1.5px_rgba(244,63,94,0.32),0_4px_20px_-4px_rgba(244,63,94,0.14),inset_0_1px_0.5px_rgba(255,255,255,0.88)] dark:shadow-[0_0_0_1.5px_rgba(244,63,94,0.38),0_4px_20px_-4px_rgba(244,63,94,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.12)]"
                            : "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_4px_16px_-4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.10),0_4px_16px_-4px_rgba(0,0,0,0.35)]",
                        disabled && "pointer-events-none opacity-65"
                    )}
                >
                    <div className="relative flex min-h-[65px] w-full items-center justify-center">
                        {/* Turnstile 原生挂载点 */}
                        <div
                            ref={containerRef}
                            className={cn(
                                "w-full flex items-center justify-center [&>div]:w-full",
                                (status === "loading" ||
                                    isUnmountedScriptError) &&
                                    "opacity-0 pointer-events-none absolute inset-0"
                            )}
                        />

                        {/* 脚本初始化原位过渡态（与 widget 等高 65px，绝不引发下方按钮跳动） */}
                        {status === "loading" && (
                            <div className="flex h-[65px] w-full items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 select-none">
                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                <span>正在初始化 Cloudflare 安全验证...</span>
                            </div>
                        )}

                        {/* 脚本阻断或渲染异常时的原位水滴胶囊重试面板 */}
                        {isUnmountedScriptError && (
                            <div className="flex h-[65px] w-full items-center justify-between gap-3 px-2.5">
                                <div className="flex items-center gap-2 min-w-0 text-xs font-medium text-rose-600 dark:text-rose-400">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                        {widgetError ||
                                            "安全验证加载失败，请重试"}
                                    </span>
                                </div>
                                {siteKey && (
                                    <button
                                        type="button"
                                        onClick={handleManualRetry}
                                        disabled={disabled}
                                        className={cn(
                                            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border-0 px-3.5 text-xs font-medium cursor-pointer",
                                            "bg-zinc-900/85 text-white hover:bg-zinc-900 dark:bg-white/90 dark:text-zinc-950 dark:hover:bg-white",
                                            "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.35),0_2px_8px_-2px_rgba(0,0,0,0.2)]",
                                            "transition-[transform,background-color] duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97]"
                                        )}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        <span>重新加载</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {bottomError && (
                    <div className="flex items-center justify-between gap-2 pl-1">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{bottomError}</span>
                        </p>
                        {!isUnmountedScriptError && (
                            <button
                                type="button"
                                onClick={handleManualRetry}
                                disabled={disabled}
                                className="inline-flex shrink-0 items-center gap-1 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:text-zinc-950 bg-zinc-500/[0.08] hover:bg-zinc-500/[0.14] dark:text-zinc-300 dark:hover:text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] transition-[transform,background-color,color] duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97] cursor-pointer"
                            >
                                <RefreshCw className="w-3 h-3" />
                                <span>刷新验证</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

TurnstileWidget.displayName = "TurnstileWidget";
