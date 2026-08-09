<script lang="ts">
  export const params: Record<string, string> = {};
  import { page } from '$app/stores';
  import { toastError } from '$lib/stores/toast';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';

  $: error = $page.error as Error | { message: string } | null;

  function handleRetry() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }
</script>

<svelte:head>
  <title>页面出错了 - 加班申请管理系统</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[60vh]">
  <div class="text-center max-w-md">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-5">
      <AlertTriangle class="h-8 w-8 text-red-600" />
    </div>
    <h2 class="text-xl font-bold text-gray-800 mb-2">页面出错了</h2>
    <p class="text-gray-500 mb-6 text-sm">
      {error instanceof Error ? error.message : error?.message ?? '很抱歉，页面加载时出现了问题'}
    </p>
    <div class="flex items-center justify-center gap-2">
      <button
        type="button"
        on:click={handleRetry}
        class="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
      >
        <RefreshCw class="h-4 w-4" />
        重新加载
      </button>
      <button
        type="button"
        on:click={handleBack}
        class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        返回
      </button>
    </div>
  </div>
</div>