import { getServerEnv } from "@saptm/config";
import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (client !== null) {
    return client;
  }

  const { RESEND_API_KEY } = getServerEnv();

  if (RESEND_API_KEY === undefined) {
    throw new Error(
      "RESEND_API_KEY is not configured. Set RESEND_API_KEY in your environment variables.",
    );
  }

  client = new Resend(RESEND_API_KEY);
  return client;
}

export function resetResendClient(): void {
  client = null;
}
