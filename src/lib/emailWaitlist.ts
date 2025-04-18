import { addMinutes } from "date-fns";
import prisma from "@/lib/prisma";
import { publishToQueue } from "@/lib/rabbit";

const QUEUE = "email_queue";
const FROM = process.env.FROM_EMAIL || "tickets@yourapp.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function enqueue(to: string, subject: string, html: string) {
    await publishToQueue(QUEUE, { from: FROM, to, subject, html });
}

export async function sendWaitlistEmail(
    userId: string,
    reservationId: number,
    eventId: number,
    waitMinutes = 30
) {
    // Fetch user and event from the database
    const [user, event] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.event.findUnique({ where: { id: eventId } }),
    ]);
    if (!user || !event) return; // Safety guard

    const expiresAt = addMinutes(new Date(), waitMinutes);

    await enqueue(
        user.email,
        `Waitlist Opportunity – ${event.name}`,
        `<p>Your waitlist spot for <strong>${event.name}</strong> is now available!</p>
        <p>Please complete checkout before
        <strong>${expiresAt.toLocaleString()}</strong>.</p>
        <p><a href="${APP_URL}/checkout/${reservationId}"
           style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
           Complete Purchase
        </a></p>`
    );
}
