<script lang="ts">
  import { cn } from "$lib/utils";

  let className: string | undefined = undefined;
  export { className as class };
</script>

<button
  type="button"
  class={cn(
    "ring-offset-background placeholder:text-muted-foreground focus:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
>
  <slot />
</button>
