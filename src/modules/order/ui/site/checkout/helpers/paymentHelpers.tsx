import React from "react";
import { Building2, Wallet, Smartphone, CreditCard } from "lucide-react";

/**
 * Mendapatkan label kategori metode pembayaran berdasarkan kode atau nama
 */
export function getCategoryLabel(code: string, name: string = "") {
    if (code === "manual") return "Transfer Bank (Manual)";
    const c = code.toUpperCase();
    const n = name.toUpperCase();
    if (c.includes("QR") || n.includes("QRIS")) return "QRIS";
    if (c.includes("VA") || n.includes("VA") || n.includes("VIRTUAL ACCOUNT") || ["I1", "BT", "A1", "M2", "V1", "B1", "AG", "NC", "BR", "S1", "BS", "MY"].some(p => c.startsWith(p.slice(0, 2)))) return "Virtual Account";
    if (["OV", "GO", "SH", "DA", "LA", "OL", "SL", "GP", "OP", "DN", "JA", "JN", "JP"].some(p => c.startsWith(p.slice(0, 2))) || n.includes("OVO") || n.includes("DANA") || n.includes("GOPAY") || n.includes("LINKAJA") || n.includes("SHOPEEPAY") || n.includes("JENIUS")) return "E-Wallet";
    if (c.startsWith("FT") || c.startsWith("AL") || n.includes("INDOMARET") || n.includes("ALFAMART") || n.includes("RETAIL")) return "Retail / Gerai";
    if (c.startsWith("VC") || n.includes("CREDIT CARD") || n.includes("KARTU KREDIT")) return "Kartu Kredit";
    if (n.includes("PAYLATER") || n.includes("INDODANA") || n.includes("AKULAKU") || n.includes("KREDIVO")) return "Paylater / Cicilan";
    return "Lainnya";
}

/**
 * Mendapatkan ikon yang sesuai untuk label kategori tertentu
 */
export function getCategoryIcon(label: string) {
    if (label === "Virtual Account") return <Building2 size={14} />;
    if (label === "E-Wallet") return <Wallet size={14} />;
    if (label === "QRIS") return <Smartphone size={14} />;
    if (label === "Kartu Kredit") return <CreditCard size={14} />;
    if (label === "Paylater / Cicilan") return <CreditCard size={14} />;
    return <CreditCard size={14} />;
}

/**
 * Mendapatkan instruksi pembayaran berdasarkan metode dan kode bayar
 */
export function getPaymentInstructions(method: string, payCode: string, isQris: boolean = false) {
    if (method === "manual") return [];
    if (isQris) {
        return [
            "Buka aplikasi e-wallet (Gopay, OVO, DANA, LinkAja, ShopeePay) atau mobile banking pilihan Anda",
            "Pilih opsi 'Scan' / 'Pindai' / 'Bayar' di dalam aplikasi tersebut",
            "Arahkan kamera HP Anda ke QR Code yang ditampilkan di atas",
            "Konfirmasi detail nominal dan masukkan PIN Anda untuk menyelesaikan pembayaran"
        ];
    }
    const m = method.toUpperCase();
    if (m === "B1") { // BCA
        return [
            "Buka aplikasi BCA Mobile atau KlikBCA",
            "Pilih menu 'm-Transfer' > 'BCA Virtual Account'",
            `Masukkan nomor Virtual Account: ${payCode}`,
            "Detail pesanan Anda akan muncul. Masukkan PIN BCA untuk menyelesaikan pembayaran"
        ];
    }
    if (m === "I1") { // Mandiri
        return [
            "Buka aplikasi Livin' by Mandiri",
            "Pilih menu 'Bayar' > 'Buat Pembayaran Baru' > 'Multipayment'",
            "Cari penyedia jasa / institusi Duitku",
            `Masukkan nomor Virtual Account: ${payCode}`,
            "Detail tagihan akan muncul. Konfirmasi pembayaran dan masukkan PIN Livin' Anda"
        ];
    }
    if (m === "BT") { // Permata
        return [
            "Masukkan kartu ATM Permata Anda",
            "Pilih menu 'Transaksi Lainnya' > 'Pembayaran' > 'Lain-lain' > 'Virtual Account'",
            `Masukkan nomor Virtual Account: ${payCode}`,
            "Konfirmasi detail transaksi dan selesaikan pembayaran"
        ];
    }
    if (m === "BR") { // BRI (BRIVA)
        return [
            "Buka aplikasi BRImo",
            "Pilih menu 'Lainnya' > 'BRIVA'",
            "Pilih 'Pembayaran Baru'",
            `Masukkan nomor BRIVA: ${payCode}`,
            "Konfirmasi nominal, masukkan PIN BRImo Anda untuk memproses pembayaran"
        ];
    }
    if (m === "S1") { // BNI
        return [
            "Buka aplikasi BNI Mobile Banking",
            "Pilih menu 'Transfer' > 'Virtual Account Billing'",
            "Pilih rekening debit, lalu pilih 'Input Baru'",
            `Masukkan nomor Virtual Account BNI: ${payCode}`,
            "Detail tagihan akan muncul. Masukkan Password Transaksi Anda untuk konfirmasi"
        ];
    }
    if (m === "FT") { // Indomaret
        return [
            "Kunjungi gerai Indomaret terdekat",
            "Sampaikan ke kasir bahwa Anda ingin melakukan pembayaran Duitku / Merchant",
            `Berikan kode pembayaran berikut kepada kasir: ${payCode}`,
            "Lakukan pembayaran sesuai nominal yang disebutkan oleh kasir dan simpan struk pembayaran Anda"
        ];
    }
    if (m === "AL") { // Alfamart
        return [
            "Kunjungi gerai Alfamart terdekat",
            "Sampaikan ke kasir bahwa Anda ingin melakukan pembayaran Duitku / Merchant",
            `Berikan kode pembayaran berikut kepada kasir: ${payCode}`,
            "Lakukan pembayaran sesuai nominal dan pastikan Anda menerima struk tanda terima resmi"
        ];
    }
    // Fallback umum
    return [
        `Gunakan aplikasi mobile banking / e-wallet pilihan Anda`,
        `Gunakan kode pembayaran / nomor VA berikut untuk membayar: ${payCode}`,
        "Ikuti instruksi pembayaran di aplikasi Anda untuk menyelesaikan transaksi",
        "Pembayaran Anda akan terdeteksi otomatis dalam beberapa menit"
    ];
}
