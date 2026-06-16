"use client";

import { useEffect, useState, use } from "react";
import ProductEditor from "@/app/dashboard/products/ProductEditor";
import { Loader2 } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = use(params);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId || productId === "new") return;

        fetch(`/api/products/${productId}`)
            .then(res => res.json())
            .then(res => {
                const productData = res.data || res;
                if (productData && !productData.error) {
                    setData(productData);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [productId]);

    if (loading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Produk...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <span className="text-destructive font-black text-[10px] uppercase tracking-[0.2em]">Produk Tidak Ditemukan</span>
            </div>
        );
    }

    return <ProductEditor key={data.id} productId={data.id} initialData={data} />;
}
