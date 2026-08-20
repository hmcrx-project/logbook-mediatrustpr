<template>
  <div class="login-page">
    <form class="card login-card" @submit.prevent="handleLogin">
      <BrandLogo />

      <div class="form-group">
        <label>Username</label>
        <BaseInput v-model="username" placeholder="Masukkan username" :error="!!error" />
      </div>

      <div class="form-group">
        <label>Password</label>
        <div class="password-wrapper">
          <BaseInput v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Masukkan password" :error="!!error" />
          <button type="button" class="eye" @click="showPassword=!showPassword">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <BaseButton fullWidth>Login</BaseButton>
    </form>

    <footer>© {{ currentYear }} MediatrustPR</footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '../components/BrandLogo.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import { login as validateLogin } from '../services/auth'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)
const currentYear = new Date().getFullYear()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

function getRedirectTarget() {
  const redirect = route.query.redirect

  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    redirect !== '/login'
  ) {
    return redirect
  }

  return '/dashboard'
}

async function handleLogin() {
  const result = validateLogin(username.value, password.value)

  if (!result.success) {
    error.value = result.message
    return
  }

  auth.login(result.user)
  error.value = ''
  await router.replace(getRedirectTarget())
}
</script>

<style scoped>
@import '../assets/styles/login.css';
</style>
