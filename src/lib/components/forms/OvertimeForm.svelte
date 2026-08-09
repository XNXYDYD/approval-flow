<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { OVERTIME_FIELDS, LABEL_MAP } from '$lib/types';
  import type { OvertimeApplication, Applicant } from '$lib/types';
  import { validateApplication, type ValidationErrors } from '$lib/utils/validators';
  import { calcDuration } from '$lib/utils/duration';
  import { draft } from '$lib/stores/application';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  // import { DatePicker } from '$lib/components/ui/date-picker'; // 旧组件（已替换为 DateTimePicker）
  // import { DateTimePicker } from '$lib/components/ui/date-time-picker'; // 方案B：shadcn-svelte 组件（已替换为 date-picker-svelte）
  import { DateTimePickerSvelte } from '$lib/components/ui/date-time-picker-svelte';
  import Clock3 from 'lucide-svelte/icons/clock-3';

  export let applicant: Applicant;
  export let formId: string = 'overtime-form';
  export let errors: ValidationErrors = {};

  const dispatch = createEventDispatcher();

  function getDraftField(key: string): string | number {
    const val = ($draft as Record<string, unknown>)[key];
    if (val === undefined || val === null) return '';
    return typeof val === 'number' ? val as number : String(val);
  }

  function setDraftField(key: string, value: unknown) {
    draft.update((d) => ({ ...d, [key]: value }));
  }

  function updateDuration(start: string, end: string) {
    const newDuration = (start && end) ? calcDuration(start, end) : 0;
    draft.update((d) => ({ ...d, duration: newDuration }));
  }

  function handleStartTimeChange(e: CustomEvent) {
    const detail = String(e.detail ?? '');
    setDraftField('startTime', detail);
    const endTime = String(getDraftField('endTime'));
    updateDuration(detail, endTime);
  }

  function handleEndTimeChange(e: CustomEvent) {
    const detail = String(e.detail ?? '');
    setDraftField('endTime', detail);
    const startTime = String(getDraftField('startTime'));
    updateDuration(startTime, detail);
  }

  function handleSelectChange(key: string) {
    return (selected: { value: string; label?: string } | undefined) => {
      setDraftField(key, selected?.value ?? '');
    };
  }

  function toSelected(value: string | number): { value: string; label?: string } | undefined {
    const v = String(value);
    if (!v) return undefined;
    return { value: v, label: (LABEL_MAP as Record<string, string>)[v] ?? v };
  }

  // 响应式绑定：直接从 draft store 获取值，确保 Svelte 正确追踪依赖
  $: startTimeValue = String($draft.startTime ?? '');
  $: endTimeValue = String($draft.endTime ?? '');
  $: durationValue = $draft.duration ?? 0;

  // 校验错误：仅在预览申请时由父组件传入，不在字段变更时实时校验
  $: overtimeTypeError = errors.overtimeType ?? '';
  $: compensationError = errors.compensation ?? '';
  $: startTimeError = errors.startTime ?? '';
  $: endTimeError = errors.endTime ?? '';
  $: reasonError = errors.reason ?? '';

  function handleSubmit() {
    const validationErrors = validateApplication($draft);
    if (Object.keys(validationErrors).length === 0) {
      dispatch('preview', { ...$draft, applicant });
    }
  }
</script>

<form id={formId} on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- 基本信息 Card -->
  <Card>
    <CardHeader class="py-2.5 px-4">
      <CardTitle class="text-sm font-semibold">基本信息</CardTitle>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0 space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <!-- 加班类型 -->
        <div class="space-y-1.5">
          <Label for="overtimeType" class="text-sm">
            加班类型
            <span class="text-destructive ml-0.5">*</span>
          </Label>
          <Select
            selected={toSelected(getDraftField('overtimeType'))}
            onSelectedChange={handleSelectChange('overtimeType')}
          >
            <SelectTrigger id="overtimeType" class={overtimeTypeError ? 'border-red-500 ring-1 ring-red-500' : ''}>
              <SelectValue placeholder="请选择加班类型" />
            </SelectTrigger>
            <SelectContent>
              {#each (OVERTIME_FIELDS.find((f) => f.key === 'overtimeType')?.options ?? []) as opt}
                <SelectItem value={opt} label={LABEL_MAP[opt] ?? opt}>
                  {LABEL_MAP[opt] ?? opt}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if overtimeTypeError}
            <span class="text-xs text-destructive">{overtimeTypeError}</span>
          {/if}
        </div>

        <!-- 补偿方式 -->
        <div class="space-y-1.5">
          <Label for="compensation" class="text-sm">
            补偿方式
            <span class="text-destructive ml-0.5">*</span>
          </Label>
          <Select
            selected={toSelected(getDraftField('compensation'))}
            onSelectedChange={handleSelectChange('compensation')}
          >
            <SelectTrigger id="compensation" class={compensationError ? 'border-red-500 ring-1 ring-red-500' : ''}>
              <SelectValue placeholder="请选择补偿方式" />
            </SelectTrigger>
            <SelectContent>
              {#each (OVERTIME_FIELDS.find((f) => f.key === 'compensation')?.options ?? []) as opt}
                <SelectItem value={opt} label={LABEL_MAP[opt] ?? opt}>
                  {LABEL_MAP[opt] ?? opt}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          {#if compensationError}
            <span class="text-xs text-destructive">{compensationError}</span>
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- 加班时段 Card -->
  <Card>
    <CardHeader class="py-2.5 px-4">
      <CardTitle class="text-sm font-semibold">加班时段</CardTitle>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0 space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <!-- 开始时间 -->
        <div class="space-y-1.5">
          <Label for="startTime" class="text-sm">
            开始时间
            <span class="text-destructive ml-0.5">*</span>
          </Label>
          <!-- 旧: DatePicker -->
          <!-- <DatePicker
            id="startTime"
            value={String(getDraftField('startTime'))}
            placeholder="选择开始时间"
            on:change={(e) => setDraftField('startTime', e.detail)}
          /> -->
          <!-- 方案B: DateTimePicker (shadcn-svelte) -->
          <!-- <DateTimePicker
            id="startTime"
            value={startTimeValue}
            placeholder="选择开始时间"
            on:change={handleStartTimeChange}
          /> -->
          <!-- 方案A: DateTimePickerSvelte (date-picker-svelte) -->
          <DateTimePickerSvelte
            id="startTime"
            value={startTimeValue}
            placeholder="选择开始时间"
            on:change={handleStartTimeChange}
          />
          {#if startTimeError}
            <span class="text-xs text-destructive">{startTimeError}</span>
          {/if}
        </div>

        <!-- 结束时间 -->
        <div class="space-y-1.5">
          <Label for="endTime" class="text-sm">
            结束时间
            <span class="text-destructive ml-0.5">*</span>
          </Label>
          <!-- 旧: DatePicker -->
          <!-- <DatePicker
            id="endTime"
            value={String(getDraftField('endTime'))}
            placeholder="选择结束时间"
            on:change={(e) => setDraftField('endTime', e.detail)}
          /> -->
          <!-- 方案B: DateTimePicker (shadcn-svelte) -->
          <!-- <DateTimePicker
            id="endTime"
            value={endTimeValue}
            placeholder="选择结束时间"
            on:change={handleEndTimeChange}
          /> -->
          <!-- 方案A: DateTimePickerSvelte (date-picker-svelte) -->
          <DateTimePickerSvelte
            id="endTime"
            value={endTimeValue}
            placeholder="选择结束时间"
            on:change={handleEndTimeChange}
          />
          {#if endTimeError}
            <span class="text-xs text-destructive">{endTimeError}</span>
          {/if}
        </div>
      </div>

      <!-- 加班时长（只读，自动计算） -->
      <div class="space-y-1.5">
        <Label for="duration" class="text-sm">加班时长</Label>
        <div class="relative">
          <Clock3 class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="duration"
            type="number"
            value={String(durationValue)}
            readonly
            class="pl-9 bg-muted/50 text-muted-foreground"
          />
        </div>
        <p class="text-xs text-muted-foreground">由起止时间自动计算</p>
      </div>
    </CardContent>
  </Card>

  <!-- 加班事由 Card -->
  <Card>
    <CardHeader class="py-2.5 px-4">
      <CardTitle class="text-sm font-semibold">加班事由</CardTitle>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0 space-y-1.5">
      <Label for="reason" class="text-sm">
        事由描述
        <span class="text-destructive ml-0.5">*</span>
      </Label>
      <Textarea
        id="reason"
        value={String(getDraftField('reason'))}
        on:input={(e) => setDraftField('reason', e.currentTarget.value)}
        placeholder="请详细描述加班事由（不少于10个字符）"
        rows={4}
        class="resize-none {reasonError ? 'border-red-500 ring-1 ring-red-500' : ''}"
      />
      {#if reasonError}
        <span class="text-xs text-destructive">{reasonError}</span>
      {/if}
    </CardContent>
  </Card>
</form>
