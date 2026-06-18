import { db } from "@/lib/core/db";
import { Prisma } from "@prisma/client";
import { getSiteId } from "@/lib/domains/tenant";
import { env } from "@/lib/core/env";

import { cache } from "react";

export type PaymentSettings = Prisma.PaymentSettingsGetPayload<{}>;

export const getPaymentSettings = cache(async (siteId?: string): Promise<PaymentSettings & { gatewayEnabled?: boolean; isPlatformManaged?: boolean }> => {
    try {
        const id = siteId || await getSiteId();
        
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });
        const hasPlatformGateway = !!(platformSettings?.gatewayMerchantId && platformSettings?.gatewayApiKey);

        if (!id) {
            const settings = await db.paymentSettings.findFirst();
            if (settings) {
                const hasTenantGateway = !!(settings.gatewayMerchantId && settings.gatewayApiKey);
                return {
                    ...settings,
                    gatewayEnabled: hasTenantGateway || hasPlatformGateway,
                    isPlatformManaged: !hasTenantGateway && hasPlatformGateway
                };
            }
        } else {
            const settings = await db.paymentSettings.findFirst({
                where: { siteId: id }
            });
            if (settings) {
                const hasTenantGateway = !!(settings.gatewayMerchantId && settings.gatewayApiKey);
                return {
                    ...settings,
                    gatewayEnabled: hasTenantGateway || hasPlatformGateway,
                    isPlatformManaged: !hasTenantGateway && hasPlatformGateway
                };
            }

            // Create default settings if none exist
            try {
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
                    gatewayEnabled: hasPlatformGateway,
                    isPlatformManaged: hasPlatformGateway
                };
            } catch (createError) {
                console.error(`[getPaymentSettings] Failed to create payment settings for site '${id}':`, createError);
            }
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
            gatewayEnabled: hasPlatformGateway,
            isPlatformManaged: hasPlatformGateway
        } as any;
    } catch (error) {
        console.error("Failed to fetch payment settings, returning defaults:", error);
        
        let hasPlatformGateway = false;
        try {
            const platformSettings = await db.platformSettings.findUnique({
                where: { id: "global" }
            });
            hasPlatformGateway = !!(platformSettings?.gatewayMerchantId && platformSettings?.gatewayApiKey);
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
            gatewayEnabled: hasPlatformGateway,
            isPlatformManaged: hasPlatformGateway
        } as any;
    }
});
