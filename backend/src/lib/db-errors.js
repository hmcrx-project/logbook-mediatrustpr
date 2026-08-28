import { HttpError } from './http.js'

export function translateDatabaseError(error) {
  const message = String(error?.message || error || '')

  if (message.includes('UNIQUE constraint failed: accounts.username')) {
    return new HttpError(409, 'Username sudah digunakan.')
  }
  if (message.includes('UNIQUE constraint failed: employees.email')) {
    return new HttpError(409, 'Email sudah digunakan.')
  }
  if (message.includes('UNIQUE constraint failed: positions.name')) {
    return new HttpError(409, 'Nama jabatan sudah digunakan.')
  }
  if (message.includes('idx_employee_position_one_active')) {
    return new HttpError(409, 'Karyawan sudah memiliki jabatan aktif.')
  }
  if (message.includes('FOREIGN KEY constraint failed')) {
    return new HttpError(409, 'Data masih digunakan oleh data lain dan tidak dapat dihapus.')
  }

  return error
}
