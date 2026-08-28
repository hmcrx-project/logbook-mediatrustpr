<template>
  <section class="attendance-page">
    <section class="attendance-filter" aria-label="Filter absensi">
      <div class="filter-grid">
        <label class="filter-field">
          <span>Nama Karyawan</span>
          <select v-model="draftFilters.employee" class="form-input">
            <option value="all">Semua Karyawan</option>
            <option v-for="employee in employees" :key="employee.id" :value="employee.id">
              {{ employee.name }}
            </option>
          </select>
        </label>

        <label class="filter-field">
          <span>Jabatan</span>
          <select v-model="draftFilters.position" class="form-input">
            <option value="all">Semua Jabatan</option>
            <option v-for="position in positions" :key="position" :value="position">
              {{ position }}
            </option>
          </select>
        </label>

        <label class="filter-field">
          <span>Bulan</span>
          <select v-model.number="draftFilters.month" class="form-input">
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </label>

        <label class="filter-field">
          <span>Tahun</span>
          <select v-model.number="draftFilters.year" class="form-input">
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </label>

        <div class="filter-inline-actions">
          <BaseButton @click="applyFilters">Filter</BaseButton>
          <BaseButton variant="outline" @click="resetFilters">Reset</BaseButton>
        </div>
      </div>

      <div class="filter-secondary-actions">
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

      <div class="attendance-table-scroll" @wheel="handleTableWheel">
        <table class="attendance-table">
          <thead>
            <tr>
              <th class="employee-column">Nama Karyawan</th>
              <th v-for="day in daysInMonth" :key="day" class="day-column">{{ day }}</th>
              <th class="total-column">Total</th>
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
                  class="duration-button"
                  type="button"
                  @click="openDetail(employee, day)"
                >
                  {{ formatDuration(getAttendance(employee, day).durationMinutes) }}
                </button>
                <span v-else class="empty-attendance">-</span>
              </td>
              <td class="total-cell">{{ formatDuration(getEmployeeTotalMinutes(employee)) }}</td>
            </tr>
            <tr v-if="filteredEmployees.length === 0">
              <td :colspan="daysInMonth.length + 2" class="empty-state">
                Tidak ada data karyawan sesuai filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

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
              <strong>{{ selectedDetail.attendance.checkOut }} WIB</strong>
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
              <input v-model="editForm.checkIn" type="time" class="form-input" />
            </label>
            <label class="detail-edit-field">
              <span>Absen Pulang</span>
              <input v-model="editForm.checkOut" type="time" class="form-input" />
            </label>
            <label class="detail-edit-field">
              <span>Lokasi Kerja</span>
              <select v-model="editForm.workLocation" class="form-input">
                <option value="WFO">WFO</option>
                <option value="WFH">WFH</option>
              </select>
            </label>
            <div class="detail-row total-row">
              <span>Total Jam Kerja</span>
              <strong>{{ editDurationLabel }}</strong>
            </div>
            <p v-if="editError" class="detail-edit-error">{{ editError }}</p>
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
const selectedDetail = ref(null)
const isEditingDetail = ref(false)
const editError = ref('')
const attendanceOverrides = reactive({})
const editForm = reactive({
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

function getEmployeeTotalMinutes(employee) {
  return daysInMonth.value.reduce((totalMinutes, day) => {
    const attendance = getAttendance(employee, day)
    return totalMinutes + (attendance?.durationMinutes || 0)
  }, 0)
}

function getAttendanceKey(employeeId, day) {
  return `${activeFilters.year}-${activeFilters.month}-${day}-${employeeId}`
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

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}j ${String(remainingMinutes).padStart(2, '0')}m`
}

function openDetail(employee, day) {
  const attendance = getAttendance(employee, day)
  if (!attendance) return

  selectedDetail.value = { employee, day, attendance: { ...attendance } }
  isEditingDetail.value = false
  editError.value = ''
}

function startEditDetail() {
  if (!selectedDetail.value) return

  Object.assign(editForm, {
    checkIn: selectedDetail.value.attendance.checkIn,
    checkOut: selectedDetail.value.attendance.checkOut,
    workLocation: selectedDetail.value.attendance.workLocation
  })
  editError.value = ''
  isEditingDetail.value = true
}

function cancelEditDetail() {
  isEditingDetail.value = false
  editError.value = ''
}

function saveDetail() {
  if (!selectedDetail.value) return

  if (editDurationMinutes.value === null) {
    editError.value = 'Jam pulang harus lebih besar dari jam masuk.'
    return
  }

  const updatedAttendance = {
    checkIn: editForm.checkIn,
    checkOut: editForm.checkOut,
    workLocation: editForm.workLocation,
    durationMinutes: editDurationMinutes.value
  }

  const key = getAttendanceKey(selectedDetail.value.employee.id, selectedDetail.value.day)
  attendanceOverrides[key] = updatedAttendance
  selectedDetail.value.attendance = { ...updatedAttendance }
  isEditingDetail.value = false
  editError.value = ''
}

function closeDetail() {
  selectedDetail.value = null
  isEditingDetail.value = false
  editError.value = ''
}

function handleTableWheel(event) {
  const container = event.currentTarget
  if (!container || container.scrollWidth <= container.clientWidth) return

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (!delta) return

  const maxScrollLeft = container.scrollWidth - container.clientWidth
  const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, container.scrollLeft + delta))

  if (nextScrollLeft !== container.scrollLeft) {
    event.preventDefault()
    container.scrollLeft = nextScrollLeft
  }
}

function exportToExcel() {
  const rows = [
    ['Nama Karyawan', ...daysInMonth.value, 'Total'],
    ...filteredEmployees.value.map((employee) => [
      employee.name,
      ...daysInMonth.value.map((day) => {
        const attendance = getAttendance(employee, day)
        return attendance ? formatDuration(attendance.durationMinutes) : '-'
      }),
      formatDuration(getEmployeeTotalMinutes(employee))
    ])
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 24 },
    ...daysInMonth.value.map(() => ({ wch: 9 })),
    { wch: 12 }
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
