import PostEditor from "@/app/dashboard/posts/PostEditor";
import { db } from "@/modules/shared/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
    const siteId = await getSiteId();
    if (!siteId) return notFound();

    const taxonomy = await db.taxonomy.findFirst({
        where: {
            siteId,
            OR: [
                { slug: "category" },
                { name: { contains: "category", mode: "insensitive" } },
                { name: { contains: "kategori", mode: "insensitive" } },
            ]
        }
    });

    let categories: string[] = [];
    if (taxonomy) {
        const terms = await db.term.findMany({
            where: { taxonomyId: taxonomy.id }
        });
        categories = terms.map(t => t.name);
    }

    return <PostEditor initialCategories={categories} />;
}
