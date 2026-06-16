"use client";

import type { Data } from "@crediblemark/build";
import { Render } from "@crediblemark/build";
import config from "@/credbuild.config";

function sanitizeData(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const sanitized = { ...raw };
  if (Array.isArray(sanitized.content)) {
    sanitized.content = sanitized.content.map((block: any) => {
      if (block && typeof block === "object") {
        return {
          ...block,
          props: {
            content: {},
            typography: {},
            styling: {},
            ...(block.props || {}),
          }
        };
      }
      return block;
    });
  }
  return sanitized;
}

export function Client({ data }: { data: Data }) {
  const safeData = sanitizeData(data);
  return <Render config={config} data={safeData} />;
}
