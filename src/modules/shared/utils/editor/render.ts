import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { getProxiedUrl } from '@/lib/media/utils';

function sanitizeHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/on\w+='[^']*'/gi, "")
        .replace(/on\w+=\S+/gi, "")
        .replace(/href=["']javascript:/gi, 'href="#"')
        .replace(/src=["']javascript:/gi, 'src="#"');
}

/**
 * Converts Tiptap JSON content to static HTML for Server-Side Rendering.
 * This is crucial for performance (LCP/SEO).
 */
export function renderTiptapToHTML(content: any): string {
    if (!content) return "";
    
    let parsedContent;
    if (typeof content === "object") {
        parsedContent = content;
    } else {
        const contentStr = String(content);
        try {
            // Try parsing as JSON first
            parsedContent = JSON.parse(contentStr);
        } catch {
            // If not JSON, it's already HTML (legacy) — sanitize before returning
            return sanitizeHtml(contentStr);
        }
    }

    // Convert JSON to HTML using the same extensions as the client
    try {
        let html = generateHTML(parsedContent, [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full my-4 shadow-sm',
                }
            }),
        ]);

        // Optimization 1: Proxy all images and apply compression
        // This ensures editor-uploaded images are also optimized
        html = html.replace(/<img [^>]*src="([^"]+)"/g, (match, src) => {
            if (src.startsWith('data:')) return match;
            const proxied = getProxiedUrl(src, { q: 80, w: 1000 });
            return match.replace(src, proxied);
        });

        // Optimization 2: Mark the first image as high priority for LCP
        if (html.includes('<img')) {
            html = html.replace('<img', '<img loading="eager" fetchpriority="high" decoding="sync"');
        }

        return html;
    } catch (error) {
        console.error("[TIPTAP_RENDER_ERROR]", error);
        return typeof content === "object" ? JSON.stringify(content) : sanitizeHtml(String(content));
    }
}

/**
 * Extract plain text from Tiptap JSON or HTML content.
 */
export function getPlainTextFromTiptap(content: any): string {
    if (!content) return "";
    
    const extractText = (node: any): string => {
        if (!node) return "";
        if (node.type === 'text' && typeof node.text === 'string') {
            return node.text;
        }
        if (Array.isArray(node.content)) {
            return node.content.map((child: any) => extractText(child)).join(" ");
        }
        return "";
    };

    if (typeof content === "object") {
        return extractText(content).replace(/\s+/g, ' ').trim();
    }

    const contentStr = String(content);
    let parsedContent;
    try {
        parsedContent = JSON.parse(contentStr);
    } catch {
        // If not JSON, it is already HTML or plain text, strip HTML tags
        return contentStr.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return extractText(parsedContent).replace(/\s+/g, ' ').trim();
}

/**
 * Generate a smart auto-excerpt of the given maxLength (default 160 characters).
 */
export function generateAutoExcerpt(content: string, maxLength = 160): string {
    const plainText = getPlainTextFromTiptap(content);
    if (!plainText) return "";
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength - 3) + "...";
}

