import React from "react";
import { db } from "@/lib/core/db";
import CouponList from "@/components/admin/CouponList";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
    const coupons = await db.coupon.findMany({
        include: {
            affiliate: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    const users = await db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true
        },
        orderBy: {
            name: "asc"
        }
    });

    const serializedCoupons = JSON.parse(JSON.stringify(coupons));
    const serializedUsers = JSON.parse(JSON.stringify(users));

    return <CouponList initialCoupons={serializedCoupons} affiliates={serializedUsers} />;
}
