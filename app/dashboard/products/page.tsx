import React, { Suspense } from "react";

import { Plus, ShoppingCart } from "lucide-react";
import { db } from "@/lib/core/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteId } from "@/lib/domains/tenant";
import { serializeProducts } from "@/lib/content/serialize";
import { getPaymentSettings } from "@/lib/settings/payment";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { ProductListContent } from "./ProductListContent";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const session = await getServerSession(authOptions);
    const isAuthorized = (session?.user as any)?.role === "admin" || (session?.user as any)?.role === "editor" || (session?.user as any)?.role === "owner";
    const { page, limit } = await searchParams;

    return (
        <div className="animate-in fade-in duration-700 pb-20 space-y-6">
            <PageHeader 
                title={isAuthorized ? "Inventaris Produk" : "Katalog Produk"} 
                subtitle={isAuthorized ? "Manajemen stok, harga, dan logistik produk." : "Telusuri koleksi produk yang tersedia."}
                icon={<ShoppingCart />}
            >
                {isAuthorized && (
                    <LinkButton
                        href="/dashboard/products/new"
                        icon={<Plus size={16} />}
                    >
                        Tambah Produk
                    </LinkButton>
                )}
            </PageHeader>

            <Suspense fallback={<TableSkeleton rows={8} cols={4} />}>
                <ProductList 
                    isAuthorized={isAuthorized} 
                    page={parseInt(page || "1")} 
                    limit={parseInt(limit || "50")} 
                />
            </Suspense>
        </div>
    );
}

async function ProductList({ 
    isAuthorized, 
    page = 1, 
    limit = 50 
}: { 
    isAuthorized: boolean;
    page: number;
    limit: number;
}) {
    const siteId = await getSiteId();
    // Admin sees ALL (including archived). Users see only NON-archived.
    const whereCondition: any = isAuthorized ? { siteId } : { siteId, isArchived: false };
    const skip = (page - 1) * limit;

    const [allProducts, total] = await Promise.all([
        db.product.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip,
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                currency: true,
                stock: true,
                isArchived: true,
                createdAt: true,
                images: true,
            }
        }),
        db.product.count({ where: whereCondition })
    ]);

    const paymentSettings = await getPaymentSettings();
    const currency = paymentSettings.currency || "USD";
    const serializedProducts = serializeProducts(allProducts);

    return (
        <ProductListContent 
            products={serializedProducts} 
            isAdminOrEditor={isAuthorized} 
            currency={currency} 
            pagination={{
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }}
        />
    );
}
