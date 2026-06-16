
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) return { rules: [], sitemap: '' };

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/dashboard/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
