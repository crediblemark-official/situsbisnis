"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, ShoppingCart, Eye } from "lucide-react";
import { ProductGridItem } from "./ProductGridItem";
import { ArchiveProductButton } from "@/components/shop/ArchiveProductButton";
import { DeleteProductButton } from "@/components/shop/DeleteProductButton";
import { formatPrice } from "@/lib/billing/currency";
import { TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";


export function ProductListContent({ 
    products, 
    isAdminOrEditor, 
    currency,
    pagination
}: { 
    products: any[]; 
    isAdminOrEditor: boolean;
    currency: string;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}) {
    if (!isAdminOrEditor) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <ProductGridItem key={product.id} product={product} />
                    ))}
                </div>
                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <TableContainer>
                <THead>
                    <TR>
                        <TH>Produk</TH>
                        <TH>Harga</TH>
                        <TH align="center">Stok</TH>
                        <TH align="right" className="sticky right-0 z-10 bg-muted/95 backdrop-blur-sm border-l border-border/50 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)]">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {products.length === 0 ? (
                        <TR>
                            <TD colSpan={4} className="py-20">
                                <EmptyState 
                                    icon={<ShoppingCart size={32} />} 
                                    message="Belum ada produk di inventaris." 
                                />
                            </TD>
                        </TR>
                    ) : (
                        products.map((product) => (
                            <TR key={product.id} className={`group/row ${product.isArchived ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                                <TD>
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="w-10 h-10 rounded-md bg-muted/5 flex items-center justify-center text-foreground overflow-hidden border border-border group-hover/row:border-primary/50 transition-all relative shadow-inner">
                                            {product.images && product.images[0] ? (
                                                <Image src={product.images[0]} alt={product.name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover transition-transform duration-700 group-hover/row:scale-110" unoptimized />
                                            ) : (
                                                <ShoppingCart className="opacity-20" size={16} />
                                            )}
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div 
                                                    className="text-[11px] font-black text-foreground tracking-tight uppercase group-hover/row:text-primary transition-colors max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[550px] truncate" 
                                                    title={product.name}
                                                >
                                                    {product.name}
                                                </div>
                                                {product.isArchived && (
                                                    <StatusBadge type="neutral" label="Diarsipkan" className="flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground font-medium mt-1 opacity-60 italic font-mono tracking-tighter">ID: {product.slug}</div>
                                        </div>
                                    </div>
                                </TD>
                                <TD className="text-[11px] font-black text-foreground tracking-tight">
                                    {formatPrice(product.price, currency)}
                                </TD>
                                <TD align="center">
                                    <StatusBadge 
                                        type={(product.stock || 0) > 0 ? "success" : "error"} 
                                        label={(product.stock || 0) > 0 ? `Stok: ${product.stock}` : "Habis"} 
                                    />
                                </TD>
                                <TD align="right" className="sticky right-0 z-10 bg-card group-hover/row:bg-muted/20 transition-colors border-l border-border/50 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="flex justify-end gap-1.5 items-center">
                                        <Link href={`/dashboard/products/${product.id}`} className="p-1.5 bg-muted/20 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-all border border-border hover:border-primary/20" title="Edit Produk">
                                            <Edit size={14} />
                                        </Link>
                                        <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-muted/20 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded-md transition-all border border-border hover:border-blue-500/20" title="Lihat Produk">
                                            <Eye size={14} />
                                        </a>
                                        <div className="p-1">
                                            <ArchiveProductButton
                                                productId={product.id}
                                                productName={product.name}
                                                isArchived={product.isArchived}
                                            />
                                        </div>
                                        <div className="p-1">
                                            <DeleteProductButton
                                                productId={product.id}
                                                productName={product.name}
                                            />
                                        </div>
                                    </div>
                                </TD>
                            </TR>
                        ))
                    )}
                </TBody>
            </TableContainer>

            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
        </div>
    );
}
