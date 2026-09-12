---
name: liquid-glass-workflow
description: >-
  Systematically refactors and transforms UI components into the Apple Liquid Glass design system. Enforces zero-border geometry (border-0), 3-layer optical depth, rounded-full fluid capsules, rounded-3xl panels, 120fps mouse-tracking physical reflections, seamless dissolving dividers, and strict zero layout shift.
---

# Apple Liquid Glass UI 改进工作流技能 (Liquid Glass Workflow)

## Overview

本技能沉淀自 Scholarly 学术论坛前端界面的高阶物理光学重构实践。  
当需要对任何页面、组件或交互控件进行 UI 质感升级时，本工作流指导并严格约束 AI 按照 6 步标准物理光学改造法，将生硬、带黑灰外框的旧式组件重塑为兼具纯净通透感与物理张力的 **Apple Liquid Glass（无边框液态流光毛玻璃）** 风格。

---

## Dependencies

- **核心设计总纲**: 必须严格参照并遵守项目根目录的 [`UI-DESIGN-RULES.md`](file:///d:/project/academic_forum/UI-DESIGN-RULES.md) 与全局常驻规则 [`.agent/rules/ui-design-rules.md`](file:///d:/project/academic_forum/.agent/rules/ui-design-rules.md)。
- **动效库**: 依托 `framer-motion` 实现触觉微弹与流体进入动画。
- **工具函数**: 依托 `@/lib/utils` 的 `cn(...)` 实现类名合并。

---

## Quick Start

### 触发方式
当用户表达以下意图时，自动唤起并执行本工作流：
- `改进这个组件的UI为液态玻璃风格`
- `给这个页面/bar/卡片加上这种质感，无边框设计`
- `/liquid-glass-workflow`
- `按照 UI-DESIGN-RULES 重构 [组件路径]`

---

## Workflow: 6 步标准物理光学改造法

### 步骤 1：组件诊断与缺陷排查 (Visual Audit)
在着手写任何代码前，AI 必须完整读取目标 TSX/JSX 文件，并逐项排查以下违规项：
1. **显式硬边框线**：查找所有 `border`, `border-zinc-*`, `border-border`, `border-dashed` 等。
2. **生硬方拐角**：查找在交互按钮或卡片上的 `rounded-md`, `rounded-lg` 或硬拐角小方块。
3. **死板纯黑色块**：查找没有任何高光与通透质感的平面死黑纯色背景（如死沉的 `bg-zinc-900` 单块）。
4. **布局跳动风险点 (Layout Shift)**：检查是否存在选中时增加图标（如动态出现的 `X`）、字重由 `font-medium` 跳变到 `font-bold` 等导致周围元素被推开的隐患。

### 步骤 2：彻底无边框化与三层光学重塑 (Zero-Border Optics)
彻底删除所有外层硬描边，替换为 `border-0`，并纯粹通过以下三层物理光学再造体积边界：
- **第一层：通透半透明高斯磨砂底**：
  - 浅色模式：`bg-white/70 hover:bg-white/80 backdrop-blur-xl`（或 `backdrop-blur-2xl`）
  - 深色模式：`dark:bg-zinc-900/50 dark:hover:bg-zinc-900/65`
- **第二层：表面张力菲涅尔内高光 (Fresnel Inset)**：
  - 浅色顶光：`shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]`（大卡片采用 `inset_0_1px_1px_rgba(255,255,255,0.95)]`）
  - 深色顶光：`dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.18)]`
- **第三层：柔和环境漫反射柔阴影**：
  - 常态漫射：`shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06)]`（深色 `dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4)]`）

### 步骤 3：水滴流体几何形态固化 (Fluid Organic Geometries)
- **水滴胶囊 (rounded-full)**：所有按钮（Button）、标签（Tag）、切换开关（Toggle）、输入药丸、键帽统一锁死为 `rounded-full`。
- **大曲率圆润面板 (rounded-2xl / rounded-3xl)**：所有侧边栏卡片、设置面板、对话框（Dialog/Modal）、浮层（Dropdown/Popover）统一使用 `rounded-2xl` 或 `rounded-3xl`。

### 步骤 4：120fps 物理反射与微光晕交互 (Reflex & Aura)
- **光随鼠动（Mouse Reflex）**：
  动态高光不使用写死时长的扫光，而是通过组件原生监听 `onMouseMove`，直接将光标相对坐标写入 DOM CSS 变量：
  ```tsx
  style={{
    background: "radial-gradient(120px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.35), transparent 80%)"
  }}
  ```
- **核心 CTA 行动点质感升级**：
  放弃纯黑死板矩形，升级为黑曜石液态玻璃（Light: `bg-zinc-950/85 hover:bg-zinc-900/95 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)]`）与白月光晶体（Dark: `dark:bg-white/90 dark:text-zinc-950`），并配置微光流动折射层。
- **温润微光晕（Ambient Aura Glow）**：
  选中态统一采用单色温润光晕（如天青光晕 `rgba(14,165,233,0.18)`、琥珀金光 `rgba(245,158,11,0.22)`），禁止刺眼的多色渐变。
- **触觉微弹**：
  交互按键包裹 `motion.div` 或 `whileHover={{ scale: 1.02 }}` 与 `whileTap={{ scale: 0.97 }}`。

### 步骤 5：渐变消融内部光缝与零布局跳动锁定 (Dividers & Shift Lock)
- **废除灰色实线 `<hr />`**：内部逻辑分割统一使用中心微亮、两端平滑消融至完全透明的渐变光缝：
  - 水平：`h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent`
  - 垂直：`w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1 shrink-0`
- **零布局跳动法则**：
  - 选中与未选中字重必须恒定锁定为 `font-medium`；
  - 严禁在选中时插入物理宽度图标挤压排版；
  - 状态切换必须通过半透背景色与微光晕切换呈现。

### 步骤 6：全自动化代码验证与缓存穿透 (Verification & Cache Busting)
修改完成后，AI 必须主动执行：
1. **类型检查**：运行 `npx tsc --noEmit`，确保退出码为 0，零类型错误。
2. **规范检查**：运行 `npm run lint`，确保无新增代码风格警告。
3. **缓存穿透引导**：若修改了异步动态加载组件（`dynamic(..., { ssr: false })`），必须在回复中清晰提醒用户按 `Ctrl + F5` 强制清除浏览器静态 Chunk 磁盘缓存。

---

## Common Mistakes (常见反模式与禁忌)

1. **看似有毛玻璃，实则留着外线框**：加了 `backdrop-blur-xl` 却依然保留 `border border-zinc-200`，这是最常见的伪毛玻璃。**必须显式声明 `border-0`**。
2. **滥用高饱和度蓝紫霓虹光**：真正的高阶 Apple 质感以无色纯白环境反射为主，仅在激活选中时施加单色微光晕。
3. **状态切换时字体加粗**：将激活态改为 `font-bold` 导致占用宽度增加，引发整行文字或邻近组件跳行。必须全局锁定 `font-medium`。
4. **使用硬拐角方框做按钮**：在交互按键上使用小半径 `rounded-md`，破坏水滴流体感。交互按钮必须为 `rounded-full` 水滴胶囊。
