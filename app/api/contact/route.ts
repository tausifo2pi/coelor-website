import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { LOGO_PNG_BASE64 } from "./logo";
import { button, esc, keyValue, layout, p, quote, steps } from "./template";

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

const NEXT_STEPS = ["We reply within one business day.", "A 30-minute call to map your systems and the data between them.", "A written scope and a fixed quote."];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 200);
    const email = String(body.email ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim().slice(0, 5000);

    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { transport, user } = getTransport();
    const ref = `COE-${Date.now().toString(36).toUpperCase()}`;
    const from = `Coelor <${user}>`;
    const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Amsterdam" });

    // 1) Internal notification
    await transport.sendMail({
      from,
      to: user,
      replyTo: `${name} <${email}>`,
      subject: `New inquiry from ${name} · ${ref}`,
      html: layout({
        preheader: `${name}: ${message.slice(0, 90)}`,
        title: "New inquiry from the website",
        body:
          keyValue([
            ["Reference", ref],
            ["Name", esc(name)],
            ["Email", `<a href="mailto:${esc(email)}" style="color:#0a0c10">${esc(email)}</a>`],
            ["Received", esc(when)],
          ]) +
          quote("Message", message) +
          button("Reply to " + name.split(" ")[0], `mailto:${email}?subject=${encodeURIComponent("Re: your message to Coelor (" + ref + ")")}`),
      }),
      text: `New inquiry · ${ref}\n\nName: ${name}\nEmail: ${email}\nReceived: ${when}\n\n${message}`,
      attachments: [logoAttachment],
    });

    // 2) Confirmation to the sender
    await transport.sendMail({
      from,
      to: email,
      subject: `We received your message · ${ref}`,
      html: layout({
        preheader: "Thanks for getting in touch. We reply within one business day.",
        title: `Thanks, ${name.split(" ")[0]}. We have your message.`,
        body:
          p("We read every message ourselves and reply within one business day. Keep the reference below in case you want to follow up.") +
          keyValue([
            ["Reference", ref],
            ["Received", esc(when)],
          ]) +
          p("<strong style=\"color:#0a0c10\">What happens next</strong>", "margin-bottom:10px") +
          steps(NEXT_STEPS) +
          quote("Your message", message) +
          p("Need to add something? Reply to this email and it lands with us directly.", "margin-bottom:8px"),
      }),
      text: `Thanks, ${name}. We have your message.\n\nWe read every message ourselves and reply within one business day.\n\nReference: ${ref}\nReceived: ${when}\n\nWhat happens next\n1. ${NEXT_STEPS[0]}\n2. ${NEXT_STEPS[1]}\n3. ${NEXT_STEPS[2]}\n\nYour message:\n${message}\n\nNeed to add something? Reply to this email.\n\nCoelor · coelor.com · contact@coelor.com`,
      attachments: [logoAttachment],
    });

    return NextResponse.json({ ok: true, ref });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
