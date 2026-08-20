
import { ref } from 'vue'

const SESSION_KEY = 'mediatrust_session'
const IDLE_TIMEOUT = 4 * 60 * 60 * 1000
const MAX_SESSION = 24 * 60 * 60 * 1000

const user = ref(null)

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function checkSession() {
  const session = getSession()

  if (!session) {
    user.value = null
    return false
  }

  const now = Date.now()

  if (
    now - session.lastActivity > IDLE_TIMEOUT ||
    now - session.loginAt > MAX_SESSION
  ) {
    logout()
    return false
  }

  user.value = session.user
  updateActivity()
  return true
}

function updateActivity() {
  const session = getSession()
  if (!session) return

  session.lastActivity = Date.now()
  saveSession(session)
}

function login(username) {
  const session = {
    user: { username },
    loginAt: Date.now(),
    lastActivity: Date.now()
  }

  saveSession(session)
  user.value = session.user

  return true
}

function logout() {
  localStorage.removeItem(SESSION_KEY)
  user.value = null
}

export function useAuth() {
  return {
    user,
    login,
    logout,
    checkSession,
    updateActivity
  }
}


// v1.3.2 auth initialization state
export const authReady = true
