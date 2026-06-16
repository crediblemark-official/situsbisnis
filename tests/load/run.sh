#!/usr/bin/env bash

# Keluar jika ada error
set -e

# Pindah ke direktori utama proyek (tempat docker-compose.load.yml berada)
CDPATH= cd "$(dirname "$0")/../.."

echo "=================================================="
echo "    PENGUJIAN KONKURENSI / LOAD TESTING (k6)"
echo "=================================================="

# Membaca jenis pengujian
echo "Pilih Mode Pengujian:"
echo "1) Load Test Ringan (Default, max 10 VU, durasi ~1m)"
echo "2) Stress Test Agresif (Beban puncak, max 100 VU, durasi ~3m)"
read -p "Masukkan pilihan Anda [1-2, default: 1]: " MODE_PILIHAN

STRESS_TEST="false"
if [ "$MODE_PILIHAN" == "2" ]; then
    STRESS_TEST="true"
fi

# Membaca target URL pengujian
read -p "Masukkan URL Target (default: https://situsbisnis.com): " TARGET_URL
if [ -z "$TARGET_URL" ]; then
    TARGET_URL="https://situsbisnis.com"
fi

# Membaca Site ID untuk tenant context
read -p "Masukkan Site ID untuk pengujian tenant (default: cmptx3nj9002m6e17np8bytlk): " SITE_ID
if [ -z "$SITE_ID" ]; then
    SITE_ID="cmptx3nj9002m6e17np8bytlk"
fi

export TARGET_URL=$TARGET_URL
export SITE_ID=$SITE_ID
export STRESS_TEST=$STRESS_TEST

echo ""
echo "Menargetkan URL: $TARGET_URL"
echo "Menggunakan Site ID: $SITE_ID"
echo "Mode Pengujian: $( [ "$STRESS_TEST" == "true" ] && echo "Stress Test (Agresif)" || echo "Load Test (Ringan)" )"
echo "=================================================="
echo "Menjalankan k6 via Docker..."
echo "Tekan Ctrl+C jika ingin membatalkan pengujian."
echo ""

docker compose -f docker-compose.load.yml run --rm k6

echo ""
echo "=================================================="
echo "✨ Pengujian Selesai!"
echo "Laporan visual HTML cantik telah disimpan di:"
echo "👉 tests/load/report.html"
echo "Silakan buka berkas tersebut di browser Anda untuk menganalisis performa server."
echo "=================================================="

