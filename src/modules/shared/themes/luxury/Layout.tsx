import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ThemeClientUtilities } from "@/modules/site";
import LuxuryStyles from "./LuxuryStyles";

/**
 * Luxury Dark Theme Layout.
 * This theme features a sophisticated dark palette, generous whitespace,
 * and a premium aesthetic.
 */
export default function LuxuryLayout({
  children,
  settings,
  mainMenu,
  footerMenu,
  isTenant,
  hideHeader,
  hideFooter,
}: {
  children: React.ReactNode;
  settings: any;
  mainMenu: any;
  footerMenu: any;
  isTenant?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0b] text-[#e1e1e3] selection:bg-indigo-500/30">
      <LuxuryStyles />
      {/* Luxury Style Header */}
      {!hideHeader && (
        <div className="border-b border-white/5 py-2">
          <Header 
            initialSettings={{
              ...settings,
              headerBackgroundColor: "transparent",
              headerTextColor: "#ffffff"
            }} 
            initialMenuItems={mainMenu?.items || []} 
            isTenant={isTenant}
          />
        </div>
      )}

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Luxury Style Footer */}
      {!hideFooter && (
        <div className="bg-[#050505] border-t border-white/5 pt-16 pb-8">
          <Footer
            initialSettings={settings}
            initialMenuItems={footerMenu?.items || []}
            isTenant={isTenant}
          />
        </div>
      )}

      <ThemeClientUtilities settings={settings} />
    </div>
  );
}
