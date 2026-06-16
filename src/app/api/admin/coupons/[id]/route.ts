import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinancialClient } from "@/modules/financial";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: couponId } = await params;
        const body = await req.json();

        const updatedCoupon = await FinancialClient.updateCoupon(couponId, body);
        return NextResponse.json(updatedCoupon);
    } catch (error: any) {
        console.error("[ADMIN_COUPON_PATCH]", error);
        if (error.message === "NOT_FOUND") {
            return new NextResponse("Coupon not found", { status: 404 });
        }
        if (error.message === "DUPLICATE_CODE") {
            return NextResponse.json(
                { error: "Kode kupon sudah digunakan oleh kupon lain." },
                { status: 400 }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: couponId } = await params;

        await FinancialClient.deleteCoupon(couponId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[ADMIN_COUPON_DELETE]", error);
        if (error.message === "NOT_FOUND") {
            return new NextResponse("Coupon not found", { status: 404 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

