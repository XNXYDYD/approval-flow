<script lang="ts">
  import { reportError } from '$lib/stores/error';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';

  export let error: Error | null = null;
  export let reset: (() => void) | null = null;

  function handleRetry() {
    if (reset) {
      reset();
    }
  }

  function handleReport() {
    if (error) {
      reportError(error, { description: '组件渲染错误' });
    }
  }
</script>

{#if error}
  <div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
      <AlertTriangle class="h-6 w-6 text-red-600" />
    </div>
    <h3 class="text-lg font-semibold text-red-800 mb-2">页面出现错误</h3>
    <p class="text-sm text-red-600 mb-4">
      {error.message || '发生了未知错误，请尝试刷新页面'}
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
        on:click={handleReport}
        class="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
      >
        报告问题
      </button>
    </div>
  </div>
{/if}