/**
 * 首页服务端数据加载
 *
 * 这是 SvelteKit 服务端能力的核心展示：
 * - 在服务端预渲染数据，首屏更快
 * - 直接访问服务端数据库，无需客户端 mock
 * - 支持 SEO（搜索引擎可抓取页面内容）
 */
import { getAllApplications } from '$lib/server/db';
import { getCurrentUser } from '$lib/server/auth';
import { adaptToOvertime } from '$lib/types/adapter';

export async function load() {
  const apps = getAllApplications();
  const user = getCurrentUser();

  const allOvertimeApps = apps.map(adaptToOvertime);
  const recent = allOvertimeApps.slice(0, 5);

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === 'pending').length,
    approved: apps.filter((a) => a.status === 'approved').length,
    totalDuration: apps.reduce(
      (sum, a) => sum + ((a.payload as { duration?: number })?.duration ?? 0),
      0,
    ),
  };

  return {
    allApps: allOvertimeApps,
    recentApps: recent,
    stats,
    user,
  };
}
