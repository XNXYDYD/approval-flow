import { LABEL_MAP, type OvertimeApplication } from '$lib/types';
import type { ECharts } from 'echarts';

/**
 * 将加班申请数据导出为 JSON 文件
 */
export function exportToJSON(
  data: OvertimeApplication[],
  filename: string = 'overtime-applications',
): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
}

/**
 * 将加班申请数据导出为 CSV 文件
 */
export function exportToCSV(
  data: OvertimeApplication[],
  filename: string = 'overtime-applications',
): void {
  const headers = [
    '编号',
    '申请人',
    '工号',
    '部门',
    '加班类型',
    '开始时间',
    '结束时间',
    '加班时长(小时)',
    '补偿方式',
    '加班事由',
    '状态',
    '创建时间',
  ];

  const rows = data.map((app) => [
    app.id,
    app.applicant.name,
    app.applicant.employeeId,
    app.applicant.department.name,
    LABEL_MAP[app.overtimeType] ?? app.overtimeType,
    formatDate(app.startTime),
    formatDate(app.endTime),
    app.duration.toString(),
    LABEL_MAP[app.compensation] ?? app.compensation,
    escapeCSV(app.reason),
    LABEL_MAP[app.status] ?? app.status,
    formatDate(app.createdAt),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  downloadFile('\uFEFF' + csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * 将 ECharts 图表导出为 PNG
 */
export function exportChartToPNG(chart: ECharts, filename: string = 'chart'): void {
  try {
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('导出图表失败:', e);
    throw new Error('导出图表失败');
  }
}

/**
 * 下载文件
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * 格式化日期为本地可读格式
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 转义 CSV 中的特殊字符
 */
export function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
