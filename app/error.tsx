"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 max-w-md px-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    We encountered an unexpected error. Don&apos;t worry, our engineers have been notified.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 bg-[#2eaadc] text-white rounded-xl font-bold text-sm hover:bg-[#1a99cc] transition-all shadow-lg shadow-[#2eaadc]/20"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Return to Homepage
                    </button>
                </div>
            </div>
        </div>
    );
}
