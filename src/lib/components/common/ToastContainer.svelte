<script lang="ts">
  import { toasts, dismissToast, type Toast } from '$lib/stores/toast';
  import { cn } from '$lib/utils';
  import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
  import AlertCircle from 'lucide-svelte/icons/alert-circle';
  import Info from 'lucide-svelte/icons/info';

  function variantIcon(variant: Toast['variant']) {
    if (variant === 'success') return CheckCircle2;
    if (variant === 'error') return AlertCircle;
    return Info;
  }

  function variantClass(variant: Toast['variant']) {
    if (variant === 'success') return 'border-green-200 bg-green-50 text-green-800';
    if (variant === 'error') return 'border-red-200 bg-red-50 text-red-800';
    return 'border-gray-200 bg-white text-gray-800';
  }

  function iconClass(variant: Toast['variant']) {
    if (variant === 'success') return 'text-green-600';
    if (variant === 'error') return 'text-red-600';
    return 'text-gray-500';
  }
</script>

{#if $toasts.length > 0}
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
    {#each $toasts as toast (toast.id)}
      <div
        role="status"
        class={cn(
          'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in',
          variantClass(toast.variant),
        )}
      >
        <svelte:component
          this={variantIcon(toast.variant)}
          class={cn('h-5 w-5 shrink-0 mt-0.5', iconClass(toast.variant))}
        />
        <div class="flex-1 min-w-0">
          {#if toast.message}
            <p class="text-sm font-medium leading-tight">{toast.message}</p>
          {/if}
          {#if toast.description}
            <p class="text-sm opacity-80 mt-0.5">{toast.description}</p>
          {/if}
        </div>
        <button
          on:click={() => dismissToast(toast.id)}
          class="shrink-0 rounded p-1 -mr-1 -mt-1 hover:bg-black/5 transition-colors"
          aria-label="关闭"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .animate-in {
    animation: toast-in 0.2s ease-out;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateX(1rem);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
