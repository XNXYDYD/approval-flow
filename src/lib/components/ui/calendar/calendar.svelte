<script lang="ts">
  import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addYears,
    subYears
  } from "date-fns";
  import { cn } from "$lib/utils";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";

  export let selectedDate: Date | undefined;
  export let disabled: boolean = false;
  export let showOutsideDays: boolean = true;
  export let minDate: Date | undefined = undefined;
  export let maxDate: Date | undefined = undefined;
  export let onSelect: ((date: Date | undefined) => void) | undefined = undefined;

  // 本地存储选中状态，避免直接修改 prop
  let internalSelectedDate: Date | undefined = selectedDate;
  // 记录上次外部传入的值，用于判断是否需要同步
  let lastExternalSelectedDate: Date | undefined = selectedDate;

  // 只在外部 selectedDate 真正变化时同步（避免覆盖内部选择）
  $: if (selectedDate !== lastExternalSelectedDate) {
    lastExternalSelectedDate = selectedDate;
    internalSelectedDate = selectedDate;
  }

  let viewDate = selectedDate ?? new Date();
  let monthStart = startOfMonth(viewDate);
  let monthEnd = endOfMonth(viewDate);

  let weeks: Date[][] = [];

  let showMonthDropdown = false;
  let showYearDropdown = false;

  const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - 50 + i));

  function updateViewDate(newDate: Date) {
    viewDate = newDate;
    monthStart = startOfMonth(viewDate);
    monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const newWeeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      newWeeks.push(days.slice(i, i + 7));
    }
    weeks = newWeeks;
  }

  function nextMonth() {
    updateViewDate(addMonths(viewDate, 1));
  }

  function prevMonth() {
    updateViewDate(subMonths(viewDate, 1));
  }

  function nextYear() {
    updateViewDate(addYears(viewDate, 1));
  }

  function prevYear() {
    updateViewDate(subYears(viewDate, 1));
  }

  function selectMonth(monthIndex: number) {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    updateViewDate(newDate);
    showMonthDropdown = false;
  }

  function selectYear(year: string) {
    const newDate = new Date(viewDate);
    newDate.setFullYear(parseInt(year, 10));
    updateViewDate(newDate);
    showYearDropdown = false;
  }

  function selectDate(day: Date) {
    if (disabled || isDayDisabled(day)) return;
    internalSelectedDate = day;
    if (onSelect) onSelect(day);
  }

  function isDayDisabled(day: Date) {
    if (minDate && day < startOfMonth(minDate)) return true;
    if (maxDate && day > endOfWeek(endOfMonth(maxDate))) return true;
    return false;
  }

  function isToday(day: Date) {
    return isSameDay(day, new Date());
  }

  function isSelected(day: Date) {
    return internalSelectedDate ? isSameDay(day, internalSelectedDate) : false;
  }

  $: updateViewDate(viewDate);

  const daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
</script>

<div class="p-0 relative">
  <!-- Header -->
  <div class="flex items-center justify-center pt-1 pb-2 gap-0.5">
    <button
      type="button"
      class="hover:text-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center"
      aria-label="上一年"
      on:click={prevYear}
    >
      <ChevronLeft class="h-3.5 w-3.5" style="transform: scaleX(0.5)" />
    </button>
    <button
      type="button"
      class="hover:text-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center"
      aria-label="上个月"
      on:click={prevMonth}
    >
      <ChevronLeft class="h-4 w-4" />
    </button>

    <!-- 年月下拉选择 -->
    <div class="flex items-center gap-0.5 mx-1">
      <!-- 月份选择 -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          on:click={() => { showMonthDropdown = !showMonthDropdown; showYearDropdown = false; }}
        >
          {MONTHS[viewDate.getMonth()]}
          <ChevronsUpDown class="h-3 w-3 opacity-50" />
        </button>
        {#if showMonthDropdown}
          <div class="absolute top-full left-0 mt-1 w-24 max-h-48 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg z-50 app-scrollbar">
            {#each MONTHS as m, i}
              <button
                type="button"
                on:click={() => selectMonth(i)}
                class={cn(
                  "w-full rounded-sm px-2 py-1 text-left text-sm transition-colors",
                  i === viewDate.getMonth()
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {m}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- 年份选择 -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          on:click={() => { showYearDropdown = !showYearDropdown; showMonthDropdown = false; }}
        >
          {format(viewDate, "yyyy")}
          <ChevronsUpDown class="h-3 w-3 opacity-50" />
        </button>
        {#if showYearDropdown}
          <div class="absolute top-full left-0 mt-1 w-20 max-h-48 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg z-50 app-scrollbar">
            {#each YEARS as y}
              <button
                type="button"
                on:click={() => selectYear(y)}
                class={cn(
                  "w-full rounded-sm px-2 py-1 text-left text-sm transition-colors",
                  parseInt(y, 10) === viewDate.getFullYear()
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {y}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <button
      type="button"
      class="hover:text-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center"
      aria-label="下个月"
      on:click={nextMonth}
    >
      <ChevronRight class="h-4 w-4" />
    </button>
    <button
      type="button"
      class="hover:text-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 flex items-center justify-center"
      aria-label="下一年"
      on:click={nextYear}
    >
      <ChevronRight class="h-3.5 w-3.5" style="transform: scaleX(0.5)" />
    </button>
  </div>

  <!-- Days of week header -->
  <div class="mb-1 grid grid-cols-7 gap-0">
    {#each daysOfWeek as day}
      <div class="text-muted-foreground p-0 text-center text-[0.8rem] font-medium">
        {day}
      </div>
    {/each}
  </div>

  <!-- Days grid -->
  {#each weeks as week}
    <div class="mt-1 grid grid-cols-7 gap-0">
      {#each week as day}
        {#if showOutsideDays || isSameMonth(day, viewDate)}
          <div class="p-0 text-center text-sm">
            <button
              type="button"
              on:click={() => selectDate(day)}
              class={cn(
                "focus:ring-day text-day hover:text-day focus:text-day relative flex h-9 w-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md p-0 text-center text-sm font-normal",
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
                !isSameMonth(day, viewDate) && "text-muted-foreground opacity-50",
                isDayDisabled(day) && "text-muted-foreground opacity-50 hover:bg-transparent hover:text-muted-foreground cursor-not-allowed",
                isToday(day) && "bg-accent text-accent-foreground",
                isSelected(day) && cn(
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  "focus:bg-primary focus:text-primary-foreground"
                )
              )}
            >
              {format(day, "d")}
            </button>
          </div>
        {:else}
          <div class="p-0 text-center text-sm">
            <button type="button" class="invisible h-9 w-9 p-0" tabindex="-1">
              {format(day, "d")}
            </button>
          </div>
        {/if}
      {/each}
    </div>
  {/each}

  <!-- 点击外部关闭下拉 -->
  {#if showMonthDropdown || showYearDropdown}
    <button
      type="button"
      aria-hidden="true"
      tabindex="-1"
      class="fixed inset-0 z-40 cursor-default"
      on:click={() => { showMonthDropdown = false; showYearDropdown = false; }}
    ></button>
  {/if}
</div>
