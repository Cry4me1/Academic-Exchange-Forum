---
name: opus-code-to-video
description: Generates viral, buttery-smooth 60fps/120fps code-driven animation videos (Opus 5.5 style) using self-contained HTML5, Three.js, GSAP Timeline, Canvas 2D/WebGL, and zero-dropframe MP4 recording tools.
---

# Opus 5.5 Code-to-Video (代码生成视频) 核心技能规范

本 Skill 赋能 Agent 复现并生成全网爆火的“Opus 5.5 风格”高帧率、数学级精度的代码驱动视频与动效场景。

---

## 一、 设计与架构原则

1. **单文件全自包含（Single-file Self-contained）**：
   - 生成的每个动效/视频项目必须是单个完整的 `.html` 文件，所有样式（CSS）、脚本（JS）、动效逻辑内联，外链统一使用稳定可靠的高速公共 CDN（如 cdnjs / unpkg / cdn.jsdelivr.net）。
   - **必选基础库 CDN**：
     - GSAP 3: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
     - Three.js: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
     - OrbitControls (如需 3D 相机): `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js`

2. **时间轴与帧率铁律（Deterministic 60/120 FPS）**：
   - 严禁使用不可控的随机状态漂移；主时间轴必须使用 `gsap.timeline({ repeat: -1 })` 或明确以 `clock.getElapsedTime()` / `performance.now()` 计算时间差 $\Delta t$。
   - 所有运镜（Camera movement）、粒子流速、色彩渐变必须随全局时间变量严格对齐，支持无缝循环（Seamless Loop）。

3. **内置即时录制组件（Built-in One-Click Recorder）**：
   - 每个生成的 HTML 页面右上角必须包含一个优雅的悬浮胶囊录制按钮（遵循 Apple Liquid Glass 无边框磨砂质感），内置 `canvas.captureStream(60)` + `MediaRecorder` 逻辑。
   - 点击“开始录制”后自动从第 0 秒开始录制完整循环周期，录制完成后自动触发浏览器下载 `.webm` 或 `.mp4` 文件。

4. **视觉风格食谱（Aesthetic Recipes）**：
   - **深空虫洞 / 空间跃迁**：Three.js 粒子流隧道 + Bloom 发光着色器 + 径向模糊。
   - **赛博朋克极简排版**：大曲率液态玻璃卡片 + 动效文字（Kinetic Typography）+ 霓虹环境微光。
   - **数学流体与力场**：Canvas 2D Perlin 噪声向量场 + 拖尾余晖粒子。
   - **黑客帝国 / 代码雨解构**：矩阵字符雨 + 3D 摄像机沿景深穿梭。

---

## 二、 自动化导出工具链（Headless Deterministic 60FPS CLI Exporter）

当用户需要批量生产或绝对零掉帧的 1080P/4K 60FPS 母带视频时，调用工作区内置的 Playwright + FFmpeg 确定性逐帧直出脚本（支持 `window.__RENDER_FRAME__(timeSec)` 逐帧步进与 `--audio` 双声道配乐混流）：

```bash
# 语法：node scripts/render_video.mjs <html路径> [输出mp4路径] [时长秒数] [分辨率] [--fps 60] [--audio 音频路径]
node scripts/render_video.mjs ./demo/scholarly_reveal.html ./output/scholarly_reveal.mp4 10 1920x1080 --audio ./output/scholarly_reveal_audio.wav
```

---

## 三、 标准代码模板规范

生成的 HTML 必须遵循如下标准骨架：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opus 5.5 Visual Scene</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #050508; }
    #canvas-container { width: 100vw; height: 100vh; position: absolute; top: 0; left: 0; }
    /* 悬浮录制胶囊 */
    .record-pill {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 9999px; border: 0;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      box-shadow: inset 0 1px 0.5px rgba(255,255,255,0.6), 0 8px 32px rgba(0,0,0,0.3);
      color: #fff; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.25s ease;
    }
    .record-pill:hover { background: rgba(255, 255, 255, 0.22); transform: scale(1.03); }
    .rec-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head>
<body>
  <div id="canvas-container"></div>
  <button id="record-btn" class="record-pill">
    <span class="rec-dot"></span>
    <span id="btn-text">录制 15秒 视频</span>
  </button>
  <script>
    // 动效与渲染逻辑...
  </script>
</body>
</html>
```
