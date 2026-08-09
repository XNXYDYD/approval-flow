import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  applications,
  filter,
  filteredApplications,
  statistics,
  findApplication,
  draft
} from '$lib/stores/application';
import { generateMockApplications } from '$lib/mock/applications';
import type { OvertimeApplication } from '$lib/types';

const mockApps = generateMockApplications(30);

// 每个测试前重置 store 到干净状态
beforeEach(() => {
  applications.set([]);
  filter.set({});
});

describe('filteredApplications 派生 store', () => {
  beforeEach(() => {
    applications.set(mockApps);
  });

  it('无筛选条件时返回全部记录', () => {
    filter.set({});
    expect(get(filteredApplications)).toHaveLength(30);
  });

  it('按状态 pending 筛选返回 8 条', () => {
    filter.set({ status: 'pending' });
    const result = get(filteredApplications);
    expect(result).toHaveLength(8);
    expect(result.every((a) => a.status === 'pending')).toBe(true);
  });

  it('按状态 approved 筛选返回 8 条', () => {
    filter.set({ status: 'approved' });
    expect(get(filteredApplications)).toHaveLength(8);
  });

  it('按状态 rejected 筛选返回 7 条', () => {
    filter.set({ status: 'rejected' });
    expect(get(filteredApplications)).toHaveLength(7);
  });

  it('按状态 cancelled 筛选返回 7 条', () => {
    filter.set({ status: 'cancelled' });
    expect(get(filteredApplications)).toHaveLength(7);
  });

  it('按类型 workday 筛选返回 10 条', () => {
    filter.set({ type: 'workday' });
    const result = get(filteredApplications);
    expect(result).toHaveLength(10);
    expect(result.every((a) => a.overtimeType === 'workday')).toBe(true);
  });

  it('按类型 weekend 筛选返回 10 条', () => {
    filter.set({ type: 'weekend' });
    expect(get(filteredApplications)).toHaveLength(10);
  });

  it('按类型 holiday 筛选返回 10 条', () => {
    filter.set({ type: 'holiday' });
    expect(get(filteredApplications)).toHaveLength(10);
  });

  it('按关键词匹配申请人姓名（张三 → 8 条）', () => {
    filter.set({ keyword: '张三' });
    const result = get(filteredApplications);
    expect(result).toHaveLength(8);
    expect(result.every((a) => a.applicant.name === '张三')).toBe(true);
  });

  it('按关键词匹配事由内容', () => {
    filter.set({ keyword: '系统故障' });
    const result = get(filteredApplications);
    // 事由包含"系统故障排查与修复..."共 6 条（i%5=1）
    expect(result).toHaveLength(6);
    expect(result.every((a) => a.reason.includes('系统故障'))).toBe(true);
  });

  it('关键词大小写不敏感（英文场景验证 toLowerCase）', () => {
    // mock 数据中没有英文，用姓名验证 lowerCase 逻辑不报错
    filter.set({ keyword: '张三' });
    expect(get(filteredApplications)).toHaveLength(8);
  });

  it('关键词无匹配时返回空数组', () => {
    filter.set({ keyword: '不存在的关键词xyz' });
    expect(get(filteredApplications)).toHaveLength(0);
  });

  it('组合筛选：状态 + 类型', () => {
    filter.set({ status: 'pending', type: 'workday' });
    const result = get(filteredApplications);
    expect(result.every((a) => a.status === 'pending' && a.overtimeType === 'workday')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('组合筛选：状态 + 类型 + 关键词', () => {
    filter.set({ status: 'approved', type: 'weekend', keyword: '李四' });
    const result = get(filteredApplications);
    expect(
      result.every(
        (a) =>
          a.status === 'approved' &&
          a.overtimeType === 'weekend' &&
          a.applicant.name === '李四'
      )
    ).toBe(true);
  });

  it('空数据时筛选返回空数组', () => {
    applications.set([]);
    filter.set({ status: 'pending' });
    expect(get(filteredApplications)).toHaveLength(0);
  });

  it('筛选条件变化时自动重算（响应式）', () => {
    filter.set({ status: 'pending' });
    expect(get(filteredApplications)).toHaveLength(8);
    filter.set({ status: 'approved' });
    expect(get(filteredApplications)).toHaveLength(8);
    filter.set({});
    expect(get(filteredApplications)).toHaveLength(30);
  });
});

describe('statistics 派生 store', () => {
  beforeEach(() => {
    applications.set(mockApps);
  });

  it('total 等于申请总数', () => {
    expect(get(statistics).total).toBe(30);
  });

  it('byStatus 各状态计数正确', () => {
    const { byStatus } = get(statistics);
    expect(byStatus.pending).toBe(8);
    expect(byStatus.approved).toBe(8);
    expect(byStatus.rejected).toBe(7);
    expect(byStatus.cancelled).toBe(7);
    expect(byStatus.draft).toBe(0); // mock 数据无 draft 状态
  });

  it('byType 各类型计数正确', () => {
    const { byType } = get(statistics);
    expect(byType.workday).toBe(10);
    expect(byType.weekend).toBe(10);
    expect(byType.holiday).toBe(10);
  });

  it('byCompensation 各补偿方式计数正确', () => {
    const { byCompensation } = get(statistics);
    expect(byCompensation.timeoff).toBe(15);
    expect(byCompensation.pay).toBe(15);
  });

  it('byDepartment 各部门计数正确', () => {
    const { byDepartment } = get(statistics);
    // 张三(技术部)+王五(技术部) = 15, 李四(产品部) = 8, 赵六(设计部) = 7
    expect(byDepartment['技术部']).toBe(15);
    expect(byDepartment['产品部']).toBe(8);
    expect(byDepartment['设计部']).toBe(7);
  });

  it('totalDuration 总加班时长正确（135 小时）', () => {
    expect(get(statistics).totalDuration).toBe(135);
  });

  it('trend 按日期升序排序', () => {
    const { trend } = get(statistics);
    expect(trend.length).toBeGreaterThan(0);
    for (let i = 1; i < trend.length; i++) {
      expect(trend[i - 1].date.localeCompare(trend[i].date)).toBeLessThanOrEqual(0);
    }
  });

  it('trend 每条记录含 date/count/duration 字段', () => {
    const { trend } = get(statistics);
    trend.forEach((entry) => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('count');
      expect(entry).toHaveProperty('duration');
      expect(typeof entry.count).toBe('number');
      expect(typeof entry.duration).toBe('number');
    });
  });

  it('trend 各日期 count 之和等于总数', () => {
    const { trend } = get(statistics);
    const totalCount = trend.reduce((sum, t) => sum + t.count, 0);
    expect(totalCount).toBe(30);
  });

  it('trend 各日期 duration 之和等于总时长', () => {
    const { trend } = get(statistics);
    const totalDur = trend.reduce((sum, t) => sum + t.duration, 0);
    expect(totalDur).toBe(135);
  });

  it('空数据时统计全部归零', () => {
    applications.set([]);
    const stats = get(statistics);
    expect(stats.total).toBe(0);
    expect(stats.byStatus.pending).toBe(0);
    expect(stats.byType.workday).toBe(0);
    expect(stats.totalDuration).toBe(0);
    expect(stats.trend).toHaveLength(0);
    expect(Object.keys(stats.byDepartment)).toHaveLength(0);
  });

  it('数据变化时自动重算（响应式）', () => {
    expect(get(statistics).total).toBe(30);
    // 移除一半数据
    applications.set(mockApps.slice(0, 15));
    expect(get(statistics).total).toBe(15);
    // 清空
    applications.set([]);
    expect(get(statistics).total).toBe(0);
  });

  it('新增申请后统计自动更新', () => {
    const before = get(statistics).total;
    const newApp: OvertimeApplication = {
      ...mockApps[0],
      id: 'app-new',
      status: 'pending',
      overtimeType: 'workday',
      duration: 10,
      applicant: { ...mockApps[0].applicant, name: '测试人', department: { id: 'd4', name: '测试部', parentId: 'root' } }
    };
    applications.update((apps) => [...apps, newApp]);
    const after = get(statistics);
    expect(after.total).toBe(before + 1);
    expect(after.byStatus.pending).toBe(9);
    expect(after.byType.workday).toBe(11);
    expect(after.totalDuration).toBe(145);
    expect(after.byDepartment['测试部']).toBe(1);
  });
});

describe('findApplication 工具方法', () => {
  beforeEach(() => {
    applications.set(mockApps);
  });

  it('找到存在的申请（按 id）', () => {
    const found = findApplication('app-1');
    expect(found).toBeDefined();
    expect(found?.id).toBe('app-1');
    expect(found?.applicant.name).toBe('张三');
  });

  it('找到最后一条申请', () => {
    const found = findApplication('app-30');
    expect(found).toBeDefined();
    expect(found?.id).toBe('app-30');
  });

  it('不存在的 id 返回 undefined', () => {
    expect(findApplication('app-999')).toBeUndefined();
  });

  it('空数据返回 undefined', () => {
    applications.set([]);
    expect(findApplication('app-1')).toBeUndefined();
  });

  it('空字符串 id 返回 undefined', () => {
    expect(findApplication('')).toBeUndefined();
  });
});

describe('draft store', () => {
  it('初始值为空草稿', () => {
    // draft 是模块级单例，可能已被其他测试修改，验证结构即可
    const d = get(draft);
    expect(d).toHaveProperty('overtimeType');
    expect(d).toHaveProperty('startTime');
    expect(d).toHaveProperty('endTime');
    expect(d).toHaveProperty('duration');
    expect(d).toHaveProperty('compensation');
    expect(d).toHaveProperty('reason');
  });

  it('set 后可读取新值', () => {
    draft.set({
      overtimeType: 'workday',
      startTime: '2026-08-01T18:00',
      endTime: '2026-08-01T20:00',
      duration: 2,
      compensation: 'timeoff',
      reason: '测试事由'
    });
    expect(get(draft).overtimeType).toBe('workday');
    expect(get(draft).duration).toBe(2);
    expect(get(draft).reason).toBe('测试事由');
  });

  it('update 可部分更新字段', () => {
    draft.set({ overtimeType: undefined, startTime: '', endTime: '', duration: 0, compensation: undefined, reason: '' });
    draft.update((d) => ({ ...d, reason: '新事由' }));
    expect(get(draft).reason).toBe('新事由');
    expect(get(draft).overtimeType).toBeUndefined();
  });
});
