# Scholarly 全局 UI 设计规范 (UI-DESIGN-RULES)
> **设计系统代号**：Apple Liquid Glass（无边框液态流光毛玻璃）  
> **核心原则**：纯净通透 · 彻底无边框 · 水滴流体几何 · 物理级真实反射 · 零布局跳动

---

## Ⅰ. 核心设计哲学 (Five Pillars of Design)

### 1. 彻底无边框法则 (Zero-Border Philosophy)
- **【绝对禁止】** 任何组件的外层使用显式硬描边（如 `border`, `border-zinc-200`, `border-white/10`, `border-dashed` 等粗糙线框）。
- **【物理边界构建】** 真实自然界中的液态水滴和高纯度水晶没有人工外轮廓线条。组件的形态边界仅由以下三层物理光学构成：
  1. **通透磨砂底色**：高斯模糊（`backdrop-blur-xl` / `backdrop-blur-2xl`）搭配高透微白/微深基底（浅色 `bg-white/70`，深色 `bg-zinc-900/50`）；
  2. **表面张力菲涅尔顶光 (Fresnel Inset)**：微内阴影高光（`shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]`）；
  3. **柔和环境弥散阴影**：大扩散低不透明度外阴影（`shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06)]`）。

### 2. 水滴流体与大曲率几何 (Fluid Organic Geometries)
- **【绝对禁止】** 僵硬生硬的直角或小半径圆角（严禁在交互按键上使用 `rounded-md`、`rounded-lg` 或死板长方框）。
- **【形态规范】**：
  - **交互胶囊、按键、标签、Toggle、搜索药丸**：统一采用全圆角水滴胶囊 `rounded-full`；
  - **设置面板、卡片容器、对话框、浮层面板**：统一采用大曲率圆润面板 `rounded-2xl` 或 `rounded-3xl`。

### 3. 纯物理无色环境反射与微光晕 (Achromatic Reflex & Subtle Aura)
- **【绝对禁止】** 滥用高饱和度霓虹渐变（如人工廉价蓝紫激光）、写死时长的刺眼扫光条。
- **【物理反射规范】**：
  - 常态反射光斑必须是无色（Achromatic）纯白环境反射（`rgba(255,255,255,...)`）；
  - 动态交互通过 DOM 原生注入 CSS 变量（`--mouse-x`, `--mouse-y`），实现 120fps 毫秒级极速光随鼠动（真实的各向异性物理漫反射）；
  - 状态激活态（如选中、求助、成功）仅允许使用单色、温润如玉的环境微光晕（Ambient Aura Glow，如天青光晕 `rgba(14,165,233,0.18)`、琥珀暖金 `rgba(245,158,11,0.22)`），扩散柔和，绝不刺眼。

### 4. 渐变消融内部光缝 (Seamless Dissolving Dividers)
- **【绝对禁止】** 使用生硬灰色短实线或 `<hr />`（如 `bg-zinc-200`、`border-zinc-200`）。
- **【光缝规范】** 内部逻辑分割一律采用中心微亮、两端平滑消融至完全透明的渐变光缝：
  - 水平光缝：`h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent`；
  - 垂直光缝：`w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent`。

### 5. 绝对零布局跳动法则 (Strict Zero Layout Shift)
- **【绝对禁止】** 因选中、聚焦或悬浮状态切换，导致周围元素或下方组件发生任何像素级抖动（Shift）。
- **【尺寸锁死规范】**：
  - 选中与未选中状态的文字粗细必须恒定保持一致（统一使用 `font-medium`，严禁在选中时动态切成 `font-bold` 或 `font-semibold` 导致字体变宽）；
  - 严禁在状态切换时插入/删除具有物理宽度的图标（如删除时突然出现 `X` 图标导致行末标签被迫折行）；
  - 所有状态区分必须且只能依靠背景半透底色、内高光与氛围光晕（Aura Glow）呈现。

---

## Ⅱ. 常用组件 Tailwind CSS 标准模板速查表

| 组件类型 | 关键类名与光学参数 (Tailwind CSS) |
| :--- | :--- |
| **主操作按钮 (CTA)** | `relative overflow-hidden group h-9 px-5 rounded-full border-0 font-medium text-xs sm:text-sm bg-zinc-950/85 hover:bg-zinc-900/95 text-white shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.22),inset_0_1px_1.5px_rgba(255,255,255,1)] backdrop-blur-xl transition-all duration-300 active:scale-[0.97]` |
| **次级水滴按钮 / 返回** | `h-8 px-3 rounded-full border-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-200/30 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] transition-all` |
| **状态胶囊 / Toggle** | `rounded-full border-0 px-3 py-1.5 backdrop-blur-xl transition-all duration-300 select-none bg-zinc-200/40 hover:bg-zinc-200/60 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9)] dark:bg-white/[0.06] dark:hover:bg-white/[0.09]`（激活态：叠加微金色 `bg-amber-500/[0.14] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8),0_2px_12px_rgba(245,158,11,0.22)]`） |
| **悬浮工具栏 (Toolbar Bar)** | `rounded-full border-0 px-3 py-1.5 bg-white/70 hover:bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300` |
| **大卡片容器 (Card / Panel)** | `rounded-3xl border-0 p-6 bg-white/75 hover:bg-white/85 dark:bg-zinc-900/45 backdrop-blur-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all` |
| **浮层面板 / 下拉菜单** | `rounded-2xl border-0 p-1.5 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)]` |
| **内嵌透光槽 (Uploader / Dropzone)** | `rounded-2xl border-0 bg-zinc-200/40 hover:bg-zinc-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08)] transition-all` |

---

## Ⅲ. AI 编码硬性执行准则 (Mandatory Constraints for AI)

所有后续生成、重构或优化前端 UI 代码的 AI 助手，**必须将本文件作为第一优先级的审美与设计守则执行**：
1. **代码扫描自查**：生成代码前，检查 JSX/Tailwind 类名中是否存在显式硬边框（`border`, `border-border`, `border-dashed` 等），若存在必须立即重构为内高光加半透磨砂的无边框光学表现；
2. **拒绝死黑与平庸实体块**：核心操作按钮与重要开关绝不能使用生硬平面的纯黑方块，必须使用黑曜石/白月光液态玻璃与触觉微弹动效；
3. **保持视觉系统连贯性**：不论是 Header、Toolbar、Sidebar、Modal 还是 Tag，统一遵循 `rounded-full` 胶囊与 `rounded-3xl` 大面板的流体语言。
