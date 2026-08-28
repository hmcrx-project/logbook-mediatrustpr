<template>
  <aside :class="['app-sidebar', { 'is-open': open }]" aria-label="Navigasi utama">
    <div class="sidebar-brand">
      <BrandLogo />
    </div>

    <nav class="sidebar-nav">
      <RouterLink class="nav-item" to="/dashboard" @click="emit('close')">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </span>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink class="nav-item" to="/absensi" @click="emit('close')">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <span>Absensi</span>
      </RouterLink>

      <RouterLink class="nav-item" to="/tugas" @click="emit('close')">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <path d="M9 9h6M9 13h6M9 17h4" />
          </svg>
        </span>
        <span>Tugas</span>
      </RouterLink>

      <RouterLink class="nav-item" to="/laporan" @click="emit('close')">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
          </svg>
        </span>
        <span>Laporan</span>
      </RouterLink>

      <div class="nav-group">
        <button
          type="button"
          :class="['nav-item', 'nav-group-toggle', { active: settingsActive }]"
          :aria-expanded="settingsOpen"
          @click="settingsOpen = !settingsOpen"
        >
          <span class="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-3v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 14.7a1.7 1.7 0 0 0-1.56-1.03H5v-3h.44A1.7 1.7 0 0 0 7 9.64a1.7 1.7 0 0 0-.34-1.88L6.6 7.7l2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.4V4h3v.4a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v3h-.05A1.7 1.7 0 0 0 19.4 15Z" />
            </svg>
          </span>
          <span>Pengaturan</span>
          <svg class="nav-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m6 8 4 4 4-4" />
          </svg>
        </button>

        <div v-show="settingsOpen" class="nav-submenu">
          <RouterLink to="/pengaturan/jabatan" @click="emit('close')">Jabatan</RouterLink>
          <RouterLink to="/pengaturan/absensi" @click="emit('close')">Absensi</RouterLink>
          <RouterLink to="/pengaturan/permission" @click="emit('close')">Permission</RouterLink>
          <RouterLink to="/pengaturan/klien" @click="emit('close')">Klien</RouterLink>
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button type="button" class="logout-button" @click="handleLogout">
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
          </svg>
        </span>
        <span>Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '../BrandLogo.vue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const settingsActive = computed(() => route.path.startsWith('/pengaturan'))
const settingsOpen = ref(settingsActive.value)

watch(
  () => route.path,
  () => {
    if (settingsActive.value) settingsOpen.value = true
  }
)

async function handleLogout() {
  auth.logout()
  emit('close')
  await router.replace('/login')
}
</script>
