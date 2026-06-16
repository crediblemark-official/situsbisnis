"use client";

import { useState, useEffect } from "react";
import { SiteSettings } from "@/modules/tenant/services/site-settings.service";

export function usePlatformSettings() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/settings", { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch platform settings", err);
                setLoading(false);
            });
    }, []);

    return { settings, loading };
}
