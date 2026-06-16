"use client";

import React, { useState, useMemo } from "react";
import {
    Plus
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TableContainer, THead, TBody, TR, TH } from "@/components/ui/Table";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string | Date;
    referralCode?: string | null;
    _count?: { referrals: number };
}

import { UserFilters } from "@/components/dashboard/users/UserFilters";
import { UserTableRow } from "@/components/dashboard/users/UserTableRow";

export default function UserList({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
                (user.email || "").toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const handleDelete = async () => {
        if (!userToDelete) return;
        const id = userToDelete.id;

        setLoadingId(id);
        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            } else {
                const err = await res.json();
                alert(err.message || "Failed to delete user");
            }
        } catch (_) {
            alert("Network error occurred");
        } finally {
            setLoadingId(null);
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        setLoadingId(id);
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
            } else {
                alert("Failed to update role");
            }
        } catch (_) {
            alert("Network error");
        } finally {
            setLoadingId(null);
        }
    };

    const handleInvite = async (data: any) => {
        const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed");

        const result = await res.json();
        setUsers(prev => [{
            ...result.user,
            createdAt: new Date().toISOString(),
            _count: { posts: 0 }
        }, ...prev]);
    };

    const handleUpdate = async (id: string, data: any) => {
        const res = await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Update failed");
        }

        await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6 text-foreground">
            <PageHeader
                title="Daftar Pengguna"
                subtitle="Manajemen identitas dan otorisasi peran di seluruh platform."
            >
                <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/10"
                >
                    <Plus size={12} /> Tambah Pengguna
                </button>
            </PageHeader>

            {/* Filters Bar */}
            <UserFilters 
                search={search}
                onSearchChange={setSearch}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
            />

            {/* Users Table */}
            <TableContainer>
                <THead>
                    <TR>
                        <TH>Identitas</TH>
                        <TH>Peran</TH>
                        <TH>Status</TH>
                        <TH>Afiliasi</TH>
                        <TH>Bergabung</TH>
                        <TH align="right">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {filteredUsers.map((user) => (
                        <UserTableRow 
                            key={user.id}
                            user={user}
                            loadingId={loadingId}
                            onRoleChange={handleRoleChange}
                            onDeleteClick={(u) => {
                                setUserToDelete(u);
                                setShowDeleteModal(true);
                            }}
                            onEditClick={(u) => {
                                setSelectedUser(u);
                                setIsEditUserOpen(true);
                            }}
                        />
                    ))}
                </TBody>
            </TableContainer>

            {/* Modals */}
            <AddUserModal
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onAdd={handleInvite}
            />

            <EditUserModal
                isOpen={isEditUserOpen}
                onClose={() => {
                    setIsEditUserOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onUpdate={handleUpdate}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Pengguna?"
                message="Are you absolutely sure? This user will be permanently removed from the platform."
                confirmText="Ya, Hapus Permanen"
                variant="danger"
            />
        </div>
    );
}
