import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { code, planId } = body;

        if (!code) {
            return NextResponse.json({ error: "Kode kupon wajib diisi." }, { status: 400 });
        }

        const formattedCode = code.trim().toUpperCase();

        const coupon = await db.coupon.findUnique({
            where: { code: formattedCode }
        });

        if (!coupon) {
            return NextResponse.json({ error: "Kupon tidak ditemukan." }, { status: 404 });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ error: "Kupon sudah tidak aktif." }, { status: 400 });
        }

        const now = new Date();
        if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
            return NextResponse.json({ error: "Kupon sudah kedaluwarsa." }, { status: 400 });
        }

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ error: "Batas pemakaian kupon telah tercapai." }, { status: 400 });
        }

        let planPrice = 0;
        if (planId) {
            const plan = await db.plan.findUnique({
                where: { id: planId }
            });
            if (plan) {
                planPrice = Number(plan.price);
            }
        }

        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = planPrice * (Number(coupon.discountValue) / 100);
        } else {
            discountAmount = Number(coupon.discountValue);
        }

        const finalPrice = Math.max(0, planPrice - discountAmount);

        return NextResponse.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: Number(coupon.discountValue),
                affiliateId: coupon.affiliateId
            },
            originalPrice: planPrice,
            discountAmount,
            finalPrice
        });
    } catch (error) {
        console.error("[VALIDATE_COUPON_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
