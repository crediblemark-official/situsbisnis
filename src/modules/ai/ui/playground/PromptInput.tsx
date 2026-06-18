"use client";

import React from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";

type Mode = "page" | "section" | "refine";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  mode: Mode;
}

export function PromptInput({ value, onChange, onSubmit, isLoading, mode }: PromptInputProps) {
  const placeholder = {
    page: "Describe the page you want to create... e.g., 'A landing page for a coffee shop with hero, features, and contact section'",
    section: "Describe the section you want to add... e.g., 'A testimonial carousel with customer quotes'",
    refine: "Describe how to refine the selected field... e.g., 'Make this headline more persuasive and benefit-driven'",
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder[mode]}
          className="w-full min-h-[120px] p-4 pr-12 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <Sparkles
          size={18}
          className="absolute top-4 right-4 text-primary/40"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {mode === "page"
            ? "Generates a full page with multiple sections"
            : mode === "section"
            ? "Generates a single section to add to the page"
            : "Refines the currently selected field"}
        </span>

        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );
}
