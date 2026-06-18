# Runbook: Operasional SitusBisnis

## Referensi Cepat

| Service       | Perintah                | Deskripsi                             |
| ------------- | ----------------------- | ------------------------------------- |
| Dev Server    | `bun run dev`           | Memulai server pengembangan Turbopack |
| Build         | `bun run build`         | Build production                      |
| Start         | `bun run start`         | Memulai server production             |
| Lint          | `bun run lint`          | Pemeriksaan ESLint                    |
| Typecheck     | `bun run typecheck`     | Pemeriksaan TypeScript                |
| Test Unit     | `bun run test:unit`     | Menjalankan unit tests                |
| Test E2E      | `bun run test:e2e`      | Menjalankan E2E tests                 |
| DB Studio     | `bun run db:studio`     | Membuka Prisma Studio                 |
| DB Push       | `bun run db:push`       | Mendorong skema ke DB                 |
| Prisma Deploy | `bun run prisma:deploy` | Menjalankan migrasi                   |

---

## Respons Insiden

### Situs Tidak Loading (Error 500)

1. Cek log: `docker logs <container>` atau log platform
2. Cek health: `curl https://<domain>/api/health`
3. Cek konektivitas database
4. Cek Sentry untuk error terbaru
5. Jika masalah DB: `bun run prisma:deploy`

### Performa Lambat

1. Cek performa query database di Prisma Studio
2. Cek cache hit rates
3. Tinjau tab Sentry Performance
4. Cek log rate limiting untuk penyalahgunaan

### Migrasi Database Gagal

1. Cek status migrasi: `bunx prisma migrate status`
2. Selesaikan konflik secara manual
3. Jalankan ulang: `bun run prisma:deploy`
4. Jika stuck: `bunx prisma migrate resolve --rolled-back <nama-migrasi>`

### Dugaan Kebocoran Data Tenant

1. Segera audit semua query API untuk scope `siteId` yang hilang
2. Cek Sentry untuk upaya akses tidak sah
3. Tinjau log rate limiting
4. Audit log akses database

---

## Daftar Periksa Deployment

### Pra-Deployment

- [ ] Semua test lulus: `bun run test:unit && bun run test:e2e`
- [ ] Type check lulus: `bun run typecheck`
- [ ] Lint lulus: `bun run lint`
- [ ] Build berhasil secara lokal: `bun run build`
- [ ] Migrasi database siap
- [ ] Environment variables diperbarui

### Deployment

- [ ] Push ke `develop` (staging) atau `main` (production)
- [ ] Pipeline CI/CD lulus
- [ ] Migrasi database diterapkan
- [ ] Health check mengembalikan 200
- [ ] Smoke test lulus

### Pasca-Deployment

- [ ] Monitor Sentry untuk error baru
- [ ] Cek log aplikasi
- [ ] Verifikasi alur pengguna utama
- [ ] Perbarui dokumentasi jika diperlukan

---

## Environment Variables

### Wajib

| Variable                  | Deskripsi                           | Contoh                    |
| ------------------------- | ----------------------------------- | ------------------------- |
| `DATABASE_URL`            | Koneksi string PostgreSQL           | `postgresql://...`        |
| `NEXTAUTH_SECRET`         | Kunci signing JWT (min 32 karakter) | `random-string-32-chars`  |
| `NEXTAUTH_URL`            | URL callback auth                   | `https://app.example.com` |
| `NEXT_PUBLIC_APP_URL`     | URL aplikasi                        | `https://app.example.com` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Domain root untuk resolusi tenant   | `example.com`             |

### Opsional

| Variable                 | Deskripsi                        | Default                      |
| ------------------------ | -------------------------------- | ---------------------------- |
| `R2_ACCOUNT_ID`          | Cloudflare R2 account ID         | -                            |
| `R2_ACCESS_KEY_ID`       | R2 access key                    | -                            |
| `R2_SECRET_ACCESS_KEY`   | R2 secret key                    | -                            |
| `R2_BUCKET_NAME`         | Nama bucket R2                   | -                            |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN untuk pelacakan error | -                            |
| `SENTRY_ORG`             | Organisasi Sentry                | -                            |
| `SENTRY_PROJECT`         | Nama proyek Sentry               | -                            |
| `LOG_LEVEL`              | Level logging                    | `info` (prod), `debug` (dev) |

---

## Monitoring

### Health Check

```bash
curl https://<domain>/api/health
```

Respons yang diharapkan:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-16T10:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "storage": "configured"
  }
}
```

### Dokumentasi OpenAPI

```bash
curl https://<domain>/api/openapi
```

### Metrik Utama untuk Dimonitor

- Waktu respons API (p50, p95, p99)
- Tingkat error per endpoint
- Penggunaan connection pool database
- Hit rate limit
- Kegagalan resolusi tenant
