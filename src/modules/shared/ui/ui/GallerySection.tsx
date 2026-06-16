import Image from "next/image";
import { ImageIcon, Maximize2 } from "lucide-react";
import { getGalleryItems } from "@/modules/content/services/content-display.service";
import { getProxiedUrl } from "@/lib/media/utils";

export default async function GallerySection({ title, description }: { title?: string, description?: string }) {
    const items = await getGalleryItems();

    if (items.length === 0) return null;

    return (
        <section className="py-12 border-t border-border/50 mt-12 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center text-center mb-10">
                <div className="p-2 bg-primary/5 rounded-xl mb-4">
                    <ImageIcon size={24} className="text-primary" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl mb-2">
                    {title || "Photo Gallery"}
                </h2>
                {description && <p className="max-w-xl text-muted-foreground text-sm uppercase tracking-widest font-bold opacity-60">{description}</p>}
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {items.map((item: any) => (
                    <div
                        key={item.id}
                        className="relative group overflow-hidden rounded-3xl bg-muted break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-500"
                    >
                        <Image
                            src={getProxiedUrl(item.url)}
                            alt={item.title || "Gallery Image"}
                            width={800}
                            height={1200}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                            {item.title && (
                                <h3 className="text-white font-black text-lg mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    {item.title}
                                </h3>
                            )}
                            {item.description && (
                                <p className="text-white/70 text-xs line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                                    {item.description}
                                </p>
                            )}
                            <a 
                                href={getProxiedUrl(item.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label="Buka gambar ukuran penuh"
                            >
                                <Maximize2 size={16} />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
