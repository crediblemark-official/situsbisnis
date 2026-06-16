import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";
import { IdentityClient } from "@/lib/modules/identity/client";

export async function GET(_req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const rawCoupons = await db.coupon.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        const affiliateIds = Array.from(new Set(rawCoupons.map(c => c.affiliateId).filter(Boolean))) as string[];
        const usersMap = await IdentityClient.getUsersMap(affiliateIds);

        const coupons = rawCoupons.map(coupon => ({
            ...coupon,
            affiliate: coupon.affiliateId ? usersMap[coupon.affiliateId] || null : null
        }));

        return NextResponse.json(coupons);
    } catch (error) {
        console.error("[ADMIN_COUPONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { code, discountType, discountValue, affiliateId, expiryDate, maxUses, isActive } = body;

        if (!code || !discountType || discountValue === undefined || discountValue === null) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const formattedCode = code.trim().toUpperCase();

        // Check if coupon code already exists
        const existingCoupon = await db.coupon.findUnique({
            where: { code: formattedCode }
        });

        if (existingCoupon) {
            return NextResponse.json(
                { error: "Kode kupon sudah digunakan. Gunakan kode unik lainnya." },
                { status: 400 }
            );
        }

        const coupon = await db.coupon.create({
            data: {
                code: formattedCode,
                discountType,
                discountValue: parseFloat(discountValue),
                affiliateId: affiliateId || null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
                isActive: isActive ?? true
            }
        });

        let affiliate = null;
        if (coupon.affiliateId) {
            affiliate = await IdentityClient.getUserById(coupon.affiliateId);
        }

        return NextResponse.json({
            ...coupon,
            affiliate
        });
    } catch (error) {
        console.error("[ADMIN_COUPONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
