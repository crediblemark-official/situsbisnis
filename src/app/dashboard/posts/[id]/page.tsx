import PostEditor from "@/modules/post/ui/dashboard/posts/PostEditor";
import { db } from "@/modules/shared/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const siteId = await getSiteId();
    if (!siteId) return notFound();

    const data = await db.post.findFirst({
        where: { id, siteId },
        include: { metaData: true }
    });

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

    if (!data) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <span className="text-destructive font-black text-[10px] uppercase tracking-[0.2em]">Artikel Tidak Ditemukan</span>
            </div>
        );
    }

    return <PostEditor key={data.id} postId={data.id} initialData={data as any} initialCategories={categories} />;
}
