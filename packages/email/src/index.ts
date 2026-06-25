export { getResendClient, resetResendClient } from "./resend-client.js";
export {
  invitationEmailHtml,
  passwordResetEmailHtml,
  verificationEmailHtml,
} from "./templates.js";

import { getServerEnv } from "@saptm/config";
import { getResendClient } from "./resend-client.js";
import { invitationEmailHtml, passwordResetEmailHtml, verificationEmailHtml } from "./templates.js";

export type SendInvitationEmailInput = {
  to: string;
  userName: string;
  acceptUrl: string;
  organizationName?: string;
};

export async function sendInvitationEmail(input: SendInvitationEmailInput): Promise<void> {
  const client = getResendClient();
  const env = getServerEnv();

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: "Convite SAPTM",
    html: invitationEmailHtml({
      url: input.acceptUrl,
      userName: input.userName,
      organizationName: input.organizationName,
    }),
  });
}

export type SendVerificationEmailInput = {
  to: string;
  userName: string;
  verificationUrl: string;
};

export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
  const client = getResendClient();
  const env = getServerEnv();

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: "Verifique o seu email — SAPTM",
    html: verificationEmailHtml({
      url: input.verificationUrl,
      userName: input.userName,
    }),
  });
}

export type SendPasswordResetEmailInput = {
  to: string;
  userName: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  const client = getResendClient();
  const env = getServerEnv();

  await client.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: "Redefinir password — SAPTM",
    html: passwordResetEmailHtml({
      url: input.resetUrl,
      userName: input.userName,
    }),
  });
}
