# 加班申请管理系统

> **项目版本**：v1.0.0
> **技术栈**：SvelteKit + TypeScript + TailwindCSS + Vitest + ECharts

## 项目简介

加班申请管理系统，用于发起、审批和统计加班申请。

## 功能特性

| 功能         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| 发起加班申请 | 申请人信息自动填充，支持加班类型、时段、时长、补偿方式、事由 |
| 预览与修改   | 填写完成后预览信息，支持返回修改                             |
| 申请列表     | 展示加班记录，支持状态、类型筛选与关键词搜索                 |
| 批量操作     | 批量通过、驳回、撤销                                         |
| 申请详情     | 查看完整信息与审批历史                                       |
| 状态流转     | 草稿 → 待审批 → 通过/驳回 → 撤销                             |
| 统计报表     | 多维数据可视化（类型占比、状态统计、月度趋势、部门分布）     |
| 数据导出     | 支持导出 JSON 和 Excel（CSV）                                |
| 错误边界     | 页面异常时展示友好的错误页面                                 |
| 单元测试     | 167 个测试用例                                               |

## 技术栈

| 分类     | 技术               | 版本       |
| -------- | ------------------ | ---------- |
| 框架     | SvelteKit          | 2.x        |
| 语言     | TypeScript         | 5.x        |
| 样式     | TailwindCSS        | 3.x        |
| UI 组件  | shadcn-svelte      | -          |
| 图标     | Lucide Svelte      | -          |
| 图表     | Apache ECharts     | 5.x        |
| 测试     | Vitest             | 1.x        |
| 代码规范 | ESLint + Prettier  | 9.x / 3.x  |
| Git 钩子 | Husky + commitlint | 9.x / 19.x |

## 项目结构

```
approval-flow/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── application.ts              # API 层（内存数据库 + 延迟）
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   └── OvertimeChart.svelte     # ECharts 图表组件
│   │   │   ├── common/
│   │   │   │   ├── Header.svelte           # 顶部导航
│   │   │   │   ├── Sidebar.svelte          # 侧边栏
│   │   │   │   ├── Modal.svelte            # 通用弹窗
│   │   │   │   ├── StatusBadge.svelte      # 状态徽章
│   │   │   │   ├── ErrorBoundary.svelte    # 错误边界组件
│   │   │   │   ├── ToastContainer.svelte   # 提示组件
│   │   │   │   ├── FormModal.svelte        # 表单弹窗
│   │   │   │   └── ApplicationDetailModal.svelte # 详情弹窗
│   │   │   ├── forms/
│   │   │   │   ├── OvertimeForm.svelte     # 加班申请表单
│   │   │   │   └── PreviewForm.svelte      # 申请表单预览
│   │   │   ├── list/
│   │   │   │   ├── ApplicationList.svelte  # 申请列表（虚拟滚动）
│   │   │   │   └── ApplicationCard.svelte  # 申请卡片
│   │   │   └── ui/                         # shadcn-svelte 组件
│   │   ├── mock/
│   │   │   ├── users.ts                    # mock 用户
│   │   │   └── applications.ts             # mock 申请数据
│   │   ├── stores/
│   │   │   ├── application.ts              # 全局状态 + 派生筛选/统计
│   │   │   ├── error.ts                    # 错误管理
│   │   │   └── toast.ts                    # 提示消息
│   │   ├── types/
│   │   │   └── index.ts                    # 类型定义 + 字段配置
│   │   └── utils/
│   │       ├── status.ts                   # 状态流转逻辑
│   │       ├── validators.ts               # 表单校验逻辑
│   │       ├── duration.ts                 # 时长计算逻辑
│   │       ├── loader.ts                   # 数据加载器（带缓存）
│   │       ├── export.ts                   # 数据导出（JSON/CSV）
│   │       └── utils.ts                    # cn() 类名合并工具
│   ├── routes/
│   │   ├── +layout.svelte                  # 根布局
│   │   ├── +layout.ts                      # CSR 布局配置
│   │   ├── +error.svelte                   # 根错误页面
│   │   └── (app)/
│   │       ├── +layout.svelte              # 应用布局
│   │       ├── +error.svelte               # 应用错误页面
│   │       ├── +page.svelte                # 首页仪表盘
│   │       ├── list/+page.svelte           # 列表页
│   │       └── statistics/+page.svelte     # 统计页
│   ├── tests/
│   │   └── setup.ts                        # 测试环境配置
│   ├── app.css                             # 全局样式
│   └── app.html
├── components.json
├── tailwind.config.js
├── postcss.config.js
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── commitlint.config.js
└── package.json
```

## 快速开始

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

应用默认在 `http://localhost:5173` 启动。

### 构建与预览

```bash
npm run build
npm run preview
```

### 代码检查

```bash
npm run check    # TypeScript / Svelte 类型检查
npm run lint      # ESLint 检查
```

### 运行测试

```bash
npm test                # 运行所有测试
npm run test:watch      # 监听模式
```

## 核心功能说明

### 状态流转

```
草稿(draft) → 待审批(pending) → 通过(approved) / 驳回(rejected)
                                      ↓
                                   撤销(cancelled)

已驳回(rejected) → 重新提交 → 待审批(pending)
```

| 当前状态 | 可执行操作       | 目标状态               |
| -------- | ---------------- | ---------------------- |
| 草稿     | 提交、撤销       | 待审批、已撤销         |
| 待审批   | 通过、驳回、撤销 | 已通过、已驳回、已撤销 |
| 已通过   | 撤销             | 已撤销                 |
| 已驳回   | 重新提交         | 待审批                 |
| 已撤销   | 无               | -                      |

### 表单字段

| 字段     | 类型     | 必填             |
| -------- | -------- | ---------------- |
| 加班类型 | Select   | 是               |
| 开始时间 | DateTime | 是               |
| 结束时间 | DateTime | 是               |
| 加班时长 | Number   | 自动计算         |
| 补偿方式 | Select   | 是               |
| 加班事由 | Textarea | 是（至少 10 字） |

### API 层

内存数据库模拟后端，包含 200ms 延迟：

| 方法                                 | 说明                 |
| ------------------------------------ | -------------------- |
| `fetchApplications()`                | 获取全部申请列表     |
| `fetchApplicationById(id)`           | 根据 ID 获取单条申请 |
| `createApplication(data, applicant)` | 创建新申请           |
| `updateApplication(id, updates)`     | 更新申请             |

### 统计维度

| 图表类型 | 维度         | 说明         |
| -------- | ------------ | ------------ |
| 饼图     | type         | 加班类型占比 |
| 柱状图   | status       | 各状态数量   |
| 饼图     | compensation | 补偿方式分布 |
| 柱状图   | department   | 部门加班统计 |
| 折线图   | trend        | 月度加班趋势 |

## 测试覆盖

| 层级     | 文件                              | 用例数  |
| -------- | --------------------------------- | ------- |
| 工具函数 | `utils/duration.test.ts`          | 10      |
| 工具函数 | `utils/status.test.ts`            | 15      |
| 工具函数 | `utils/validators.test.ts`        | 13      |
| 工具函数 | `utils/loader.test.ts`            | 4       |
| 工具函数 | `utils/export.test.ts`            | 5       |
| Store    | `stores/error.test.ts`            | 13      |
| Store    | `stores/application.test.ts`      | 37      |
| API      | `api/application.test.ts`         | 17      |
| 组件     | `StatusBadge.test.ts`             | 8       |
| 组件     | `ApplicationCard.test.ts`         | 10      |
| 组件     | `ApplicationList.test.ts`         | 18      |
| 组件     | `date-time-picker-svelte.test.ts` | 17      |
| **合计** | **12 个文件**                     | **167** |

## 架构说明

### 数据流

```
用户操作 → Action → Store 更新 → 派生 Store 重算 → 组件自动渲染
```

### 组件通信

- 父子组件：Props + Events
- 全局状态：Writable Store
- 派生数据：Derived Store
- 弹窗控制：open prop + onOpenChange（受控模式）

### 路由设计

| 路由          | 页面       | 说明                           |
| ------------- | ---------- | ------------------------------ |
| `/`           | 首页仪表盘 | 统计卡片 + 快捷入口 + 最近申请 |
| `/list`       | 申请列表   | 筛选器 + 卡片列表 + 批量操作   |
| `/statistics` | 统计报表   | ECharts 可视化图表             |

发起申请和查看详情通过弹窗实现，减少页面跳转。

## Git 提交规范

本项目使用 Husky + commitlint 强制遵循 Conventional Commits 规范。

### 提交信息格式

```
<type>(<scope>): <subject>
```

| 字段    | 必填 | 说明                                                       |
| ------- | ---- | ---------------------------------------------------------- |
| type    | 是   | feat/fix/docs/style/refactor/test/build/ci/chore/revert    |
| scope   | 否   | form/list/chart/modal/store/api/utils/ui/mock/types/router |
| subject | 是   | 简短描述（不超过 100 字符）                                |

### 钩子说明

| 钩子       | 触发时机          | 执行内容                    |
| ---------- | ----------------- | --------------------------- |
| pre-commit | git commit 执行前 | `npm run check`（类型检查） |
| commit-msg | 提交信息写入后    | commitlint 校验提交信息格式 |

### 配置文件

- `commitlint.config.js` - 提交信息校验规则
- `.husky/pre-commit` - 预提交钩子
- `.husky/commit-msg` - 提交信息钩子

## License

Private - All rights reserved.
