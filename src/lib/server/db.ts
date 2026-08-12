/**
 * 服务端内存数据库
 *
 * 说明：
 * - 在服务端独立维护数据，与客户端 mock 隔离
 * - 使用通用 Application 模型存储
 * - 通过 adapter 可转换为旧版 OvertimeApplication
 * - 可快速升级为真实数据库（PostgreSQL / SQLite）
 */
import type { Application, ApplicationStatus } from '$lib/types/application';
import { generateMockApplications } from '$lib/mock/applications';
import { adaptFromOvertime } from '$lib/types/adapter';

let db: Application[] = [];
let initialized = false;

export function initDB(): void {
  if (initialized) return;
  const overtimeApps = generateMockApplications(60);
  db = overtimeApps.map(adaptFromOvertime);
  initialized = true;
}

export function isDBInitialized(): boolean {
  return initialized;
}

/** 获取全部申请 */
export function getAllApplications(): Application[] {
  initDB();
  return [...db];
}

/** 按 ID 获取单条 */
export function getApplicationById(id: string): Application | undefined {
  initDB();
  return db.find((a) => a.id === id);
}

/** 按类型筛选 */
export function getApplicationsByType(type: string): Application[] {
  initDB();
  return db.filter((a) => a.type === type);
}

/** 按状态筛选 */
export function getApplicationsByStatus(status: ApplicationStatus): Application[] {
  initDB();
  return db.filter((a) => a.status === status);
}

/** 创建申请 */
export function createApplication(
  app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
): Application {
  initDB();
  const now = new Date().toISOString();
  const record: Application = {
    ...app,
    id: `app-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  db = [record, ...db];
  return record;
}

/** 更新申请 */
export function updateApplication(
  id: string,
  updates: Partial<Application>,
): Application | undefined {
  initDB();
  db = db.map((app) =>
    app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app,
  );
  return db.find((a) => a.id === id);
}

/** 重置数据库（开发/测试用） */
export function resetDB(): void {
  initialized = false;
  db = [];
}
