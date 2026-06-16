import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const userSites = await db.siteUser.findMany({
        where: { userId: session.user.id },
        select: { siteId: true }
    });
    const sitesCount = userSites.length;
    const siteIds = userSites.map(s => s.siteId);

    const activeSubscriptions = await db.subscription.findMany({
        where: { siteId: { in: siteIds }, status: "active" },
        select: {
            addonSlots: true,
            plan: {
                select: {
                    maxSites: true
                }
            }
        }
    });
    
    const maxSitesAllowed = activeSubscriptions.length > 0 
        ? Math.max(...activeSubscriptions.map(s => (s.plan?.maxSites || 1) + (s.addonSlots || 0)))
        : 1;

    // If limit reached, redirect to billing (unless they have 0 sites, then they MUST onboarding)
    if (sitesCount > 0 && maxSitesAllowed !== -1 && sitesCount >= maxSitesAllowed) {
        redirect("/dashboard/billing");
    }

    return <>{children}</>;
}
