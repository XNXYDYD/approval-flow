<script lang="ts">
  import * as echarts from 'echarts';
  import { onMount, onDestroy } from 'svelte';
  import { LABEL_MAP, type Statistics } from '$lib/types';
  import { exportChartToPNG } from '$lib/utils/export';
  import { toastSuccess, toastError } from '$lib/stores/toast';
  import Download from 'lucide-svelte/icons/download';

  export let statistics: Statistics;
  export let chartType: 'pie' | 'bar' | 'line' = 'pie';
  export let dimension: 'type' | 'status' | 'compensation' | 'trend' | 'department' = 'type';
  export let title: string = '';

  let container: HTMLElement;
  let chart: echarts.ECharts | null = null;

  onMount(() => {
    chart = echarts.init(container);
    renderChart();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    window.removeEventListener('resize', handleResize);
    chart?.dispose();
  });

  // 数据变化时自动重绘
  $: if (chart && statistics) {
    renderChart();
  }

  function handleResize() {
    chart?.resize();
  }

  function handleExport() {
    if (!chart) {
      toastError('导出失败', '图表尚未初始化');
      return;
    }
    try {
      exportChartToPNG(chart, title || 'chart');
      toastSuccess('导出成功', '图表已保存为 PNG 图片');
    } catch (e) {
      toastError('导出失败', '请稍后重试');
    }
  }

  // 根据维度提取数据
  function getData(): { labels: string[]; values: number[] } {
    switch (dimension) {
      case 'type':
        return {
          labels: Object.keys(statistics.byType).map((k) => LABEL_MAP[k] ?? k),
          values: Object.values(statistics.byType)
        };
      case 'status':
        return {
          labels: Object.keys(statistics.byStatus).map((k) => LABEL_MAP[k] ?? k),
          values: Object.values(statistics.byStatus)
        };
      case 'compensation':
        return {
          labels: Object.keys(statistics.byCompensation).map((k) => LABEL_MAP[k] ?? k),
          values: Object.values(statistics.byCompensation)
        };
      case 'department':
        return {
          labels: Object.keys(statistics.byDepartment),
          values: Object.values(statistics.byDepartment)
        };
      case 'trend':
        return {
          labels: statistics.trend.map((t) => t.date.slice(5)), // MM-DD
          values: statistics.trend.map((t) => t.count)
        };
      default:
        return { labels: [], values: [] };
    }
  }

  function renderChart() {
    if (!chart) return;
    const { labels, values } = getData();

    const option: echarts.EChartsOption =
      chartType === 'pie'
        ? {
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { bottom: 0 },
            series: [
              {
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: true,
                label: { show: true, formatter: '{b}\n{d}%' },
                data: labels.map((l, i) => ({ name: l, value: values[i] }))
              }
            ]
          }
        : chartType === 'bar'
          ? {
              tooltip: { trigger: 'axis' },
              xAxis: { type: 'category', data: labels, axisLabel: { rotate: labels.length > 5 ? 30 : 0 } },
              yAxis: { type: 'value', minInterval: 1 },
              series: [{ type: 'bar', data: values, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] } }]
            }
          : {
              tooltip: { trigger: 'axis' },
              xAxis: { type: 'category', data: labels, boundaryGap: false },
              yAxis: { type: 'value', minInterval: 1 },
              series: [{ type: 'line', data: values, smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#10b981' } }]
            };

    chart.setOption(option, true);
  }
</script>

<div class="relative w-full">
  {#if title}
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-medium text-gray-700">{title}</h3>
      <button
        type="button"
        on:click={handleExport}
        class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        title="导出为 PNG 图片"
      >
        <Download class="h-3 w-3" />
        导出
      </button>
    </div>
  {/if}
  <div bind:this={container} class="w-full h-72"></div>
</div>
