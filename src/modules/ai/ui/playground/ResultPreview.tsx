"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface ResultPreviewProps {
  data: any;
}

export function ResultPreview({ data }: ResultPreviewProps) {
  const stringified = JSON.stringify(data, null, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-500" />
        <span className="text-sm font-medium text-emerald-500">Generated Successfully</span>
      </div>

      <div className="relative">
        <pre className="w-full max-h-[500px] overflow-auto p-4 rounded-xl bg-muted/50 border border-border text-xs font-mono leading-relaxed">
          {stringified}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(stringified)}
          className="absolute top-3 right-3 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Copy
        </button>
      </div>

      {data.content && Array.isArray(data.content) && (
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Preview: {data.content.length} block{data.content.length !== 1 ? "s" : ""}
          </h4>
          <ul className="space-y-1">
            {data.content.map((block: any, i: number) => (
              <li key={i} className="text-xs text-foreground/80 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                {block.type || block.component || "unknown"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
