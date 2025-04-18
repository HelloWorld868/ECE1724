import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    try {
      const result = await resend.emails.send({
        from: "onboarding@resend.dev", // or a verified domain sender
        to,
        subject,
        html,
      });
  
      console.log("Email sent:", result);
      return result;
    } catch (err: any) {
      console.error("Failed to send email:", err?.response?.data || err.message || err);
      throw new Error("Email send failed.");
    }
}