"use client";

import React from "react";
import { Mail, Loader2, Trash2, Key } from "lucide-react";
import { TR, TD } from "@/components/ui/Table";

interface UserTableRowProps {
    user: any;
    loadingId: string | null;
    onRoleChange: (_id: string, _role: string) => void;
    onDeleteClick: (_user: any) => void;
    onEditClick: (_user: any) => void;
}

export function UserTableRow({ user, loadingId, onRoleChange, onDeleteClick, onEditClick }: UserTableRowProps) {
    return (
        <TR>
            <TD>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.name?.[0] || "?"}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">{user.name || "Anonymous"}</p>
                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Mail size={10} /> {user.email}
                        </p>
                    </div>
                </div>
            </TD>
            <TD>
                <select
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                    disabled={loadingId === user.id}
                    className="bg-muted/50 border border-border rounded-lg px-2 py-1 text-[10px] font-bold uppercase outline-none focus:border-primary transition-all disabled:opacity-50"
                >
                    <option value="admin">Admin Platform</option>
                    <option value="owner">Pemilik Situs</option>
                    <option value="editor">Editor Konten</option>
                    <option value="user">Pengguna Standar</option>
                </select>
            </TD>
            <TD>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-tight bg-emerald-500/10 text-emerald-500`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`} />
                    Aktif
                </div>
            </TD>
            <TD>
                {user.referralCode ? (
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit">{user.referralCode}</span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">{user._count?.referrals || 0} diajak</span>
                    </div>
                ) : (
                    <span className="text-[10px] text-muted-foreground italic">-</span>
                )}
            </TD>
            <TD>
                <p className="text-[11px] font-medium text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                </p>
            </TD>
            <TD align="right">
                <div className="flex items-center justify-end gap-2">
                    {loadingId === user.id ? (
                        <Loader2 className="animate-spin text-primary" size={16} />
                    ) : (
                        <>
                            <button
                                onClick={() => onDeleteClick(user)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                title="Delete User"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => onEditClick(user)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Edit User Identity"
                            >
                                <Key size={16} />
                            </button>
                        </>
                    )}
                </div>
            </TD>
        </TR>
    );
}
