<template>
  <section class="settings-master-page">
    <div class="settings-master-actions">
      <BaseButton @click="openAddPosition">Tambah Jabatan</BaseButton>

      <div class="settings-master-search">
        <input
          v-model.trim="searchQuery"
          type="text"
          class="form-input"
          placeholder="Cari jabatan atau role"
          aria-label="Cari jabatan"
          autocomplete="off"
          @input="resetPagination"
        />
      </div>
    </div>

    <section class="settings-master-card card">
      <div class="settings-master-heading">
        <div>
          <h2>Data Jabatan</h2>
          <p>Kelola role dan jam kerja yang melekat pada setiap jabatan.</p>
        </div>
        <span>{{ filteredPositions.length }} jabatan</span>
      </div>

      <div class="settings-master-table-scroll">
        <table class="settings-master-table positions-table">
          <thead>
            <tr>
              <th>Nama Jabatan</th>
              <th>Roles</th>
              <th>Jam Kerja</th>
              <th>Status</th>
              <th class="settings-action-column">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="position in paginatedPositions" :key="position.id">
              <td><strong>{{ position.name }}</strong></td>
              <td><span class="role-badge">{{ position.role }}</span></td>
              <td>{{ position.startTime }}–{{ position.endTime }}</td>
              <td><span :class="['status-badge', position.status === 'Aktif' ? 'is-active' : 'is-inactive']">{{ position.status }}</span></td>
              <td>
                <div class="settings-row-actions">
                  <button type="button" class="settings-action-button" @click="openEditPosition(position.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                      <path d="M4 14.7V16h1.3L14.6 6.7 13.3 5.4 4 14.7Z" stroke-linejoin="round" />
                      <path d="m12.4 6.3 1.3-1.3a1.4 1.4 0 0 1 2 0l.3.3a1.4 1.4 0 0 1 0 2l-1.3 1.3" stroke-linecap="round" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="settings-action-button danger" @click="openDeletePosition(position.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                      <path d="M4.5 6h11M8 3.5h4M6.2 6l.6 10h6.4l.6-10M8.3 8.5v5M11.7 8.5v5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="settings-pagination">
        <p>Menampilkan {{ paginationStart }}–{{ paginationEnd }} dari {{ filteredPositions.length }} jabatan</p>
        <div class="pagination-controls">
          <button type="button" class="pagination-button" :disabled="currentPage === 1" aria-label="Halaman sebelumnya" @click="changePage(currentPage - 1)">
            <svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 5-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button v-for="page in visiblePages" :key="page" type="button" :class="['pagination-button', { active: page === currentPage }]" @click="changePage(page)">{{ page }}</button>
          <button type="button" class="pagination-button" :disabled="currentPage === totalPages" aria-label="Halaman berikutnya" @click="changePage(currentPage + 1)">
            <svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <label class="page-size-control">
            <span>Tampilkan</span>
            <span class="select-control page-size-select-control">
              <select v-model.number="pageSize" class="form-input page-size-select" @change="resetPagination">
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
          </label>
        </div>
      </div>
    </section>

    <div v-if="isModalOpen" class="settings-modal-backdrop" @click.self="closeModal">
      <section class="settings-modal" role="dialog" aria-modal="true" :aria-labelledby="`position-modal-${modalMode}`">
        <div class="settings-modal-heading">
          <div>
            <h3 :id="`position-modal-${modalMode}`">{{ modalMode === 'add' ? 'Tambah Jabatan' : 'Edit Jabatan' }}</h3>
            <p>{{ modalMode === 'add' ? 'Tambahkan jabatan baru beserta role dan jam kerja.' : 'Perbarui data jabatan.' }}</p>
          </div>
          <button type="button" class="settings-modal-close" aria-label="Tutup" @click="closeModal">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8" stroke-linecap="round" /></svg>
          </button>
        </div>

        <form class="settings-form" @submit.prevent="savePosition">
          <label class="settings-form-field settings-form-field-wide">
            <span>Nama Jabatan</span>
            <input v-model.trim="form.name" type="text" :class="['form-input', { 'is-error': submitted && !form.name }]" autocomplete="off" />
          </label>

          <label class="settings-form-field">
            <span>Roles</span>
            <span class="select-control">
              <select v-model="form.role" :class="['form-input', { 'is-error': submitted && !form.role }]">
                <option value="">Pilih Role</option>
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
          </label>

          <label class="settings-form-field">
            <span>Status</span>
            <span class="select-control">
              <select v-model="form.status" :class="['form-input', { 'is-error': submitted && !form.status }]">
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
          </label>

          <label class="settings-form-field">
            <span>Jam Masuk</span>
            <input v-model="form.startTime" type="time" :class="['form-input', { 'is-error': submitted && !form.startTime }]" />
          </label>

          <label class="settings-form-field">
            <span>Jam Pulang</span>
            <input v-model="form.endTime" type="time" :class="['form-input', { 'is-error': submitted && (!form.endTime || !timeRangeValid) }]" />
          </label>
        </form>

        <div class="settings-modal-actions">
          <BaseButton variant="outline" @click="closeModal">Batal</BaseButton>
          <BaseButton @click="savePosition">{{ modalMode === 'add' ? 'Simpan' : 'Update' }}</BaseButton>
        </div>
      </section>
    </div>

    <div v-if="isDeleteOpen" class="settings-confirm-backdrop" @click.self="closeDelete">
      <section class="settings-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-position-title">
        <div class="settings-confirm-content">
          <h3 id="delete-position-title">Hapus Jabatan</h3>
          <p>Hapus jabatan {{ selectedPosition?.name }}? Pada backend nanti jabatan yang masih dipakai karyawan akan dilindungi dari penghapusan.</p>
        </div>
        <div class="settings-confirm-actions">
          <BaseButton variant="outline" @click="closeDelete">Batal</BaseButton>
          <BaseButton class="settings-danger-confirm" @click="deletePosition">Hapus</BaseButton>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import BaseButton from '../components/BaseButton.vue'

const roles = ['Administrator', 'Direksi', 'Karyawan']
const positions = ref([
  { id: 'pos-001', name: 'Account Executive', role: 'Karyawan', startTime: '09:00', endTime: '17:00', status: 'Aktif' },
  { id: 'pos-002', name: 'Content Specialist', role: 'Karyawan', startTime: '09:00', endTime: '17:00', status: 'Aktif' },
  { id: 'pos-003', name: 'Direktur', role: 'Direksi', startTime: '09:00', endTime: '17:00', status: 'Aktif' },
  { id: 'pos-004', name: 'IT Manager', role: 'Administrator', startTime: '08:00', endTime: '16:00', status: 'Aktif' },
  { id: 'pos-005', name: 'Media Relations', role: 'Karyawan', startTime: '09:00', endTime: '17:00', status: 'Aktif' },
  { id: 'pos-006', name: 'Monitoring Analyst', role: 'Karyawan', startTime: '09:00', endTime: '17:00', status: 'Aktif' },
  { id: 'pos-007', name: 'Project Manager', role: 'Karyawan', startTime: '09:00', endTime: '17:00', status: 'Aktif' },
  { id: 'pos-008', name: 'Senior Consultant', role: 'Karyawan', startTime: '09:00', endTime: '17:00', status: 'Nonaktif' }
])

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const modalMode = ref('')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const selectedPositionId = ref(null)
const submitted = ref(false)
const form = reactive({ name: '', role: '', startTime: '', endTime: '', status: 'Aktif' })

const selectedPosition = computed(() => positions.value.find((item) => item.id === selectedPositionId.value) || null)
const timeRangeValid = computed(() => Boolean(form.startTime && form.endTime && form.endTime > form.startTime))
const filteredPositions = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const result = query
    ? positions.value.filter((item) => [item.name, item.role].some((value) => value.toLowerCase().includes(query)))
    : positions.value
  return [...result].sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPositions.value.length / pageSize.value)))
const paginatedPositions = computed(() => {
  const safePage = Math.min(currentPage.value, totalPages.value)
  const start = (safePage - 1) * pageSize.value
  return filteredPositions.value.slice(start, start + pageSize.value)
})
const paginationStart = computed(() => filteredPositions.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredPositions.value.length))
const visiblePages = computed(() => {
  if (totalPages.value <= 5) return Array.from({ length: totalPages.value }, (_, index) => index + 1)
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

function resetForm() {
  Object.assign(form, { name: '', role: '', startTime: '', endTime: '', status: 'Aktif' })
  submitted.value = false
}
function openAddPosition() {
  selectedPositionId.value = null
  resetForm()
  modalMode.value = 'add'
  isModalOpen.value = true
}
function openEditPosition(id) {
  const position = positions.value.find((item) => item.id === id)
  if (!position) return
  selectedPositionId.value = id
  Object.assign(form, position)
  submitted.value = false
  modalMode.value = 'edit'
  isModalOpen.value = true
}
function closeModal() {
  isModalOpen.value = false
  modalMode.value = ''
  selectedPositionId.value = null
  submitted.value = false
}
function savePosition() {
  submitted.value = true
  if (!form.name || !form.role || !form.startTime || !form.endTime || !form.status || !timeRangeValid.value) return
  if (modalMode.value === 'add') {
    positions.value.push({ id: `pos-${Date.now()}`, name: form.name, role: form.role, startTime: form.startTime, endTime: form.endTime, status: form.status })
  } else {
    const position = selectedPosition.value
    if (!position) return
    Object.assign(position, { name: form.name, role: form.role, startTime: form.startTime, endTime: form.endTime, status: form.status })
  }
  closeModal()
}
function openDeletePosition(id) {
  selectedPositionId.value = id
  isDeleteOpen.value = true
}
function closeDelete() {
  isDeleteOpen.value = false
  selectedPositionId.value = null
}
function deletePosition() {
  positions.value = positions.value.filter((item) => item.id !== selectedPositionId.value)
  currentPage.value = Math.min(currentPage.value, totalPages.value)
  closeDelete()
}
function resetPagination() { currentPage.value = 1 }
function changePage(page) { currentPage.value = Math.min(Math.max(page, 1), totalPages.value) }
</script>

<style scoped>
@import '../assets/styles/settings-master.css';
</style>
