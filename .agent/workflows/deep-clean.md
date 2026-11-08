---
name: deep-clean
description: 一键触发功能模块收尾后的深度代码清理与复杂度优化（Clenzer 联动），扫描死代码、dry-run 展示并确认清理，联动 quality_fix 闭环。
---

# /deep-clean 功能模块收尾深度清理工作流

当用户输入 `/deep-clean` 或指令执行模块深度清理时，执行以下标准流程：

1. **死代码扫描**：
   调用 `clenzer.scan_dead_code({ project_root: "d:/project/academic_forum" })`。
2. **复杂度排查**：
   调用 `clenzer.scan_complexity({ project_root: "d:/project/academic_forum" })`。
3. **安全演练 (Dry Run)**：
   调用 `clenzer.cleanse({ project_root: "d:/project/academic_forum", dry_run: true })`，向用户呈报拟清理的代码变更。
4. **用户确认后执行清理**：
   执行 `cleanse({ project_root: "d:/project/academic_forum", dry_run: false })`。
5. **质量守门闭环**：
   调用 `quality_fix` 执行最终 ESLint / Prettier 格式化与合规校验。
