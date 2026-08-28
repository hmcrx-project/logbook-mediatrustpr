import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/Dashboard.vue'
import Attendance from '../pages/Attendance.vue'
import Tasks from '../pages/Tasks.vue'
import PlaceholderPage from '../pages/PlaceholderPage.vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: Login,
      meta: { guestOnly: true }
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/login'
        },
        {
          path: 'dashboard',
          component: Dashboard,
          meta: { title: 'Dashboard' }
        },
        {
          path: 'absensi',
          component: Attendance,
          meta: { title: 'Absensi' }
        },
        {
          path: 'tugas',
          component: Tasks,
          meta: { title: 'Tugas' }
        },
        {
          path: 'laporan',
          component: PlaceholderPage,
          props: { title: 'Laporan' },
          meta: { title: 'Laporan' }
        },
        {
          path: 'pengaturan/karyawan',
          component: PlaceholderPage,
          props: {
            title: 'Karyawan',
            description: 'Halaman master data karyawan akan dikembangkan pada tahap berikutnya.'
          },
          meta: { title: 'Karyawan' }
        },
        {
          path: 'pengaturan/jabatan',
          component: PlaceholderPage,
          props: { title: 'Pengaturan Jabatan' },
          meta: { title: 'Pengaturan Jabatan' }
        },
        {
          path: 'pengaturan/permission',
          component: PlaceholderPage,
          props: { title: 'Permission' },
          meta: { title: 'Permission' }
        },
        {
          path: 'pengaturan/klien',
          component: PlaceholderPage,
          props: { title: 'Klien' },
          meta: { title: 'Klien' }
        },
        {
          path: 'pengaturan/database',
          component: PlaceholderPage,
          props: {
            title: 'Database',
            description: 'Halaman administrasi database akan dikembangkan pada tahap berikutnya.'
          },
          meta: { title: 'Database' }
        }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const hasValidSession = auth.checkSession()

  if (to.meta.requiresAuth && !hasValidSession) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }

  if (to.meta.guestOnly && hasValidSession) {
    return '/dashboard'
  }

  return true
})

export default router
