import React from "react";
import { User, Phone, Mail, MapPin } from "lucide-react";

interface CheckoutFormProps {
    brandColor: string;
    formData: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        zip: string;
    };
    onChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (_e: React.FormEvent) => void;
}

export function CheckoutForm({
    brandColor,
    formData,
    onChange,
    onSubmit,
}: CheckoutFormProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}12`, color: brandColor }}>
                    <MapPin size={15} />
                </div>
                Informasi Pengiriman
            </h2>
            
            <form id="checkout-form" onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="checkout-name" className="text-xs font-medium text-slate-600 block ml-0.5">Nama Lengkap</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                                <User size={15} style={{ color: brandColor }} />
                            </div>
                            <input
                                id="checkout-name"
                                type="text" name="name" required
                                placeholder="Contoh: Budi Sudarsono"
                                value={formData.name} onChange={onChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-normal text-slate-800 transition-all outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color-alpha)]"
                                style={{ 
                                    "--brand-color": brandColor, 
                                    "--brand-color-alpha": `${brandColor}15` 
                                } as React.CSSProperties}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label htmlFor="checkout-phone" className="text-xs font-medium text-slate-600 block ml-0.5">Nomor WhatsApp / HP</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                                <Phone size={15} style={{ color: brandColor }} />
                            </div>
                            <input
                                id="checkout-phone"
                                type="tel" name="phone" required
                                placeholder="Contoh: 081234567890"
                                value={formData.phone} onChange={onChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-normal text-slate-800 transition-all outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color-alpha)]"
                                style={{ 
                                    "--brand-color": brandColor, 
                                    "--brand-color-alpha": `${brandColor}15` 
                                } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="checkout-email" className="text-xs font-medium text-slate-600 block ml-0.5">Alamat Email</label>
                    <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                            <Mail size={15} style={{ color: brandColor }} />
                        </div>
                        <input
                            id="checkout-email"
                            type="email" name="email" required
                            placeholder="budi@example.com"
                            value={formData.email} onChange={onChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-normal text-slate-800 transition-all outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color-alpha)]"
                            style={{ 
                                "--brand-color": brandColor, 
                                "--brand-color-alpha": `${brandColor}15` 
                            } as React.CSSProperties}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="checkout-address" className="text-xs font-medium text-slate-600 block ml-0.5">Alamat Lengkap</label>
                    <div className="relative group">
                        <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-slate-700 transition-colors">
                            <MapPin size={15} style={{ color: brandColor }} />
                        </div>
                        <input
                            id="checkout-address"
                            type="text" name="address" required
                            placeholder="Jl. Raya Utama No. 123"
                            value={formData.address} onChange={onChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-normal text-slate-800 transition-all outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color-alpha)]"
                            style={{ 
                                "--brand-color": brandColor, 
                                "--brand-color-alpha": `${brandColor}15` 
                            } as React.CSSProperties}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="checkout-city" className="text-xs font-medium text-slate-600 block ml-0.5">Kota / Kabupaten</label>
                        <input
                            id="checkout-city"
                            type="text" name="city" required
                            placeholder="Jakarta Selatan"
                            value={formData.city} onChange={onChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-normal text-slate-800 transition-all outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color-alpha)]"
                            style={{ 
                                "--brand-color": brandColor, 
                                "--brand-color-alpha": `${brandColor}15` 
                            } as React.CSSProperties}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="checkout-zip" className="text-xs font-medium text-slate-600 block ml-0.5">Kode POS</label>
                        <input
                            id="checkout-zip"
                            type="text" name="zip" required
                            placeholder="12345"
                            value={formData.zip} onChange={onChange}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-normal text-slate-800 transition-all outline-none focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color-alpha)]"
                            style={{ 
                                "--brand-color": brandColor, 
                                "--brand-color-alpha": `${brandColor}15` 
                            } as React.CSSProperties}
                        />
                    </div>
                </div>

                {/* Checkbox persetujuan Syarat & Ketentuan serta Kebijakan Privasi */}
                <div className="flex items-start gap-3 pt-4 border-t border-slate-100 mt-4 animate-in fade-in duration-200">
                    <input
                        id="accept-terms"
                        type="checkbox"
                        required
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[var(--brand-color)] focus:ring-[var(--brand-color)] transition-colors cursor-pointer"
                        style={{ 
                            "--brand-color": brandColor, 
                        } as React.CSSProperties}
                    />
                    <label htmlFor="accept-terms" className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none font-normal">
                        Saya menyetujui{" "}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:underline hover:text-slate-900 transition-colors">
                            Syarat & Ketentuan
                        </a>{" "}
                        serta{" "}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:underline hover:text-slate-900 transition-colors">
                            Kebijakan Privasi
                        </a>{" "}
                        yang berlaku di website ini.
                    </label>
                </div>
            </form>
        </div>
    );
}
