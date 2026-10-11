"use client";

// The client workspace's frame, shared by the sneaker demo (components/demo/DemoApp.tsx) and the store demo
// (components/storedemo/StoreDemoApp.tsx): the sidebar head with the client's mark and name, the sidebar foot (team,
// the "{name}'s build" card, a small "by coelor" link), the page title (with the client's mark on phones), the top
// bar text and the footer line. Each demo is shown as one business's heavily customised build (lead-outreach
// PLAN_followups_custom_demo.md step 5b): the client's name and colour lead, Coelor signs it small. The clients are
// demo shops with generated numbers, and the words say so (top bar, footer, components/demo/CustomNotice.tsx).
// The accent classes read the CSS variables the demo's root sets (ClientMark.tsx accentVars).
import { Lock } from "lucide-react";
import type { DemoClient } from "@/lib/demo/clients";
import type { DemoTracker } from "@/lib/demo/track";
import { CoelorWordmark } from "@/components/demo/ui";
import { OfferLines } from "@/components/demo/Offer";
import { ClientMark, clientFont } from "./ClientMark";
import { TeamList } from "./Team";
import { monthYear, possessive } from "./format";

/** a sidebar menu item; the open one in the client's colour */
export const navItem = (on: boolean) =>
  `flex h-9 shrink-0 items-center gap-3 rounded-lg px-3 text-left text-[14px] font-semibold transition-colors ${
    on ? "bg-[color:var(--ws-soft)] text-[color:var(--ws-ink)]" : "text-[#475569] hover:bg-[#f4f5f7] hover:text-[#0f172a]"
  }`;

/** a menu pill on phones (no sidebar there) */
export const navPill = (on: boolean) =>
  `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${on ? "bg-[color:var(--ws)] text-white" : "bg-[#eef0f3] text-[#475569]"}`;

/** the shell's main buttons (sidebar card, view-only dialog), in the client's colour */
export const primaryBtn = "bg-[color:var(--ws)] text-white hover:bg-[color:var(--ws-ink)]";

/** The sidebar head: the client's mark and name as the workspace, who built it, its version and since when. */
export function WorkspaceHead({ client }: { client: DemoClient }) {
  return (
    // the same height as the page header (72 px + its 1 px border), so their bottom borders are one line
    <div className="flex h-[73px] shrink-0 items-center gap-3 border-b border-[#e3e6eb] px-4">
      <ClientMark client={client} size={38} />
      <div className="min-w-0">
        <p className={`truncate text-[15.5px] font-bold leading-tight text-[#0f172a] ${clientFont(client)}`}>{client.name}</p>
        {/* "Built by Coelor · v3.2 · since Jan 2026", on two lines: one line is wider than the sidebar */}
        <p className="mt-0.5 text-[11.5px] leading-[1.35] text-[#64748b]">
          <span className="block truncate">Built by Coelor</span>
          <span className="block truncate tabular-nums">
            v{client.version} · since {monthYear(client.since)}
          </span>
        </p>
      </div>
    </div>
  );
}

/** The sidebar foot: the team, the "{name}'s build" card with the offer, and the small way to our home page.
 * `made`: what their build is made for ("Made for their accounts, warehouse and rules."). */
export function WorkspaceFoot({ client, made, contact, t }: { client: DemoClient; made: string; contact: string; t: DemoTracker | null }) {
  return (
    <div className="mt-auto flex shrink-0 flex-col">
      <TeamList client={client} />
      <div className="mx-3 mt-4 rounded-xl border border-[#e3e6eb] bg-[#f8fafc] p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <Lock size={14} />
          {possessive(client.name)} build
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.5] text-[#64748b]">{made} Yours is scoped with you and built for your own.</p>
        <OfferLines />
        <a
          href={contact}
          onClick={() => t?.cta("get_this", "Plan my own build (sidebar)")}
          className={`mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[13.5px] font-semibold ${primaryBtn}`}
        >
          Plan my own build
        </a>
      </div>
      <a
        href="/"
        onClick={() => t?.cta("home", "Coelor logo (sidebar)")}
        className="mx-3 my-2 inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1.5 text-[12px] font-medium text-[#94a3b8] opacity-90 transition-opacity hover:text-[#475569] hover:opacity-100"
        aria-label="by Coelor: Coelor home page"
      >
        by <CoelorWordmark height={11} />
      </a>
    </div>
  );
}

/** The header's title block. Phones and small tablets have no sidebar, so the client's mark and name lead there. */
export function PageTitle({ client, title, sub }: { client: DemoClient; title: string; sub: string }) {
  return (
    <>
      <ClientMark client={client} size={34} className="md:hidden" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[12px] font-semibold leading-tight text-[color:var(--ws-ink)] md:hidden ${clientFont(client)}`}>{client.name}</p>
        <h1 className="truncate text-[17px] font-bold leading-tight tracking-[-0.01em] sm:text-[19px] md:text-[21px]">{title}</h1>
        <p className="hidden truncate text-[13px] text-[#64748b] md:block">{sub}</p>
      </div>
    </>
  );
}

/** The dark top bar's line: whose build this is, and that it is read-only. */
export function TopBarText({ client }: { client: DemoClient }) {
  return (
    <>
      <span className="sm:hidden">{possessive(client.name)} build. Read-only.</span>
      <span className="hidden sm:inline">
        {possessive(client.name)} custom build. Yours is built around your own platforms and rules. Read-only.
      </span>
    </>
  );
}

/** The line under every section. The link is the way to our home page on phones (no sidebar there). */
export function DemoFooter({ client, t }: { client: DemoClient; t: DemoTracker | null }) {
  return (
    <p className="mt-8 text-center text-[12.5px] leading-[1.6] text-[#94a3b8]">
      A demo of a custom build by{" "}
      <a href="/" onClick={() => t?.cta("home", "Coelor (footer)")} className="font-semibold text-[#64748b] hover:text-[#0f172a]">
        Coelor
      </a>{" "}
      · {client.name} is a demo shop
    </p>
  );
}
