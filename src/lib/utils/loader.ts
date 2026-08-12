/**
 * 数据加载器 — 支持通用模型
 *
 * 设计说明：
 * - 加载器从 API 获取通用 Application 数据
 * - 通过 setApplicationsFromOvertime 保持旧版组件兼容
 * - 通过 setApplicationsGeneric 支持新代码
 */
import { applications } from '$lib/stores/application';
import { fetchApplications } from '$lib/api/application';
import { setApplicationsFromOvertime } from '$lib/stores/application';

let loaded = false;

export async function ensureApplicationsLoaded(force = false): Promise<void> {
  if (loaded && !force) return;
  const data = await fetchApplications();
  setApplicationsFromOvertime(data);
  loaded = true;
}

export async function reloadApplications(): Promise<void> {
  return ensureApplicationsLoaded(true);
}

export function resetLoadedState(): void {
  loaded = false;
}
