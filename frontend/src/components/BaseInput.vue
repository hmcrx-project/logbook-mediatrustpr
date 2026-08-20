<template>
  <input
    class="form-input"
    :class="{ 'is-error': error }"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  type: {
    type: String,
    default: 'text'
  },
  error: Boolean,
  disabled: Boolean
})

defineEmits(['update:modelValue'])
</script>
