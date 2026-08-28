<template>
  <div class="app-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <button
      v-if="sidebarOpen"
      class="sidebar-overlay"
      type="button"
      aria-label="Tutup menu"
      @click="sidebarOpen = false"
    />

    <div class="app-main">
      <AppTopbar :title="pageTitle" @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppTopbar from '../components/layout/AppTopbar.vue'

const route = useRoute()
const sidebarOpen = ref(false)
const pageTitle = computed(() => route.meta.title || 'Dashboard')

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  }
)
</script>

<style>
@import '../assets/styles/layout.css';
</style>
