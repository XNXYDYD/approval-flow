<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { OvertimeApplication, ApplicationStatus } from '$lib/types';
  import { LABEL_MAP } from '$lib/types';
  import { transition, getAvailableActions } from '$lib/utils/status';
  import { updateApplication } from '$lib/api/application';
  import { draft } from '$lib/stores/application';
  import { toastSuccess, toastError } from '$lib/stores/toast';
  import { formatDuration } from '$lib/utils/duration';
  import StatusBadge from '../common/StatusBadge.svelte';
  import Modal from '../common/Modal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import FileEdit from 'lucide-svelte/icons/file-edit';
  import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
  import X from 'lucide-svelte/icons/x';
  import Ban from 'lucide-svelte/icons/ban';
  import Pencil from 'lucide-svelte/icons/pencil';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import type { ComponentType } from 'svelte';
  import { CURRENT_USER } from '$lib/mock/users';

  export let open: boolean = false;
  export let app: OvertimeApplication | null = null;

  const dispatch = createEventDispatcher();

  let pendingAction: string | null = null;
  let comment = '';
  let processing = false;

  $: actions = app ? getAvailableActions(app.status) : [];

  function startAction(action: string) {
    pendingAction = action;
    comment = '';
  }

  function cancelAction() {
    pendingAction = null;
    comment = '';
  }

  async function confirmAction() {
    if (!app) return;
    processing = true;

    const statusMap: Record<string, ApplicationStatus> = {
      submit: 'pending',
      approve: 'approved',
      reject: 'rejected',
      cancel: 'cancelled',
      resubmit: 'pending'
    };
    const nextStatus = statusMap[pendingAction!];
    if (!nextStatus) return;

    const actionToastMessages: Record<string, { success: string; desc: string }> = {
      submit: { success: '提交成功', desc: '申请已提交审批' },
      approve: { success: '审批通过', desc: '申请已通过审批' },
      reject: { success: '已驳回', desc: '申请已驳回' },
      cancel: { success: '已撤销', desc: '申请已撤销' },
      resubmit: { success: '重新提交', desc: '申请已重新提交审批' }
    };

    try {
      const actionKey = pendingAction;
      const updated = transition(app, nextStatus, CURRENT_USER, comment);
      await updateApplication(app.id, updated);
      dispatch('updated', updated);
      pendingAction = null;
      comment = '';
      const msg = actionToastMessages[actionKey ?? ''] ?? { success: '操作成功', desc: '' };
      toastSuccess(msg.success, msg.desc);
    } catch (e) {
      toastError('操作失败', '请稍后重试');
    } finally {
      processing = false;
    }
  }

  function handleEdit() {
    if (!app) return;
    draft.set({
      overtimeType: app.overtimeType,
      startTime: app.startTime,
      endTime: app.endTime,
      duration: app.duration,
      compensation: app.compensation,
      reason: app.reason
    });
    dispatch('edit-application', app);
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  function formatClock(iso: string): string {
    return new Date(iso).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  interface ActionConfig {
    label: string;
    icon: ComponentType;
    variant: 'default' | 'destructive' | 'secondary';
    class?: string;
  }

  const actionConfig: Record<string, ActionConfig> = {
    submit: { label: '提交审批', icon: FileEdit, variant: 'default' },
    approve: { label: '通过', icon: CheckCircle2, variant: 'default', class: 'bg-green-600 hover:bg-green-700' },
    reject: { label: '驳回', icon: X, variant: 'destructive' },
    cancel: { label: '撤销', icon: Ban, variant: 'secondary' },
    edit: { label: '修改', icon: Pencil, variant: 'default' },
    resubmit: { label: '重新提交', icon: RefreshCw, variant: 'default', class: 'bg-green-600 hover:bg-green-700' }
  };

  function actionLabel(action: string): string {
    return actionConfig[action]?.label ?? action;
  }

  function handleClose() {
    pendingAction = null;
    comment = '';
    dispatch('close');
  }
</script>

<Modal {open} title="加班申请详情" size="lg" on:close={handleClose}>
  {#if app}
    <div class="p-5 space-y-4">
      <!-- 顶部信息行 -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted-foreground">编号 {app.id}</span>
        <StatusBadge status={app.status} />
      </div>

      <!-- 申请人信息 Card -->
      <Card>
        <CardHeader class="py-2.5 px-4">
          <CardTitle class="text-sm font-semibold">申请人信息</CardTitle>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          <div class="grid grid-cols-3 gap-x-4 gap-y-3">
            <div class="space-y-0.5">
              <Label class="text-xs text-muted-foreground">姓名</Label>
              <p class="text-sm font-medium">{app.applicant.name}</p>
            </div>
            <div class="space-y-0.5">
              <Label class="text-xs text-muted-foreground">工号</Label>
              <p class="text-sm font-medium">{app.applicant.employeeId}</p>
            </div>
            <div class="space-y-0.5">
              <Label class="text-xs text-muted-foreground">部门</Label>
              <p class="text-sm font-medium">{app.applicant.department.name}</p>
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
              <p class="text-sm font-medium">{LABEL_MAP[app.overtimeType]}</p>
            </div>
            <div class="space-y-0.5">
              <Label class="text-xs text-muted-foreground">补偿方式</Label>
              <p class="text-sm font-medium">{LABEL_MAP[app.compensation]}</p>
            </div>
            <div class="space-y-0.5">
              <Label class="text-xs text-muted-foreground">开始时间</Label>
              <p class="text-sm font-medium">{formatTime(app.startTime)}</p>
            </div>
            <div class="space-y-0.5">
              <Label class="text-xs text-muted-foreground">结束时间</Label>
              <p class="text-sm font-medium">{formatTime(app.endTime)}</p>
            </div>
            <div class="col-span-2 space-y-0.5">
              <Label class="text-xs text-muted-foreground">加班时长</Label>
              <p class="text-sm font-medium">{formatDuration(app.duration)}</p>
            </div>
          </div>

          <Separator />

          <div class="space-y-1">
            <Label class="text-xs text-muted-foreground">加班事由</Label>
            <div class="rounded-md bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
              {app.reason}
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 审批历史 Card -->
      <Card>
        <CardHeader class="py-2.5 px-4">
          <CardTitle class="text-sm font-semibold">审批历史</CardTitle>
        </CardHeader>
        <CardContent class="px-4 pb-4 pt-0">
          {#if app.approvals.length === 0}
            <p class="text-sm text-muted-foreground py-1">暂无审批记录</p>
          {:else}
            <div class="relative">
              <div class="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gray-200" />
              <div class="space-y-3.5">
                {#each app.approvals as record}
                  <div class="relative pl-5">
                    <div class="absolute -left-[1px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-500" />
                    <div class="flex items-center gap-2 text-sm">
                      <span class="font-medium text-foreground">{record.approver.name}</span>
                      <span class="text-muted-foreground">
                        {record.action === 'approve' ? '通过' : record.action === 'reject' ? '驳回' : '提交'}
                      </span>
                    </div>
                    <div class="text-xs text-muted-foreground mt-0.5">
                      {formatDate(record.timestamp)} {formatClock(record.timestamp)}
                    </div>
                    {#if record.comment}
                      <div class="text-sm text-muted-foreground mt-1 italic">"{record.comment}"</div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Footer: 固定底部操作区（必须是 Modal 的直接子元素） -->
  <svelte:fragment slot="footer">
    {#if app}
      <div class="px-5 py-4">
        {#if pendingAction}
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{actionLabel(pendingAction)}</span>
              <span class="text-sm text-muted-foreground">- 请输入审批意见</span>
            </div>
            <Textarea
              bind:value={comment}
              rows={2}
              placeholder="请输入审批意见..."
              class="resize-none"
            />
            <div class="flex justify-end gap-2">
              <Button on:click={cancelAction} variant="outline" size="sm">
                取消
              </Button>
              <Button
                on:click={confirmAction}
                disabled={processing}
                size="sm"
              >
                {processing ? '处理中...' : '确认'}
              </Button>
            </div>
          </div>
        {:else}
          <div class="flex flex-wrap gap-2">
            {#each actions as action}
              {#if action === 'edit'}
                <Button on:click={handleEdit} variant={actionConfig[action]?.variant} size="sm" class={actionConfig[action]?.class}>
                  <svelte:component this={actionConfig[action]?.icon} class="mr-2 h-4 w-4" />
                  {actionConfig[action]?.label}
                </Button>
              {:else}
                <Button on:click={() => startAction(action)} variant={actionConfig[action]?.variant} size="sm" class={actionConfig[action]?.class}>
                  <svelte:component this={actionConfig[action]?.icon} class="mr-2 h-4 w-4" />
                  {actionConfig[action]?.label}
                </Button>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </svelte:fragment>
</Modal>
