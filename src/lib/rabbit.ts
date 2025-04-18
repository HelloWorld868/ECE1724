import {connect, Channel, ChannelModel} from "amqplib";

let connection: ChannelModel;
let channel: Channel | undefined;

export async function getChannel(): Promise<Channel> {
    if (channel) return channel; // Re‑use the already‑opened channel

    const amqpUrl = process.env.AMQP_URL ?? "amqp://localhost";
    connection = await connect(amqpUrl);        // ← Promise‑based API
    channel = await connection.createChannel(); // Guaranteed non‑null
    return channel;
}


export async function publishToQueue(
    queue: string,
    payload: unknown
): Promise<void> {
    const ch = await getChannel();
    await ch.assertQueue(queue, { durable: true });
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
    });
}
