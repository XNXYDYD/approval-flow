/**
 * 兼容适配层
 *
 * 设计说明：
 * - 将通用 Application 转换为旧版 OvertimeApplication 结构
 * - 将旧版 OvertimeApplication 转换为通用 Application 结构
 * - 保证现有组件（表单、列表、详情弹窗等）无需修改
 */
import type { Application, ApprovalRecord } from './application';
import type { OvertimeApplication, Applicant } from './index';
import type { OvertimePayload, OvertimeType, Compensation } from './overtime';
import { MOCK_USERS } from '$lib/mock/users';

export function adaptToOvertime(app: Application): OvertimeApplication {
  const user = MOCK_USERS.find((u) => u.id === app.applicantId) ?? MOCK_USERS[0];
  const p = app.payload as unknown as OvertimePayload;

  return {
    id: app.id,
    applicant: {
      id: user.id,
      name: user.name,
      employeeId: user.employeeId,
      department: user.department,
      email: user.email,
    },
    overtimeType: (p.overtimeType ?? 'workday') as OvertimeType,
    startTime: p.startTime ?? '',
    endTime: p.endTime ?? '',
    duration: p.duration ?? 0,
    compensation: (p.compensation ?? 'timeoff') as Compensation,
    reason: p.reason ?? '',
    status: app.status,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    approvals: app.approvals.map((a) => ({
      id: a.id,
      approver: MOCK_USERS.find((u) => u.id === a.approverId) ?? MOCK_USERS[0],
      action: a.action as 'approve' | 'reject' | 'pending',
      comment: a.comment,
      timestamp: a.timestamp,
    })),
  };
}

export function adaptFromOvertime(app: OvertimeApplication): Application {
  return {
    id: app.id,
    type: 'overtime',
    applicantId: app.applicant.id,
    payload: {
      overtimeType: app.overtimeType,
      startTime: app.startTime,
      endTime: app.endTime,
      duration: app.duration,
      compensation: app.compensation,
      reason: app.reason,
      applicantName: app.applicant.name,
      departmentName: app.applicant.department.name,
    } as OvertimePayload,
    status: app.status,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    approvals: app.approvals.map<ApprovalRecord>((a) => ({
      id: a.id,
      approverId: a.approver.id,
      action: a.action,
      comment: a.comment,
      timestamp: a.timestamp,
    })),
  };
}

export function adaptBatchToOvertime(apps: Application[]): OvertimeApplication[] {
  return apps.map(adaptToOvertime);
}

export function adaptBatchFromOvertime(apps: OvertimeApplication[]): Application[] {
  return apps.map(adaptFromOvertime);
}
