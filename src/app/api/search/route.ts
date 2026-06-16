import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET(req: Request) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor", "user"]);
    if (error) return apiError(error, status);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) return apiResponse([]);

    try {
        const [posts, pages, products] = await Promise.all([
            db.post.findMany({
                where: {
                    siteId,
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { slug: { contains: q, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: { id: true, title: true }
            }),
            db.credBuildPage.findMany({
                where: {
                    siteId,
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { path: { contains: q, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: { id: true, title: true, path: true }
            }),
            db.product.findMany({
                where: {
                    siteId,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { slug: { contains: q, mode: 'insensitive' } },
                    ]
                },
                take: 5,
                select: { id: true, name: true }
            })
        ]);

        const results = [
            ...posts.map(p => ({
                id: p.id,
                label: p.title,
                href: `/dashboard/posts/${p.id}`,
                category: "Artikel",
                type: "post"
            })),
            ...pages.map(p => ({
                id: p.id,
                label: p.title,
                href: `/dashboard/pages/${p.id}`,
                category: "Halaman",
                type: "page"
            })),
            ...products.map(p => ({
                id: p.id,
                label: p.name,
                href: `/dashboard/products/${p.id}`,
                category: "Produk",
                type: "product"
            }))
        ];

        return apiResponse(results);
    } catch (error) {
        console.error("Search API Error:", error);
        return apiError("Search failed");
    }
}
