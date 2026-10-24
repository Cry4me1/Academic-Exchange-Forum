import fs from 'fs';
import path from 'path';

/**
 * 为 Scholarly 10秒品牌揭示视频合成母带级双声道 48kHz 16-bit 电影氛围配乐
 * 四幕精准对齐：
 *   0.00s - 2.45s : 思想奇点觉醒 (Dmaj9 空灵玻璃泛音 + 4枚公式晶簇水滴声)
 *   2.40s - 5.25s : 三大核心引擎展开 (柔和空气穿梭 + 3张液态玻璃卡片微触音 + 沙盒通过清脆泛音)
 *   5.20s - 7.60s : 全景殿堂界面升维 (温暖和弦推进 Bm9 -> Asus4 + 丝滑立体声声场)
 *   7.60s - 10.00s: Scholarly 图腾终极加冕 (深沉温暖低音 + 琥珀金钟琴 Dmaj9 共鸣尾韵，平滑渐隐)
 */

const SAMPLE_RATE = 48000;
const DURATION = 10.0;
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// 温暖泛音弦垫 (Warm Detuned Glass Pad)
function addPadChord(startSec, endSec, freqs, amp, attack = 0.6, release = 0.9) {
  const iStart = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const iEnd = Math.min(TOTAL_SAMPLES, Math.floor(endSec * SAMPLE_RATE));
  const detunes = [-0.0028, 0.0, 0.0028];

  for (let i = iStart; i < iEnd; i++) {
    const t = i / SAMPLE_RATE;
    const localT = t - startSec;
    const remainT = endSec - t;
    const env = smoothstep(0, attack, localT) * smoothstep(0, release, remainT);

    let sigL = 0;
    let sigR = 0;
    for (let fIdx = 0; fIdx < freqs.length; fIdx++) {
      const baseF = freqs[fIdx];
      const pan = (fIdx / Math.max(1, freqs.length - 1)) * 0.5 - 0.25; // -0.25 ~ +0.25
      let voice = 0;
      for (let d = 0; d < detunes.length; d++) {
        const f = baseF * (1 + detunes[d]);
        voice += Math.sin(2 * Math.PI * f * t + d * 1.1) * 0.34;
        // 柔和二次泛音增加温润空气感
        voice += Math.sin(2 * Math.PI * f * 2 * t + d * 0.7) * 0.06;
      }
      sigL += voice * (1 - pan);
      sigR += voice * (1 + pan);
    }

    left[i] += (sigL / freqs.length) * amp * env;
    right[i] += (sigR / freqs.length) * amp * env;
  }
}

// 清透水晶钟琴音粒 (Crystalline Bell / Rhodes Pluck)
function addCrystalNote(timeSec, freq, amp = 0.14, decay = 1.4, pan = 0) {
  const iStart = Math.max(0, Math.floor(timeSec * SAMPLE_RATE));
  const iEnd = Math.min(TOTAL_SAMPLES, Math.floor((timeSec + decay * 2.6) * SAMPLE_RATE));

  for (let i = iStart; i < iEnd; i++) {
    const dt = (i - iStart) / SAMPLE_RATE;
    const attackEnv = Math.min(1, dt / 0.008);
    const expEnv = Math.exp(-dt * (2.6 / decay));
    const fmMod = Math.sin(2 * Math.PI * freq * 2.0 * dt) * 0.45 * Math.exp(-dt * 9.0);
    const sample =
      (Math.sin(2 * Math.PI * freq * dt + fmMod) * 0.78 +
        Math.sin(2 * Math.PI * freq * 3.0 * dt) * 0.12 * Math.exp(-dt * 6.0)) *
      attackEnv *
      expEnv *
      amp;

    left[i] += sample * (0.5 - pan * 0.35);
    right[i] += sample * (0.5 + pan * 0.35);
  }
}

// 丝滑滤波空气穿梭声 (Filtered Air Whoosh Transition)
function addSilkWhoosh(centerSec, widthSec = 0.55, amp = 0.075, panDir = 1) {
  const startSec = centerSec - widthSec;
  const endSec = centerSec + widthSec;
  const iStart = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const iEnd = Math.min(TOTAL_SAMPLES, Math.floor(endSec * SAMPLE_RATE));

  // 双级一阶低通滤波白噪，模拟高级苹果发布会镜头推拉气流
  let lpL1 = 0, lpL2 = 0, lpR1 = 0, lpR2 = 0;
  let seed = Math.floor(centerSec * 99991) + 12345;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 4294967296) * 2 - 1;
  };

  for (let i = iStart; i < iEnd; i++) {
    const t = i / SAMPLE_RATE;
    const norm = (t - startSec) / (2 * widthSec); // 0 -> 1
    const bell = Math.sin(Math.PI * norm) ** 2.2;
    const cutoff = 0.015 + 0.085 * bell; // 动态开合低通滤波器

    const nL = rand();
    const nR = rand();
    lpL1 += cutoff * (nL - lpL1);
    lpL2 += cutoff * (lpL1 - lpL2);
    lpR1 += cutoff * (nR - lpR1);
    lpR2 += cutoff * (lpR1 - lpR2);

    const pan = (norm * 2 - 1) * 0.45 * panDir;
    left[i] += lpL2 * bell * amp * (1 - pan);
    right[i] += lpR2 * bell * amp * (1 + pan);
  }
}

// 深邃温润低频脉搏 (Warm Sub-Bass Swell)
function addSubSwell(startSec, durSec, fStart, fEnd, amp = 0.22) {
  const iStart = Math.max(0, Math.floor(startSec * SAMPLE_RATE));
  const iEnd = Math.min(TOTAL_SAMPLES, Math.floor((startSec + durSec) * SAMPLE_RATE));
  let phase = 0;

  for (let i = iStart; i < iEnd; i++) {
    const dt = (i - iStart) / SAMPLE_RATE;
    const u = dt / durSec;
    const freq = fStart + (fEnd - fStart) * smoothstep(0, 1, u);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env = smoothstep(0, 0.08, u) * smoothstep(1.0, 0.22, u);
    const s = Math.sin(phase) * env * amp;
    left[i] += s;
    right[i] += s;
  }
}

// === 编曲排布 ===

// Act I (0.00s - 2.60s): Dmaj9 空灵序章 (D2, A2, F#3, A3, C#4, E4)
addPadChord(0.02, 2.75, [73.42, 110.0, 185.0, 220.0, 277.18, 329.63], 0.30, 0.45, 0.55);
addCrystalNote(0.08, 587.33, 0.10, 1.3, -0.2); // 光缝开启 D5
addCrystalNote(0.42, 739.99, 0.085, 1.2, -0.5); // 公式卡 1 F#5
addCrystalNote(0.68, 880.00, 0.085, 1.2, 0.5);  // 公式卡 2 A5
addCrystalNote(0.94, 1108.73, 0.075, 1.2, -0.35); // 公式卡 3 C#6
addCrystalNote(1.20, 1318.51, 0.070, 1.3, 0.35);  // 公式卡 4 E6

// 2.38s 镜头穿越三维流形过渡
addSilkWhoosh(2.38, 0.45, 0.09, 1);
addSubSwell(2.30, 0.85, 92.5, 61.74, 0.18);

// Act II (2.40s - 5.35s): Bm9 知性科技律动 (B1, F#2, A3, C#4, D4, F#4)
addPadChord(2.35, 5.45, [61.74, 92.50, 220.0, 277.18, 293.66, 369.99], 0.31, 0.40, 0.55);
// 三张 Bento 玻璃卡片依序展开音粒
addCrystalNote(2.62, 440.00, 0.095, 0.9, -0.55);
addCrystalNote(2.78, 554.37, 0.095, 0.9, 0.0);
addCrystalNote(2.94, 659.25, 0.105, 1.1, 0.55);
// 3.55s 代码沙盒测试通过清亮双音
addCrystalNote(3.55, 880.00, 0.075, 0.9, 0.15);
addCrystalNote(3.64, 1174.66, 0.090, 1.1, 0.25);

// 5.20s 转场至全景殿堂界面
addSilkWhoosh(5.22, 0.48, 0.085, -1);

// Act III (5.20s - 7.70s): Gmaj9 -> Asus4 开阔升维 (G2, D3, F#3, A3, B3, D4)
addPadChord(5.15, 7.80, [98.00, 146.83, 185.00, 220.00, 246.94, 293.66], 0.33, 0.45, 0.55);
addCrystalNote(5.45, 587.33, 0.09, 1.2, -0.3);
addCrystalNote(6.15, 739.99, 0.08, 1.2, 0.3);
addCrystalNote(6.75, 880.00, 0.085, 1.2, 0.0);

// 7.58s 汇聚为品牌图腾终章
addSilkWhoosh(7.58, 0.46, 0.095, 1);
addSubSwell(7.58, 2.25, 73.42, 73.42, 0.22); // 稳重深沉的 D2 基音

// Act IV (7.55s - 10.00s): 辉煌温润的 Dmaj9 殿堂终极共鸣，9.1s 后优雅收束归零
addPadChord(7.55, 9.96, [73.42, 146.83, 220.00, 293.66, 369.99, 440.00, 554.37], 0.36, 0.35, 0.85);
// SVG 徽标勾勒流光琶音
addCrystalNote(7.65, 587.33, 0.11, 1.8, -0.35);  // D5
addCrystalNote(7.78, 739.99, 0.11, 1.8, -0.12);  // F#5
addCrystalNote(7.91, 880.00, 0.11, 1.8, 0.12);   // A5
addCrystalNote(8.05, 1174.66, 0.135, 2.1, 0.0);  // D6 殿堂冠冕定格音

// 简单立体声空间混响 (Schroeder/Delay Cross-feedback) 让音色如置身音乐厅
const delaySamplesL = Math.floor(0.115 * SAMPLE_RATE);
const delaySamplesR = Math.floor(0.148 * SAMPLE_RATE);
for (let i = Math.max(delaySamplesL, delaySamplesR); i < TOTAL_SAMPLES; i++) {
  left[i] += right[i - delaySamplesL] * 0.20;
  right[i] += left[i - delaySamplesR] * 0.20;
}

// 母带软限幅 + 头尾淡入淡出防爆音
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const masterFade = smoothstep(0, 0.04, t) * smoothstep(10.0, 9.55, t);
  left[i] = Math.tanh(left[i] * masterFade * 1.15) * 0.88;
  right[i] = Math.tanh(right[i] * masterFade * 1.15) * 0.88;
}

// 写入标准 16-bit PCM WAV 文件
const outPath = path.resolve(process.cwd(), 'output', 'scholarly_reveal_audio.wav');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const numChannels = 2;
const bitsPerSample = 16;
const byteRate = (SAMPLE_RATE * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;
const dataSize = TOTAL_SAMPLES * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bitsPerSample, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const sL = Math.max(-1, Math.min(1, left[i]));
  const sR = Math.max(-1, Math.min(1, right[i]));
  buffer.writeInt16LE(Math.round(sL * 32767), offset);
  buffer.writeInt16LE(Math.round(sR * 32767), offset + 2);
  offset += 4;
}

fs.writeFileSync(outPath, buffer);
console.log(`🎵 已合成 10.00s 双声道电影级配乐: ${outPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
