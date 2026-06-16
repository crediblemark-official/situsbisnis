import React from "react";
import dynamic from "next/dynamic";

const DefaultLayout = dynamic(() => import("@/themes/default/Layout"));
const LuxuryLayout = dynamic(() => import("@/themes/luxury/Layout"));


/**
 * Theme Layout Selector Component
 * Resolves the correct layout based on themeId.
 */
export function ThemeLayoutSelector({ 
  themeId = "default", 
  children,
  isTenant,
  hideHeader,
  hideFooter,
  ...props 
}: { 
  themeId?: string; 
  children: React.ReactNode;
  settings: any;
  mainMenu: any;
  footerMenu: any;
  isTenant?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
}) {
  switch (themeId) {
    case "luxury":
      return <LuxuryLayout isTenant={isTenant} hideHeader={hideHeader} hideFooter={hideFooter} {...props}>{children}</LuxuryLayout>;
    case "default":
    default:
      return <DefaultLayout isTenant={isTenant} hideHeader={hideHeader} hideFooter={hideFooter} {...props}>{children}</DefaultLayout>;
  }
}
