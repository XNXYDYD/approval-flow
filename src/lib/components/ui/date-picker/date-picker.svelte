<script lang="ts">
  import { Popover as PopoverPrimitive } from 'bits-ui';
  import { format, parseISO } from 'date-fns';
  import { cn, flyAndScale } from '$lib/utils';
  import { Calendar } from '$lib/components/ui/calendar';
  import { Button } from '$lib/components/ui/button';
  import CalendarIcon from 'lucide-svelte/icons/calendar';
  import { createEventDispatcher } from 'svelte';

  export let value: string = '';
  export let placeholder: string = '选择日期';
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;

  let className: string | undefined = undefined;
  export { className as class };

  const dispatch = createEventDispatcher();

  let open = false;
  let selectedDate: Date | undefined = undefined;

  $: {
    if (value) {
      try {
        selectedDate = parseISO(value);
      } catch {
        selectedDate = undefined;
      }
    } else {
      selectedDate = undefined;
    }
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;

    selectedDate = date;
    let hours = 0;
    let minutes = 0;
    if (value) {
      try {
        const existing = parseISO(value);
        hours = existing.getHours();
        minutes = existing.getMinutes();
      } catch {
        // ignore invalid existing value
      }
    }
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    value = result.toISOString();
    dispatch('change', result.toISOString());
    open = false;
  }

  function handleTimeChange(type: 'hour' | 'minute', val: string) {
    const num = parseInt(val, 10);
    if (Number.isNaN(num)) return;

    const base = selectedDate ? new Date(selectedDate) : new Date();
    if (type === 'hour') {
      base.setHours(Math.min(23, Math.max(0, num)));
    } else {
      base.setMinutes(Math.min(59, Math.max(0, num)));
    }

    selectedDate = base;
    value = base.toISOString();
    dispatch('change', value);
  }

  function getFormattedDate() {
    if (!value) return '';
    try {
      return format(parseISO(value), 'yyyy/MM/dd HH:mm');
    } catch {
      return '';
    }
  }

  function getHour() {
    if (!value) return '00';
    try {
      return String(parseISO(value).getHours()).padStart(2, '0');
    } catch {
      return '00';
    }
  }

  function getMinute() {
    if (!value) return '00';
    try {
      return String(parseISO(value).getMinutes()).padStart(2, '0');
    } catch {
      return '00';
    }
  }
</script>

<!-- bits-ui Popover 与 Dialog 共用 dismissable layer，避免弹窗内点击无效 -->
<PopoverPrimitive.Root bind:open disableFocusTrap={true}>
  <PopoverPrimitive.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      {id}
      variant="outline"
      class={cn(
        'w-full justify-start text-left font-normal',
        !value && 'text-muted-foreground',
        className,
      )}
      {disabled}
    >
      <CalendarIcon class="mr-2 h-4 w-4" />
      {#if value}
        {getFormattedDate()}
      {:else}
        <span>{placeholder}</span>
      {/if}
    </Button>
  </PopoverPrimitive.Trigger>

  <PopoverPrimitive.Content
    class="bg-popover text-popover-foreground z-[100] w-auto rounded-md border p-0 shadow-lg outline-none"
    sideOffset={4}
    strategy="fixed"
    inTransition={flyAndScale}
    outTransition={flyAndScale}
  >
    <Calendar {selectedDate} onSelect={handleSelect} showOutsideDays={false} />
    <div class="flex items-center justify-center gap-2 border-t p-3">
      <div class="flex items-center gap-1">
        <input
          type="text"
          maxlength="2"
          value={getHour()}
          on:input={(e) => handleTimeChange('hour', e.currentTarget.value)}
          on:change={(e) => handleTimeChange('hour', e.currentTarget.value)}
          class="w-12 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span class="text-muted-foreground">:</span>
        <input
          type="text"
          maxlength="2"
          value={getMinute()}
          on:input={(e) => handleTimeChange('minute', e.currentTarget.value)}
          on:change={(e) => handleTimeChange('minute', e.currentTarget.value)}
          class="w-12 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  </PopoverPrimitive.Content>
</PopoverPrimitive.Root>
