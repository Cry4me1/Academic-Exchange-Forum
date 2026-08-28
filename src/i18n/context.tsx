"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Locale, TranslationDictionary } from "./types";
import { zh } from "./dictionaries/zh";
import { en } from "./dictionaries/en";
import { createClient } from "@/lib/supabase/client";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: TranslationDictionary;
    isZh: boolean;
    isEn: boolean;
}

const dictionaries: Record<Locale, TranslationDictionary> = {
    zh,
    en,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "scholarly_locale";
const COOKIE_KEY = "NEXT_LOCALE";

export function I18nProvider({
    children,
    initialLocale = "zh",
}: {
    children: React.ReactNode;
    initialLocale?: Locale;
}) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // 从 localStorage 或 cookie 恢复用户选中的语言
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
            if (saved && (saved === "zh" || saved === "en")) {
                setLocaleState(saved);
            } else {
                // 尝试从 cookie 获取
                const match = document.cookie.match(new RegExp(`(^| )${COOKIE_KEY}=([^;]+)`));
                if (match && (match[2] === "zh" || match[2] === "en")) {
                    setLocaleState(match[2] as Locale);
                }
            }
        } catch (e) {
            console.warn("[i18n] Failed to load locale from storage:", e);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);

        // 1. 存入 localStorage
        try {
            localStorage.setItem(STORAGE_KEY, newLocale);
        } catch (e) {
            console.warn("[i18n] localStorage write failed:", e);
        }

        // 2. 存入 Cookie (有效期 1 年)
        try {
            document.cookie = `${COOKIE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
            document.cookie = `scholarly_lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (e) {
            console.warn("[i18n] cookie write failed:", e);
        }

        // 3. 如果用户已登录，异步同步到 Supabase profiles.language
        try {
            const supabase = createClient();
            supabase.auth.getUser().then((res: { data: { user: any } }) => {
                const user = res.data?.user;
                if (user) {
                    supabase
                        .from("profiles")
                        .update({ language: newLocale, updated_at: new Date().toISOString() })
                        .eq("id", user.id)
                        .then((updateRes: { error: any }) => {
                            if (updateRes.error) {
                                console.warn("[i18n] Failed to sync language to profile:", updateRes.error);
                            }
                        });
                }
            });
        } catch (e) {
            console.warn("[i18n] Supabase sync error:", e);
        }
    };

    const value = useMemo<I18nContextType>(() => {
        return {
            locale,
            setLocale,
            t: dictionaries[locale] || dictionaries.zh,
            isZh: locale === "zh",
            isEn: locale === "en",
        };
    }, [locale]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}
