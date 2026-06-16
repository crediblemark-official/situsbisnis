import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPost } from "@/lib/services/content.service";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Script from "next/script";

import TiptapRenderer from "@/components/editor/TiptapRenderer";
import { generateAutoExcerpt } from "@/lib/editor/render";
import ShareButtons from "@/components/blog/ShareButtons";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        return {
            title: "Post Not Found",
        };
    }

    const seoDescription = post.excerpt || (post.content ? generateAutoExcerpt(post.content as string) : `Read ${post.title}`);
    const keywordsMeta = (post as any).metaData?.find((m: any) => m.key === "keywords");
    const keywords = keywordsMeta?.value || undefined;

    const noIndexMeta = (post as any).metaData?.find((m: any) => m.key === "noindex");
    const robots = noIndexMeta?.value === "true" ? { index: false, follow: true } : undefined;

    return {
        title: post.title,
        description: seoDescription,
        keywords,
        robots,
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post || !post.published) {
        // Optionally allow authors to preview drafts if logged in (skipped for MVP)
        return notFound();
    }

    // Content rendering is now handled by TiptapRenderer which supports both JSON and legacy HTML



    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "image": post.imageUrl ? [post.imageUrl] : undefined,
        "datePublished": post.createdAt,
        "dateModified": post.updatedAt,
        "author": {
            "@type": "Person",
            "name": post.authorName || "Admin"
        }
    };

    return (
        <div className="min-h-screen bg-background pb-16 sm:pb-24">
            <Script
                id="ld-json-blog"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
                    <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <li className="flex items-center">
                            <Link
                                href="/"
                                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Beranda
                            </Link>
                        </li>
                        <li className="flex items-center gap-2">
                            <ChevronRight size={12} className="text-slate-350 dark:text-slate-600 shrink-0" />
                            <Link
                                href="/blog"
                                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Blog
                            </Link>
                        </li>
                        <li className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium max-w-[200px] sm:max-w-[300px] truncate" aria-current="page">
                            <ChevronRight size={12} className="text-slate-350 dark:text-slate-600 shrink-0" />
                            <span className="truncate">{post.title}</span>
                        </li>
                    </ol>
                </nav>

                <header className="mb-8">
                    {post.imageUrl && (
                        <div className="w-screen max-w-[100vw] relative left-1/2 right-1/2 -translate-x-1/2 h-48 sm:h-72 md:h-96 mb-6 overflow-hidden">
                            <Image
                                src={post.imageUrl}
                                alt={post.title}
                                fill
                                sizes="100vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-600 dark:text-slate-300 uppercase shrink-0">
                                {post.authorName ? post.authorName[0] : "A"}
                            </div>
                            <span>{post.authorName || "Admin"}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700 shrink-0" />
                            <span>{new Date(post.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            {post.excerpt && (
                                <>
                                    <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700 shrink-0" />
                                    <span className="w-full sm:w-auto text-slate-400 dark:text-slate-500 italic font-normal line-clamp-1 mt-0.5 sm:mt-0">
                                        &ldquo;{post.excerpt}&rdquo;
                                    </span>
                                </>
                            )}
                        </div>
                        <ShareButtons title={post.title} />
                    </div>
                </header>

                <article className="prose prose-slate dark:prose-invert prose-xl sm:prose-2xl max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-sky-600 dark:prose-a:text-sky-400 dark:prose-headings:text-white prose-p:leading-relaxed text-black dark:text-slate-100 prose-img:rounded-xl">
                    <TiptapRenderer content={post.content} />
                </article>
            </div>
        </div>
    );
}
