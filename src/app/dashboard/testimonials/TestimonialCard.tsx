
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, Trash2, CheckCircle, Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

import { updateTestimonialAction, deleteTestimonialAction } from "@/modules/post/actions/post.actions";

type TestimonialProps = {
    id: string;
    quote: string;
    author: string;
    role?: string | null;
    isApproved?: boolean | null;
};

export default function TestimonialCard({ testimonial }: { testimonial: TestimonialProps }) {
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);


    const handleApprove = async () => {
        try {
            const res = await updateTestimonialAction(testimonial.id, { isApproved: true });
            if (res.success) {
                router.refresh();
                toast.success("Testimoni disetujui");
            } else {
                toast.error(res.error || "Gagal menyetujui testimoni");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat menyetujui");
        }
    };

    const handleDelete = async () => {
        try {
            const res = await deleteTestimonialAction(testimonial.id);
            if (res.success) {
                router.refresh();
                toast.success("Testimoni dihapus");
            } else {
                toast.error(res.error || "Gagal menghapus testimoni");
            }
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error("Terjadi kesalahan saat menghapus");
        } finally {
            setShowDeleteModal(false);
        }
    };

    return (
        <>
            <div className={`bg-card border border-border rounded-md p-2.5 flex flex-col h-full transition-all group relative hover:shadow-2xl hover:-translate-y-1 ${!testimonial.isApproved ? 'bg-amber-500/5 border-amber-500/10' : 'shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                    {!testimonial.isApproved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-600 uppercase tracking-widest border border-amber-500/20">
                            Pending
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-700 uppercase tracking-widest border border-emerald-500/20">
                            Visible
                        </span>
                    )}

                    <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        {!testimonial.isApproved && (
                            <button
                                onClick={handleApprove}
                                className="p-1.5 text-foreground hover:text-emerald-500 transition-all rounded hover:bg-emerald-500/10"
                                title="Approve"
                            >
                                <CheckCircle size={14} />
                            </button>
                        )}
                        <Link
                            href={`/dashboard/testimonials/${testimonial.id}`}
                            className="p-1.5 text-foreground hover:text-primary transition-all rounded hover:bg-primary/10"
                            title="Edit"
                        >
                            <Edit size={14} />
                        </Link>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-1.5 text-foreground hover:text-destructive transition-all rounded hover:bg-destructive/10"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-grow relative">
                    <Quote className="absolute -top-2 -left-2 text-primary/10 w-8 h-8 -z-10" />
                    <p className="text-foreground text-xs leading-relaxed font-medium italic opacity-90">
                        &quot;{testimonial.quote}&quot;
                    </p>
                </div>

                <div className="pt-3 border-t border-border mt-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center text-primary font-black text-[10px] border border-primary/10 shadow-inner group-hover:scale-110 transition-transform">
                        {testimonial.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-black text-foreground text-[11px] uppercase tracking-tight">{testimonial.author}</h3>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60 mt-0.5">{testimonial.role || "Verified Client"}</p>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Testimoni?"
                message={`Apakah Anda yakin ingin menghapus testimoni dari "${testimonial.author}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />
        </>
    );
}
