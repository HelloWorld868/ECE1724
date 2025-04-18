import { Event } from "@prisma/client";
import { publishEmailTask } from "./queue";
import { renderConfirmationEmail, renderReminderEmail } from "./emailTemplates";

export async function enqueueConfirmationEmail(event: Event, to: string, userName: string) {
    const html = renderConfirmationEmail(event, userName);
    await publishEmailTask({
        to,
        subject: `Ticket for ${event.name}`,
        html,
    });
}

export async function enqueueReminderEmail(event: Event, to: string, userName: string) {
    const html = renderReminderEmail(event, userName);
    await publishEmailTask({
        to,
        subject: `Reminder: ${event.name} starts soon`,
        html,
    });
}
