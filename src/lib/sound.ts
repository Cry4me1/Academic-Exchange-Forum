/**
 * Scholarly 提示音效管理系统
 * 遵循 Apple Liquid Glass 设计美学，采用 Web Audio API 合成通透清脆的晶体水滴/双音和弦提示音，
 * 并以 /sounds/message.wav 作为本地静态资源双重保障。
 */

// 本地存储声音开关 Key
const SOUND_ENABLED_KEY = "scholarly_message_sound_enabled";
const SOUND_VOLUME_KEY = "scholarly_message_sound_volume";

// 自定义全局事件名称，用于多组件状态联动
export const SOUND_SETTING_CHANGE_EVENT = "scholarly-sound-setting-change";

// 缓存与防抖
let lastPlayedMessageId: string | null = null;
let lastPlayedTimestamp = 0;
const THROTTLE_MS = 350; // 350ms 防抖节流
const SAME_MSG_CACHE_MS = 5000; // 同一消息 ID 5秒内不重复播放

// Web Audio API 单例
let sharedAudioContext: AudioContext | null = null;
let audioUnlocked = false;

/**
 * 获取或初始化 AudioContext
 */
function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    try {
        if (!sharedAudioContext) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                sharedAudioContext = new AudioContextClass();
            }
        }
        if (sharedAudioContext && sharedAudioContext.state === "suspended") {
            sharedAudioContext.resume().catch(() => {
                // 忽略非交互状态下的 resume 报错
            });
        }
        return sharedAudioContext;
    } catch {
        return null;
    }
}

/**
 * 监听用户首个手势交互，解锁浏览器 Autoplay 限制
 */
if (typeof window !== "undefined") {
    const unlockAudio = () => {
        if (audioUnlocked) return;
        const ctx = getAudioContext();
        if (ctx) {
            if (ctx.state === "suspended") {
                ctx.resume().then(() => {
                    audioUnlocked = true;
                }).catch(() => {});
            } else {
                audioUnlocked = true;
            }
        }
        // 移除监听
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true, once: true });
    window.addEventListener("keydown", unlockAudio, { passive: true, once: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true, once: true });
}

/**
 * 检查提示音是否已开启（默认为开启）
 */
export function isMessageSoundEnabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
        const stored = localStorage.getItem(SOUND_ENABLED_KEY);
        return stored !== "false";
    } catch {
        return true;
    }
}

/**
 * 设置提示音开关状态并广播事件
 */
export function setMessageSoundEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(SOUND_ENABLED_KEY, enabled ? "true" : "false");
        window.dispatchEvent(
            new CustomEvent(SOUND_SETTING_CHANGE_EVENT, { detail: { enabled } })
        );
    } catch (e) {
        console.warn("保存声音设置失败:", e);
    }
}

/**
 * 使用 Web Audio API 合成 Apple Liquid Glass 风格的晶体双音水滴提示音
 * 特性：高频清脆、双谐波自然衰减、无毛刺、零网络延迟
 */
function synthesizeLiquidChime(ctx: AudioContext, masterVolume: number): void {
    const now = ctx.currentTime;
    
    // 主音量增益节点
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, now);
    masterGain.connect(ctx.destination);

    // 第一音符：基频 880Hz (A5) 柔和水滴敲击
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    // 快速防爆音淡入 (3ms) + 指数自然衰减
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.45, now + 0.004);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.33);

    // 第二音符：通透高晶 1318.51Hz (E6) + 2637Hz (E7) 泛音，滞后 60ms 响起
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, now + 0.06);

    gain2.gain.setValueAtTime(0.0001, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.38, now + 0.064);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.46);

    // 细微晶体泛音 (2637Hz)，给予液态玻璃专属反射质感
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();
    oscHarmonic.type = "sine";
    oscHarmonic.frequency.setValueAtTime(2637, now + 0.06);

    gainHarmonic.gain.setValueAtTime(0.0001, now + 0.06);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.12, now + 0.064);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    oscHarmonic.connect(gainHarmonic);
    gainHarmonic.connect(masterGain);
    oscHarmonic.start(now + 0.06);
    oscHarmonic.stop(now + 0.29);
}

/**
 * 备选：通过静态音频文件 /sounds/message.wav 播放
 */
function playAudioFileFallback(volume: number): Promise<void> {
    return new Promise((resolve) => {
        try {
            const audio = new Audio("/sounds/message.wav");
            audio.volume = Math.max(0, Math.min(1, volume));
            audio.play()
                .then(() => resolve())
                .catch(() => {
                    // 浏览自动播放策略拦截或无法播放时静默处理
                    resolve();
                });
        } catch {
            resolve();
        }
    });
}

export interface PlayMessageSoundOptions {
    messageId?: string;
    force?: boolean; // 是否忽略静音开关（用于设置界面的试听按钮）
    volume?: number; // 0.0 ~ 1.0，默认 0.35
}

/**
 * 播放收到私信提示音
 * 支持：静音判定、消息去重、时间节流、Web Audio 晶体音合成与静态音频降级
 */
export async function playMessageSound(options: PlayMessageSoundOptions = {}): Promise<void> {
    if (typeof window === "undefined") return;

    const { messageId, force = false, volume = 0.35 } = options;

    // 1. 静音检查
    if (!force && !isMessageSoundEnabled()) {
        return;
    }

    const now = Date.now();

    // 2. 消息去重（同一消息 ID 在规定时间内只播放一次）
    if (messageId) {
        if (lastPlayedMessageId === messageId && now - lastPlayedTimestamp < SAME_MSG_CACHE_MS) {
            return;
        }
    }

    // 3. 节流防连发爆音
    if (now - lastPlayedTimestamp < THROTTLE_MS) {
        return;
    }

    // 更新时间与 ID
    if (messageId) {
        lastPlayedMessageId = messageId;
    }
    lastPlayedTimestamp = now;

    // 4. 优先尝试 Web Audio API 晶体合成
    const ctx = getAudioContext();
    if (ctx) {
        try {
            if (ctx.state === "suspended") {
                await ctx.resume();
            }
            synthesizeLiquidChime(ctx, volume);
            return;
        } catch (e) {
            // AudioContext 失败时降级
            console.warn("Web Audio API 播放失败，尝试降级文件播放:", e);
        }
    }

    // 5. 降级方案：HTML5 Audio 播放静态资源
    await playAudioFileFallback(volume);
}

/**
 * 试听提示音（强制播放，忽略当前静音设置，并顺便唤醒 AudioContext）
 */
export async function testMessageSound(): Promise<void> {
    await playMessageSound({ force: true });
}
