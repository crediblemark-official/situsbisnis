
/**
 * Utility to serialize Prisma objects into plain objects that can be passed
 * from Server Components to Client Components.
 * Handles Decimal types (converts to string) and Date types (converts to string/ISO).
 */
export function serializeProduct(product: any) {
    if (!product) return null;

    // Extract variants from metaData if not present on model
    const metaVariants = product.metaData?.find((m: any) => m.key === "variants_json")?.value;
    const metaOptions = product.metaData?.find((m: any) => m.key === "variant_options_json")?.value;

    return {
        ...product,
        // Parse variants from metadata if they exist
        variants: metaVariants ? JSON.parse(metaVariants) : product.variants || [],
        variantOptions: metaOptions ? JSON.parse(metaOptions) : product.variantOptions || [],
        // Convert Decimal to string
        price: product.price?.toString() || "0",
        originalPrice: product.originalPrice ? product.originalPrice.toString() : null,
        // Convert Dates to ISO strings
        createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : undefined,
        updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
        // Convert seoMeta Dates to plain strings
        seoMeta: product.seoMeta ? {
            ...product.seoMeta,
            updatedAt: product.seoMeta.updatedAt ? new Date(product.seoMeta.updatedAt).toISOString() : undefined
        } : null
    };
}

export function serializeProducts(products: any[]) {
    return products.map(serializeProduct);
}


export function serializeOrder(order: any) {
    if (!order) return null;

    return {
        ...order,
        total: order.total?.toString() || "0",
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
        // Also serialize items if they exist
        items: order.items ? order.items.map((item: any) => ({
            ...item,
            price: item.price?.toString() || "0"
        })) : undefined
    };
}

export function serializeOrders(orders: any[]) {
    return orders.map(serializeOrder);
}

export function serializeTransaction(tx: any) {
    if (!tx) return null;
    return {
        ...tx,
        amount: tx.amount ? Number(tx.amount) : 0,
        createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : undefined,
        updatedAt: tx.updatedAt ? new Date(tx.updatedAt).toISOString() : undefined,
        // Jika menyertakan relasi plan
        plan: tx.plan ? {
            ...tx.plan,
            price: tx.plan.price ? Number(tx.plan.price) : 0,
        } : null,
    };
}

export function serializeTransactions(transactions: any[]) {
    return transactions.map(serializeTransaction);
}


