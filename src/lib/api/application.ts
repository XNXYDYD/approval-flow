/**
 * application API 模块
 *
 * 功能说明：
 * - 提供加班申请的 CRUD 接口（增删改查）
 * - 使用内存数据库模拟后端，便于前端独立开发和测试
 * - 统一模拟 200ms 网络延迟，贴近真实接口体验
 *
 * 数据模型：
 * - OvertimeApplication: 加班申请主记录
 * - Applicant: 申请人信息
 *
 * 注意：当前为 Mock 实现，对接真实后端时需替换为 HTTP 请求
 */
import type { OvertimeApplication, Applicant } from '$lib/types';
import { generateMockApplications } from '$lib/mock/applications';

/** 模拟网络延迟时间（毫秒） */
const DELAY = 200;

/**
 * 通用延迟函数：模拟网络请求的异步响应
 *
 * @param data 任意类型数据
 * @returns 延迟 DELAY 毫秒后返回数据的 Promise
 */
function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), DELAY));
}

/**
 * 内存数据源（模拟后端数据库）
 *
 * 初始加载 60 条 Mock 数据，支持 CRUD 操作
 * 注意：模块级变量，所有 API 操作共享此数据源
 */
let db: OvertimeApplication[] = generateMockApplications(60);

/**
 * 获取全部加班申请列表
 *
 * @returns 申请数组（浅拷贝，防止外部直接修改内部状态）
 *
 * 使用场景：
 * - 首页加载最近申请
 * - 列表页全量展示
 * - 统计页数据聚合
 */
export async function fetchApplications(): Promise<OvertimeApplication[]> {
  // 返回浅拷贝数组，防止外部直接修改 db 引用
  return delay([...db]);
}

/**
 * 根据 ID 获取单条申请详情
 *
 * @param id 申请记录 ID（格式：app-xxx）
 * @returns 申请记录，不存在时返回 undefined
 *
 * 使用场景：
 * - 详情弹窗展示
 * - 编辑模式数据回显
 */
export async function fetchApplicationById(id: string): Promise<OvertimeApplication | undefined> {
  return delay(db.find((a) => a.id === id));
}

/**
 * 创建新的加班申请
 *
 * @param data 表单数据（来自 draft store，包含类型、时间、时长等）
 * @param applicant 当前登录用户信息
 * @returns 创建成功的申请记录（包含生成的 ID 和时间戳）
 *
 * 业务规则：
 * - 新申请状态默认为 pending（待审批）
 * - ID 格式：app-{时间戳}
 * - 初始审批历史为空数组
 * - 新记录插入列表头部，保证最新数据优先可见
 *
 * 异常处理：
 * - 不做字段校验，假设上游已通过 validateApplication 校验
 */
export async function createApplication(
  data: Partial<OvertimeApplication>,
  applicant: Applicant,
): Promise<OvertimeApplication> {
  const now = new Date().toISOString();
  const record: OvertimeApplication = {
    id: `app-${Date.now()}`,
    applicant,
    overtimeType: data.overtimeType!,
    startTime: data.startTime!,
    endTime: data.endTime!,
    duration: data.duration!,
    compensation: data.compensation!,
    reason: data.reason!,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    approvals: [],
  };
  // 新记录插入头部，确保列表展示时最新数据在最前
  db = [record, ...db];
  return delay(record);
}

/**
 * 更新单条申请记录
 *
 * @param id 申请记录 ID
 * @param updates 需要更新的字段（会与原有数据合并）
 * @returns 更新后的记录，不存在时返回 undefined
 *
 * 使用场景：
 * - 状态流转（pending → approved/rejected/cancelled）
 * - 审批历史追加（更新 approvals 数组）
 *
 * 注意：会自动更新 updatedAt 时间戳为当前时间
 */
export async function updateApplication(
  id: string,
  updates: Partial<OvertimeApplication>,
): Promise<OvertimeApplication | undefined> {
  db = db.map((app) =>
    app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app,
  );
  return delay(db.find((a) => a.id === id));
}

/**
 * 批量更新多条申请记录（事务式处理）
 *
 * @param updates 批量更新数组，每项包含 id 和 data
 * @returns 成功更新的记录数组
 *
 * 使用场景：
 * - 批量审批（通过/驳回/撤销多个待审批申请）
 *
 * 业务规则：
 * - 一次性更新所有记录的 updatedAt 时间戳
 * - 仅返回成功匹配的记录
 *
 * 注意：当前为 Mock 实现，无真实事务支持
 *       如需原子性保证，应在数据库层面实现
 */
export async function batchUpdateApplications(
  updates: Array<{ id: string; data: Partial<OvertimeApplication> }>,
): Promise<OvertimeApplication[]> {
  const now = new Date().toISOString();
  const ids = new Set(updates.map((u) => u.id));
  db = db.map((app) => {
    if (ids.has(app.id)) {
      const match = updates.find((u) => u.id === app.id);
      return { ...app, ...match?.data, updatedAt: now };
    }
    return app;
  });
  // 返回成功匹配的记录（过滤掉已删除或不存在的 ID）
  const updated = updates
    .map((u) => db.find((a) => a.id === u.id))
    .filter((a): a is OvertimeApplication => a !== undefined);
  return delay(updated);
}
