import type { ApplicationStatus, OvertimeApplication, Applicant } from '$lib/types';

// 状态流转规则：草稿可提交/撤销；待审批可通过/驳回/撤销；
// 驳回后可修改重新提交；已撤销为终态
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['cancelled'],
  rejected: ['pending'], // 驳回后可修改重新提交
  cancelled: [],
};

/** 判断从 from 到 to 的状态流转是否合法 */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 执行状态转换，返回更新后的申请记录（含审批历史）
 * @throws 非法流转时抛出异常
 */
export function transition(
  app: OvertimeApplication,
  nextStatus: ApplicationStatus,
  approver: Applicant,
  comment: string,
): OvertimeApplication {
  if (!canTransition(app.status, nextStatus)) {
    throw new Error(`非法状态流转：${app.status} → ${nextStatus}`);
  }

  const action =
    nextStatus === 'approved' ? 'approve' : nextStatus === 'rejected' ? 'reject' : 'pending';

  return {
    ...app,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    approvals: [
      ...app.approvals,
      {
        id: crypto.randomUUID(),
        approver,
        action,
        comment,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// 根据状态返回可执行的操作（驱动详情页按钮显隐）
export function getAvailableActions(status: ApplicationStatus): string[] {
  switch (status) {
    case 'draft':
      return ['submit', 'cancel'];
    case 'pending':
      return ['approve', 'reject', 'cancel'];
    case 'approved':
      return ['cancel'];
    case 'rejected':
      return ['edit', 'resubmit'];
    case 'cancelled':
      return [];
    default:
      return [];
  }
}

/**
 * 批量状态转换：对一组申请执行同一状态流转
 * @param apps 待处理的申请列表
 * @param nextStatus 目标状态
 * @param approver 审批人
 * @param comment 审批意见
 * @returns { success: OvertimeApplication[], failed: { app: OvertimeApplication; reason: string }[] }
 */
export function batchTransition(
  apps: OvertimeApplication[],
  nextStatus: ApplicationStatus,
  approver: Applicant,
  comment: string,
): { success: OvertimeApplication[]; failed: { app: OvertimeApplication; reason: string }[] } {
  const result = {
    success: [] as OvertimeApplication[],
    failed: [] as { app: OvertimeApplication; reason: string }[],
  };
  for (const app of apps) {
    if (!canTransition(app.status, nextStatus)) {
      result.failed.push({ app, reason: `非法流转：${app.status} → ${nextStatus}` });
    } else {
      result.success.push(transition(app, nextStatus, approver, comment));
    }
  }
  return result;
}
