import React from "react";
import { db } from "@/lib/core/db";
import { Users, Globe, CreditCard, TrendingUp, Activity, ArrowUpRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { SubscriptionClient } from "@/modules/subscription";


async function getStats() {
    const [totalUsers, totalSites, activeSubscriptions, totalPosts] = await Promise.all([
        db.user.count(),
        db.site.count(),
        db.subscription.count({ where: { status: "active" } }),
        db.post.count()
    ]);

    return {
        totalUsers,
        totalSites,
        activeSubscriptions,
        totalPosts
    };
}

async function getSystemActivities() {
    try {
        const [sites, subscriptions, transactions, users] = await Promise.all([
            db.site.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    createdAt: true
                }
            }).then(async (rawSites) => {
                const { IdentityClient } = await import("@/modules/auth");
                return Promise.all(rawSites.map(async (site) => {
                    const owner = await IdentityClient.getSiteOwner(site.id);
                    return {
                        ...site,
                        users: owner ? [{ name: owner.name, email: owner.email }] : []
                    };
                }));
            }),
            db.subscription.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    createdAt: true,
                    plan: { select: { name: true } },
                    siteId: true
                }
            }),
            db.paymentTransaction.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    plan: { select: { name: true } },
                    siteId: true
                }
            }),
            db.user.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true
                }
            })
        ]);

        const referralSiteIds = Array.from(new Set([
            ...subscriptions.map(s => s.siteId),
            ...transactions.map(t => t.siteId)
        ]));
        
        const referencedSites = await db.site.findMany({
            where: { id: { in: referralSiteIds } },
            select: { id: true, name: true }
        });
        
        const refSiteMap = new Map(referencedSites.map(s => [s.id, s]));

        const activities: {
            id: string;
            type: "site_created" | "subscription_created" | "transaction_created" | "user_created";
            title: string;
            description: string;
            time: Date;
        }[] = [];

        sites.forEach(site => {
            activities.push({
                id: `site-${site.id}`,
                type: "site_created",
                title: "Situs Baru",
                description: `Situs "${site.name}" (${site.subdomain}) dibuat oleh "${site.users[0]?.name || "Pengguna"}"`,
                time: site.createdAt
            });
        });

        subscriptions.forEach(sub => {
            const siteName = refSiteMap.get(sub.siteId)?.name || "Situs";
            activities.push({
                id: `sub-${sub.id}`,
                type: "subscription_created",
                title: "Langganan Baru",
                description: `Situs "${siteName}" mengaktifkan paket "${sub.plan.name}"`,
                time: sub.createdAt
            });
        });

        transactions.forEach(tx => {
            const siteName = refSiteMap.get(tx.siteId)?.name || "Situs";
            activities.push({
                id: `tx-${tx.id}`,
                type: "transaction_created",
                title: "Transaksi Baru",
                description: `Pembayaran Rp ${Number(tx.amount).toLocaleString("id-ID")} untuk "${siteName}" (${tx.status === "approved" ? "Disetujui" : tx.status === "rejected" ? "Ditolak" : "Pending"})`,
                time: tx.createdAt
            });
        });

        users.forEach(user => {
            activities.push({
                id: `user-${user.id}`,
                type: "user_created",
                title: "Registrasi Baru",
                description: `Pengguna "${user.name || user.email || "Tanpa Nama"}" mendaftar`,
                time: user.createdAt
            });
        });

        // Sort by time descending and take top 5
        return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
    } catch (error) {
        console.error("Failed to fetch system activities:", error);
        return [];
    }
}

function formatRelativeTime(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Kemarin";
    return `${diffInDays} hari yang lalu`;
}

export default async function AdminDashboardPage() {
    const [stats, recentActivities] = await Promise.all([
        getStats(),
        getSystemActivities()
    ]);

    const rawRecentSites = await db.site.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            subdomain: true,
            createdAt: true
        }
    });

    const { IdentityClient } = await import("@/modules/auth");
    const recentSites = await Promise.all(rawRecentSites.map(async (site) => {
        const owner = await IdentityClient.getSiteOwner(site.id);
        return {
            ...site,
            users: owner ? [{ name: owner.name, email: owner.email }] : []
        };
    }));

    const recentSiteIds = recentSites.map(site => site.id);
    const activePlans = await SubscriptionClient.getActivePlanNamesForSites(recentSiteIds);

    const statCards = [
        { label: "Total Pengguna", value: stats.totalUsers, icon: <Users className="text-blue-500" />, trend: "+12%" },
        { label: "Website Aktif", value: stats.totalSites, icon: <Globe className="text-emerald-500" />, trend: "+5%" },
        { label: "Langganan Aktif", value: stats.activeSubscriptions, icon: <CreditCard className="text-purple-500" />, trend: "+8%" },
        { label: "Total Artikel", value: stats.totalPosts, icon: <Activity className="text-amber-500" />, trend: "+24%" },
    ];

    const iconMap = {
        site_created: <Globe size={14} className="text-emerald-500" />,
        subscription_created: <CreditCard size={14} className="text-purple-500" />,
        transaction_created: <Activity size={14} className="text-amber-500" />,
        user_created: <Users size={14} className="text-blue-500" />
    };

    const bgMap = {
        site_created: "bg-emerald-500/10 hover:bg-emerald-500/20",
        subscription_created: "bg-purple-500/10 hover:bg-purple-500/20",
        transaction_created: "bg-amber-500/10 hover:bg-amber-500/20",
        user_created: "bg-blue-500/10 hover:bg-blue-500/20"
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6 text-foreground">
            <PageHeader 
                title="Ikhtisar Sistem" 
                subtitle="Metrik pertumbuhan, kesehatan platform, dan pemantauan infrastruktur global." 
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            {React.cloneElement(card.icon as any, { size: 100 })}
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-background rounded-lg border border-border">
                                {card.icon}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <TrendingUp size={10} className="mr-1" /> {card.trend}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-foreground mb-1">{card.value}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Sites Table */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Website Terbaru</h3>
                        <Link href="/admin/sites" className="text-[10px] font-bold text-primary uppercase hover:underline">Lihat Semua</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <THead>
                                <TR>
                                    <TH>Nama Website</TH>
                                    <TH>Pemilik</TH>
                                    <TH>Paket</TH>
                                    <TH align="right">Aksi</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {recentSites.map((site) => (
                                    <TR key={site.id}>
                                        <TD>
                                            <p className="text-xs font-bold text-foreground">{site.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{site.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"}</p>
                                        </TD>
                                        <TD>
                                            <p className="text-xs font-medium text-foreground">{site.users[0]?.name || "Tanpa Pemilik"}</p>
                                            <p className="text-[10px] text-muted-foreground">{site.users[0]?.email || "Tidak Tersedia"}</p>
                                        </TD>
                                        <TD>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                                {activePlans[site.id] || "Uji Coba"}
                                            </span>
                                        </TD>
                                        <TD align="right">
                                            <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-all">
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </TD>
                                    </TR>
                                ))}
                            </TBody>
                        </table>
                    </div>
                </div>

                {/* System Activity */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-border bg-muted/20">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aktivitas Sistem</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className="flex gap-4 group">
                                    <div className={`w-8 h-8 rounded-full ${bgMap[activity.type] || "bg-muted"} flex items-center justify-center shrink-0 transition-colors`}>
                                        {iconMap[activity.type] || <Clock size={14} className="text-muted-foreground" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] leading-tight font-medium text-foreground">
                                            <span className="font-bold">{activity.title}</span> - {activity.description}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{formatRelativeTime(activity.time)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                                <Clock size={24} className="text-muted-foreground animate-pulse" />
                                <p className="text-xs text-muted-foreground font-medium">Belum ada aktivitas tercatat.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
