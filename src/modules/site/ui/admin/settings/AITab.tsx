import React from "react";
import { Sparkles, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { fetchAIModelsAction } from "@/modules/subscription";

interface AIConfigRow {
    provider: string;
    apiKey: string;
    modelName?: string;
}

interface AITabProps {
    config: any;
    setConfig: (_config: any) => void;
}

const getStaticModelsForProvider = (provider: string): string[] => {
    switch (provider) {
        case "gemini":
            return ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"];
        case "openai":
            return ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
        case "openrouter":
            return ["google/gemini-2.5-flash", "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet"];
        case "groq":
            return ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"];
        case "nvidia":
            return ["meta/llama-3-70b-instruct"];
        default:
            return [];
    }
};

export function AITab({ config, setConfig }: AITabProps) {
    const [rows, setRows] = React.useState<AIConfigRow[]>(() => {
        try {
            if (config.aiApiKey) {
                const parsed = JSON.parse(config.aiApiKey);
                if (Array.isArray(parsed)) {
                    if (parsed.length > 0) {
                        if (typeof parsed[0] === "object" && parsed[0] !== null) {
                            return parsed as AIConfigRow[];
                        } else {
                            return parsed.map((k: string) => ({
                                provider: config.aiProvider || "gemini",
                                apiKey: k,
                                modelName: ""
                            }));
                        }
                    }
                }
            }
        } catch (_) {}
        return [
            {
                provider: config.aiProvider || "gemini",
                apiKey: config.aiApiKey || "",
                modelName: ""
            }
        ];
    });

    const [showKeys, setShowKeys] = React.useState<Record<number, boolean>>({});
    const [fetchedModels, setFetchedModels] = React.useState<Record<number, string[]>>({});
    const [loadingModels, setLoadingModels] = React.useState<Record<number, boolean>>({});

    const toggleShowKey = (index: number) => {
        setShowKeys(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const detectModels = React.useCallback(async (index: number, provider: string, apiKey: string) => {
        if (!apiKey || !apiKey.trim()) return;
        setLoadingModels(prev => ({ ...prev, [index]: true }));
        try {
            const res = await fetchAIModelsAction({ provider, apiKey });
            if (res.success && Array.isArray(res.models)) {
                setFetchedModels(prev => ({ ...prev, [index]: res.models }));
            } else {
                throw new Error(res.error || "Failed to fetch models");
            }
        } catch (e) {
            console.error("Detect models error:", e);
        } finally {
            setLoadingModels(prev => ({ ...prev, [index]: false }));
        }
    }, []);

    const hasDetectedRef = React.useRef(false);

    // Auto-detect on load for keys already present
    React.useEffect(() => {
        if (hasDetectedRef.current) return;
        hasDetectedRef.current = true;

        rows.forEach((row, index) => {
            if (row.apiKey && row.apiKey.trim() && !row.apiKey.startsWith("new-") && row.apiKey.length > 5) {
                detectModels(index, row.provider, row.apiKey);
            }
        });
    }, [rows, detectModels]);

    const updateRows = (newRows: AIConfigRow[]) => {
        setRows(newRows);
        const firstProvider = newRows[0]?.provider || "gemini";
        setConfig({
            ...config,
            aiProvider: firstProvider,
            aiApiKey: JSON.stringify(newRows)
        });
    };

    const handleRowChange = (index: number, field: keyof AIConfigRow, value: string) => {
        const newRows = [...rows];
        newRows[index] = {
            ...newRows[index],
            [field]: value
        };
        updateRows(newRows);
    };

    const addRow = () => {
        updateRows([...rows, { provider: "gemini", apiKey: "", modelName: "" }]);
    };

    const removeRow = (index: number) => {
        const newRows = rows.filter((_, i) => i !== index);
        updateRows(newRows.length > 0 ? newRows : [{ provider: "gemini", apiKey: "", modelName: "" }]);
        setFetchedModels(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
        setLoadingModels(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 font-sans">
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Konfigurasi AI Assistant</h3>
                </div>
                <div className="p-4 md:p-8 space-y-6 max-w-4xl">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary shadow-inner">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Koneksi AI Assistant (Multi-Provider & Auto-Rotate)</p>
                            <p className="text-[10px] text-muted-foreground font-medium opacity-60 mt-1 uppercase tracking-widest leading-relaxed">
                                Konfigurasikan satu atau beberapa provider AI, Model, dan Kunci API (API Key). Klik ikon bintang (<Sparkles size={10} className="inline text-primary" />) di samping kolom model untuk mendeteksi secara dinamis dan mendapatkan nama model terbaru dari provider!
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 items-center px-1">
                            <div className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Provider AI
                            </div>
                            <div className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Nama Model (Opsional)
                            </div>
                            <div className="col-span-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Kunci API (API Key)
                            </div>
                        </div>

                        <div className="space-y-3">
                            {rows.map((row, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-3">
                                        <select
                                            value={row.provider}
                                            onChange={(e) => handleRowChange(index, "provider", e.target.value)}
                                            className="w-full bg-muted/10 border border-border/50 rounded-md px-3 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                        >
                                            <option value="gemini" className="bg-background">Gemini (Google)</option>
                                            <option value="openai" className="bg-background">OpenAI</option>
                                            <option value="openrouter" className="bg-background">OpenRouter</option>
                                            <option value="groq" className="bg-background">Groq</option>
                                            <option value="nvidia" className="bg-background">NVIDIA NIM</option>
                                        </select>
                                    </div>

                                    <div className="col-span-3">
                                        {(() => {
                                            const modelsList = [...(fetchedModels[index] || getStaticModelsForProvider(row.provider))];
                                            if (row.modelName && !modelsList.includes(row.modelName)) {
                                                modelsList.unshift(row.modelName);
                                            }
                                            return (
                                                <div className="relative">
                                                    <select
                                                        value={row.modelName || ""}
                                                        onChange={(e) => handleRowChange(index, "modelName", e.target.value)}
                                                        className="w-full bg-muted/10 border border-border/50 rounded-md pl-3 pr-10 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all appearance-none"
                                                    >
                                                        <option value="" className="bg-background">Default Recommended</option>
                                                        {modelsList.map((model) => (
                                                            <option key={model} value={model} className="bg-background">
                                                                {model}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {row.apiKey && (
                                                        <button
                                                            type="button"
                                                            disabled={loadingModels[index]}
                                                            onClick={() => detectModels(index, row.provider, row.apiKey)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:opacity-40 transition-all flex items-center justify-center pointer-events-auto"
                                                            title="Autodetect Model Terbaru"
                                                        >
                                                            {loadingModels[index] ? (
                                                                <span className="flex h-2.5 w-2.5 relative">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                                                </span>
                                                            ) : (
                                                                <Sparkles size={12} className="animate-pulse" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="col-span-6 flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <input
                                                type={showKeys[index] ? "text" : "password"}
                                                value={row.apiKey}
                                                onChange={(e) => handleRowChange(index, "apiKey", e.target.value)}
                                                className="w-full bg-muted/10 border border-border/50 rounded-md pl-4 pr-10 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all font-mono"
                                                placeholder={`Masukkan API Key #${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShowKey(index)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                                            >
                                                {showKeys[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>

                                        {rows.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRow(index)}
                                                className="p-3 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-md transition-all active:scale-95 flex items-center justify-center shrink-0"
                                                title="Hapus Baris"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex items-center gap-2 bg-muted/25 border border-border/60 text-foreground px-4 py-2.5 rounded-md font-black text-[9px] uppercase tracking-[0.15em] hover:bg-muted/40 transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={12} className="text-primary" />
                                Tambah Provider & Kunci API
                            </button>
                        </div>

                        <p className="text-[8px] text-muted-foreground mt-3 uppercase tracking-widest opacity-50 leading-relaxed">
                            Kunci ini akan disimpan dengan aman di basis data dan diputar secara otomatis (auto-rotate) untuk mencegah limitasi pemanggilan API.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
