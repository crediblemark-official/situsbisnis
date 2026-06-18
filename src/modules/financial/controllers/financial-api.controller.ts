import { NextResponse } from "next/server";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { FinancialClient } from "../index";
import { z } from "zod";

const couponSchema = z.object({
    code: z.string().min(1, "Code is required"),
    discount: z.coerce.number().positive("Discount must be positive"),
    discountType: z.enum(["percentage", "fixed"]).default("percentage"),
    maxUses: z.coerce.number().int().nonnegative().optional().default(0),
    expiresAt: z.string().optional(),
});

export async function getCouponsApi() {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const coupons = await FinancialClient.getAllCoupons();
        return apiResponse(coupons);
    } catch (error) {
        console.error("Fetch Coupons Error:", error);
        return apiError("Failed to fetch coupons");
    }
}

export async function createCouponApi(req: Request) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, couponSchema);
        if (vError) return apiError(vError, vStatus, details);

        const coupon = await FinancialClient.createCoupon(data);
        return apiResponse(coupon);
    } catch (error) {
        console.error("Create Coupon Error:", error);
        return apiError("Failed to create coupon");
    }
}

export async function validateCouponApi(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) return apiError("Coupon code is required", 400);

        const coupon = await FinancialClient.findCouponByCode(code);
        if (!coupon) return apiError("Coupon not found", 404);

        return apiResponse(coupon);
    } catch (error) {
        console.error("Validate Coupon Error:", error);
        return apiError("Failed to validate coupon");
    }
}

export async function updateCouponApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const { id: couponId } = await params;
        const body = await req.json();

        const updated = await FinancialClient.updateCoupon(couponId, body);
        return apiResponse(updated);
    } catch (error: any) {
        console.error("[ADMIN_COUPON_PATCH]", error);
        if (error.message?.includes("sudah digunakan")) return apiError(error.message, 400);
        return apiError("Internal Error");
    }
}

export async function deleteCouponApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const { id: couponId } = await params;

        await FinancialClient.deleteCoupon(couponId);
        return apiResponse({ success: true });
    } catch (error: any) {
        console.error("[ADMIN_COUPON_DELETE]", error);
        return apiError("Internal Error");
    }
}

export async function updateWithdrawalStatusApi(req: Request) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const body = await req.json();
        const { withdrawalId, status: wStatus } = body;
        if (!withdrawalId || !wStatus) return apiError("Missing data", 400);

        const result = await FinancialClient.processWithdrawalStatus(withdrawalId, wStatus);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[ADMIN_WITHDRAWAL_UPDATE]", error);
        if (error.message === "NOT_FOUND") return apiError("Not found", 404);
        if (error.message === "ALREADY_PROCESSED") return apiError("Already processed", 400);
        return apiError("Internal Error");
    }
}

export async function getAdminSettingsContextApi() {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const context = await FinancialClient.getAdminSettingsContext();
        return apiResponse(context);
    } catch (error) {
        console.error("Admin Settings Error:", error);
        return apiError("Failed to fetch admin settings");
    }
}
