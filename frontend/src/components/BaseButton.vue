<template>
  <button :class="['btn', `btn-${variant}`, { 'btn-full': fullWidth }]" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  disabled: Boolean,
  fullWidth: Boolean
})
</script>
