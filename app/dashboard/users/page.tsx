"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Shield, User as UserIcon, Plus, Edit, Trash2, Users as UsersIcon, UserCheck, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import UserModal from "./UserModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { 
    TableContainer, 
    THead, 
    TBody, 
    TR, 
    TH, 
    TD 
} from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/Stats";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

type User = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    image: string | null;
    _count?: {
        posts: number;
    }
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = React.useCallback(async (shouldSetLoading = false) => {
        if (shouldSetLoading) setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let ignore = false;
        
        async function fetchInitial() {
            try {
                const res = await fetch("/api/users");
                if (res.ok) {
                    const data = await res.json();
                    if (!ignore) {
                        setUsers(data.users || []);
                        setLoading(false);
                    }
                }
            } catch (e) {
                if (!ignore) {
                    console.error("Failed to load users", e);
                    setLoading(false);
                }
            }
        }

        fetchInitial();
        return () => { ignore = true; };
    }, []);

    function handleEdit(user: User) {
        setSelectedUser(user);
        setIsModalOpen(true);
    }

    function handleCreate() {
        setSelectedUser(null);
        setIsModalOpen(true);
    }

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        editors: users.filter(u => u.role === 'editor').length,
        users: users.filter(u => u.role === 'user').length,
    };

    return (
        <>
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUsers}
                initialData={selectedUser}
            />

            <div className="w-full animate-in fade-in duration-1000 space-y-6">
                <PageHeader 
                    title="Anggota Tim" 
                    subtitle="Kelola hak akses dan peran tim Anda."
                    icon={<UsersIcon />}
                >
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                    >
                        <Plus size={16} /> Tambah Tim
                    </button>
                </PageHeader>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Tim"
                        value={loading ? "..." : stats.total}
                        icon={<UsersIcon size={20} />}
                        description="Jumlah anggota terdaftar"
                    />
                    <StatCard
                        title="Admin"
                        value={loading ? "..." : stats.admins}
                        icon={<Shield size={20} />}
                        description="Akses penuh platform"
                    />
                    <StatCard
                        title="Editor"
                        value={loading ? "..." : stats.editors}
                        icon={<UserCheck size={20} />}
                        description="Pengelola konten"
                    />
                    <StatCard
                        title="Staf"
                        value={loading ? "..." : stats.users}
                        icon={<UserIcon size={20} />}
                        description="Akses terbatas"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Daftar Tim</h3>
                        <div className="w-full max-w-sm">
                            <SearchInput
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Cari tim..."
                            />
                        </div>
                    </div>

                    <TableContainer>
                        <THead>
                            <TR>
                                <TH>Nama</TH>
                                <TH>Peran</TH>
                                <TH align="center">Kontribusi</TH>
                                <TH align="right">Aksi</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TR key={i}>
                                        <TD><div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-2xl" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></TD>
                                        <TD><Skeleton className="h-8 w-24 rounded-xl" /></TD>
                                        <TD align="center"><Skeleton className="h-6 w-12" /></TD>
                                        <TD align="right"><Skeleton className="h-10 w-28 rounded-xl" /></TD>
                                    </TR>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <TR>
                                    <TD colSpan={4} className="py-20">
                                        <EmptyState
                                            icon={<ShieldAlert size={48} className="opacity-10 mb-4" />}
                                            message="Anggota tim tidak ditemukan."
                                        />
                                    </TD>
                                </TR>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TR key={user.id} className="group/row">
                                        <TD>
                                            <div className="flex items-center gap-3 py-1">
                                                <div className="w-10 h-10 rounded-2xl bg-muted/5 flex items-center justify-center text-foreground overflow-hidden border border-border group-hover/row:border-primary/50 transition-all relative shadow-inner">
                                                    {user.image ? (
                                                        <Image src={user.image} alt={user.name || "User"} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover transition-transform duration-700 group-hover/row:scale-110" />
                                                    ) : (
                                                        <span className="font-black text-xs opacity-40">{(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}</span>
                                                    )}
                                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-foreground tracking-tight uppercase group-hover/row:text-primary transition-colors">{user.name || "Tanpa Nama"}</div>
                                                    <div className="text-[9px] text-muted-foreground font-medium mt-1 opacity-60 italic">{user.email}</div>
                                                </div>
                                            </div>
                                        </TD>
                                        <TD>
                                            <StatusBadge
                                                type={user.role === 'admin' ? "secondary" : user.role === 'editor' ? "info" : user.role === 'owner' ? "secondary" : "neutral"}
                                                label={
                                                    user.role === 'admin' ? "Pengawas" :
                                                    user.role === 'owner' ? "Pemilik" :
                                                    user.role === 'editor' ? "Editor" :
                                                    "Staf"
                                                }
                                            />
                                        </TD>
                                        <TD align="center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-foreground">{user._count?.posts || 0}</span>
                                                <span className="text-[8px] text-muted-foreground/40 font-black uppercase tracking-tighter">Artikel</span>
                                            </div>
                                        </TD>
                                        <TD align="right">
                                            <div className="flex justify-end gap-1.5 items-center opacity-0 group-hover/row:opacity-100 transition-all transform group-hover/row:translate-x-0 translate-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 bg-muted/20 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all border border-border hover:border-primary/20"
                                                    title="Edit Identity"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <ConfirmActionButton
                                                    icon={<Trash2 size={14} />}
                                                    title="Revoke Access"
                                                    confirmTitle="Hapus Pengguna?"
                                                    confirmMessage="Hapus pengguna ini? Tindakan ini tidak bisa dibatalkan."
                                                    confirmText="Ya, Hapus"
                                                    variant="danger"
                                                    onConfirm={async () => {
                                                        try {
                                                            const res = await fetch(`/api/users/${user.id}`, {
                                                                method: "DELETE",
                                                            });
                                                            if (res.ok) {
                                                                toast.success("Anggota tim berhasil dihapus");
                                                                fetchUsers();
                                                            } else {
                                                                const data = await res.json();
                                                                toast.error(data.error || "Gagal menghapus anggota tim");
                                                            }
                                                        } catch {
                                                            toast.error("Terjadi kesalahan saat menghapus");
                                                        }
                                                    }}
                                                    className="p-1.5 bg-muted/20 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all border border-border hover:border-destructive/20"
                                                />
                                            </div>
                                        </TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </TableContainer>
                </div>
            </div>
        </>
    );
}