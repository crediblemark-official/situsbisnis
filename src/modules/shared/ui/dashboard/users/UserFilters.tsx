"use client";

import React from "react";
import { Search, Filter } from "lucide-react";

interface UserFiltersProps {
    search: string;
    onSearchChange: (_val: string) => void;
    roleFilter: string;
    onRoleFilterChange: (_val: string) => void;
}

export function UserFilters({ search, onSearchChange, roleFilter, onRoleFilterChange }: UserFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-card border border-border p-4 rounded-2xl">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder="Cari pengguna berdasarkan nama atau email..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all"
                />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="text-muted-foreground" size={16} />
                <select
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value)}
                    className="bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold uppercase outline-none focus:border-primary transition-all cursor-pointer"
                >
                    <option value="all">Semua Peran</option>
                    <option value="admin">Admin Platform</option>
                    <option value="owner">Pemilik Situs</option>
                    <option value="editor">Editor Konten</option>
                    <option value="user">Pengguna Standar</option>
                </select>
            </div>
        </div>
    );
}
