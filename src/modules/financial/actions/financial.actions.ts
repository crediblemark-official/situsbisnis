"use server";

import { getApiContext } from "@/lib/api/utils";
import { FinancialClient } from "@/modules/financial";

export async function updateWithdrawalStatusAction(body: { withdrawalId: string; status: string }) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { withdrawalId, status } = body;
        if (!withdrawalId || !status) return { success: false, error: "Missing data" };

        const result = await FinancialClient.processWithdrawalStatus(withdrawalId, status);
        return { success: true, result };
    } catch (err: any) {
        console.error("[UPDATE_WITHDRAWAL_STATUS_ACTION] Error:", err);
        if (err.message === "NOT_FOUND") return { success: false, error: "Not found" };
        if (err.message === "ALREADY_PROCESSED") return { success: false, error: "Already processed" };
        return { success: false, error: "Internal Error" };
    }
}

export async function createCouponAction(body: any) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const result = await FinancialClient.createCoupon(body);
        return { success: true, result };
    } catch (err: any) {
        console.error("[CREATE_COUPON_ACTION] Error:", err);
        if (err.message === "DUPLICATE_CODE") {
            return { success: false, error: "Kode kupon sudah digunakan. Gunakan kode unik lainnya." };
        }
        return { success: false, error: err.message || "Internal Error" };
    }
}

export async function updateCouponAction(couponId: string, body: any) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const result = await FinancialClient.updateCoupon(couponId, body);
        return { success: true, result };
    } catch (err: any) {
        console.error("[UPDATE_COUPON_ACTION] Error:", err);
        if (err.message === "NOT_FOUND") return { success: false, error: "Coupon not found" };
        if (err.message === "DUPLICATE_CODE") {
            return { success: false, error: "Kode kupon sudah digunakan oleh kupon lain." };
        }
        return { success: false, error: err.message || "Internal Error" };
    }
}

export async function deleteCouponAction(couponId: string) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const result = await FinancialClient.deleteCoupon(couponId);
        return { success: true, result };
    } catch (err: any) {
        console.error("[DELETE_COUPON_ACTION] Error:", err);
        if (err.message === "NOT_FOUND") return { success: false, error: "Coupon not found" };
        return { success: false, error: err.message || "Internal Error" };
    }
}

