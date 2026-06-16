import * as couponRepo from "../repositories/coupon.repository";
import { SubscriptionClient } from "@/modules/subscription";
import { eventBus } from "@/modules/shared/core/event-bus";

/**
 * Memvalidasi kupon diskon dan menghitung harga akhirnya.
 */
export async function validateCoupon(code: string, planId?: string) {
    if (!code) {
        throw new Error("Kode kupon wajib diisi.");
    }

    const formattedCode = code.trim().toUpperCase();
    const coupon = await couponRepo.findCouponByCode(formattedCode);

    if (!coupon) {
        throw new Error("Kupon tidak ditemukan.");
    }

    if (!coupon.isActive) {
        throw new Error("Kupon sudah tidak aktif.");
    }

    const now = new Date();
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
        throw new Error("Kupon sudah kedaluwarsa.");
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw new Error("Batas pemakaian kupon telah tercapai.");
    }

    let planPrice = 0;
    if (planId) {
        const plan = await SubscriptionClient.findPlanById(planId);
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

    return {
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
    };
}

/**
 * Mengambil daftar seluruh kupon beserta detail afiliasinya (admin).
 */
export async function getAllCoupons() {
    const rawCoupons = await couponRepo.findAllCoupons();
    const affiliateIds = Array.from(new Set(rawCoupons.map(c => c.affiliateId).filter(Boolean))) as string[];
    const usersMap = await eventBus.request<any, any>("request.auth.getUsersMap", { userIds: affiliateIds });

    return rawCoupons.map(coupon => ({
        ...coupon,
        affiliate: coupon.affiliateId ? usersMap[coupon.affiliateId] || null : null
    }));
}

/**
 * Mencari kupon berdasarkan kode.
 */
export async function findCouponByCode(code: string) {
    return couponRepo.findCouponByCode(code);
}

/**
 * Membuat kupon baru (admin).
 */
export async function createCoupon(body: any) {
    const { code, discountType, discountValue, affiliateId, expiryDate, maxUses, isActive } = body;

    if (!code || !discountType || discountValue === undefined || discountValue === null) {
        throw new Error("Missing data");
    }

    const formattedCode = code.trim().toUpperCase();
    const existingCoupon = await couponRepo.findCouponByCode(formattedCode);

    if (existingCoupon) {
        throw new Error("DUPLICATE_CODE");
    }

    const coupon = await couponRepo.createCoupon({
        code: formattedCode,
        discountType,
        discountValue: parseFloat(discountValue),
        affiliateId: affiliateId || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        isActive: isActive ?? true
    });

    let affiliate = null;
    if (coupon.affiliateId) {
        affiliate = await eventBus.request<any, any>("request.auth.getUserById", { userId: coupon.affiliateId });
    }

    return {
        ...coupon,
        affiliate
    };
}

/**
 * Memperbarui data kupon (admin).
 */
export async function updateCoupon(couponId: string, body: any) {
    const { code, discountType, discountValue, affiliateId, expiryDate, maxUses, isActive } = body;

    const existingCoupon = await couponRepo.findCouponById(couponId);
    if (!existingCoupon) {
        throw new Error("NOT_FOUND");
    }

    const updateData: any = {};
    if (code !== undefined) {
        const formattedCode = code.trim().toUpperCase();
        if (formattedCode !== existingCoupon.code) {
            const isDuplicate = await couponRepo.findCouponByCode(formattedCode);
            if (isDuplicate) {
                throw new Error("DUPLICATE_CODE");
            }
        }
        updateData.code = formattedCode;
    }

    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (affiliateId !== undefined) updateData.affiliateId = affiliateId || null;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (maxUses !== undefined) updateData.maxUses = maxUses ? parseInt(maxUses) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCoupon = await couponRepo.updateCoupon(couponId, updateData);

    let affiliate = null;
    if (updatedCoupon.affiliateId) {
        affiliate = await eventBus.request<any, any>("request.auth.getUserById", { userId: updatedCoupon.affiliateId });
    }

    return {
        ...updatedCoupon,
        affiliate
    };
}

/**
 * Menghapus kupon (admin).
 */
export async function deleteCoupon(couponId: string) {
    const existingCoupon = await couponRepo.findCouponById(couponId);
    if (!existingCoupon) {
        throw new Error("NOT_FOUND");
    }
    await couponRepo.deleteCoupon(couponId);
    return { success: true };
}
