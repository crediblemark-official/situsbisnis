import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BillingClient } from "@/modules/billing";
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const coupons = await BillingClient.getAllCoupons();
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
        const { code, discountType, discountValue } = body;

        if (!code || !discountType || discountValue === undefined || discountValue === null) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const coupon = await BillingClient.createCoupon(body);
        return NextResponse.json(coupon);
    } catch (error: any) {
        console.error("[ADMIN_COUPONS_POST]", error);
        if (error.message === "DUPLICATE_CODE") {
            return NextResponse.json(
                { error: "Kode kupon sudah digunakan. Gunakan kode unik lainnya." },
                { status: 400 }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

