import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Dashboard from '../pages/Dashboard.vue'
import { useAuth } from '../stores/auth'

const router = createRouter({
 history: createWebHistory(),
 routes: [
  {
   path: '/',
   beforeEnter: () => {
    const auth = useAuth()
    return auth.checkSession() ? '/dashboard' : '/login'
   }
  },
  {
   path: '/login',
   component: Login,
   beforeEnter: () => {
    const auth = useAuth()
    return auth.checkSession() ? '/dashboard' : true
   }
  },
  {
   path: '/dashboard',
   component: Dashboard,
   beforeEnter: () => {
    const auth = useAuth()
    return auth.checkSession() ? true : '/login'
   }
  }
 ]
})

export default router
