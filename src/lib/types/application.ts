/**
 * 通用业务申请模型
 *
 * 设计说明：
 * - Application 是所有业务类型的通用基类
 * - 业务专属字段通过 payload 承载（如加班字段、差旅字段）
 * - 通过 type 字段区分业务类型
 * - 与原 OvertimeApplication 兼容，通过 adapter 转换
 */

export type ApplicationType = 'overtime' | 'travel' | 'purchase' | 'reimbursement';

export type ApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export const VALID_STATUSES: ApplicationStatus[] = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'cancelled',
];

export const VALID_TYPES: ApplicationType[] = ['overtime', 'travel', 'purchase', 'reimbursement'];

export interface ApprovalRecord {
  id: string;
  approverId: string;
  action: 'approve' | 'reject' | 'pending' | 'withdraw';
  comment: string;
  timestamp: string;
}

export interface Application {
  id: string;
  type: ApplicationType;
  applicantId: string;
  payload: Record<string, unknown>;
  status: ApplicationStatus;
  approvals: ApprovalRecord[];
  createdAt: string;
  updatedAt: string;
}

export type FieldType = 'text' | 'textarea' | 'number' | 'datetime' | 'select';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface ApplicationTypeConfig {
  type: ApplicationType;
  label: string;
  fields: FieldConfig[];
  validators: Array<(data: Record<string, unknown>) => string | null>;
}
