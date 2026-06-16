"use client";

import { useEffect, useState, use } from "react";
import PageEditor from "@/app/dashboard/pages/PageEditor";
import { Loader2 } from "lucide-react";

export default function EditPageRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(id !== "new");

    const [prevId, setPrevId] = useState(id);
    if (id !== prevId) {
        setPrevId(id);
        if (id !== "new") setLoading(true);
    }

    useEffect(() => {
        if (id === "new") return;

        fetch(`/api/pages/${id}`)
            .then(res => res.json())
            .then(pageData => {
                if (pageData && !pageData.error) {
                    setData(pageData);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (id === "new") {
        return <PageEditor />;
    }

    if (loading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Halaman...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <span className="text-destructive font-black text-[10px] uppercase tracking-[0.2em]">Halaman Tidak Ditemukan</span>
            </div>
        );
    }

    return <PageEditor key={data.id} pageId={data.id} initialData={data} />;
}
