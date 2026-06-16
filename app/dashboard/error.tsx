"use client";

import React from "react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-red-500 tracking-tight">Dashboard Module Error</h2>
                <p className="text-muted-foreground text-xs mt-2 max-w-sm mx-auto">
                    There was a problem loading this part of the dashboard. This might be due to a temporary network issue.
                </p>
                <div className="mt-4 p-3 bg-muted/10 border border-border rounded-lg text-[10px] font-mono text-muted-foreground overflow-auto max-w-full">
                    {error.message}
                </div>
            </div>
            <button 
                onClick={reset} 
                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
            >
                Reload Module
            </button>
        </div>
    );
}
