import { Resend } from "resend";
import { consumeQueue } from "@/lib/rabbit";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@resend.dev";
const QUEUE_NAME = "email_queue";

async function main() {
    console.log("📨 Email Worker started. Waiting for messages...");

    await consumeQueue(QUEUE_NAME, async ({ to, subject, html }) => {
        if (!to || !subject || !html) {
            console.warn("⚠️ Invalid message:", { to, subject });
            return;
        }

        try {
            const result = await resend.emails.send({
                from: FROM_EMAIL,
                to,
                subject,
                html,
            });

            if (result?.data?.id) {
                console.log(`✅ Email sent to ${to}, ID: ${result.data.id}`);
            } else if (result?.error?.message) {
                console.error(`❌ Failed to send email to ${to}:`, result.error.message);
            } else {
                console.error(`❌ Unknown failure sending email to ${to}`);
            }
        } catch (err: any) {
            console.error(`💥 Exception while sending email to ${to}:`, err.message || err);
        }
    });
}

main().catch((err) => {
    console.error("❌ Email worker crashed:", err);
    process.exit(1);
});
