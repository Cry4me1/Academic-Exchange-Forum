"use client";

import { useEffect, useState, useCallback } from "react";
import {
    isMessageSoundEnabled,
    setMessageSoundEnabled,
    playMessageSound,
    testMessageSound,
    SOUND_SETTING_CHANGE_EVENT,
} from "@/lib/sound";

/**
 * 提示音状态与控制 Hook
 */
export function useMessageSound() {
    const [soundEnabled, setSoundEnabledState] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setSoundEnabledState(isMessageSoundEnabled());
        setIsLoaded(true);

        const handleSettingChange = (e: Event) => {
            const customEvent = e as CustomEvent<{ enabled: boolean }>;
            if (customEvent.detail && typeof customEvent.detail.enabled === "boolean") {
                setSoundEnabledState(customEvent.detail.enabled);
            } else {
                setSoundEnabledState(isMessageSoundEnabled());
            }
        };

        window.addEventListener(SOUND_SETTING_CHANGE_EVENT, handleSettingChange);
        return () => {
            window.removeEventListener(SOUND_SETTING_CHANGE_EVENT, handleSettingChange);
        };
    }, []);

    const toggleSound = useCallback(() => {
        const nextState = !soundEnabled;
        setSoundEnabledState(nextState);
        setMessageSoundEnabled(nextState);
        if (nextState) {
            testMessageSound();
        }
    }, [soundEnabled]);

    const setSoundEnabled = useCallback((enabled: boolean) => {
        setSoundEnabledState(enabled);
        setMessageSoundEnabled(enabled);
    }, []);

    return {
        soundEnabled,
        isLoaded,
        toggleSound,
        setSoundEnabled,
        playSound: playMessageSound,
        testSound: testMessageSound,
    };
}
