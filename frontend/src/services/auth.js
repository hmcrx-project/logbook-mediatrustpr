export function login(username, password) {
  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' }
  }

  if (username !== 'admin' || password !== 'admin123') {
    return { success: false, message: 'Username atau password salah' }
  }

  return {
    success: true,
    user: {
      username
    }
  }
}
