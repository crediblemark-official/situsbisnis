import { db } from "@/modules/shared/core/db";

export interface BackupData {
    metadata: {
        version: string;
        exportedAt: string;
        generator: string;
    };
    data: {
        plans: any[];
        users: any[];
        accounts: any[];
        sessions: any[];
        verificationTokens: any[];
        sites: any[];
        siteSettings: any[];
        siteStatistics: any[];
        paymentSettings: any[];
        subscriptions: any[];
        coupons: any[];
        paymentTransactions: any[];
        commissions: any[];
        withdrawals: any[];
        contactSubmissions: any[];
        galleryItems: any[];
        portfolioItems: any[];
        testimonials: any[];
        mediaFolders: any[];
        mediaItems: any[];
        credBuildPages: any[];
        posts: any[];
        products: any[];
        orders: any[];
        orderItems: any[];
        taxonomies: any[];
        terms: any[];
        menus: any[];
        menuItems: any[];
        metaData: any[];
        seoMetas: any[];
        platformSettings: any[];
    };
}

/**
 * Exports all database records into a single structured JSON object
 */
export async function exportBackupData(): Promise<BackupData> {
    try {
        const [
            plans,
            users,
            accounts,
            sessions,
            verificationTokens,
            siteSettings,
            siteStatistics,
            paymentSettings,
            subscriptions,
            coupons,
            paymentTransactions,
            commissions,
            withdrawals,
            contactSubmissions,
            galleryItems,
            portfolioItems,
            testimonials,
            mediaFolders,
            mediaItems,
            credBuildPages,
            posts,
            products,
            orders,
            orderItems,
            taxonomies,
            menus,
            menuItems,
            metaData,
            seoMetas,
            platformSettings
        ] = await Promise.all([
            db.plan.findMany(),
            db.user.findMany(),
            db.account.findMany(),
            db.session.findMany(),
            db.verificationToken.findMany(),
            db.siteSettings.findMany(),
            db.siteStatistics.findMany(),
            db.paymentSettings.findMany(),
            db.subscription.findMany(),
            db.coupon.findMany(),
            db.paymentTransaction.findMany(),
            db.commission.findMany(),
            db.withdrawal.findMany(),
            db.contactSubmission.findMany(),
            db.galleryItem.findMany(),
            db.portfolioItem.findMany(),
            db.testimonial.findMany(),
            db.mediaFolder.findMany(),
            db.mediaItem.findMany(),
            db.credBuildPage.findMany(),
            db.post.findMany(),
            db.product.findMany(),
            db.order.findMany(),
            db.orderItem.findMany(),
            db.taxonomy.findMany(),
            db.menu.findMany(),
            db.menuItem.findMany(),
            db.metaData.findMany(),
            db.seoMeta.findMany(),
            db.platformSettings.findMany()
        ]);

        // Fetch sites
        const sites = await db.site.findMany();
        // Fetch all siteUsers mappings
        const allSiteUsers = await db.siteUser.findMany({
            select: { siteId: true, userId: true }
        });
        const formattedSites = sites.map(site => {
            const linkedUsers = allSiteUsers.filter(su => su.siteId === site.id);
            return {
                ...site,
                userIds: linkedUsers.map(u => u.userId)
            };
        });

        // Fetch terms with their implicit many-to-many pages, posts, and products
        const terms = await db.term.findMany({
            include: {
                pages: { select: { id: true } },
                posts: { select: { id: true } },
                products: { select: { id: true } }
            }
        });
        const formattedTerms = terms.map(term => {
            const { pages, posts: termPosts, products: termProducts, ...termFields } = term;
            return {
                ...termFields,
                pageIds: pages.map(p => p.id),
                postIds: termPosts.map(p => p.id),
                productIds: termProducts.map(p => p.id)
            };
        });

        return {
            metadata: {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                generator: "SitusBisnis Backup Engine"
            },
            data: {
                plans,
                users,
                accounts,
                sessions,
                verificationTokens,
                sites: formattedSites,
                siteSettings,
                siteStatistics,
                paymentSettings,
                subscriptions,
                coupons,
                paymentTransactions,
                commissions,
                withdrawals,
                contactSubmissions,
                galleryItems,
                portfolioItems,
                testimonials,
                mediaFolders,
                mediaItems,
                credBuildPages,
                posts,
                products,
                orders,
                orderItems,
                taxonomies,
                terms: formattedTerms,
                menus,
                menuItems,
                metaData,
                seoMetas,
                platformSettings
            }
        };
    } catch (error) {
        console.error("Export Backup Error:", error);
        throw new Error("Failed to export database backup data: " + (error as Error).message);
    }
}
