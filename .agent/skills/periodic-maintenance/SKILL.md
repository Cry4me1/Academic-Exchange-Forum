---
name: periodic-maintenance
description: 周期性维护工作流（数据库健康 + 全局代码卫生）。当用户提到“周期性维护”、“全局体检”、“数据库健康检查”、“代码卫生检查”、“每周巡检”、“维护检查”或输入“/periodic-maintenance”时自动激活此 Skill，执行 Supabase Advisors 安全与性能评估，以及 clenzer 全局死代码和复杂度扫描，并输出精炼的排期建议。
---

# 周期性维护工作流：数据库健康 + 全局代码卫生 (Periodic Maintenance)

## 1. 概述与适用场景

本工作流为 Scholarly 学术论坛定制的周期性全栈“全局体检”标准作业规程（SOP）。  
建议在以下时机触发执行：
- **每周例行巡检**：每周初或周末收尾时执行一次，主动排查线上安全隐患与性能衰退。
- **开启新特性开发前**：在新功能分支开发前执行，排查并清扫积攒的死代码与复杂代码热点，避免“带病开发”。
- **版本发布前回归**：确认未遗漏行级安全（RLS）策略与关键查询索引。

---

## 2. 自动化前置准备与工具映射

### 2.1 依赖工具链
| 工具/MCP 服务 | 工具名 | 用途 |
| :--- | :--- | :--- |
| **supabase_mcp** | `get_advisors` | 获取 Supabase 的安全 (`security`) 与性能 (`performance`) 风险告警 |
| **supabase_mcp** | `list_projects` | 辅助自动探测与匹配项目 Project ID |
| **clenzer** | `scan_dead_code` | 全项目扫描无用导入、未引用的局部变量、废弃私有成员与孤立声明 |
| **clenzer** | `scan_complexity` | 全项目扫描函数长度 (>60行)、嵌套深度 (>4层)、巨型文件 (>600行)、重复代码块 (≥6行) |
| **clenzer** | `report` | 生成高信噪比的优先级诊断摘要报告 |
| **clenzer** | `cleanse` | 安全自动清理无用代码（必须先执行 `dry_run: true`） |

### 2.2 Supabase 项目 ID 自动解析规则
执行第一部分检查前，Agent 必须自动获取 `project_id`，无需用户手动输入：
1. **自动从本地环境变量解析**：读取 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL`，解析其二级域名（例如 `https://<project_id>.supabase.co` 中的 `<project_id>`，本项目中为 `fybtknqeebhhzztfnjah`）。
2. **MCP 回退探测**：若本地环境变量未解析到，调用 `supabase_mcp.list_projects` 获取当前绑定的项目 ID。
3. **人工确认兜底**：若上述两步均未获取成功，向用户简短询问 `project_id`。

---

## 3. 标准执行流程 (SOP)

### 第一阶段：Supabase 数据库健康体检

#### 1. Security 安全扫描
- **调用命令**：`supabase_mcp.get_advisors({ project_id, type: "security" })`
- **解析与筛选规则**：
  - 逐条列出：问题标题、严重等级（`ERROR` / `WARN` / `INFO`）、以及对应的官方 Remediation URL 链接。
  - **RLS 重点筛查**：
    - 凡是涉及 `SECURITY DEFINER` 视图绕过 RLS、新加数据表缺失启用 RLS、或仅开启 RLS 但无具体策略的表，标记为 **高风险/必须优先关注**。
  - **风险决策评估**：
    - 对每条提示客观说明属于“**需立即修复（安全漏洞）**”还是“**当前开发阶段可接受风险（如未开放公网的内部枚举表/开发态配置）**”。

#### 2. Performance 性能扫描
- **调用命令**：`supabase_mcp.get_advisors({ project_id, type: "performance" })`
- **核心业务优先级过滤**：
  - 严格聚焦影响 Scholarly 论坛三大核心查询路径的缺失索引与慢查询隐患：
    1. **帖子列表流**（`posts` 表按发布时间 `created_at`、分类 `category_id`、置顶或精华状态排序与分页）；
    2. **帖子详情与楼层回复**（`comments` 表关联 `post_id`、父子回复嵌套树查询）；
    3. **用户资料与主页动态**（`profiles` 关联查询、用户发帖/点赞聚合）。
  - **噪音过滤**：
    - 忽略与当前论坛数据体量无关的“过度优化”建议（例如针对单表几十条记录的冷门配置表建议建复合索引、超大型分区表建议等）。

---

### 第二阶段：全局代码卫生与安全清理

#### 1. 死代码扫描
- **调用命令**：`clenzer.scan_dead_code({ project_root: "d:/project/academic_forum" })`
- 排查未引用的导入、未使用的局部变量、无外部调用的孤立导出等。

#### 2. 复杂度热点扫描
- **调用命令**：`clenzer.scan_complexity({ project_root: "d:/project/academic_forum" })`
- 排查违反项目代码规约项（单函数 >60 行、嵌套 >4 层、单文件 >600 行、重复代码块）。

#### 3. 生成优先级摘要
- **调用命令**：`clenzer.report({ project_root: "d:/project/academic_forum", top_n: 5 })`
- 提炼项目整体健康度评分与主要债务点。

#### 4. 安全交互式清理 (Human-in-the-loop 防御机制)
- 若扫描到明确可安全移除的无用导入与孤立变量：
  1. **必须首先运行试跑模式**：`clenzer.cleanse({ project_root: "d:/project/academic_forum", dry_run: true })`；
  2. 将 `dry_run` 的拟删除文件列表向用户呈报展示；
  3. **严禁未经用户批准擅自写入修改**。待用户回复“确认清理”后，方可调用 `clenzer.cleanse({ project_root: "d:/project/academic_forum", dry_run: false })` 执行真正清理。

---

## 4. 输出标准模板

Agent 执行完上述两阶段检查后，必须以如下两部分结构向用户汇报：

### 4.1 全局健康体检总览表
```markdown
| 维度 | 分组 / 类别 | 严重级别 | 发现的关键问题 | 影响范围 / 对象 | 处置建议 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **数据库** | Security | ERROR / WARN / INFO | [问题标题及官方 Remediation 链接] | [数据表/视图/函数] | [立即处理 / 可接受风险] |
| **数据库** | Performance | WARN / INFO | [缺失索引 / 潜在全表扫描] | [核心表: posts / comments / profiles] | [建议添加复合索引 / 暂缓] |
| **代码卫生** | 死代码 (Dead Code) | INFO | [发现 N 处无用导入 / M 个未使用变量] | [涉及前端页面 / 组件库] | [已通过 dry_run 罗列，待确认清理] |
| **代码卫生** | 复杂度 (Complexity)| WARN | [函数过长 / 深度嵌套 / 大文件] | [具体的组件路径:行号] | [拆分子组件 / 提取辅助函数] |
```

### 4.2 本周建议处理的 1–3 件事（决策清单）
> 严格遵循精益高杠杆原则：坚决不输出冗长的 20 项待办，仅筛选 **1~3 件** 对安全性、稳定性或开发体验收益最显著的行动项。

- [ ] **行动项 1（P0 - 安全/合规基线）**：`[具体描述与操作，例如：为新引入的 xxx 表补全 RLS 策略并配置 tenant/user 限制]`
- [ ] **行动项 2（P1 - 核心性能与体验）**：`[具体描述与操作，例如：在 posts 表为 (status, created_at DESC) 建立复合索引]`
- [ ] **行动项 3（P2 - 代码重构/死代码清扫）**：`[具体描述与操作，例如：确认并执行 cleanse 清理 15 个无用组件导入]`
