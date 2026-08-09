import type { OvertimeApplication, Applicant } from '$lib/types';
import { generateMockApplications } from '$lib/mock/applications';

// 模拟网络延迟
const DELAY = 200;

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), DELAY));
}

// 内存数据源（模拟后端数据库）
let db: OvertimeApplication[] = generateMockApplications(60);

/** 获取全部申请列表 */
export async function fetchApplications(): Promise<OvertimeApplication[]> {
  return delay([...db]);
}

/** 根据 id 获取单条申请 */
export async function fetchApplicationById(id: string): Promise<OvertimeApplication | undefined> {
  return delay(db.find((a) => a.id === id));
}

/** 创建新申请 */
export async function createApplication(
  data: Partial<OvertimeApplication>,
  applicant: Applicant
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
    approvals: []
  };
  db = [record, ...db];
  return delay(record);
}

/** 更新申请（状态流转等） */
export async function updateApplication(
  id: string,
  updates: Partial<OvertimeApplication>
): Promise<OvertimeApplication | undefined> {
  db = db.map((app) =>
    app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app
  );
  return delay(db.find((a) => a.id === id));
}

/** 批量更新申请 */
export async function batchUpdateApplications(
  updates: Array<{ id: string; data: Partial<OvertimeApplication> }>
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
  const updated = updates
    .map((u) => db.find((a) => a.id === u.id))
    .filter((a): a is OvertimeApplication => a !== undefined);
  return delay(updated);
}
