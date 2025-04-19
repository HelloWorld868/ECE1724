import amqp, {ChannelModel} from "amqplib";
import "dotenv/config";

const RABBIT_URL = process.env.AMQP_URL || "amqp://localhost";

let connection: ChannelModel;
let channel: amqp.Channel;

/** Get or create a channel */
export async function getChannel(): Promise<amqp.Channel> {
    if (channel) return channel;

    connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    return channel;
}

/** Publish a message (JSON) to a queue */
export async function publishToQueue(queue: string, payload: object) {
    const ch = await getChannel();
    await ch.assertQueue(queue, {durable: true});
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
        persistent: true,
    });
}

/** Consume a queue and pass parsed message to handler */
export async function consumeQueue(
    queue: string,
    onMessage: (data: any) => Promise<void>
) {
    const ch = await getChannel();
    await ch.assertQueue(queue, {durable: true});

    await ch.consume(
        queue,
        async (msg) => {
            if (!msg) return;
            try {
                const data = JSON.parse(msg.content.toString());
                await onMessage(data);
                ch.ack(msg);
            } catch (err) {
                console.error("❌ Error in consumer:", err);
                ch.nack(msg, false, false); // discard message
            }
        },
        {noAck: false}
    );
}
