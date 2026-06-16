import React from "react";
import { db } from "@/lib/core/db";
import UserList from "./UserList";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
    const users = await db.user.findMany({
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            referralCode: true,
            _count: {
                select: { referrals: true }
            }
        }
    });

    return <UserList initialUsers={users} />;
}
