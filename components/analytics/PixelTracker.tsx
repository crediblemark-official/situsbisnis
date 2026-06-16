"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────
interface PixelTrackerProps {
  metaPixelId?: string | null;
  tiktokPixelId?: string | null;
}

interface EventMetadata {
  value?: number;
  currency: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
  search_string?: string;
  num_items?: number;
}

type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "Search"
  | "Contact"
  | "CompleteRegistration";

// ─── Globals ─────────────────────────────────────────────────────────
// Track recently fired events to prevent duplicate triggers within a short window
const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 1500;

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function shouldFireEvent(eventKey: string): boolean {
  const now = Date.now();
  const lastFired = recentEvents.get(eventKey);
  if (lastFired && now - lastFired < DEDUP_WINDOW_MS) return false;
  recentEvents.set(eventKey, now);

  // Prune old entries periodically
  if (recentEvents.size > 50) {
    for (const [key, ts] of recentEvents) {
      if (now - ts > DEDUP_WINDOW_MS * 2) recentEvents.delete(key);
    }
  }
  return true;
}

// ─── Component ───────────────────────────────────────────────────────
export default function PixelTracker({ metaPixelId, tiktokPixelId }: PixelTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // ── Helper: Fire pixel events with dedup ──
  const fireEvent = useCallback(
    (event: StandardEvent, params?: Partial<EventMetadata>) => {
      const eventId = generateEventId();
      const eventKey = `${event}:${params?.content_name || ""}:${params?.value || ""}`;
      if (!shouldFireEvent(eventKey)) return;

      // Clean undefined fields so SDKs don't see undefined values
      const cleanParams = params
        ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
        : undefined;

      try {
        if (metaPixelId && (window as any).fbq) {
          (window as any).fbq("track", event, cleanParams, { eventID: eventId });
        }
        if (tiktokPixelId && (window as any).ttq) {
          if (event === "PageView") {
            (window as any).ttq.page();
          } else {
            (window as any).ttq.track(event, cleanParams);
          }
        }
      } catch (err) {
        console.warn(`[Pixel:${event}]`, err);
      }
    },
    [metaPixelId, tiktokPixelId]
  );

  // ── 1. SPA Route Transition Tracking ──
  // Skip the initial render (SDK base code already fires PageView on load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fireEvent("PageView");
  }, [pathname, searchParams, fireEvent]);

  // ── 2. Automatic ViewContent on Product Detail Pages ──
  useEffect(() => {
    // Pattern: /products/[slug] or /shop/[productId]
    const isProductPage =
      /^\/products\/[^/]+$/.test(pathname) || /^\/shop\/[^/]+$/.test(pathname);
    if (!isProductPage) return;

    // Extract product metadata from structured data or DOM
    const getPageProductData = (): Partial<EventMetadata> => {
      const meta: Partial<EventMetadata> = { content_type: "product", currency: "IDR" };

      // Try JSON-LD structured data first
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        try {
          const data = JSON.parse(jsonLd.textContent || "");
          if (data.name) meta.content_name = data.name;
          if (data.offers?.price) meta.value = parseFloat(data.offers.price);
          if (data.offers?.priceCurrency) meta.currency = data.offers.priceCurrency;
          if (data.sku) meta.content_ids = [data.sku];
          return meta;
        } catch { /* fall through to DOM parsing */ }
      }

      // Fallback: read from DOM data attributes
      const container = document.querySelector("[data-pixel-name]");
      if (container) {
        meta.content_name = container.getAttribute("data-pixel-name") || undefined;
        const priceAttr = container.getAttribute("data-pixel-price");
        if (priceAttr) meta.value = parseFloat(priceAttr);
      }

      // Ultimate fallback: page title
      if (!meta.content_name) {
        const h1 = document.querySelector("h1");
        if (h1) meta.content_name = h1.textContent?.trim();
      }

      return meta;
    };

    // Slight delay to let CSR render product data into DOM
    const timer = setTimeout(() => {
      fireEvent("ViewContent", getPageProductData());
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, fireEvent]);

  // ── 3. Purchase Tracking on Checkout Success ──
  useEffect(() => {
    if (!pathname.startsWith("/checkout/success")) return;

    const orderId = searchParams?.get("orderId");
    fireEvent("Purchase", {
      content_type: "product",
      content_ids: orderId ? [orderId] : undefined,
      currency: "IDR",
    });
  }, [pathname, searchParams, fireEvent]);

  // ── 4. Search Event ──
  useEffect(() => {
    const query = searchParams?.get("q") || searchParams?.get("query");
    if (!query) return;

    if (pathname.includes("/search") || pathname.includes("/shop")) {
      fireEvent("Search", { search_string: query });
    }
  }, [pathname, searchParams, fireEvent]);

  // ── 5. Intelligent Click & Form Delegation ──
  useEffect(() => {
    // --- Product metadata extraction from DOM context ---
    const getProductMetadata = (element: HTMLElement): Partial<EventMetadata> => {
      const meta: Partial<EventMetadata> = { currency: "IDR", content_type: "product" };

      // Priority 1: Explicit data attributes on element or ancestor
      const priceEl = element.closest("[data-pixel-price]") || element;
      const nameEl = element.closest("[data-pixel-name]") || element;
      const dataPrice = priceEl.getAttribute("data-pixel-price");
      const dataName = nameEl.getAttribute("data-pixel-name");

      if (dataPrice) {
        const parsed = parseFloat(dataPrice);
        if (!isNaN(parsed)) meta.value = parsed;
      }
      if (dataName) {
        meta.content_name = dataName;
      }

      // Priority 2: Look for product card ancestor with structured content
      if (!meta.value || !meta.content_name) {
        const card = element.closest("[data-product-id], .product-card, article");
        if (card) {
          if (!meta.content_name) {
            const title = card.querySelector("h2, h3, h4, [data-product-name]");
            if (title) meta.content_name = title.textContent?.trim();
          }
          if (!meta.value) {
            const priceTag = card.querySelector("[data-product-price], .price, .product-price");
            if (priceTag) {
              const priceText = priceTag.textContent || "";
              const match = priceText.match(/(?:Rp|IDR|\$)\s?([\d.,]+)/i);
              if (match?.[1]) {
                const cleaned = match[1].replace(/\./g, "").replace(",", ".");
                const val = parseFloat(cleaned);
                if (!isNaN(val)) meta.value = val;
              }
            }
          }
          const productId = card.getAttribute("data-product-id");
          if (productId) meta.content_ids = [productId];
        }
      }

      // Priority 3: Regex fallback on the clicked element's own text
      if (!meta.value) {
        const text = element.textContent || "";
        const priceMatch = text.match(/(?:Rp|IDR|\$)\s?([\d.,]+)/i);
        if (priceMatch?.[1]) {
          const cleaned = priceMatch[1].replace(/\./g, "").replace(",", ".");
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) meta.value = parsed;
        }
      }

      return meta;
    };

    // --- Keyword matching helpers ---
    const matchesAny = (text: string, keywords: string[]) =>
      keywords.some((kw) => text.includes(kw));

    // --- Click handler ---
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        "a, button, [role='button'], input[type='submit']"
      ) as HTMLElement | null;
      if (!target) return;

      // Priority 1: Explicit event override via data attribute
      const explicitEvent = target.getAttribute("data-pixel-event") as StandardEvent | null;
      if (explicitEvent) {
        const metadata = getProductMetadata(target);
        fireEvent(explicitEvent, metadata);
        return;
      }

      const text = (target.textContent || "").trim().toLowerCase();
      const href = (target.getAttribute("href") || "").toLowerCase();

      // Classify the interaction
      const isCheckout = matchesAny(href, ["checkout"]) ||
        matchesAny(text, ["checkout", "bayar", "beli sekarang", "pesan sekarang"]);

      const isWhatsApp = matchesAny(href, ["wa.me", "whatsapp"]) ||
        matchesAny(text, ["whatsapp", "hubungi via wa", "hubungi kami"]);

      const isAddToCart = matchesAny(text, ["keranjang", "tambah ke", "add to cart", "masukkan"]) ||
        matchesAny(href, ["lynk.id"]);

      const isLead = matchesAny(text, ["daftar", "register", "mulai gratis", "coba gratis", "langganan"]);

      const isContact = matchesAny(text, ["hubungi", "kontak", "contact"]) &&
        !isWhatsApp;

      const metadata = getProductMetadata(target);

      if (isCheckout) {
        fireEvent("InitiateCheckout", metadata);
      } else if (isAddToCart) {
        fireEvent("AddToCart", metadata);
      } else if (isWhatsApp) {
        // WhatsApp is both a Lead and a Contact
        fireEvent("Contact", { content_name: text });
        fireEvent("Lead", { content_name: text });
      } else if (isContact) {
        fireEvent("Contact", { content_name: text });
      } else if (isLead) {
        fireEvent("Lead", { content_name: text });
      }
    };

    // --- Form submission handler ---
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!form) return;

      // Only fire on valid form submission
      if (form.checkValidity && !form.checkValidity()) return;

      // Explicit event override on form
      const explicitEvent = form.getAttribute("data-pixel-event") as StandardEvent | null;
      if (explicitEvent) {
        fireEvent(explicitEvent);
        return;
      }

      const action = (form.getAttribute("action") || "").toLowerCase();
      const formId = (form.getAttribute("id") || "").toLowerCase();
      const formClasses = (form.getAttribute("class") || "").toLowerCase();

      // Checkout form
      if (action.includes("checkout") || formId.includes("checkout")) {
        fireEvent("InitiateCheckout");
        return;
      }

      // Registration form
      if (formId.includes("register") || formId.includes("signup") ||
          formClasses.includes("register") || action.includes("register")) {
        fireEvent("CompleteRegistration");
        return;
      }

      // Newsletter / contact / generic lead form
      const hasEmailField = form.querySelector('input[type="email"], input[name*="email"]');
      const hasPhoneField = form.querySelector('input[type="tel"], input[name*="phone"], input[name*="telepon"]');

      if (hasEmailField || hasPhoneField) {
        fireEvent("Lead", {
          content_name: formId || form.getAttribute("name") || "form_submission",
        });
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [fireEvent]);

  return null;
}
