import { defineStore } from 'pinia'

const SESSION_KEY = 'mediatrust_session'
const IDLE_TIMEOUT = 4 * 60 * 60 * 1000
const MAX_SESSION = 24 * 60 * 60 * 1000

function readSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

function isValidSessionShape(session) {
  return Boolean(
    session &&
    session.user &&
    typeof session.user.username === 'string' &&
    Number.isFinite(session.loginAt) &&
    Number.isFinite(session.lastActivity)
  )
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.user)
  },

  actions: {
    login(user) {
      const now = Date.now()
      const session = {
        user,
        loginAt: now,
        lastActivity: now
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      this.user = user
    },

    logout() {
      localStorage.removeItem(SESSION_KEY)
      this.user = null
    },

    checkSession() {
      const session = readSession()

      if (!isValidSessionShape(session)) {
        this.logout()
        return false
      }

      const now = Date.now()
      const idleExpired = now - session.lastActivity >= IDLE_TIMEOUT
      const maxExpired = now - session.loginAt >= MAX_SESSION

      if (idleExpired || maxExpired) {
        this.logout()
        return false
      }

      this.user = session.user
      return true
    },

    updateActivity() {
      const session = readSession()

      if (!isValidSessionShape(session)) {
        this.logout()
        return false
      }

      const now = Date.now()
      const idleExpired = now - session.lastActivity >= IDLE_TIMEOUT
      const maxExpired = now - session.loginAt >= MAX_SESSION

      if (idleExpired || maxExpired) {
        this.logout()
        return false
      }

      session.lastActivity = now
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      this.user = session.user
      return true
    }
  }
})
