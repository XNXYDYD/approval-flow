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

  const VIRTUAL_SCROLL_THRESHOLD = 20;
  const ITEM_HEIGHT = 122;
  const OVERSCAN = 3;
  const CONTAINER_HEIGHT = 620;

  // 虚拟滚动状态
  let scrollTop = 0;
  let scrollContainer: HTMLElement;

  // 当筛选后列表长度变化导致滚动位置超出范围时，自动修正
  $: {
    const maxScroll = Math.max(0, filtered.length * ITEM_HEIGHT - CONTAINER_HEIGHT);
    if (scrollTop > maxScroll) {
      scrollTop = maxScroll;
      scrollContainer?.scrollTo(0, maxScroll);
    }
  }

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

  // 是否使用虚拟滚动
  $: useVirtualScroll = filtered.length > VIRTUAL_SCROLL_THRESHOLD;

  // 虚拟滚动派生值
  $: totalHeight = filtered.length * ITEM_HEIGHT;
  $: startIndex = useVirtualScroll
    ? Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
    : 0;
  $: endIndex = useVirtualScroll
    ? Math.min(
        filtered.length,
        Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + OVERSCAN
      )
    : filtered.length;
  $: visibleItems = useVirtualScroll ? filtered.slice(startIndex, endIndex) : filtered;
  $: offsetY = startIndex * ITEM_HEIGHT;

  // 可选择的申请（仅待审批状态）
  $: selectableApps = filtered.filter((app) => app.status === 'pending');

  // 是否全部选中
  $: allSelected = selectableApps.length > 0 && selectableApps.every((a) => selectedIds.has(a.id));

  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    scrollTop = target.scrollTop;
  }

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
  {:else if filtered.length === 0}
    <div class="text-center py-12 text-muted-foreground">
      <Inbox class="mx-auto h-10 w-10 mb-3 opacity-50" />
      <p>暂无符合条件的申请记录</p>
    </div>
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
        {#if useVirtualScroll}
          <span class="text-xs text-muted-foreground/60 ml-auto">虚拟滚动模式（{filtered.length} 条）</span>
        {/if}
      </div>
    {/if}

    {#if useVirtualScroll}
      <div
        bind:this={scrollContainer}
        on:scroll={handleScroll}
        class="app-scrollbar relative overflow-y-auto rounded-lg pr-1"
        style="height: {CONTAINER_HEIGHT}px;"
        role="list"
        aria-label="加班申请列表"
      >
        <div style="height: {totalHeight}px; position: relative;">
          <div style="transform: translateY({offsetY}px);">
            {#each visibleItems as app, i (app.id)}
              <div style="height: {ITEM_HEIGHT}px;" class="px-1 mb-4">
                <ApplicationCard
                  {app}
                  selectable={selectable && app.status === 'pending'}
                  selected={selectedIds.has(app.id)}
                  on:open-detail
                  on:toggle-select={handleToggleSelect}
                />
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="space-y-3">
        {#each filtered as app (app.id)}
          <ApplicationCard
            {app}
            selectable={selectable && app.status === 'pending'}
            selected={selectedIds.has(app.id)}
            on:open-detail
            on:toggle-select={handleToggleSelect}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>
