import { addMinutes } from "date-fns";
import prisma from "@/lib/prisma";
import { publishToQueue } from "@/lib/rabbit";
import { Resend } from "resend";
import "dotenv/config";

const QUEUE_NAME = "email_queue";
const FROM_EMAIL = process.env.FROM_EMAIL || "tickets@yourapp.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function enqueueEmail(to: string, subject: string, html: string) {
    await publishToQueue(QUEUE_NAME, { from: FROM_EMAIL, to, subject, html });
}

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


/** Send an order‑confirmation email right after purchase is completed. */
export async function sendOrderConfirmation(orderId: number) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, event: true },
    });
    if (!order) return;

    await enqueueEmail(
        order.user.email,
        `Order Confirmed – ${order.event.name}`,
        `<p>Thanks for your purchase! Order #${order.id}</p>
        <p>Event time: ${order.event.startTime.toLocaleString()}</p>
        <p>You can view your e‑ticket at
        <a href="${APP_URL}/orders/${order.id}">My Orders</a>.</p>`
    );
}

/** Send a 24‑hour reminder before the event starts (triggered by a cron job). */
export async function sendEventReminder(eventId: number, userId: string) {
    const [event, user] = await Promise.all([
        prisma.event.findUnique({ where: { id: eventId } }),
        prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!event || !user) return;

    await enqueueEmail(
        user.email,
        `Reminder – ${event.name} starts soon`,
        `<p>Your event starts in less than 24 hours.</p>
     <p><strong>${event.startTime.toLocaleString()}</strong> – ${event.location}</p>
     <p>Please bring your QR e‑ticket. Enjoy!</p>`
    );
}

/** Notify a user when a waitlist spot becomes available. */
export async function sendWaitlistEmail(
    userId: string,
    reservationId: number,
    eventId: number,
    waitMinutes = 30
) {
    const [user, event] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.event.findUnique({ where: { id: eventId } }),
    ]);
    if (!user || !event) return;

    const expiresAt = addMinutes(new Date(), waitMinutes);

    await enqueueEmail(
        user.email,
        `Waitlist Opportunity – ${event.name}`,
        `<p>Your waitlist spot is available!</p>
        <p>Please complete checkout before
        <strong>${expiresAt.toLocaleString()}</strong>.</p>
        <p><a href="${APP_URL}/checkout/${reservationId}"
           style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
           Complete Purchase
        </a></p>`
    );
}
