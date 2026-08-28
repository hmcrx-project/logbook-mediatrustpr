# Database v1.6.0

Schema awal D1 memiliki 10 tabel operasional:

1. `roles`
2. `positions`
3. `employees`
4. `employee_position_history`
5. `clients`
6. `tasks`
7. `task_sessions`
8. `attendance`
9. `accounts`
10. `auth_sessions`

Tidak ada `audit_logs` pada baseline ini.

## Prinsip data

- Username login unik global dan case-insensitive.
- Username `admin` khusus System Admin.
- Email karyawan unik dan case-insensitive.
- System Admin berada di `accounts` dengan `employee_id = NULL`.
- Akun karyawan berada di `accounts` dan memiliki satu `employee_id`.
- Jabatan aktif karyawan ditentukan dari `employee_position_history` dengan `end_date = NULL`.
- Hanya boleh ada satu jabatan aktif per karyawan.
- Jabatan/Karyawan/Klien yang sudah memiliki histori sebaiknya dinonaktifkan, bukan dihapus.
- Tugas memiliki banyak `task_sessions`.
- `client_id = NULL` berarti Internal / Tanpa Klien.
- `attendance.check_out` boleh NULL sampai karyawan melakukan Absen Pulang.
- Durasi tugas dan durasi kerja dihitung dari waktu awal/akhir, tidak disimpan sebagai kolom terpisah.
