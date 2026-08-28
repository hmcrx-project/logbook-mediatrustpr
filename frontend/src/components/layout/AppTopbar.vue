<template>
  <header class="app-topbar">
    <button type="button" class="mobile-menu-button" aria-label="Buka menu" @click="emit('toggle-menu')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Dashboard' }
})

const emit = defineEmits(['toggle-menu'])
</script>
