"use client";

import { useState } from "react";
import { Save as SaveIcon, Lock as LockIcon, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { updateProfileAction } from "@/modules/auth/public-actions";

export function ProfileForm({ user }: { user: any }) {
    const router = useRouter();
    const { update } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Password baru tidak cocok" });
            setLoading(false);
            return;
        }

        if (newPassword && !currentPassword) {
            setMessage({ type: "error", text: "Password saat ini diperlukan untuk ganti password" });
            setLoading(false);
            return;
        }

        try {
            const data = await updateProfileAction({
                name,
                currentPassword,
                newPassword: newPassword || undefined
            });

            if (!data.success) {
                throw new Error(data.error || "Gagal memperbarui profil");
            }

            setMessage({ type: "success", text: "Profil berhasil diperbarui" });

            // Sync NextAuth session
            await update({ name });

            // Clear password fields
            const form = e.target as HTMLFormElement;
            form.querySelectorAll('input[type="password"]').forEach((input: any) => input.value = "");

            router.refresh();
        } catch (error: any) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sticky Action Bar */}
            <div className="sticky top-0 z-[40] bg-background/95 backdrop-blur-sm -mx-3 md:-mx-5 px-3 md:px-5 py-2.5 border-b border-border/50 flex items-center justify-between mb-6 transition-all duration-300">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="p-2 text-primary bg-primary/10 rounded-md">
                        <UserIcon size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight truncate max-w-[180px] md:max-w-none">
                            Profil Pengguna
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden md:block">
                            Kelola identitas dan keamanan akun
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="submit"
                        loading={loading}
                        icon={<SaveIcon size={14} />}
                        className="md:px-6 shadow-lg shadow-primary/20"
                    >
                        Simpan
                    </Button>
                </div>
            </div>

            {message.text && (
                <div className={`px-4 py-3 rounded-md text-[10px] font-black uppercase tracking-[0.2em] border animate-in slide-in-from-top-2 duration-500 ${message.type === "error"
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-card border border-border rounded-md overflow-hidden shadow-xl">
                {/* User Identity Banner */}
                <div className="p-4 bg-muted/20 border-b border-border flex items-center gap-5">
                    <div className="w-16 h-16 rounded-md bg-background border border-border flex items-center justify-center text-foreground text-2xl font-black shadow-inner">
                        {(user.name?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-base font-black text-foreground tracking-tighter uppercase leading-tight">{user.name || "Pengguna"}</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">{user.email}</p>
                        <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Public Identity */}
                        <div className="lg:col-span-1">
                            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Data Diri</h3>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium leading-relaxed opacity-70">Informasi publik akun Anda.</p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="profile-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nama Lengkap</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                                    <input
                                        id="profile-name"
                                        name="name"
                                        defaultValue={user.name || ""}
                                        className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-md focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-foreground transition-all font-bold text-xs placeholder:text-muted-foreground/30 shadow-sm"
                                        placeholder="Nama Anda"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</span>
                                <div className="relative group opacity-40">
                                    <input
                                        value={user.email}
                                        disabled
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-md text-muted-foreground cursor-not-allowed font-mono text-[11px] tracking-tight"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 h-px bg-border/50 my-2"></div>

                        {/* Security Section */}
                        <div className="lg:col-span-1">
                            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Keamanan</h3>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium leading-relaxed opacity-70">Kelola password dan akses akun.</p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="profile-current-password" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Password Saat Ini</label>
                                <div className="relative group">
                                    <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                                    <input
                                        id="profile-current-password"
                                        type="password"
                                        name="currentPassword"
                                        placeholder="Verifikasi password"
                                        className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-md focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-foreground transition-all font-mono text-xs placeholder:text-muted-foreground/30 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="profile-new-password" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Password Baru</label>
                                    <div className="relative group">
                                        <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                                        <input
                                            id="profile-new-password"
                                            type="password"
                                            name="newPassword"
                                            placeholder="Masukkan password baru"
                                            className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-md focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-foreground transition-all font-mono text-xs placeholder:text-muted-foreground/30 shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="profile-confirm-password" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ulangi Password Baru</label>
                                    <div className="relative group">
                                        <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                                        <input
                                            id="profile-confirm-password"
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Ulangi password baru"
                                            className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-md focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-foreground transition-all font-mono text-xs placeholder:text-muted-foreground/30 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
