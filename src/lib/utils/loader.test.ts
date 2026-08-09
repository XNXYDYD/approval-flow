import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { reloadApplications, ensureApplicationsLoaded } from '$lib/utils/loader';
import { applications } from '$lib/stores/application';

describe('loader 数据加载器', () => {
  beforeEach(async () => {
    // 每次测试前强制刷新数据，确保状态干净
    await reloadApplications();
  });

  it('reloadApplications 会填充 applications store', async () => {
    const lenBefore = get(applications).length;
    await reloadApplications();
    const lenAfter = get(applications).length;
    // Mock 数据默认生成 30 条
    expect(lenAfter).toBeGreaterThanOrEqual(1);
    expect(lenAfter).toBe(lenBefore); // Mock 数据量固定
  });

  it('ensureApplicationsLoaded 调用后 applications 有数据', async () => {
    await ensureApplicationsLoaded();
    expect(get(applications).length).toBeGreaterThan(0);
  });

  it('ensureApplicationsLoaded 连续调用不报错（幂等性）', async () => {
    await ensureApplicationsLoaded();
    const count1 = get(applications).length;
    await ensureApplicationsLoaded();
    const count2 = get(applications).length;
    expect(count1).toBe(count2);
  });

  it('applications 中每条记录含必需字段', () => {
    const app = get(applications)[0];
    expect(app).toHaveProperty('id');
    expect(app).toHaveProperty('applicant');
    expect(app).toHaveProperty('overtimeType');
    expect(app).toHaveProperty('startTime');
    expect(app).toHaveProperty('endTime');
    expect(app).toHaveProperty('duration');
    expect(app).toHaveProperty('status');
  });
});
