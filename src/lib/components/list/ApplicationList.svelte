<script lang="ts">
  import type { OvertimeApplication, ApplicationStatus, OvertimeType } from '$lib/types';
  import { LABEL_MAP } from '$lib/types';
  import ApplicationCard from './ApplicationCard.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Card, CardContent } from '$lib/components/ui/card';
  import Inbox from 'lucide-svelte/icons/inbox';
  import { createEventDispatcher } from 'svelte';

  export let loading: boolean = false;

  export let applications: OvertimeApplication[] = [];
  export let filter: { status?: ApplicationStatus; type?: OvertimeType; keyword?: string } = {};

  export let selectable: boolean = false;
  export let selectedIds: Set<string> = new Set();

  const dispatch = createEventDispatcher();

  // 派生筛选结果
  $: filtered = applications.filter((app) => {
    if (filter.status && app.status !== filter.status) return false;
    if (filter.type && app.overtimeType !== filter.type) return false;
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase();
      return (
        app.applicant.name.toLowerCase().includes(kw) ||
        app.reason.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  // 可选择的申请（仅待审批状态）
  $: selectableApps = filtered.filter((app) => app.status === 'pending');

  // 是否全部选中（所有可选择的都被选中）
  $: allSelected = selectableApps.length > 0 && selectableApps.every((a) => selectedIds.has(a.id));

  function handleToggleSelect(e: CustomEvent) {
    const { appId, selected } = e.detail;
    dispatch('toggle-select', { appId, selected });
  }

  function handleSelectAll() {
    dispatch('select-all', { appIds: selectableApps.map((a) => a.id) });
  }

  function handleDeselectAll() {
    dispatch('deselect-all');
  }
</script>

<div class="space-y-3">
  {#if loading}
    {#each [0, 1, 2, 3, 4] as i}
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
    {#if selectable && selectableApps.length > 0}
      <div class="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <button
          on:click={allSelected ? handleDeselectAll : handleSelectAll}
          class="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <input
            type="checkbox"
            checked={allSelected}
            readonly
            class="h-4 w-4 rounded border-gray-300 accent-primary"
          />
          {allSelected ? '取消全选' : '全选待审批'}
        </button>
        <span class="text-xs">（共 {selectableApps.length} 条待审批）</span>
      </div>
    {/if}

    {#each filtered as app (app.id)}
      <ApplicationCard
        {app}
        selectable={selectable && app.status === 'pending'}
        selected={selectedIds.has(app.id)}
        on:open-detail
        on:toggle-select={handleToggleSelect}
      />
    {:else}
      <div class="text-center py-12 text-muted-foreground">
        <Inbox class="mx-auto h-10 w-10 mb-3 opacity-50" />
        <p>暂无符合条件的申请记录</p>
      </div>
    {/each}
  {/if}
</div>