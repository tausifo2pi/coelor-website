import { LOGO_HEIGHT, LOGO_WIDTH } from "./logo";

// Display size in the header: keep the wordmark modest, like a letterhead.
const LOGO_W = 150;
const LOGO_H = Math.round((LOGO_HEIGHT / LOGO_WIDTH) * LOGO_W);

/**
 * Table-based, client-safe email layout. The wordmark is an inline CID
 * attachment (`cid:coelor-logo`), so it renders even where remote images are
 * blocked. Colours are inline; no external CSS, no web fonts.
 */

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export function layout({ preheader, title, body }: { preheader: string; title: string; body: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f2f3f6;font-family:${FONT};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f2f3f6">
  <tr><td align="center" style="padding:36px 16px">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%">
      <!-- header -->
      <tr><td style="background:#0a0c10;border-radius:16px 16px 0 0;padding:24px 32px">
        <img src="cid:coelor-logo" alt="Coelor" width="${LOGO_W}" height="${LOGO_H}" style="display:block;border:0;outline:none;width:${LOGO_W}px;height:${LOGO_H}px" />
      </td></tr>
      <!-- hairline accent -->
      <tr><td style="height:3px;background:linear-gradient(90deg,#9fb0ff,#34d399);font-size:0;line-height:0">&nbsp;</td></tr>
      <!-- body -->
      <tr><td style="background:#ffffff;padding:32px 32px 8px">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:700;color:#0a0c10;letter-spacing:-0.01em">${esc(title)}</h1>
        ${body}
      </td></tr>
      <!-- footer -->
      <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:18px 32px 26px;border-top:1px solid #eceef3">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="font-size:12px;line-height:1.6;color:#7d8695">
              <strong style="color:#3a3f4b">Coelor</strong> · Automation for the work between your systems<br/>
              <a href="https://coelor.com" style="color:#7d8695;text-decoration:none">coelor.com</a> · <a href="mailto:contact@coelor.com" style="color:#7d8695;text-decoration:none">contact@coelor.com</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:11px;line-height:1.5;color:#9aa1ad;max-width:600px">You are receiving this because a message was sent to Coelor with this email address. If that wasn't you, you can ignore this email.</p>
  </td></tr>
</table>
</body>
</html>`;
}

export const p = (html: string, extra = "") => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#2b2f38;${extra}">${html}</p>`;

export function keyValue(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;border:1px solid #e6e8ee;border-radius:10px;border-collapse:separate;overflow:hidden">
    ${rows
      .map(
        ([k, v], i) => `<tr>
      <td style="padding:11px 14px;width:132px;font-size:13px;color:#7d8695;background:#f7f8fa;${i ? "border-top:1px solid #eceef3" : ""}">${esc(k)}</td>
      <td style="padding:11px 14px;font-size:14px;color:#0a0c10;font-family:${MONO};${i ? "border-top:1px solid #eceef3" : ""}">${v}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

export function steps(items: string[]) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px">
    ${items
      .map(
        (t, i) => `<tr>
      <td valign="top" style="padding:0 12px 10px 0"><span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:11px;background:#0a0c10;color:#ffffff;font-size:12px;font-family:${MONO}">${i + 1}</span></td>
      <td valign="top" style="padding:2px 0 10px;font-size:14px;line-height:1.5;color:#2b2f38">${esc(t)}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

export function quote(label: string, text: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px">
    <tr><td style="padding:14px 16px;background:#f7f8fa;border-left:3px solid #9fb0ff;border-radius:0 10px 10px 0;font-size:14px;line-height:1.6;color:#3a3f4b">
      <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#7d8695;margin-bottom:6px">${esc(label)}</div>
      ${esc(text).replace(/\n/g, "<br/>")}
    </td></tr>
  </table>`;
}

export function button(label: string, href: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px">
    <tr><td style="border-radius:999px;background:#0a0c10">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a>
    </td></tr>
  </table>`;
}
