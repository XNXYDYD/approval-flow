<script lang="ts">
  import * as echarts from 'echarts';
  import { onMount, onDestroy } from 'svelte';
  import { LABEL_MAP, type Statistics } from '$lib/types';

  export let statistics: Statistics;
  export let chartType: 'pie' | 'bar' | 'line' = 'pie';
  export let dimension: 'type' | 'status' | 'compensation' | 'trend' | 'department' = 'type';

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

<div bind:this={container} class="w-full h-80"></div>
