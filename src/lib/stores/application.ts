import { writable, derived } from 'svelte/store';
import type { OvertimeApplication, ApplicationStatus, OvertimeType } from '$lib/types';

// 全局申请记录，提交时 push、审批/撤销时更新状态
export const applications = writable<OvertimeApplication[]>([]);

// 草稿（表单填写中），预览页与表单页共享
export const draft = writable<Partial<OvertimeApplication>>({
  overtimeType: undefined,
  startTime: '',
  endTime: '',
  duration: 0,
  compensation: undefined,
  reason: '',
});

// 筛选器
export const filter = writable<{
  status?: ApplicationStatus;
  type?: OvertimeType;
  keyword?: string;
}>({});

// 筛选后的列表（派生：applications + filter 变化时自动重算）
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

// 统计数据（派生：applications 变化时自动重算）
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

    // 按日期聚合趋势
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

// 工具方法：通过 id 查找单条申请
export function findApplication(id: string): OvertimeApplication | undefined {
  let result: OvertimeApplication | undefined;
  const unsub = applications.subscribe(($apps) => {
    result = $apps.find((a) => a.id === id);
  });
  unsub();
  return result;
}
