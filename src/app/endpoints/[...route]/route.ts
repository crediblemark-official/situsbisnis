import { NextRequest, NextResponse } from "next/server";
import { createOrderApi, initializeOrderPaymentApi, getOrderPaymentMethodsApi, checkOrderStatusApi, processOrderWebhookApi } from "@/modules/order/controllers/order-api.controller";
import { uploadMediaApi, proxyMediaApi, getMediaListApi, getMediaFoldersApi } from "@/modules/media/controllers/media-api.controller";
import { processDuitkuWebhookApi } from "@/modules/payment/controllers/payment-api.controller";
import { checkSubscriptionsCronApi } from "@/modules/subscription/controllers/subscription-api.controller";
import { getOpenApiSpecApi } from "@/modules/shared/controllers/openapi-api.controller";
import { getSettingsApi, getPaymentSettingsApi, getAnalyticsApi, getHealthApi, postContactApi, getContactApi } from "@/modules/site/controllers/site-api.controller";
import { getBridgeSessionApi, acceptBridgeSessionApi } from "@/modules/auth/controllers/auth-api.controller";
import { testimonialApi, taxonomyApi } from "@/modules/post/controllers/post-api.controller";
import { generatePageWithAIApi, postCredBuildPageApi, getCredBuildPageApi, getMenusApi, getPageDetailApi } from "@/modules/page/controllers/page-api.controller";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    switch (routePath) {
        case "media/proxy":
            return proxyMediaApi(req);
        case "media":
            return getMediaListApi(req);
        case "media/folders":
            return getMediaFoldersApi(req);
        case "post/taxonomies":
            return taxonomyApi.GET(req);
        case "page/menus":
            return getMenusApi(req);
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
            if (routePath.startsWith("pages/")) {
                const id = route[1];
                return getPageDetailApi(req, { params: Promise.resolve({ id }) });
            }
            return new NextResponse("Not Found", { status: 404 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

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
        case "post/taxonomies":
            return taxonomyApi.POST(req);
        case "page/ai":
            return generatePageWithAIApi(req);
        case "page/credbuild":
            return postCredBuildPageApi(req);
        default:
            return new NextResponse("Not Found", { status: 404 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    // post/testimonials/:id → PUT
    if (routePath.startsWith("post/testimonials/")) {
        const id = route[2];
        return testimonialApi.PUT(req, { params: Promise.resolve({ id }) });
    }

    // media/portfolios/:id → PUT
    if (routePath.startsWith("media/portfolios/")) {
        const id = route[2];
        return portfolioApiPUT(req, id);
    }

    return new NextResponse("Not Found", { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    // post/testimonials/:id → PATCH
    if (routePath.startsWith("post/testimonials/")) {
        const id = route[2];
        return testimonialApi.PATCH(req, { params: Promise.resolve({ id }) });
    }

    // media/portfolios/:id → PATCH
    if (routePath.startsWith("media/portfolios/")) {
        const id = route[2];
        return portfolioApiPATCH(req, id);
    }

    return new NextResponse("Not Found", { status: 404 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const routePath = route.join("/");

    // post/testimonials/:id → DELETE
    if (routePath.startsWith("post/testimonials/")) {
        const id = route[2];
        return testimonialApi.DELETE(req, { params: Promise.resolve({ id }) });
    }

    // media/portfolios/:id → DELETE
    if (routePath.startsWith("media/portfolios/")) {
        const id = route[2];
        return portfolioApiDELETE(req, id);
    }

    return new NextResponse("Not Found", { status: 404 });
}

// Portfolio inline helpers (delegasi ke media.actions via api handler)
import { portfolioApi } from "@/modules/media/api";

async function portfolioApiPUT(req: Request, id: string) {
    return portfolioApi.PUT(req, { params: Promise.resolve({ id }) });
}
async function portfolioApiPATCH(req: Request, id: string) {
    return portfolioApi.PATCH(req, { params: Promise.resolve({ id }) });
}
async function portfolioApiDELETE(req: Request, id: string) {
    return portfolioApi.DELETE(req, { params: Promise.resolve({ id }) });
}
