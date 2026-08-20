<template>
  <button class="button">
    <slot />
  </button>
</template>

<style scoped>
.button {
  background: #1B98D5;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-family: inherit;
  cursor: pointer;
}
</style>