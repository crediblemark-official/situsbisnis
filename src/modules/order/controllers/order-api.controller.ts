import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { OrderClient } from "../index";
import { validateCsrf } from "@/modules/shared/utils/csrf";
import { z } from "zod";
import { NextResponse } from "next/server";

const orderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number()
    })),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    paymentMethod: z.string().optional(),
});

/**
 * Endpoint POST untuk membuat pesanan (create order) baru.
 */
export async function createOrderApi(req: Request) {
    try {
        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return apiError("CSRF validation failed", 403);
        }

        const { session, siteId: ctxSiteId, error: authError, status: authStatus } = await getApiContext(undefined, { isPublic: true });
        if (authError) return apiError(authError, authStatus);

        const finalSiteId = ctxSiteId;
        if (!finalSiteId) return apiError("Site context required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, orderSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { items, name, email, address, city, zip, phone, paymentMethod } = data;

        const sessionCustomer = session?.user ? { name: session.user.name, email: session.user.email } : undefined;

        const result = await OrderClient.createOrder(
            finalSiteId,
            items,
            { name, email, address, city, zip, phone, paymentMethod },
            sessionCustomer
        );

        return apiResponse(result);
    } catch (error: any) {
        console.error("[CreateOrder]", error);
        if (error.message === "Email is required") {
            return apiError("Email is required", 400);
        }
        if (error.message.includes("Product not found")) {
            return apiError(error.message, 400);
        }
        const lowerMsg = error.message.toLowerCase();
        if (lowerMsg.includes("langganan") || lowerMsg.includes("limit")) {
            return apiError(error.message, 403);
        }
        return apiError("Internal Error");
    }
}

/**
 * Endpoint POST untuk menginisialisasi pembayaran pesanan.
 */
export async function initializeOrderPaymentApi(req: Request) {
    try {
        const body = await req.json();
        const { orderId, paymentMethod } = body;

        if (!orderId || !paymentMethod) {
            return NextResponse.json({ error: "orderId and paymentMethod are required" }, { status: 400 });
        }

        const host = req.headers.get("host") || "situsbisnis.com";
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const origin = `${protocol}://${host}`;

        const result = await OrderClient.initializeOrderPayment(orderId, paymentMethod, origin);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ORDER_PAYMENT_INIT_ERROR]", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Endpoint POST untuk mengambil metode pembayaran yang tersedia bagi pesanan.
 */
export async function getOrderPaymentMethodsApi(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        try {
            const { methods } = await OrderClient.getOrderPaymentMethods(orderId);
            return NextResponse.json({ methods });
        } catch (err: any) {
            const message = err.message;
            if (message === "Order not found") {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }
            if (message === "Payment settings not configured") {
                return NextResponse.json({ error: "Payment settings not configured" }, { status: 500 });
            }
            if (message.includes("Failed to fetch payment methods")) {
                console.warn("[SHOP_PAYMENT_METHODS] Failed to fetch from Duitku:", message);
                return NextResponse.json({ error: message }, { status: 502 });
            }
            throw err;
        }
    } catch (error: any) {
        console.error("[SHOP_PAYMENT_METHODS_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Endpoint POST untuk memeriksa status terbaru dari pesanan.
 */
export async function checkOrderStatusApi(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const result = await OrderClient.checkOrderStatus(orderId);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ORDER_CHECK_STATUS]", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * Endpoint POST untuk menerima webhook callback dari Duitku terkait pesanan.
 */
export async function processOrderWebhookApi(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let body: Record<string, any> = {};

        if (contentType.includes("application/json")) {
            body = await req.json();
        } else {
            const text = await req.text();
            const params = new URLSearchParams(text);
            body = Object.fromEntries(params.entries());
        }

        try {
            await OrderClient.processOrderWebhook(body);
        } catch (err: any) {
            const message = err.message;
            if (message === "Missing parameters") {
                return new NextResponse("Missing parameters", { status: 400 });
            }
            if (message === "Order not found") {
                return new NextResponse("Order not found", { status: 404 });
            }
            if (message === "Site payment not configured") {
                return new NextResponse("Site payment not configured", { status: 500 });
            }
            if (message === "Invalid Signature") {
                return new NextResponse("Invalid Signature", { status: 400 });
            }
            throw err;
        }

        return new NextResponse("OK", {
            status: 200,
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error) {
        console.error("[DUITKU_ORDER_CALLBACK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

/**
 * Endpoint GET untuk mengambil daftar pesanan.
 */
export async function getOrdersApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50")));

        const result = await OrderClient.getOrders(siteId, { skip: (page - 1) * limit, take: limit });
        return apiResponse(result);
    } catch (error) {
        console.error("[GET_ORDERS]", error);
        return apiError("Internal Error");
    }
}

/**
 * Endpoint GET untuk mengambil detail pesanan.
 */
export async function getOrderDetailApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Order ID required", 400);

        const order = await OrderClient.getOrderDetail(id, siteId);
        if (!order) return apiError("Order not found", 404);

        return apiResponse(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        return apiError("Internal Error");
    }
}

/**
 * Endpoint PATCH untuk memperbarui status pesanan.
 */
export async function updateOrderApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        const body = await req.json();
        const { paymentStatus, fulfillmentStatus, status: orderStatus } = body;

        const updateData: Record<string, string> = {};
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus;
        if (orderStatus) updateData.status = orderStatus;

        const updated = await OrderClient.updateOrderFulfillment(id, siteId, updateData);
        return apiResponse({ success: true, order: updated });
    } catch (error) {
        console.error("Error updating order:", error);
        return apiError("Internal Error");
    }
}
