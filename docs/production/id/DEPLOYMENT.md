# Panduan Deployment

1001-Web dioptimalkan untuk deployment cloud modern.

## Vercel (Sangat Direkomendasikan)

Vercel adalah platform terbaik untuk 1001-Web karena dukungan penuh terhadap fitur-fitur Next.js.

### Batasan Platform

- **Sistem File Read-only**: 1001-Web mendeteksi hal ini dan menggunakan variabel lingkungan sebagai ganti menulis ke file `.env`.
- **Serverless Functions**: Pastikan penyedia DB Anda mendukung koneksi serverless (misalnya Neon via WebSocket).

### Langkah Pengaturan

1.  **Repositori**: Hubungkan repositori GitHub Anda ke Vercel.
2.  **Variabel Lingkungan**:
    - `DATABASE_URL`: String koneksi PostgreSQL Anda.
    - `NEXT_PUBLIC_APP_URL`: URL deployment Anda (misal: `https://situs-saya.vercel.app`).
    - `NEXTAUTH_URL`: Sama seperti di atas.
    - `NEXTAUTH_SECRET`: Generate string acak (atau biarkan installer mencoba membuatnya).
    - `R2_*`: Diperlukan untuk upload gambar/media.
3.  **Deploy**: Picu deployment.
4.  **Instal**: Buka `https://situs-anda.com/installer` untuk menyelesaikan seeding database.

---

## Railway / Docker / VPS

Untuk lingkungan persisten di mana Anda memiliki izin tulis pada sistem file.

### Konfigurasi Persisten

1.  Jalankan aplikasi.
2.  Installer akan menyimpan konfigurasi Anda langsung ke file `.env`.
3.  Restart server akan memuat variabel baru secara otomatis.

---

## Penyedia Database yang Direkomendasikan

- **Neon** (Postgres): Terbaik untuk Vercel (Serverless-friendly).
- **Supabase** (Postgres): Andal dan kaya fitur.
- **Railway/PlanetScale**: Alternatif yang bagus.

---

## Pemecahan Masalah

### "Application already installed"

Jika Anda melihat error ini, berarti user Admin sudah ada di database Anda. Jika Anda perlu melakukan instalasi ulang, Anda harus menghapus record `User` di database secara manual atau menggunakan database baru.

### Ketidaksesuaian Link (SEO)

Pastikan `NEXT_PUBLIC_APP_URL` sesuai dengan domain asli Anda untuk menghindari masalah pada sitemap atau link kanonikal.
