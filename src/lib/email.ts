// src/lib/email.ts
import {addMinutes} from "date-fns";
import prisma from "@/lib/prisma";
import {publishToQueue} from "@/lib/rabbit";
import {Resend} from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "tickets@yourapp.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const QUEUE_NAME = "email_queue";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const result = await resend.emails.send({
            from: "noreply@resend.dev", // or a verified domain sender
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

/** Low-level: Push an email task to RabbitMQ */
async function enqueueEmail(to: string, subject: string, html: string) {
    await publishToQueue(QUEUE_NAME, {from: FROM_EMAIL, to, subject, html});
}

/** Notify user after joining waitlist (includes current position) */
export async function sendWaitlistJoinConfirmationEmail(
    userId: string,
    eventId: number,
    ticketTierId: number,
    position: number
) {
    const [user, event, tier] = await Promise.all([
        prisma.user.findUnique({where: {id: userId}}),
        prisma.event.findUnique({where: {id: eventId}}),
        prisma.ticketTier.findUnique({where: {id: ticketTierId}}),
    ]);
    if (!user || !event || !tier) return;

    const html = `
    <h2>🎟 You're on the waitlist!</h2>
    <p>Hello ${user.name},</p>
    <p>You joined the waitlist for <strong>${event.name}</strong> (Tier ID: ${tier.id}).</p>
    <p>Your current position in line: <strong>#${position}</strong></p>
    <p>We'll email you again when a spot opens up.</p>
  `;

    await enqueueEmail(user.email, `Waitlist Confirmation – ${event.name}`, html);
}

/** Notify the user when they are selected to purchase (with expiration time) */
export async function sendWaitlistEmail(
    userId: string,
    reservationId: number,
    eventId: number,
    waitMinutes = 30
) {
    const [user, event] = await Promise.all([
        prisma.user.findUnique({where: {id: userId}}),
        prisma.event.findUnique({where: {id: eventId}}),
    ]);
    if (!user || !event) return;

    const expiresAt = addMinutes(new Date(), waitMinutes);

    const html = `
    <p>Your waitlist spot for <strong>${event.name}</strong> is available!</p>
    <p>Please complete checkout before <strong>${expiresAt.toLocaleString()}</strong>.</p>
    <p>
      <a href="${APP_URL}/checkout/${reservationId}"
         style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
         Complete Purchase
      </a>
    </p>
  `;

    await enqueueEmail(user.email, `Waitlist Opportunity – ${event.name}`, html);
}
