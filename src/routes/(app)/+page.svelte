<script lang="ts">
  import { onMount } from 'svelte';
  import { statistics, applications, draft } from '$lib/stores/application';
  import { ensureApplicationsLoaded, reloadApplications } from '$lib/utils/loader';
  import { formatDuration } from '$lib/utils/duration';
  import ApplicationCard from '$lib/components/list/ApplicationCard.svelte';
  import ApplicationDetailModal from '$lib/components/common/ApplicationDetailModal.svelte';
  import FormModal from '$lib/components/common/FormModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import type { ComponentType } from 'svelte';
  import type { OvertimeApplication } from '$lib/types';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import Hourglass from 'lucide-svelte/icons/hourglass';
  import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
  import Clock3 from 'lucide-svelte/icons/clock-3';
  import FileEdit from 'lucide-svelte/icons/file-edit';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';

  onMount(async () => {
    await ensureApplicationsLoaded();
    loading = false;
  });

  // 弹窗状态：首页也拥有自己的两个弹窗
  let showFormModal = false;
  let formStep: 'form' | 'preview' = 'form';
  let showDetailModal = false;
  let selectedApp: OvertimeApplication | null = null;

  let loading = true;

  interface StatCard {
    label: string;
    value: string | number;
    icon: ComponentType;
    colorClass: string;
  }

  $: cards = [
    {
      label: '申请总数',
      value: $statistics.total,
      icon: ClipboardList,
      colorClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: '待审批',
      value: $statistics.byStatus.pending,
      icon: Hourglass,
      colorClass: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: '已通过',
      value: $statistics.byStatus.approved,
      icon: CheckCircle2,
      colorClass: 'bg-green-50 text-green-600',
    },
    {
      label: '总加班时长',
      value: formatDuration($statistics.totalDuration),
      icon: Clock3,
      colorClass: 'bg-purple-50 text-purple-600',
    },
  ];

  $: recent = $applications.slice(0, 5);

  function openFormModal() {
    formStep = 'form';
    showFormModal = true;
  }

  function closeFormModal() {
    showFormModal = false;
  }

  function openDetailModal(app: OvertimeApplication) {
    selectedApp = app;
    showDetailModal = true;
  }

  function closeDetailModal() {
    showDetailModal = false;
    selectedApp = null;
  }

  function onCardClick(e: Event) {
    const ce = e as CustomEvent;
    // 不跳转，直接在当前页面打开详情弹窗
    openDetailModal(ce.detail);
  }

  async function handleAppUpdated(e: CustomEvent) {
    // 审批完成后：更新本地选中项 + 刷新全局数据
    selectedApp = e.detail;
    await reloadApplications();
  }

  function handleEditApplication() {
    // 从详情弹窗切换到表单弹窗，draft 数据已由 DetailModal 写入 store
    showDetailModal = false;
    formStep = 'form';
    showFormModal = true;
  }

  async function handleFormSubmitted() {
    // 提交成功后关闭弹窗并刷新数据
    showFormModal = false;
    await reloadApplications();
  }

  // 清理副作用：关闭弹窗时 draft 重置（FormModal 自己会重置，这里兜底）
  let prevShowFormModal = false;
  $: if (prevShowFormModal && !showFormModal) {
    // 确保表单关了后再进草稿是干净的
    draft.update((d) => ({ ...d, duration: 0 }));
  }
  $: prevShowFormModal = showFormModal;
</script>

<svelte:head>
  <title>首页 - 加班申请管理系统</title>
</svelte:head>

<div class="space-y-6">
  <!-- 概览卡片 -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#if loading}
      {#each [0, 1, 2, 3] as i}
        <Card>
          <CardContent class="p-5 flex items-center gap-4">
            <Skeleton class="w-12 h-12 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-3 w-16" />
              <Skeleton class="h-6 w-12" />
            </div>
          </CardContent>
        </Card>
      {/each}
    {:else}
      {#each cards as card}
        <Card>
          <CardContent class="p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center {card.colorClass}">
              <svelte:component this={card.icon} class="h-6 w-6" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">{card.label}</p>
              <p class="text-xl font-bold text-gray-800">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      {/each}
    {/if}
  </div>

  <!-- 快捷入口 -->
  <Card>
    <CardContent class="p-5">
      <h2 class="text-base font-medium mb-3">快捷操作</h2>
      <div class="flex gap-3 flex-wrap">
        <Button on:click={openFormModal} size="sm">
          <FileEdit class="mr-2 h-4 w-4" />
          发起加班申请
        </Button>
        <a
          href="/list"
          class="inline-flex items-center h-9 px-4 text-sm border border-input rounded-md hover:bg-accent transition"
        >
          <ClipboardList class="mr-2 h-4 w-4" />
          查看全部申请
        </a>
        <a
          href="/statistics"
          class="inline-flex items-center h-9 px-4 text-sm border border-input rounded-md hover:bg-accent transition"
        >
          <BarChart3 class="mr-2 h-4 w-4" />
          <span class="text-gray-700">数据统计</span>
        </a>
      </div>
    </CardContent>
  </Card>

  <!-- 最近申请 -->
  <Card>
    <CardContent class="p-5">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-base font-medium">最近申请</h2>
        <a href="/list" class="inline-flex items-center text-sm text-primary hover:underline">
          查看全部
          <ArrowRight class="ml-1 h-4 w-4" />
        </a>
      </div>
      <div class="space-y-3">
        {#if loading}
          {#each [0, 1, 2] as i}
            <Card>
              <CardContent class="p-4 space-y-3">
                <div class="flex justify-between">
                  <Skeleton class="h-4 w-24" />
                  <Skeleton class="h-4 w-12" />
                </div>
                <Skeleton class="h-3 w-full" />
                <Skeleton class="h-3 w-2/3" />
              </CardContent>
            </Card>
          {/each}
        {:else}
          {#each recent as app (app.id)}
            <ApplicationCard {app} on:open-detail={onCardClick} />
          {:else}
            <p class="text-center py-8 text-muted-foreground">暂无申请记录</p>
          {/each}
        {/if}
      </div>
    </CardContent>
  </Card>
</div>

<!-- 首页的发起申请弹窗 -->
<FormModal
  open={showFormModal}
  bind:step={formStep}
  on:close={closeFormModal}
  on:submitted={handleFormSubmitted}
/>

<!-- 首页的详情弹窗：复用同一个组件，不再跳转页面 -->
<ApplicationDetailModal
  open={showDetailModal}
  app={selectedApp}
  on:close={closeDetailModal}
  on:updated={handleAppUpdated}
  on:edit-application={handleEditApplication}
/>
