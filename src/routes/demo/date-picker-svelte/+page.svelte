<script lang="ts">
  import DateTimePickerSvelte from "$lib/components/ui/date-time-picker-svelte/date-time-picker-svelte.svelte";
  import DateTimePickerShadcn from "$lib/components/ui/date-time-picker-shadcn/date-time-picker-shadcn.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { calcDuration } from "$lib/utils/duration";
  import { parseISO, isValid, format } from "date-fns";

  // ========== date-picker-svelte Demo ==========
  let startTimeSvelte = "";
  let endTimeSvelte = "";
  $: durationSvelte = (startTimeSvelte && endTimeSvelte) ? calcDuration(startTimeSvelte, endTimeSvelte) : 0;

  // ========== time-picker-svelte + Calendar Demo ==========
  let startTimeShadcn = "";
  let endTimeShadcn = "";
  $: durationShadcn = (startTimeShadcn && endTimeShadcn) ? calcDuration(startTimeShadcn, endTimeShadcn) : 0;

  function handleReset() {
    startTimeSvelte = "";
    endTimeSvelte = "";
    startTimeShadcn = "";
    endTimeShadcn = "";
  }

  function handleTestData() {
    const now = new Date();
    const later = new Date(now.getTime() + 8 * 3600 * 1000);
    startTimeSvelte = now.toISOString();
    endTimeSvelte = later.toISOString();
    startTimeShadcn = now.toISOString();
    endTimeShadcn = later.toISOString();
  }
</script>

<svelte:head>
  <title>日期时间选择器对比 Demo</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 space-y-8 app-scrollbar" style="height: 100vh; overflow-y: auto;">
  <!-- 页面标题 -->
  <div class="text-center space-y-2">
    <h1 class="text-3xl font-bold">日期时间选择器对比 Demo</h1>
    <p class="text-muted-foreground">方案一：date-picker-svelte vs 方案二：time-picker-svelte + Calendar</p>
  </div>

  <!-- 操作按钮 -->
  <div class="flex justify-center gap-4">
    <Button on:click={handleTestData}>填入测试数据</Button>
    <Button variant="outline" on:click={handleReset}>重置所有</Button>
  </div>

  <div class="grid gap-8 lg:grid-cols-2">
    <!-- 方案一：date-picker-svelte -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-900 text-xs font-bold">1</span>
          <CardTitle>date-picker-svelte</CardTitle>
        </div>
        <CardDescription>轻量级，开箱即用，支持完整日期时间选择</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- 开始时间 -->
        <div class="space-y-2">
          <Label>开始时间</Label>
          <DateTimePickerSvelte
            placeholder="选择开始时间"
            value={startTimeSvelte}
            on:change={(e) => { startTimeSvelte = e.detail; }}
          />
          {#if startTimeSvelte}
            <p class="text-xs text-muted-foreground">
              {format(parseISO(startTimeSvelte), "yyyy/MM/dd HH:mm:ss")}
            </p>
          {/if}
        </div>

        <!-- 结束时间 -->
        <div class="space-y-2">
          <Label>结束时间</Label>
          <DateTimePickerSvelte
            placeholder="选择结束时间"
            value={endTimeSvelte}
            on:change={(e) => { endTimeSvelte = e.detail; }}
          />
          {#if endTimeSvelte}
            <p class="text-xs text-muted-foreground">
              {format(parseISO(endTimeSvelte), "yyyy/MM/dd HH:mm:ss")}
            </p>
          {/if}
        </div>

        <!-- 加班时长 -->
        <div class="space-y-2">
          <Label>加班时长（小时）</Label>
          <Input
            type="text"
            value={String(durationSvelte)}
            readonly
            class="bg-muted/50"
          />
        </div>

        <!-- 特性说明 -->
        <div class="rounded-md bg-muted/50 p-3 space-y-1">
          <p class="text-xs font-medium">特性：</p>
          <ul class="text-xs text-muted-foreground space-y-1">
            <li>✅ 包大小：轻量级（0 依赖）</li>
            <li>✅ 支持完整的日期时间选择</li>
            <li>✅ 内置时间选择器（含时分秒）</li>
            <li>⚠️ 样式需定制以匹配 shadcn</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <!-- 方案二：time-picker-svelte + Calendar -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-900 text-xs font-bold">2</span>
          <CardTitle>time-picker-svelte + Calendar</CardTitle>
        </div>
        <CardDescription>基于 shadcn-svelte 组件组合，样式完全统一</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- 开始时间 -->
        <div class="space-y-2">
          <Label>开始时间</Label>
          <DateTimePickerShadcn
            placeholder="选择开始时间"
            value={startTimeShadcn}
            on:change={(e) => { startTimeShadcn = e.detail; }}
          />
          {#if startTimeShadcn}
            <p class="text-xs text-muted-foreground">
              {format(parseISO(startTimeShadcn), "yyyy/MM/dd HH:mm:ss")}
            </p>
          {/if}
        </div>

        <!-- 结束时间 -->
        <div class="space-y-2">
          <Label>结束时间</Label>
          <DateTimePickerShadcn
            placeholder="选择结束时间"
            value={endTimeShadcn}
            on:change={(e) => { endTimeShadcn = e.detail; }}
          />
          {#if endTimeShadcn}
            <p class="text-xs text-muted-foreground">
              {format(parseISO(endTimeShadcn), "yyyy/MM/dd HH:mm:ss")}
            </p>
          {/if}
        </div>

        <!-- 加班时长 -->
        <div class="space-y-2">
          <Label>加班时长（小时）</Label>
          <Input
            type="text"
            value={String(durationShadcn)}
            readonly
            class="bg-muted/50"
          />
        </div>

        <!-- 特性说明 -->
        <div class="rounded-md bg-muted/50 p-3 space-y-1">
          <p class="text-xs font-medium">特性：</p>
          <ul class="text-xs text-muted-foreground space-y-1">
            <li>✅ 与 shadcn-svelte 风格完全统一</li>
            <li>✅ 可高度定制（键盘导航、方向键）</li>
            <li>✅ 组件化组合，维护性好</li>
            <li>⚠️ 需要额外依赖 @internationalized/date</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- 对比总结 -->
  <Card>
    <CardHeader>
      <CardTitle>方案对比</CardTitle>
      <CardDescription>选择适合你项目的方案</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-md border p-4 space-y-2">
          <h4 class="font-medium">方案一：date-picker-svelte</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• 适合：快速实现，追求轻量</li>
            <li>• 优点：开箱即用，API 简单</li>
            <li>• 缺点：样式定制需要覆盖默认样式</li>
            <li>• 包大小：~10KB（gzip）</li>
          </ul>
        </div>
        <div class="rounded-md border p-4 space-y-2">
          <h4 class="font-medium">方案二：time-picker-svelte + Calendar</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• 适合：深度定制，风格统一</li>
            <li>• 优点：完全控制样式，键盘导航</li>
            <li>• 缺点：实现稍复杂</li>
            <li>• 包大小：取决于组件库</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- 文件结构说明 -->
  <Card>
    <CardHeader>
      <CardTitle>组件文件结构</CardTitle>
    </CardHeader>
    <CardContent>
      <pre class="rounded-md bg-muted p-4 text-sm overflow-x-auto"><code>{`
src/lib/components/ui/
├── date-time-picker-svelte/          # 方案一
│   └── date-time-picker-svelte.svelte
├── date-time-picker-shadcn/          # 方案二
│   └── date-time-picker-shadcn.svelte
├── time-picker/                      # 方案二的时间选择组件
│   ├── time-picker-input.svelte
│   └── time-picker-utils.ts
├── calendar/                         # 已有组件
├── popover/                          # 已有组件
├── input/                            # 已有组件
└── button/                           # 已有组件
      `}</code></pre>
    </CardContent>
  </Card>
</div>
