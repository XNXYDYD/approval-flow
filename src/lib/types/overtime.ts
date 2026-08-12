/**
 * 加班业务专属类型与配置
 *
 * 设计说明：
 * - 加班业务的 Payload 结构
 * - 加班字段配置（驱动表单渲染）
 * - 加班校验器数组
 * - 注册到业务类型注册表
 */
import type { ApplicationTypeConfig, FieldConfig } from './application';
import { registerApplicationType } from './registry';

export type OvertimeType = 'workday' | 'weekend' | 'holiday';
export type Compensation = 'timeoff' | 'pay';

export interface OvertimePayload {
  overtimeType: OvertimeType;
  startTime: string;
  endTime: string;
  duration: number;
  compensation: Compensation;
  reason: string;
  applicantName?: string;
  departmentName?: string;
  [key: string]: unknown;
}

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

export const overtimeConfig: ApplicationTypeConfig = {
  type: 'overtime',
  label: '加班申请',
  fields: OVERTIME_FIELDS,
  validators: [
    (data) => {
      const p = data as unknown as OvertimePayload;
      if (!p.overtimeType) return '请选择加班类型';
      if (!p.startTime) return '请选择开始时间';
      if (!p.endTime) return '请选择结束时间';
      if (!p.compensation) return '请选择补偿方式';
      if (!p.reason || String(p.reason).trim().length < 10) {
        return '加班事由至少 10 个字符';
      }
      return null;
    },
  ],
};

registerApplicationType(overtimeConfig);
