# API v1.6.0

Versi ini adalah backend foundation. Semua endpoint selain health masih memakai temporary `X-Setup-Key` sampai autentikasi session diimplementasikan.

## Health
- `GET /api/health`

## Setup
- `POST /api/setup/system-admin`

## Roles
- `GET /api/roles`

## Positions
- `GET /api/positions`
- `POST /api/positions`
- `PATCH /api/positions/:id`
- `DELETE /api/positions/:id`

## Employees
- `GET /api/employees`
- `POST /api/employees`
- `GET /api/employees/:id`
- `PATCH /api/employees/:id`
- `PATCH /api/employees/:id/password`
- `DELETE /api/employees/:id`

## Accounts
- `GET /api/accounts`
- `GET /api/accounts/username-available?username=...`

API Tugas, Absensi, Klien, Dashboard, Laporan, dan autentikasi session akan ditambahkan bertahap setelah foundation ini stabil.
