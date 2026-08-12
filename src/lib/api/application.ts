/**
 * Application API 模块
 *
 * 功能说明：
 * - 提供加班申请的 CRUD 接口（增删改查）
 * - 内部使用通用 Application 模型
 * - 对外保持 OvertimeApplication 接口以兼容
 * - 使用内存数据库模拟后端
 *
 * 数据模型：
 * - 内部：Application (通用)
 * - 对外：OvertimeApplication (兼容旧版)
 */
import type { OvertimeApplication, Applicant } from '$lib/types';
import type { Application } from '$lib/types/application';
import type { OvertimePayload } from '$lib/types/overtime';
import { adaptFromOvertime, adaptToOvertime } from '$lib/types/adapter';
import { generateMockApplications } from '$lib/mock/applications';

const DELAY = 200;

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), DELAY));
}

/** 内部通用数据库 */
let db: Application[] = [];
let dbInitialized = false;

function ensureDb(): void {
  if (!dbInitialized) {
    const overtimeApps = generateMockApplications(60);
    db = overtimeApps.map(adaptFromOvertime);
    dbInitialized = true;
  }
}

/** 重置数据库（测试用） */
export function resetDb(): void {
  dbInitialized = false;
  db = [];
}

/** 对外：获取全部加班申请列表（兼容旧版） */
export async function fetchApplications(): Promise<OvertimeApplication[]> {
  ensureDb();
  return delay(db.map(adaptToOvertime));
}

/** 通用：获取全部申请 */
export async function fetchAllApplications(): Promise<Application[]> {
  ensureDb();
  return delay([...db]);
}

/** 通用：按类型获取申请 */
export async function fetchApplicationsByType(type: string): Promise<Application[]> {
  ensureDb();
  return delay(db.filter((a) => a.type === type));
}

/** 对外：根据 ID 获取单条申请详情 */
export async function fetchApplicationById(id: string): Promise<OvertimeApplication | undefined> {
  ensureDb();
  const app = db.find((a) => a.id === id);
  if (!app) return delay(undefined);
  return delay(adaptToOvertime(app));
}

/** 通用：根据 ID 获取单条 */
export async function fetchApplicationByIdGeneric(id: string): Promise<Application | undefined> {
  ensureDb();
  return delay(db.find((a) => a.id === id));
}

/** 对外：创建新的加班申请（兼容旧版参数） */
export async function createApplication(
  data: Partial<OvertimeApplication>,
  applicant: Applicant,
): Promise<OvertimeApplication> {
  ensureDb();
  const now = new Date().toISOString();

  const genericRecord: Application = {
    id: `app-${Date.now()}`,
    type: 'overtime',
    applicantId: applicant.id,
    payload: {
      overtimeType: data.overtimeType ?? 'workday',
      startTime: data.startTime ?? now,
      endTime: data.endTime ?? now,
      duration: data.duration ?? 0,
      compensation: data.compensation ?? 'timeoff',
      reason: data.reason ?? '',
      applicantName: applicant.name,
      departmentName: applicant.department.name,
    } as OvertimePayload,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    approvals: [],
  };

  db = [genericRecord, ...db];
  return delay(adaptToOvertime(genericRecord));
}

/** 通用：创建申请 */
export async function createApplicationGeneric(data: Partial<Application>): Promise<Application> {
  ensureDb();
  const now = new Date().toISOString();
  const record: Application = {
    id: data.id ?? `app-${Date.now()}`,
    type: data.type ?? 'overtime',
    applicantId: data.applicantId ?? '',
    payload: data.payload ?? {},
    status: data.status ?? 'pending',
    approvals: data.approvals ?? [],
    createdAt: now,
    updatedAt: now,
  };
  db = [record, ...db];
  return delay(record);
}

/** 对外：更新单条申请记录 */
export async function updateApplication(
  id: string,
  updates: Partial<OvertimeApplication>,
): Promise<OvertimeApplication | undefined> {
  ensureDb();
  const updatesGeneric: Partial<Application> = {};
  if (updates.status) updatesGeneric.status = updates.status;
  if (updates.approvals) {
    updatesGeneric.approvals = updates.approvals.map((a) => ({
      id: a.id,
      approverId: a.approver.id,
      action: a.action,
      comment: a.comment,
      timestamp: a.timestamp,
    }));
  }

  db = db.map((app) =>
    app.id === id ? { ...app, ...updatesGeneric, updatedAt: new Date().toISOString() } : app,
  );
  const updated = db.find((a) => a.id === id);
  if (!updated) return delay(undefined);
  return delay(adaptToOvertime(updated));
}

/** 通用：更新单条 */
export async function updateApplicationGeneric(
  id: string,
  updates: Partial<Application>,
): Promise<Application | undefined> {
  ensureDb();
  db = db.map((app) =>
    app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app,
  );
  return delay(db.find((a) => a.id === id));
}

/** 对外：批量更新多条申请记录 */
export async function batchUpdateApplications(
  updates: Array<{ id: string; data: Partial<OvertimeApplication> }>,
): Promise<OvertimeApplication[]> {
  ensureDb();
  const now = new Date().toISOString();
  const ids = new Set(updates.map((u) => u.id));

  db = db.map((app) => {
    if (ids.has(app.id)) {
      const match = updates.find((u) => u.id === app.id);
      const genericUpdates: Partial<Application> = { updatedAt: now };
      if (match?.data.status) genericUpdates.status = match.data.status;
      if (match?.data.approvals) {
        genericUpdates.approvals = match.data.approvals.map((a) => ({
          id: a.id,
          approverId: a.approver.id,
          action: a.action,
          comment: a.comment,
          timestamp: a.timestamp,
        }));
      }
      return { ...app, ...genericUpdates };
    }
    return app;
  });

  const updatedGeneric = updates
    .map((u) => db.find((a) => a.id === u.id))
    .filter((a): a is Application => a !== undefined);
  return delay(updatedGeneric.map(adaptToOvertime));
}
