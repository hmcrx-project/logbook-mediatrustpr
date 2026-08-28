<template>
  <section class="employees-page">
    <div class="employee-page-actions">
      <BaseButton @click="openAddEmployee">Tambah Karyawan</BaseButton>

      <div class="employee-search-control">
        <input
          v-model.trim="searchQuery"
          type="text"
          class="form-input employee-search-input"
          placeholder="Cari nama, username, atau jabatan"
          aria-label="Cari karyawan"
          autocomplete="off"
          @input="resetPagination"
        />
      </div>
    </div>

    <section class="employees-table-card card">
      <div class="employees-table-heading">
        <div>
          <h2>Data Karyawan</h2>
          <p>Kelola akun karyawan MediatrustPR.</p>
        </div>
        <span>{{ filteredEmployees.length }} karyawan</span>
      </div>

      <div class="employees-table-scroll">
        <table class="employees-table">
          <thead>
            <tr>
              <th class="employee-name-column">Nama Karyawan</th>
              <th class="employee-username-column">Username</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th class="employee-action-column">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in paginatedEmployees" :key="employee.id">
              <td>
                <button type="button" class="employee-name-button" @click="openEmployeeDetail(employee.id)">
                  <span class="employee-avatar" aria-hidden="true">{{ initials(employee.name) }}</span>
                  <span>{{ employee.name }}</span>
                </button>
              </td>
              <td>{{ employee.username }}</td>
              <td>{{ employee.position }}</td>
              <td><span :class="['employee-status-badge', employee.status === 'Aktif' ? 'is-active' : 'is-inactive']">{{ employee.status }}</span></td>
              <td>
                <div class="employee-row-actions">
                  <button type="button" class="employee-action-button" @click="openEditEmployee(employee.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                      <path d="M4 14.7V16h1.3L14.6 6.7 13.3 5.4 4 14.7Z" stroke-linejoin="round" />
                      <path d="m12.4 6.3 1.3-1.3a1.4 1.4 0 0 1 2 0l.3.3a1.4 1.4 0 0 1 0 2l-1.3 1.3" stroke-linecap="round" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="employee-action-button danger" @click="openDeleteEmployee(employee.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                      <path d="M4.5 6h11M8 3.5h4M6.2 6l.6 10h6.4l.6-10M8.3 8.5v5M11.7 8.5v5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>Hapus</span>
                  </button>
                  <button type="button" class="employee-action-button" @click="openChangePassword(employee.id)">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                      <rect x="4" y="8.5" width="12" height="8" rx="1.5" />
                      <path d="M6.7 8.5V6.3a3.3 3.3 0 0 1 6.6 0v2.2M10 11.5v2" stroke-linecap="round" />
                    </svg>
                    <span>Ubah Password</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="employees-pagination">
        <p>Menampilkan {{ paginationStart }}–{{ paginationEnd }} dari {{ filteredEmployees.length }} karyawan</p>

        <div class="pagination-controls">
          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage === 1"
            aria-label="Halaman sebelumnya"
            @click="changePage(currentPage - 1)"
          >
            <svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m12 5-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            :class="['pagination-button', { active: page === currentPage }]"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage === totalPages"
            aria-label="Halaman berikutnya"
            @click="changePage(currentPage + 1)"
          >
            <svg class="pagination-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m8 5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <label class="page-size-control">
            <span>Tampilkan</span>
            <span class="select-control page-size-select-control">
              <select v-model.number="pageSize" class="form-input page-size-select" @change="resetPagination">
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>
        </div>
      </div>
    </section>

    <div v-if="isEmployeeModalOpen" class="employee-modal-backdrop" @click.self="closeEmployeeModal">
      <section class="employee-modal" role="dialog" aria-modal="true" :aria-labelledby="employeeModalTitleId">
        <div class="employee-modal-heading">
          <div>
            <h3 :id="employeeModalTitleId">{{ employeeModalTitle }}</h3>
            <p v-if="employeeModalDescription">{{ employeeModalDescription }}</p>
          </div>
          <button type="button" class="employee-modal-close" aria-label="Tutup" @click="closeEmployeeModal">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 6 8 8M14 6l-8 8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div v-if="employeeModalMode === 'detail' && selectedEmployee" class="employee-detail-content">
          <div class="employee-detail-profile">
            <span class="employee-avatar employee-avatar-large" aria-hidden="true">{{ initials(selectedEmployee.name) }}</span>
            <div>
              <strong>{{ selectedEmployee.name }}</strong>
              <span>{{ selectedEmployee.position }}</span>
            </div>
          </div>

          <div class="employee-detail-list">
            <div class="employee-detail-row">
              <span>Nama Karyawan</span>
              <strong>{{ selectedEmployee.name }}</strong>
            </div>
            <div class="employee-detail-row">
              <span>Username</span>
              <strong>{{ selectedEmployee.username }}</strong>
            </div>
            <div class="employee-detail-row">
              <span>Jabatan</span>
              <strong>{{ selectedEmployee.position }}</strong>
            </div>
            <div class="employee-detail-row">
              <span>Email</span>
              <strong>{{ selectedEmployee.email }}</strong>
            </div>
            <div class="employee-detail-row">
              <span>Status</span>
              <span :class="['employee-status-badge', selectedEmployee.status === 'Aktif' ? 'is-active' : 'is-inactive']">{{ selectedEmployee.status }}</span>
            </div>
          </div>
        </div>

        <form v-else-if="employeeModalMode === 'add' || employeeModalMode === 'edit'" class="employee-form" @submit.prevent="saveEmployee">
          <label class="employee-form-field employee-form-field-wide">
            <span>Nama Karyawan</span>
            <input
              v-model.trim="employeeForm.name"
              type="text"
              :class="['form-input', { 'is-error': employeeFormSubmitted && !employeeForm.name }]"
              autocomplete="off"
            />
          </label>

          <label class="employee-form-field">
            <span>Username</span>
            <input
              v-model.trim="employeeForm.username"
              type="text"
              :class="['form-input', { 'is-error': employeeFormSubmitted && (!usernameIsValid || !usernameIsUnique) }]"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
            />
          </label>

          <label class="employee-form-field">
            <span>Jabatan</span>
            <span class="select-control">
              <select
                v-model="employeeForm.position"
                :class="['form-input', { 'is-error': employeeFormSubmitted && !employeeForm.position }]"
              >
                <option value="">Pilih Jabatan</option>
                <option v-for="position in positions" :key="position" :value="position">{{ position }}</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <label class="employee-form-field">
            <span>Email</span>
            <input
              v-model.trim="employeeForm.email"
              type="email"
              :class="['form-input', { 'is-error': employeeFormSubmitted && (!employeeForm.email || !emailIsUnique) }]"
              autocomplete="off"
            />
          </label>

          <label class="employee-form-field">
            <span>Status</span>
            <span class="select-control">
              <select
                v-model="employeeForm.status"
                :class="['form-input', { 'is-error': employeeFormSubmitted && !employeeForm.status }]"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <template v-if="employeeModalMode === 'add'">
            <label class="employee-form-field">
              <span>Password</span>
              <input
                v-model="employeeForm.password"
                type="password"
                :class="['form-input', { 'is-error': employeeFormSubmitted && !employeeForm.password }]"
                autocomplete="new-password"
              />
            </label>

            <label class="employee-form-field">
              <span>Konfirmasi Password</span>
              <input
                v-model="employeeForm.confirmPassword"
                type="password"
                :class="['form-input', { 'is-error': employeeFormSubmitted && (!employeeForm.confirmPassword || employeeForm.confirmPassword !== employeeForm.password) }]"
                autocomplete="new-password"
              />
            </label>
          </template>
        </form>

        <form v-else-if="employeeModalMode === 'password'" class="employee-form" @submit.prevent="savePassword">
          <label class="employee-form-field employee-form-field-wide">
            <span>Password Baru</span>
            <input
              v-model="passwordForm.password"
              type="password"
              :class="['form-input', { 'is-error': passwordFormSubmitted && !passwordForm.password }]"
              autocomplete="new-password"
            />
          </label>

          <label class="employee-form-field employee-form-field-wide">
            <span>Konfirmasi Password</span>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              :class="['form-input', { 'is-error': passwordFormSubmitted && (!passwordForm.confirmPassword || passwordForm.confirmPassword !== passwordForm.password) }]"
              autocomplete="new-password"
            />
          </label>
        </form>

        <div :class="['employee-modal-actions', { 'single-action': employeeModalMode === 'detail' }]">
          <template v-if="employeeModalMode === 'detail'">
            <BaseButton variant="outline" @click="closeEmployeeModal">Tutup</BaseButton>
          </template>
          <template v-else-if="employeeModalMode === 'password'">
            <BaseButton variant="outline" @click="closeEmployeeModal">Batal</BaseButton>
            <BaseButton @click="savePassword">Ubah Password</BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="outline" @click="closeEmployeeModal">Batal</BaseButton>
            <BaseButton @click="saveEmployee">{{ employeeModalMode === 'add' ? 'Simpan' : 'Update' }}</BaseButton>
          </template>
        </div>
      </section>
    </div>

    <div v-if="isDeleteConfirmOpen" class="employee-confirm-backdrop" @click.self="closeDeleteConfirm">
      <section class="employee-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-employee-title">
        <div class="employee-confirm-content">
          <h3 id="delete-employee-title">Hapus Karyawan</h3>
          <p>Hapus akun {{ selectedEmployee?.name }} dari data karyawan?</p>
        </div>
        <div class="employee-confirm-actions">
          <BaseButton variant="outline" @click="closeDeleteConfirm">Batal</BaseButton>
          <BaseButton class="employee-delete-confirm-button" @click="deleteEmployee">Hapus</BaseButton>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import BaseButton from '../components/BaseButton.vue'

const positions = [
  'Account Executive',
  'Content Specialist',
  'Direktur',
  'IT Manager',
  'Media Relations',
  'Monitoring Analyst',
  'Project Manager'
]

const employees = ref([
  { id: 'emp-002', name: 'Andi Pratama', username: 'andi.pratama', position: 'Account Executive', email: 'andi.pratama@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-003', name: 'Sinta Maharani', username: 'sinta.maharani', position: 'Media Relations', email: 'sinta.maharani@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-004', name: 'Raka Putra', username: 'raka.putra', position: 'Monitoring Analyst', email: 'raka.putra@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-005', name: 'Nadia Rahma', username: 'nadia.rahma', position: 'Content Specialist', email: 'nadia.rahma@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-006', name: 'Dimas Saputra', username: 'dimas.saputra', position: 'Account Executive', email: 'dimas.saputra@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-007', name: 'Rina Kurnia', username: 'rina.kurnia', position: 'Media Relations', email: 'rina.kurnia@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-008', name: 'Fajar Nugraha', username: 'fajar.nugraha', position: 'Monitoring Analyst', email: 'fajar.nugraha@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-009', name: 'Tania Putri', username: 'tania.putri', position: 'Content Specialist', email: 'tania.putri@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-010', name: 'Yusuf Ramadhan', username: 'yusuf.ramadhan', position: 'Project Manager', email: 'yusuf.ramadhan@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-011', name: 'Maya Lestari', username: 'maya.lestari', position: 'Account Executive', email: 'maya.lestari@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-012', name: 'Rizky Hidayat', username: 'rizky.hidayat', position: 'Media Relations', email: 'rizky.hidayat@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-013', name: 'Putri Aulia', username: 'putri.aulia', position: 'Monitoring Analyst', email: 'putri.aulia@mediatrustpr.id', password: 'demo1234', status: 'Aktif' },
  { id: 'emp-014', name: 'Bagas Wiratama', username: 'bagas.wiratama', position: 'Content Specialist', email: 'bagas.wiratama@mediatrustpr.id', password: 'demo1234', status: 'Nonaktif' }
])

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const employeeModalMode = ref('')
const isEmployeeModalOpen = ref(false)
const selectedEmployeeId = ref(null)
const employeeFormSubmitted = ref(false)
const passwordFormSubmitted = ref(false)
const isDeleteConfirmOpen = ref(false)

const employeeForm = reactive({
  name: '',
  username: '',
  position: '',
  email: '',
  status: 'Aktif',
  password: '',
  confirmPassword: ''
})

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

const selectedEmployee = computed(() => employees.value.find((employee) => employee.id === selectedEmployeeId.value) || null)
const reservedUsernames = new Set(['admin'])
const normalizedUsername = computed(() => employeeForm.username.trim().toLowerCase())
const usernameIsValid = computed(() => /^[a-z0-9._]+$/.test(normalizedUsername.value))
const usernameIsUnique = computed(() => {
  const username = normalizedUsername.value
  if (!username || reservedUsernames.has(username)) return false
  return !employees.value.some((employee) => employee.username.toLowerCase() === username && employee.id !== selectedEmployeeId.value)
})
const emailIsUnique = computed(() => {
  const email = employeeForm.email.trim().toLowerCase()
  if (!email) return false
  return !employees.value.some((employee) => employee.email.toLowerCase() === email && employee.id !== selectedEmployeeId.value)
})
const filteredEmployees = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const matchingEmployees = query
    ? employees.value.filter((employee) => [employee.name, employee.username, employee.position]
      .some((value) => String(value || '').toLowerCase().includes(query)))
    : employees.value

  return [...matchingEmployees].sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredEmployees.value.length / pageSize.value)))
const paginatedEmployees = computed(() => {
  const safePage = Math.min(currentPage.value, totalPages.value)
  const start = (safePage - 1) * pageSize.value
  return filteredEmployees.value.slice(start, start + pageSize.value)
})
const paginationStart = computed(() => filteredEmployees.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredEmployees.value.length))
const visiblePages = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const employeeModalTitle = computed(() => {
  if (employeeModalMode.value === 'add') return 'Tambah Karyawan'
  if (employeeModalMode.value === 'edit') return 'Edit Karyawan'
  if (employeeModalMode.value === 'password') return 'Ubah Password'
  return 'Detail Akun Karyawan'
})

const employeeModalDescription = computed(() => {
  if (employeeModalMode.value === 'add') return 'Tambahkan akun karyawan baru.'
  if (employeeModalMode.value === 'edit') return 'Perbarui informasi akun karyawan.'
  if (employeeModalMode.value === 'password') return selectedEmployee.value ? `Ubah password untuk ${selectedEmployee.value.name}.` : ''
  return ''
})

const employeeModalTitleId = computed(() => `employee-modal-title-${employeeModalMode.value || 'detail'}`)

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '-'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function resetEmployeeForm() {
  Object.assign(employeeForm, {
    name: '',
    username: '',
    position: '',
    email: '',
    status: 'Aktif',
    password: '',
    confirmPassword: ''
  })
  employeeFormSubmitted.value = false
}

function openAddEmployee() {
  selectedEmployeeId.value = null
  resetEmployeeForm()
  employeeModalMode.value = 'add'
  isEmployeeModalOpen.value = true
}

function openEmployeeDetail(employeeId) {
  selectedEmployeeId.value = employeeId
  employeeModalMode.value = 'detail'
  isEmployeeModalOpen.value = true
}

function openEditEmployee(employeeId) {
  const employee = employees.value.find((item) => item.id === employeeId)
  if (!employee) return
  selectedEmployeeId.value = employeeId
  Object.assign(employeeForm, {
    name: employee.name,
    username: employee.username,
    position: employee.position,
    email: employee.email,
    status: employee.status,
    password: '',
    confirmPassword: ''
  })
  employeeFormSubmitted.value = false
  employeeModalMode.value = 'edit'
  isEmployeeModalOpen.value = true
}

function openChangePassword(employeeId) {
  selectedEmployeeId.value = employeeId
  Object.assign(passwordForm, { password: '', confirmPassword: '' })
  passwordFormSubmitted.value = false
  employeeModalMode.value = 'password'
  isEmployeeModalOpen.value = true
}

function closeEmployeeModal() {
  isEmployeeModalOpen.value = false
  employeeModalMode.value = ''
  selectedEmployeeId.value = null
  employeeFormSubmitted.value = false
  passwordFormSubmitted.value = false
}

function employeeFormIsValid() {
  const baseValid = Boolean(employeeForm.name && usernameIsValid.value && usernameIsUnique.value && employeeForm.position && employeeForm.email && employeeForm.status && emailIsUnique.value)
  if (employeeModalMode.value === 'edit') return baseValid
  return baseValid && Boolean(employeeForm.password) && employeeForm.confirmPassword === employeeForm.password
}

function saveEmployee() {
  employeeFormSubmitted.value = true
  if (!employeeFormIsValid()) return

  if (employeeModalMode.value === 'add') {
    employees.value.push({
      id: `emp-${Date.now()}`,
      name: employeeForm.name,
      username: normalizedUsername.value,
      position: employeeForm.position,
      email: employeeForm.email,
      password: employeeForm.password,
      status: employeeForm.status
    })
    currentPage.value = totalPages.value
  } else if (employeeModalMode.value === 'edit') {
    const employee = selectedEmployee.value
    if (!employee) return
    employee.name = employeeForm.name
    employee.username = normalizedUsername.value
    employee.position = employeeForm.position
    employee.email = employeeForm.email
    employee.status = employeeForm.status
  }

  closeEmployeeModal()
}

function savePassword() {
  passwordFormSubmitted.value = true
  if (!passwordForm.password || passwordForm.confirmPassword !== passwordForm.password) return
  const employee = selectedEmployee.value
  if (!employee) return
  employee.password = passwordForm.password
  closeEmployeeModal()
}

function openDeleteEmployee(employeeId) {
  selectedEmployeeId.value = employeeId
  isDeleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  isDeleteConfirmOpen.value = false
  selectedEmployeeId.value = null
}

function deleteEmployee() {
  if (!selectedEmployeeId.value) return
  employees.value = employees.value.filter((employee) => employee.id !== selectedEmployeeId.value)
  currentPage.value = Math.min(currentPage.value, totalPages.value)
  closeDeleteConfirm()
}

function resetPagination() {
  currentPage.value = 1
}

function changePage(page) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}
</script>

<style scoped>
@import '../assets/styles/employees.css';
</style>
