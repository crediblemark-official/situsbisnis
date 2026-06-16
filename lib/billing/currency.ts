
/**
 * Utility for unified currency formatting across server and client components.
 */

const CURRENCY_MAP: Record<string, { symbol: string; locale: string; decimals: number }> = {
    USD: { symbol: "$", locale: "en-US", decimals: 2 },
    IDR: { symbol: "Rp ", locale: "id-ID", decimals: 0 },
    EUR: { symbol: "€", locale: "de-DE", decimals: 2 },
    GBP: { symbol: "£", locale: "en-GB", decimals: 2 },
    SGD: { symbol: "S$", locale: "en-SG", decimals: 2 },
    AUD: { symbol: "A$", locale: "en-AU", decimals: 2 },
};

export function getCurrencySymbol(code: string = "USD"): string {
    return CURRENCY_MAP[code.toUpperCase()]?.symbol || code;
}

export function formatPrice(price: any, code: string = "USD"): string {
    const numPrice = typeof price === "number" ? price : parseFloat(price?.toString() || "0");
    const config = CURRENCY_MAP[code.toUpperCase()] || CURRENCY_MAP.USD;

    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: code.toUpperCase(),
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
    }).format(numPrice);
}
