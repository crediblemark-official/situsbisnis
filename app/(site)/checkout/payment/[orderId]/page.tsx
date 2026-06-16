import { notFound } from "next/navigation";
import { db } from "@/lib/core/db";
import { ShopCheckoutPayment } from "@/components/site/checkout/ShopCheckoutPayment";

interface CheckoutPaymentPageProps {
    params: Promise<{ orderId: string }>;
}

export default async function CheckoutPaymentPage({ params }: CheckoutPaymentPageProps) {
    const { orderId } = await params;

    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            site: { select: { name: true } }
        }
    });

    if (!order) {
        notFound();
    }

    // Already paid → redirect to success
    if (order.paymentStatus === "paid" || order.paymentStatus === "approved") {
        const { redirect } = await import("next/navigation");
        redirect(`/checkout/success?orderId=${orderId}`);
    }

    // No payment URL means manual payment or other method
    if (!order.paymentUrl) {
        const { redirect } = await import("next/navigation");
        redirect(`/checkout/success?orderId=${orderId}`);
    }

    const platformName = process.env.NEXT_PUBLIC_APP_NAME || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "Platform";

    const serializedOrder = {
        id: order.id,
        amount: Number(order.total),
        paymentUrl: order.paymentUrl || null,
        paymentReference: order.paymentReference || null,
        customerName: order.customerName,
        siteName: order.site?.name || "",
        createdAt: order.createdAt.toISOString(),
    };

    return (
        <ShopCheckoutPayment
            order={serializedOrder}
            platformName={platformName}
        />
    );
}
