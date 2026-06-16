# Panduan Instalasi

1001-Web dilengkapi dengan **Universal Adaptive Installer** yang menyederhanakan pengaturan di berbagai lingkungan berbeda.

## 1. Pengembangan Lokal (Direkomendasikan untuk Kustomisasi)

### Langkah 1: Clone & Instal

```bash
git clone https://github.com/crediblemark-official/SitusBisnis.git
cd SitusBisnis
bun install
```

### Langkah 2: Setup Database

Pastikan Anda memiliki database PostgreSQL yang berjalan. Anda bisa menggunakan Docker atau instalasi lokal.

```bash
npx prisma db push
```

### Langkah 3: Jalankan Installer

Mulai server pengembangan:

```bash
bun dev
```

Buka `http://localhost:3000/installer`. UI akan memandu Anda melalui:

1.  **Konfigurasi Infrastruktur**: Mendeteksi kemampuan penulisan file `.env` secara otomatis.
2.  **Identitas Situs**: Masukkan nama dan deskripsi situs Anda.
3.  **Akun Admin**: Buat administrator utama (root).

---

## 2. Instalasi Cloud (Vercel / Railway)

Pada platform cloud, sistem file biasanya bersifat **read-only**. 1001-Web menanganinya dengan mendeteksi variabel lingkungan sistem.

### Langkah 1: Variabel Lingkungan

Sebelum menjalankan installer, atur kunci-kunci berikut di dashboard penyedia cloud Anda:

- `DATABASE_URL` (Wajib)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_DOMAIN` (Sangat disarankan untuk media)
- `NEXT_PUBLIC_APP_URL` & `NEXTAUTH_URL` (Set ke domain Anda)

### Langkah 2: Push & Deploy

Push kode ke repositori Anda. Setelah dideploy, buka `https://domain-anda.com/installer`.

### Langkah 3: Deteksi Adaptif

Installer akan menampilkan lencana **"System Env Detected"**. Anda dapat melewati formulir konfigurasi infrastruktur dan langsung melanjutkan ke pembuatan akun Admin.

---

## 3. Konfigurasi Penyimpanan (Cloudflare R2)

1001-Web menggunakan Cloudflare R2 untuk penyimpanan media yang andal.

1.  Buat bucket R2 di Cloudflare.
2.  Tetapkan "Public Domain" atau "R2.dev Subdomain" ke bucket tersebut.
3.  Generate API Token (Izin edit) dan catat Access Key serta Secret Key.
4.  Masukkan data tersebut ke dalam installer.
