import { db } from "@/lib/core/db";

/**
 * Provisions a new site for a user with default settings, menus, and pages.
 * Used during the onboarding flow.
 */
export async function provisionSite(userId: string, siteName: string, subdomain: string) {
    // 1. Verify User exists outside transaction to keep it short
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.error(`[PROVISIONING] User ${userId} not found in database`);
        throw new Error("User not found. Please log out and log in again.");
    }

    return await db.$transaction(async (tx) => {
        // 2. Create the Site
        const site = await tx.site.create({
            data: {
                name: siteName,
                subdomain: subdomain.toLowerCase().trim()
            }
        });

        // 2b. Associate User to Site via SiteUser
        await tx.siteUser.create({
            data: {
                siteId: site.id,
                userId: userId,
                role: "owner"
            }
        });

        // 3. Assign default "Pro" Plan as Trial
        const defaultPlan = await tx.plan.findUnique({
            where: { name: "Pro" }
        });

        if (defaultPlan) {
            const trialDays = defaultPlan.trialDays || 14;
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

            await tx.subscription.create({
                data: {
                    siteId: site.id,
                    planId: defaultPlan.id,
                    status: "active",
                    trialEndsAt: trialEndsAt
                }
            });
        }

        // 4. Get Platform Name for defaults
        const adminSite = await tx.site.findUnique({
            where: { subdomain: "admin" },
            include: { siteSettings: true }
        });
        const platformName = adminSite?.siteSettings?.siteName || "SitusBisnis";

        // 5. Create default SiteSettings
        await tx.siteSettings.create({
            data: {
                siteId: site.id,
                siteName: siteName,
                description: `Welcome to ${siteName}. This site was created with ${platformName}.`,
                activeTheme: "default",
                brandColor: "#0369a1",
                headerBackgroundColor: "#0369a1",
                footerBackgroundColor: "#0369a1",
                headerTextColor: "#ffffff",
                footerCopyright: `© ${new Date().getFullYear()} ${siteName}. Built with ${platformName}.`,
            }
        });

        // 5. Create default Main Menu
        const mainMenu = await tx.menu.create({
            data: {
                siteId: site.id,
                name: "Main Menu",
                slug: "main",
            }
        });

        // 6. Create default menu items
        await tx.menuItem.createMany({
            data: [
                { menuId: mainMenu.id, label: "Home", url: "/", order: 0 },
                { menuId: mainMenu.id, label: "Blog", url: "/blog", order: 1 },
            ]
        });

        // 7. Create default Homepage
        await tx.credBuildPage.create({
            data: {
                siteId: site.id,
                path: "/",
                title: "Home",
                description: `Discover amazing things at ${siteName}`,
                useBuilder: true,
                data: {
                    root: {
                        type: "section",
                        props: {
                            padding: "py-20",
                            backgroundColor: "bg-white"
                        },
                        children: [
                            {
                                type: "container",
                                props: { maxWidth: "max-w-4xl" },
                                children: [
                                    {
                                        type: "heading",
                                        props: {
                                            text: `Welcome to ${siteName}`,
                                            level: "h1",
                                            align: "center",
                                            className: "text-5xl font-extrabold tracking-tight text-gray-900"
                                        }
                                    },
                                    {
                                        type: "text",
                                        props: {
                                            text: "Your professional website is ready. Start by editing this page in the dashboard.",
                                            align: "center",
                                            className: "mt-6 text-xl text-gray-500"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        });

        return site;
    }, {
        maxWait: 5000,
        timeout: 15000,
    });
}
