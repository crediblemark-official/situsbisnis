"use client";

import { useState } from "react";
import { registerDomainAction, verifyDomainAction, removeDomainAction } from "../actions/domain.actions";

interface DomainSettingsProps {
    siteId: string;
    currentDomain?: string | null;
    isVerified?: boolean;
}

export function DomainSettings({ siteId, currentDomain, isVerified }: DomainSettingsProps) {
    const [domain, setDomain] = useState(currentDomain || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    async function handleRegister() {
        setLoading(true);
        setMessage(null);
        const result = await registerDomainAction(siteId, domain);
        setMessage(result.message || result.error || "Unknown error");
        setLoading(false);
    }

    async function handleVerify() {
        setLoading(true);
        setMessage(null);
        const result = await verifyDomainAction(siteId, domain);
        setMessage(result.message || result.error || "Unknown error");
        setLoading(false);
    }

    async function handleRemove() {
        setLoading(true);
        setMessage(null);
        const result = await removeDomainAction(siteId, domain);
        setMessage(result.message || result.error || "Unknown error");
        setLoading(false);
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pengaturan Domain Kustom</h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="contoh: tokoku.com"
                    className="flex-1 px-3 py-2 border rounded"
                    disabled={loading}
                />
            </div>
            <div className="flex gap-2">
                <button onClick={handleRegister} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
                    {loading ? "Memproses..." : "Daftarkan Domain"}
                </button>
                {currentDomain && (
                    <>
                        <button onClick={handleVerify} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
                            Verifikasi DNS
                        </button>
                        <button onClick={handleRemove} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded">
                            Hapus Domain
                        </button>
                    </>
                )}
            </div>
            {isVerified && <p className="text-green-600 text-sm">Domain telah terverifikasi</p>}
            {message && <p className="text-sm text-gray-700">{message}</p>}
        </div>
    );
}
