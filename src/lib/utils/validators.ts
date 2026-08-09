import type { OvertimeApplication } from '$lib/types';
import { calcDuration } from './duration';

export type ValidationErrors = Partial<Record<keyof OvertimeApplication, string>>;

// 加班事由最小字符数（避免敷衍审批）
const MIN_REASON_LENGTH = 10;
// 单次加班最大时长（依据考勤制度 v2.1）
const MAX_DURATION = 24;

/** 校验加班申请表单数据，返回错误信息映射 */
export function validateApplication(data: Partial<OvertimeApplication>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.overtimeType) {
    errors.overtimeType = '请选择加班类型';
  }

  if (!data.startTime) {
    errors.startTime = '请选择开始时间';
  }

  if (!data.endTime) {
    errors.endTime = '请选择结束时间';
  }

  if (data.startTime && data.endTime) {
    const duration = calcDuration(data.startTime, data.endTime);
    if (duration <= 0) {
      errors.endTime = '结束时间必须晚于开始时间';
    } else if (duration > MAX_DURATION) {
      errors.endTime = `单次加班时长不能超过 ${MAX_DURATION} 小时`;
    }
  }

  if (!data.compensation) {
    errors.compensation = '请选择补偿方式';
  }

  if (!data.reason || data.reason.trim().length < MIN_REASON_LENGTH) {
    errors.reason = `加班事由至少 ${MIN_REASON_LENGTH} 个字符`;
  }

  return errors;
}

/** 判断表单数据是否合法 */
export function isValid(data: Partial<OvertimeApplication>): boolean {
  return Object.keys(validateApplication(data)).length === 0;
}
