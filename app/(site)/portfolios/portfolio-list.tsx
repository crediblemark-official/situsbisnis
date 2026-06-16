"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { ExternalLink, Tag } from "lucide-react";

type PortfolioItem = {
    id: string;
    title: string;
    category: string;
    imageUrl: string;
    link: string | null;
    description: string | null;
};

const getExcerpt = (content: string | null) => {
    if (!content) return "No description provided.";
    
    // Check if it's JSON (Tiptap format)
    try {
        const json = JSON.parse(content);
        if (json.type === 'doc' && json.content) {
            // Very simple text extraction from Tiptap JSON
            return json.content
                .map((p: any) => p.content ? p.content.map((c: any) => c.text).join('') : '')
                .join(' ')
                .slice(0, 150) + '...';
        }
    } catch (_e) {
        // Not JSON, probably HTML or plain text
    }

    // Strip HTML tags if any
    const stripped = content.replace(/<[^>]*>?/gm, '');
    return stripped.slice(0, 150) + (stripped.length > 150 ? '...' : '');
};

export default function PortfolioList({ initialItems }: { initialItems: PortfolioItem[] }) {
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = useMemo(() => {
        const cats = initialItems.map((item) => item.category);
        return ["All", ...Array.from(new Set(cats))];
    }, [initialItems]);

    const filteredItems = useMemo(() => {
        if (activeCategory === "All") return initialItems;
        return initialItems.filter((item) => item.category === activeCategory);
    }, [initialItems, activeCategory]);

    if (initialItems.length === 0) {
        return (
            <div className="py-20 text-center bg-card rounded-3xl border border-dashed border-border">
                <h3 className="text-xl font-medium text-foreground">No items found</h3>
                <p className="mt-2 text-muted-foreground">Check back later for new portfolio additions.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Filter */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                            activeCategory === cat
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
                                : "bg-card text-muted-foreground border-border hover:border-blue-400 hover:text-blue-600"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="group bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                        {/* Image Container */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                            <div className="absolute top-4 left-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-card/90 text-blue-600 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                                    <Tag size={12} className="mr-1" />
                                    {item.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-3">
                                {getExcerpt(item.description)}
                            </p>
                            {item.link && (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors group/link"
                                >
                                    View Project
                                    <ExternalLink size={16} className="ml-1.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
