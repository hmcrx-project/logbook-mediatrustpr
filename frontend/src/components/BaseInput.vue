<template>
  <input
    class="form-input"
    :class="{ 'is-error': error }"
    :value="modelValue"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  error: Boolean
})

defineEmits(['update:modelValue'])
</script>
