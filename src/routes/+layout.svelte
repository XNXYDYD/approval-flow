<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import '../app.css';
  import { reportError } from '$lib/stores/error';

  function handleError(event: ErrorEvent) {
    reportError(event.error ?? new Error(event.message), {
      description: event.message,
    });
  }

  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      description: '未捕获的 Promise 异常',
    });
  }

  onMount(() => {
    if (!browser) return;
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
</script>

<slot />
