/**
 * 状态机 — 支持通用模型与旧版兼容
 *
 * 设计说明：
 * - 保留现有 OvertimeApplication 接口（兼容旧组件）
 * - 新增 Application 通用接口（支持新代码）
 * - 状态流转规则：draft → pending → approved/rejected → cancelled
 */
import type { ApplicationStatus, OvertimeApplication, Applicant } from '$lib/types';
import type { Application, ApprovalRecord } from '$lib/types/application';
import { adaptFromOvertime, adaptToOvertime } from '$lib/types/adapter';

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['cancelled'],
  rejected: ['pending'],
  cancelled: [],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** 旧版：执行状态转换（OvertimeApplication） */
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

/** 通用：执行状态转换（Application） */
export function transitionGeneric(
  app: Application,
  nextStatus: ApplicationStatus,
  approverId: string,
  comment: string,
): Application {
  if (!canTransition(app.status, nextStatus)) {
    throw new Error(`非法状态流转：${app.status} → ${nextStatus}`);
  }

  const action: ApprovalRecord['action'] =
    nextStatus === 'approved'
      ? 'approve'
      : nextStatus === 'rejected'
        ? 'reject'
        : nextStatus === 'cancelled'
          ? 'pending'
          : 'pending';

  return {
    ...app,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    approvals: [
      ...app.approvals,
      {
        id: crypto.randomUUID(),
        approverId,
        action,
        comment,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/** 旧版：获取可执行操作 */
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

/** 旧版：批量状态转换 */
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

/** 通用：批量状态转换 */
export function batchTransitionGeneric(
  apps: Application[],
  nextStatus: ApplicationStatus,
  approverId: string,
  comment: string,
): { success: Application[]; failed: { app: Application; reason: string }[] } {
  const result = {
    success: [] as Application[],
    failed: [] as { app: Application; reason: string }[],
  };
  for (const app of apps) {
    if (!canTransition(app.status, nextStatus)) {
      result.failed.push({ app, reason: `非法流转：${app.status} → ${nextStatus}` });
    } else {
      result.success.push(transitionGeneric(app, nextStatus, approverId, comment));
    }
  }
  return result;
}
