<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';

  export let open: boolean = false;
  export let title: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let showClose: boolean = true;

  const dispatch = createEventDispatcher();

  // 不同尺寸对应的 max-width
  const sizeMap: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  // Dialog 内部触发关闭（ESC、遮罩点击、X 按钮）时通知父组件
  // 由父组件决定是否将 open 置为 false（单向数据流）
  function onOpenChange(next: boolean) {
    if (!next) {
      dispatch('close');
    }
  }
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent
    class={`${sizeMap[size]} max-h-[90vh] gap-0 p-0 overflow-hidden flex flex-col ${showClose ? '' : '[&_[data-melt-dialog-close]]:hidden'}`}
  >
    {#if title}
      <DialogHeader class="px-6 py-4 border-b flex-shrink-0 space-y-0">
        <DialogTitle class="text-lg font-semibold text-gray-800">{title}</DialogTitle>
      </DialogHeader>
    {/if}

    <div class="app-scrollbar flex-1 overflow-y-auto">
      <slot />
    </div>

    {#if $$slots.footer}
      <div class="flex-shrink-0 border-t bg-white">
        <slot name="footer" />
      </div>
    {/if}
  </DialogContent>
</Dialog>
