// The contact form (components/ContactForm.tsx): one email to us with the message, one short receipt to the sender.
// Guarded against abuse, because it sends mail from our mailbox to any address typed in:
// - a spam trap field ("hp"): filled in → a normal-looking "sent", nothing mailed;
// - at most 5 submits per 10 minutes per network (/24, or /48 for IPv6) → 429 with a friendly message;
// - at most 3 receipts per address a day;
// - the receipt never repeats the message, and shows the sender's first name only when it looks like a name.
// Copy (receipt, next steps per choice): data/site-content.json contact.*.
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import content from "@/data/site-content.json";
import { TOKEN_COOKIE, VISITOR_COOKIE, track } from "@/lib/track";
import { LOGO_PNG_BASE64 } from "./logo";
import { button, esc, keyValue, layout, p, quote, steps } from "./template";

export const dynamic = "force-dynamic";

type Kind = "trial" | "price";

// Spacemail SMTP. Credentials come from the runtime env (EMAIL, EMAIL_PASSWORD);
// host and port can be overridden with SMTP_HOST / SMTP_PORT.
function getTransport() {
  const user = process.env.EMAIL;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) throw new Error("EMAIL / EMAIL_PASSWORD are not set");
  const port = Number(process.env.SMTP_PORT ?? 465);
  return {
    user,
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "mail.spacemail.com",
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
  };
}

const logoAttachment = {
  filename: "coelor.png",
  content: Buffer.from(LOGO_PNG_BASE64, "base64"),
  contentType: "image/png",
  cid: "coelor-logo",
  contentDisposition: "inline" as const,
};

/* ---------- limits (in memory: one server process; a restart clears them, which is fine) ---------- */

const WINDOW_MS = 10 * 60_000;
const PER_NETWORK = 5; // submits per 10 minutes per /24 (an office or a family shares one)
const RECEIPT_WINDOW_MS = 24 * 60 * 60_000;
const RECEIPTS_PER_ADDRESS = 3;
const MAX_KEYS = 5000;

type Hits = Map<string, { n: number; since: number }>;
const byNetwork: Hits = new Map();
const byAddress: Hits = new Map();

/** Counts one hit for `key`; true once the limit for the window is passed. */
function over(map: Hits, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const h = map.get(key);
  if (!h || now - h.since > windowMs) {
    map.set(key, { n: 1, since: now });
    if (map.size > MAX_KEYS) map.delete(map.keys().next().value as string);
    return false;
  }
  h.n += 1;
  return h.n > limit;
}

// nginx sets X-Real-IP (infra/server/nginx.conf); the same /24 or /48 key as app/api/demo/[view]/route.ts.
function network(req: NextRequest): string {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return ip.includes(":") ? ip.split(":").slice(0, 3).join(":") : ip.split(".").slice(0, 3).join(".");
}

/* ---------- input ---------- */

// eslint-disable-next-line no-control-regex
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s{2,}/g, " ").trim();

/** "Anna de Vries" → "Anna"; anything that is not a plain name (links, digits, symbols) → "" (the receipt then says
 * just "Thanks."), so the form cannot be used to put someone else's words in a mail from us. */
function firstName(name: string): string {
  const first = name.split(" ")[0] ?? "";
  return /^\p{L}[\p{L}'’-]{0,29}$/u.test(first) ? first : "";
}

const newRef = () => `COE-${Date.now().toString(36).toUpperCase()}`;

export async function POST(req: NextRequest) {
  const { contact, brand } = content;

  if (over(byNetwork, network(req), PER_NETWORK, WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited", message: contact.errors.rateLimited }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
    body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error("not an object");
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Spam trap filled in: answer like a real send, mail nothing.
  if (String(body.hp ?? "").trim()) {
    console.info("contact: spam trap filled, dropped");
    return NextResponse.json({ ok: true, ref: newRef(), receipt: true });
  }

  const name = oneLine(String(body.name ?? "")).slice(0, 200);
  const email = oneLine(String(body.email ?? "")).slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 5000);
  const kind: Kind = body.kind === "trial" || body.kind === "price" ? body.kind : /\btrial\b/i.test(message) ? "trial" : "price";

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const kindLabel = contact.choice[kind];
  const next = contact.next[kind];
  const r = contact.receipt;
  const ref = newRef();
  const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" });
  const first = firstName(name);

  // 1) To us: everything, with the message. If this fails the visitor sees an error and can send again.
  let mail: ReturnType<typeof getTransport>;
  try {
    mail = getTransport();
    const reply = `mailto:${email}?subject=${encodeURIComponent(`Re: your message to ${brand.name} (${ref})`)}`;
    await mail.transport.sendMail({
      from: `${brand.name} <${mail.user}>`,
      to: mail.user,
      replyTo: { name, address: email },
      subject: `New inquiry from ${name} · ${kindLabel} · ${ref}`,
      html: layout({
        preheader: `${kindLabel} · ${name}: ${message.slice(0, 90)}`,
        title: "New inquiry from the website",
        body:
          keyValue([
            ["Reference", ref],
            [r.requestLabel, esc(kindLabel)],
            ["Name", esc(name)],
            ["Email", `<a href="${esc(`mailto:${email}`)}" style="color:#0a0c10">${esc(email)}</a>`],
            ["Received", esc(when)],
          ]) +
          quote("Message", message) +
          button(`Reply to ${first || name.split(" ")[0]}`, esc(reply)),
      }),
      text: `New inquiry · ${ref}\n\n${r.requestLabel}: ${kindLabel}\nName: ${name}\nEmail: ${email}\nReceived: ${when}\n\n${message}`,
      attachments: [logoAttachment],
    });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }

  // 2) To the sender: a short receipt with the reference and what happens next, never their message. The inquiry is
  // already with us, so a failure here still answers "sent" (no second submit, no double inquiry).
  let receipt = false;
  if (!over(byAddress, email.toLowerCase(), RECEIPTS_PER_ADDRESS, RECEIPT_WINDOW_MS)) {
    const title = first ? r.title.replace("{name}", first) : r.titleNoName;
    try {
      await mail.transport.sendMail({
        from: `${brand.name} <${mail.user}>`,
        to: email,
        subject: r.subject.replace("{ref}", ref),
        html: layout({
          preheader: r.preheader,
          title,
          body:
            p(esc(r.intro)) +
            keyValue([
              ["Reference", ref],
              [r.requestLabel, esc(kindLabel)],
              ["Received", esc(when)],
            ]) +
            p(`<strong style="color:#0a0c10">${esc(r.nextTitle)}</strong>`, "margin-bottom:10px") +
            steps(next) +
            p(esc(r.outro), "margin-bottom:8px"),
        }),
        text: `${title}\n\n${r.intro}\n\nReference: ${ref}\n${r.requestLabel}: ${kindLabel}\nReceived: ${when}\n\n${r.nextTitle}\n${next.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n${r.outro}\n\n${brand.name} · coelor.com · ${brand.email}`,
        attachments: [logoAttachment],
      });
      receipt = true;
    } catch (err) {
      console.error("Contact API: receipt not sent (the inquiry was):", err);
    }
  }

  // Attribute the inquiry to an outreach email when the visitor came from one.
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (token) {
    await track(req, {
      type: "form_submit",
      token,
      visitor: req.cookies.get(VISITOR_COOKIE)?.value,
      value: ref,
      extra: { email_domain: email.split("@")[1]?.toLowerCase() ?? null, kind },
    });
  }

  return NextResponse.json({ ok: true, ref, receipt });
}
