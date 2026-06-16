import React from "react";
import { db } from "@/lib/core/db";
import TransactionList from "@/components/admin/TransactionList";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
    const rawTransactions = await db.paymentTransaction.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            proofOfPayment: true,
            notes: true,
            createdAt: true,
            addonType: true,
            addonQuantity: true,
            siteId: true,
            plan: { select: { name: true, interval: true } }
        }
    });

    const siteIds = Array.from(new Set(rawTransactions.map(tx => tx.siteId)));
    const sites = await db.site.findMany({
        where: { id: { in: siteIds } },
        select: { id: true, name: true, subdomain: true }
    });
    const siteMap = new Map(sites.map(s => [s.id, s]));

    const transactions = rawTransactions.map(tx => ({
        ...tx,
        site: siteMap.get(tx.siteId) || null
    }));

    const serializedTransactions = JSON.parse(JSON.stringify(transactions));

    return <TransactionList initialTransactions={serializedTransactions} />;
}
