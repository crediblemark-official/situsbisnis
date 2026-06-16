"use client";

import React from "react";
import { TableContainer, THead, TBody, TR, TH, TD } from "./Table";

export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div 
            aria-hidden="true"
            className={`bg-muted/10 rounded animate-shimmer ${className}`} 
        />
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <TableContainer>
            <THead>
                <TR>
                    {Array.from({ length: cols }).map((_, i) => (
                        <TH key={i}><Skeleton className="h-2 w-16" /></TH>
                    ))}
                </TR>
            </THead>
            <TBody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TR key={i}>
                        {Array.from({ length: cols }).map((_, j) => (
                            <TD key={j}><Skeleton className="h-3 w-full max-w-[120px]" /></TD>
                        ))}
                    </TR>
                ))}
            </TBody>
        </TableContainer>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-card rounded border border-border overflow-hidden p-3 space-y-3">
            <Skeleton className="aspect-square w-full rounded" />
            <div className="space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
            </div>
        </div>
    );
}
