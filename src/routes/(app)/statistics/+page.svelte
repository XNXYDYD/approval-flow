<script lang="ts">
  import type { PageData } from './$types';
  import { statistics } from '$lib/stores/application';
  import OvertimeChart from '$lib/components/charts/OvertimeChart.svelte';
  import { formatDuration } from '$lib/utils/duration';
  import { Card, CardContent } from '$lib/components/ui/card';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';

  export let data: PageData;

  // 服务端预渲染数据
  $: stats = data?.stats;
  $: trend = data?.trend;
  $: total = data?.total;

  // 概览指标
  $: overview = [
    { label: '申请总数', value: stats?.total ?? total ?? $statistics.total, unit: '条' },
    {
      label: '总加班时长',
      value: formatDuration(stats?.totalDuration ?? $statistics.totalDuration),
      unit: '',
    },
    {
      label: '平均时长',
      value:
        (stats?.totalDuration ?? $statistics.totalDuration) > 0
          ? (
              (stats?.totalDuration ?? $statistics.totalDuration) /
              (stats?.total ?? total ?? $statistics.total)
            ).toFixed(1)
          : '0',
      unit: '小时/次',
    },
    {
      label: '通过率',
      value:
        (stats?.total ?? total ?? $statistics.total) > 0
          ? Math.round(
              ((stats?.byStatus?.approved ?? $statistics.byStatus.approved) /
                (stats?.total ?? total ?? $statistics.total)) *
                100,
            )
          : 0,
      unit: '%',
    },
  ];
</script>

<svelte:head>
  <title>统计报表 - 加班申请管理系统</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-xl font-bold inline-flex items-center gap-2">
    <BarChart3 class="h-6 w-6 text-primary" />
    加班数据统计
  </h1>

  <!-- 概览指标 -->
  <section aria-labelledby="stats-overview">
    <h2 id="stats-overview" class="sr-only">统计概览</h2>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {#each overview as item}
        <Card>
          <CardContent class="p-4 text-center">
            <p class="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p class="text-2xl font-bold text-gray-800">
              {item.value}<span class="text-sm font-normal text-muted-foreground ml-1">
                {item.unit}</span
              >
            </p>
          </CardContent>
        </Card>
      {/each}
    </div>
  </section>

  <!-- 图表区域 -->
  <section aria-labelledby="charts-title">
    <h2 id="charts-title" class="sr-only">图表分析</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card
        ><CardContent class="p-5">
          <OvertimeChart
            statistics={$statistics}
            chartType="pie"
            dimension="type"
            title="加班类型分布"
          />
        </CardContent></Card
      >

      <Card
        ><CardContent class="p-5">
          <OvertimeChart
            statistics={$statistics}
            chartType="bar"
            dimension="status"
            title="申请状态统计"
          />
        </CardContent></Card
      >

      <Card
        ><CardContent class="p-5">
          <OvertimeChart
            statistics={$statistics}
            chartType="pie"
            dimension="compensation"
            title="补偿方式分布"
          />
        </CardContent></Card
      >

      <Card
        ><CardContent class="p-5">
          <OvertimeChart
            statistics={$statistics}
            chartType="bar"
            dimension="department"
            title="部门加班统计"
          />
        </CardContent></Card
      >
    </div>
  </section>

  <!-- 趋势图（全宽） -->
  <section aria-labelledby="trend-title">
    <h2 id="trend-title" class="sr-only">申请趋势</h2>
    <Card
      ><CardContent class="p-5">
        <OvertimeChart
          statistics={$statistics}
          chartType="line"
          dimension="trend"
          title="加班申请趋势"
        />
      </CardContent></Card
    >
  </section>
</div>
