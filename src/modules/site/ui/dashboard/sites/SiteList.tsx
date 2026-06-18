"use client";

import React, { useState } from "react";
import { SiteCard } from "./SiteCard";
import { EmptyStateCard } from "./EmptyStateCard";
import { DomainModal } from "./DomainModal";

interface SiteListProps {
    initialSites: any[];
    rootDomain: string;
    isLimitReached: boolean;
}

export function SiteList({ initialSites, rootDomain, isLimitReached }: SiteListProps) {
    const [sites, setSites] = useState<any[]>(initialSites);
    const [activeSite, setActiveSite] = useState<any | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
        setActiveSite(null);
    };

    const handleOpenSettings = (site: any) => {
        setActiveSite(site);
        setIsOpen(true);
    };

    const handleDomainUpdated = (customDomain: string | null, customDomainVerified: boolean) => {
        if (!activeSite) return;

        // Update local state of sites list
        setSites(prevSites => prevSites.map(s => {
            if (s.id === activeSite.id) {
                return {
                    ...s,
                    customDomain,
                    customDomainVerified
                };
            }
            return s;
        }));

        // Update active site state
        setActiveSite(prev => prev ? {
            ...prev,
            customDomain,
            customDomainVerified
        } : null);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map((site) => (
                    <SiteCard 
                        key={site.id} 
                        site={site} 
                        rootDomain={rootDomain} 
                        onOpenSettings={handleOpenSettings} 
                    />
                ))}

                <EmptyStateCard isLimitReached={isLimitReached} />
            </div>

            {isOpen && activeSite && (
                <DomainModal 
                    isOpen={isOpen}
                    site={activeSite}
                    rootDomain={rootDomain}
                    onClose={handleClose}
                    onDomainUpdated={handleDomainUpdated}
                />
            )}
        </>
    );
}
