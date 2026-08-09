<script lang="ts">
  import { onMount } from 'svelte';
  import { statistics } from '$lib/stores/application';
  import { ensureApplicationsLoaded } from '$lib/utils/loader';
  import OvertimeChart from '$lib/components/charts/OvertimeChart.svelte';
  import { formatDuration } from '$lib/utils/duration';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';

  let loading = true;

  onMount(async () => {
    await ensureApplicationsLoaded();
    loading = false;
  });

  // 概览指标
  $: overview = [
    { label: '申请总数', value: $statistics.total, unit: '条' },
    { label: '总加班时长', value: formatDuration($statistics.totalDuration), unit: '' },
    { label: '平均时长', value: $statistics.total > 0 ? ($statistics.totalDuration / $statistics.total).toFixed(1) : '0', unit: '小时/次' },
    { label: '通过率', value: $statistics.total > 0 ? Math.round(($statistics.byStatus.approved / $statistics.total) * 100) : 0, unit: '%' }
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
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {#if loading}
      {#each [0, 1, 2, 3] as i}
        <Card>
          <CardContent class="p-4 text-center space-y-2">
            <Skeleton class="h-3 w-16 mx-auto" />
            <Skeleton class="h-7 w-20 mx-auto" />
          </CardContent>
        </Card>
      {/each}
    {:else}
      {#each overview as item}
        <Card>
          <CardContent class="p-4 text-center">
            <p class="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p class="text-2xl font-bold text-gray-800">{item.value}<span class="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span></p>
          </CardContent>
        </Card>
      {/each}
    {/if}
  </div>

  <!-- 图表区域 -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card><CardContent class="p-5">
      <OvertimeChart statistics={$statistics} chartType="pie" dimension="type" title="加班类型分布" />
    </CardContent></Card>

    <Card><CardContent class="p-5">
      <OvertimeChart statistics={$statistics} chartType="bar" dimension="status" title="申请状态统计" />
    </CardContent></Card>

    <Card><CardContent class="p-5">
      <OvertimeChart statistics={$statistics} chartType="pie" dimension="compensation" title="补偿方式分布" />
    </CardContent></Card>

    <Card><CardContent class="p-5">
      <OvertimeChart statistics={$statistics} chartType="bar" dimension="department" title="部门加班统计" />
    </CardContent></Card>
  </div>

  <!-- 趋势图（全宽） -->
  <Card><CardContent class="p-5">
    <OvertimeChart statistics={$statistics} chartType="line" dimension="trend" title="加班申请趋势" />
  </CardContent></Card>
</div>
