<template>
  <section class="tasks-page">
    <section class="tasks-filter">
      <div class="task-filter-grid">
        <label class="task-filter-field search-field">
          <span>Pencarian</span>
          <input
            v-model.trim="draftFilters.search"
            type="search"
            class="form-input"
            placeholder="Cari nama tugas..."
            @keyup.enter="applyFilters"
          />
        </label>

        <label class="task-filter-field">
          <span>Status</span>
          <select v-model="draftFilters.status" class="form-input">
            <option value="all">Semua Status</option>
            <option v-for="status in taskStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>

        <label class="task-filter-field">
          <span>Nama Karyawan</span>
          <select v-model="draftFilters.employee" class="form-input">
            <option value="all">Semua Karyawan</option>
            <option v-for="employee in employees" :key="employee.id" :value="employee.id">
              {{ employee.name }}
            </option>
          </select>
        </label>

        <label class="task-filter-field">
          <span>Jabatan</span>
          <select v-model="draftFilters.position" class="form-input">
            <option value="all">Semua Jabatan</option>
            <option v-for="position in positions" :key="position" :value="position">
              {{ position }}
            </option>
          </select>
        </label>

        <label class="task-filter-field">
          <span>Bulan</span>
          <select v-model.number="draftFilters.month" class="form-input">
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </label>

        <label class="task-filter-field">
          <span>Tahun</span>
          <select v-model.number="draftFilters.year" class="form-input">
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </label>
      </div>

      <div class="task-filter-actions">
        <BaseButton @click="applyFilters">Filter</BaseButton>
        <BaseButton variant="outline" @click="resetFilters">Reset Filter</BaseButton>
        <BaseButton variant="outline" @click="exportToExcel">Export to Excel</BaseButton>
      </div>
    </section>

    <section class="tasks-table-card card">
      <div class="tasks-table-heading">
        <div>
          <h2>Data Tugas</h2>
          <p>{{ activeMonthLabel }} {{ activeFilters.year }}</p>
        </div>
        <span>{{ filteredTasks.length }} tugas</span>
      </div>

      <div class="tasks-table-scroll" @wheel="handleTableWheel">
        <table class="tasks-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th class="task-name-column">Nama Tugas</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Status</th>
              <th class="assignee-column">Dikerjakan</th>
              <th>Deadline</th>
              <th class="note-column">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredTasks" :key="task.id">
              <td>{{ formatDate(task.date) }}</td>
              <td class="task-name-cell">{{ task.name }}</td>
              <td>{{ task.start || '-' }}</td>
              <td>{{ task.end || '-' }}</td>
              <td>
                <span :class="['task-status-badge', statusClass(task.status)]">
                  {{ task.status }}
                </span>
              </td>
              <td class="assignee-cell">{{ employeeName(task.employeeId) }}</td>
              <td>{{ formatDate(task.deadline) }}</td>
              <td class="note-cell">{{ task.note || '-' }}</td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="8" class="tasks-empty-state">Tidak ada data tugas sesuai filter.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, reactive } from 'vue'
import * as XLSX from 'xlsx'
import BaseButton from '../components/BaseButton.vue'

const JAKARTA_TIME_ZONE = 'Asia/Jakarta'
const jakartaNowParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAKARTA_TIME_ZONE,
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

const taskStatuses = ['Selesai', 'Progres', 'Ditunda', 'Dibatalkan']
const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
].map((label, index) => ({ label, value: index + 1 }))
const years = Array.from({ length: 16 }, (_, index) => currentYear - 10 + index)
const positions = [...new Set(employees.map((employee) => employee.position))]

const tasks = [
  {
    id: 'task-001',
    date: '2026-08-28',
    name: 'Media monitoring harian',
    start: '08:45',
    end: '10:15',
    status: 'Selesai',
    employeeId: 'emp-004',
    deadline: '2026-08-28',
    note: 'Laporan monitoring sudah dikirim.'
  },
  {
    id: 'task-002',
    date: '2026-08-28',
    name: 'Update database media',
    start: '10:30',
    end: '',
    status: 'Progres',
    employeeId: 'emp-003',
    deadline: '2026-08-29',
    note: 'Melengkapi kontak media nasional.'
  },
  {
    id: 'task-003',
    date: '2026-08-27',
    name: 'Draft laporan campaign',
    start: '13:15',
    end: '',
    status: 'Ditunda',
    employeeId: 'emp-002',
    deadline: '2026-08-30',
    note: 'Menunggu data coverage tambahan.'
  },
  {
    id: 'task-004',
    date: '2026-08-27',
    name: 'Koordinasi kebutuhan klien',
    start: '09:00',
    end: '10:00',
    status: 'Selesai',
    employeeId: 'emp-002',
    deadline: '2026-08-27',
    note: 'Kebutuhan konten sudah dikonfirmasi.'
  },
  {
    id: 'task-005',
    date: '2026-08-26',
    name: 'Rekap publikasi mingguan',
    start: '14:00',
    end: '16:20',
    status: 'Selesai',
    employeeId: 'emp-005',
    deadline: '2026-08-27',
    note: 'Rekap final sudah masuk folder tim.'
  },
  {
    id: 'task-006',
    date: '2026-08-25',
    name: 'Penyusunan media list campaign',
    start: '09:30',
    end: '',
    status: 'Progres',
    employeeId: 'emp-003',
    deadline: '2026-08-31',
    note: 'Fokus pada media bisnis dan ekonomi.'
  },
  {
    id: 'task-007',
    date: '2026-08-24',
    name: 'Follow up konfirmasi narasumber',
    start: '11:00',
    end: '',
    status: 'Dibatalkan',
    employeeId: 'emp-006',
    deadline: '2026-08-24',
    note: 'Agenda dibatalkan oleh klien.'
  },
  {
    id: 'task-008',
    date: '2026-08-21',
    name: 'Monitoring isu kompetitor',
    start: '08:30',
    end: '11:10',
    status: 'Selesai',
    employeeId: 'emp-004',
    deadline: '2026-08-21',
    note: 'Temuan utama sudah dirangkum.'
  },
  {
    id: 'task-009',
    date: '2026-07-31',
    name: 'Rekap media coverage Juli',
    start: '13:00',
    end: '16:30',
    status: 'Selesai',
    employeeId: 'emp-001',
    deadline: '2026-07-31',
    note: 'Rekap bulanan selesai.'
  }
]

const draftFilters = reactive({
  search: '',
  status: 'all',
  employee: 'all',
  position: 'all',
  month: currentMonth,
  year: currentYear
})

const activeFilters = reactive({ ...draftFilters })

const activeMonthLabel = computed(() => (
  months.find((month) => month.value === activeFilters.month)?.label || ''
))

const employeeMap = computed(() => new Map(employees.map((employee) => [employee.id, employee])))

const filteredTasks = computed(() => {
  const searchTerm = activeFilters.search.trim().toLowerCase()

  return tasks.filter((task) => {
    const taskDate = parseIsoDate(task.date)
    const employee = employeeMap.value.get(task.employeeId)
    const searchableText = [task.name, task.note, employee?.name].filter(Boolean).join(' ').toLowerCase()

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm)
    const matchesStatus = activeFilters.status === 'all' || task.status === activeFilters.status
    const matchesEmployee = activeFilters.employee === 'all' || task.employeeId === activeFilters.employee
    const matchesPosition = activeFilters.position === 'all' || employee?.position === activeFilters.position
    const matchesMonth = taskDate.month === activeFilters.month
    const matchesYear = taskDate.year === activeFilters.year

    return matchesSearch && matchesStatus && matchesEmployee && matchesPosition && matchesMonth && matchesYear
  })
})

function parseIsoDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return { year, month, day }
}

function formatDate(value) {
  if (!value) return '-'
  const { year, month, day } = parseIsoDate(value)
  return [String(day).padStart(2, '0'), String(month).padStart(2, '0'), year].join('/')
}

function employeeName(employeeId) {
  return employeeMap.value.get(employeeId)?.name || '-'
}

function statusClass(status) {
  return {
    Selesai: 'done',
    Progres: 'progress',
    Ditunda: 'hold',
    Dibatalkan: 'cancelled'
  }[status] || ''
}

function applyFilters() {
  Object.assign(activeFilters, draftFilters)
}

function resetFilters() {
  Object.assign(draftFilters, {
    search: '',
    status: 'all',
    employee: 'all',
    position: 'all',
    month: currentMonth,
    year: currentYear
  })
  Object.assign(activeFilters, draftFilters)
}

function handleTableWheel(event) {
  const container = event.currentTarget
  if (!container || container.scrollWidth <= container.clientWidth) return
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

  const previousScrollLeft = container.scrollLeft
  container.scrollLeft += event.deltaY

  if (container.scrollLeft !== previousScrollLeft) {
    event.preventDefault()
  }
}

function exportToExcel() {
  const rows = filteredTasks.value.map((task) => ({
    Tanggal: formatDate(task.date),
    'Nama Tugas': task.name,
    Mulai: task.start || '-',
    Selesai: task.end || '-',
    Status: task.status,
    Dikerjakan: employeeName(task.employeeId),
    Deadline: formatDate(task.deadline),
    Catatan: task.note || '-'
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Tanggal', 'Nama Tugas', 'Mulai', 'Selesai', 'Status', 'Dikerjakan', 'Deadline', 'Catatan']
  })

  worksheet['!cols'] = [
    { wch: 13 },
    { wch: 34 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
    { wch: 13 },
    { wch: 42 }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tugas')

  const safeMonth = activeMonthLabel.value.toLowerCase().replace(/\s+/g, '-')
  XLSX.writeFile(workbook, `tugas-${safeMonth}-${activeFilters.year}.xlsx`)
}
</script>

<style scoped>
@import '../assets/styles/tasks.css';
</style>
