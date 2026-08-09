# 加班申请管理系统

> **项目版本**：v1.0.0
> **技术栈**：SvelteKit + TypeScript + TailwindCSS + Vitest + Apache ECharts

## 📖 项目简介

加班申请管理系统是一个基于 SvelteKit 全栈框架实现的企业级 OA 应用。用户可以发起加班申请，经过审批流程（草稿 → 待审批 → 通过/驳回 → 撤销），最终完成加班记录的归档与统计分析。

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| **发起加班申请** | 申请人信息自动填充 + 加班类型/时段/时长/补偿方式/事由 |
| **预览与修改** | 填写完成后预览信息，支持返回修改 |
| **申请列表** | 展示所有加班记录，支持状态、类型筛选与关键词搜索 |
| **申请详情** | 查看完整信息、审批流程与状态变更历史 |
| **状态流转** | 完整的状态机：草稿 → 待审批 → 通过/驳回 → 撤销 |
| **统计报表** | 多维数据可视化（类型占比、状态统计、月度趋势、部门分布） |
| **单元测试** | 核心业务逻辑 100% 覆盖，111+ 测试用例 |

## 🛠️ 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 框架 | SvelteKit 2.x | 基于 Svelte 的全栈框架 |
| 语言 | TypeScript 5.x | 类型安全 |
| 样式 | TailwindCSS 3.x | 原子化 CSS |
| UI 组件 | shadcn-svelte | 可定制的 UI 组件源码 |
| 图标 | Lucide Svelte | 专业 SVG 图标库 |
| 图表 | Apache ECharts 5.x | 数据可视化 |
| 测试 | Vitest | 单元测试框架 |
| 测试覆盖 | @vitest/coverage-v8 | 覆盖率收集 |

## 📁 项目结构

```
approval-flow/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── application.ts          # API 层（内存数据库 + 200ms 延迟）
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   └── OvertimeChart.svelte # ECharts 图表组件
│   │   │   ├── common/
│   │   │   │   ├── Header.svelte        # 顶部导航
│   │   │   │   ├── Sidebar.svelte       # 侧边栏
│   │   │   │   ├── Modal.svelte         # 通用弹窗
│   │   │   │   ├── StatusBadge.svelte   # 状态徽章
│   │   │   │   ├── FormModal.svelte     # 表单弹窗（表单→预览→提交）
│   │   │   │   └── ApplicationDetailModal.svelte # 详情弹窗（含审批操作）
│   │   │   ├── forms/
│   │   │   │   ├── OvertimeForm.svelte  # 加班申请表单
│   │   │   │   └── PreviewForm.svelte   # 申请表单预览
│   │   │   ├── list/
│   │   │   │   ├── ApplicationList.svelte # 申请列表
│   │   │   │   └── ApplicationCard.svelte # 申请卡片
│   │   │   └── ui/                       # shadcn-svelte 组件
│   │   ├── mock/
│   │   │   ├── users.ts                 # 4 个 mock 用户
│   │   │   └── applications.ts          # 30 条 mock 申请
│   │   ├── stores/
│   │   │   └── application.ts           # 全局状态 + 派生筛选/统计
│   │   ├── types/
│   │   │   └── index.ts                 # 类型定义 + 字段配置 + 标签映射
│   │   └── utils/
│   │       ├── status.ts                # 状态流转逻辑
│   │       ├── validators.ts            # 表单校验逻辑
│   │       ├── duration.ts              # 时长计算逻辑
│   │       ├── loader.ts                # 数据加载器（带缓存）
│   │       └── utils.ts                 # cn() 类名合并工具
│   ├── routes/
│   │   ├── +layout.svelte               # 根布局
│   │   ├── +layout.ts                   # CSR 布局配置
│   │   └── (app)/
│   │       ├── +layout.svelte           # 应用布局（Header + Sidebar）
│   │       ├── +page.svelte             # 首页仪表盘
│   │       ├── list/+page.svelte        # 列表页
│   │       └── statistics/+page.svelte  # 统计页
│   ├── tests/
│   │   └── setup.ts                     # 测试环境配置
│   ├── app.css                          # 全局样式
│   └── app.html
├── components.json                      # shadcn-svelte 配置
├── tailwind.config.js
├── postcss.config.js
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npm run check
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## 📋 核心功能说明

### 状态流转

系统实现了完整的加班申请状态机：

```
┌──────────────┐
│   草稿(draft) │
└──────┬───────┘
       │ 提交
       ▼
┌──────────────┐
│ 待审批(pending)│
└──┬───┬───┬───┘
   │   │   │
   ▼   ▼   ▼
┌────┐┌─────┐┌──────┐
│通过││驳回 ││撤销  │
└────┘└─────┘└──────┘
   │          │
   │ 撤销     │ 修改后
   ▼          │ 重新提交
┌──────┐      │
│已撤销 │◄─────┘
└──────┘
```

| 当前状态 | 可执行操作 | 目标状态 |
|----------|-----------|----------|
| 草稿 (draft) | 提交、撤销 | 待审批、已撤销 |
| 待审批 (pending) | 通过、驳回、撤销 | 已通过、已驳回、已撤销 |
| 已通过 (approved) | 撤销 | 已撤销 |
| 已驳回 (rejected) | 修改、重新提交 | 待审批 |
| 已撤销 (cancelled) | 无 | - |

### 表单字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 加班类型 | Select | ✅ | 工作日加班 / 周末加班 / 法定节假日加班 |
| 开始时间 | DateTime | ✅ | 精确到分钟 |
| 结束时间 | DateTime | ✅ | 须晚于开始时间 |
| 加班时长 | Number | ✅ | 由起止时间自动计算 |
| 补偿方式 | Select | ✅ | 调休 / 加班费 |
| 加班事由 | Textarea | ✅ | 至少 10 个字符 |

### API 层

项目使用内存数据库模拟后端，包含 200ms 延迟：

| 方法 | 说明 |
|------|------|
| `fetchApplications()` | 获取全部申请列表 |
| `fetchApplicationById(id)` | 根据 ID 获取单条申请 |
| `createApplication(data, applicant)` | 创建新申请（状态默认 pending） |
| `updateApplication(id, updates)` | 更新申请（自动更新 updatedAt） |

### 统计维度

统计报表支持以下可视化维度：

| 图表类型 | 维度 | 说明 |
|----------|------|------|
| 饼图 | type | 加班类型占比 |
| 柱状图 | status | 各状态数量 |
| 饼图 | compensation | 补偿方式分布 |
| 柱状图 | department | 部门加班统计 |
| 折线图 | trend | 月度加班趋势 |

## 🧪 测试覆盖

| 层级 | 文件 | 用例数 | 覆盖目标 |
|------|------|--------|----------|
| 工具函数 | `utils/duration.test.ts` | 10 | 时长计算、格式化 |
| 工具函数 | `utils/status.test.ts` | 15 | 状态流转、操作判断 |
| 工具函数 | `utils/validators.test.ts` | 13 | 表单校验逻辑 |
| 工具函数 | `utils/loader.test.ts` | 4 | 数据加载缓存 |
| Store | `stores/application.test.ts` | 37 | 派生筛选、统计计算 |
| API | `api/application.test.ts` | 17 | CRUD 操作 |
| 组件 | `StatusBadge.test.ts` | 8 | 状态徽章渲染 |
| 组件 | `ApplicationCard.test.ts` | 7 | 申请卡片交互 |
| 组件 | `date-time-picker-svelte.test.ts` | 17 | 日期时间选择器交互 |
| **合计** | | **128** | |

**核心业务逻辑覆盖率**：
- API 层：100%
- Stores 层：100%
- Utils 层：99.37%
- Mock 层：100%
- Types 层：100%

## 🏗️ 架构说明

### 单向数据流

系统通过 Svelte stores 实现响应式数据流：

```
用户操作 → Action → Store 更新 → 派生 Store 重算 → 组件自动渲染
```

### 组件通信

- 父子组件：Props + Events
- 全局状态：Writable Store
- 派生数据：Derived Store
- 弹窗控制：Open + onOpenChange（受控模式）

### 路由设计

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页仪表盘 | 统计卡片 + 快捷入口 + 最近申请 |
| `/list` | 申请列表 | 筛选器 + 卡片列表 |
| `/statistics` | 统计报表 | ECharts 可视化图表 |

> 说明：发起申请和查看详情通过弹窗（FormModal / ApplicationDetailModal）实现，减少页面跳转。

## 📦 技术亮点

1. **类型安全**：TypeScript 全局类型定义，类型推断完善
2. **配置驱动**：`OVERTIME_FIELDS` 数组驱动表单动态渲染
3. **状态机**：`TRANSITIONS` 配置 + `canTransition()` 统一流转判断
4. **派生计算**：`filteredApplications` 和 `statistics` 自动响应数据源变化
5. **单向数据流**：Modal 组件通过 `open` prop + `onOpenChange` 实现受控
6. **数据加载缓存**：`loader.ts` 避免重复 API 请求
7. **Mock 数据可预测**：30 条记录，覆盖各种状态与类型
8. **响应式设计**：支持移动端到桌面端自适应

## 📝 Git 提交规范（Conventional Commits）

本项目使用 **Husky + commitlint** 强制遵循 Conventional Commits 规范。

### 提交信息格式

```
<type>(<scope>): <subject>
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | ✅ | 提交类型 |
| `scope` | ❌ | 影响范围（可选） |
| `subject` | ✅ | 简短描述（不超过 100 字符） |

### type 类型说明

| type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(form): 添加日期时间选择器` |
| `fix` | 修复 Bug | `fix(api): 修复申请创建后数据未刷新` |
| `docs` | 文档变更 | `docs: 更新 README 技术说明` |
| `style` | 代码格式（不影响功能） | `style: 调整 CSS 变量间距` |
| `refactor` | 重构（非新功能、非修复） | `refactor(store): 优化派生统计计算` |
| `perf` | 性能优化 | `perf(list): 优化列表筛选性能` |
| `test` | 增加/修改测试 | `test(status): 补充状态流转边界测试` |
| `build` | 构建系统或外部依赖 | `build: 升级 vite 到 5.2` |
| `ci` | CI 配置 | `ci: 添加 GitHub Actions 工作流` |
| `chore` | 其他杂项 | `chore: 清理 node_modules` |
| `revert` | 回滚 | `revert: 回滚 feat: 添加批量审批` |

### scope 范围建议

| scope | 说明 |
|-------|------|
| `form` | 表单组件 |
| `list` | 列表组件 |
| `chart` | 图表组件 |
| `modal` | 弹窗组件 |
| `store` | 全局状态管理 |
| `api` | API 层 |
| `utils` | 工具函数 |
| `ui` | UI 基础组件 |
| `mock` | Mock 数据 |
| `types` | 类型定义 |
| `router` | 路由/页面 |

### 钩子说明

| 钩子 | 触发时机 | 执行内容 |
|------|----------|----------|
| `pre-commit` | `git commit` 执行前 | `npm run check`（TypeScript / Svelte 类型检查） |
| `commit-msg` | 提交信息写入后 | `commitlint` 校验提交信息格式 |

### 自动初始化

克隆项目后首次 `npm install` 会自动执行 `husky` 初始化钩子。如需手动初始化：

```bash
npx husky
```

### 跳过钩子（不推荐）

在紧急情况下可使用 `--no-verify` 跳过钩子，但不建议日常开发使用：

```bash
git commit --no-verify -m "feat: 紧急修复"
```

### 配置文件

- [commitlint.config.js](./commitlint.config.js) - 提交信息校验规则
- [.husky/pre-commit](./.husky/pre-commit) - 预提交钩子脚本
- [.husky/commit-msg](./.husky/commit-msg) - 提交信息钩子脚本

## 📄 License

Private - All rights reserved.
