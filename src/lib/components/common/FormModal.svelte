<script lang="ts">
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

  export let open: boolean = false;
  export let step: 'form' | 'preview' = 'form';

  const dispatch = createEventDispatcher();

  let submitting = false;
  let error = '';
  let formErrors: ValidationErrors = {};

  const FORM_ID = 'overtime-form';

  function handlePreviewClick() {
    formErrors = validateApplication($draft);
    if (Object.keys(formErrors).length === 0) {
      draft.set({ ...$draft, applicant: CURRENT_USER });
      step = 'preview';
      formErrors = {};
    }
  }

  function handleEdit() {
    step = 'form';
    formErrors = {};
  }

  async function handleSubmit() {
    submitting = true;
    error = '';
    try {
      const created: OvertimeApplication = await createApplication($draft, CURRENT_USER);
      applications.update((apps) => [created, ...apps]);
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
