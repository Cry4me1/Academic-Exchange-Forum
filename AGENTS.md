# Scholarly 全栈开发智能体核心规范与行为约束

---

## 🛡️ 质量守门 (Quality Gate) — 编码后强制自动执行

> **【不可跳过的硬约束】**：凡是在当前任务或会话中编写、修改、新增或删除任何代码（TS/TSX/JS/CSS 等），在向用户汇报“完成”、“已实现”或结束任务之前，**必须且无条件**首先调用 MCP 工具 `quality_fix`（来自 `ai-quality-gate` MCP 服务）执行 Phase 1（ESLint + Prettier）质量门禁与自动修复。

### 强制执行细则：
1. **执行时机**：每次编码或代码编辑完毕后，必须在最终答复前自动调用 `quality_fix`，严禁遗漏或由用户提醒。
2. **闭环修复**：若 `quality_fix` 报告仍有未修复的 ESLint/Prettier 错误，必须持续跟进修复，直至门禁完全通过。
3. **禁止前置声称完成**：严禁在未调用 `quality_fix` 并确认通过前向用户说“已完成”、“Done”或“可以部署了”。
4. **功能保护**：严禁为了让 lint 规则通过而擅自删除具有实际业务功能的代码。
5. **历史代码免责**：若发现报错的根本原因属于历史遗留代码且不在本次任务改动范围内，严禁擅自扩大修改面，仅在汇报中向用户说明该报错属于外部/历史代码即可。

---

## 🧹 Clenzer — Code Hygiene Rules

These rules are enforced by the **clenzer** MCP on every session.

> **IMPORTANT**: Run `scan_dead_code` and `scan_complexity` at the start of any significant editing session and BEFORE completing your task, then run `cleanse` to auto-remove safe dead code. This keeps the codebase lean and prevents token bloat.

### Mandatory Rules
1. **No Unused Imports** — Every import must be referenced in the file body. Namespace, default, and named imports must be used.
2. **No Unused Local Variables** — Variables must be read, not just declared. If a variable is intentionally unused, prefix its name with `_` (e.g. `_temp`) so Clenzer skips it.
3. **No Unused Private Members** — Class private properties and methods must be referenced within the class.
4. **No Unused Local Declarations** — Local (non-exported) functions, classes, interfaces, type aliases, and enums must be referenced.
5. **Max Function Length: 60 lines** — Extract helper functions if a method or function exceeds this length.
6. **Max Nesting Depth: 4** — Flatten nested logic with early returns, guard clauses, or helper methods.
7. **Max File Size: 600 lines** — Split large files into smaller, focused modules.
8. **No Duplicate Code Blocks** — Extract shared block patterns (6+ lines) into reusable utilities.

### Action Plan for the AI
1. **Onboarding**: Run `register_rules` once at project setup.
2. **On Task Start**: Run `scan_dead_code` and `cleanse` to clear existing debt so you don't inherit it.
3. **During Development**: Follow the code length and nesting constraints.
4. **On Task Completion**: Run `scan_dead_code` followed by `cleanse` to auto-clean your workspace. For any skipped items (e.g. unused exported functions/classes or destructured variables), review them manually and delete them if they are truly unused.

<!-- clenzer:end -->

---

## 🚀 三大关键时机与自动化工作流映射

| 时机与场景 | 对应机制 | 触发方式与关键命令 | 职责与交付目标 |
| :--- | :--- | :--- | :--- |
| **每次编写/修改代码后** | **质量守门 (Quality Gate)** | **Rule: always_on (硬约束)** | 自动调用 `quality_fix`，完成 ESLint + Prettier 自动化修正与格式化，杜绝低级语法与代码风格债务。 |
| **功能模块完成 / 收尾阶段** | **编码后深度清理 (`deep-clean`)** | **Skill（意图触发）+ `/deep-clean`** | 当用户提及“模块完成”、“收尾清理”、“深度清理”或输入 `/deep-clean`，调用 Clenzer 扫描死代码与复杂度，dry-run 确认后清理冗余，并再次联动 `quality_fix`。 |
| **生产发布部署后 / 线上巡检** | **部署后质检 (`deploy-check`)** | **Skill（自动识别）+ `/deploy-check`** | 当执行完 `vercel --prod` 部署、提及“线上质检”、“部署后检查”或输入 `/deploy-check`，调用 `vibe-gate` 执行 6 维度线上安全与页面健康扫描。 |
