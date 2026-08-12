/**
 * Mock 加班申请数据生成器
 *
 * 设计说明：
 * - 生成 OvertimeApplication 结构（保持兼容）
 * - 通过 adapter 可转换为通用 Application 结构
 * - 分布策略：2026-07 的 4 周内，工作日集中、周末无加班
 */
import type {
  OvertimeApplication,
  OvertimeType,
  Compensation,
  ApplicationStatus,
} from '$lib/types';
import { MOCK_USERS } from './users';

const types: OvertimeType[] = ['workday', 'weekend', 'holiday'];
const compensations: Compensation[] = ['timeoff', 'pay'];
const statuses: ApplicationStatus[] = ['pending', 'approved', 'rejected', 'cancelled'];

const reasons = [
  '项目紧急上线，需要加班完成版本迭代工作',
  '系统故障排查与修复，保障线上服务稳定',
  '客户演示准备，完善产品功能与文档',
  '性能优化专项，处理数据库慢查询问题',
  '版本发布前的回归测试与bug修复',
];

export function generateMockApplications(count = 60): OvertimeApplication[] {
  const startDate = new Date(2026, 6, 1);
  const daysInRange = 28;

  const slots: number[] = [];
  for (let d = 0; d < daysInRange; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dow = date.getDay();

    let numApps = 0;
    if (dow === 0 || dow === 6) {
      numApps = 0;
    } else {
      if (dow === 1) numApps = 2;
      else if (dow === 2) numApps = 3;
      else if (dow === 3) numApps = 4;
      else if (dow === 4) numApps = 3;
      else numApps = 2;
    }

    for (let k = 0; k < numApps; k++) {
      slots.push(d);
    }
  }

  while (slots.length > count) slots.pop();
  while (slots.length < count) {
    for (let d = 0; d < daysInRange && slots.length < count; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) {
        slots.push(d);
      }
    }
  }

  const apps: OvertimeApplication[] = [];
  for (let i = 0; i < slots.length; i++) {
    const d = slots[i];
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);

    const user = MOCK_USERS[i % MOCK_USERS.length];
    const type = types[i % types.length];
    const comp = compensations[i % compensations.length];
    const status = statuses[i % statuses.length];

    const startHour = 18 + (i % 4);
    const start = new Date(date);
    start.setHours(startHour, (i * 15) % 60, 0, 0);
    const hours = 2 + (i % 6);
    const end = new Date(start.getTime() + hours * 3_600_000);

    apps.push({
      id: `app-${i + 1}`,
      applicant: user,
      overtimeType: type,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: hours,
      compensation: comp,
      reason: reasons[i % reasons.length],
      status,
      createdAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0).toISOString(),
      updatedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0).toISOString(),
      approvals:
        status === 'approved' || status === 'rejected'
          ? [
              {
                id: `apr-${i}`,
                approver: MOCK_USERS[1],
                action: status === 'approved' ? 'approve' : 'reject',
                comment: status === 'approved' ? '同意' : '事由不充分，请补充',
                timestamp: new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  14,
                  0,
                ).toISOString(),
              },
            ]
          : [],
    });
  }

  return apps;
}
