/**
 * 申请 Store — 支持通用模型与旧版兼容
 *
 * 设计说明：
 * - 对外暴露 writable store（OvertimeApplication[]），保持旧版组件兼容
 * - 内部派生通用 Application 视图，供新代码使用
 * - setApplications() / updateApplications() 为旧版写入接口
 * - setApplicationsGeneric() 为通用写入接口
 */
import { writable, derived } from 'svelte/store';
import type { OvertimeApplication, ApplicationStatus, OvertimeType } from '$lib/types';
import type { Application } from '$lib/types/application';
import {
  adaptToOvertime,
  adaptFromOvertime,
  adaptBatchFromOvertime,
  adaptBatchToOvertime,
} from '$lib/types/adapter';

/** 对外主存储（保持 writable，兼容旧版写法 applications.set()） */
const _applicationsOvertime = writable<OvertimeApplication[]>([]);

/** 对外兼容：OvertimeApplication 列表视图（writable，可直接 .set()） */
export const applications = _applicationsOvertime;

/** 通用申请列表（派生自 overtime 存储） */
export const applicationsGeneric = derived(_applicationsOvertime, ($apps) =>
  $apps.map(adaptFromOvertime),
);

/** 草稿（保持旧版结构以兼容） */
export const draft = writable<Partial<OvertimeApplication>>({
  overtimeType: undefined,
  startTime: '',
  endTime: '',
  duration: 0,
  compensation: undefined,
  reason: '',
});

/** 筛选器（保持旧版接口） */
export const filter = writable<{
  status?: ApplicationStatus;
  type?: OvertimeType;
  keyword?: string;
}>({});

/** 筛选后的列表（派生） */
export const filteredApplications = derived([applications, filter], ([$apps, $filter]) =>
  $apps.filter((app) => {
    if ($filter.status && app.status !== $filter.status) return false;
    if ($filter.type && app.overtimeType !== $filter.type) return false;
    if ($filter.keyword) {
      const kw = $filter.keyword.toLowerCase();
      return app.applicant.name.toLowerCase().includes(kw) || app.reason.toLowerCase().includes(kw);
    }
    return true;
  }),
);

/** 统计数据（派生） */
export const statistics = derived(applications, ($apps) => {
  const result = {
    total: $apps.length,
    byStatus: { draft: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 },
    byType: { workday: 0, weekend: 0, holiday: 0 },
    byCompensation: { timeoff: 0, pay: 0 },
    byDepartment: {} as Record<string, number>,
    totalDuration: 0,
    trend: [] as Array<{ date: string; count: number; duration: number }>,
  };

  const trendMap = new Map<string, { count: number; duration: number }>();

  $apps.forEach((app) => {
    result.byStatus[app.status]++;
    result.byType[app.overtimeType]++;
    result.byCompensation[app.compensation]++;
    result.totalDuration += app.duration;

    const dept = app.applicant.department.name;
    result.byDepartment[dept] = (result.byDepartment[dept] ?? 0) + 1;

    const date = app.createdAt.slice(0, 10);
    const entry = trendMap.get(date) ?? { count: 0, duration: 0 };
    entry.count++;
    entry.duration += app.duration;
    trendMap.set(date, entry);
  });

  result.trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return result;
});

/** 通过 id 查找单条申请 */
export function findApplication(id: string): OvertimeApplication | undefined {
  let result: OvertimeApplication | undefined;
  applications.subscribe(($apps) => {
    result = $apps.find((a) => a.id === id);
  })();
  return result;
}

/** 通用：通过 id 查找 */
export function findApplicationGeneric(id: string): Application | undefined {
  let result: Application | undefined;
  applicationsGeneric.subscribe(($apps) => {
    result = $apps.find((a) => a.id === id);
  })();
  return result;
}

/** 兼容旧版：批量更新（从外部传入 OvertimeApplication[]） */
export function setApplicationsFromOvertime(apps: OvertimeApplication[]): void {
  _applicationsOvertime.set(apps);
}

/** 通用：设置为 Application[] */
export function setApplicationsGeneric(apps: Application[]): void {
  _applicationsOvertime.set(adaptBatchToOvertime(apps));
}

/** 通用：追加单条 */
export function prependApplicationGeneric(app: Application): void {
  _applicationsOvertime.update((apps) => [adaptToOvertime(app), ...apps]);
}

/** 通用：更新单条 */
export function updateApplicationGeneric(id: string, updates: Partial<Application>): void {
  _applicationsOvertime.update((apps) => {
    const genericApps = apps.map(adaptFromOvertime);
    const updated = genericApps.map((a) =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a,
    );
    return updated.map(adaptToOvertime);
  });
}

/** 通用：批量更新 */
export function batchUpdateApplicationsGeneric(
  updates: Array<{ id: string; data: Partial<Application> }>,
): void {
  const ids = new Set(updates.map((u) => u.id));
  _applicationsOvertime.update((apps) => {
    const genericApps = apps.map(adaptFromOvertime);
    const now = new Date().toISOString();
    const updated = genericApps.map((app) => {
      if (ids.has(app.id)) {
        const match = updates.find((u) => u.id === app.id);
        return { ...app, ...match?.data, updatedAt: now };
      }
      return app;
    });
    return updated.map(adaptToOvertime);
  });
}
