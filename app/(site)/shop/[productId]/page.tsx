import { db } from "@/lib/core/db";
import { serializeProduct } from "@/lib/content/serialize";
import ProductDetailViewClient from "@/components/shop/ProductDetailViewClient";
import { getPaymentSettings } from "@/lib/settings/payment";
import { getSiteSettings } from "@/lib/settings/site";
import Script from "next/script";
import { headers } from "next/headers";
import { getBaseUrl } from "@/lib/domains/utils";

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const product = await db.product.findUnique({
        where: { id: productId }
    });

    const title = product ? `${product.name} | Unived Press Shop` : "Product Not Found";
    const description = product?.description || "Product Details";
    const images = product?.images && product.images.length > 0 ? [product.images[0]] : [];

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: images,
            type: "website",
        }
    };
}

export default async function PublicProductPage({
    params
}: {
    params: Promise<{ productId: string }>;
}) {
    const { productId } = await params;
    const product = await db.product.findUnique({
        where: { id: productId }
    });

    if (!product) {
        return <div className="p-20 text-center text-foreground">Product not found</div>;
    }

    const serializedProduct = serializeProduct(product);

    const paymentSettings = await getPaymentSettings();
    const siteSettings = await getSiteSettings();
    const currency = paymentSettings.currency || "USD";
    const brandColor = siteSettings.brandColor || "#0ea5e9";

    const headersList = await headers();
    const host = headersList.get("host");
    const baseUrl = getBaseUrl(host);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.images?.[0] || undefined,
        "description": product.description,
        "sku": product.id,
        "offers": {
            "@type": "Offer",
            "url": `${baseUrl}/shop/${product.id}`,
            "priceCurrency": product.currency,
            "price": product.price,
            "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    return (
        <main className="bg-background min-h-screen">
            <Script
                id="ld-json-product"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Header provided by SiteLayout */}

            <ProductDetailViewClient 
                product={serializedProduct} 
                currency={currency} 
                brandColor={brandColor} 
            />
        </main>
    );
}
