<script lang="ts">
  import { DateInput } from "date-picker-svelte";
  import { cn } from "$lib/utils";
  import { parseISO, isValid } from "date-fns";
  import { createEventDispatcher } from "svelte";

  export let value: string = "";
  export let placeholder: string = "选择日期时间";
  export let className: string = "";
  export let id: string | null = null;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher();

  // 已确认的日期值
  let dateValue: Date | null = null;

  // 输入框显示的日期
  let displayValue: Date | null = null;

  // 暂存待确认的日期
  let pendingDate: Date | null = null;

  // 通过 bind:visible 控制 DateInput 弹窗显示/隐藏
  let visible = false;

  // 日期时间字段引用（用于读取 DOM 中的实时时间值）
  let dateTimeField: HTMLElement | null = null;

  // 当外部 value 变化时同步
  $: if (value) {
    try {
      const d = parseISO(value);
      if (isValid(d)) {
        dateValue = d;
        displayValue = d;
        pendingDate = null;
      }
    } catch {
      dateValue = null;
      displayValue = null;
      pendingDate = null;
    }
  } else {
    dateValue = null;
    displayValue = null;
    pendingDate = null;
  }

  // 处理 DateInput 的 select 事件
  function handleSelect(e: { detail: Date | null }) {
    const newDate = e.detail;
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      pendingDate = newDate;
      displayValue = newDate;
    } else if (newDate === null) {
      pendingDate = null;
      displayValue = dateValue;
    }
  }

  // 从 DOM 读取时间选择器的实时值
  function getTimePickerValue(): { hours: number; minutes: number; seconds: number } | null {
    if (!dateTimeField) return null;

    const timePicker = dateTimeField.querySelector('.time-picker');
    if (!timePicker) return null;

    const spans = timePicker.querySelectorAll('span[aria-label]');
    let hours = 0, minutes = 0, seconds = 0;

    spans.forEach((span) => {
      const label = span.getAttribute('aria-label');
      const text = span.textContent?.trim() || '0';
      const num = parseInt(text, 10) || 0;

      if (label === 'Hours') hours = num;
      else if (label === 'Minutes') minutes = num;
      else if (label === 'Seconds') seconds = num;
    });

    return { hours, minutes, seconds };
  }

  // 从 DateInput 输入框获取当前显示的日期文本
  function getInputDateText(): string | null {
    if (!dateTimeField) return null;

    const input = dateTimeField.querySelector('input');
    return input?.value || null;
  }

  // 点击确认按钮
  function handleConfirm(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    // 尝试从 DOM 读取时间选择器的实时值
    const timeValue = getTimePickerValue();
    const dateText = getInputDateText();

    // 先确定日期部分：优先使用 pendingDate > dateValue > 输入框日期 > 今天
    let baseDate: Date | null = null;

    if (pendingDate) {
      baseDate = pendingDate;
    } else if (dateValue) {
      baseDate = dateValue;
    } else if (dateText) {
      // 从输入框文本解析日期部分（格式: yyyy-MM-dd HH:mm:ss）
      const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // JS 月份从 0 开始
        const day = parseInt(dateMatch[3]);
        baseDate = new Date(year, month, day);
      }
    }

    // 如果还是没有日期，使用今天
    if (!baseDate) {
      baseDate = new Date();
    }

    // 确定时间部分：优先使用 DOM 读取的时间
    let finalDate: Date;

    if (timeValue) {
      // 使用 DOM 中读取的时间值 + baseDate 的日期部分
      finalDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        timeValue.hours,
        timeValue.minutes,
        timeValue.seconds
      );
    } else {
      // 没有时间修改，直接使用 baseDate（可能包含已有的时间）
      finalDate = baseDate;
    }

    const isoString = finalDate.toISOString();
    dateValue = finalDate;
    displayValue = finalDate;
    pendingDate = null;
    dispatch("change", isoString);

    // 直接控制 visible 关闭弹窗，确保内部状态同步
    visible = false;
  }

  // 点击取消按钮
  function handleCancel(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    pendingDate = null;
    displayValue = dateValue;

    // 直接控制 visible 关闭弹窗
    visible = false;
  }
</script>

<div class="relative w-full">
  <!-- 日期时间字段外层容器（用于获取 DOM 引用 + CSS 变量） -->
  <div
    bind:this={dateTimeField}
    style="--date-picker-background: hsl(var(--background)); --date-picker-foreground: hsl(var(--foreground)); --date-picker-highlight-border: hsl(var(--ring)); --date-picker-highlight-shadow: hsl(var(--ring) / 0.3); --date-input-width: 100%"
  >
    <DateInput
      value={displayValue}
      bind:visible
      {id}
      placeholder={placeholder}
      class={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 px-15",
        !dateValue && "text-muted-foreground",
        dateValue && "text-foreground",
        className
      )}
      timePrecision="second"
      format="yyyy-MM-dd HH:mm:ss"
      {disabled}
      closeOnSelection={false}
      on:select={handleSelect}
    >
      <!-- 确认/取消按钮 -->
      <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-border px-2 pb-2">
        <button
          type="button"
          class="px-3 py-1 text-sm rounded transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
          on:click={handleCancel}
        >
          取消
        </button>
        <button
          type="button"
          class="px-3 py-1 text-sm rounded transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          on:click={handleConfirm}
        >
          确认
        </button>
      </div>
    </DateInput>
  </div>
</div>

<style>
  :global(.date-time-field),
  :global(.date-time-field input),
  :global(.date-time-field input:focus),
  :global(.date-time-field .invalid),
  :global(.date-time-field .invalid:focus) {
    background: hsl(var(--background)) !important;
    border: none !important;
    border-radius: 0.375rem !important;
    outline: none !important;
    box-shadow: none !important;
    padding: 0 0.75rem !important;
    margin: 0 !important;
    width: 100% !important;
    min-width: 0 !important;
    color: inherit !important;
  }

  :global(.date-time-picker) {
    border: none !important;
    box-shadow: none !important;
    background: hsl(var(--background)) !important;
  }

  :global(.date-time-picker:focus) {
    border: none !important;
    box-shadow: none !important;
  }

  :global(.time-picker) {
    border: none !important;
    background: hsl(var(--background)) !important;
  }

  :global(.time-picker span) {
    border: none !important;
  }

  :global(.date-time-picker select) {
    border: none !important;
    box-shadow: none !important;
  }

  :global(.date-time-picker .page-button) {
    border: none !important;
  }

  :global(.date-time-picker .page-button:hover) {
    border: none !important;
  }
</style>
