import {Event} from "@prisma/client";
import {format} from "date-fns";

export function renderConfirmationEmail(event: Event, userName: string) {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Hi ${userName || "Guest"}, your ticket is confirmed!</h2>
      <p>You’ve successfully registered for <strong>${event.name}</strong>.</p>
      <p>
        <strong>Location:</strong> ${event.location} <br/>
        <strong>Start:</strong> ${new Date(event.startTime).toLocaleString()} <br/>
        <strong>End:</strong> ${new Date(event.endTime).toLocaleString()}
      </p>
      <p>We look forward to seeing you there!</p>
    </div>
  `;
}

export function renderReminderEmail(event: Event, userName: string) {
    return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Hey ${userName || "there"}!</h2>
      <p>This is a reminder that <strong>${event.name}</strong> is starting soon.</p>
      <p>
        <strong>Location:</strong> ${event.location} <br/>
        <strong>Start Time:</strong> ${new Date(event.startTime).toLocaleString()}
      </p>
      <p>Don’t forget to bring your ticket!</p>
    </div>
  `;
}

export function renderWaitlistEmail(
    eventName: string,
    checkoutUrl: string,
    expiresAt: Date
) {
    return `
    <p>Hi there,</p>
    <p>Your spot on the waitlist for <strong>${eventName}</strong> is now available!</p>
    <p>Please complete your purchase <strong>before ${format(
        expiresAt,
        "yyyy‑MM‑dd HH:mm"
    )}</strong>. After this time the tickets will be released to the next person in line.</p>
    <p>
      <a href="${checkoutUrl}"
         style="display:inline-block;padding:12px 20px;border-radius:6px;
                background:#6366f1;color:#fff;text-decoration:none;">
         Purchase now
      </a>
    </p>
    <p style="font-size:14px;color:#666">
      Can’t click the button? Copy this link into your browser:<br/>
      ${checkoutUrl}
    </p>
    <p>Cheers,<br/>Ticketing Team</p>
  `;
}

