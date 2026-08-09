<script lang="ts">
  import { cn } from "$lib/utils";
  import { createEventDispatcher } from "svelte";

  export let hours: number = 0;
  export let minutes: number = 0;
  export let seconds: number = 0;

  const dispatch = createEventDispatcher();

  // 本地副本，用于触发 UI 更新
  let localHours = hours;
  let localMinutes = minutes;
  let localSeconds = seconds;

  // 同步外部 prop 到本地
  $: localHours = hours;
  $: localMinutes = minutes;
  $: localSeconds = seconds;

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  const SECONDS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  function selectHour(val: string) {
    const num = parseInt(val, 10);
    if (!Number.isNaN(num)) {
      localHours = num;
      dispatch("hoursChange", num);
    }
  }

  function selectMinute(val: string) {
    const num = parseInt(val, 10);
    if (!Number.isNaN(num)) {
      localMinutes = num;
      dispatch("minutesChange", num);
    }
  }

  function selectSecond(val: string) {
    const num = parseInt(val, 10);
    if (!Number.isNaN(num)) {
      localSeconds = num;
      dispatch("secondsChange", num);
    }
  }
</script>

<div class="flex flex-col w-full">
  <!-- 标题 -->
  <div class="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
    <span class="text-sm font-medium text-foreground">选择时间</span>
    <span class="font-mono text-sm tabular-nums text-muted-foreground">
      {String(localHours).padStart(2, "0")}:{String(localMinutes).padStart(2, "0")}:{String(localSeconds).padStart(2, "0")}
    </span>
  </div>

  <!-- 三列时间选择 -->
  <div class="flex">
    <!-- 小时 -->
    <div class="flex-1 border-r border-border">
      <div class="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">时</div>
      <div class="max-h-[240px] overflow-y-auto px-1 pb-1 app-scrollbar">
        {#each HOURS as h}
          <button
            type="button"
            on:click={() => selectHour(h)}
            class={cn(
              "w-full rounded-md px-2 py-1 text-center text-sm transition-colors",
              parseInt(h, 10) === localHours
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent hover:text-accent-foreground text-foreground"
            )}
          >
            {h}
          </button>
        {/each}
      </div>
    </div>

    <!-- 分钟 -->
    <div class="flex-1 border-r border-border">
      <div class="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">分</div>
      <div class="max-h-[240px] overflow-y-auto px-1 pb-1 app-scrollbar">
        {#each MINUTES as m}
          <button
            type="button"
            on:click={() => selectMinute(m)}
            class={cn(
              "w-full rounded-md px-2 py-1 text-center text-sm transition-colors",
              parseInt(m, 10) === localMinutes
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent hover:text-accent-foreground text-foreground"
            )}
          >
            {m}
          </button>
        {/each}
      </div>
    </div>

    <!-- 秒 -->
    <div class="flex-1">
      <div class="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">秒</div>
      <div class="max-h-[240px] overflow-y-auto px-1 pb-1 app-scrollbar">
        {#each SECONDS as s}
          <button
            type="button"
            on:click={() => selectSecond(s)}
            class={cn(
              "w-full rounded-md px-2 py-1 text-center text-sm transition-colors",
              parseInt(s, 10) === localSeconds
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent hover:text-accent-foreground text-foreground"
            )}
          >
            {s}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
