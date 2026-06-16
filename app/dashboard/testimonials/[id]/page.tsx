"use client";

import { useEffect, useState, use } from "react";
import TestimonialEditor from "@/app/dashboard/testimonials/TestimonialEditor";
import { Loader2 } from "lucide-react";

export default function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || id === "new") return;

        fetch(`/api/testimonials/${id}`)
            .then(res => res.json())
            .then(res => {
                const testimonialData = res.data || res;
                if (testimonialData && !testimonialData.error) {
                    setData(testimonialData);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Testimoni...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                <span className="text-destructive font-black text-[10px] uppercase tracking-[0.2em]">Testimoni Tidak Ditemukan</span>
            </div>
        );
    }

    return <TestimonialEditor key={data.id} initialData={data} />;
}
