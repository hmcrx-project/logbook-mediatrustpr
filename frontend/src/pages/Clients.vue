<template>
  <section class="settings-master-page">
    <div class="settings-master-actions">
      <BaseButton @click="openAddClient">Tambah Klien</BaseButton>
      <div class="settings-master-search">
        <input v-model.trim="searchQuery" type="text" class="form-input" placeholder="Cari klien" aria-label="Cari klien" autocomplete="off" @input="resetPagination" />
      </div>
    </div>

    <section class="settings-master-card card">
      <div class="settings-master-heading">
        <div>
          <h2>Data Klien</h2>
          <p>Kelola master klien yang digunakan pada data tugas.</p>
        </div>
        <span>{{ filteredClients.length }} klien</span>
      </div>

      <div class="settings-master-table-scroll">
        <table class="settings-master-table clients-table">
          <thead><tr><th>Nama Klien</th><th>Status</th><th class="settings-action-column">Tindakan</th></tr></thead>
          <tbody>
            <tr v-for="client in paginatedClients" :key="client.id">
              <td><button type="button" class="settings-name-button" @click="openClientDetail(client.id)">{{ client.name }}</button></td>
              <td><span :class="['status-badge', client.status === 'Aktif' ? 'is-active' : 'is-inactive']">{{ client.status }}</span></td>
              <td>
                <div class="settings-row-actions">
                  <button type="button" class="settings-action-button" @click="openEditClient(client.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 14.7V16h1.3L14.6 6.7 13.3 5.4 4 14.7Z" stroke-linejoin="round" /><path d="m12.4 6.3 1.3-1.3a1.4 1.4 0 0 1 2 0l.3.3a1.4 1.4 0 0 1 0 2l-1.3 1.3" stroke-linecap="round" /></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="settings-action-button danger" @click="openDeleteClient(client.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4.5 6h11M8 3.5h4M6.2 6l.6 10h6.4l.6-10M8.3 8.5v5M11.7 8.5v5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="settings-pagination">
        <p>Menampilkan {{ paginationStart }}–{{ paginationEnd }} dari {{ filteredClients.length }} klien</p>
        <div class="pagination-controls">
          <button type="button" class="pagination-button" :disabled="currentPage === 1" aria-label="Halaman sebelumnya" @click="changePage(currentPage - 1)"><svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 5-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          <button v-for="page in visiblePages" :key="page" type="button" :class="['pagination-button', { active: page === currentPage }]" @click="changePage(page)">{{ page }}</button>
          <button type="button" class="pagination-button" :disabled="currentPage === totalPages" aria-label="Halaman berikutnya" @click="changePage(currentPage + 1)"><svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          <label class="page-size-control"><span>Tampilkan</span><span class="select-control page-size-select-control"><select v-model.number="pageSize" class="form-input page-size-select" @change="resetPagination"><option :value="10">10</option><option :value="20">20</option></select><svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" /></svg></span></label>
        </div>
      </div>
    </section>

    <div v-if="isModalOpen" class="settings-modal-backdrop" @click.self="closeModal">
      <section class="settings-modal settings-modal-small" role="dialog" aria-modal="true" :aria-labelledby="`client-modal-${modalMode}`">
        <div class="settings-modal-heading">
          <div>
            <h3 :id="`client-modal-${modalMode}`">{{ modalTitle }}</h3>
            <p v-if="modalDescription">{{ modalDescription }}</p>
          </div>
          <button type="button" class="settings-modal-close" aria-label="Tutup" @click="closeModal"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8" stroke-linecap="round" /></svg></button>
        </div>

        <div v-if="modalMode === 'detail' && selectedClient" class="settings-detail-content">
          <div class="settings-detail-row"><span>Nama Klien</span><strong>{{ selectedClient.name }}</strong></div>
          <div class="settings-detail-row"><span>Status</span><span :class="['status-badge', selectedClient.status === 'Aktif' ? 'is-active' : 'is-inactive']">{{ selectedClient.status }}</span></div>
        </div>

        <form v-else class="settings-form settings-form-single" @submit.prevent="saveClient">
          <label class="settings-form-field"><span>Nama Klien</span><input v-model.trim="form.name" type="text" :class="['form-input', { 'is-error': submitted && !form.name }]" autocomplete="off" /></label>
          <label class="settings-form-field"><span>Status</span><span class="select-control"><select v-model="form.status" :class="['form-input', { 'is-error': submitted && !form.status }]"><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select><svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" /></svg></span></label>
        </form>

        <div :class="['settings-modal-actions', { 'single-action': modalMode === 'detail' }]">
          <BaseButton v-if="modalMode === 'detail'" variant="outline" @click="closeModal">Tutup</BaseButton>
          <template v-else><BaseButton variant="outline" @click="closeModal">Batal</BaseButton><BaseButton @click="saveClient">{{ modalMode === 'add' ? 'Simpan' : 'Update' }}</BaseButton></template>
        </div>
      </section>
    </div>

    <div v-if="isDeleteOpen" class="settings-confirm-backdrop" @click.self="closeDelete">
      <section class="settings-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-client-title">
        <div class="settings-confirm-content"><h3 id="delete-client-title">Hapus Klien</h3><p>Hapus {{ selectedClient?.name }}? Pada backend nanti klien yang sudah memiliki histori tugas akan diarahkan untuk dinonaktifkan, bukan dihapus permanen.</p></div>
        <div class="settings-confirm-actions"><BaseButton variant="outline" @click="closeDelete">Batal</BaseButton><BaseButton class="settings-danger-confirm" @click="deleteClient">Hapus</BaseButton></div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import BaseButton from '../components/BaseButton.vue'

const clients = ref([
  { id: 'client-001', name: 'Arunika Digital', status: 'Aktif' },
  { id: 'client-002', name: 'Bank Sentra', status: 'Aktif' },
  { id: 'client-003', name: 'Cakrawala Consumer', status: 'Aktif' },
  { id: 'client-004', name: 'Nusantara Energi', status: 'Aktif' },
  { id: 'client-005', name: 'Sagara Retail', status: 'Nonaktif' }
])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const modalMode = ref('')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const selectedClientId = ref(null)
const submitted = ref(false)
const form = reactive({ name: '', status: 'Aktif' })

const selectedClient = computed(() => clients.value.find((item) => item.id === selectedClientId.value) || null)
const filteredClients = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const result = query ? clients.value.filter((item) => item.name.toLowerCase().includes(query)) : clients.value
  return [...result].sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredClients.value.length / pageSize.value)))
const paginatedClients = computed(() => {
  const safePage = Math.min(currentPage.value, totalPages.value)
  const start = (safePage - 1) * pageSize.value
  return filteredClients.value.slice(start, start + pageSize.value)
})
const paginationStart = computed(() => filteredClients.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredClients.value.length))
const visiblePages = computed(() => {
  if (totalPages.value <= 5) return Array.from({ length: totalPages.value }, (_, index) => index + 1)
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})
const modalTitle = computed(() => modalMode.value === 'add' ? 'Tambah Klien' : modalMode.value === 'edit' ? 'Edit Klien' : 'Detail Klien')
const modalDescription = computed(() => modalMode.value === 'add' ? 'Tambahkan klien baru.' : modalMode.value === 'edit' ? 'Perbarui data klien.' : '')

function resetForm() { Object.assign(form, { name: '', status: 'Aktif' }); submitted.value = false }
function openAddClient() { selectedClientId.value = null; resetForm(); modalMode.value = 'add'; isModalOpen.value = true }
function openClientDetail(id) { selectedClientId.value = id; modalMode.value = 'detail'; isModalOpen.value = true }
function openEditClient(id) { const client = clients.value.find((item) => item.id === id); if (!client) return; selectedClientId.value = id; Object.assign(form, client); submitted.value = false; modalMode.value = 'edit'; isModalOpen.value = true }
function closeModal() { isModalOpen.value = false; modalMode.value = ''; selectedClientId.value = null; submitted.value = false }
function saveClient() {
  submitted.value = true
  if (!form.name || !form.status) return
  if (modalMode.value === 'add') clients.value.push({ id: `client-${Date.now()}`, name: form.name, status: form.status })
  else if (selectedClient.value) Object.assign(selectedClient.value, { name: form.name, status: form.status })
  closeModal()
}
function openDeleteClient(id) { selectedClientId.value = id; isDeleteOpen.value = true }
function closeDelete() { isDeleteOpen.value = false; selectedClientId.value = null }
function deleteClient() { clients.value = clients.value.filter((item) => item.id !== selectedClientId.value); currentPage.value = Math.min(currentPage.value, totalPages.value); closeDelete() }
function resetPagination() { currentPage.value = 1 }
function changePage(page) { currentPage.value = Math.min(Math.max(page, 1), totalPages.value) }
</script>

<style scoped>
@import '../assets/styles/settings-master.css';
</style>
