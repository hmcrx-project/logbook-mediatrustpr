<template>
  <section class="placeholder-page card">
    <p class="eyebrow">Modul</p>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: 'Halaman ini akan dikembangkan pada tahap berikutnya.' }
})
</script>

<style scoped>
.placeholder-page {
  padding: 28px;
}

.placeholder-page h2 {
  margin: 4px 0 8px;
  color: var(--heading);
  font-size: 24px;
}

.placeholder-page p {
  margin: 0;
  color: var(--text-muted);
}

.placeholder-page .eyebrow {
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
</style>
