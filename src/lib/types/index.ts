// 加班类型
// workday : 工作日加班（按 1.5 倍计）
// weekend : 周末加班（按 2 倍计）
// holiday : 法定节假日加班（按 3 倍计）
export type OvertimeType = 'workday' | 'weekend' | 'holiday';

// 补偿方式
// timeoff : 调休
// pay     : 加班费
export type Compensation = 'timeoff' | 'pay';

// 申请状态：草稿 → 待审批 → 通过/驳回 → 撤销
export type ApplicationStatus =
  | 'draft' // 草稿
  | 'pending' // 待审批
  | 'approved' // 已通过
  | 'rejected' // 已驳回
  | 'cancelled'; // 已撤销

// 申请人信息
export interface Applicant {
  id: string;
  name: string;
  employeeId: string;
  department: Department;
  email: string;
}

// 部门
export interface Department {
  id: string;
  name: string;
  parentId?: string;
}

// 审批记录
export interface ApprovalRecord {
  id: string;
  approver: Applicant;
  action: 'approve' | 'reject' | 'pending';
  comment: string;
  timestamp: string; // ISO 字符串，便于序列化
}

// 加班申请主记录
export interface OvertimeApplication {
  id: string;
  applicant: Applicant;
  overtimeType: OvertimeType;
  startTime: string; // ISO 字符串
  endTime: string; // ISO 字符串
  duration: number; // 小时数
  compensation: Compensation;
  reason: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  approvals: ApprovalRecord[];
}

// 统计数据
export interface Statistics {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byType: Record<OvertimeType, number>;
  byCompensation: Record<Compensation, number>;
  byDepartment: Record<string, number>;
  totalDuration: number; // 总加班时长(小时)
  trend: Array<{ date: string; count: number; duration: number }>;
}

// 字段配置（驱动表单动态渲染）
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

// 加班申请字段配置
export const OVERTIME_FIELDS: FieldConfig[] = [
  {
    key: 'overtimeType',
    label: '加班类型',
    type: 'select',
    options: ['workday', 'weekend', 'holiday'],
    required: true,
    placeholder: '请选择加班类型',
  },
  {
    key: 'startTime',
    label: '开始时间',
    type: 'datetime',
    required: true,
  },
  {
    key: 'endTime',
    label: '结束时间',
    type: 'datetime',
    required: true,
  },
  {
    key: 'duration',
    label: '加班时长(小时)',
    type: 'number',
    required: true,
    min: 0.5,
    max: 24,
  },
  {
    key: 'compensation',
    label: '补偿方式',
    type: 'select',
    options: ['timeoff', 'pay'],
    required: true,
  },
  {
    key: 'reason',
    label: '加班事由',
    type: 'textarea',
    required: true,
    placeholder: '请详细描述加班事由（不少于10个字符）',
  },
];

// 中文标签映射（统一管理 UI 展示文案，避免散落各处）
export const LABEL_MAP: Record<string, string> = {
  workday: '工作日加班',
  weekend: '周末加班',
  holiday: '法定节假日加班',
  timeoff: '调休',
  pay: '加班费',
  draft: '草稿',
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤销',
};
