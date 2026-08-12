<script lang="ts">
  import type { PageData } from './$types';
  import {
    statistics,
    applications,
    draft,
    setApplicationsFromOvertime,
  } from '$lib/stores/application';
  import { reloadApplications } from '$lib/utils/loader';
  import { formatDuration } from '$lib/utils/duration';
  import ApplicationCard from '$lib/components/list/ApplicationCard.svelte';
  import ApplicationDetailModal from '$lib/components/common/ApplicationDetailModal.svelte';
  import FormModal from '$lib/components/common/FormModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import type { ComponentType } from 'svelte';
  import type { OvertimeApplication } from '$lib/types';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import Hourglass from 'lucide-svelte/icons/hourglass';
  import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
  import Clock3 from 'lucide-svelte/icons/clock-3';
  import FileEdit from 'lucide-svelte/icons/file-edit';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';

  export let data: PageData;

  // 服务端预渲染数据 — 首屏直接展示，无需 loading
  $: allApps = data?.allApps ?? [];
  $: recent = data?.recentApps ?? [];
  $: stats = data?.stats;
  $: user = data?.user;

  // 初始化 store — 让所有依赖 $applications 的派生 store 正常工作
  $: if (allApps && allApps.length > 0) {
    setApplicationsFromOvertime(allApps);
  }

  // 弹窗状态
  let showFormModal = false;
  let formStep: 'form' | 'preview' = 'form';
  let showDetailModal = false;
  let selectedApp: OvertimeApplication | null = null;

  interface StatCard {
    label: string;
    value: string | number;
    icon: ComponentType;
    colorClass: string;
  }

  $: cards = [
    {
      label: '申请总数',
      value: stats?.total ?? $statistics.total,
      icon: ClipboardList,
      colorClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: '待审批',
      value: stats?.pending ?? $statistics.byStatus.pending,
      icon: Hourglass,
      colorClass: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: '已通过',
      value: stats?.approved ?? $statistics.byStatus.approved,
      icon: CheckCircle2,
      colorClass: 'bg-green-50 text-green-600',
    },
    {
      label: '总加班时长',
      value: formatDuration(stats?.totalDuration ?? $statistics.totalDuration),
      icon: Clock3,
      colorClass: 'bg-purple-50 text-purple-600',
    },
  ];

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
    openDetailModal(ce.detail);
  }

  async function handleAppUpdated(e: CustomEvent) {
    selectedApp = e.detail;
    await reloadApplications();
  }

  function handleEditApplication() {
    showDetailModal = false;
    formStep = 'form';
    showFormModal = true;
  }

  async function handleFormSubmitted() {
    showFormModal = false;
    await reloadApplications();
  }

  let prevShowFormModal = false;
  $: if (prevShowFormModal && !showFormModal) {
    draft.update((d) => ({ ...d, duration: 0 }));
  }
  $: prevShowFormModal = showFormModal;
</script>

<svelte:head>
  <title>首页 - 加班申请管理系统</title>
</svelte:head>

<div class="space-y-6">
  <!-- 页面标题 -->
  <section aria-labelledby="home-title" class="sr-only">
    <h1 id="home-title">工作台</h1>
  </section>

  <!-- 概览卡片 -->
  <section aria-labelledby="overview-title">
    <h2 id="overview-title" class="sr-only">数据概览</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  </section>

  <!-- 快捷入口 -->
  <section aria-labelledby="quick-title">
    <Card>
      <CardContent class="p-5">
        <h2 id="quick-title" class="text-base font-medium mb-3">快捷操作</h2>
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
  </section>

  <!-- 最近申请 -->
  <section aria-labelledby="recent-title">
    <Card>
      <CardContent class="p-5">
        <div class="flex justify-between items-center mb-4">
          <h2 id="recent-title" class="text-base font-medium">最近申请</h2>
          <a href="/list" class="inline-flex items-center text-sm text-primary hover:underline">
            查看全部
            <ArrowRight class="ml-1 h-4 w-4" />
          </a>
        </div>
        <div class="space-y-3">
          {#if recent && recent.length > 0}
            {#each recent as app (app.id)}
              <ApplicationCard {app} on:open-detail={onCardClick} />
            {/each}
          {:else}
            <p class="text-center py-8 text-muted-foreground">暂无申请记录</p>
          {/if}
        </div>
      </CardContent>
    </Card>
  </section>
</div>

<!-- 首页的发起申请弹窗 -->
<FormModal
  open={showFormModal}
  bind:step={formStep}
  on:close={closeFormModal}
  on:submitted={handleFormSubmitted}
/>

<!-- 首页的详情弹窗 -->
<ApplicationDetailModal
  open={showDetailModal}
  app={selectedApp}
  on:close={closeDetailModal}
  on:updated={handleAppUpdated}
  on:edit-application={handleEditApplication}
/>
