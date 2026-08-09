<script lang="ts">
  import { page } from '$app/stores';
  import Home from 'lucide-svelte/icons/home';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import type { ComponentType } from 'svelte';

  interface NavItem {
    href: string;
    label: string;
    icon: ComponentType;
  }

  const navItems: NavItem[] = [
    { href: '/', label: '首页', icon: Home },
    { href: '/list', label: '申请列表', icon: ClipboardList },
    { href: '/statistics', label: '统计报表', icon: BarChart3 }
  ];

  // 判断当前路由是否激活
  function isActive(href: string, path: string): boolean {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  }
</script>

<aside class="app-scrollbar w-56 flex-shrink-0 h-full overflow-y-auto bg-white border-r border-gray-200 py-4">
  <nav class="space-y-1 px-3">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
          {isActive(item.href, $page.url.pathname)
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50'}"
      >
        <svelte:component this={item.icon} class="h-4 w-4" />
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>
</aside>
