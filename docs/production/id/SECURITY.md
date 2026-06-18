# Kebijakan Keamanan

## Versi yang Didukung

| Versi | Didukung           |
| ----- | ------------------ |
| 1.0.x | :white_check_mark: |

## Melaporkan Kerentanan

Kami menganggap serius keamanan SitusBisnis. Jika Anda yakin telah menemukan kerentanan keamanan, harap laporkan seperti yang dijelaskan di bawah.

**Mohon JANGAN melaporkan kerentanan keamanan melalui isu GitHub publik.**

Sebagai gantinya, laporkan melalui email ke: **security@SitusBisnis.id**

Anda akan menerima respons dalam 48 jam. Jika karena alasan tertentu Anda tidak menerimanya, harap tindak lanjuti melalui email untuk memastikan kami menerima pesan asli Anda.

### Harap sertakan informasi berikut:

- Tipe masalah (mis. buffer overflow, SQL injection, cross-site scripting, dll.)
- Path lengkap file sumber yang terkait dengan manifestasi masalah
- Lokasi kode sumber yang terpengaruh (tag/branch/commit atau URL langsung)
- Konfigurasi khusus yang diperlukan untuk mereproduksi masalah
- Instruksi langkah demi langkah untuk mereproduksi masalah
- Kode proof-of-concept atau exploit (jika memungkinkan)
- Dampak masalah, termasuk bagaimana penyerang dapat mengeksploitasinya

### Bahasa yang Disukai

Kami lebih suka semua komunikasi dalam Bahasa Inggris atau Indonesia.

### Proses Respons

1. **Konfirmasi**: Kami akan mengonfirmasi penerimaan laporan Anda dalam 48 jam
2. **Verifikasi**: Tim kami akan memverifikasi kerentanan dan menilai dampaknya
3. **Pengembangan Perbaikan**: Kami akan mengembangkan dan menguji perbaikan
4. **Pengungkapan**: Kami akan mengoordinasikan pengungkapan publik dengan Anda

### Bug Bounty

Saat ini kami tidak menawarkan program bug bounty. Namun, kami sangat menghargai pengungkapan yang bertanggung jawab dan akan memberikan kredit kepada pelapor dalam advisory keamanan kami.

## Praktik Terbaik Keamanan

### Untuk Pengembang

1. **Jangan pernah commit secret** - Gunakan environment variables
2. **Validasi semua input** - Gunakan skema Zod
3. **Gunakan parameterized queries** - Prisma menangani ini secara otomatis
4. **Jaga dependensi tetap terbaru** - Jalankan `bun audit` secara teratur
5. **Ikuti prinsip least privilege** - Batasi hak akses

### Untuk Pengguna

1. **Gunakan kata sandi yang kuat** - Minimal 8 karakter, campuran tipe
2. **Aktifkan 2FA** - Saat tersedia
3. **Jaga browser Anda tetap terbaru** - Gunakan versi terbaru
4. **Laporkan aktivitas mencurigakan** - Hubungi dukungan segera

## Fitur Keamanan

- ✅ HTTPS enforcement di production
- ✅ HTTP Security Headers (HSTS, X-Frame-Options, CSP, dll.)
- ✅ bcrypt password hashing
- ✅ JWT dengan cookie aman
- ✅ Rate limiting pada endpoint API
- ✅ Kontrol akses berbasis peran
- ✅ Isolasi situs untuk data multi-tenant
- ✅ Validasi input dengan Zod
- ✅ Pencegahan SQL injection via Prisma ORM
- ✅ Header perlindungan XSS
- ✅ Perlindungan CSRF via NextAuth

## Riwayat Audit

| Tanggal    | Tipe                     | Hasil               |
| ---------- | ------------------------ | ------------------- |
| 2026-05-16 | Review Keamanan Internal | Lulus               |
| 2026-05-16 | Audit Dependensi         | 0 kerentanan kritis |
