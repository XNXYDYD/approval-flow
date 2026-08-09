import { describe, it, expect } from 'vitest';
import { canTransition, transition, getAvailableActions } from './status';
import type { OvertimeApplication, Applicant } from '$lib/types';

const mockApplicant: Applicant = {
  id: '1',
  name: '张三',
  employeeId: 'E001',
  department: { id: 'd1', name: '技术部' },
  email: 'z@c.com',
};

const mockApp: OvertimeApplication = {
  id: 'app-1',
  applicant: mockApplicant,
  overtimeType: 'workday',
  startTime: '2026-08-07T18:00',
  endTime: '2026-08-07T21:00',
  duration: 3,
  compensation: 'timeoff',
  reason: '项目紧急上线加班',
  status: 'draft',
  createdAt: '2026-08-07T10:00',
  updatedAt: '2026-08-07T10:00',
  approvals: [],
};

describe('canTransition', () => {
  it('草稿 → 待审批：合法', () => {
    expect(canTransition('draft', 'pending')).toBe(true);
  });

  it('待审批 → 已通过：合法', () => {
    expect(canTransition('pending', 'approved')).toBe(true);
  });

  it('待审批 → 已驳回：合法', () => {
    expect(canTransition('pending', 'rejected')).toBe(true);
  });

  it('已驳回 → 待审批：合法（重新提交）', () => {
    expect(canTransition('rejected', 'pending')).toBe(true);
  });

  it('已通过 → 待审批：非法', () => {
    expect(canTransition('approved', 'pending')).toBe(false);
  });

  it('已撤销 → 任何状态：非法（终态）', () => {
    expect(canTransition('cancelled', 'pending')).toBe(false);
    expect(canTransition('cancelled', 'approved')).toBe(false);
  });
});

describe('transition', () => {
  it('执行转换：状态更新', () => {
    const result = transition(mockApp, 'pending', mockApplicant, '提交审批');
    expect(result.status).toBe('pending');
  });

  it('执行转换：记录审批历史', () => {
    // pending → approved 是合法流转
    const pendingApp = { ...mockApp, status: 'pending' as const };
    const result = transition(pendingApp, 'approved', mockApplicant, '同意');
    expect(result.approvals).toHaveLength(1);
    expect(result.approvals[0].action).toBe('approve');
    expect(result.approvals[0].comment).toBe('同意');
  });

  it('执行转换：不修改原对象', () => {
    const result = transition(mockApp, 'pending', mockApplicant, '');
    expect(result).not.toBe(mockApp);
    expect(mockApp.status).toBe('draft'); // 原对象不变
  });

  it('非法转换：抛出异常', () => {
    expect(() => transition(mockApp, 'approved', mockApplicant, '')).toThrow('非法状态流转');
  });
});

describe('getAvailableActions', () => {
  it('草稿：可提交、撤销', () => {
    expect(getAvailableActions('draft')).toEqual(['submit', 'cancel']);
  });

  it('待审批：可通过、驳回、撤销', () => {
    expect(getAvailableActions('pending')).toEqual(['approve', 'reject', 'cancel']);
  });

  it('已通过：仅可撤销', () => {
    expect(getAvailableActions('approved')).toEqual(['cancel']);
  });

  it('已驳回：可修改、重新提交', () => {
    expect(getAvailableActions('rejected')).toEqual(['edit', 'resubmit']);
  });

  it('已撤销：无操作', () => {
    expect(getAvailableActions('cancelled')).toEqual([]);
  });
});
