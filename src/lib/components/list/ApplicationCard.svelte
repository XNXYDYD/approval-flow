<script lang="ts">
  import type { OvertimeApplication } from '$lib/types';
  import { LABEL_MAP } from '$lib/types';
  import { formatDuration } from '$lib/utils/duration';
  import StatusBadge from '../common/StatusBadge.svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { createEventDispatcher } from 'svelte';

  export let app: OvertimeApplication;
  export let selectable: boolean = false;
  export let selected: boolean = false;

  const dispatch = createEventDispatcher();

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleClick() {
    dispatch('open-detail', app);
  }

  function handleCardKeydown(e: Event) {
    if ((e as KeyboardEvent).key === 'Enter') handleClick();
  }

  function handleCheckboxChange(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    dispatch('toggle-select', { appId: app.id, selected: checked });
  }

  function stopPropagation(e: Event) {
    e.stopPropagation();
  }
</script>

<div
  on:click={handleClick}
  on:keydown={handleCardKeydown}
  role="button"
  tabindex={0}
  class="block cursor-pointer transition-all duration-200"
>
  <Card class="border-transparent hover:border-primary/30 hover:shadow-md transition-all duration-200">
    <CardContent class="p-4">
    <div class="flex items-start gap-3">
      {#if selectable}
        <label class="flex items-center pt-0.5 shrink-0 cursor-pointer" on:click={stopPropagation}>
          <input
            type="checkbox"
            bind:checked={selected}
            on:change={handleCheckboxChange}
            class="h-4 w-4 rounded border-gray-300 accent-primary"
          />
        </label>
      {/if}
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-800">{app.applicant.name}</span>
            <span class="text-xs text-muted-foreground">{app.applicant.department.name}</span>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div class="text-sm text-muted-foreground space-y-1">
          <p>
            <span class="text-muted-foreground/90">{LABEL_MAP[app.overtimeType]}</span>
            <span class="mx-2 text-border">|</span>
            <span>时长 {formatDuration(app.duration)}</span>
            <span class="mx-2 text-border">|</span>
            <span>{LABEL_MAP[app.compensation]}</span>
          </p>
          <p class="text-muted-foreground text-xs">
            {formatTime(app.startTime)} ~ {formatTime(app.endTime)}
          </p>
          <p class="text-muted-foreground truncate mt-1">{app.reason}</p>
        </div>
      </div>
    </div>
    </CardContent>
  </Card>
</div>