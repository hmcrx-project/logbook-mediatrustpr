import { HttpError } from './http.js'

const USERNAME_PATTERN = /^[a-z0-9._]{3,32}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateUsername(value, { allowAdmin = false } = {}) {
  const username = normalizeUsername(value)
  if (!USERNAME_PATTERN.test(username)) {
    throw new HttpError(422, 'Username harus 3-32 karakter dan hanya boleh berisi huruf, angka, titik, atau underscore.')
  }
  if (!allowAdmin && username === 'admin') {
    throw new HttpError(422, 'Username admin khusus untuk System Admin.')
  }
  return username
}

export function validateEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw new HttpError(422, 'Email tidak valid.')
  }
  return email
}

export function validateRequiredText(value, field, maxLength = 160) {
  const text = String(value || '').trim()
  if (!text) throw new HttpError(422, `${field} wajib diisi.`)
  if (text.length > maxLength) throw new HttpError(422, `${field} terlalu panjang.`)
  return text
}

export function validateStatus(value, fallback = 'ACTIVE') {
  const status = String(value || fallback).toUpperCase()
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new HttpError(422, 'Status harus ACTIVE atau INACTIVE.')
  }
  return status
}

export function validateTime(value, field) {
  const time = String(value || '').trim()
  if (!TIME_PATTERN.test(time)) throw new HttpError(422, `${field} harus menggunakan format HH:MM.`)
  return time
}

export function validateDate(value, field = 'Tanggal') {
  const date = String(value || '').trim()
  if (!DATE_PATTERN.test(date)) throw new HttpError(422, `${field} harus menggunakan format YYYY-MM-DD.`)
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new HttpError(422, `${field} tidak valid.`)
  }
  return date
}

export function validatePassword(value) {
  const password = String(value || '')
  if (password.length < 10) {
    throw new HttpError(422, 'Password minimal 10 karakter.')
  }
  if (password.length > 128) {
    throw new HttpError(422, 'Password terlalu panjang.')
  }
  return password
}

export function parsePositiveInt(value, field) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) {
    throw new HttpError(422, `${field} tidak valid.`)
  }
  return number
}

export function parsePagination(url) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20
  const limit = Math.min(100, Math.max(1, requestedLimit))
  return { page, limit, offset: (page - 1) * limit }
}
