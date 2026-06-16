import React from "react";
import { db } from "@/lib/core/db";
import WithdrawalList from "@/components/admin/WithdrawalList";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
    const withdrawals = await db.withdrawal.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { name: true, email: true } }
        }
    });

    const serialized = JSON.parse(JSON.stringify(withdrawals));

    return <WithdrawalList initialWithdrawals={serialized} />;
}
