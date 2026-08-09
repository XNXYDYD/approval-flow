<script lang="ts">
  import { onMount } from 'svelte';
  import { cn } from '$lib/utils';

  export let open: boolean = false;
  export let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

  let className: string | undefined = undefined;
  export { className as class };

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-popover-content]') && !target.closest('[data-popover-trigger]')) {
      open = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative inline-block w-full">
  <button
    type="button"
    data-popover-trigger
    aria-expanded={open}
    aria-haspopup="dialog"
    on:click={() => (open = !open)}
    class="bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
  >
    <slot name="trigger" />
  </button>
  {#if open}
    <div
      data-popover-content
      class={cn(
        'bg-popover text-popover-foreground rounded-md border p-0 shadow-md outline-none',
        'absolute z-50 mt-2 min-w-[8rem] overflow-hidden',
        placement === 'top' && 'bottom-full mb-2',
        placement === 'bottom' && 'top-full',
        placement === 'left' && 'right-full mr-2',
        placement === 'right' && 'left-full ml-2',
        className,
      )}
      role="dialog"
    >
      <slot />
    </div>
  {/if}
</div>
