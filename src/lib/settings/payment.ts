import { db } from "@/lib/core/db";
import { Prisma } from "@prisma/client";
import { getSiteId } from "@/lib/domains/tenant";
import { env } from "@/lib/core/env";

import { cache } from "react";

export type PaymentSettings = Prisma.PaymentSettingsGetPayload<{}>;

export const getPaymentSettings = cache(async (siteId?: string): Promise<PaymentSettings & { duitkuEnabled?: boolean; isPlatformManaged?: boolean }> => {
    try {
        const id = siteId || await getSiteId();
        
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });
        const hasPlatformDuitku = !!(platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey);

        if (!id) {
            const settings = await db.paymentSettings.findFirst();
            if (settings) {
                const hasTenantDuitku = !!(settings.duitkuMerchantCode && settings.duitkuApiKey);
                return {
                    ...settings,
                    duitkuEnabled: hasTenantDuitku || hasPlatformDuitku,
                    isPlatformManaged: !hasTenantDuitku && hasPlatformDuitku
                };
            }
        } else {
            const settings = await db.paymentSettings.findFirst({
                where: { siteId: id }
            });
            if (settings) {
                const hasTenantDuitku = !!(settings.duitkuMerchantCode && settings.duitkuApiKey);
                return {
                    ...settings,
                    duitkuEnabled: hasTenantDuitku || hasPlatformDuitku,
                    isPlatformManaged: !hasTenantDuitku && hasPlatformDuitku
                };
            }

            // Create default settings if none exist
            const newSettings = await db.paymentSettings.create({
                data: {
                    siteId: id,
                    bankName: env.DEFAULT_BANK_NAME,
                    accountNumber: env.DEFAULT_BANK_ACCOUNT,
                    accountHolder: env.DEFAULT_BANK_HOLDER,
                    currency: env.DEFAULT_CURRENCY,
                    instructions: env.DEFAULT_INSTRUCTIONS
                }
            });
            return {
                ...newSettings,
                duitkuEnabled: hasPlatformDuitku,
                isPlatformManaged: hasPlatformDuitku
            };
        }

        // Fallback to platform defaults if no site
        return {
            id: "default",
            siteId: "default",
            bankName: env.DEFAULT_BANK_NAME,
            accountNumber: env.DEFAULT_BANK_ACCOUNT,
            accountHolder: env.DEFAULT_BANK_HOLDER,
            currency: env.DEFAULT_CURRENCY,
            instructions: env.DEFAULT_INSTRUCTIONS,
            updatedAt: new Date(),
            duitkuEnabled: hasPlatformDuitku,
            isPlatformManaged: hasPlatformDuitku
        } as any;
    } catch (error) {
        console.error("Failed to fetch payment settings, returning defaults:", error);
        
        let hasPlatformDuitku = false;
        try {
            const platformSettings = await db.platformSettings.findUnique({
                where: { id: "global" }
            });
            hasPlatformDuitku = !!(platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey);
        } catch (_) {}

        return {
            id: "default",
            siteId: "default",
            bankName: env.DEFAULT_BANK_NAME,
            accountNumber: env.DEFAULT_BANK_ACCOUNT,
            accountHolder: env.DEFAULT_BANK_HOLDER,
            currency: env.DEFAULT_CURRENCY,
            instructions: env.DEFAULT_INSTRUCTIONS,
            updatedAt: new Date(),
            duitkuEnabled: hasPlatformDuitku,
            isPlatformManaged: hasPlatformDuitku
        } as any;
    }
});
