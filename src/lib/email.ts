import { Resend } from "resend";

const FROM_EMAIL =
  "LIKHA <likha-no-reply@gimenodesignsolutions.asia>";

export async function sendLikhaEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey =
    process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured.",
    );
  }

  const resend = new Resend(apiKey);

  const { data, error } =
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

  if (error) {
    console.error(
      "LIKHA email sending failed:",
      error,
    );

    throw new Error(error.message);
  }

  return data;
}