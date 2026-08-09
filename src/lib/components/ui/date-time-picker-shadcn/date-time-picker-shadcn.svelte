<script lang="ts">
  import { Calendar } from "$lib/components/ui/calendar";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import TimePickerInput from "$lib/components/ui/time-picker/time-picker-input.svelte";
  import { cn } from "$lib/utils";
  import { parseISO, isValid, format, setHours, setMinutes, setSeconds } from "date-fns";
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import CalendarIcon from "lucide-svelte/icons/calendar";

  export let value: string = "";
  export let placeholder: string = "选择日期时间";
  export let className: string = "";
  export let id: string | null = null;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher();

  let open = false;
  let selectedDate: Date | undefined = undefined;
  let tempTime = "00:00:00";
  let containerEl: HTMLElement | null = null;

  // 从外部 ISO 字符串同步
  $: if (value) {
    try {
      const d = parseISO(value);
      if (isValid(d)) {
        selectedDate = d;
        tempTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
      }
    } catch {
      selectedDate = undefined;
      tempTime = "00:00:00";
    }
  } else {
    selectedDate = undefined;
    tempTime = "00:00:00";
  }

  // 格式化显示
  function getDisplayText(): string {
    if (!value) return "";
    try {
      const d = parseISO(value);
      if (!isValid(d)) return "";
      return format(d, "yyyy/MM/dd HH:mm:ss");
    } catch {
      return "";
    }
  }

  function toggleOpen() {
    if (disabled) return;
    open = !open;
    if (open && value) {
      try {
        const d = parseISO(value);
        if (isValid(d)) {
          selectedDate = d;
          tempTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
        }
      } catch {
        // ignore
      }
    }
  }

  function closePopover() {
    open = false;
  }

  // 处理日期选择
  function handleDateSelect(date: Date | undefined) {
    if (date) {
      selectedDate = date;
    }
  }

  // 处理时间变化
  function handleTimeChange(e: { detail: string }) {
    tempTime = e.detail;
  }

  // 组合日期和时间
  function combineDateTime(): string {
    if (!selectedDate) return "";
    
    const [hours, minutes, seconds] = tempTime.split(":").map(Number);
    let result = new Date(selectedDate);
    result = setHours(result, hours || 0);
    result = setMinutes(result, minutes || 0);
    result = setSeconds(result, seconds || 0);
    
    return result.toISOString();
  }

  // 确认选择
  function handleConfirm() {
    if (!selectedDate) {
      selectedDate = new Date();
    }
    
    const isoString = combineDateTime();
    console.log("[DateTimePickerShadcn] handleConfirm - selectedDate:", selectedDate, "tempTime:", tempTime, "ISO:", isoString);
    
    dispatch("change", isoString);
    open = false;
  }

  // 清空选择
  function handleClear() {
    selectedDate = undefined;
    tempTime = "00:00:00";
    dispatch("change", "");
    open = false;
  }

  // 点击外部关闭
  function handleClickOutside(e: MouseEvent) {
    if (containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside);
  });
</script>

<div
  bind:this={containerEl}
  class={cn("relative inline-block w-full", className)}
>
  <!-- 触发按钮 -->
  <Button
    {id}
    variant="outline"
    type="button"
    disabled={disabled}
    class={cn(
      "w-full justify-start text-left font-normal",
      !value && "text-muted-foreground"
    )}
    on:click={toggleOpen}
  >
    <CalendarIcon class="mr-2 h-4 w-4" />
    {#if value}
      {getDisplayText()}
    {:else}
      {placeholder}
    {/if}
  </Button>

  <!-- 弹出内容 -->
  {#if open}
    <div
      class="absolute z-50 mt-2 rounded-md border bg-popover p-0 shadow-md outline-none"
    >
      <div class="flex">
        <!-- 左侧日历 -->
        <div class="p-3">
          <Calendar
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            showOutsideDays={false}
          />
        </div>
        
        <!-- 右侧时间选择 -->
        <div class="flex flex-col border-l border-border" style="width: 180px;">
          <div class="p-3 space-y-3">
            <div class="space-y-1">
              <Label class="text-xs text-muted-foreground">选择时间</Label>
              <TimePickerInput
                value={tempTime}
                on:change={handleTimeChange}
              />
            </div>
            
            <div class="rounded-md bg-muted/50 px-3 py-2 text-center">
              <span class="font-mono text-sm text-muted-foreground">
                {tempTime}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="flex items-center justify-between border-t border-border px-3 py-2">
        <span class="text-xs text-muted-foreground truncate max-w-[200px]">
          {#if selectedDate}
            已选 {format(selectedDate, "yyyy/MM/dd")} {tempTime}
          {:else}
            请选择日期
          {/if}
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            on:click={handleClear}
          >
            清空
          </Button>
          <Button
            size="sm"
            type="button"
            on:click={handleConfirm}
            disabled={!selectedDate}
          >
            确定
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
