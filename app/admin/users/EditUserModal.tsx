"use client";

import React, { useState } from "react";
import { 
    X, 
    User, 
    Mail, 
    Shield, 
    Lock, 
    Loader2, 
    Save,
    AlertTriangle
} from "lucide-react";

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onUpdate: (_id: string, _data: any) => Promise<void>;
}

export default function EditUserModal({ isOpen, onClose, user, onUpdate }: EditUserModalProps) {
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [role, setRole] = useState(user?.role || "user");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Track previous user to reset state when it changes
    const [prevUser, setPrevUser] = useState(user);
    if (user !== prevUser) {
        setPrevUser(user);
        setName(user?.name || "");
        setEmail(user?.email || "");
        setRole(user?.role || "user");
        setPassword("");
        setError("");
    }

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await onUpdate(user.id, {
                name,
                email,
                role,
                password: password.trim() || undefined
            });
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Update Identity</h2>
                            <p className="text-[10px] text-muted-foreground font-medium">Modifying record for {user.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-all text-muted-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-2">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="edit-user-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={16} />
                                <input 
                                    id="edit-user-name"
                                    name="name"
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all"
                                    placeholder="Enter full name..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="edit-user-email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Identity</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={16} />
                                <input 
                                    id="edit-user-email"
                                    name="email"
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="edit-user-role" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Assigned Role</label>
                            <div className="relative group">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={16} />
                                <select 
                                    id="edit-user-role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all appearance-none cursor-pointer font-bold uppercase"
                                >
                                    <option value="admin">Platform Admin</option>
                                    <option value="owner">Site Owner</option>
                                    <option value="editor">Content Editor</option>
                                    <option value="user">Standard User</option>
                                </select>
                            </div>
                        </div>

                        {/* Password Reset Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="edit-user-password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Password Override</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={16} />
                                <input 
                                    id="edit-user-password"
                                    name="password"
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all"
                                    placeholder="Leave blank to keep current..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted/80 transition-all"
                        >
                            Cancel Changes
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Synchronize Identity
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
