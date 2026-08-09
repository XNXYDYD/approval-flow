<script lang="ts">
  import Header from '$lib/components/common/Header.svelte';
  import Sidebar from '$lib/components/common/Sidebar.svelte';
  import ToastContainer from '$lib/components/common/ToastContainer.svelte';
</script>

<div class="flex flex-col h-screen overflow-hidden">
  <Header />
  <div class="flex flex-1 min-h-0">
    <Sidebar />
    <main class="app-scrollbar flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-3 bg-gray-50">
      <slot />
    </main>
  </div>
</div>

<ToastContainer />
