---
trigger: always_on
---

# UI-DESIGN-RULES: Apple Liquid Glass 设计系统与编码强制约束

> **地位**：本文件是 Scholarly 论坛前端界面构建的最高审美与编码规范，具有全局最高约束力。AI 在编写、重构或修补任何 UI 组件（JSX/TSX/Tailwind）时，**必须无条件严格参照遵循本规范**。

---

### 1. 彻底无边框化（Zero Border / Border-Free Design）
- **【严禁】** 在任何组件外层使用显式硬线框（如 `border`, `border-zinc-200`, `border-border`, `border-dashed` 等）。
- **【强制】** 统一使用 `border-0`。物理体积与边界必须纯粹通过三层光学表现构建：
  1. 通透半透明高斯磨砂（`backdrop-blur-xl` / `backdrop-blur-2xl` 搭配 `bg-white/70` 或 `bg-zinc-900/50`）；
  2. 表面张力菲涅尔内高光（`shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]`）；
  3. 大范围低透明度环境漫反射柔阴影（`shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06)]`）。

### 2. 水滴流体几何与大曲率圆角（Fluid Organic Geometries）
- **【严禁】** 在交互组件中使用方正或微小圆角（如硬拐角的 `rounded-md`、`rounded-lg`）。
- **【强制】**
  - 所有按钮（Button）、标签（Tag）、切换开关（Toggle）、胶囊提示、输入药丸：统一使用水滴胶囊 `rounded-full`；
  - 所有侧边栏面板、设置卡片（Card）、对话框（Dialog/Modal）、下拉浮层（Dropdown/Popover）：统一使用大曲率圆润面板 `rounded-2xl` 或 `rounded-3xl`。

### 3. 纯物理无色反射与环境微光晕（Pure Light Reflex & Aura）
- **【严禁】** 滥用高饱和度霓虹渐变（如人工高艳蓝紫激光条）、廉价扫光。
- **【强制】**
  - 常态反射必须为无色纯白环境光（`rgba(255,255,255,...)`）；
  - 动态光效必须使用 DOM 原生修改 CSS 变量（`--mouse-x`, `--mouse-y`），实现 120fps 光随鼠动物理漫射；
  - 选中/激活态使用柔和温润的单色微光晕（Ambient Aura Glow，如天青微光 `rgba(14,165,233,0.18)`、琥珀金光 `rgba(245,158,11,0.22)`）。

### 4. 渐变消融内部光缝（Seamless Dissolving Dividers）
- **【严禁】** 使用灰色实线 `<hr />` 或 `bg-zinc-200` 割裂组件。
- **【强制】** 分割线一律采用中心微亮、向两端自然消融至透明的渐变微光缝：
  - 水平：`h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent`；
  - 垂直：`w-[1px] h-4 bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/60 to-transparent mx-1`。

### 5. 绝对零布局跳动法则（Strict Zero Layout Shift）
- **【严禁】** 任何交互态切换引起周围或下方元素产生哪怕 1px 的跳动（Shift）。
- **【强制】** 选中与未选中状态的文字字重必须完全锁死为 `font-medium`；严禁在状态切换时插入具有物理宽度的图标破坏单行排布。

### 6. 核心行动点（Primary CTA）质感升级
- **【严禁】** 核心发布、提交或保存按钮采用平面死黑方块。
- **【强制】** 升级为黑曜石液态玻璃（Light: `bg-zinc-950/85 hover:bg-zinc-900/95 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)]`）与白月光晶体（Dark: `dark:bg-white/90 dark:text-zinc-950`），配置极细物理透光顶缝与 `motion.div` 触觉回弹。
