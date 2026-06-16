import { getGalleryItems } from "@/modules/page/ui/content-display";
import Image from "next/image";
import { ImageIcon, Maximize2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Gallery",
    description: "Visual glimpses of our publishing process, events, and collection.",
};

export default async function GalleryPage() {
    const items = await getGalleryItems();

    return (
        <div className="min-h-screen bg-background">
            {/* Minimalist Hero */}
            <section className="bg-background border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-16 lg:px-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-card rounded-2xl shadow-sm mb-6">
                            <ImageIcon size={32} className="text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
                            Photo Gallery
                        </h1>
                        <p className="max-w-xl text-lg text-muted-foreground">
                            A visual collection of moments, publications, and events from Unived Press.
                        </p>
                    </div>
                </div>
            </section>

            {/* Gallery Grid */}
            <section className="max-w-7xl mx-auto px-6 py-12 lg:px-8">
                {items.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Our gallery is currently being curated. Check back soon.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="relative group overflow-hidden rounded-2xl bg-muted break-inside-avoid shadow-sm hover:shadow-xl transition-shadow duration-300"
                            >
                                <Image
                                    src={item.url}
                                    alt={item.title || "Gallery Image"}
                                    width={800}
                                    height={1200} // Heights vary in columns layout
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    {item.title && (
                                        <h3 className="text-white font-bold text-lg mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            {item.title}
                                        </h3>
                                    )}
                                    {item.description && (
                                        <p className="text-white/80 text-sm line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/40 transition-colors">
                                        <Maximize2 size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
