"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { sendFollowupEmailAction } from "../actions/notification.actions";

export function FollowupEmailForm() {
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        const res = await sendFollowupEmailAction(email, subject, message);
        setResult(res.success ? `Email berhasil dikirim (ID: ${res.id})` : res.error || "Gagal");
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Kirim Email Tindak Lanjut
                    </h3>
                </div>
                <div className="p-4 md:p-8 space-y-6 max-w-3xl">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Tujuan</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-border rounded bg-background text-xs"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subjek</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-border rounded bg-background text-xs"
                            placeholder="Pemberitahuan Penting"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pesan</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={5}
                            className="w-full px-3 py-2 border border-border rounded bg-background text-xs"
                            placeholder="Tulis pesan di sini..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-bold"
                    >
                        <Send size={14} />
                        {loading ? "Mengirim..." : "Kirim Email"}
                    </button>
                    {result && (
                        <p className={`text-xs ${result.startsWith("Email berhasil") ? "text-green-600" : "text-red-600"}`}>
                            {result}
                        </p>
                    )}
                </div>
            </div>
        </form>
    );
}
