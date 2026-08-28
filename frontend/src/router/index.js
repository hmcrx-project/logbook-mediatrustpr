import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/Dashboard.vue'
import Attendance from '../pages/Attendance.vue'
import Tasks from '../pages/Tasks.vue'
import Employees from '../pages/Employees.vue'
import Positions from '../pages/Positions.vue'
import Permissions from '../pages/Permissions.vue'
import Clients from '../pages/Clients.vue'
import Database from '../pages/Database.vue'
import Reports from '../pages/Reports.vue'
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
          component: Reports,
          meta: { title: 'Laporan' }
        },
        {
          path: 'pengaturan/karyawan',
          component: Employees,
          meta: { title: 'Karyawan' }
        },
        {
          path: 'pengaturan/jabatan',
          component: Positions,
          meta: { title: 'Jabatan' }
        },
        {
          path: 'pengaturan/permission',
          component: Permissions,
          meta: { title: 'Permission' }
        },
        {
          path: 'pengaturan/klien',
          component: Clients,
          meta: { title: 'Klien' }
        },
        {
          path: 'pengaturan/database',
          component: Database,
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
