import { Loader2 } from "lucide-react";

/**
 * Global Dashboard Loading State
 * Handles transitions between major dashboard sections.
 */
export default function DashboardLoading() {
    return (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-1000">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                <Loader2 className="relative animate-spin text-primary mb-4" size={48} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center space-y-1">
                <span className="text-sm font-bold text-foreground opacity-80">
                    Menyiapkan Studio
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                    Memuat Modul Antarmuka
                </span>
            </div>
        </div>
    );
}
