<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import type { ApplicationStatus } from '$lib/types';
  import { LABEL_MAP } from '$lib/types';

  export let status: ApplicationStatus;

  // 在 secondary 变体基础上覆盖颜色，保持 hover 效果
  const COLOR: Record<ApplicationStatus, string> = {
    draft: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    pending: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    approved: 'bg-green-100 text-green-700 hover:bg-green-200',
    rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
    cancelled: 'bg-gray-100 text-gray-400 hover:bg-gray-200',
  };
</script>

<Badge variant="secondary" class={COLOR[status]}>
  {LABEL_MAP[status]}
</Badge>
