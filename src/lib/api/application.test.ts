import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MOCK_USERS } from '$lib/mock/users';
import type { OvertimeApplication, ApplicationStatus } from '$lib/types';

// api/application.ts 内部维护模块级 db，用 resetModules + 动态导入隔离每个测试
let api: typeof import('$lib/api/application');

beforeEach(async () => {
  vi.resetModules();
  api = await import('$lib/api/application');
});

describe('fetchApplicationById', () => {
  it('找到存在的申请', async () => {
    const apps = await api.fetchApplications();
    const target = apps[0];
    const found = await api.fetchApplicationById(target.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(target.id);
  });

  it('不存在的 id 返回 undefined', async () => {
    const found = await api.fetchApplicationById('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('空字符串 id 返回 undefined', async () => {
    const found = await api.fetchApplicationById('');
    expect(found).toBeUndefined();
  });

  it('返回的记录内容与 db 内部一致', async () => {
    const apps = await api.fetchApplications();
    const found = await api.fetchApplicationById(apps[0].id);
    expect(found).toEqual(apps[0]);
    // 注意：api 层返回的是 db 内部对象引用（浅拷贝），不是深拷贝
    // 这是已知行为，调用方不应直接修改返回的对象
  });
});

describe('createApplication', () => {
  const validData: Partial<OvertimeApplication> = {
    overtimeType: 'workday',
    startTime: '2026-08-01T18:00',
    endTime: '2026-08-01T20:00',
    duration: 2,
    compensation: 'timeoff',
    reason: '测试创建申请'
  };

  it('创建成功并返回完整记录', async () => {
    const created = await api.createApplication(validData, MOCK_USERS[0]);

    expect(created).toBeDefined();
    expect(created.id).toMatch(/^app-\d+$/);
    expect(created.applicant).toEqual(MOCK_USERS[0]);
    expect(created.overtimeType).toBe('workday');
    expect(created.startTime).toBe('2026-08-01T18:00');
    expect(created.endTime).toBe('2026-08-01T20:00');
    expect(created.duration).toBe(2);
    expect(created.compensation).toBe('timeoff');
    expect(created.reason).toBe('测试创建申请');
    expect(created.status).toBe('pending');
    expect(created.approvals).toEqual([]);
  });

  it('createdAt 和 updatedAt 被设置为当前时间', async () => {
    const before = new Date().toISOString();
    const created = await api.createApplication(validData, MOCK_USERS[1]);
    const after = new Date().toISOString();

    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
    // 时间戳应在调用前后之间（允许 1 秒容差）
    expect(created.createdAt >= before).toBe(true);
    expect(created.createdAt <= after).toBe(true);
    expect(created.createdAt).toBe(created.updatedAt);
  });

  it('新记录插入到 db 头部', async () => {
    const appsBefore = await api.fetchApplications();
    const created = await api.createApplication(validData, MOCK_USERS[2]);
    const appsAfter = await api.fetchApplications();

    expect(appsAfter).toHaveLength(appsBefore.length + 1);
    expect(appsAfter[0].id).toBe(created.id);
  });

  it('创建后可通过 fetchApplicationById 查询到', async () => {
    const created = await api.createApplication(validData, MOCK_USERS[3]);
    const found = await api.fetchApplicationById(created.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
    expect(found?.reason).toBe('测试创建申请');
  });
});

describe('updateApplication', () => {
  it('更新申请状态为 approved', async () => {
    const apps = await api.fetchApplications();
    const target = apps[0];
    const updated = await api.updateApplication(target.id, { status: 'approved' });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('approved');
  });

  it('更新后 updatedAt 自动刷新为当前时间', async () => {
    const apps = await api.fetchApplications();
    const target = apps[0];
    const before = new Date().toISOString();
    const updated = await api.updateApplication(target.id, { status: 'rejected' });
    const after = new Date().toISOString();

    expect(updated?.updatedAt).not.toBe(target.updatedAt);
    expect(updated?.updatedAt >= before).toBe(true);
    expect(updated?.updatedAt <= after).toBe(true);
  });

  it('部分更新不影响其他字段', async () => {
    const apps = await api.fetchApplications();
    const target = apps[0];
    const updated = await api.updateApplication(target.id, { status: 'cancelled' });

    // 未更新的字段应保持原值
    expect(updated?.applicant).toEqual(target.applicant);
    expect(updated?.overtimeType).toBe(target.overtimeType);
    expect(updated?.startTime).toBe(target.startTime);
    expect(updated?.duration).toBe(target.duration);
    expect(updated?.reason).toBe(target.reason);
    // 只有 status 和 updatedAt 变了
    expect(updated?.status).toBe('cancelled');
  });

  it('更新审批历史 approvals', async () => {
    const apps = await api.fetchApplications();
    const target = apps[0];
    const newApproval = {
      id: 'apr-test',
      approver: MOCK_USERS[1],
      action: 'approve' as const,
      comment: '同意',
      timestamp: new Date().toISOString()
    };
    const updated = await api.updateApplication(target.id, { approvals: [...target.approvals, newApproval] });

    expect(updated?.approvals).toHaveLength(target.approvals.length + 1);
    expect(updated?.approvals[updated.approvals.length - 1].id).toBe('apr-test');
  });

  it('不存在的 id 返回 undefined', async () => {
    const updated = await api.updateApplication('non-existent-id', { status: 'approved' });
    expect(updated).toBeUndefined();
  });

  it('更新后持久化生效（再次查询返回新值）', async () => {
    const apps = await api.fetchApplications();
    const target = apps[0];
    const newStatus: ApplicationStatus = 'rejected';
    await api.updateApplication(target.id, { status: newStatus });

    // 再次查询验证持久化
    const found = await api.fetchApplicationById(target.id);
    expect(found?.status).toBe(newStatus);
  });
});

describe('fetchApplications', () => {
  it('返回 60 条 mock 数据', async () => {
    const apps = await api.fetchApplications();
    expect(apps).toHaveLength(60);
  });

  it('返回的是新数组（浅拷贝，数组实例不同）', async () => {
    const apps1 = await api.fetchApplications();
    const apps2 = await api.fetchApplications();
    // 数组是浅拷贝，每次返回新数组实例
    expect(apps1).not.toBe(apps2);
    expect(apps1).toEqual(apps2);
    // 注意：元素仍是 db 内部引用（浅拷贝），调用方不应直接修改元素属性
  });

  it('每条记录包含必需字段', async () => {
    const apps = await api.fetchApplications();
    apps.forEach((app) => {
      expect(app.id).toBeTruthy();
      expect(app.applicant).toBeTruthy();
      expect(app.overtimeType).toBeTruthy();
      expect(app.startTime).toBeTruthy();
      expect(app.endTime).toBeTruthy();
      expect(typeof app.duration).toBe('number');
      expect(app.compensation).toBeTruthy();
      expect(app.reason).toBeTruthy();
      expect(app.status).toBeTruthy();
      expect(app.createdAt).toBeTruthy();
      expect(app.updatedAt).toBeTruthy();
      expect(Array.isArray(app.approvals)).toBe(true);
    });
  });
});
