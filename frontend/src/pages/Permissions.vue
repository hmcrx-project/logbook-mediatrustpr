<template>
  <section class="permissions-page">
    <section class="permission-intro card">
      <div>
        <h2>Role & Permission</h2>
        <p>Hak akses menggunakan tiga preset sistem. Role melekat pada Jabatan, lalu otomatis diwariskan ke Karyawan.</p>
      </div>
      <span class="permission-preset-badge">Preset Sistem</span>
    </section>

    <div class="permission-role-grid">
      <article v-for="role in roleCards" :key="role.name" class="permission-role-card card">
        <div class="permission-role-icon" aria-hidden="true">
          <svg v-if="role.name === 'Administrator'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.5-4" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <svg v-else-if="role.name === 'Direksi'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3" /><path d="M6 20c.6-4 2.6-6 6-6s5.4 2 6 6M4 5h3M17 5h3" stroke-linecap="round" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3" /><path d="M6 20c.6-4 2.6-6 6-6s5.4 2 6 6" stroke-linecap="round" /></svg>
        </div>
        <div><h3>{{ role.name }}</h3><p>{{ role.description }}</p></div>
      </article>
    </div>

    <section class="permission-matrix-card card">
      <div class="permission-section-heading">
        <div><h2>Matrix Akses</h2><p>Dashboard selalu personal. Perbedaan role berlaku pada akses halaman dan cakupan data.</p></div>
      </div>
      <div class="permission-table-scroll">
        <table class="permission-table">
          <thead><tr><th>Fitur / Data</th><th>Administrator</th><th>Direksi</th><th>Karyawan</th></tr></thead>
          <tbody>
            <tr v-for="row in permissions" :key="row.feature">
              <td><strong>{{ row.feature }}</strong><span v-if="row.note">{{ row.note }}</span></td>
              <td><span :class="permissionClass(row.admin)">{{ row.admin }}</span></td>
              <td><span :class="permissionClass(row.director)">{{ row.director }}</span></td>
              <td><span :class="permissionClass(row.employee)">{{ row.employee }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="permission-note-card card">
      <div class="permission-note-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" stroke-linecap="round" /></svg></div>
      <div>
        <h3>Catatan implementasi</h3>
        <p>Role Karyawan hanya melihat data tugas dan absensi miliknya sendiri. Filter, kolom, dan pilihan yang berkaitan dengan karyawan lain akan disembunyikan. System Admin adalah akun pengelola terpisah, bukan karyawan dan bukan bagian dari matrix role ini.</p>
      </div>
    </section>
  </section>
</template>

<script setup>
const roleCards = [
  { name: 'Administrator', description: 'Karyawan dengan akses penuh ke seluruh fitur dan Pengaturan.' },
  { name: 'Direksi', description: 'Akses seluruh fitur operasional dan laporan, tanpa Pengaturan.' },
  { name: 'Karyawan', description: 'Akses operasional dengan cakupan data milik akun sendiri.' }
]

const permissions = [
  { feature: 'Dashboard', note: 'Selalu menampilkan data akun yang sedang login', admin: 'Data sendiri', director: 'Data sendiri', employee: 'Data sendiri' },
  { feature: 'Absensi', note: 'Cakupan data pada halaman Absensi', admin: 'Semua data', director: 'Semua data', employee: 'Data sendiri' },
  { feature: 'Tugas', note: 'Cakupan data pada halaman Tugas', admin: 'Semua data', director: 'Semua data', employee: 'Data sendiri' },
  { feature: 'Laporan', note: 'Akses halaman Laporan', admin: 'Akses', director: 'Akses', employee: 'Tidak ada' },
  { feature: 'Pengaturan', note: 'Karyawan, Jabatan, Permission, Klien, Database', admin: 'Akses', director: 'Tidak ada', employee: 'Tidak ada' },
  { feature: 'Data karyawan lain', note: 'Filter, kolom, dropdown, dan detail operasional', admin: 'Akses', director: 'Akses', employee: 'Disembunyikan' }
]

function permissionClass(value) {
  if (value === 'Tidak ada' || value === 'Disembunyikan') return 'permission-value is-denied'
  if (value === 'Data sendiri') return 'permission-value is-own'
  return 'permission-value is-allowed'
}
</script>

<style scoped>
@import '../assets/styles/permissions.css';
</style>
