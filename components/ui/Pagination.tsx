"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        return `${pathname}?${params.toString()}`;
    };

    const isPrevDisabled = currentPage <= 1;
    const isNextDisabled = currentPage >= totalPages;

    return (
        <nav aria-label="Pagination" className="mt-16 flex justify-center items-center gap-6">
            <Link
                href={isPrevDisabled ? "#" : createPageUrl(currentPage - 1)}
                tabIndex={isPrevDisabled ? -1 : undefined}
                aria-disabled={isPrevDisabled ? "true" : undefined}
                className={`
                    px-6 py-2 bg-muted/10 border border-border rounded-xl 
                    text-[10px] font-black uppercase tracking-[0.2em] text-foreground 
                    transition-all outline-none 
                    focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50
                    ${isPrevDisabled 
                        ? 'opacity-30 pointer-events-none' 
                        : 'hover:bg-muted/20 active:scale-95'
                    }
                `}
            >
                Kembali
            </Link>
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                Halaman {currentPage} <span className="opacity-30">/</span> {totalPages}
            </span>
            <Link
                href={isNextDisabled ? "#" : createPageUrl(currentPage + 1)}
                tabIndex={isNextDisabled ? -1 : undefined}
                aria-disabled={isNextDisabled ? "true" : undefined}
                className={`
                    px-6 py-2 bg-muted/10 border border-border rounded-xl 
                    text-[10px] font-black uppercase tracking-[0.2em] text-foreground 
                    transition-all outline-none 
                    focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50
                    ${isNextDisabled 
                        ? 'opacity-30 pointer-events-none' 
                        : 'hover:bg-muted/20 active:scale-95'
                    }
                `}
            >
                Lanjut
            </Link>
        </nav>
    );
}
