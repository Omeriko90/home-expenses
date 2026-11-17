import { Resend } from "resend";

/**
 * Transactional email wrappers. Degrade gracefully when RESEND_API_KEY is not
 * configured: invite callers get `delivered: false` and surface the URL for
 * manual sharing; password-reset links are logged to the server console.
 *
 * Env: RESEND_API_KEY, EMAIL_FROM (e.g. "Home Expenses <invites@yourdomain>").
 */
const FROM = () => process.env.EMAIL_FROM ?? "Home Expenses <onboarding@resend.dev>";

// Interpolated values (household names, etc.) are user-controlled — escape
// them so they can't inject HTML into outgoing emails.
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function sendInviteEmail(opts: {
  to: string;
  inviteUrl: string;
  subject: string;
  body: string;
}): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[invite] RESEND_API_KEY not set — share manually: ${opts.to} -> ${opts.inviteUrl}`,
    );
    return { delivered: false };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM(),
    to: opts.to,
    subject: opts.subject,
    html: `<p>${esc(opts.body)}</p><p><a href="${esc(opts.inviteUrl)}">${esc(opts.inviteUrl)}</a></p>`,
  });
  if (error) {
    console.error(`[invite] email send failed: ${error.message}`);
    return { delivered: false };
  }
  return { delivered: true };
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email] Password reset link for ${to}: ${link}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM(),
    to,
    subject: "Reset your password / איפוס סיסמה",
    html: [
      `<p>לחצו על הקישור כדי לאפס את הסיסמה (בתוקף לשעה):</p>`,
      `<p>Click the link to reset your password (valid for 1 hour):</p>`,
      `<p><a href="${esc(link)}">${esc(link)}</a></p>`,
      `<p>אם לא ביקשתם איפוס, אפשר להתעלם מהודעה זו. / If you didn't request this, you can ignore this email.</p>`,
    ].join("\n"),
  });
}
