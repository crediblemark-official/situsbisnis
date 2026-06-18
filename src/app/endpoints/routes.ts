import { NextResponse } from "next/server";
import { createOrderApi, initializeOrderPaymentApi, getOrderPaymentMethodsApi, checkOrderStatusApi, processOrderWebhookApi, getOrdersApi, getOrderDetailApi, updateOrderApi } from "@/modules/order/controllers/order-api.controller";
import { uploadMediaApi, proxyMediaApi, getMediaListApi, getMediaFoldersApi, deleteMediaApi, deleteMediaFolderApi } from "@/modules/media/controllers/media-api.controller";
import { galleryGetApi, galleryPostApi, galleryGetDetailApi, galleryPatchApi, galleryPutApi, galleryDeleteApi } from "@/modules/media/controllers/gallery.controller";
import { portfolioGetApi, portfolioPostApi, portfolioGetDetailApi, portfolioPatchApi, portfolioPutApi, portfolioDeleteApi } from "@/modules/media/controllers/portfolio.controller";
import { processDuitkuWebhookApi, processMidtransWebhookApi } from "@/modules/payment/controllers/payment-api.controller";
import { checkoutPaymentApi, confirmPaymentApi, cancelPaymentApi, upgradePlanApi, buySlotApi, getPaymentMethodsApi, updateTransactionStatusApi } from "@/modules/payment/controllers/billing-api.controller";
import { checkSubscriptionsCronApi, getPlansApi, getPricingPlansApi, getAdminSubscriptionApi, cancelSubscriptionApi, extendTrialApi } from "@/modules/subscription/controllers/subscription-api.controller";
import { getOpenApiSpecApi } from "@/modules/shared/controllers/openapi-api.controller";
import { getSettingsApi, getPaymentSettingsApi, getAnalyticsApi, getHealthApi, postContactApi, getContactApi, postOnboardingApi, validateSettingApi, getAdminSettingsApi, getAdminSiteApi, searchApi } from "@/modules/site/controllers/site-api.controller";

import { registerApi } from "@/modules/auth/controllers/register.controller";
import { updateProfileApi, getUsersApi, createUserApi, getUserSitesApi, updateUserSiteApi, verifyUserSiteApi, updateUserApi, deleteUserApi, checkAffiliateApi, withdrawAffiliateApi } from "@/modules/auth/controllers/user-api.controller";
import { postGetApi, postPostApi, postGetDetailApi, postPatchApi, postPutApi, postDeleteApi } from "@/modules/post/controllers/post.controller";
import { testimonialGetApi, testimonialPostApi, testimonialGetDetailApi, testimonialPatchApi, testimonialPutApi, testimonialDeleteApi } from "@/modules/post/controllers/testimonial.controller";
import { taxonomyGetApi, taxonomyPostApi, taxonomyGetDetailApi, taxonomyPatchApi, taxonomyPutApi, taxonomyDeleteApi } from "@/modules/post/controllers/taxonomy.controller";
import { getTermsApi, createTermApi, updateTermApi, deleteTermApi } from "@/modules/post/controllers/post-api.controller";
import { productGetApi, productPostApi, productGetDetailApi, productPatchApi, productPutApi, productDeleteApi } from "@/modules/catalog/controllers/product.controller";
import { postCredBuildPageApi, getCredBuildPageApi, getMenusApi, getPageDetailApi, getPagesApi, savePageApi, updateMenuApi, deletePageApi } from "@/modules/page/controllers/page-api.controller";
import { processAIApi } from "@/modules/ai/controllers/ai-api.controller";
import { verifyDomainApi } from "@/modules/domain/controllers/domain-api.controller";
import { exportBackupApi, importBackupApi } from "@/modules/infrastructure/controllers/infra-api.controller";
import { getCouponsApi, createCouponApi, updateCouponApi, deleteCouponApi, validateCouponApi, updateWithdrawalStatusApi } from "@/modules/financial/controllers/financial-api.controller";
import { checkBillingStatusApi } from "@/modules/payment/controllers/billing-api.controller";
import { updateSubscriptionByAdminApi } from "@/modules/subscription/controllers/subscription-api.controller";
import { updateSettingsApi, updatePaymentSettingsApi, updateAdminSettingsApi, fetchAiModelsApi, deleteAdminSiteApi, updateAdminSiteApi } from "@/modules/site/controllers/site-api.controller";

type EndpointHandler = (
    _req: Request,
    _context?: { params: Promise<{ id?: string; termId?: string }> }
) => Promise<Response> | Response;

type EndpointRoute = {
    method: string;
    path: string;
    handler: EndpointHandler;
    match?: (_route: string[], _routePath: string) => boolean;
    paramIndex?: number;
};

const endpoints: EndpointRoute[] = [
    // ===== AUTH =====
    { method: "POST", path: "auth/register", handler: registerApi },

    // ===== USER / PROFILE =====
    { method: "PUT", path: "profile", handler: updateProfileApi },
    { method: "GET", path: "user/sites", handler: getUserSitesApi },
    { method: "PATCH", path: "user/sites", handler: updateUserSiteApi },
    { method: "POST", path: "user/sites/verify", handler: verifyUserSiteApi },
    { method: "GET", path: "users", handler: getUsersApi },
    { method: "POST", path: "users", handler: createUserApi },
    { method: "GET", path: "affiliate/check", handler: checkAffiliateApi },
    { method: "POST", path: "affiliate/withdraw", handler: withdrawAffiliateApi },

    // ===== MEDIA =====
    { method: "GET", path: "media/proxy", handler: proxyMediaApi },
    { method: "GET", path: "media", handler: getMediaListApi },
    { method: "POST", path: "media", handler: uploadMediaApi },
    { method: "GET", path: "media/folders", handler: getMediaFoldersApi },
    {
        method: "DELETE", path: "media/folders/*", handler: deleteMediaFolderApi,
        match: (_route, routePath) => /^media\/folders\/[^/]+$/.test(routePath),
        paramIndex: 2
    },
    { method: "GET", path: "media/gallery", handler: galleryGetApi },
    { method: "GET", path: "gallery", handler: galleryGetApi },
    { method: "POST", path: "media/gallery", handler: galleryPostApi },
    { method: "POST", path: "gallery", handler: galleryPostApi },
    { method: "GET", path: "media/portfolios", handler: portfolioGetApi },
    { method: "GET", path: "portfolios", handler: portfolioGetApi },
    { method: "POST", path: "media/portfolios", handler: portfolioPostApi },
    { method: "POST", path: "portfolios", handler: portfolioPostApi },
    {
        method: "DELETE", path: "media/*", handler: deleteMediaApi,
        match: (_route, routePath) => /^media\/[^/]+$/.test(routePath) && !["proxy", "folders", "gallery", "portfolios"].includes(routePath.split("/")[1]),
        paramIndex: 1
    },

    // ===== POSTS =====
    { method: "GET", path: "posts", handler: postGetApi },
    { method: "POST", path: "posts", handler: postPostApi },
    { method: "GET", path: "post/taxonomies", handler: taxonomyGetApi },
    { method: "GET", path: "taxonomies", handler: taxonomyGetApi },
    { method: "POST", path: "post/taxonomies", handler: taxonomyPostApi },
    { method: "POST", path: "taxonomies", handler: taxonomyPostApi },
    { method: "GET", path: "post/testimonials", handler: testimonialGetApi },
    { method: "POST", path: "post/testimonials", handler: testimonialPostApi },

    // ===== PRODUCTS =====
    { method: "GET", path: "products", handler: productGetApi },
    { method: "POST", path: "products", handler: productPostApi },

    // ===== PAGES =====
    { method: "GET", path: "pages", handler: getPagesApi },
    { method: "POST", path: "pages", handler: savePageApi },
    { method: "GET", path: "page/menus", handler: getMenusApi },
    { method: "GET", path: "page/credbuild", handler: getCredBuildPageApi },
    { method: "POST", path: "ai", handler: processAIApi },
    { method: "POST", path: "page/credbuild", handler: postCredBuildPageApi },

    // ===== ORDERS =====
    { method: "GET", path: "orders", handler: getOrdersApi },
    { method: "POST", path: "order/orders", handler: createOrderApi },
    { method: "POST", path: "order/orders/payment", handler: initializeOrderPaymentApi },
    { method: "POST", path: "order/orders/payment-methods", handler: getOrderPaymentMethodsApi },
    { method: "POST", path: "order/orders/check-status", handler: checkOrderStatusApi },
    { method: "POST", path: "order/orders/webhook/duitku", handler: processOrderWebhookApi },
    { method: "POST", path: "order/orders/webhook/payment", handler: processOrderWebhookApi },

    // ===== SITE / SETTINGS =====
    { method: "GET", path: "site/settings", handler: getSettingsApi },
    { method: "GET", path: "settings", handler: getSettingsApi },
    { method: "PATCH", path: "site/settings", handler: updateSettingsApi },
    { method: "GET", path: "site/settings/payments", handler: getPaymentSettingsApi },
    { method: "POST", path: "site/settings/payments", handler: updatePaymentSettingsApi },
    { method: "GET", path: "settings/validate", handler: validateSettingApi },
    { method: "GET", path: "site/analytics", handler: getAnalyticsApi },
    { method: "GET", path: "analytics", handler: getAnalyticsApi },
    { method: "GET", path: "site/health", handler: getHealthApi },
    { method: "GET", path: "site/contact", handler: getContactApi },
    { method: "POST", path: "site/contact", handler: postContactApi },
    { method: "POST", path: "onboarding", handler: postOnboardingApi },

    // ===== SEARCH =====
    { method: "GET", path: "search", handler: searchApi },

    // ===== DOMAINS =====
    { method: "POST", path: "domains/verify", handler: verifyDomainApi },

    // ===== BILLING / PAYMENT =====
    { method: "POST", path: "payment/billing/webhook/duitku", handler: processDuitkuWebhookApi },
    { method: "POST", path: "payment/billing/webhook/midtrans", handler: processMidtransWebhookApi },
    { method: "POST", path: "billing/checkout/payment", handler: checkoutPaymentApi },
    { method: "POST", path: "billing/confirm", handler: confirmPaymentApi },
    { method: "POST", path: "billing/cancel", handler: cancelPaymentApi },
    { method: "POST", path: "billing/upgrade", handler: upgradePlanApi },
    { method: "POST", path: "billing/buy-slot", handler: buySlotApi },
    { method: "POST", path: "billing/payment-methods", handler: getPaymentMethodsApi },
    { method: "POST", path: "billing/extend-trial", handler: extendTrialApi },
    { method: "POST", path: "billing/validate-coupon", handler: validateCouponApi },
    { method: "GET", path: "billing/validate-coupon", handler: validateCouponApi },
    { method: "POST", path: "billing/check-status", handler: checkBillingStatusApi },
    { method: "POST", path: "subscription/cancel", handler: cancelSubscriptionApi },

    // ===== PRICING / PLANS =====
    { method: "GET", path: "pricing/plans", handler: getPricingPlansApi },
    { method: "GET", path: "subscription/cron/check-subscriptions", handler: checkSubscriptionsCronApi },

    // ===== MENUS =====
    { method: "GET", path: "menus", handler: getMenusApi },

    // ===== ADMIN =====
    { method: "GET", path: "admin/backup", handler: exportBackupApi },
    { method: "POST", path: "admin/backup", handler: importBackupApi },
    { method: "GET", path: "admin/coupons", handler: getCouponsApi },
    { method: "POST", path: "admin/coupons", handler: createCouponApi },
    { method: "GET", path: "admin/plans", handler: getPlansApi },
    { method: "GET", path: "admin/settings", handler: getAdminSettingsApi },
    { method: "PATCH", path: "admin/settings", handler: updateAdminSettingsApi },
    { method: "POST", path: "admin/settings/ai-models", handler: fetchAiModelsApi },

    // ===== SHARED =====
    { method: "GET", path: "shared/openapi", handler: getOpenApiSpecApi },

    // ===== DETAIL ROUTES (with ID param) =====
    {
        method: "GET", path: "pages/*", handler: getPageDetailApi,
        match: (_route, routePath) => routePath.startsWith("pages/"),
        paramIndex: 1
    },
    {
        method: "DELETE", path: "pages/*", handler: deletePageApi,
        match: (_route, routePath) => routePath.startsWith("pages/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "GET", path: "posts/*", handler: postGetDetailApi,
        match: (_route, routePath) => routePath.startsWith("posts/"),
        paramIndex: 1
    },
    {
        method: "POST", path: "posts/*", handler: postPostApi,
        match: (_route, routePath) => routePath.startsWith("posts/") && _route.length === 2
    },
    {
        method: "PUT", path: "posts/*", handler: postPutApi,
        match: (_route, routePath) => routePath.startsWith("posts/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "PATCH", path: "posts/*", handler: postPatchApi,
        match: (_route, routePath) => routePath.startsWith("posts/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "DELETE", path: "posts/*", handler: postDeleteApi,
        match: (_route, routePath) => routePath.startsWith("posts/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "GET", path: "products/*", handler: productGetDetailApi,
        match: (_route, routePath) => routePath.startsWith("products/"),
        paramIndex: 1
    },
    {
        method: "PUT", path: "products/*", handler: productPutApi,
        match: (_route, routePath) => routePath.startsWith("products/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "PATCH", path: "products/*", handler: productPatchApi,
        match: (_route, routePath) => routePath.startsWith("products/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "DELETE", path: "products/*", handler: productDeleteApi,
        match: (_route, routePath) => routePath.startsWith("products/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "GET", path: "orders/*", handler: getOrderDetailApi,
        match: (_route, routePath) => routePath.startsWith("orders/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "PATCH", path: "orders/*", handler: updateOrderApi,
        match: (_route, routePath) => routePath.startsWith("orders/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "GET", path: "media/gallery/*", handler: galleryGetDetailApi,
        match: (_route, routePath) => routePath.startsWith("media/gallery/"),
        paramIndex: 2
    },
    {
        method: "GET", path: "gallery/*", handler: galleryGetDetailApi,
        match: (_route, routePath) => /^gallery\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "PUT", path: "media/gallery/*", handler: galleryPutApi,
        match: (_route, routePath) => routePath.startsWith("media/gallery/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PUT", path: "gallery/*", handler: galleryPutApi,
        match: (_route, routePath) => /^gallery\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "PATCH", path: "media/gallery/*", handler: galleryPatchApi,
        match: (_route, routePath) => routePath.startsWith("media/gallery/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "gallery/*", handler: galleryPatchApi,
        match: (_route, routePath) => /^gallery\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "DELETE", path: "media/gallery/*", handler: galleryDeleteApi,
        match: (_route, routePath) => routePath.startsWith("media/gallery/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "DELETE", path: "gallery/*", handler: galleryDeleteApi,
        match: (_route, routePath) => /^gallery\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "GET", path: "media/portfolios/*", handler: portfolioGetDetailApi,
        match: (_route, routePath) => routePath.startsWith("media/portfolios/"),
        paramIndex: 2
    },
    {
        method: "GET", path: "portfolios/*", handler: portfolioGetDetailApi,
        match: (_route, routePath) => /^portfolios\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "PUT", path: "media/portfolios/*", handler: portfolioPutApi,
        match: (_route, routePath) => routePath.startsWith("media/portfolios/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PUT", path: "portfolios/*", handler: portfolioPutApi,
        match: (_route, routePath) => /^portfolios\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "PATCH", path: "media/portfolios/*", handler: portfolioPatchApi,
        match: (_route, routePath) => routePath.startsWith("media/portfolios/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "portfolios/*", handler: portfolioPatchApi,
        match: (_route, routePath) => /^portfolios\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "DELETE", path: "media/portfolios/*", handler: portfolioDeleteApi,
        match: (_route, routePath) => routePath.startsWith("media/portfolios/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "DELETE", path: "portfolios/*", handler: portfolioDeleteApi,
        match: (_route, routePath) => /^portfolios\/[^/]+$/.test(routePath),
        paramIndex: 1
    },
    {
        method: "GET", path: "post/testimonials/*", handler: testimonialGetDetailApi,
        match: (_route, routePath) => routePath.startsWith("post/testimonials/"),
        paramIndex: 2
    },
    {
        method: "PUT", path: "post/testimonials/*", handler: testimonialPutApi,
        match: (_route, routePath) => routePath.startsWith("post/testimonials/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "post/testimonials/*", handler: testimonialPatchApi,
        match: (_route, routePath) => routePath.startsWith("post/testimonials/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "DELETE", path: "post/testimonials/*", handler: testimonialDeleteApi,
        match: (_route, routePath) => routePath.startsWith("post/testimonials/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "GET", path: "post/taxonomies/*", handler: taxonomyGetDetailApi,
        match: (_route, routePath) => routePath.startsWith("post/taxonomies/"),
        paramIndex: 2
    },
    {
        method: "PUT", path: "post/taxonomies/*", handler: taxonomyPutApi,
        match: (_route, routePath) => routePath.startsWith("post/taxonomies/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "post/taxonomies/*", handler: taxonomyPatchApi,
        match: (_route, routePath) => routePath.startsWith("post/taxonomies/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "DELETE", path: "post/taxonomies/*", handler: taxonomyDeleteApi,
        match: (_route, routePath) => routePath.startsWith("post/taxonomies/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PUT", path: "menus/*", handler: updateMenuApi,
        match: (_route, routePath) => routePath.startsWith("menus/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "PATCH", path: "users/*", handler: updateUserApi,
        match: (_route, routePath) => routePath.startsWith("users/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "DELETE", path: "users/*", handler: deleteUserApi,
        match: (_route, routePath) => routePath.startsWith("users/") && _route.length === 2,
        paramIndex: 1
    },
    {
        method: "GET", path: "admin/sites/*", handler: getAdminSiteApi,
        match: (_route, routePath) => routePath.startsWith("admin/sites/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "DELETE", path: "admin/sites/*", handler: deleteAdminSiteApi,
        match: (_route, routePath) => routePath.startsWith("admin/sites/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "admin/sites/*", handler: updateAdminSiteApi,
        match: (_route, routePath) => routePath.startsWith("admin/sites/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "GET", path: "admin/subscriptions/*", handler: getAdminSubscriptionApi,
        match: (_route, routePath) => routePath.startsWith("admin/subscriptions/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "admin/subscriptions/*", handler: updateSubscriptionByAdminApi,
        match: (_route, routePath) => routePath.startsWith("admin/subscriptions/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "PATCH", path: "admin/coupons/*", handler: updateCouponApi,
        match: (_route, routePath) => routePath.startsWith("admin/coupons/") && _route.length === 3,
        paramIndex: 2
    },
    {
        method: "DELETE", path: "admin/coupons/*", handler: deleteCouponApi,
        match: (_route, routePath) => routePath.startsWith("admin/coupons/") && _route.length === 3,
        paramIndex: 2
    },
    { method: "POST", path: "admin/withdrawals/update", handler: updateWithdrawalStatusApi },
    { method: "POST", path: "admin/transactions/update", handler: updateTransactionStatusApi },

    // ===== TAXONOMY TERMS (nested params) =====
    {
        method: "GET", path: "post/taxonomies/*/terms", handler: getTermsApi,
        match: (_route, routePath) => /^post\/taxonomies\/[^/]+\/terms$/.test(routePath)
    },
    {
        method: "POST", path: "post/taxonomies/*/terms", handler: createTermApi,
        match: (_route, routePath) => /^post\/taxonomies\/[^/]+\/terms$/.test(routePath)
    },
    {
        method: "PUT", path: "post/taxonomies/*/terms/*", handler: updateTermApi,
        match: (_route, routePath) => /^post\/taxonomies\/[^/]+\/terms\/[^/]+$/.test(routePath)
    },
    {
        method: "PATCH", path: "post/taxonomies/*/terms/*", handler: updateTermApi,
        match: (_route, routePath) => /^post\/taxonomies\/[^/]+\/terms\/[^/]+$/.test(routePath)
    },
    {
        method: "DELETE", path: "post/taxonomies/*/terms/*", handler: deleteTermApi,
        match: (_route, routePath) => /^post\/taxonomies\/[^/]+\/terms\/[^/]+$/.test(routePath)
    },
];

// ——— Optimized Route Resolution ———
// Exact-match routes → O(1) Map lookup
// Pattern routes (wildcard/regex) → separate array fallback

const exactRoutes = new Map<string, Map<string, EndpointRoute>>();
const patternRoutes: EndpointRoute[] = [];

for (const route of endpoints) {
    if (route.match || route.path.includes("*")) {
        patternRoutes.push(route);
    } else {
        if (!exactRoutes.has(route.method)) {
            exactRoutes.set(route.method, new Map());
        }
        exactRoutes.get(route.method)!.set(route.path, route);
    }
}

const knownParamPrefixes = [
    { prefix: "pages/", idx: 1 },
    { prefix: "posts/", idx: 1 },
    { prefix: "products/", idx: 1 },
    { prefix: "orders/", idx: 1 },
    { prefix: "menus/", idx: 1 },
    { prefix: "users/", idx: 1 },
    { prefix: "media/gallery/", idx: 2 },
    { prefix: "gallery/", idx: 1 },
    { prefix: "media/portfolios/", idx: 2 },
    { prefix: "portfolios/", idx: 1 },
    { prefix: "media/", idx: 1 },
    { prefix: "post/testimonials/", idx: 2 },
    { prefix: "post/taxonomies/", idx: 2 },
    { prefix: "admin/sites/", idx: 2 },
    { prefix: "admin/subscriptions/", idx: 2 },
    { prefix: "admin/coupons/", idx: 2 },
];

function buildParams(id?: string, termId?: string) {
    return { params: Promise.resolve({ id, termId }) };
}

export function resolveEndpoint(req: Request, method: string, routePath: string, route: string[]) {
    // 1. O(1) exact match
    const matchedExact = exactRoutes.get(method)?.get(routePath);
    if (matchedExact) {
        return matchedExact.handler(req);
    }

    // 2. Pattern fallback (wildcard / regex routes)
    const matched = patternRoutes.find((endpoint) =>
        endpoint.method === method && endpoint.match?.(route, routePath)
    );

    if (!matched) {
        return new NextResponse("Not Found", { status: 404 });
    }

    // Taxonomy terms nested params
    if (/^post\/taxonomies\/[^/]+\/terms(\/[^/]+)?$/.test(routePath)) {
        return matched.handler(req, buildParams(route[2], route[4]));
    }

    // paramIndex from route definition
    if (matched.paramIndex !== undefined) {
        return matched.handler(req, buildParams(route[matched.paramIndex]));
    }

    // Fallback: known prefix patterns
    for (const { prefix, idx } of knownParamPrefixes) {
        if (routePath.startsWith(prefix)) {
            return matched.handler(req, buildParams(route[idx]));
        }
    }

    return matched.handler(req);
}
