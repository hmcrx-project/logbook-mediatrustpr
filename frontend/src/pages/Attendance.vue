<template>
  <section class="attendance-page">
    <section class="attendance-filter" aria-label="Filter absensi">
      <BaseButton
        type="button"
        variant="outline"
        class="responsive-filter-toggle"
        :aria-expanded="isFilterExpanded"
        aria-controls="attendance-filter-panel"
        @click="isFilterExpanded = !isFilterExpanded"
      >
        <span class="responsive-filter-toggle-label">
          <svg class="responsive-filter-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M3 5h14M5.5 10h9M8 15h4" stroke-linecap="round" />
          </svg>
          <span>Filter</span>
        </span>
        <svg class="responsive-filter-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </BaseButton>

      <div id="attendance-filter-panel" class="responsive-filter-panel" :class="{ 'is-open': isFilterExpanded }">
        <div class="filter-grid">
        <label class="filter-field">
          <span>Nama Karyawan</span>
          <span class="select-control">
            <select v-model="draftFilters.employee" class="form-input">
              <option value="all">Semua Karyawan</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="filter-field">
          <span>Jabatan</span>
          <span class="select-control">
            <select v-model="draftFilters.position" class="form-input">
              <option value="all">Semua Jabatan</option>
              <option v-for="position in positions" :key="position" :value="position">
                {{ position }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="filter-field">
          <span>Bulan</span>
          <span class="select-control">
            <select v-model.number="draftFilters.month" class="form-input">
              <option v-for="month in months" :key="month.value" :value="month.value">
                {{ month.label }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

        <label class="filter-field">
          <span>Tahun</span>
          <span class="select-control">
            <select v-model.number="draftFilters.year" class="form-input">
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>

          <div class="filter-inline-actions">
            <BaseButton @click="applyFilters">Filter</BaseButton>
            <BaseButton variant="outline" @click="resetFilters">Reset</BaseButton>
          </div>
        </div>
      </div>

      <div class="filter-secondary-actions">
        <BaseButton class="attendance-add-button" @click="openAddAttendance">
          <span class="attendance-action-label">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke-linecap="round" />
            </svg>
            <span>Tambah Absensi</span>
          </span>
        </BaseButton>
        <BaseButton variant="outline" @click="exportToExcel">Export to Excel</BaseButton>
      </div>
    </section>

    <section class="attendance-table-card card">
      <div class="table-heading">
        <div>
          <h2>Data Absensi</h2>
          <p>{{ activeMonthLabel }} {{ activeFilters.year }}</p>
        </div>
        <span>{{ filteredEmployees.length }} karyawan</span>
      </div>

      <div class="attendance-table-scroll">
        <table class="attendance-table">
          <thead>
            <tr>
              <th class="employee-column">Nama Karyawan</th>
              <th v-for="day in daysInMonth" :key="day" class="day-column">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in filteredEmployees" :key="employee.id">
              <th class="employee-column employee-cell" scope="row">
                <strong>{{ employee.name }}</strong>
                <span>{{ employee.position }}</span>
              </th>
              <td v-for="day in daysInMonth" :key="`${employee.id}-${day}`" class="attendance-cell">
                <button
                  v-if="getAttendance(employee, day)"
                  class="attendance-time-button"
                  type="button"
                  @click="openDetail(employee, day)"
                >
                  {{ formatAttendanceRange(getAttendance(employee, day)) }}
                </button>
                <span v-else class="empty-attendance">-</span>
              </td>
            </tr>
            <tr v-if="filteredEmployees.length === 0">
              <td :colspan="daysInMonth.length + 1" class="empty-state">
                Tidak ada data karyawan sesuai filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="isAddAttendanceOpen" class="attendance-detail-backdrop" @click.self="closeAddAttendance">
      <section class="attendance-detail-modal attendance-add-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-add-title">
        <div class="detail-modal-heading">
          <div>
            <h3 id="attendance-add-title">Tambah Absensi</h3>
            <p>Tambahkan data absensi karyawan secara manual.</p>
          </div>
          <button type="button" class="modal-close-button" aria-label="Tutup" @click="closeAddAttendance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <form class="attendance-add-form" @submit.prevent="saveAddedAttendance">
          <div class="attendance-add-form-content">
            <label class="attendance-add-field">
              <span>Nama Karyawan</span>
              <span class="select-control">
                <select
                  v-model="addAttendanceForm.employeeId"
                  :class="['form-input', { 'is-error': addAttendanceSubmitted && !addAttendanceForm.employeeId }]"
                >
                  <option value="" disabled>Pilih karyawan</option>
                  <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                    {{ employee.name }}
                  </option>
                </select>
                <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </label>

            <label class="attendance-add-field">
              <span>Tanggal</span>
              <input
                v-model="addAttendanceForm.date"
                type="date"
                :class="['form-input', { 'is-error': addAttendanceSubmitted && !addAttendanceForm.date }]"
              />
            </label>

            <div class="attendance-add-time-grid">
              <label class="attendance-add-field">
                <span>Absen Masuk</span>
                <input
                  v-model="addAttendanceForm.checkIn"
                  type="time"
                  :class="['form-input', { 'is-error': addAttendanceSubmitted && !addAttendanceForm.checkIn }]"
                />
              </label>

              <label class="attendance-add-field">
                <span>Absen Pulang</span>
                <input
                  v-model="addAttendanceForm.checkOut"
                  type="time"
                  :class="['form-input', { 'is-error': addAttendanceSubmitted && isAddCheckoutInvalid }]"
                />
              </label>
            </div>

            <label class="attendance-add-field">
              <span>Lokasi Kerja</span>
              <span class="select-control">
                <select
                  v-model="addAttendanceForm.workLocation"
                  :class="['form-input', { 'is-error': addAttendanceSubmitted && !addAttendanceForm.workLocation }]"
                >
                  <option value="WFO">WFO</option>
                  <option value="WFH">WFH</option>
                </select>
                <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </label>
          </div>

          <div class="detail-modal-actions">
            <BaseButton type="button" variant="outline" @click="closeAddAttendance">Batal</BaseButton>
            <BaseButton type="submit">Simpan</BaseButton>
          </div>
        </form>
      </section>
    </div>

    <div v-if="selectedDetail" class="attendance-detail-backdrop" @click.self="closeDetail">
      <section class="attendance-detail-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-detail-title">
        <div class="detail-modal-heading">
          <div>
            <h3 id="attendance-detail-title">Detail Absensi</h3>
            <p>{{ selectedDetail.employee.name }}</p>
          </div>
          <button type="button" class="modal-close-button" aria-label="Tutup" @click="closeDetail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div class="detail-modal-content">
          <div class="detail-row">
            <span>Tanggal</span>
            <strong>{{ detailDateLabel }}</strong>
          </div>

          <template v-if="!isEditingDetail">
            <div class="detail-row">
              <span>Absen Masuk</span>
              <strong>{{ selectedDetail.attendance.checkIn }} WIB</strong>
            </div>
            <div class="detail-row">
              <span>Absen Pulang</span>
              <strong>{{ selectedDetail.attendance.checkOut ? `${selectedDetail.attendance.checkOut} WIB` : '-' }}</strong>
            </div>
            <div class="detail-row">
              <span>Lokasi Kerja</span>
              <strong>{{ selectedDetail.attendance.workLocation }}</strong>
            </div>
            <div class="detail-row total-row">
              <span>Total Jam Kerja</span>
              <strong>{{ formatDuration(selectedDetail.attendance.durationMinutes) }}</strong>
            </div>
          </template>

          <template v-else>
            <label class="detail-edit-field">
              <span>Absen Masuk</span>
              <input
                v-model="editForm.checkIn"
                type="time"
                :class="['form-input', { 'is-error': editSubmitted && !editForm.checkIn }]"
              />
            </label>
            <label class="detail-edit-field">
              <span>Absen Pulang</span>
              <input
                v-model="editForm.checkOut"
                type="time"
                :class="['form-input', { 'is-error': editSubmitted && isEditCheckoutInvalid }]"
              />
            </label>
            <label class="detail-edit-field">
              <span>Lokasi Kerja</span>
              <span class="select-control">
                <select
                  v-model="editForm.workLocation"
                  :class="['form-input', { 'is-error': editSubmitted && !editForm.workLocation }]"
                >
                  <option value="WFO">WFO</option>
                  <option value="WFH">WFH</option>
                </select>
                <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </label>
            <div class="detail-row total-row">
              <span>Total Jam Kerja</span>
              <strong>{{ editDurationLabel }}</strong>
            </div>
          </template>
        </div>

        <div class="detail-modal-actions">
          <template v-if="!isEditingDetail">
            <BaseButton variant="outline" @click="startEditDetail">Edit</BaseButton>
            <BaseButton @click="closeDetail">Tutup</BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="outline" @click="cancelEditDetail">Batal</BaseButton>
            <BaseButton @click="saveDetail">Simpan</BaseButton>
          </template>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import * as XLSX from 'xlsx'
import BaseButton from '../components/BaseButton.vue'

const jakartaNowParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}).formatToParts(new Date())

const nowPart = (type) => Number(jakartaNowParts.find((part) => part.type === type)?.value || 0)
const currentMonth = nowPart('month') || 1
const currentYear = nowPart('year') || new Date().getFullYear()
const currentDay = nowPart('day') || 1
const currentDateInput = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`

const employees = [
  { id: 'emp-001', name: 'Admin MediatrustPR', position: 'Administrator' },
  { id: 'emp-002', name: 'Andi Pratama', position: 'Account Executive' },
  { id: 'emp-003', name: 'Sinta Maharani', position: 'Media Relations' },
  { id: 'emp-004', name: 'Raka Putra', position: 'Monitoring Analyst' },
  { id: 'emp-005', name: 'Nadia Rahma', position: 'Content Specialist' },
  { id: 'emp-006', name: 'Dimas Saputra', position: 'Account Executive' }
]

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
].map((label, index) => ({ label, value: index + 1 }))

const years = Array.from({ length: 16 }, (_, index) => currentYear - 10 + index)
const positions = [...new Set(employees.map((employee) => employee.position))]

const draftFilters = reactive({
  employee: 'all',
  position: 'all',
  month: currentMonth,
  year: currentYear
})

const activeFilters = reactive({ ...draftFilters })
const isFilterExpanded = ref(false)
const selectedDetail = ref(null)
const isEditingDetail = ref(false)
const editSubmitted = ref(false)
const isAddAttendanceOpen = ref(false)
const addAttendanceSubmitted = ref(false)
const attendanceOverrides = reactive({})
const editForm = reactive({
  checkIn: '',
  checkOut: '',
  workLocation: 'WFO'
})
const addAttendanceForm = reactive({
  employeeId: '',
  date: currentDateInput,
  checkIn: '',
  checkOut: '',
  workLocation: 'WFO'
})

const activeMonthLabel = computed(() => months.find((month) => month.value === activeFilters.month)?.label || '')

const daysInMonth = computed(() => {
  const totalDays = new Date(Date.UTC(activeFilters.year, activeFilters.month, 0, 12)).getUTCDate()
  return Array.from({ length: totalDays }, (_, index) => index + 1)
})

const filteredEmployees = computed(() => employees.filter((employee) => {
  const matchesEmployee = activeFilters.employee === 'all' || employee.id === activeFilters.employee
  const matchesPosition = activeFilters.position === 'all' || employee.position === activeFilters.position
  return matchesEmployee && matchesPosition
}))

const detailDateLabel = computed(() => {
  if (!selectedDetail.value) return ''

  const date = new Date(Date.UTC(
    activeFilters.year,
    activeFilters.month - 1,
    selectedDetail.value.day,
    12
  ))

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
})

const editDurationMinutes = computed(() => {
  const checkIn = timeToMinutes(editForm.checkIn)
  const checkOut = timeToMinutes(editForm.checkOut)

  if (checkIn === null || checkOut === null || checkOut <= checkIn) return null
  return checkOut - checkIn
})

const editDurationLabel = computed(() => (
  editDurationMinutes.value === null ? '-' : formatDuration(editDurationMinutes.value)
))

const isEditCheckoutInvalid = computed(() => {
  if (!editForm.checkOut) return false

  const checkIn = timeToMinutes(editForm.checkIn)
  const checkOut = timeToMinutes(editForm.checkOut)
  return checkIn === null || checkOut === null || checkOut <= checkIn
})

const isAddCheckoutInvalid = computed(() => {
  if (!addAttendanceForm.checkOut) return false

  const checkIn = timeToMinutes(addAttendanceForm.checkIn)
  const checkOut = timeToMinutes(addAttendanceForm.checkOut)
  return checkIn === null || checkOut === null || checkOut <= checkIn
})

function applyFilters() {
  Object.assign(activeFilters, draftFilters)
  closeDetail()
}

function resetFilters() {
  Object.assign(draftFilters, {
    employee: 'all',
    position: 'all',
    month: currentMonth,
    year: currentYear
  })
  Object.assign(activeFilters, draftFilters)
  closeDetail()
}

function getAttendance(employee, day) {
  const overrideKey = getAttendanceKey(employee.id, day)
  if (attendanceOverrides[overrideKey]) return attendanceOverrides[overrideKey]

  const date = new Date(Date.UTC(activeFilters.year, activeFilters.month - 1, day, 12))
  const weekday = date.getUTCDay()

  if (weekday === 0 || weekday === 6) return null

  const employeeIndex = employees.findIndex((item) => item.id === employee.id)
  const seed = activeFilters.year + activeFilters.month * 17 + day * 11 + employeeIndex * 7

  if (seed % 13 === 0) return null

  const checkInMinutes = 8 * 60 + 43 + (seed % 25)
  const workMinutes = 7 * 60 + 35 + (seed % 64)
  const checkOutMinutes = checkInMinutes + workMinutes

  return {
    checkIn: minutesToTime(checkInMinutes),
    checkOut: minutesToTime(checkOutMinutes),
    durationMinutes: workMinutes,
    workLocation: seed % 2 === 0 ? 'WFO' : 'WFH'
  }
}


function getAttendanceKey(employeeId, day, year = activeFilters.year, month = activeFilters.month) {
  return `${year}-${month}-${day}-${employeeId}`
}

function minutesToTime(totalMinutes) {
  const normalized = totalMinutes % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null

  const [hours, minutes] = value.split(':').map(Number)
  if (hours > 23 || minutes > 59) return null

  return hours * 60 + minutes
}

function formatAttendanceRange(attendance) {
  if (!attendance?.checkIn) return '-'
  return `${attendance.checkIn}–${attendance.checkOut || '…'}`
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return '-'

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}j ${String(remainingMinutes).padStart(2, '0')}m`
}

function openDetail(employee, day) {
  const attendance = getAttendance(employee, day)
  if (!attendance) return

  selectedDetail.value = { employee, day, attendance: { ...attendance } }
  isEditingDetail.value = false
  editSubmitted.value = false
}

function startEditDetail() {
  if (!selectedDetail.value) return

  Object.assign(editForm, {
    checkIn: selectedDetail.value.attendance.checkIn,
    checkOut: selectedDetail.value.attendance.checkOut,
    workLocation: selectedDetail.value.attendance.workLocation
  })
  editSubmitted.value = false
  isEditingDetail.value = true
}

function cancelEditDetail() {
  isEditingDetail.value = false
  editSubmitted.value = false
}

function saveDetail() {
  if (!selectedDetail.value) return

  editSubmitted.value = true
  if (!editForm.checkIn || !editForm.workLocation || isEditCheckoutInvalid.value) return

  const updatedAttendance = {
    checkIn: editForm.checkIn,
    checkOut: editForm.checkOut,
    workLocation: editForm.workLocation,
    durationMinutes: editForm.checkOut ? editDurationMinutes.value : null
  }

  const key = getAttendanceKey(selectedDetail.value.employee.id, selectedDetail.value.day)
  attendanceOverrides[key] = updatedAttendance
  selectedDetail.value.attendance = { ...updatedAttendance }
  isEditingDetail.value = false
  editSubmitted.value = false
}

function closeDetail() {
  selectedDetail.value = null
  isEditingDetail.value = false
  editSubmitted.value = false
}

function openAddAttendance() {
  Object.assign(addAttendanceForm, {
    employeeId: '',
    date: currentDateInput,
    checkIn: '',
    checkOut: '',
    workLocation: 'WFO'
  })
  addAttendanceSubmitted.value = false
  isAddAttendanceOpen.value = true
}

function closeAddAttendance() {
  isAddAttendanceOpen.value = false
  addAttendanceSubmitted.value = false
}

function saveAddedAttendance() {
  addAttendanceSubmitted.value = true

  if (
    !addAttendanceForm.employeeId ||
    !addAttendanceForm.date ||
    !addAttendanceForm.checkIn ||
    !addAttendanceForm.workLocation ||
    isAddCheckoutInvalid.value
  ) return

  const [year, month, day] = addAttendanceForm.date.split('-').map(Number)
  if (!year || !month || !day) return

  const checkInMinutes = timeToMinutes(addAttendanceForm.checkIn)
  const checkOutMinutes = addAttendanceForm.checkOut ? timeToMinutes(addAttendanceForm.checkOut) : null
  const durationMinutes = checkOutMinutes === null ? null : checkOutMinutes - checkInMinutes

  const key = getAttendanceKey(addAttendanceForm.employeeId, day, year, month)
  attendanceOverrides[key] = {
    checkIn: addAttendanceForm.checkIn,
    checkOut: addAttendanceForm.checkOut,
    durationMinutes,
    workLocation: addAttendanceForm.workLocation
  }

  if (activeFilters.year !== year || activeFilters.month !== month) {
    activeFilters.year = year
    activeFilters.month = month
    draftFilters.year = year
    draftFilters.month = month
  }

  closeDetail()
  closeAddAttendance()
}

function exportToExcel() {
  const rows = [
    ['Nama Karyawan', ...daysInMonth.value],
    ...filteredEmployees.value.map((employee) => [
      employee.name,
      ...daysInMonth.value.map((day) => {
        const attendance = getAttendance(employee, day)
        return attendance ? formatAttendanceRange(attendance) : '-'
      })
    ])
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 24 },
    ...daysInMonth.value.map(() => ({ wch: 14 }))
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi')

  const monthSlug = activeMonthLabel.value.toLowerCase()
  XLSX.writeFile(workbook, `absensi-${monthSlug}-${activeFilters.year}.xlsx`, {
    compression: true
  })
}
</script>

<style scoped>
@import '../assets/styles/attendance.css';
</style>
