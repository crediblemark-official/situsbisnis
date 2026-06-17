"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ArrowRight, X, PenTool, FileText, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchGlobalAction } from "@/modules/post/actions/post.actions";

interface SearchResult {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    category: string;
    type?: 'menu' | 'post' | 'page' | 'product';
}

export function GlobalSearch({ navSections }: { navSections: any[] }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // Flatten all nav items for searching
    const allMenus: SearchResult[] = React.useMemo(() => navSections.flatMap(section =>
        section.items.map((item: any) => ({
            id: item.href,
            label: item.label,
            href: item.href,
            icon: item.icon,
            category: section.title || "Menu",
            type: 'menu' as const
        }))
    ), [navSections]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        const handleFocusOut = (event: FocusEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        const container = containerRef.current;
        if (container) {
            container.addEventListener("focusout", handleFocusOut);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (container) {
                container.removeEventListener("focusout", handleFocusOut);
            }
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            const searchTerm = query.toLowerCase();

            // 1. Filter local menus
            const filteredMenus = allMenus.filter(item =>
                item.label.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );

            try {
                // 2. Gunakan Server Action (Posts, Pages, Products)
                const res = await searchGlobalAction(query);
                const dataResults = res.success ? (res.results || []) : [];

                const mappedDataResults = dataResults.map((item: any) => ({
                    ...item,
                    icon: item.type === 'post' ? <PenTool /> :
                        item.type === 'page' ? <FileText /> :
                            <ShoppingBag />
                }));

                setResults([...filteredMenus, ...mappedDataResults].slice(0, 10));
            } catch (e) {
                console.error("Search fetch error:", e);
                setResults(filteredMenus.slice(0, 10));
            } finally {
                setIsLoading(false);
                setSelectedIndex(0);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, allMenus]);

    const handleSelect = (href: string) => {
        router.push(href);
        setIsFocused(false);
        setQuery("");
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
        } else if (e.key === "Enter") {
            if (results.length > 0) {
                handleSelect(results[selectedIndex].href);
            }
        } else if (e.key === "Escape") {
            setIsFocused(false);
        }
    };

    return (
        <div ref={containerRef} className="relative flex-1 max-w-sm group">
            <div className={`relative flex items-center h-7.5 px-2.5 bg-muted/30 border transition-all duration-300 rounded-lg ${
                isFocused ? "border-primary/50 bg-background shadow-sm w-full ring-2 ring-primary/10" : "border-border/50 hover:bg-muted/50 w-full"
            }`}>
                <Search size={12} className={`${isFocused ? "text-primary" : "text-muted-foreground"} transition-colors`} aria-hidden="true" />
                <input
                    type="text"
                    role="combobox"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={onKeyDown}
                    placeholder="Cari menu atau konten..."
                    aria-label="Cari menu atau konten..."
                    aria-autocomplete="list"
                    aria-expanded={isFocused && (query.length > 0 || results.length > 0)}
                    aria-controls={isFocused && results.length > 0 ? "search-results-listbox" : undefined}
                    aria-haspopup="listbox"
                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-medium px-2 text-foreground placeholder:text-muted-foreground/60 placeholder:font-normal"
                />
                {isLoading && (
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-1" />
                )}
                {query && !isLoading && (
                    <button 
                        type="button"
                        onClick={() => setQuery("")} 
                        className="p-0.5 hover:bg-muted rounded text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:outline-none"
                        aria-label="Hapus pencarian"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isFocused && (query || results.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="p-1 space-y-0.5" role="listbox" id="search-results-listbox" aria-label="Hasil pencarian">
                        {results.length > 0 ? (
                            results.map((item, index) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    type="button"
                                    role="option"
                                    aria-selected={index === selectedIndex}
                                    onClick={() => handleSelect(item.href)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`flex items-center justify-between w-full p-1.5 rounded-lg transition-all text-left group/item focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:outline-none ${
                                        index === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded transition-colors ${
                                            index === selectedIndex ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        }`}>
                                            {React.isValidElement(item.icon)
                                                ? React.cloneElement(item.icon as React.ReactElement<any>, { size: 12 })
                                                : item.icon
                                            }
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-semibold tracking-tight leading-none">
                                                {item.label}
                                            </p>
                                            <p className={`text-[9px] font-medium mt-1 ${
                                                index === selectedIndex ? "text-primary/70" : "text-muted-foreground/60"
                                            }`}>
                                                {item.category}
                                            </p>
                                        </div>
                                    </div>
                                    {index === selectedIndex && (
                                        <ArrowRight size={10} className="text-primary animate-in slide-in-from-left-1" />
                                    )}
                                </button>
                            ))
                        ) : query && (
                            <div className="px-3 py-6 text-center">
                                <p className="text-[10px] font-medium text-muted-foreground">
                                    Tidak ditemukan hasil untuk &quot;{query}&quot;
                                </p>
                            </div>
                        )}
                    </div>
                    {results.length > 0 && (
                        <div className="px-3 py-2 bg-muted/20 border-t border-border flex justify-between">
                            <span className="text-[9px] font-medium text-muted-foreground/50">
                                Enter untuk buka
                            </span>
                            <span className="text-[9px] font-medium text-muted-foreground/50">
                                Esc untuk batal
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
