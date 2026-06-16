/**
 * Shared UI styling constants for SitusBisnis dashboard components.
 * Prevents class string duplication and ensures consistent theming.
 */
export const UI_STYLES = {
  card: "bg-card md:rounded-md border-y md:border border-border/50 shadow-sm -mx-3 md:mx-0",
  cardGlass: "bg-card/50 backdrop-blur-md md:rounded-md border-y md:border border-border/50 shadow-xl -mx-3 md:mx-0",
  cardWithPadding: "bg-card py-6 md:rounded-md border-y md:border border-border/50 text-center w-full",

  badge: "inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",

  input: "w-full px-3 py-2 bg-muted/5 border border-border/50 rounded text-[11px] text-foreground font-medium outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50",

  buttonBase: "inline-flex items-center justify-center gap-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
  buttonPrimary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90",
  buttonSecondary: "bg-muted/10 text-foreground border border-border/50 hover:bg-muted/20",
  buttonGhost: "text-muted-foreground hover:text-foreground hover:bg-muted/10",
  buttonDanger: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:opacity-90",

  sectionHeader: "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2",
} as const;
