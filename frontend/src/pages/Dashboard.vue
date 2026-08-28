<template>
  <section class="dashboard-page">
    <div class="attendance-panel">
      <div class="employee-greeting">
        <p class="eyebrow">{{ greeting }},</p>
        <h2>{{ displayName }}</h2>
      </div>

      <div class="attendance-clock">
        <div>
          <p class="current-time">{{ currentTime }} WIB</p>
          <p class="current-date">{{ currentDate }}</p>
        </div>

        <div class="attendance-action">
          <BaseButton
            v-if="attendanceState === 'idle'"
            :disabled="!canCheckIn"
            @click="openCheckInModal"
          >
            Absen Masuk
          </BaseButton>
          <BaseButton v-else-if="attendanceState === 'in'" variant="outline" @click="checkOut">
            Absen Pulang
          </BaseButton>
          <BaseButton v-else disabled>
            Absensi Selesai
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="summary-grid">
      <article v-for="item in summaryCards" :key="item.label" class="summary-card card">
        <div :class="['summary-icon', item.tone]" aria-hidden="true">
          <svg v-if="item.icon === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" />
          </svg>
          <svg v-else-if="item.icon === 'progress'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
          <svg v-else-if="item.icon === 'pending'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M8 12h8" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" />
          </svg>
        </div>
        <div>
          <p>{{ item.label }}</p>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
    </div>

    <div class="dashboard-grid">
      <section class="content-card card">
        <div class="section-heading">
          <div>
            <h3>5 Tugas Terakhir</h3>
            <p>Aktivitas tugas terbaru Anda.</p>
          </div>
          <RouterLink to="/tugas">Lihat semua</RouterLink>
        </div>

        <div class="task-list">
          <div v-for="task in recentTasks" :key="task.title" class="task-row">
            <div class="task-copy">
              <strong>{{ task.title }}</strong>
              <span>{{ task.date }}</span>
            </div>
            <span :class="['status-badge', task.statusClass]">{{ task.status }}</span>
          </div>
        </div>
      </section>

      <section class="content-card card">
        <div class="section-heading">
          <div>
            <h3>Lokasi Kerja Karyawan</h3>
            <p>Status WFO dan WFH hari ini.</p>
          </div>
        </div>

        <div class="employee-list">
          <div v-for="employee in workLocations" :key="employee.name" class="employee-row">
            <div class="employee-avatar" aria-hidden="true">{{ initials(employee.name) }}</div>
            <div class="employee-copy">
              <strong>{{ employee.name }}</strong>
              <span>{{ employee.role }}</span>
            </div>
            <span :class="['location-badge', employee.location.toLowerCase()]">{{ employee.location }}</span>
          </div>
        </div>
      </section>
    </div>

    <div v-if="isCheckInModalOpen" class="modal-backdrop" @click.self="closeCheckInModal">
      <section class="attendance-modal" role="dialog" aria-modal="true" aria-labelledby="check-in-title">
        <div class="modal-heading">
          <div>
            <h3 id="check-in-title">Absen Masuk</h3>
            <p>Konfirmasi kehadiran Anda hari ini.</p>
          </div>
        </div>

        <div class="modal-content">
          <div class="attendance-detail-grid">
            <div class="attendance-detail">
              <span>Waktu Saat Ini</span>
              <strong>{{ currentTime }} WIB</strong>
              <small>{{ currentDate }}</small>
            </div>
            <div class="attendance-detail">
              <span>Jam Masuk Kerja</span>
              <strong>{{ scheduledStartTime }} WIB</strong>
              <small>Sesuai jadwal kerja</small>
            </div>
          </div>

          <label class="modal-field">
            <span>Lokasi Kerja</span>
            <span class="select-control">
              <select
                v-model="workLocationDraft"
                :class="['form-input', { 'is-error': checkInSubmitted && !workLocationDraft }]"
              >
                <option value="" disabled>Pilih WFO atau WFH</option>
                <option value="WFO">WFO</option>
                <option value="WFH">WFH</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m6 8 4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </label>
        </div>

        <div class="modal-actions">
          <BaseButton variant="outline" @click="closeCheckInModal">Batal</BaseButton>
          <BaseButton @click="confirmCheckIn">Absen Masuk</BaseButton>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseButton from '../components/BaseButton.vue'
import { useAuthStore } from '../stores/auth'

const JAKARTA_TIME_ZONE = 'Asia/Jakarta'
const auth = useAuthStore()
const now = ref(new Date())
const attendanceState = ref('idle')
const checkInTime = ref('')
const checkOutTime = ref('')
const checkInAt = ref(null)
const checkOutAt = ref(null)
const workDurationMinutes = ref(0)
const isCheckInModalOpen = ref(false)
const workLocationDraft = ref('')
const selectedWorkLocation = ref('')
const checkInSubmitted = ref(false)
const attendanceSchedule = {
  start: '09:00',
  end: '17:00',
  earlyCheckInMinutes: 60
}
const scheduledStartTime = attendanceSchedule.start
let timerId

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: JAKARTA_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: JAKARTA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

const hourFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: JAKARTA_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23'
})

const displayName = computed(() => {
  const username = auth.user?.username || 'Karyawan'
  return username.charAt(0).toUpperCase() + username.slice(1)
})

const currentDate = computed(() => dateFormatter.format(now.value))
const currentTime = computed(() => timeFormatter.format(now.value).replace(/\./g, ':'))
const canCheckIn = computed(() => {
  const [currentHour, currentMinute] = currentTime.value.split(':').map(Number)
  const [startHour, startMinute] = attendanceSchedule.start.split(':').map(Number)
  const currentMinutes = currentHour * 60 + currentMinute
  const earliestCheckInMinutes = startHour * 60 + startMinute - attendanceSchedule.earlyCheckInMinutes

  return currentMinutes >= earliestCheckInMinutes
})
const greeting = computed(() => {
  const hour = Number(hourFormatter.format(now.value))

  if (hour >= 5 && hour < 11) return 'Selamat Pagi'
  if (hour >= 11 && hour < 15) return 'Selamat Siang'
  if (hour >= 15 && hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
})

const summaryCards = [
  { label: 'Tugas Selesai', value: '6', tone: 'green', icon: 'done' },
  { label: 'Tugas dalam Progres', value: '2', tone: 'blue', icon: 'progress' },
  { label: 'Tugas Ditunda', value: '14', tone: 'orange', icon: 'pending' },
  { label: 'Tugas Dibatalkan', value: '3', tone: 'red', icon: 'cancelled' }
]

const recentTasks = [
  { title: 'Media monitoring harian', date: 'Hari ini', status: 'Selesai', statusClass: 'done' },
  { title: 'Update database media', date: 'Hari ini', status: 'Progres', statusClass: 'progress' },
  { title: 'Draft laporan campaign', date: 'Kemarin', status: 'Ditunda', statusClass: 'hold' },
  { title: 'Koordinasi kebutuhan klien', date: 'Kemarin', status: 'Selesai', statusClass: 'done' },
  { title: 'Rekap publikasi mingguan', date: '2 hari lalu', status: 'Selesai', statusClass: 'done' }
]

const baseWorkLocations = [
  { name: 'Andi Pratama', role: 'Media Relations', location: 'WFO' },
  { name: 'Sinta Wulandari', role: 'Account Executive', location: 'WFH' },
  { name: 'Rudi Setiawan', role: 'Media Monitoring', location: 'WFO' },
  { name: 'Nadia Putri', role: 'Content Specialist', location: 'WFH' },
  { name: 'Dimas Ardiansyah', role: 'Public Relations', location: 'WFO' }
]

const workLocations = computed(() => {
  if (!selectedWorkLocation.value) return baseWorkLocations

  return [
    {
      name: displayName.value,
      role: 'Administrator',
      location: selectedWorkLocation.value
    },
    ...baseWorkLocations.filter((employee) => employee.name !== displayName.value)
  ]
})

function getJakartaTime(date = new Date()) {
  return timeFormatter.format(date).replace(/\./g, ':')
}

function openCheckInModal() {
  if (!canCheckIn.value) return

  workLocationDraft.value = selectedWorkLocation.value || ''
  checkInSubmitted.value = false
  isCheckInModalOpen.value = true
}

function closeCheckInModal() {
  isCheckInModalOpen.value = false
  checkInSubmitted.value = false
}

function confirmCheckIn() {
  checkInSubmitted.value = true
  if (!workLocationDraft.value) return

  const timestamp = new Date()
  checkInAt.value = timestamp
  checkInTime.value = getJakartaTime(timestamp)
  selectedWorkLocation.value = workLocationDraft.value
  attendanceState.value = 'in'
  closeCheckInModal()
}

function checkOut() {
  const timestamp = new Date()
  checkOutAt.value = timestamp
  checkOutTime.value = getJakartaTime(timestamp)

  if (checkInAt.value) {
    workDurationMinutes.value = Math.max(
      0,
      Math.round((checkOutAt.value.getTime() - checkInAt.value.getTime()) / 60000)
    )
  }

  attendanceState.value = 'done'
}

function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
})
</script>

<style scoped>
@import '../assets/styles/dashboard.css';
</style>
