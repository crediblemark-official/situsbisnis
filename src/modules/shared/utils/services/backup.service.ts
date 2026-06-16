import { db } from "@/lib/core/db";

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

/**
 * Restores database from the backup data, preserving current logged in admin
 */
export async function importBackupData(backupData: BackupData, currentAdminId?: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!backupData || !backupData.data) {
            throw new Error("Invalid backup file: 'data' property is missing.");
        }

        const d = backupData.data;

        // Verify that we have required tables in the backup file
        if (!d.users || !Array.isArray(d.users)) {
            throw new Error("Invalid backup file: 'users' table is missing or corrupted.");
        }

        console.log("Starting restore process. Clearing database...");

        // Fetch current admin's email and phone if possible to resolve conflicts
        const currentAdmin = currentAdminId 
            ? await db.user.findUnique({ where: { id: currentAdminId } }) 
            : null;
        const currentAdminEmail = currentAdmin?.email;
        const currentAdminPhone = currentAdmin?.phone;

        // Populate the mapping of backup User ID -> real User ID in the database
        const userIdMap = new Map<string, string>();
        for (const user of d.users) {
            if (currentAdminId) {
                if (user.id === currentAdminId) {
                    userIdMap.set(user.id, currentAdminId);
                } else if (user.email && currentAdminEmail && user.email.toLowerCase() === currentAdminEmail.toLowerCase()) {
                    userIdMap.set(user.id, currentAdminId);
                } else if (user.phone && currentAdminPhone && user.phone === currentAdminPhone) {
                    userIdMap.set(user.id, currentAdminId);
                } else {
                    userIdMap.set(user.id, user.id);
                }
            } else {
                userIdMap.set(user.id, user.id);
            }
        }

        // 1. Delete in reverse topological order of relations
        await db.metaData.deleteMany();
        await db.seoMeta.deleteMany();
        await db.orderItem.deleteMany();
        await db.order.deleteMany();
        await db.commission.deleteMany();
        await db.withdrawal.deleteMany();
        await db.paymentTransaction.deleteMany();
        await db.subscription.deleteMany();
        await db.coupon.deleteMany();
        await db.platformSettings.deleteMany();
        await db.paymentSettings.deleteMany();
        await db.siteSettings.deleteMany();
        await db.siteStatistics.deleteMany();
        await db.menuItem.deleteMany();
        await db.menu.deleteMany();
        await db.contactSubmission.deleteMany();
        await db.galleryItem.deleteMany();
        await db.portfolioItem.deleteMany();
        await db.testimonial.deleteMany();
        await db.mediaItem.deleteMany();
        await db.mediaFolder.deleteMany();
        await db.term.deleteMany();
        await db.taxonomy.deleteMany();
        await db.post.deleteMany();
        await db.product.deleteMany();
        await db.credBuildPage.deleteMany();
        
        // Deleting sites will clean '_SiteToUser' join entries automatically
        await db.site.deleteMany();

        // Safe User Deletion - Preserve currently active admin user's credentials & sessions
        if (currentAdminId) {
            await db.session.deleteMany({ where: { userId: { not: currentAdminId } } });
            await db.account.deleteMany({ where: { userId: { not: currentAdminId } } });
            await db.user.deleteMany({ where: { id: { not: currentAdminId } } });
        } else {
            await db.session.deleteMany();
            await db.account.deleteMany();
            await db.user.deleteMany();
        }

        await db.plan.deleteMany();
        await db.verificationToken.deleteMany();

        console.log("Database cleared successfully. Inserting backup records (Pass 1)...");

        // 2. Insert Plans
        if (d.plans && d.plans.length > 0) {
            for (const plan of d.plans) {
                await db.plan.create({ data: plan });
            }
        }

        // 3. Insert Users (Pass 1 - referredById null)
        if (d.users && d.users.length > 0) {
            for (const user of d.users) {
                const resolvedId = userIdMap.get(user.id) || user.id;
                const { referredById: _referredById, ...userFields } = user;
                
                const userExists = await db.user.count({ where: { id: resolvedId } });
                if (userExists > 0) {
                    // Update existing active admin instead of recreating to maintain active session
                    await db.user.update({
                        where: { id: resolvedId },
                        data: {
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            image: user.image,
                            password: user.password,
                            role: user.role, // Must remain admin or as backed up
                            referredById: null, // Update in pass 2
                            affiliateBalance: user.affiliateBalance
                        }
                    });
                } else {
                    await db.user.create({
                        data: {
                            ...userFields,
                            id: resolvedId,
                            referredById: null // Update in pass 2
                        }
                    });
                }
            }
        }

        // 4. Accounts
        if (d.accounts && d.accounts.length > 0) {
            for (const acc of d.accounts) {
                const resolvedUserId = userIdMap.get(acc.userId) || acc.userId;
                const mappedAcc = { ...acc, userId: resolvedUserId };
                // Ensure account doesn't already exist for active admin
                const exists = await db.account.count({ where: { id: mappedAcc.id } });
                if (!exists) {
                    await db.account.create({ data: mappedAcc });
                }
            }
        }

        // 5. Sessions
        if (d.sessions && d.sessions.length > 0) {
            for (const ses of d.sessions) {
                const resolvedUserId = userIdMap.get(ses.userId) || ses.userId;
                const mappedSes = { ...ses, userId: resolvedUserId };
                const exists = await db.session.count({ where: { id: mappedSes.id } });
                if (!exists) {
                    await db.session.create({ data: mappedSes });
                }
            }
        }

        // 6. Verification Tokens
        if (d.verificationTokens && d.verificationTokens.length > 0) {
            for (const token of d.verificationTokens) {
                await db.verificationToken.create({ data: token });
            }
        }

        // 7. Sites & Connect userIds to 'siteUsers' link table
        if (d.sites && d.sites.length > 0) {
            for (const site of d.sites) {
                const { userIds, ...siteFields } = site;
                // Create site first
                const createdSite = await db.site.create({
                    data: siteFields
                });

                // Create siteUsers links
                if (userIds && Array.isArray(userIds) && userIds.length > 0) {
                    const mappedUserIds = userIds.map(id => userIdMap.get(id) || id);
                    const existingUsers = await db.user.findMany({
                        where: { id: { in: mappedUserIds } },
                        select: { id: true }
                    });
                    
                    for (const u of existingUsers) {
                        await db.siteUser.create({
                            data: {
                                siteId: createdSite.id,
                                userId: u.id,
                                role: "owner" // Default backup role
                            }
                        });
                    }
                }
            }
        }

        // 8. SiteSettings
        if (d.siteSettings && d.siteSettings.length > 0) {
            for (const ss of d.siteSettings) {
                await db.siteSettings.create({ data: ss });
            }
        }

        // 9. SiteStatistics
        if (d.siteStatistics && d.siteStatistics.length > 0) {
            for (const stat of d.siteStatistics) {
                await db.siteStatistics.create({ data: stat });
            }
        }

        // 10. PaymentSettings
        if (d.paymentSettings && d.paymentSettings.length > 0) {
            for (const ps of d.paymentSettings) {
                await db.paymentSettings.create({ data: ps });
            }
        }

        // 11. Subscriptions
        if (d.subscriptions && d.subscriptions.length > 0) {
            for (const sub of d.subscriptions) {
                await db.subscription.create({ data: sub });
            }
        }

        // 12. Coupons
        if (d.coupons && d.coupons.length > 0) {
            for (const cp of d.coupons) {
                const resolvedAffiliateId = cp.affiliateId ? (userIdMap.get(cp.affiliateId) || cp.affiliateId) : null;
                await db.coupon.create({ 
                    data: {
                        ...cp,
                        affiliateId: resolvedAffiliateId
                    } 
                });
            }
        }

        // 13. Payment Transactions
        if (d.paymentTransactions && d.paymentTransactions.length > 0) {
            for (const pt of d.paymentTransactions) {
                await db.paymentTransaction.create({ data: pt });
            }
        }

        // 14. Commissions
        if (d.commissions && d.commissions.length > 0) {
            for (const comm of d.commissions) {
                const resolvedUserId = userIdMap.get(comm.userId) || comm.userId;
                await db.commission.create({ 
                    data: {
                        ...comm,
                        userId: resolvedUserId
                    } 
                });
            }
        }

        // 15. Withdrawals
        if (d.withdrawals && d.withdrawals.length > 0) {
            for (const wd of d.withdrawals) {
                const resolvedUserId = userIdMap.get(wd.userId) || wd.userId;
                await db.withdrawal.create({ 
                    data: {
                        ...wd,
                        userId: resolvedUserId
                    } 
                });
            }
        }

        // 16. Contact Submissions
        if (d.contactSubmissions && d.contactSubmissions.length > 0) {
            for (const cs of d.contactSubmissions) {
                await db.contactSubmission.create({ data: cs });
            }
        }

        // 17. Gallery Items
        if (d.galleryItems && d.galleryItems.length > 0) {
            for (const gi of d.galleryItems) {
                await db.galleryItem.create({ data: gi });
            }
        }

        // 18. Portfolio Items
        if (d.portfolioItems && d.portfolioItems.length > 0) {
            for (const pi of d.portfolioItems) {
                await db.portfolioItem.create({ data: pi });
            }
        }

        // 19. Testimonials
        if (d.testimonials && d.testimonials.length > 0) {
            for (const tm of d.testimonials) {
                await db.testimonial.create({ data: tm });
            }
        }

        // 20. Media Folders (Pass 1 - parentId null)
        if (d.mediaFolders && d.mediaFolders.length > 0) {
            for (const mf of d.mediaFolders) {
                const { parentId: _parentId, ...mfFields } = mf;
                await db.mediaFolder.create({
                    data: {
                        ...mfFields,
                        parentId: null
                    }
                });
            }
        }

        // 21. Media Items
        if (d.mediaItems && d.mediaItems.length > 0) {
            for (const mi of d.mediaItems) {
                await db.mediaItem.create({ data: mi });
            }
        }

        // 22. Pages
        if (d.credBuildPages && d.credBuildPages.length > 0) {
            for (const page of d.credBuildPages) {
                await db.credBuildPage.create({ data: page });
            }
        }

        // 23. Posts
        if (d.posts && d.posts.length > 0) {
            for (const post of d.posts) {
                const resolvedAuthorId = post.authorId ? (userIdMap.get(post.authorId) || post.authorId) : null;
                await db.post.create({ 
                    data: {
                        ...post,
                        authorId: resolvedAuthorId
                    } 
                });
            }
        }

        // 24. Products
        if (d.products && d.products.length > 0) {
            for (const prod of d.products) {
                await db.product.create({ data: prod });
            }
        }

        // 25. Orders
        if (d.orders && d.orders.length > 0) {
            for (const ord of d.orders) {
                await db.order.create({ data: ord });
            }
        }

        // 26. Order Items
        if (d.orderItems && d.orderItems.length > 0) {
            for (const item of d.orderItems) {
                await db.orderItem.create({ data: item });
            }
        }

        // 27. Taxonomies
        if (d.taxonomies && d.taxonomies.length > 0) {
            for (const tax of d.taxonomies) {
                await db.taxonomy.create({ data: tax });
            }
        }

        // 28. Terms (Pass 1 - parentId null, relational connections ignored)
        if (d.terms && d.terms.length > 0) {
            for (const term of d.terms) {
                const { parentId: _parentId, pageIds: _pageIds, postIds: _postIds, productIds: _productIds, ...termFields } = term;
                await db.term.create({
                    data: {
                        ...termFields,
                        parentId: null
                    }
                });
            }
        }

        // 29. Menus
        if (d.menus && d.menus.length > 0) {
            for (const menu of d.menus) {
                await db.menu.create({ data: menu });
            }
        }

        // 30. Menu Items
        if (d.menuItems && d.menuItems.length > 0) {
            for (const item of d.menuItems) {
                await db.menuItem.create({ data: item });
            }
        }

        // 31. MetaData
        if (d.metaData && d.metaData.length > 0) {
            for (const meta of d.metaData) {
                await db.metaData.create({ data: meta });
            }
        }

        // 32. SeoMeta
        if (d.seoMetas && d.seoMetas.length > 0) {
            for (const seo of d.seoMetas) {
                await db.seoMeta.create({ data: seo });
            }
        }

        // 33. Platform Settings
        if (d.platformSettings && d.platformSettings.length > 0) {
            for (const ps of d.platformSettings) {
                await db.platformSettings.create({ data: ps });
            }
        }

        console.log("Pass 1 insertion complete. Resolving relations and self-references (Pass 2)...");

        // PASS 2: Update Self-References and Many-to-Many Connections
        
        // 2.1 Update User.referredById
        if (d.users && d.users.length > 0) {
            for (const user of d.users) {
                const resolvedUserId = userIdMap.get(user.id) || user.id;
                if (user.referredById) {
                    const resolvedReferredById = userIdMap.get(user.referredById) || user.referredById;
                    // Check if referredById user exists in the database
                    const referrerExists = await db.user.count({ where: { id: resolvedReferredById } });
                    if (referrerExists > 0) {
                        await db.user.update({
                            where: { id: resolvedUserId },
                            data: { referredById: resolvedReferredById }
                        });
                    }
                }
            }
        }

        // 2.2 Update MediaFolder.parentId
        if (d.mediaFolders && d.mediaFolders.length > 0) {
            for (const mf of d.mediaFolders) {
                if (mf.parentId) {
                    const parentExists = await db.mediaFolder.count({ where: { id: mf.parentId } });
                    if (parentExists > 0) {
                        await db.mediaFolder.update({
                            where: { id: mf.id },
                            data: { parentId: mf.parentId }
                        });
                    }
                }
            }
        }

        // 2.3 Update Term.parentId and implicit relations (pageIds, postIds, productIds)
        if (d.terms && d.terms.length > 0) {
            for (const term of d.terms) {
                const { parentId, pageIds, postIds, productIds } = term;
                
                // Verify parent exists
                let parentVal = null;
                if (parentId) {
                    const parentExists = await db.term.count({ where: { id: parentId } });
                    if (parentExists > 0) {
                        parentVal = parentId;
                    }
                }

                // Verify pageIds exist before connecting
                let validPageIds: string[] = [];
                if (pageIds && Array.isArray(pageIds) && pageIds.length > 0) {
                    const existing = await db.credBuildPage.findMany({
                        where: { id: { in: pageIds } },
                        select: { id: true }
                    });
                    validPageIds = existing.map(x => x.id);
                }

                // Verify postIds exist before connecting
                let validPostIds: string[] = [];
                if (postIds && Array.isArray(postIds) && postIds.length > 0) {
                    const existing = await db.post.findMany({
                        where: { id: { in: postIds } },
                        select: { id: true }
                    });
                    validPostIds = existing.map(x => x.id);
                }

                // Verify productIds exist before connecting
                let validProductIds: string[] = [];
                if (productIds && Array.isArray(productIds) && productIds.length > 0) {
                    const existing = await db.product.findMany({
                        where: { id: { in: productIds } },
                        select: { id: true }
                    });
                    validProductIds = existing.map(x => x.id);
                }

                await db.term.update({
                    where: { id: term.id },
                    data: {
                        parentId: parentVal,
                        pages: validPageIds.length > 0 ? {
                            connect: validPageIds.map(id => ({ id }))
                        } : undefined,
                        posts: validPostIds.length > 0 ? {
                            connect: validPostIds.map(id => ({ id }))
                        } : undefined,
                        products: validProductIds.length > 0 ? {
                            connect: validProductIds.map(id => ({ id }))
                        } : undefined
                    }
                });
            }
        }

        console.log("Restore process completed successfully!");
        return { success: true, message: "Database successfully restored from backup." };
    } catch (error) {
        console.error("Import Backup Error:", error);
        return { 
            success: false, 
            message: "Failed to restore backup: " + (error as Error).message 
        };
    }
}
