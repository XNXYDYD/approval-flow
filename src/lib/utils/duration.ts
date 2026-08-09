/**
 * 根据起止时间计算加班时长（小时，保留 1 位小数）
 * @param start ISO 时间字符串
 * @param end   ISO 时间字符串，须晚于 start
 * @returns 小时数；参数非法或 end <= start 时返回 0
 */
export function calcDuration(start: string, end: string): number {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) return 0;
  // 保留一位小数：0.5h 为最小粒度（与考勤系统对齐）
  return Math.round(((endTime - startTime) / 3_600_000) * 10) / 10;
}

/**
 * 将小时数格式化为可读字符串，如 3.5 → "3小时30分钟"
 */
export function formatDuration(hours: number): string {
  if (!hours || hours <= 0) return '0小时';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}
