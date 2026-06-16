"use client";

import React, { useState } from "react";
import { X, Mail, User, Shield, Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";

export default function AddUserModal({ isOpen, onClose, onAdd }: { 
    isOpen: boolean, 
    onClose: () => void,
    onAdd: (_data: any) => Promise<void>
}) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("user");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd({ email, name, role });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                setEmail("");
                setName("");
            }, 2500);
        } catch (_) {
            alert("Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Create New Platform User</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {success ? (
                        <div className="py-10 text-center space-y-4 animate-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">User Created Successfully!</h4>
                                <p className="text-xs text-muted-foreground mt-1">The account is now active and ready for login.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Security Note</p>
                                    <p className="text-[10px] text-amber-700 leading-relaxed">
                                        The user will be created with the default password: <code className="bg-amber-200/50 px-1 rounded font-bold">change-me</code>. 
                                        Please instruct the user to update their password immediately after logging in.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="add-user-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <input 
                                        id="add-user-name"
                                        name="name"
                                        type="text" 
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="add-user-email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <input 
                                        id="add-user-email"
                                        name="email"
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="add-user-role" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Assigned Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <select 
                                        id="add-user-role"
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    >
                                        <option value="user">Standard User</option>
                                        <option value="editor">Content Editor</option>
                                        <option value="owner">Site Owner</option>
                                        <option value="admin">Platform Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    {loading ? "Creating Account..." : "Create Account"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
