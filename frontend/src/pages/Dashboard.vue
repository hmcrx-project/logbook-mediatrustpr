<template>
  <section class="dashboard-page">
    <div class="attendance-panel card">
      <div class="employee-greeting">
        <p class="eyebrow">Selamat datang,</p>
        <h2>{{ displayName }}</h2>
        <p class="employee-role">Administrator</p>
      </div>

      <div class="attendance-clock">
        <div>
          <p class="current-date">{{ currentDate }}</p>
          <p class="current-time">{{ currentTime }} WIB</p>
        </div>

        <div class="attendance-action">
          <div v-if="checkInTime" class="attendance-meta">
            <span>Masuk {{ checkInTime }} WIB</span>
            <span v-if="checkOutTime">Keluar {{ checkOutTime }} WIB</span>
          </div>

          <BaseButton v-if="attendanceState === 'idle'" @click="checkIn">
            Absen Masuk
          </BaseButton>
          <BaseButton v-else-if="attendanceState === 'in'" variant="outline" @click="checkOut">
            Absen Keluar
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
          <svg v-if="item.icon === 'open'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" />
          </svg>
          <svg v-else-if="item.icon === 'pending'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
          <svg v-else-if="item.icon === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div>
          <p>{{ item.label }}</p>
          <strong>{{ item.value }}</strong>
          <span>{{ item.helper }}</span>
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
  second: '2-digit',
  hour12: false
})

const displayName = computed(() => {
  const username = auth.user?.username || 'Karyawan'
  return username.charAt(0).toUpperCase() + username.slice(1)
})

const currentDate = computed(() => dateFormatter.format(now.value))
const currentTime = computed(() => timeFormatter.format(now.value).replace(/\./g, ':'))

const summaryCards = [
  { label: 'Belum Selesai', value: '6', helper: 'tugas', tone: 'blue', icon: 'open' },
  { label: 'Pending', value: '2', helper: 'tugas', tone: 'orange', icon: 'pending' },
  { label: 'Selesai', value: '14', helper: 'tugas', tone: 'green', icon: 'done' },
  { label: 'Jam Kerja Minggu Ini', value: '32j 45m', helper: 'total', tone: 'purple', icon: 'clock' }
]

const recentTasks = [
  { title: 'Media monitoring harian', date: 'Hari ini', status: 'Selesai', statusClass: 'done' },
  { title: 'Update database media', date: 'Hari ini', status: 'Pending', statusClass: 'pending' },
  { title: 'Draft laporan campaign', date: 'Kemarin', status: 'Belum Selesai', statusClass: 'open' },
  { title: 'Koordinasi kebutuhan klien', date: 'Kemarin', status: 'Selesai', statusClass: 'done' },
  { title: 'Rekap publikasi mingguan', date: '2 hari lalu', status: 'Selesai', statusClass: 'done' }
]

const workLocations = [
  { name: 'Andi Pratama', role: 'Media Relations', location: 'WFO' },
  { name: 'Sinta Wulandari', role: 'Account Executive', location: 'WFH' },
  { name: 'Rudi Setiawan', role: 'Media Monitoring', location: 'WFO' },
  { name: 'Nadia Putri', role: 'Content Specialist', location: 'WFH' },
  { name: 'Dimas Ardiansyah', role: 'Public Relations', location: 'WFO' }
]

function getJakartaTime() {
  return timeFormatter.format(new Date()).replace(/\./g, ':')
}

function checkIn() {
  checkInTime.value = getJakartaTime()
  attendanceState.value = 'in'
}

function checkOut() {
  checkOutTime.value = getJakartaTime()
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
