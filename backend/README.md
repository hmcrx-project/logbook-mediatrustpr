# Logbook MediatrustPR Backend v1.6.0

Backend foundation menggunakan Cloudflare Worker + D1. Frontend belum dipindahkan dari mock data pada versi ini.

## Struktur

- `src/index.js` - HTTP API Worker
- `src/lib/` - helper HTTP, validasi, tanggal, password hashing, error DB
- `migrations/0001_initial_schema.sql` - schema D1 awal + seed 3 role
- `wrangler.jsonc` - konfigurasi Worker/D1

## Setup D1

1. Masuk ke folder backend dan install dependency:
   `npm install`
2. Buat database:
   `npm run db:create`
3. Salin `database_id` hasil Cloudflare ke `wrangler.jsonc` menggantikan UUID placeholder.
4. Set temporary bootstrap secret:
   `npx wrangler secret put BOOTSTRAP_API_KEY`
5. Jalankan migration remote:
   `npm run db:migrate:remote`
6. Deploy Worker:
   `npm run deploy`

Untuk local development, copy `.dev.vars.example` menjadi `.dev.vars`, lalu gunakan `npm run db:migrate:local` dan `npm run dev`.

## System Admin

System Admin tidak di-seed dengan password bawaan. Setelah migration, buat sekali melalui:

`POST /api/setup/system-admin`

Body:

```json
{
  "password": "password-kuat-minimal-10-karakter"
}
```

Header sementara:

`X-Setup-Key: <BOOTSTRAP_API_KEY>`

Username System Admin selalu `admin` dan tidak terkait ke tabel karyawan.

## Temporary API protection

Pada v1.6.0, endpoint foundation selain `/api/health` dilindungi `X-Setup-Key`. Ini hanya pagar sementara agar endpoint CRUD tidak terbuka sebelum autentikasi session selesai dibuat. Frontend belum dihubungkan ke API pada versi ini.
