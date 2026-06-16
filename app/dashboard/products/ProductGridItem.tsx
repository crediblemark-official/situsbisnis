"use client";

import React, { useState } from 'react';
import { useCurrency } from "@/hooks/use-currency";
import Link from "next/link";

export function ProductGridItem({ product, baseUrl = "/dashboard/products" }: { product: any, baseUrl?: string }) {
    const { formatPrice } = useCurrency();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleTitleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/50 overflow-hidden hover:shadow-lg hover:border-gray-200 dark:hover:border-border transition-all duration-300 group flex flex-col justify-between shadow-sm">
            <Link href={`${baseUrl}/${product.id}`} className="block aspect-[4/3] bg-gray-50 dark:bg-muted/30 relative group-hover:opacity-95 transition-opacity overflow-hidden">
                {product.images && product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-indigo-500/5 flex items-center justify-center">
                        <span className="text-muted-foreground/15">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                <path d="M3 6h18" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                        </span>
                    </div>
                )}
            </Link>
            <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2 text-left">
                <div className="block">
                    <h3 
                        onClick={handleTitleClick}
                        className={`font-bold text-xs sm:text-sm text-gray-900 dark:text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight cursor-pointer ${
                            isExpanded ? "whitespace-normal break-words" : "truncate"
                        }`}
                        title={product.name}
                    >
                        {product.name}
                    </h3>
                </div>
                <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through font-normal">
                            {formatPrice(product.originalPrice)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

