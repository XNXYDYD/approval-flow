<script lang="ts">
  import { CURRENT_USER } from '$lib/mock/users';
</script>

<header
  class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between"
>
  <h1 class="text-lg font-bold text-gray-800">加班申请管理系统</h1>
  <div class="flex items-center gap-3">
    <span class="text-sm text-gray-500">{CURRENT_USER.department.name}</span>
    <div
      class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium"
    >
      {CURRENT_USER.name.charAt(0)}
    </div>
    <span class="text-sm font-medium">{CURRENT_USER.name}</span>
  </div>
</header>
