# Panduan Deploy Aplikasi SitusBisnis di Dokploy (Migrasi dari Vercel)

Dokumen ini berisi panduan teknis langkah demi langkah untuk memindahkan (deploy) aplikasi **SitusBisnis (Next.js App Router)** dari **Vercel** ke **Dokploy PaaS** pada server VPS Anda sendiri.

Dengan menyatukan kontainer aplikasi (Dokploy) dan database PostgreSQL dalam satu VPS (atau jaringan VPS privat), Anda akan mendapatkan **keunggulan performa latensi mikrodetik** serta **menghemat biaya langkahan bulanan Vercel**.

---

## 1. Perbandingan Arsitektur: Vercel vs Dokploy + PostgreSQL

| Fitur                    | Arsitektur Lama (Vercel + Remote DB)                                                                                    | Arsitektur Baru (Dokploy + PostgreSQL di VPS yang Sama)                                                                                                                                               |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Latensi Jaringan**     | **Tinggi (50ms - 150ms)**: Vercel serverless berada di regional cloud (AWS), sedangkan database terpisah.               | **Sangat Rendah (0.1ms - 1ms)**: Kontainer aplikasi dan database berada di VPS yang sama.                                                                                                             |
| **Beban Koneksi DB**     | **Tinggi (Connection Exhaustion)**: Setiap pemanggilan serverless Vercel membuka koneksi baru, berpotensi membebani DB. | **Sangat Stabil (Connection Pool Stabil)**: Next.js berjalan sebagai proses Node.js yang panjang (_long-running_). Koneksi Prisma terkelola dengan pool internal yang konstan (default: ~10 koneksi). |
| **Routing Multi-Tenant** | Dikelola melalui konfigurasi domain Vercel dan wildcard SSL berbayar/terbatas.                                          | Dikelola secara otomatis dan gratis melalui **Traefik Reverse Proxy** bawaan Dokploy dengan SSL Let's Encrypt.                                                                                        |
| **Biaya Operasional**    | Berpotensi membengkak seiring trafik dan bandwidth serverless Vercel.                                                   | **Flat & Gratis** (Hanya membayar biaya sewa bulanan VPS).                                                                                                                                            |

---

## 2. Persiapan Dockerfile & Konfigurasi Monorepo di Dokploy

Aplikasi SitusBisnis menggunakan arsitektur monorepo (dengan modul eksternal seperti `@crediblemark/buayar`, `@crediblemark/build-ui`, dll., yang berada di direktori induk `../`).

Dokploy secara _default_ akan mencari `Dockerfile` di root repositori. Agar build berhasil mendeteksi dependensi sibling, lakukan pengaturan khusus berikut saat membuat aplikasi di panel Dokploy:

### Langkah Setup Aplikasi di UI Dokploy:

1. Masuk ke dashboard Dokploy Anda.
2. Klik **`Create Application`** → Pilih **`Github`** atau **`Git`** (hubungkan ke repositori SitusBisnis Anda).
3. Isi konfigurasi Git dasar (Repository, Branch `main` / `production`).
4. **PENTING - Konfigurasi Build Path & Dockerfile**:
   - **Root Directory / Context Path \***: Isi dengan `/` (Menandakan root repositori monorepo, bukan subfolder). Ini penting agar Next.js compiler dapat melacak folder di luar `SitusBisnis` (`outputFileTracingRoot`).
   - **Dockerfile Path \***: Isi dengan `SitusBisnis/Dockerfile` (Menunjuk langsung ke Dockerfile yang berada di dalam subfolder `SitusBisnis`).

---

## 3. Konfigurasi Environment Variables di Dokploy

Karena aplikasi Anda berjalan dengan koneksi panjang (long-running) di Node.js/Bun, Anda dapat langsung terhubung ke port utama PostgreSQL (`5432`) untuk performa maksimal tanpa perlu overhead connection pooler eksternal.

Buka tab **`Environment`** di aplikasi Dokploy Anda, lalu tambahkan variabel lingkungan berikut:

### Variabel Inti:

```env
# Koneksi langsung ke PostgreSQL utama
DATABASE_URL="postgresql://<db_user>:<db_password>@168.231.119.22:5432/situsbisnis?schema=public&connection_limit=10"

# Kredensial URL & Domain Utama SaaS
NEXT_PUBLIC_APP_URL="https://situsbisnis.com"
NEXTAUTH_URL="https://situsbisnis.com"

# Pengaturan Autentikasi & Cookie Multi-Tenant (PENTING untuk subdomain sharing!)
NEXTAUTH_SECRET="masukkan_string_acak_panjang_dan_sangat_aman"
NEXTAUTH_COOKIE_DOMAIN=".situsbisnis.com"

# Menonaktifkan Telemetri demi performa kontainer
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
PORT=3000
```

> [!TIP]
>
> - **`connection_limit=10`**: Di Dokploy, aplikasi Next.js berjalan konstan (_long-running process_). Prisma ORM akan menjaga jumlah koneksi maksimum pada angka 10 secara stabil. Ini sangat aman dan cepat karena tidak perlu melakukan proses _handshake_ koneksi database berulang kali seperti pada serverless.
> - Jika database PostgreSQL Anda berada pada jaringan Docker Bridge internal yang sama dengan Dokploy, Anda bahkan bisa menggunakan IP gateway internal Docker (misalnya `172.17.0.1:5432`) untuk meningkatkan faktor keamanan jaringan (tidak mengekspos port DB ke internet).

---

## 4. Konfigurasi Wildcard Domain untuk Multi-Tenant (Traefik)

Platform **SitusBisnis** mendukung konsep multi-tenant dinamis berbasis subdomain (contoh: `tenantA.situsbisnis.com`, `tenantB.situsbisnis.com`). Dokploy menggunakan **Traefik Reverse Proxy** yang sangat mumpuni untuk menangani hal ini.

### Langkah Mengonfigurasi Domain di Dokploy:

1. Buka aplikasi Anda di Dokploy → Masuk ke tab **`Domains`**.
2. **Tambahkan Domain Utama SaaS**:
   - Domain: `situsbisnis.com`
   - Port: `3000`
   - Certs: Centang **Let's Encrypt SSL** untuk mendapatkan HTTPS gratis otomatis.
3. **Tambahkan Wildcard Domain untuk Tenant**:
   - Domain: `*.situsbisnis.com`
   - Port: `3000`
   - Certs: Untuk domain wildcard, Anda memerlukan verifikasi DNS (DNS-01 Challenge).
     - _Alternatif Praktis_: Jika Anda menggunakan **Cloudflare** untuk DNS, konfigurasikan DNS-01 Challenge di setelan Traefik Dokploy menggunakan API Token Cloudflare Anda agar sertifikat SSL Let's Encrypt untuk `*.situsbisnis.com` dapat terbit secara otomatis.

---

## 5. Otomasi Database Migration saat Deployment

Di dalam [Dockerfile](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis/Dockerfile), baris peluncuran akhir telah dikonfigurasi sebagai berikut:

```dockerfile
CMD ["sh", "-c", "bunx prisma migrate deploy && bun server.js"]
```

Artinya, setiap kali Dokploy selesai melakukan proses build image dan meluncurkan kontainer baru:

1. Sistem akan secara otomatis menjalankan `prisma migrate deploy` terlebih dahulu untuk menerapkan migrasi skema database baru secara aman (tanpa menghapus data yang ada).
2. Setelah migrasi berhasil, server Next.js baru akan diaktifkan di port `3000`.
3. Proses ini memastikan skema database dan versi aplikasi selalu sinkron tanpa _down-time_ selama proses pembaruan aplikasi berlangsung.

---

## 6. Konfigurasi Health Checks demi Zero-Downtime

Untuk menjamin proses pembaharuan kode aplikasi (redeploy) berjalan lancar tanpa interupsi bagi pengguna aktif (Zero-Downtime Rolling Update), aktifkan **Health Check** di panel Dokploy:

1. Di tab aplikasi Dokploy Anda, temukan menu **`Health Check`**.
2. Atur konfigurasi berikut:
   - **Path**: `/api/health` (Endpoint pemantau kesehatan aplikasi & database).
   - **Port**: `3000`
   - **Interval**: `10s` (Mengecek setiap 10 detik).
   - **Timeout**: `5s`
   - **Retries**: `3`
3. Traefik Dokploy tidak akan mengalihkan trafik pengguna ke kontainer aplikasi yang baru sebelum endpoint `/api/health` mengembalikan status sukses HTTP 200. Kontainer lama akan tetap aktif melayani pengguna hingga kontainer baru siap sepenuhnya.

---

## 7. Langkah Final Migrasi dari Vercel

1. **Deploy Pertama di Dokploy**: Klik tombol **`Deploy`** di dashboard Dokploy Anda. Tunggu proses instalasi dependensi bun dan build Next.js standalone hingga selesai.
2. **Verifikasi Jalur Log**: Cek tab **`Logs`** di Dokploy untuk memastikan `prisma migrate deploy` berjalan sukses dan server berhasil mendengarkan port `3000`.
3. **Uji Coba Domain**: Kunjungi domain Dokploy sementara atau domain utama Anda untuk memastikan dashboard SitusBisnis dan panel multi-tenant merespons dengan cepat.
4. **Pindahkan DNS**: Ubah record DNS `A` (atau `CNAME`) domain utama dan wildcard Anda di Cloudflare/Penyedia DNS Anda dari mengarah ke Vercel menjadi mengarah ke IP VPS Dokploy Anda (`168.231.119.22`).
5. **Matikan Vercel Deployment**: Setelah propagasi DNS selesai penuh (~1-2 jam) dan trafik sepenuhnya masuk ke VPS Dokploy Anda, Anda dapat menonaktifkan proyek di Vercel secara aman.

---

## 8. Penanganan Otomatis SSL & Routing untuk Custom Domain Tenant

Dalam arsitektur VPS mandiri (Dokploy + Traefik), ketika tenant mendaftarkan custom domain pihak ketiga mereka sendiri (contoh: `tokoindonesia.com`), trafik HTTP/S harus dapat di-route ke kontainer aplikasi Next.js Anda dan memperoleh sertifikat **SSL Let's Encrypt** secara otomatis.

Berikut adalah 2 opsi terbaik untuk mengotomatiskan proses ini:

### Opsi A: Registrasi Dinamis via API Dokploy (Rekomendasi Utama)

Dokploy menyediakan API GraphQL internal untuk memanipulasi pengaturan aplikasi, termasuk penambahan domain kustom secara dinamis.

1. Setiap kali domain berhasil diverifikasi di backend (`DomainService.verifyDomain`), Anda dapat memicu API Call ke endpoint Dokploy API menggunakan token administratif Anda.
2. API Dokploy akan mendaftarkan domain `tokoindonesia.com` ke aplikasi Anda secara otomatis, dan Traefik akan segera menerbitkan sertifikat SSL Let's Encrypt tanpa keterlibatan manual.

### Opsi B: Reverse Proxy Tambahan dengan On-Demand TLS (Caddy Edge)

Jika Anda ingin lepas dari batasan konfigurasi domain per-aplikasi di Dokploy:

1. Tempatkan **Caddy** sebagai edge reverse proxy di port `80` dan `443` di depan Docker/Dokploy.
2. Caddy mendukung fitur bawaan **On-Demand TLS** yang legendaris. Saat pengunjung mengakses `tokoindonesia.com`, Caddy akan mendeteksi domain baru tersebut secara dinamis, menanyakan ke backend SitusBisnis (`/api/domains/check`) apakah domain tersebut valid, dan menerbitkan sertifikat SSL Let's Encrypt secara instan dalam milidetik saat TLS handshake berlangsung.
