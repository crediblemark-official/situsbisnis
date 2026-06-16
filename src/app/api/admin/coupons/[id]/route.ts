import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";
import { IdentityClient } from "@/lib/modules/identity/client";

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
        const { code, discountType, discountValue, affiliateId, expiryDate, maxUses, isActive } = body;

        const existingCoupon = await db.coupon.findUnique({
            where: { id: couponId }
        });

        if (!existingCoupon) {
            return new NextResponse("Coupon not found", { status: 404 });
        }

        const updateData: any = {};
        if (code !== undefined) {
            const formattedCode = code.trim().toUpperCase();
            // Check uniqueness if code is changed
            if (formattedCode !== existingCoupon.code) {
                const isDuplicate = await db.coupon.findUnique({
                    where: { code: formattedCode }
                });
                if (isDuplicate) {
                    return NextResponse.json(
                        { error: "Kode kupon sudah digunakan oleh kupon lain." },
                        { status: 400 }
                    );
                }
            }
            updateData.code = formattedCode;
        }

        if (discountType !== undefined) updateData.discountType = discountType;
        if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
        if (affiliateId !== undefined) updateData.affiliateId = affiliateId || null;
        
        if (expiryDate !== undefined) {
            updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
        }
        
        if (maxUses !== undefined) {
            updateData.maxUses = maxUses ? parseInt(maxUses) : null;
        }
        
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedCoupon = await db.coupon.update({
            where: { id: couponId },
            data: updateData
        });

        let affiliate = null;
        if (updatedCoupon.affiliateId) {
            affiliate = await IdentityClient.getUserById(updatedCoupon.affiliateId);
        }

        return NextResponse.json({
            ...updatedCoupon,
            affiliate
        });
    } catch (error) {
        console.error("[ADMIN_COUPON_PATCH]", error);
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

        const existingCoupon = await db.coupon.findUnique({
            where: { id: couponId }
        });

        if (!existingCoupon) {
            return new NextResponse("Coupon not found", { status: 404 });
        }

        await db.coupon.delete({
            where: { id: couponId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ADMIN_COUPON_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
