<script lang="ts">
  import { cn } from '$lib/utils';

  let className: string | undefined = undefined;
  export { className as class };
</script>

<div data-slot="popover-content" class={cn('p-0', className)}>
  <slot />
</div>
