<script lang="ts">
  import { Popover as PopoverPrimitive } from "bits-ui";
  import { format, parseISO, isValid } from "date-fns";
  import { cn, flyAndScale } from "$lib/utils";
  import { Calendar } from "$lib/components/ui/calendar";
  import { Button } from "$lib/components/ui/button";
  import TimePicker from "./time-picker.svelte";
  import CalendarIcon from "lucide-svelte/icons/calendar";
  import { createEventDispatcher } from "svelte";

  export let value: string = "";
  export let placeholder: string = "选择日期时间";
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;

  let className: string | undefined = undefined;
  export { className as class };

  const dispatch = createEventDispatcher();

  let open = false;
  let selectedDate: Date | undefined = undefined;
  
  // 内部存储的显示值（用于触发 UI 更新）
  let displayValue = "";
  // 记录上次外部传入的 value，用于判断是否需要同步
  let lastExternalValue = "";

  // 临时时间状态（打开弹窗时从 value 解析）
  let tempHours = 0;
  let tempMinutes = 0;
  let tempSeconds = 0;

  $: {
    // 只在外部 value 真正变化时同步到 displayValue 和 selectedDate
    if (value !== lastExternalValue) {
      lastExternalValue = value;
      displayValue = value;
      // 同步 selectedDate 从外部 value（只在外部真正变化时）
      if (value) {
        try {
          const d = parseISO(value);
          if (isValid(d)) {
            selectedDate = new Date(d);
          }
        } catch {
          // ignore
        }
      } else {
        selectedDate = undefined;
      }
    }
  }

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    selectedDate = date;
  }

  function handleClear() {
    selectedDate = undefined;
    tempHours = 0;
    tempMinutes = 0;
    tempSeconds = 0;
    displayValue = "";
    dispatch("change", "");
    open = false;
  }

  function handleConfirm() {
    if (!selectedDate) {
      selectedDate = new Date();
    }
    console.log('[DateTimePicker] handleConfirm - selectedDate:', selectedDate);
    console.log('[DateTimePicker] handleConfirm - tempHours:', tempHours, 'tempMinutes:', tempMinutes, 'tempSeconds:', tempSeconds);
    
    const result = new Date(selectedDate);
    result.setHours(tempHours, tempMinutes, tempSeconds, 0);
    const isoString = result.toISOString();
    console.log('[DateTimePicker] handleConfirm - result:', result, 'ISO:', isoString);
    console.log('[DateTimePicker] handleConfirm - displayValue before:', displayValue);
    
    displayValue = isoString;
    console.log('[DateTimePicker] handleConfirm - displayValue after:', displayValue);
    
    dispatch("change", isoString);
    open = false;
  }

  function handleOpenChange(e: CustomEvent<boolean>) {
    const next = e.detail;
    open = next;
    if (next) {
      if (value) {
        try {
          const d = parseISO(value);
          if (isValid(d)) {
            selectedDate = new Date(d);
            tempHours = d.getHours();
            tempMinutes = d.getMinutes();
            tempSeconds = d.getSeconds();
          }
        } catch {
          selectedDate = undefined;
          tempHours = 0;
          tempMinutes = 0;
          tempSeconds = 0;
        }
      } else {
        selectedDate = undefined;
        tempHours = 0;
        tempMinutes = 0;
        tempSeconds = 0;
      }
    }
  }

  function getFormattedDisplay() {
    if (!displayValue) return "";
    try {
      const d = parseISO(displayValue);
      if (!isValid(d)) return "";
      return format(d, "yyyy/MM/dd HH:mm:ss");
    } catch {
      return "";
    }
  }

  $: tempTimeDisplay = `${String(tempHours).padStart(2, "0")}:${String(tempMinutes).padStart(2, "0")}:${String(tempSeconds).padStart(2, "0")}`;
</script>

<PopoverPrimitive.Root bind:open on:open-change={handleOpenChange}>
  <PopoverPrimitive.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      {id}
      variant="outline"
      class={cn(
        "w-full justify-start text-left font-normal",
        !displayValue && "text-muted-foreground",
        className
      )}
      {disabled}
    >
      <CalendarIcon class="mr-2 h-4 w-4" />
      {#if displayValue}
        <span class="truncate">{getFormattedDisplay()}</span>
      {:else}
        <span class="truncate">{placeholder}</span>
      {/if}
    </Button>
  </PopoverPrimitive.Trigger>

  <PopoverPrimitive.Content
    class="bg-popover text-popover-foreground z-[100] rounded-md border shadow-lg outline-none overflow-hidden"
    sideOffset={4}
    strategy="fixed"
    inTransition={flyAndScale}
    outTransition={flyAndScale}
  >
    <div class="flex">
      <!-- 左侧：日历 -->
      <div class="p-1 min-w-[280px]">
        <Calendar
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
          showOutsideDays={false}
        />
      </div>

      <!-- 右侧：时间选择 -->
      <div class="flex flex-col border-l border-border" style="width: 200px;">
        <TimePicker 
          hours={tempHours}
          minutes={tempMinutes}
          seconds={tempSeconds}
          on:hoursChange={(e) => { console.log('[DateTimePicker] hoursChange - detail:', e.detail); tempHours = e.detail; }}
          on:minutesChange={(e) => { console.log('[DateTimePicker] minutesChange - detail:', e.detail); tempMinutes = e.detail; }}
          on:secondsChange={(e) => { console.log('[DateTimePicker] secondsChange - detail:', e.detail); tempSeconds = e.detail; }}
        />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="flex items-center justify-between border-t border-border px-3 py-2">
      <span class="text-xs text-muted-foreground">
        {#if selectedDate}
          已选 {format(selectedDate, "yyyy/MM/dd")} {tempTimeDisplay}
        {:else}
          请选择日期
        {/if}
      </span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
          on:click={handleClear}
        >
          清空
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 disabled:pointer-events-none disabled:opacity-50"
          on:click={handleConfirm}
          disabled={!selectedDate}
        >
          确定
        </button>
      </div>
    </div>
  </PopoverPrimitive.Content>
</PopoverPrimitive.Root>
