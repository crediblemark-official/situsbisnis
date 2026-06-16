import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Cek apakah mode stress test diaktifkan via env
const STRESS_TEST = __ENV.STRESS_TEST === 'true';

// Konfigurasi opsi load test k6
export const options = {
  stages: STRESS_TEST ? [
    { duration: '30s', target: 20 },  // Ramping-up cepat ke 20 Virtual Users (VU)
    { duration: '1m', target: 50 },   // Peningkatan beban tinggi ke 50 VU
    { duration: '1m', target: 100 },  // Beban puncak stres test ke 100 VU
    { duration: '30s', target: 0 },   // Ramping-down kembali ke 0 VU
  ] : [
    { duration: '20s', target: 10 },  // Uji beban ringan/default (10 VU)
    { duration: '40s', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    // Toleransi durasi request (95% request harus di bawah 3 detik)
    http_req_duration: ['p(95)<3000'],
  },
};

// Target default host jika tidak ditentukan lewat env
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:3000';

// Daftar Site ID riil hasil query database SitusBisnis untuk simulasi Multi-Tenant
const SITE_IDS = [
  'cmptx3nj9002m6e17np8bytlk',  // Dream Digital Indonesia (dreamdigital)
  'cmpxsdg6h000fqos1nnykn6pa',  // Toko Kue Test (kuetestaja)
  'cmp70obn9000111054wyur2q2',  // Kanjeng Pentol (kanjengpentol)
  'cmptrqwvs000b6e171fuwujah',  // Inamy Beauty Care (inamibeautycare)
  'cmpudrl240009p78b9a84694n',  // Syaiful (syaiful)
  'cmpxzxila000zqos1i9z19bee',  // Showroom Mobil (showroombekas)
  'cmp3twfmn0002y7pd4fu6c51o',  // KBM Kreator Yogyakarta (kbmkreatoryogyakarta)
  'cmpff0ccz0002u5f0rp7dk8aq',  // Konghuan (konghuan)
  'cmpajs4rs0001ncnzgna0wpo2',  // UnivedPress (univedpress)
];

export default function runLoadTest() {
  // Ambil Site ID secara acak untuk menyimulasikan multi-tenant database queries
  const randomSiteId = SITE_IDS[Math.floor(Math.random() * SITE_IDS.length)];

  const headers = {
    'Content-Type': 'application/json',
    'x-site-id': randomSiteId,
  };

  // Pilih alur pengguna secara acak (70% browsing biasa, 30% mengirim pesan kontak)
  const userBehavior = Math.random();

  if (userBehavior < 0.7) {
    // ==================================================
    // ALUR A: PENJELAJAHAN PENGUNJUNG (Visitor Journey)
    // ==================================================
    group('Visitor_Browse_Flow', function () {
      // Langkah 1: Buka Halaman Analitik/Dashboard Publik
      const resAnalytics = http.get(`${TARGET_URL}/api/analytics`, { headers });
      check(resAnalytics, {
        'GET Analytics status 200/429': (r) => r.status === 200 || r.status === 429,
      });
      
      // Simulasi jeda berpikir pengunjung membaca halaman (1-2 detik)
      sleep(Math.random() * 1 + 1);

      // Langkah 2: Pengunjung membuka Galeri Situs
      const resGallery = http.get(`${TARGET_URL}/api/gallery`, { headers });
      check(resGallery, {
        'GET Gallery status 200/429': (r) => r.status === 200 || r.status === 429,
      });

      sleep(Math.random() * 1.5 + 1);

      // Langkah 3: Pengunjung membuka daftar postingan blog
      const resPosts = http.get(`${TARGET_URL}/api/posts`, { headers });
      check(resPosts, {
        'GET Posts status 200/429': (r) => r.status === 200 || r.status === 429,
      });

      sleep(Math.random() * 1 + 1);

      // Langkah 4: Pengunjung melihat katalog produk
      const resProducts = http.get(`${TARGET_URL}/api/products`, { headers });
      check(resProducts, {
        'GET Products status 200/429': (r) => r.status === 200 || r.status === 429,
      });
    });
  } else {
    // ==================================================
    // ALUR B: KONVERSI / HUBUNGI KAMI (Conversion Flow)
    // ==================================================
    group('Visitor_Contact_Flow', function () {
      // Langkah 1: Pengunjung membuka form hubungi kami (simulasi load gallery)
      const resGallery = http.get(`${TARGET_URL}/api/gallery`, { headers });
      check(resGallery, {
        'GET Gallery status 200/429': (r) => r.status === 200 || r.status === 429,
      });

      // Simulasi mengisi formulir kontak (2-3 detik)
      sleep(Math.random() * 1 + 2);

      // Langkah 2: Pengunjung mengirimkan formulir kontak
      const contactPayload = JSON.stringify({
        name: `K6 Advanced User ${Math.floor(Math.random() * 10000)}`,
        email: `k6_adv_${Math.floor(Math.random() * 10000)}@example.com`,
        message: 'Halo, ini adalah pengujian performa konkurensi tingkat lanjut menggunakan skenario multi-tenant k6.',
      });

      const resContact = http.post(`${TARGET_URL}/api/contact`, contactPayload, { headers });
      check(resContact, {
        'POST Contact status 200/400/429': (r) => [200, 400, 429].includes(r.status),
      });
    });
  }

  // Jeda akhir sebelum iterasi pengguna berikutnya dimulai (1-2 detik)
  sleep(Math.random() * 1 + 1);
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Fungsi ekspor summary k6 untuk menghasilkan laporan HTML visual yang cantik
export function handleSummary(data) {
  return {
    '/tests/report.html': htmlReport(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

