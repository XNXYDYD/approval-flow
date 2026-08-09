<script lang="ts">
  import { LABEL_MAP } from '$lib/types';
  import type { OvertimeApplication } from '$lib/types';
  import { formatDuration } from '$lib/utils/duration';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import { Label } from '$lib/components/ui/label';
  import Clock3 from 'lucide-svelte/icons/clock-3';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import User from 'lucide-svelte/icons/user';
  import Building2 from 'lucide-svelte/icons/building-2';

  export let application: Partial<OvertimeApplication>;

  function formatTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="space-y-4">
  <!-- 申请人信息 Card -->
  <Card>
    <CardHeader class="py-2.5 px-4">
      <CardTitle class="text-sm font-semibold">申请人信息</CardTitle>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0">
      <div class="grid grid-cols-3 gap-x-4 gap-y-3">
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">
            <User class="inline h-3 w-3 mr-1" />姓名
          </Label>
          <p class="text-sm font-medium">{application.applicant?.name ?? '-'}</p>
        </div>
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">工号</Label>
          <p class="text-sm font-medium">{application.applicant?.employeeId ?? '-'}</p>
        </div>
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">
            <Building2 class="inline h-3 w-3 mr-1" />部门
          </Label>
          <p class="text-sm font-medium">{application.applicant?.department?.name ?? '-'}</p>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- 加班内容 Card -->
  <Card>
    <CardHeader class="py-2.5 px-4">
      <CardTitle class="text-sm font-semibold">加班内容</CardTitle>
    </CardHeader>
    <CardContent class="px-4 pb-4 pt-0 space-y-4">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">加班类型</Label>
          <p class="text-sm font-medium">{LABEL_MAP[application.overtimeType ?? ''] ?? '-'}</p>
        </div>
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">补偿方式</Label>
          <p class="text-sm font-medium">{LABEL_MAP[application.compensation ?? ''] ?? '-'}</p>
        </div>
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">
            <CalendarDays class="inline h-3 w-3 mr-1" />开始时间
          </Label>
          <p class="text-sm font-medium">{formatTime(application.startTime ?? '')}</p>
        </div>
        <div class="space-y-0.5">
          <Label class="text-xs text-muted-foreground">结束时间</Label>
          <p class="text-sm font-medium">{formatTime(application.endTime ?? '')}</p>
        </div>
        <div class="col-span-2 space-y-0.5">
          <Label class="text-xs text-muted-foreground">
            <Clock3 class="inline h-3 w-3 mr-1" />加班时长
          </Label>
          <p class="text-sm font-medium">{formatDuration(application.duration ?? 0)}</p>
        </div>
      </div>

      <Separator />

      <div class="space-y-1">
        <Label class="text-xs text-muted-foreground">加班事由</Label>
        <div class="rounded-md bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
          {application.reason ?? '-'}
        </div>
      </div>
    </CardContent>
  </Card>
</div>
