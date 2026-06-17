import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/modules/site/ui/site-settings";
import BlogClient from "./BlogClient";
import { getProducts } from "@/modules/page/ui/content-display";
import { serializeProducts } from "@/lib/content/serialize";
import { ProductGridItem } from "@/app/dashboard/products/ProductGridItem";
import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { IdentityClient } from "@/modules/auth";

export async function generateMetadata(): Promise<Metadata> {
    const siteId = await getSiteId();
    const settings = await getSiteSettings(siteId || undefined);
    return {
        title: `Blog - ${settings?.siteName || "Platform"}`,
        description: settings?.description || `Dapatkan artikel terbaru, tutorial, dan update.`
    };
}

export default async function BlogIndexPage() {
    const siteId = await getSiteId();
    if (!siteId) return notFound();

    // Fetch all published posts for this tenant site, including metaData, and terms relations
    const rawPosts = await db.post.findMany({
        where: { published: true, siteId },
        orderBy: { createdAt: "desc" },
        include: {
            metaData: true,
            terms: {
                select: {
                    name: true,
                    slug: true,
                    taxonomy: { select: { name: true, slug: true } }
                }
            }
        }
    });

    const authorIds = Array.from(new Set(rawPosts.map(p => p.authorId).filter(Boolean))) as string[];
    const usersMap = await IdentityClient.getUsersMap(authorIds);

    const posts = rawPosts.map(post => ({
        ...post,
        author: post.authorId ? usersMap[post.authorId] || null : null
    }));

    const settings = await getSiteSettings(siteId);

    // Fetch and serialize products dynamically from database for this siteId
    const allProducts = await getProducts(siteId);
    const products = serializeProducts(allProducts);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-20">
                
                {/* INTERACTIVE CLIENT TABS FILTER & GRID WITH LOAD MORE */}
                <BlogClient 
                    posts={posts as any} 
                    siteName={settings?.siteName}
                    description={settings?.tagline || settings?.description}
                />

                {/* PRODUCTS SHOWCASE SECTION */}
                <section className="space-y-10 pt-10 border-t border-gray-100 dark:border-border/50">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 dark:border-border/50 pb-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Koleksi Terbaik
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-foreground">
                                Produk Pilihan Untuk Anda
                            </h2>
                            <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-xl leading-relaxed">
                                Jelajahi koleksi produk premium kami yang dirancang khusus untuk memenuhi kebutuhan bisnis dan personal Anda.
                            </p>
                        </div>
                        <Link 
                            href="/shop" 
                            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-card text-white hover:bg-black dark:hover:bg-black dark:hover:bg-muted border border-transparent dark:border-border text-xs font-bold uppercase tracking-widest rounded-full transition-all active:scale-95 shrink-0"
                        >
                            Lihat Semua Produk
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </div>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {products.slice(0, 4).map((product) => (
                                <ProductGridItem key={product.id} product={product} baseUrl="/shop" />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-card border border-gray-100 dark:border-border/50 rounded-2xl shadow-sm max-w-md mx-auto w-full">
                            <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-foreground mb-2">Belum Ada Produk</h3>
                            <p className="text-gray-500 dark:text-muted-foreground text-xs max-w-xs mx-auto px-4 leading-relaxed">
                                Kami sedang mempersiapkan produk-produk berkualitas tinggi untuk Anda. Silakan kembali lagi nanti untuk penawaran menarik!
                            </p>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
