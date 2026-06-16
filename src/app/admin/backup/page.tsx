import React from "react";
import { db } from "@/lib/core/db";
import { PageHeader } from "@/components/ui/PageHeader";
import BackupClient from "@/components/admin/BackupClient";

export const metadata = {
    title: "Backup & Restore - Admin Utama",
    description: "Ekspor seluruh database platform ke file JSON lokal, dan lakukan pemulihan sistem secara aman.",
};

async function getStats() {
    const [totalUsers, totalSites, totalProducts, totalOrders] = await Promise.all([
        db.user.count(),
        db.site.count(),
        db.product.count(),
        db.order.count()
    ]);

    return {
        totalUsers,
        totalSites,
        totalProducts,
        totalOrders
    };
}

export default async function AdminBackupPage() {
    const stats = await getStats();

    return (
        <div className="w-full animate-in fade-in duration-700 space-y-6 text-foreground">
            <PageHeader 
                title="Pencadangan & Pemulihan" 
                subtitle="Ekspor isi database platform lengkap atau pulihkan kondisi situs tenant dan data akun Anda menggunakan file cadangan JSON lokal secara instan." 
            />
            
            <BackupClient stats={stats} />
        </div>
    );
}
