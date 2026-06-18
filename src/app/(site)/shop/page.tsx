
import { ProductGridItem } from "@/modules/catalog/ui/dashboard/products/ProductGridItem";

import { Metadata } from "next";

import { serializeProducts } from "@/lib/content/serialize";


import { getProducts } from "@/modules/page/ui/content-display";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Shop",
        description: "Discover our premium collection of products. Quality you can trust, curated just for you.",
        openGraph: {
            title: "Shop",
            description: "Discover our premium collection of products. Quality you can trust, curated just for you.",
            type: "website",
        }
    };
}

export default async function ShopPage() {
    const allProducts = await getProducts();




    const serializedProducts = serializeProducts(allProducts);

    return (
        <div className="bg-background">
            {/* Header is provided by SiteLayout */}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <section className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-foreground mb-4">Our Collection</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Discover premium quality products curated just for you.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {serializedProducts.map((product) => (
                        <ProductGridItem key={product.id} product={product} baseUrl="/shop" />
                    ))}
                </div>
            </main>
        </div>
    );
}
