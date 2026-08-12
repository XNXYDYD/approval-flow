/**
 * 统计报表服务端数据加载
 *
 * 在服务端完成聚合计算，客户端直接展示：
 * - 减少传输数据量
 * - 首屏直接展示完整统计
 * - 对搜索引擎友好
 */
import { getAllApplications } from '$lib/server/db';

export async function load() {
  const apps = getAllApplications();

  const totalDuration = apps.reduce(
    (sum, a) => sum + ((a.payload as { duration?: number })?.duration ?? 0),
    0,
  );

  const stats = {
    total: apps.length,
    byStatus: {
      draft: apps.filter((a) => a.status === 'draft').length,
      pending: apps.filter((a) => a.status === 'pending').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      cancelled: apps.filter((a) => a.status === 'cancelled').length,
    },
    byType: aggregateBy(apps, 'type'),
    totalDuration,
  };

  const trendMap = new Map<string, { count: number; duration: number }>();
  apps.forEach((app) => {
    const date = app.createdAt.slice(0, 10);
    const entry = trendMap.get(date) ?? { count: 0, duration: 0 };
    entry.count++;
    entry.duration += (app.payload as { duration?: number })?.duration ?? 0;
    trendMap.set(date, entry);
  });

  const trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return { stats, trend, total: apps.length };
}

function aggregateBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce(
    (acc, item) => {
      const k = String(item[key]);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}
