"use client";

import React, { useState } from "react";
import { PromptInput } from "./PromptInput";
import { ResultPreview } from "./ResultPreview";

type Mode = "page" | "section" | "refine";

export function AIPlayground() {
  const [mode, setMode] = useState<Mode>("section");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unknown error");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex gap-2">
        {(["page", "section", "refine"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {m === "page" ? "Generate Page" : m === "section" ? "Generate Section" : "Refine Field"}
          </button>
        ))}
      </div>

      <PromptInput
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        mode={mode}
      />

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {result && <ResultPreview data={result} />}
    </div>
  );
}
