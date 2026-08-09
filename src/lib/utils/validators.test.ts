import { describe, it, expect } from 'vitest';
import { validateApplication, isValid } from './validators';
import type { OvertimeApplication } from '$lib/types';

const validData: Partial<OvertimeApplication> = {
  overtimeType: 'workday',
  startTime: '2026-08-07T18:00',
  endTime: '2026-08-07T21:00',
  compensation: 'timeoff',
  reason: '项目紧急上线需要加班'
};

describe('validateApplication', () => {
  it('完整数据：无错误', () => {
    expect(Object.keys(validateApplication(validData))).toHaveLength(0);
  });

  it('缺少加班类型', () => {
    const { overtimeType, ...rest } = validData;
    expect(validateApplication(rest).overtimeType).toBe('请选择加班类型');
  });

  it('缺少补偿方式', () => {
    const { compensation, ...rest } = validData;
    expect(validateApplication(rest).compensation).toBe('请选择补偿方式');
  });

  it('缺少开始时间', () => {
    const { startTime, ...rest } = validData;
    expect(validateApplication(rest).startTime).toBe('请选择开始时间');
  });

  it('缺少结束时间', () => {
    const { endTime, ...rest } = validData;
    expect(validateApplication(rest).endTime).toBe('请选择结束时间');
  });

  it('事由不足 10 字', () => {
    expect(validateApplication({ ...validData, reason: '加班' }).reason).toBe(
      '加班事由至少 10 个字符'
    );
  });

  it('事由刚好 10 字：通过', () => {
    expect(validateApplication({ ...validData, reason: '项目紧急上线需要加班' }).reason).toBeUndefined();
  });

  it('结束时间早于开始', () => {
    expect(validateApplication({ ...validData, endTime: '2026-08-07T17:00' }).endTime).toBe(
      '结束时间必须晚于开始时间'
    );
  });

  it('超过 24 小时', () => {
    expect(
      validateApplication({ ...validData, endTime: '2026-08-09T18:00' }).endTime
    ).toBe('单次加班时长不能超过 24 小时');
  });

  it('空对象：所有必填字段报错', () => {
    const errors = validateApplication({});
    expect(errors.overtimeType).toBeDefined();
    expect(errors.startTime).toBeDefined();
    expect(errors.endTime).toBeDefined();
    expect(errors.compensation).toBeDefined();
    expect(errors.reason).toBeDefined();
  });
});

describe('isValid', () => {
  it('完整数据：true', () => {
    expect(isValid(validData)).toBe(true);
  });

  it('缺失数据：false', () => {
    expect(isValid({})).toBe(false);
  });

  it('事由太短：false', () => {
    expect(isValid({ ...validData, reason: '短' })).toBe(false);
  });
});
