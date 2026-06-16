import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ThemeClientUtilities } from "@/modules/site";

/**
 * Default Theme Layout for SitusBisnis.
 * This is the fallback theme that replicates the original site structure.
 */
export default function DefaultLayout({
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
    <div className="flex flex-col min-h-screen">
      {!hideHeader && (
        <Header
          initialSettings={settings}
          initialMenuItems={mainMenu?.items || []}
          isTenant={isTenant}
        />
      )}
      <main className="flex-grow">
        {children}
      </main>
      {!hideFooter && (
        <Footer
          initialSettings={settings}
          initialMenuItems={footerMenu?.items || []}
          isTenant={isTenant}
        />
      )}
      <ThemeClientUtilities settings={settings} />
    </div>
  );
}
