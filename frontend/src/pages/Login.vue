<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="handleLogin">
      <BrandLogo />

      <div class="form-group">
        <label>Username</label>
        <BaseInput v-model="username" placeholder="Masukkan username" :error="!!error" />
      </div>

      <div class="form-group">
        <label>Password</label>
        <div class="password-wrapper">
          <BaseInput v-model="password" :type="'password'" placeholder="Masukkan password" :error="!!error" />
          <button type="button" class="eye" @click="showPassword=!showPassword">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <BaseButton>Login</BaseButton>
    </form>

    <footer>© {{ currentYear }} MediatrustPR</footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '../components/BrandLogo.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import { login } from '../services/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)
const currentYear = new Date().getFullYear()
const router = useRouter()

function handleLogin() {
  const result = login(username.value, password.value)

  if (!result.success) {
    error.value = result.message
    return
  }

  error.value = ''
  router.push('/dashboard')
}
</script>

<style scoped>
@import '../assets/styles/login.css';
</style>
