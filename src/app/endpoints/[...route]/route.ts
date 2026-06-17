import { NextRequest, NextResponse } from "next/server";
import { createOrderApi, initializeOrderPaymentApi, getOrderPaymentMethodsApi, checkOrderStatusApi, processOrderWebhookApi } from "@/modules/order/controllers/order-api.controller";
import { uploadMediaApi, proxyMediaApi } from "@/modules/media/controllers/media-api.controller";
import { processDuitkuWebhookApi } from "@/modules/payment/controllers/payment-api.controller";
import { checkSubscriptionsCronApi } from "@/modules/subscription/controllers/subscription-api.controller";
import { getOpenApiSpecApi } from "@/modules/shared/controllers/openapi-api.controller";
import { getSettingsApi, getPaymentSettingsApi, getAnalyticsApi, getHealthApi, postContactApi, getContactApi } from "@/modules/site/controllers/site-api.controller";
import { getBridgeSessionApi, acceptBridgeSessionApi } from "@/modules/auth/controllers/auth-api.controller";
import { testimonialApi } from "@/modules/post/controllers/post-api.controller";
import { generatePageWithAIApi, postCredBuildPageApi, getCredBuildPageApi } from "@/modules/page/controllers/page-api.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
    const routePath = params.route.join("/");

    switch (routePath) {
        case "media/proxy":
            return proxyMediaApi(req);
        case "subscription/cron/check-subscriptions":
            return checkSubscriptionsCronApi(req);
        case "shared/openapi":
            return getOpenApiSpecApi();
        case "site/settings":
            return getSettingsApi();
        case "site/settings/payments":
            return getPaymentSettingsApi();
        case "site/analytics":
            return getAnalyticsApi();
        case "site/health":
            return getHealthApi();
        case "site/contact":
            return getContactApi(req);
        case "auth/bridge":
            return getBridgeSessionApi(req);
        case "auth/bridge/accept":
            return acceptBridgeSessionApi(req);
        case "post/testimonials":
            return testimonialApi.GET(req);
        case "page/credbuild":
            return getCredBuildPageApi(req);
        default:
            return new NextResponse("Not Found", { status: 404 });
    }
}

export async function POST(req: Request, { params }: { params: { route: string[] } }) {
    const routePath = params.route.join("/");

    switch (routePath) {
        case "order/orders":
            return createOrderApi(req);
        case "order/orders/payment":
            return initializeOrderPaymentApi(req);
        case "order/orders/payment-methods":
            return getOrderPaymentMethodsApi(req);
        case "order/orders/check-status":
            return checkOrderStatusApi(req);
        case "order/orders/webhook/duitku":
            return processOrderWebhookApi(req);
        case "media":
            return uploadMediaApi(req);
        case "payment/billing/webhook/duitku":
            return processDuitkuWebhookApi(req);
        case "site/contact":
            return postContactApi(req);
        case "post/testimonials":
            return testimonialApi.POST(req);
        case "page/ai":
            return generatePageWithAIApi(req);
        case "page/credbuild":
            return postCredBuildPageApi(req);
        default:
            return new NextResponse("Not Found", { status: 404 });
    }
}
