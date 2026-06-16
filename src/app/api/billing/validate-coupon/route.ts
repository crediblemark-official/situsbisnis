import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { BillingClient } from "@/lib/modules/billing/client";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { code, planId } = body;

        const result = await BillingClient.validateCoupon(code, planId);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[VALIDATE_COUPON_POST]", error);
        if (error.message === "Kupon tidak ditemukan.") {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (
            error.message === "Kode kupon wajib diisi." || 
            error.message === "Kupon sudah tidak aktif." || 
            error.message === "Kupon sudah kedaluwarsa." || 
            error.message === "Batas pemakaian kupon telah tercapai."
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

