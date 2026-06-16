import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/settings/site";
import { getMenu } from "@/lib/content/menus";

export default async function PagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // For SaaS pages, we use default settings (root domain doesn't have a siteId)
    const settings = await getSiteSettings();
    
    // We can fetch a specific "saas-main" menu if it exists, 
    // or just pass the default "main" if it's configured for the platform.
    const [mainMenu, footerMenu] = await Promise.all([
        getMenu("main"),
        getMenu("footer")
    ]);

    return (
        <div className="flex flex-col min-h-screen bg-[#FAFAFA]">
            <Header 
                initialSettings={settings} 
                initialMenuItems={mainMenu?.items || []} 
                isTenant={false}
            />
            <main className="flex-grow">
                {children}
            </main>
            <Footer 
                initialSettings={settings} 
                initialMenuItems={footerMenu?.items || []} 
                isTenant={false}
            />
        </div>
    );
}
