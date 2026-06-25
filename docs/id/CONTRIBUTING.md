# Berkontribusi ke SitusBisnis

Terima kasih atas minat Anda untuk berkontribusi ke SitusBisnis! Dokumen ini berisi panduan dan instruksi untuk berkontribusi.

## Kode Etik

Dengan berpartisipasi dalam proyek ini, Anda setuju untuk mematuhi Kode Etik kami.

## Memulai

### Prasyarat

- **Node.js** 20+ atau **Bun** 1.3+
- **PostgreSQL** 16+
- **Git**

### Persiapan

1. Fork repositori
2. Clone fork Anda: `git clone https://github.com/username-anda/situsbisnis.git`
3. Instal dependensi: `bun install`
4. Salin `.env.example` ke `.env.local` dan isi nilai yang diperlukan
5. Siapkan database: `bun run db:push`
6. Jalankan server pengembangan: `bun run dev`

## Alur Kerja Pengembangan

### Penamaan Branch

- `feature/deskripsi` - Fitur baru
- `fix/deskripsi` - Perbaikan bug
- `docs/deskripsi` - Dokumentasi
- `refactor/deskripsi` - Refaktor kode
- `test/deskripsi` - Penambahan atau perubahan test

### Pesan Commit

Kami mengikuti [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer(s)]
```

Tipe:

- `feat`: Fitur baru
- `fix`: Perbaikan bug
- `docs`: Dokumentasi
- `style`: Formatting
- `refactor`: Refaktor kode
- `test`: Pengujian
- `chore`: Pemeliharaan

Contoh:

```
feat(auth): menambahkan dukungan login OAuth
fix(api): memperbaiki error pagination off-by-one
docs(readme): memperbarui instruksi instalasi
```

### Pull Requests

1. Perbarui branch Anda dengan main terbaru
2. Jalankan semua pemeriksaan secara lokal:
   ```bash
   bun run typecheck
   bun run lint
   bun run test:unit
   bun run build
   ```
3. Buat Pull Request menggunakan template
4. Minta review dari code owners
5. Tanggapi feedback review

## Pengujian

### Unit Tests

```bash
bun run test:unit          # Menjalankan tests
bun run test:coverage      # Menjalankan dengan laporan coverage
bun run test:ui            # Menjalankan dengan Vitest UI
```

### E2E Tests

```bash
bun run test:e2e           # Menjalankan Playwright tests
```

### Menulis Tests

- Unit tests di `tests/unit/`
- E2E tests di `tests/e2e/`
- File test harus diberi nama `*.test.ts`
- Ikuti pattern test yang sudah ada
- Targetkan coverage tinggi untuk logika bisnis

## Gaya Kode

- TypeScript strict mode diaktifkan
- ESLint dengan Next.js core-web-vitals + jsx-a11y
- Prettier untuk formatting (jika dikonfigurasi)
- Ikuti pattern dan konvensi yang sudah ada

### Konvensi Utama

- Gunakan `async/await` dibanding promises
- Utamakan server components kecuali interaktivitas client diperlukan
- Gunakan `cache()` dan `unstable_cache()` untuk pengambilan data
- Validasi semua input dengan Zod
- Gunakan logging terstruktur via `createLogger(moduleName)`
- Tangani error dengan class `AppError`

## Keamanan

- Jangan pernah commit secret atau kredensial
- Gunakan environment variables untuk data sensitif
- Validasi semua input pengguna
- Ikuti pedoman OWASP
- Laporkan kerentanan keamanan secara privat

## Dokumentasi

- Perbarui dokumentasi untuk perubahan yang terlihat pengguna
- Tambahkan komentar JSDoc untuk API publik
- Perbarui ADR untuk perubahan arsitektur
- Jaga README dan runbook tetap terbaru

## Proses Review

1. **Pemeriksaan Otomatis**: CI harus lulus (lint, typecheck, tests, build)
2. **Code Review**: Setidaknya satu persetujuan dari code owner
3. **Pengujian**: Perubahan harus diuji
4. **Dokumentasi**: Diperbarui jika diperlukan

## Pertanyaan?

- Buka [Diskusi](https://github.com/crediblemark-official/situsbisnis/discussions)
- Hubungi tim di support@SitusBisnis.id

## Papan Proyek (Project Board)

Setiap kali Anda menyelesaikan pengerjaan fitur baru atau perbaikan _bug_ yang di-merge ke repositori ini, Anda **DIWAJIBKAN** untuk memperbarui GitHub Project Board ([Situs Bisnis Roadmap](https://github.com/orgs/crediblemark-official/projects/1)).

1. Tambahkan item tiket baru ke papan (jika belum ada).
2. Ubah status item tersebut menjadi **Done**.
3. Halaman `/roadmap` di aplikasi akan otomatis ter-sinkronisasi dengan papan proyek ini.
