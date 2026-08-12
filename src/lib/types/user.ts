/**
 * 用户与部门域模型
 *
 * 设计说明：
 * - User/Department 独立于业务申请，通过 ID 引用
 * - 与原 types/index.ts 中的 Applicant 类型兼容
 * - 为后续多业务场景扩展奠定基础
 */

export interface User {
  id: string;
  name: string;
  employeeId: string;
  departmentId: string;
  email: string;
  role?: 'employee' | 'manager' | 'director' | 'admin';
}

export interface Department {
  id: string;
  name: string;
  parentId?: string;
  managerId?: string;
}

/** 标签映射（通用 + 业务专属分离） */
export const LABEL_MAP: Record<string, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤销',
  workday: '工作日加班',
  weekend: '周末加班',
  holiday: '法定节假日加班',
  timeoff: '调休',
  pay: '加班费',
};
