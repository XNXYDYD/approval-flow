<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { applications } from '$lib/stores/application';
  import { ensureApplicationsLoaded, reloadApplications } from '$lib/utils/loader';
  import ApplicationList from '$lib/components/list/ApplicationList.svelte';
  import ApplicationCard from '$lib/components/list/ApplicationCard.svelte';
  import FormModal from '$lib/components/common/FormModal.svelte';
  import ApplicationDetailModal from '$lib/components/common/ApplicationDetailModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { LABEL_MAP } from '$lib/types';
  import type { ApplicationStatus, OvertimeType, OvertimeApplication } from '$lib/types';
  import { batchTransition } from '$lib/utils/status';
  import { batchUpdateApplications } from '$lib/api/application';
  import { CURRENT_USER } from '$lib/mock/users';
  import { toastSuccess, toastError } from '$lib/stores/toast';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import FileEdit from 'lucide-svelte/icons/file-edit';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import ArchiveX from 'lucide-svelte/icons/archive-x';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import ListChecks from 'lucide-svelte/icons/list-checks';

  // 弹窗控制状态
  let showFormModal = false;
  let formStep: 'form' | 'preview' = 'form';
  let showDetailModal = false;
  let selectedApp: OvertimeApplication | null = null;
  let loading = true;

  // 筛选器
  let statusFilter: ApplicationStatus | '' = '';
  let typeFilter: OvertimeType | '' = '';
  let keyword = '';

  // 批量操作选中的 ID 集合
  let selectedIds: Set<string> = new Set();
  let batchProcessing = false;
  let batchMode = false;

  // Select 值变化处理
  function onStatusChange(selected: { value: string; label?: string } | undefined) {
    statusFilter = (selected?.value ?? '') as ApplicationStatus;
  }
  function onTypeChange(selected: { value: string; label?: string } | undefined) {
    typeFilter = (selected?.value ?? '') as OvertimeType;
  }
  function toSelected(value: string): { value: string; label?: string } | undefined {
    if (!value) return undefined;
    return { value, label: (LABEL_MAP as Record<string, string>)[value] ?? value };
  }

  onMount(async () => {
    await ensureApplicationsLoaded();
    loading = false;
    const params = $page.url.searchParams;
    const urlStatus = params.get('status') as ApplicationStatus | null;
    const urlType = params.get('type') as OvertimeType | null;
    const urlKeyword = params.get('q');
    if (urlStatus) statusFilter = urlStatus;
    if (urlType) typeFilter = urlType;
    if (urlKeyword) keyword = urlKeyword;
    if (params.get('modal') === 'form') {
      openFormModal();
    } else if (params.get('modal') === 'detail') {
      const id = params.get('id');
      if (id) {
        const app = $applications.find((a) => a.id === id);
        if (app) openDetailModal(app);
      }
    }
  });

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
    keyword: keyword || undefined
  };

  // 筛选后的列表（与 ApplicationList 内部一致）
  $: filteredPendingIds = $applications
    .filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false;
      if (typeFilter && app.overtimeType !== typeFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return app.applicant.name.toLowerCase().includes(kw) || app.reason.toLowerCase().includes(kw);
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

  // 列表事件处理
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

  // 批量操作
  async function handleBatchAction(action: 'approve' | 'reject' | 'cancel') {
    if (selectedIds.size === 0) return;

    const pendingApps = $applications.filter((a) => selectedIds.has(a.id) && a.status === 'pending');
    if (pendingApps.length === 0) return;

    const statusMap: Record<string, ApplicationStatus> = {
      approve: 'approved',
      reject: 'rejected',
      cancel: 'cancelled'
    };
    const targetStatus = statusMap[action];
    const actionLabels: Record<string, string> = { approve: '批量通过', reject: '批量驳回', cancel: '批量撤销' };

    batchProcessing = true;
    try {
      const result = batchTransition(pendingApps, targetStatus, CURRENT_USER, `批量${actionLabels[action]}`);
      if (result.success.length > 0) {
        await batchUpdateApplications(
          result.success.map((app) => ({ id: app.id, data: { status: app.status, approvals: app.approvals } }))
        );
      }
      toastSuccess(
        `${actionLabels[action]}完成`,
        `成功 ${result.success.length} 条${result.failed.length > 0 ? `，失败 ${result.failed.length} 条` : ''}`
      );
      if (result.failed.length > 0) {
        toastError(
          `${result.failed.length} 条记录处理失败`,
          result.failed.map((f) => `${f.app.applicant.name}: ${f.reason}`).join('；')
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
    <Button on:click={openFormModal} size="sm">
      <FileEdit class="mr-2 h-4 w-4" />
      发起申请
    </Button>
  </div>

  <!-- 筛选器 -->
  <div class="bg-white p-4 rounded-lg shadow flex flex-wrap gap-3 items-end">
    <div class="flex flex-col gap-1">
      <Label for="status-filter" class="text-xs text-gray-500">状态</Label>
      <Select
        selected={toSelected(statusFilter)}
        onSelectedChange={onStatusChange}
      >
        <SelectTrigger id="status-filter" class="h-9 w-32">
          <SelectValue placeholder="全部" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="" label="全部">全部</SelectItem>
          {#each Object.entries(LABEL_MAP).filter(([k]) => ['draft','pending','approved','rejected','cancelled'].includes(k)) as [key, label]}
            <SelectItem value={key} label={label}>{label}</SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1">
      <Label for="type-filter" class="text-xs text-gray-500">类型</Label>
      <Select
        selected={toSelected(typeFilter)}
        onSelectedChange={onTypeChange}
      >
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
      <Input id="keyword-filter" type="text" bind:value={keyword} placeholder="搜索申请人或事由..." class="h-9" />
    </div>

    <Button on:click={resetFilter} variant="outline" size="sm">
      重置
    </Button>

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

  <!-- 批量操作栏 -->
  {#if batchMode && hasSelectable}
    <div class="bg-white rounded-lg shadow border border-primary/20 p-3 flex items-center justify-between gap-4">
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
  <ApplicationList
    applications={$applications}
    {filter}
    {loading}
    selectable={batchMode && hasSelectable}
    {selectedIds}
    on:open-detail={onCardClick}
    on:toggle-select={handleToggleSelect}
    on:select-all={handleSelectAll}
    on:deselect-all={handleDeselectAll}
  />
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