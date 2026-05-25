import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, brief } = await req.json();

    if (!name || !email || !brief) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ref = `COE-${Date.now().toString(36).toUpperCase()}`;

    // Notify Coelor inbox
    await transporter.sendMail({
      from: `"Coelor Contact" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: process.env.SMTP_TO,
      subject: `[${ref}] New inquiry from ${name}${company ? ` · ${company}` : ""}`,
      html: `
        <p><strong>Ref:</strong> ${ref}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || "—"}</p>
        <hr/>
        <p>${brief.replace(/\n/g, "<br/>")}</p>
      `,
    });

    // Confirmation to sender
    await transporter.sendMail({
      from: `"Coelor" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `We got your message — Ref: ${ref}`,
      html: `
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
