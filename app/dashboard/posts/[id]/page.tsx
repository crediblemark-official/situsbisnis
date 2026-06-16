"use client";

import { useEffect, useState, use } from "react";
import PostEditor from "@/app/dashboard/posts/PostEditor";
import { Loader2 } from "lucide-react";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/posts/${id}`)
            .then(res => res.json())
            .then(res => {
                const postData = res.data || res;
                if (postData && !postData.error) {
                    setData(postData);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Artikel...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <span className="text-destructive font-black text-[10px] uppercase tracking-[0.2em]">Artikel Tidak Ditemukan</span>
            </div>
        );
    }

    return <PostEditor key={data.id} postId={data.id} initialData={data} />;
}
