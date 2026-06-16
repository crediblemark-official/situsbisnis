"use client";

import React from "react";
import { Search } from "lucide-react";

export function SearchInput({ 
    value, 
    onChange, 
    placeholder = "Search..." 
}: { 
    value: string; 
    onChange: (_val: string) => void; 
    placeholder?: string;
}) {
    return (
        <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} aria-hidden="true" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={placeholder}
                className="w-full pl-9 pr-4 py-1.5 bg-muted/10 border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium"
            />
        </div>
    );
}
