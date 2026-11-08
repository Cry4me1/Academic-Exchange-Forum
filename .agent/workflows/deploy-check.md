---
name: deploy-check
description: 一键触发生产环境部署后质检（vibe-gate），对生产站点（https://scholarly.wiki）进行 6 维度安全与页面健康扫描并输出修复建议。
---

# /deploy-check 部署后质检工作流

当用户输入 `/deploy-check` 时，立即执行以下标准质检流程：

1. **执行生产站点扫描**：
   ```bash
   npx vibe-gate https://scholarly.wiki
   ```

2. **分析 6 大维度结果**：
   - 认证覆盖 (Auth Coverage - 20%)
   - 密钥暴露 (Secret Exposure - 20%)
   - 安全头 (Security Headers - 25%)
   - 页面健康 (Page Health - 15%)
   - 混合内容 (Mixed Content - 10%)
   - SSL/TLS (10%)

3. **按优先级产出报告与修复建议**：
   - 输出综合评分与分维度明细表；
   - 按照 P0（认证/密钥）> P1（安全头）> P2（页面健康）> P3（混合内容/SSL）列出具体修复措施。
