"use client";

import { useHasMounted } from "@/hooks/use-has-mounted";
import type { Data } from "@crediblemark/build";
import { CredBuild, outlinePlugin } from "@crediblemark/build";
import { aiPlugin } from "@crediblemark/build-ai";
import config from "@/credbuild.config";
import "@crediblemark/build-ui/sidebar-neat.css";
import { useState, useEffect } from "react";
import { DesktopOnly } from "@/components/credbuild/DesktopOnly";

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

export function Client({ path, data }: { path: string; data: Partial<Data> }) {
  const mounted = useHasMounted();
  const [isMobile, setIsMobile] = useState(false);
  // Gunakan data awal saja agar tidak memicu infinite render loop saat input data berubah
  const [initialData] = useState(() => sanitizeData(data));
  const editorKey = 0;

  useEffect(() => {
    const checkMobile = () => {
      // Threshold 1024px to include tablets in portrait mode which might struggle with builder UI
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return <div className="p-10 text-center text-gray-500">Loading Editor...</div>;
  }

  if (isMobile) {
    return <DesktopOnly />;
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <CredBuild
        key={editorKey}
        config={config}
        data={initialData}
        headerPath={path}
        plugins={[
          outlinePlugin(),
          aiPlugin()
        ]}
        onPublish={async (publishData) => {
          const response = await fetch("/api/credbuild", {
            method: "post",
            body: JSON.stringify({ data: publishData, path }),
          });

          if (response.ok) {
            // Create success toast
            const toast = document.createElement('div');
            toast.innerHTML = '✅ Berhasil Dipublish! Halaman sudah diperbarui';
            toast.style.cssText = `
              position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 99999;
              background: var(--cb-bg-surface);
              backdrop-filter: blur(12px);
              color: var(--cb-silver); 
              padding: 24px 48px; border-radius: 12px;
              border: 1px solid var(--cb-gold);
              box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
              font-size: 16px; font-weight: 500; text-align: center;
              letter-spacing: 0.02em;
              animation: modalShow 0.5s cubic-bezier(0.16, 1, 0.3, 1);
              min-width: 380px;
            `;

            // Add animations
            if (!document.querySelector('#toast-anim')) {
              const style = document.createElement('style');
              style.id = 'toast-anim';
              style.textContent = `
                @keyframes modalShow { 
                  from { opacity: 0; transform: translate(-50%, -40%) scale(0.9); } 
                  to { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
                } 
                @keyframes modalHide { 
                  from { opacity: 1; transform: translate(-50%, -50%) scale(1); } 
                  to { opacity: 0; transform: translate(-50%, -60%) scale(0.9); } 
                }
              `;
              document.head.appendChild(style);
            }

            document.body.appendChild(toast);
            setTimeout(() => {
              toast.style.animation = 'modalHide 0.3s ease-in forwards';
              setTimeout(() => toast.remove(), 300);
            }, 2500);
          }
        }}
      />
    </div>
  );
}
