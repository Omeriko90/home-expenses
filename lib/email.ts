import { Resend } from "resend";

/**
 * Transactional email wrapper. Degrades gracefully when RESEND_API_KEY is not
 * configured: the caller gets `delivered: false` and surfaces the invite URL
 * for manual sharing instead.
 *
 * Env: RESEND_API_KEY, EMAIL_FROM (e.g. "Home Expenses <invites@yourdomain>").
 */
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
    from: process.env.EMAIL_FROM ?? "Home Expenses <onboarding@resend.dev>",
    to: opts.to,
    subject: opts.subject,
    html: `<p>${opts.body}</p><p><a href="${opts.inviteUrl}">${opts.inviteUrl}</a></p>`,
  });
  if (error) {
    console.error(`[invite] email send failed: ${error.message}`);
    return { delivered: false };
  }
  return { delivered: true };
}
