<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { cn } from "$lib/utils";
  import { onMount, createEventDispatcher } from "svelte";

  export let value: string = "";
  export const placeholder: string = "选择时间";
  export let disabled: boolean = false;
  export const id: string | null = null;
  export let className: string = "";

  const dispatch = createEventDispatcher();

  // 时间段数据
  const segments = [
    { label: "时", max: 23 },
    { label: "分", max: 59 },
    { label: "秒", max: 59 },
  ];

  let hourValue = 0;
  let minuteValue = 0;
  let secondValue = 0;
  let activeSegment = 0; // 0: hours, 1: minutes, 2: seconds

  // 解析 value 到内部状态
  function parseValue(val: string) {
    if (!val) return;
    const parts = val.split(":");
    if (parts.length >= 2) {
      hourValue = parseInt(parts[0], 10) || 0;
      minuteValue = parseInt(parts[1], 10) || 0;
      secondValue = parts.length >= 3 ? parseInt(parts[2], 10) || 0 : 0;
    }
  }

  // 同步外部 value
  $: if (value) {
    parseValue(value);
  }

  // 格式化显示
  $: displayValue = `${String(hourValue).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}:${String(secondValue).padStart(2, "0")}`;

  // 通知父组件
  function notifyChange() {
    const newVal = `${String(hourValue).padStart(2, "0")}:${String(minuteValue).padStart(2, "0")}:${String(secondValue).padStart(2, "0")}`;
    value = newVal;
    dispatch("change", newVal);
  }

  // 激活段
  function activateSegment(index: number) {
    activeSegment = index;
  }

  // 获取当前段的值
  function getSegmentValue(index: number): number {
    switch (index) {
      case 0: return hourValue;
      case 1: return minuteValue;
      case 2: return secondValue;
      default: return 0;
    }
  }

  // 设置当前段的值
  function setSegmentValue(index: number, val: number) {
    switch (index) {
      case 0: hourValue = val; break;
      case 1: minuteValue = val; break;
      case 2: secondValue = val; break;
    }
    notifyChange();
  }

  // 点击段
  function handleSegmentClick(index: number) {
    activateSegment(index);
    // 如果值为0，开始编辑
    if (getSegmentValue(index) === 0) {
      setSegmentValue(index, 0);
    }
  }

  // 输入处理
  function handleInput(e: Event) {
    if (disabled) return;
    const target = e.target as HTMLInputElement;
    const input = target.value;
    
    // 支持直接输入完整时间
    const parts = input.split(":");
    if (parts.length >= 2) {
      hourValue = parseInt(parts[0], 10) || 0;
      minuteValue = parseInt(parts[1], 10) || 0;
      secondValue = parts.length >= 3 ? parseInt(parts[2], 10) || 0 : 0;
      notifyChange();
    }
  }

  // 键盘导航
  function handleKeydown(e: KeyboardEvent) {
    if (disabled) return;
    
    const currentVal = getSegmentValue(activeSegment);
    const maxVal = segments[activeSegment].max;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setSegmentValue(activeSegment, currentVal >= maxVal ? 0 : currentVal + 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setSegmentValue(activeSegment, currentVal <= 0 ? maxVal : currentVal - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (activeSegment < 2) activateSegment(activeSegment + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (activeSegment > 0) activateSegment(activeSegment - 1);
        break;
    }
  }

  // 初始化
  onMount(() => {
    if (value) {
      parseValue(value);
    }
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events, a11y-no-interactive-element-interactions -->
<div 
  role="application"
  aria-label="时间选择器，使用方向键调整时间"
  class={cn(
    "flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    disabled && "cursor-not-allowed opacity-50",
    className
  )}
  on:keydown={handleKeydown}
>
  {#each segments as segment, i}
    <div class="flex items-center">
      <button
        type="button"
        class={cn(
          "w-8 text-center font-mono text-sm transition-colors rounded px-1",
          activeSegment === i 
            ? "bg-accent text-accent-foreground font-medium" 
            : "hover:bg-accent hover:text-accent-foreground",
          disabled && "cursor-not-allowed"
        )}
        on:click={() => handleSegmentClick(i)}
        disabled={disabled}
      >
        {String(getSegmentValue(i)).padStart(2, "0")}
      </button>
      
      {#if i < segments.length - 1}
        <span class="text-muted-foreground font-mono text-sm">:</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  :focus {
    outline: none;
  }
</style>
