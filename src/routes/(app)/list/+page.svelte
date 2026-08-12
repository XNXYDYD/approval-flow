<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { applications, setApplicationsFromOvertime } from '$lib/stores/application';
  import { reloadApplications } from '$lib/utils/loader';
  import ApplicationList from '$lib/components/list/ApplicationList.svelte';
  import ApplicationCard from '$lib/components/list/ApplicationCard.svelte';
  import FormModal from '$lib/components/common/FormModal.svelte';
  import ApplicationDetailModal from '$lib/components/common/ApplicationDetailModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '$lib/components/ui/select';
  import { LABEL_MAP } from '$lib/types';
  import type { ApplicationStatus, OvertimeType, OvertimeApplication } from '$lib/types';
  import { batchTransition } from '$lib/utils/status';
  import { batchUpdateApplications } from '$lib/api/application';
  import { CURRENT_USER } from '$lib/mock/users';
  import { toastSuccess, toastError } from '$lib/stores/toast';
  import { exportToJSON, exportToCSV } from '$lib/utils/export';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import FileEdit from 'lucide-svelte/icons/file-edit';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import ArchiveX from 'lucide-svelte/icons/archive-x';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import ListChecks from 'lucide-svelte/icons/list-checks';
  import Download from 'lucide-svelte/icons/download';
  import FileJson from 'lucide-svelte/icons/file-json';
  import FileSpreadsheet from 'lucide-svelte/icons/file-spreadsheet';

  export let data: PageData;

  // 服务端预渲染数据 — 直接从 data 取
  $: serverApps = data?.applications ?? [];
  $: pagination = data?.pagination;
  $: filters = data?.filters ?? {};

  let showFormModal = false;
  let formStep: 'form' | 'preview' = 'form';
  let showDetailModal = false;
  let selectedApp: OvertimeApplication | null = null;

  // 使用服务端传入的 filters 初始化
  let statusFilter: ApplicationStatus | '' = (filters?.status as ApplicationStatus) ?? '';
  let typeFilter: OvertimeType | '' = (filters?.type as OvertimeType) ?? '';
  let keyword = filters?.keyword ?? '';

  const VALID_STATUSES: ApplicationStatus[] = [
    'draft',
    'pending',
    'approved',
    'rejected',
    'cancelled',
  ];
  const VALID_TYPES: OvertimeType[] = ['workday', 'weekend', 'holiday'];
  const VALID_MODALS = ['form', 'detail'] as const;

  let selectedIds: Set<string> = new Set();
  let batchProcessing = false;
  let batchMode = false;

  function onStatusChange(selected: { value: string; label?: string } | undefined) {
    statusFilter = (selected?.value ?? '') as ApplicationStatus;
    clearSelection();
  }
  function onTypeChange(selected: { value: string; label?: string } | undefined) {
    typeFilter = (selected?.value ?? '') as OvertimeType;
    clearSelection();
  }
  function toSelected(value: string): { value: string; label?: string } | undefined {
    if (!value) return undefined;
    return { value, label: (LABEL_MAP as Record<string, string>)[value] ?? value };
  }

  // 从 URL 参数初始化（客户端 hydration 后）
  $: if (browser) {
    const params = $page.url.searchParams;

    const rawStatus = params.get('status');
    if (rawStatus && (VALID_STATUSES as string[]).includes(rawStatus)) {
      statusFilter = rawStatus as ApplicationStatus;
    }

    const rawType = params.get('type');
    if (rawType && (VALID_TYPES as string[]).includes(rawType)) {
      typeFilter = rawType as OvertimeType;
    }

    const urlKeyword = params.get('q');
    if (urlKeyword) keyword = urlKeyword;

    const urlModal = params.get('modal');
    if (urlModal && VALID_MODALS.includes(urlModal as (typeof VALID_MODALS)[number])) {
      if (urlModal === 'form') {
        openFormModal();
      } else if (urlModal === 'detail') {
        const id = params.get('id');
        if (id) {
          const app = serverApps.find((a) => a.id === id);
          if (app) openDetailModal(app);
        }
      }
    }
  }

  $: if (browser) {
    const url = new URL(window.location.href);
    if (statusFilter) url.searchParams.set('status', statusFilter);
    else url.searchParams.delete('status');
    if (typeFilter) url.searchParams.set('type', typeFilter);
    else url.searchParams.delete('type');
    if (keyword) url.searchParams.set('q', keyword);
    else url.searchParams.delete('q');
    goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
  }

  $: filter = {
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    keyword: keyword || undefined,
  };

  $: filteredPendingIds = (serverApps ?? [])
    .filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false;
      if (typeFilter && app.overtimeType !== typeFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          app.applicant.name.toLowerCase().includes(kw) || app.reason.toLowerCase().includes(kw)
        );
      }
      return true;
    })
    .filter((app) => app.status === 'pending')
    .map((app) => app.id);

  $: hasSelectable = filteredPendingIds.length > 0;
  $: selectedCount = selectedIds.size;
  $: allFilteredSelected = hasSelectable && filteredPendingIds.every((id) => selectedIds.has(id));

  function openFormModal() {
    formStep = 'form';
    showFormModal = true;
  }

  function closeFormModal() {
    showFormModal = false;
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.delete('modal');
      url.searchParams.delete('id');
      goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
    }
  }

  function openDetailModal(app: OvertimeApplication) {
    selectedApp = app;
    showDetailModal = true;
  }

  function closeDetailModal() {
    showDetailModal = false;
    selectedApp = null;
    if (browser) {
      const url = new URL(window.location.href);
      url.searchParams.delete('modal');
      url.searchParams.delete('id');
      goto(url.pathname + url.search, { replaceState: true, noScroll: true, keepFocus: true });
    }
  }

  async function handleSubmitted() {
    showFormModal = false;
    await reloadApplications();
  }

  async function handleAppUpdated(e: CustomEvent) {
    selectedApp = e.detail;
    await reloadApplications();
  }

  function handleEditApplication(e: CustomEvent) {
    void e;
    showDetailModal = false;
    formStep = 'form';
    showFormModal = true;
  }

  function resetFilter() {
    statusFilter = '';
    typeFilter = '';
    keyword = '';
    clearSelection();
  }

  function clearSelection() {
    selectedIds = new Set();
  }

  function toggleBatchMode() {
    batchMode = !batchMode;
    if (!batchMode) clearSelection();
  }

  function onCardClick(e: Event) {
    const ce = e as CustomEvent;
    openDetailModal(ce.detail);
  }

  function handleToggleSelect(e: CustomEvent) {
    const { appId, selected } = e.detail;
    const next = new Set(selectedIds);
    if (selected) next.add(appId);
    else next.delete(appId);
    selectedIds = next;
  }

  function handleSelectAll(e: CustomEvent) {
    const { appIds } = e.detail;
    selectedIds = new Set(appIds);
  }

  function handleDeselectAll() {
    selectedIds = new Set();
  }

  async function handleBatchAction(action: 'approve' | 'reject' | 'cancel') {
    if (selectedIds.size === 0) return;

    const pendingApps = (serverApps ?? []).filter(
      (a) => selectedIds.has(a.id) && a.status === 'pending',
    );
    if (pendingApps.length === 0) return;

    const statusMap: Record<string, ApplicationStatus> = {
      approve: 'approved',
      reject: 'rejected',
      cancel: 'cancelled',
    };
    const targetStatus = statusMap[action];
    const actionLabels: Record<string, string> = {
      approve: '批量通过',
      reject: '批量驳回',
      cancel: '批量撤销',
    };

    batchProcessing = true;
    try {
      const result = batchTransition(
        pendingApps,
        targetStatus,
        CURRENT_USER,
        `批量${actionLabels[action]}`,
      );
      if (result.success.length > 0) {
        await batchUpdateApplications(
          result.success.map((app) => ({
            id: app.id,
            data: { status: app.status, approvals: app.approvals },
          })),
        );
      }
      toastSuccess(
        `${actionLabels[action]}完成`,
        `成功 ${result.success.length} 条${result.failed.length > 0 ? `，失败 ${result.failed.length} 条` : ''}`,
      );
      if (result.failed.length > 0) {
        toastError(
          `${result.failed.length} 条记录处理失败`,
          result.failed.map((f) => `${f.app.applicant.name}: ${f.reason}`).join('；'),
        );
      }
      clearSelection();
      await reloadApplications();
    } catch (e) {
      toastError('批量操作失败', '请稍后重试');
    } finally {
      batchProcessing = false;
    }
  }

  $: batchActionsDisabled = selectedCount === 0 || batchProcessing;

  function handleExportJSON() {
    const data = getFilteredApplications();
    if (data.length === 0) {
      toastError('导出失败', '没有可导出的数据');
      return;
    }
    try {
      exportToJSON(data, `加班申请_${new Date().toISOString().slice(0, 10)}`);
      toastSuccess('导出成功', `已导出 ${data.length} 条记录为 JSON 格式`);
    } catch (e) {
      toastError('导出失败', '请稍后重试');
    }
  }

  function handleExportCSV() {
    const data = getFilteredApplications();
    if (data.length === 0) {
      toastError('导出失败', '没有可导出的数据');
      return;
    }
    try {
      exportToCSV(data, `加班申请_${new Date().toISOString().slice(0, 10)}`);
      toastSuccess('导出成功', `已导出 ${data.length} 条记录为 CSV 格式`);
    } catch (e) {
      toastError('导出失败', '请稍后重试');
    }
  }

  function getFilteredApplications(): OvertimeApplication[] {
    return (serverApps ?? []).filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false;
      if (typeFilter && app.overtimeType !== typeFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          app.applicant.name.toLowerCase().includes(kw) || app.reason.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }
</script>

<svelte:head>
  <title>申请列表 - 加班申请管理系统</title>
</svelte:head>

<div class="space-y-4">
  <div class="flex justify-between items-center">
    <h1 class="text-xl font-bold inline-flex items-center gap-2">
      <ClipboardList class="h-5 w-5 text-primary" />
      申请列表
    </h1>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1">
        <Button on:click={handleExportJSON} size="sm" variant="outline" title="导出为 JSON 文件">
          <FileJson class="mr-2 h-4 w-4" />
          导出 JSON
        </Button>
        <Button on:click={handleExportCSV} size="sm" variant="outline" title="导出为 Excel 文件">
          <FileSpreadsheet class="mr-2 h-4 w-4" />
          导出 Excel
        </Button>
      </div>
      <div class="w-px h-6 bg-border mx-1" />
      <Button on:click={openFormModal} size="sm">
        <FileEdit class="mr-2 h-4 w-4" />
        发起申请
      </Button>
    </div>
  </div>

  <!-- 筛选器 -->
  <section aria-labelledby="filter-title">
    <h2 id="filter-title" class="sr-only">筛选条件</h2>
    <div class="bg-white p-4 rounded-lg shadow flex flex-wrap gap-3 items-end">
      <div class="flex flex-col gap-1">
        <Label for="status-filter" class="text-xs text-gray-500">状态</Label>
        <Select selected={toSelected(statusFilter)} onSelectedChange={onStatusChange}>
          <SelectTrigger id="status-filter" class="h-9 w-32">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" label="全部">全部</SelectItem>
            {#each Object.entries(LABEL_MAP).filter( ([k]) => ['draft', 'pending', 'approved', 'rejected', 'cancelled'].includes(k) ) as [key, label]}
              <SelectItem value={key} {label}>{label}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1">
        <Label for="type-filter" class="text-xs text-gray-500">类型</Label>
        <Select selected={toSelected(typeFilter)} onSelectedChange={onTypeChange}>
          <SelectTrigger id="type-filter" class="h-9 w-32">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" label="全部">全部</SelectItem>
            {#each ['workday', 'weekend', 'holiday'] as t}
              <SelectItem value={t} label={LABEL_MAP[t]}>{LABEL_MAP[t]}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1 flex-1 min-w-[200px] max-w-[300px]">
        <Label for="keyword-filter" class="text-xs text-gray-500">搜索</Label>
        <Input
          id="keyword-filter"
          type="text"
          bind:value={keyword}
          placeholder="搜索申请人或事由..."
          class="h-9"
        />
      </div>

      <Button on:click={resetFilter} variant="outline" size="sm">重置</Button>

      <Button
        on:click={toggleBatchMode}
        variant={batchMode ? 'default' : 'outline'}
        size="sm"
        class="gap-1"
      >
        <ListChecks class="h-4 w-4" />
        批量操作
      </Button>
    </div>
  </section>

  <!-- 批量操作栏 -->
  {#if batchMode && hasSelectable}
    <div
      class="bg-white rounded-lg shadow border border-primary/20 p-3 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted-foreground">
          已选中 <span class="font-semibold text-primary">{selectedCount}</span> 条待审批申请
        </span>
        {#if selectedCount > 0}
          <button
            on:click={clearSelection}
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            清空选择
          </button>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          disabled={batchActionsDisabled}
          on:click={() => handleBatchAction('approve')}
        >
          <CheckCircle class="mr-1 h-4 w-4" />
          批量通过
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={batchActionsDisabled}
          on:click={() => handleBatchAction('reject')}
        >
          <XCircle class="mr-1 h-4 w-4" />
          批量驳回
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={batchActionsDisabled}
          on:click={() => handleBatchAction('cancel')}
        >
          <ArchiveX class="mr-1 h-4 w-4" />
          批量撤销
        </Button>
      </div>
    </div>
  {/if}

  <!-- 列表 -->
  <section aria-labelledby="list-title">
    <h2 id="list-title" class="sr-only">申请列表</h2>
    <ApplicationList
      applications={serverApps ?? []}
      {filter}
      loading={false}
      selectable={batchMode && hasSelectable}
      {selectedIds}
      on:open-detail={onCardClick}
      on:toggle-select={handleToggleSelect}
      on:select-all={handleSelectAll}
      on:deselect-all={handleDeselectAll}
    />
  </section>
</div>

<!-- 发起申请弹窗 -->
<FormModal
  open={showFormModal}
  bind:step={formStep}
  on:close={closeFormModal}
  on:submitted={handleSubmitted}
/>

<!-- 详情弹窗 -->
<ApplicationDetailModal
  open={showDetailModal}
  app={selectedApp}
  on:close={closeDetailModal}
  on:updated={handleAppUpdated}
  on:edit-application={handleEditApplication}
/>
