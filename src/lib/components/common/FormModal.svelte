<script lang="ts">
  /**
   * FormModal - 加班申请表单弹窗组件
   *
   * 功能说明：
   * - 实现加班申请的「填写 → 预览 → 提交」三步流程
   * - 使用全局 draft store 共享表单数据，避免跨组件传值
   * - 仅在点击「预览」时触发表单校验，非实时骚扰
   *
   * 数据流：
   * - 表单填写：OvertimeForm → draft store
   * - 预览展示：读取 draft store 数据渲染 PreviewForm
   * - 提交创建：draft store → createApplication API → applications store
   *
   * 事件：
   * - close: 弹窗关闭（由父组件监听）
   * - submitted: 申请提交成功，携带创建的记录
   */
  import { createEventDispatcher } from 'svelte';
  import OvertimeForm from '../forms/OvertimeForm.svelte';
  import PreviewForm from '../forms/PreviewForm.svelte';
  import Modal from './Modal.svelte';
  import { draft, applications } from '$lib/stores/application';
  import { createApplication } from '$lib/api/application';
  import { validateApplication, type ValidationErrors } from '$lib/utils/validators';
  import { CURRENT_USER } from '$lib/mock/users';
  import { toastSuccess, toastError } from '$lib/stores/toast';
  import { Button } from '$lib/components/ui/button';
  import Pencil from 'lucide-svelte/icons/pencil';
  import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
  import FileEdit from 'lucide-svelte/icons/file-edit';
  import type { OvertimeApplication } from '$lib/types';

  /** 弹窗控制状态（由父组件传入） */
  export let open: boolean = false;
  /** 当前步骤：form（填写表单）| preview（预览确认） */
  export let step: 'form' | 'preview' = 'form';

  const dispatch = createEventDispatcher();

  /** 提交中的加载状态 */
  let submitting = false;
  /** 全局错误提示 */
  let error = '';
  /** 表单校验错误映射，key 为字段名，value 为错误信息 */
  let formErrors: ValidationErrors = {};

  /** 表单唯一 ID，用于关联 label 和 input */
  const FORM_ID = 'overtime-form';

  /**
   * 步骤1 → 步骤2：点击「预览申请」时触发
   *
   * 校验逻辑：
   * - 调用 validateApplication 校验所有必填字段
   * - 校验通过后，将当前用户信息合并到 draft store
   * - 切换到预览步骤，清空错误状态
   *
   * 校验失败时：formErrors 保留错误信息，在表单中显示
   */
  function handlePreviewClick() {
    formErrors = validateApplication($draft);
    if (Object.keys(formErrors).length === 0) {
      // 校验通过：合并申请人信息，切换到预览步骤
      draft.set({ ...$draft, applicant: CURRENT_USER });
      step = 'preview';
      formErrors = {};
    }
  }

  /**
   * 步骤2 → 步骤1：点击「返回修改」时触发
   * 保持 draft store 数据不变，仅切换视图
   */
  function handleEdit() {
    step = 'form';
    formErrors = {};
  }

  /**
   * 步骤2 → 提交：点击「确认提交」时触发
   *
   * 流程：
   * 1. 调用 createApplication API 创建申请记录（状态为 pending）
   * 2. 将新记录插入 applications store 头部
   * 3. 重置 draft store 为初始状态
   * 4. 派发 submitted 事件，通知父组件刷新列表
   *
   * 异常处理：
   * - 捕获 API 错误，显示 Toast 提示
   * - 失败时不清空 draft 数据，方便用户重试
   */
  async function handleSubmit() {
    submitting = true;
    error = '';
    try {
      const created: OvertimeApplication = await createApplication($draft, CURRENT_USER);
      // 新记录插入列表头部，确保最新数据可见
      applications.update((apps) => [created, ...apps]);
      // 重置草稿状态
      draft.set({
        overtimeType: undefined,
        startTime: '',
        endTime: '',
        duration: 0,
        compensation: undefined,
        reason: '',
      });
      toastSuccess('提交成功', '加班申请已提交，等待审批');
      dispatch('submitted', created);
    } catch (e) {
      error = '提交失败，请重试';
      toastError('提交失败', '请稍后重试');
    } finally {
      submitting = false;
    }
  }

  /**
   * 关闭弹窗：重置所有状态并派发 close 事件
   *
   * 重置内容：
   * - draft store 清空（防止下次打开显示旧数据）
   * - step 回到 form 步骤
   * - 清空错误信息
   */
  function handleClose() {
    draft.set({
      overtimeType: undefined,
      startTime: '',
      endTime: '',
      duration: 0,
      compensation: undefined,
      reason: '',
    });
    step = 'form';
    error = '';
    formErrors = {};
    dispatch('close');
  }
</script>

<Modal
  {open}
  title={step === 'form' ? '发起加班申请' : '申请预览'}
  size="lg"
  on:close={handleClose}
>
  {#if error}
    <div class="mx-5 mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
  {/if}

  <div class="p-5">
    {#if step === 'form'}
      <OvertimeForm
        formId={FORM_ID}
        applicant={CURRENT_USER}
        errors={formErrors}
        on:preview={() => handlePreviewClick()}
        on:cancel={handleClose}
      />
    {:else}
      <PreviewForm application={$draft} />
      {#if submitting}
        <div class="mt-4 text-center text-muted-foreground text-sm">提交中...</div>
      {/if}
    {/if}
  </div>

  <!-- Footer: 固定底部操作区 -->
  <svelte:fragment slot="footer">
    {#if step === 'form'}
      <div class="px-5 py-4 flex justify-end gap-2">
        <Button type="button" variant="outline" on:click={handleClose}>取消</Button>
        <Button type="button" on:click={handlePreviewClick}>
          <FileEdit class="mr-2 h-4 w-4" />
          预览申请
        </Button>
      </div>
    {:else}
      <div class="px-5 py-4 flex justify-end gap-2">
        <Button variant="outline" on:click={handleEdit}>
          <Pencil class="mr-2 h-4 w-4" />
          返回修改
        </Button>
        <Button variant="outline" on:click={handleClose}>取消</Button>
        <Button on:click={handleSubmit} class="bg-green-600 hover:bg-green-700">
          <CheckCircle2 class="mr-2 h-4 w-4" />
          确认提交
        </Button>
      </div>
    {/if}
  </svelte:fragment>
</Modal>
