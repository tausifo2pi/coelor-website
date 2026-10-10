"use client";

// The client's mark in their workspace: a rounded tile with their monogram in their own colour (lib/demo/clients.ts).
// The two demo clients letter it differently, so the demos read as two businesses' builds, not one product in two
// skins: the sneaker reseller's is a tight bold sans, the boutique's a serif on a softer tile.
import type { CSSProperties } from "react";
import type { DemoClient } from "@/lib/demo/clients";

const serif = (c: DemoClient) => c.id === "boutique";

/** the client's lettering for their name and mark */
export const clientFont = (c: DemoClient) => (serif(c) ? "font-serif tracking-[0.01em]" : "tracking-[-0.02em]");

/** The workspace accent as CSS variables (--ws, --ws-soft, --ws-ink), set on the demo's root: the shell's classes
 * read them (bg-[color:var(--ws)]), so one set of classes serves both clients. */
export function accentVars(c: DemoClient): CSSProperties {
  return { "--ws": c.accent, "--ws-soft": c.accentSoft, "--ws-ink": c.accentInk } as CSSProperties;
}

export function ClientMark({ client, size = 36, className = "" }: { client: DemoClient; size?: number; className?: string }) {
  const s = serif(client);
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center leading-none text-white ${s ? "font-semibold" : "font-extrabold"} ${clientFont(client)} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * (s ? 0.34 : 0.24)),
        background: client.accent,
        fontSize: Math.round(size * (s ? 0.44 : 0.4)),
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
      aria-hidden
    >
      {client.monogram}
    </span>
  );
}
