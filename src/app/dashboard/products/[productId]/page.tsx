import ProductEditor from "@/modules/catalog/ui/dashboard/products/ProductEditor";
import { db } from "@/modules/shared/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const siteId = await getSiteId();
    if (!siteId) return notFound();

    const data = await db.product.findFirst({
        where: { id: productId, siteId },
        include: { metaData: true }
    });

    if (!data) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <span className="text-destructive font-black text-[10px] uppercase tracking-[0.2em]">Produk Tidak Ditemukan</span>
            </div>
        );
    }

    // Ubah Decimal Prisma menjadi number/string agar aman di-serialize ke Client Component
    const serializedData = {
        ...data,
        price: data.price ? Number(data.price) : 0,
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
    };

    return <ProductEditor key={data.id} productId={data.id} initialData={serializedData as any} />;
}
