import amqp from "amqplib";
import { sendEmail } from "@/lib/email";

async function runWorker() {
    const conn = await amqp.connect(process.env.AMQP_URL || "amqp://localhost");
    const channel = await conn.createChannel();

    const queue = "email_queue";
    await channel.assertQueue(queue, { durable: true });

    console.log("Listening on queue:", queue);

    await channel.consume(queue, async (msg) => {
        if (!msg) return;

        const payload = JSON.parse(msg.content.toString());
        console.log("Received task:", payload);

        try {
            await sendEmail(payload.to, payload.subject, payload.html);
            channel.ack(msg);
            console.log("Email sent to:", payload.to);
        } catch (err) {
            console.error("Failed to send email to:", payload.to, err);
        }
    });
}

runWorker();
