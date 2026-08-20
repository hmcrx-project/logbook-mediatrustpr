<template>
  <button :class="['btn', `btn-${variant}`]" :disabled="disabled">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  disabled: Boolean
})
</script>
