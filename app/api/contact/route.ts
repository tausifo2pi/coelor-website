import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Constructed per-request: at module scope this throws during `next build`,
// which imports the route to collect page data before any secret is available.
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export async function POST(req: NextRequest) {
  try {
    const resend = getResend();
    const { name, email, company, brief } = await req.json();

    if (!name || !email || !brief) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ref = `COE-${Date.now().toString(36).toUpperCase()}`;

    const logoHtml = `<img src="https://coelor.com/icon-64.png" alt="Coelor" width="40" height="40" style="display:block;margin-bottom:16px;" />`;

    // Notify Coelor inbox
    await resend.emails.send({
      from: "Coelor <contact@coelor.com>",
      replyTo: email,
      to: "contact@coelor.com",
      subject: `[${ref}] New inquiry from ${name}${company ? ` · ${company}` : ""}`,
      html: `
        ${logoHtml}
        <p><strong>Ref:</strong> ${ref}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || "—"}</p>
        <hr/>
        <p>${brief.replace(/\n/g, "<br/>")}</p>
      `,
    });

    // Confirmation to sender
    await resend.emails.send({
      from: "Coelor <contact@coelor.com>",
      to: email,
      subject: `We got your message — Ref: ${ref}`,
      html: `
        ${logoHtml}
        <p>Hi ${name},</p>
        <p>Thanks for reaching out. We've received your message and will get back to you within 24 hours.</p>
        <p><strong>Your reference number:</strong> ${ref}</p>
        <p>If you need to follow up, reply to this email with your reference number.</p>
        <br/>
        <p>— Coelor Team</p>
        <p style="color:#999;font-size:12px;">contact@coelor.com · coelor.com</p>
      `,
    });

    return NextResponse.json({ ok: true, ref });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
