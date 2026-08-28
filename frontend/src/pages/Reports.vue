<template>
  <section class="reports-page">
    <section class="reports-filter">
      <BaseButton
        type="button"
        variant="outline"
        class="responsive-filter-toggle"
        :aria-expanded="isFilterExpanded"
        aria-controls="reports-filter-panel"
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

      <div id="reports-filter-panel" class="responsive-filter-panel" :class="{ 'is-open': isFilterExpanded }">
        <div class="report-filter-grid">
          <label class="report-filter-field">
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

          <label class="report-filter-field">
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

          <label class="report-filter-field">
            <span>Tanggal</span>
            <span class="select-control">
              <select v-model="draftFilters.dateRange" class="form-input" @change="handleDateRangeSelection">
                <option value="all">Semua Tanggal</option>
                <option value="yesterday">Kemarin</option>
                <option value="last7">7 Hari Terakhir</option>
                <option value="last30">30 Hari Terakhir</option>
                <option value="custom">Kustom</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>

          <div class="report-inline-actions">
            <BaseButton @click="applyFilters">Filter</BaseButton>
            <BaseButton variant="outline" @click="resetFilters">Reset</BaseButton>
          </div>
        </div>
      </div>
    </section>

    <section class="report-summary-grid" aria-label="Ringkasan laporan tugas">
      <button type="button" class="report-summary-card card" @click="goToTasks()">
        <span>Total Waktu Tugas</span>
        <strong>{{ formatDuration(totalDurationMinutes) }}</strong>
      </button>
      <button type="button" class="report-summary-card card" @click="goToTasks()">
        <span>Total Tugas</span>
        <strong>{{ filteredTasks.length }}</strong>
      </button>
      <button type="button" class="report-summary-card card" @click="goToTasks({ status: 'Selesai' })">
        <span>Tugas Selesai</span>
        <strong>{{ statusCounts.Selesai }}</strong>
      </button>
      <button type="button" class="report-summary-card card" @click="goToTasks({ status: 'Progres' })">
        <span>Tugas Progres</span>
        <strong>{{ statusCounts.Progres }}</strong>
      </button>
    </section>

    <section class="report-chart-card card report-line-card">
      <div class="report-card-heading">
        <div>
          <h2>Total Waktu Pengerjaan Tugas</h2>
          <p>{{ activeDateRangeLabel }} · klik titik untuk membuka data tugas pada tanggal tersebut</p>
        </div>
        <strong>{{ formatDuration(totalDurationMinutes) }}</strong>
      </div>

      <div class="report-line-chart-wrap">
        <svg
          class="report-line-chart"
          :viewBox="`0 0 ${lineChart.width} ${lineChart.height}`"
          role="img"
          aria-label="Grafik total waktu pengerjaan tugas per hari"
        >
          <defs>
            <linearGradient id="reportAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1B98D5" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#1B98D5" stop-opacity="0.03" />
            </linearGradient>
          </defs>

          <g class="report-chart-grid">
            <template v-for="tick in lineChart.yTicks" :key="tick.value">
              <line
                :x1="lineChart.plotLeft"
                :x2="lineChart.plotRight"
                :y1="tick.y"
                :y2="tick.y"
              />
              <text :x="lineChart.plotLeft - 10" :y="tick.y + 4" text-anchor="end">{{ tick.label }}</text>
            </template>
          </g>

          <path v-if="lineChart.points.length" class="report-area-path" :d="lineChart.areaPath" />
          <path v-if="lineChart.points.length" class="report-line-path" :d="lineChart.linePath" />

          <g v-for="point in lineChart.points" :key="point.date">
            <line
              v-if="point.showLabel"
              class="report-x-tick"
              :x1="point.x"
              :x2="point.x"
              :y1="lineChart.plotBottom"
              :y2="lineChart.plotBottom + 7"
            />
            <text
              v-if="point.showLabel"
              class="report-x-label"
              :x="point.x"
              :y="lineChart.height - 14"
              text-anchor="middle"
            >{{ point.shortLabel }}</text>

            <g
              class="report-line-point-control"
              role="button"
              tabindex="0"
              :aria-label="`${point.label}: ${formatDuration(point.minutes)}. Buka data tugas.`"
              @click="goToTasks({ date: point.date })"
              @keyup.enter="goToTasks({ date: point.date })"
              @keyup.space.prevent="goToTasks({ date: point.date })"
            >
              <title>{{ point.label }} · {{ formatDuration(point.minutes) }}</title>
              <circle class="report-line-point-hit" :cx="point.x" :cy="point.y" r="13" />
              <circle class="report-line-point" :cx="point.x" :cy="point.y" r="5" />
              <text
                v-if="point.minutes > 0 && lineChart.points.length <= 10"
                class="report-point-value"
                :x="point.x"
                :y="Math.max(16, point.y - 12)"
                text-anchor="middle"
              >{{ formatDurationCompact(point.minutes) }}</text>
            </g>
          </g>
        </svg>
      </div>
    </section>

    <section class="report-chart-grid-two">
      <section class="report-chart-card card">
        <div class="report-card-heading">
          <div>
            <h2>Ringkasan Status Tugas</h2>
            <p>{{ filteredTasks.length }} tugas pada periode aktif</p>
          </div>
        </div>

        <div class="report-donut-layout">
          <div class="report-donut-wrap">
            <svg class="report-donut-chart" viewBox="0 0 220 220" role="img" aria-label="Donut chart status tugas">
              <circle class="report-donut-track" cx="110" cy="110" r="74" pathLength="100" transform="rotate(-90 110 110)" />
              <circle
                v-for="segment in donutSegments"
                :key="segment.status"
                class="report-donut-segment"
                :class="segment.className"
                cx="110"
                cy="110"
                r="74"
                pathLength="100"
                transform="rotate(-90 110 110)"
                :stroke-dasharray="`${segment.percentage} ${100 - segment.percentage}`"
                :stroke-dashoffset="-segment.offset"
                tabindex="0"
                role="button"
                :aria-label="`${segment.status}: ${segment.count} tugas`"
                @click="goToTasks({ status: segment.status })"
                @keyup.enter="goToTasks({ status: segment.status })"
              >
                <title>{{ segment.status }}: {{ segment.count }} tugas</title>
              </circle>
              <text class="report-donut-total" x="110" y="105" text-anchor="middle">{{ filteredTasks.length }}</text>
              <text class="report-donut-caption" x="110" y="126" text-anchor="middle">Total Tugas</text>
            </svg>
          </div>

          <div class="report-donut-legend">
            <button
              v-for="segment in donutSegments"
              :key="`legend-${segment.status}`"
              type="button"
              class="report-legend-item"
              @click="goToTasks({ status: segment.status })"
            >
              <span :class="['report-legend-dot', segment.className]"></span>
              <span>{{ segment.status }}</span>
              <strong>{{ segment.count }}</strong>
            </button>
          </div>
        </div>
      </section>

      <section class="report-chart-card card">
        <div class="report-card-heading">
          <div>
            <h2>Total Waktu per Karyawan</h2>
            <p>Klik bar untuk membuka tugas karyawan tersebut</p>
          </div>
        </div>

        <div v-if="employeeDurationSeries.length" class="report-bars">
          <button
            v-for="item in employeeDurationSeries"
            :key="item.employeeId"
            type="button"
            class="report-bar-row"
            @click="goToTasks({ employee: item.employeeId })"
          >
            <span class="report-bar-name">{{ item.name }}</span>
            <span class="report-bar-track" aria-hidden="true">
              <span class="report-bar-fill" :style="{ width: `${item.percentage}%` }"></span>
            </span>
            <strong>{{ formatDuration(item.minutes) }}</strong>
          </button>
        </div>
        <div v-else class="report-empty-state">Belum ada durasi tugas pada filter ini.</div>
      </section>
    </section>

    <div v-if="isDateRangePickerOpen" class="report-modal-backdrop" @click.self="cancelCustomRange">
      <section class="report-date-range-modal" role="dialog" aria-modal="true" aria-labelledby="report-custom-range-title">
        <div class="report-modal-heading">
          <div>
            <h3 id="report-custom-range-title">Pilih Rentang Tanggal</h3>
            <p>Pilih tanggal mulai dan tanggal selesai.</p>
          </div>
          <button type="button" class="report-modal-close" aria-label="Tutup" @click="cancelCustomRange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div class="report-date-range-content">
          <div class="report-date-range-toolbar">
            <button type="button" class="report-calendar-nav" aria-label="Bulan sebelumnya" @click="moveCalendar(-1)">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m12 5-5 5 5 5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <strong>{{ calendarMonth.label }}</strong>
            <button type="button" class="report-calendar-nav" aria-label="Bulan berikutnya" @click="moveCalendar(1)">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m8 5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="report-calendar-panel">
            <div class="report-calendar-weekdays" aria-hidden="true">
              <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
            </div>
            <div class="report-calendar-days">
              <button
                v-for="day in calendarMonth.days"
                :key="day.iso"
                type="button"
                :class="[
                  'report-calendar-day',
                  {
                    muted: !day.inMonth,
                    today: day.iso === currentDateIso,
                    'in-range': isDateInTempRange(day.iso),
                    'range-edge': isTempRangeEdge(day.iso)
                  }
                ]"
                @click="selectCustomDate(day.iso)"
              >
                {{ day.day }}
              </button>
            </div>
          </div>

          <div class="report-selected-range">
            <div>
              <span>Tanggal Mulai</span>
              <strong>{{ tempCustomRange.start ? formatDate(tempCustomRange.start) : '-' }}</strong>
            </div>
            <span class="report-range-separator">s.d.</span>
            <div>
              <span>Tanggal Selesai</span>
              <strong>{{ tempCustomRange.end ? formatDate(tempCustomRange.end) : '-' }}</strong>
            </div>
          </div>
        </div>

        <div class="report-modal-actions">
          <BaseButton variant="outline" @click="cancelCustomRange">Batal</BaseButton>
          <BaseButton @click="applyCustomRange">Terapkan</BaseButton>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '../components/BaseButton.vue'

const router = useRouter()
const JAKARTA_TIME_ZONE = 'Asia/Jakarta'
const jakartaNowParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAKARTA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).formatToParts(new Date())
const nowPart = (type) => jakartaNowParts.find((part) => part.type === type)?.value || ''
const currentDateIso = `${nowPart('year')}-${nowPart('month')}-${nowPart('day')}`

const employees = [
  { id: 'emp-002', name: 'Andi Pratama', position: 'Account Executive' },
  { id: 'emp-003', name: 'Sinta Maharani', position: 'Media Relations' },
  { id: 'emp-004', name: 'Raka Putra', position: 'Monitoring Analyst' },
  { id: 'emp-005', name: 'Nadia Rahma', position: 'Content Specialist' },
  { id: 'emp-006', name: 'Dimas Saputra', position: 'Account Executive' }
]
const positions = [...new Set(employees.map((employee) => employee.position))].sort((a, b) => a.localeCompare(b, 'id'))
const employeeMap = new Map(employees.map((employee) => [employee.id, employee]))
const taskStatuses = ['Selesai', 'Progres', 'Ditunda', 'Dibatalkan']
const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const legacyTasks = [
  { id: 'task-001', date: '2026-08-28', name: 'Media monitoring harian', start: '08:45', end: '10:15', status: 'Selesai', employeeId: 'emp-004' },
  { id: 'task-002', date: '2026-08-28', name: 'Update database media', start: '10:30', end: '', status: 'Progres', employeeId: 'emp-003' },
  { id: 'task-003', date: '2026-08-27', name: 'Draft laporan campaign', start: '13:15', end: '', status: 'Ditunda', employeeId: 'emp-002' },
  { id: 'task-004', date: '2026-08-27', name: 'Koordinasi kebutuhan klien', start: '09:00', end: '10:00', status: 'Selesai', employeeId: 'emp-002' },
  { id: 'task-005', date: '2026-08-26', name: 'Rekap publikasi mingguan', start: '14:00', end: '16:20', status: 'Selesai', employeeId: 'emp-005' },
  { id: 'task-006', date: '2026-08-25', name: 'Penyusunan media list campaign', start: '09:30', end: '', status: 'Progres', employeeId: 'emp-003' },
  { id: 'task-007', date: '2026-08-24', name: 'Follow up konfirmasi narasumber', start: '11:00', end: '', status: 'Dibatalkan', employeeId: 'emp-006' },
  { id: 'task-008', date: '2026-08-21', name: 'Monitoring isu kompetitor', start: '08:30', end: '11:10', status: 'Selesai', employeeId: 'emp-004' },
  { id: 'task-010', date: '2026-08-28', name: 'Review materi presentasi klien', start: '16:10', end: '', status: 'Progres', employeeId: 'emp-002' },
  { id: 'task-011', date: '2026-08-28', name: 'Distribusi press release', start: '14:20', end: '15:05', status: 'Selesai', employeeId: 'emp-003' },
  { id: 'task-012', date: '2026-08-28', name: 'Verifikasi coverage campaign', start: '11:40', end: '13:10', status: 'Selesai', employeeId: 'emp-004' },
  { id: 'task-013', date: '2026-08-27', name: 'Persiapan konten media sosial', start: '15:20', end: '', status: 'Ditunda', employeeId: 'emp-005' },
  { id: 'task-014', date: '2026-08-26', name: 'Follow up media partner', start: '10:10', end: '11:00', status: 'Selesai', employeeId: 'emp-006' },
  { id: 'task-015', date: '2026-08-23', name: 'Analisis sentimen pemberitaan', start: '09:15', end: '12:00', status: 'Selesai', employeeId: 'emp-004' },
  { id: 'task-016', date: '2026-08-20', name: 'Riset media untuk pitching', start: '13:45', end: '', status: 'Progres', employeeId: 'emp-003' },
  { id: 'task-017', date: '2026-08-18', name: 'Revisi proposal komunikasi', start: '10:30', end: '12:10', status: 'Selesai', employeeId: 'emp-002' },
  { id: 'task-018', date: '2026-08-12', name: 'Koordinasi agenda media visit', start: '09:20', end: '', status: 'Dibatalkan', employeeId: 'emp-006' }
]

const reportTasks = legacyTasks.map((task) => ({
  ...task,
  sessions: [{ id: `${task.id}-session-1`, date: task.date, start: task.start, end: task.end }]
}))
const multiDayTask = reportTasks.find((task) => task.id === 'task-002')
if (multiDayTask) {
  multiDayTask.sessions.unshift({ id: 'task-002-session-0', date: '2026-08-27', start: '15:00', end: '16:30' })
}

const draftFilters = reactive({ employee: 'all', position: 'all', dateRange: 'last7', customStart: '', customEnd: '' })
const activeFilters = reactive({ ...draftFilters })
const isFilterExpanded = ref(false)
const isDateRangePickerOpen = ref(false)
const tempCustomRange = reactive({ start: '', end: '' })
const calendarAnchor = ref(createUtcDate(Number(nowPart('year')), Number(nowPart('month')) - 1, 1))

const dateRangeLabels = {
  all: 'Semua Tanggal',
  yesterday: 'Kemarin',
  last7: '7 Hari Terakhir',
  last30: '30 Hari Terakhir'
}

const activeDateRangeLabel = computed(() => {
  if (activeFilters.dateRange === 'custom' && activeFilters.customStart && activeFilters.customEnd) {
    return `${formatDate(activeFilters.customStart)} s.d. ${formatDate(activeFilters.customEnd)}`
  }
  return dateRangeLabels[activeFilters.dateRange] || '7 Hari Terakhir'
})

const filteredSessions = computed(() => reportTasks.flatMap((task) => {
  const employee = employeeMap.get(task.employeeId)
  if (!employee) return []
  if (activeFilters.employee !== 'all' && task.employeeId !== activeFilters.employee) return []
  if (activeFilters.position !== 'all' && employee.position !== activeFilters.position) return []

  return task.sessions
    .filter((session) => matchesDateRange(session.date, activeFilters))
    .map((session) => ({ ...session, taskId: task.id, status: task.status, employeeId: task.employeeId, taskName: task.name }))
}))

const filteredTasks = computed(() => {
  const taskIds = new Set(filteredSessions.value.map((session) => session.taskId))
  return reportTasks.filter((task) => taskIds.has(task.id))
})

const totalDurationMinutes = computed(() => filteredSessions.value.reduce((total, session) => total + sessionDurationMinutes(session), 0))
const statusCounts = computed(() => Object.fromEntries(taskStatuses.map((status) => [status, filteredTasks.value.filter((task) => task.status === status).length])))

const dateSeries = computed(() => {
  const dates = datesForActiveRange(activeFilters)
  const totals = new Map(dates.map((date) => [date, 0]))
  filteredSessions.value.forEach((session) => {
    if (!totals.has(session.date)) totals.set(session.date, 0)
    totals.set(session.date, totals.get(session.date) + sessionDurationMinutes(session))
  })
  return [...totals.entries()]
    .sort(([a], [b]) => dateTimestamp(a) - dateTimestamp(b))
    .map(([date, minutes]) => ({ date, minutes, label: formatDateLong(date), shortLabel: formatDateShort(date) }))
})

const lineChart = computed(() => buildLineChart(dateSeries.value))

const donutSegments = computed(() => {
  const total = filteredTasks.value.length || 1
  let offset = 0
  const classes = {
    Selesai: 'done',
    Progres: 'progress',
    Ditunda: 'hold',
    Dibatalkan: 'cancelled'
  }

  return taskStatuses.map((status) => {
    const count = statusCounts.value[status] || 0
    const percentage = filteredTasks.value.length ? (count / total) * 100 : 0
    const segment = { status, count, percentage, offset, className: classes[status] }
    offset += percentage
    return segment
  })
})

const employeeDurationSeries = computed(() => {
  const totals = new Map()
  filteredSessions.value.forEach((session) => {
    const minutes = sessionDurationMinutes(session)
    if (!minutes) return
    totals.set(session.employeeId, (totals.get(session.employeeId) || 0) + minutes)
  })

  const rows = [...totals.entries()]
    .map(([employeeId, minutes]) => ({ employeeId, name: employeeMap.get(employeeId)?.name || '-', minutes }))
    .sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name, 'id'))
  const maxMinutes = Math.max(...rows.map((row) => row.minutes), 1)
  return rows.map((row) => ({ ...row, percentage: Math.max(4, (row.minutes / maxMinutes) * 100) }))
})

const calendarMonth = computed(() => buildCalendarMonth(calendarAnchor.value))

function parseIsoDate(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  return { year, month, day }
}

function createUtcDate(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day))
}

function isoFromDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function dateTimestamp(value) {
  const { year, month, day } = parseIsoDate(value)
  return Date.UTC(year, month - 1, day)
}

function addDaysIso(value, amount) {
  const { year, month, day } = parseIsoDate(value)
  return isoFromDate(createUtcDate(year, month - 1, day + amount))
}

function addMonths(date, amount) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
}

function matchesDateRange(value, filters) {
  if (filters.dateRange === 'all') return true
  const valueTime = dateTimestamp(value)
  const differenceDays = Math.floor((dateTimestamp(currentDateIso) - valueTime) / 86400000)
  if (filters.dateRange === 'yesterday') return differenceDays === 1
  if (filters.dateRange === 'last7') return differenceDays >= 0 && differenceDays < 7
  if (filters.dateRange === 'last30') return differenceDays >= 0 && differenceDays < 30
  if (filters.dateRange === 'custom' && filters.customStart && filters.customEnd) {
    return valueTime >= dateTimestamp(filters.customStart) && valueTime <= dateTimestamp(filters.customEnd)
  }
  return false
}

function datesForActiveRange(filters) {
  let start = currentDateIso
  let end = currentDateIso
  if (filters.dateRange === 'all') {
    const sessionDates = reportTasks.flatMap((task) => task.sessions.map((session) => session.date))
    start = sessionDates.sort((a, b) => dateTimestamp(a) - dateTimestamp(b))[0] || currentDateIso
  } else if (filters.dateRange === 'yesterday') {
    start = addDaysIso(currentDateIso, -1)
    end = start
  } else if (filters.dateRange === 'last7') {
    start = addDaysIso(currentDateIso, -6)
  } else if (filters.dateRange === 'last30') {
    start = addDaysIso(currentDateIso, -29)
  } else if (filters.dateRange === 'custom' && filters.customStart && filters.customEnd) {
    start = filters.customStart
    end = filters.customEnd
  }

  const dates = []
  for (let cursor = start; dateTimestamp(cursor) <= dateTimestamp(end); cursor = addDaysIso(cursor, 1)) {
    dates.push(cursor)
    if (dates.length > 370) break
  }
  return dates
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function sessionDurationMinutes(session) {
  const start = timeToMinutes(session.start)
  const end = timeToMinutes(session.end)
  if (start === null || end === null || end <= start) return 0
  return end - start
}

function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes || 0))
  const hours = Math.floor(total / 60)
  const remainder = total % 60
  if (!hours) return `${remainder}m`
  if (!remainder) return `${hours}j`
  return `${hours}j ${remainder}m`
}

function formatDurationCompact(minutes) {
  const total = Math.max(0, Math.round(minutes || 0))
  if (!total) return '0'
  const hours = total / 60
  return hours >= 1 ? `${Number(hours.toFixed(hours % 1 ? 1 : 0))}j` : `${total}m`
}

function formatDate(value) {
  if (!value) return '-'
  const { year, month, day } = parseIsoDate(value)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

function formatDateShort(value) {
  const { month, day } = parseIsoDate(value)
  const monthLabel = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][month - 1]
  return `${String(day).padStart(2, '0')} ${monthLabel}`
}

function formatDateLong(value) {
  const { year, month, day } = parseIsoDate(value)
  const monthLabel = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][month - 1]
  return `${String(day).padStart(2, '0')} ${monthLabel} ${year}`
}

function buildLineChart(series) {
  const width = 920
  const height = 300
  const plotLeft = 58
  const plotRight = width - 24
  const plotTop = 28
  const plotBottom = height - 52
  const maxMinutes = Math.max(...series.map((item) => item.minutes), 0)
  const maxHours = Math.max(1, Math.ceil(maxMinutes / 60))
  const yMax = maxHours * 60
  const xStep = series.length > 1 ? (plotRight - plotLeft) / (series.length - 1) : 0
  const labelEvery = Math.max(1, Math.ceil(series.length / 7))

  const points = series.map((item, index) => ({
    ...item,
    x: series.length === 1 ? (plotLeft + plotRight) / 2 : plotLeft + xStep * index,
    y: plotBottom - (item.minutes / yMax) * (plotBottom - plotTop),
    showLabel: series.length <= 10 || index % labelEvery === 0 || index === series.length - 1
  }))

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${plotBottom} L ${points[0].x.toFixed(2)} ${plotBottom} Z`
    : ''

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4
    const value = yMax * (1 - ratio)
    return {
      value,
      y: plotTop + (plotBottom - plotTop) * ratio,
      label: value === 0 ? '0' : formatDurationCompact(value)
    }
  })

  return { width, height, plotLeft, plotRight, plotTop, plotBottom, points, linePath, areaPath, yTicks }
}

function buildCalendarMonth(anchor) {
  const year = anchor.getUTCFullYear()
  const monthIndex = anchor.getUTCMonth()
  const first = createUtcDate(year, monthIndex, 1)
  const firstWeekday = (first.getUTCDay() + 6) % 7
  const gridStart = createUtcDate(year, monthIndex, 1 - firstWeekday)
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first)
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = createUtcDate(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + index)
    return { iso: isoFromDate(date), day: date.getUTCDate(), inMonth: date.getUTCMonth() === monthIndex }
  })
  return { label: monthLabel, days }
}

function handleDateRangeSelection() {
  if (draftFilters.dateRange === 'custom') openCustomRangePicker()
}

function applyFilters() {
  if (draftFilters.dateRange === 'custom' && (!draftFilters.customStart || !draftFilters.customEnd)) {
    openCustomRangePicker()
    return
  }
  Object.assign(activeFilters, draftFilters)
}

function resetFilters() {
  Object.assign(draftFilters, { employee: 'all', position: 'all', dateRange: 'last7', customStart: '', customEnd: '' })
  Object.assign(activeFilters, draftFilters)
}

function openCustomRangePicker() {
  tempCustomRange.start = draftFilters.customStart || ''
  tempCustomRange.end = draftFilters.customEnd || ''
  const anchorIso = tempCustomRange.start || currentDateIso
  const { year, month } = parseIsoDate(anchorIso)
  calendarAnchor.value = createUtcDate(year, month - 1, 1)
  isDateRangePickerOpen.value = true
}

function cancelCustomRange() {
  isDateRangePickerOpen.value = false
  if (!draftFilters.customStart || !draftFilters.customEnd) draftFilters.dateRange = activeFilters.dateRange
}

function moveCalendar(amount) {
  calendarAnchor.value = addMonths(calendarAnchor.value, amount)
}

function selectCustomDate(iso) {
  if (!tempCustomRange.start || tempCustomRange.end) {
    tempCustomRange.start = iso
    tempCustomRange.end = ''
    return
  }
  if (dateTimestamp(iso) < dateTimestamp(tempCustomRange.start)) {
    tempCustomRange.start = iso
    tempCustomRange.end = ''
    return
  }
  tempCustomRange.end = iso
}

function isDateInTempRange(iso) {
  if (!tempCustomRange.start) return false
  const value = dateTimestamp(iso)
  const start = dateTimestamp(tempCustomRange.start)
  const end = tempCustomRange.end ? dateTimestamp(tempCustomRange.end) : start
  return value >= start && value <= end
}

function isTempRangeEdge(iso) {
  return iso === tempCustomRange.start || iso === tempCustomRange.end
}

function applyCustomRange() {
  if (!tempCustomRange.start || !tempCustomRange.end) return
  draftFilters.dateRange = 'custom'
  draftFilters.customStart = tempCustomRange.start
  draftFilters.customEnd = tempCustomRange.end
  Object.assign(activeFilters, draftFilters)
  isDateRangePickerOpen.value = false
}

function taskNavigationQuery(overrides = {}) {
  const query = {}
  if (activeFilters.employee !== 'all') query.employee = activeFilters.employee
  if (activeFilters.position !== 'all') query.position = activeFilters.position

  if (activeFilters.dateRange === 'custom') {
    query.dateRange = 'custom'
    query.customStart = activeFilters.customStart
    query.customEnd = activeFilters.customEnd
  } else {
    query.dateRange = activeFilters.dateRange
  }

  if (overrides.employee) query.employee = overrides.employee
  if (overrides.status) query.status = overrides.status
  if (overrides.date) {
    query.dateRange = 'custom'
    query.customStart = overrides.date
    query.customEnd = overrides.date
  }
  return query
}

function goToTasks(overrides = {}) {
  router.push({ path: '/tugas', query: taskNavigationQuery(overrides) })
}
</script>

<style scoped>
@import '../assets/styles/reports.css';
</style>
