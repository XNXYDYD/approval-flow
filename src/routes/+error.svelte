<script lang="ts">
  import { page } from '$app/stores';
  import { reportError } from '$lib/stores/error';
  import { dev } from '$app/environment';
  import Home from 'lucide-svelte/icons/home';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import RefreshCw from 'lucide-svelte/icons/refresh-cw';

  $: error = $page.error as Error | { message: string } | null;

  function handleRetry() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  function handleHome() {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  function handleReport() {
    if (error) {
      reportError(error as Error, { description: '页面级错误', silent: true });
    }
  }
</script>

<svelte:head>
  <title>页面出错了 - 加班申请管理系统</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
        <AlertTriangle class="h-10 w-10 text-red-600" />
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">页面出错了</h1>
      <p class="text-gray-500">
        {error instanceof Error
          ? error.message
          : (error?.message ?? '很抱歉，页面加载时出现了问题')}
      </p>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
      {#if dev && error instanceof Error && error.stack}
        <div
          class="text-xs text-gray-500 bg-gray-50 rounded-md p-3 font-mono break-all max-h-32 overflow-auto"
        >
          {error.stack.split('\n').slice(0, 3).join('\n')}
        </div>
      {/if}

      <div class="flex items-center gap-2">
        <button
          type="button"
          on:click={handleRetry}
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          <RefreshCw class="h-4 w-4" />
          重新加载
        </button>
        <button
          type="button"
          on:click={handleHome}
          class="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Home class="h-4 w-4" />
          返回首页
        </button>
      </div>

      <button
        type="button"
        on:click={handleReport}
        class="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        报告此问题
      </button>
    </div>

    <p class="mt-6 text-center text-xs text-gray-400">如果问题持续出现，请联系技术支持</p>
  </div>
</div>
