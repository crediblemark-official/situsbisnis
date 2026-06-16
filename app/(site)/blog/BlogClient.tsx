"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { User as UserIcon, Inbox } from "lucide-react";

interface Post {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    excerpt: string | null;
    content: any;
    createdAt: Date | string;
    author?: {
        name: string | null;
        image: string | null;
    } | null;
    metaData?: {
        key: string;
        value: string | null;
    }[];
    terms?: {
        name: string;
        slug: string;
        taxonomy?: {
            name: string;
            slug: string;
        } | null;
    }[];
}



// Safe Date Formatter to avoid RangeError & Hydration issues
const formatDate = (date: any, formatType: "long" | "short" = "long") => {
    if (!date) return "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        if (formatType === "short") {
            return d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
        }
        return d.toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return "";
    }
};

export default function BlogClient({ 
    posts,
    siteName,
    description
}: { 
    posts: Post[];
    siteName?: string | null;
    description?: string | null;
}) {
    const [activeCategory, setActiveCategory] = useState("Semua");
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(6);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Helper to get category name for a post
    const getPostCategory = (post: Post) => {
        const categoryMeta = post.metaData?.find((m) => m.key === "category");
        if (categoryMeta && categoryMeta.value) return categoryMeta.value;

        const cat = post.terms?.find((t) => t.taxonomy?.slug === "category" || t.taxonomy?.name?.toLowerCase() === "category");
        return cat ? cat.name : "Umum";
    };

    // 1. Get all unique categories dynamically
    const categories = useMemo(() => {
        const cats = new Set<string>();
        posts.forEach((post) => {
            cats.add(getPostCategory(post));
        });
        return ["Semua", ...Array.from(cats)];
    }, [posts]);

    // 2. Filter posts by active category and search query real-time
    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchesCategory = activeCategory === "Semua" || getPostCategory(post) === activeCategory;
            
            const title = post.title?.toLowerCase() || "";
            const excerpt = post.excerpt?.toLowerCase() || "";
            
            let contentText = "";
            if (typeof post.content === "string") {
                contentText = post.content.toLowerCase();
            } else if (post.content && typeof post.content === "object") {
                contentText = JSON.stringify(post.content).toLowerCase();
            }
            
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                title.includes(query) || 
                excerpt.includes(query) || 
                contentText.includes(query);
                
            return matchesCategory && matchesSearch;
        });
    }, [posts, activeCategory, searchQuery]);

    // Featured Post is the latest overall or the latest in the filtered list
    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    // Visible posts in grid
    const visiblePosts = otherPosts.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 6);
    };

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        setVisibleCount(6); // reset loaded count on category change
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(6); // reset loaded count on search change
    };

    return (
        <div className="space-y-12">
            
            {/* GRADIENT BANNER & SEARCH BAR SECTION */}
            <div className="relative mb-16">
                {/* Purple-pink gradient banner */}
                <div className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl py-14 sm:py-16 px-6 text-center text-white shadow-xl relative overflow-hidden">
                    {/* Subtle decorative background circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 relative z-10">Blog</h1>
                    <p className="text-sm sm:text-base text-white/90 font-medium max-w-xl mx-auto relative z-10">
                        {description || "Temukan wawasan dan cerita menarik terbaru dari kami."}
                    </p>
                </div>

                {/* Overlapping Pill Search Bar */}
                <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 w-full max-w-lg px-6 z-20">
                    <div className="relative flex items-center bg-white dark:bg-card rounded-full shadow-xl border border-gray-100 dark:border-border/50 p-1.5 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all duration-300">
                        <input
                            type="text"
                            placeholder="Cari artikel..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-6 pr-24 py-2 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/50"
                        />
                        <button
                            type="button"
                            onClick={() => handleSearchChange(searchQuery)}
                            className="absolute right-1.5 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-full transition-all active:scale-95 shadow-md shadow-red-600/20"
                        >
                            Cari
                        </button>
                    </div>
                </div>
            </div>

            {/* CATEGORIES HORIZONTAL SCROLL LIST */}
            <div className="pt-6 pb-4">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                    <style jsx>{`
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat;
                        const isAll = cat === "Semua" || cat === "All";
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoryChange(cat)}
                                className={`
                                    px-5 py-2.5 text-xs font-bold rounded-full transition-all shrink-0 outline-none
                                     ${isActive 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]" 
                                        : "bg-gray-100 dark:bg-card border border-transparent dark:border-border/50 text-gray-700 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/10 hover:text-foreground"
                                    }
                                `}
                            >
                                {isAll ? "All" : cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {searchQuery && (
                <div className="text-xs text-center text-muted-foreground animate-in fade-in duration-300">
                    Menampilkan <span className="font-bold text-foreground">{filteredPosts.length}</span> artikel untuk pencarian &ldquo;<span className="font-bold text-foreground">{searchQuery}</span>&rdquo;
                </div>
            )}

            {/* EMPTY STATE */}
            {filteredPosts.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border/50 rounded-2xl shadow-md max-w-lg mx-auto w-full">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Inbox size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">Artikel Tidak Ditemukan</h3>
                    <p className="text-muted-foreground text-xs max-w-sm mx-auto px-6">
                        {searchQuery 
                            ? `Tidak ada artikel yang cocok dengan pencarian "${searchQuery}".`
                            : `Belum ada artikel yang diterbitkan untuk kategori "${activeCategory}".`
                        }
                    </p>
                </div>
            ) : (
                <>
                    {/* FEATURED POST (Hero Card) */}
                    {featuredPost && (
                        <section className="animate-in fade-in duration-500 pt-4">
                            <article className="group grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/50 overflow-hidden shadow-sm hover:shadow-xl hover:border-gray-200 dark:hover:border-border transition-all duration-500 p-0 gap-0 items-stretch">
                                {/* Image side */}
                                <div className="relative aspect-[4/3] lg:aspect-auto w-full min-h-[300px] lg:h-full overflow-hidden bg-muted">
                                    {featuredPost.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={featuredPost.imageUrl}
                                            alt={featuredPost.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-indigo-600/5 flex items-center justify-center">
                                            <span className="text-muted-foreground/20">
                                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content side */}
                                <div className="flex flex-col justify-center text-left p-6 sm:p-8 lg:py-10 lg:pl-8 lg:pr-12 space-y-4 items-start w-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        {getPostCategory(featuredPost)} • Artikel Unggulan
                                    </span>
                                    
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-foreground tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-snug">
                                        <Link href={`/blog/${featuredPost.slug}`}>
                                            {featuredPost.title}
                                        </Link>
                                    </h2>

                                    <p className="text-gray-500 dark:text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-3">
                                        {featuredPost.excerpt || "Baca selengkapnya mengenai topik ini di artikel lengkap kami."}
                                    </p>

                                    {/* Author & Date Footer */}
                                    <div className="pt-4 flex items-center gap-3">
                                        {featuredPost.author?.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={featuredPost.author.image}
                                                alt={featuredPost.author.name || "Author"}
                                                className="w-10 h-10 rounded-full border border-gray-100 dark:border-border/50 object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20">
                                                <UserIcon size={18} />
                                            </div>
                                        )}
                                        <div className="text-[11px] sm:text-xs">
                                            <p className="font-extrabold text-gray-900 dark:text-foreground leading-none">{featuredPost.author?.name || siteName || "Admin"}</p>
                                            {isMounted && (
                                                <p className="text-gray-400 dark:text-muted-foreground/60 mt-1">{formatDate(featuredPost.createdAt)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </section>
                    )}

                    {/* POSTS GRID WITH DYNAMIC REVEAL & LOAD MORE */}
                    {otherPosts.length > 0 && (
                        <section className="space-y-12 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {visiblePosts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="group flex flex-col bg-transparent transition-all duration-300 animate-in fade-in duration-500"
                                    >
                                        <div className="aspect-[16/10] relative overflow-hidden bg-muted rounded-2xl shadow-md group-hover:shadow-xl transition-all duration-300">
                                            {post.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={post.imageUrl}
                                                    alt={post.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-indigo-500/5 flex items-center justify-center">
                                                    <span className="text-muted-foreground/15">
                                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                    </span>
                                                </div>
                                            )}
                                            {/* Small category badge on top-left of image */}
                                            <span className="absolute top-3 left-3 inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-black/75 backdrop-blur-md text-white border border-white/10 rounded-md">
                                                {getPostCategory(post)}
                                            </span>
                                        </div>

                                        <div className="pt-4 px-1 pb-4 flex-1 flex flex-col justify-between space-y-3 text-center">
                                            <div className="space-y-2">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-foreground leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                                </h3>
                                            </div>

                                            {isMounted && (
                                                <div className="text-[10px] text-gray-400 dark:text-muted-foreground font-bold tracking-tight">
                                                    <time>{formatDate(post.createdAt, "short")}</time>
                                                    <span className="mx-1.5 text-gray-300 dark:text-muted-foreground/30">•</span>
                                                    <span>{post.author?.name || siteName || "Admin"}</span>
                                                    <span className="mx-1.5 text-gray-300 dark:text-muted-foreground/30">•</span>
                                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{getPostCategory(post)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* LOAD MORE BUTTON */}
                            {otherPosts.length > visibleCount && (
                                <div className="text-center pt-8">
                                    <button
                                        type="button"
                                        onClick={handleLoadMore}
                                        className="group inline-flex items-center justify-center px-8 py-3 bg-white hover:bg-gray-50 border border-red-500 dark:border-red-500/50 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
                                    >
                                        Muat Lebih Banyak
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
