"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
    }, []);

    if (!mounted) {
        return <div className="p-1.5 w-8 h-8"></div>;
    }

    return (
        <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 text-foreground hover:bg-muted/50 rounded transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun size={16} aria-hidden="true" />
            ) : (
                <Moon size={16} aria-hidden="true" />
            )}
        </button>
    );
}
