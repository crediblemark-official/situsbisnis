"use client";

import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/components/shop/CartDrawer"), { ssr: false });
const FloatingChat = dynamic(() => import("@/components/ui/FloatingChat"), { ssr: false });

export default function ThemeClientUtilities({ settings }: { settings: any }) {
    return (
        <>
            <CartDrawer brandColor={settings?.brandColor} />
            <FloatingChat settings={settings} />
        </>
    );
}
