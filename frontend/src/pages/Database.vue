<template>
  <section class="database-page">
    <section class="database-status-banner card">
      <div class="database-status-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5.5" rx="7.5" ry="3" /><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" /></svg></div>
      <div><h2>Database belum terhubung</h2><p>Halaman ini sudah menyiapkan UI administrasi database. Informasi dan backup nyata akan aktif setelah backend dan Cloudflare D1 diintegrasikan.</p></div>
      <span>UI Mock</span>
    </section>

    <div class="database-summary-grid">
      <article v-for="item in summary" :key="item.label" class="database-summary-card card">
        <span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.note }}</small>
      </article>
    </div>

    <section class="database-backup-card card">
      <div class="database-section-heading">
        <div><h2>Backup Database</h2><p>Buat salinan database untuk pemulihan atau arsip administrasi.</p></div>
        <BaseButton disabled>Backup Database</BaseButton>
      </div>
      <div class="database-backup-notice">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="M10 8v5M10 5.8h.01" stroke-linecap="round" /></svg>
        <span>Tombol backup dinonaktifkan selama database nyata belum terhubung. Tidak ada backup palsu yang dibuat pada fase mock UI.</span>
      </div>
    </section>

    <section class="database-history-card card">
      <div class="database-section-heading"><div><h2>Riwayat Backup</h2><p>Daftar backup nantinya akan muncul di sini dan dapat diunduh oleh Administrator.</p></div></div>
      <div class="database-table-scroll">
        <table class="database-table">
          <thead><tr><th>Tanggal Backup</th><th>Ukuran</th><th>Status</th><th>Tindakan</th></tr></thead>
          <tbody>
            <tr><td colspan="4"><div class="database-empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 3h8l4 4v14H7V3Z" /><path d="M15 3v5h5M10 13h6M10 17h6" stroke-linecap="round" /></svg><strong>Belum ada backup</strong><span>Riwayat akan tersedia setelah database terhubung dan backup pertama dibuat.</span></div></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import BaseButton from '../components/BaseButton.vue'

const summary = [
  { label: 'Engine', value: 'Cloudflare D1', note: 'Rencana backend' },
  { label: 'Status Koneksi', value: 'Belum terhubung', note: 'UI mock' },
  { label: 'Ukuran Database', value: '—', note: 'Menunggu koneksi' },
  { label: 'Backup Terakhir', value: 'Belum ada', note: 'Menunggu backup pertama' },
  { label: 'Karyawan', value: '—', note: 'Data nyata nanti' },
  { label: 'Absensi', value: '—', note: 'Data nyata nanti' },
  { label: 'Tugas', value: '—', note: 'Data nyata nanti' },
  { label: 'Klien', value: '—', note: 'Data nyata nanti' }
]
</script>

<style scoped>
@import '../assets/styles/database.css';
</style>
