"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Shield, Save } from "lucide-react";
import toast from "react-hot-toast";
import Portal from "@/components/ui/Portal";
import { Button } from "@/components/ui/Button";
import { FormInput, FormSelect } from "@/components/ui/Form";
import { createUserAction, updateUserAction } from "@/modules/auth/public-actions";

type UserData = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: UserData | null;
};

export default function UserModal({ isOpen, onClose, onSuccess, initialData }: Props) {
    const [name, setName] = useState(initialData?.name || "");
    const [email, setEmail] = useState(initialData?.email || "");
    const [role, setRole] = useState(initialData?.role || "user");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Track previous initialData to reset state when it changes
    const [prevInitialData, setPrevInitialData] = useState(initialData);

    if (initialData !== prevInitialData) {
        setPrevInitialData(initialData);
        setName(initialData?.name || "");
        setEmail(initialData?.email || "");
        setRole(initialData?.role || "user");
        setPassword("");
    }

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const isEditing = !!initialData;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const body = { name, email, role, password };
            const data = isEditing
                ? await updateUserAction(initialData.id, body)
                : await createUserAction(body);

            if (data.success) {
                toast.success(isEditing ? "Pengguna berhasil diperbarui" : "Pengguna berhasil ditambahkan");
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || "Gagal menyimpan data pengguna");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem saat menyimpan");
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                <div className="w-full max-w-md h-screen bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out relative">
                {/* Header Area */}
                <div className="relative px-6 py-4 border-b border-border">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60"></div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black text-foreground">
                                {isEditing ? "Edit Pengguna" : "Tambah Pengguna"}
                            </h3>
                            <p className="text-[11px] text-primary font-bold mt-1">
                                Kelola hak akses tim
                            </p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2 space-y-4 custom-scrollbar">
                    <div className="space-y-4">
                        <FormInput 
                            label="Nama Lengkap" 
                            name="name" 
                            required
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Masukkan nama lengkap..." 
                            icon={<User size={16} />}
                        />
                        <FormInput 
                            label="Email" 
                            name="email" 
                            type="email"
                            required
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="email@example.com" 
                            icon={<Mail size={16} />}
                        />
                        <FormSelect 
                            label="Hak Akses" 
                            name="role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            options={[
                                { label: "Staf", value: "user" },
                                { label: "Editor", value: "editor" },
                                { label: "Pemilik", value: "owner" }
                            ]}
                        />
                        <div className="pt-2">
                            <FormInput 
                                label={isEditing ? "Ganti Password (Opsional)" : "Password"} 
                                name="password" 
                                type="password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder={isEditing ? "Kosongkan jika tidak diubah" : "Masukkan password..."} 
                                icon={<Shield size={16} />}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer Area */}
                <div className="px-6 py-4 border-t border-border bg-muted/5">
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            onClick={(e) => {
                                e.preventDefault();
                                handleSubmit(e as any);
                            }}
                            className="flex-[2]"
                            icon={<Save size={14} />}
                        >
                            {isEditing ? "Simpan Perubahan" : "Tambah Pengguna"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </Portal>
);
}
