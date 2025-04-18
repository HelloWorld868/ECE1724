import { Event } from "@prisma/client";

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
