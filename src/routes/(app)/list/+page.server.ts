/**
 * 列表页服务端数据加载
 *
 * 关键点：
 * - URL 参数在服务端校验（白名单机制）
 * - 支持分页参数（page, pageSize）
 * - 返回分页元数据给客户端
 */
import { getAllApplications } from '$lib/server/db';
import { adaptToOvertime } from '$lib/types/adapter';
import { VALID_STATUSES, VALID_TYPES } from '$lib/types/application';
import type { ApplicationStatus, ApplicationType } from '$lib/types/application';
import type { OvertimeType } from '$lib/types';

export async function load({ url }) {
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const keyword = url.searchParams.get('q');
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

  const validStatus = (VALID_STATUSES as string[]).includes(status ?? '')
    ? (status as ApplicationStatus)
    : undefined;
  const validType = (VALID_TYPES as string[]).includes(type ?? '')
    ? (type as ApplicationType)
    : undefined;

  let apps = getAllApplications();
  if (validStatus) apps = apps.filter((a) => a.status === validStatus);
  if (validType) apps = apps.filter((a) => a.type === validType);
  if (keyword) {
    const kw = keyword.toLowerCase();
    apps = apps.filter((a) => {
      const name = (a.payload as { applicantName?: string })?.applicantName ?? '';
      return name.toLowerCase().includes(kw);
    });
  }

  const total = apps.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const pagedApps = apps.slice(start, start + pageSize).map(adaptToOvertime);

  return {
    applications: pagedApps,
    pagination: { page, pageSize, total, totalPages },
    filters: { status: validStatus, type: validType, keyword: keyword ?? undefined },
  };
}
