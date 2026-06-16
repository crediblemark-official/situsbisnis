import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProduct } from "@/modules/content/services/content-display.service";
import { serializeProduct } from "@/lib/content/serialize";
import { getPaymentSettings } from "@/lib/settings/payment";
import { getSiteSettings } from "@/modules/tenant/services/site-settings.service";
import ProductDetailViewClient from "@/components/shop/ProductDetailViewClient";
import { generateAutoExcerpt } from "@/lib/utils/string";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product || product.isArchived) {
        return {
            title: "Product Not Found",
        };
    }

    const seoDescription = product.seoMeta?.description || 
        product.metaData?.find((m: any) => m.key === "excerpt")?.value ||
        (product.description ? generateAutoExcerpt(product.description) : `Buy ${product.name}`);

    const seoTitle = product.seoMeta?.title || `${product.name} - Store`;

    return {
        title: seoTitle,
        description: seoDescription,
    };
}

export default function ProductDetailPageWrapper({
    params,
}: {
    params: any;
}) {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center animate-pulse">Loading...</div>}>
            <ProductDetailContent params={params} />
        </React.Suspense>
    );
}

async function ProductDetailContent({
    params,
}: {
    params: any;
}) {
    const { slug } = await params;
    const product = await getProduct(slug);

    const paymentSettings = await getPaymentSettings();
    const siteSettings = await getSiteSettings();
    const currency = paymentSettings.currency || "USD";
    const brandColor = siteSettings.brandColor || "#0ea5e9";

    if (!product || product.isArchived) {
        return notFound();
    }

    const serializedProduct = serializeProduct(product);

    return (
        <ProductDetailViewClient 
            product={serializedProduct} 
            currency={currency} 
            brandColor={brandColor} 
        />
    );
}
