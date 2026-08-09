import { applications } from '$lib/stores/application';
import { fetchApplications } from '$lib/api/application';

// 标记是否已加载，避免重复请求
let loaded = false;

/** 首次调用时从 API 加载申请数据到 store，后续调用跳过 */
export async function ensureApplicationsLoaded(force = false): Promise<void> {
  if (loaded && !force) return;
  const data = await fetchApplications();
  applications.set(data);
  loaded = true;
}

/** 重新加载数据（强制刷新） */
export async function reloadApplications(): Promise<void> {
  return ensureApplicationsLoaded(true);
}
