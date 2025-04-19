import {Redis} from '@upstash/redis'
import prisma from '@/lib/prisma'
import {TicketTier, TicketReservation} from '@prisma/client'
import {addMinutes} from "date-fns";
import {remainingTickets} from "@/lib/tickets";
import {sendWaitlistEmail} from "@/lib/emailWaitlist";
import amqp from "amqplib";

// Define ReservationStatus enum
enum ReservationStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface OrderTask {
    userId: string;
    eventId: number;
    tierId: number;
    quantity: number;
    reservationId: number;
    discountCode?: string;
}

const ORDER_QUEUE = 'order_queue';
const RESERVATION_EXPIRY = 2 * 60; // 2 minutes in seconds

export async function enqueueOrder(task: OrderTask) {
  console.log('Enqueueing order to Redis:', task);
  await redis.lpush(ORDER_QUEUE, JSON.stringify(task));
  console.log('Order added to Redis queue');
}

export async function dequeueOrder(): Promise<OrderTask | null> {
  console.log('Attempting to dequeue order from Redis');
  const task = await redis.rpop(ORDER_QUEUE);
  console.log('Dequeued task from Redis:', task ? JSON.parse(task) : 'No tasks in queue');
  return task ? JSON.parse(task) : null;
}

export async function createReservation(
    userId: string,
    tierId: number,
    quantity: number
): Promise<number | null> {
  console.log('Creating ticket reservation:', { userId, tierId, quantity });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_EXPIRY * 1000);
  console.log('Reservation will expire at:', expiresAt);

  try {
    // Check if the ticket tier exists and has enough tickets
    const ticketTier = await prisma.ticketTier.findUnique({
      where: { id: tierId },
      include: {
        reservations: true
      }
    }) as (TicketTier & { reservations: TicketReservation[] }) | null;

    if (!ticketTier) {
      console.error(`Ticket tier ${tierId} not found`);
      return null;
    }
    
    // Log the ticket reservation stats
    const reservationStats = await prisma.$transaction([
      prisma.ticketReservation.count(),
      prisma.ticketReservation.count({ where: { status: ReservationStatus.PENDING }}),
      prisma.ticketReservation.count({ where: { status: ReservationStatus.COMPLETED }}),
      prisma.ticketReservation.count({ where: { status: ReservationStatus.CANCELLED }}),
      prisma.ticketReservation.count({ where: { status: ReservationStatus.EXPIRED }})
    ]);
    
    console.log("=== TICKET RESERVATION STATS ===");
    console.log(`Total ticket reservations: ${reservationStats[0]}`);
    console.log(`Pending reservations: ${reservationStats[1]}`);
    console.log(`Completed reservations: ${reservationStats[2]}`);
    console.log(`Cancelled reservations: ${reservationStats[3]}`);
    console.log(`Expired reservations: ${reservationStats[4]}`);
    
    // Get reservations for this ticket tier
    const tierReservations = await prisma.ticketReservation.count({
      where: { 
        ticketTierId: tierId,
        status: ReservationStatus.PENDING,
        expiresAt: { gt: new Date() }
      }
    });
    
    console.log(`Current pending reservations for tier ${tierId}: ${tierReservations}`);
    console.log(`Requested quantity: ${quantity}`);
    console.log(`Available quantity: ${ticketTier.quantity}`);
    console.log("================================");

    // calculate available tickets
    const reservedQuantity = ticketTier.reservations
      .filter((res: TicketReservation) => {
        // Only count PENDING reservations that haven't expired yet
        return res.status === ReservationStatus.PENDING && res.expiresAt > now;
        // Don't count COMPLETED reservations as they are already deducted from total
      })
      .reduce(
        (sum: number, res: TicketReservation) => sum + res.quantity, 
        0
      );
    const availableQuantity = ticketTier.quantity - reservedQuantity;
    console.log('Ticket availability:', {
      total: ticketTier.quantity,
      reserved: reservedQuantity,
      available: availableQuantity,
      requested: quantity
    });

    if (availableQuantity < quantity) {
      console.log('Not enough tickets available');
      return null;
    }

    // create reservation
    const reservation = await prisma.ticketReservation.create({
      data: {
        ticketTierId: tierId,
        userId,
        quantity,
        expiresAt,
        status: ReservationStatus.PENDING
      }
    });
    console.log('Reservation created:', reservation);

    return reservation.id;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return null;
  }
}

export async function processReservationExpiry() {
  const now = new Date();
  console.log('Processing expired reservations at:', now);
  
  try {
    // find all expired reservations
    const expiredReservations = await prisma.ticketReservation.findMany({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: { lt: now }
      }
    });
    console.log('Found expired reservations:', expiredReservations.length);

    // update status to expired
    for (const reservation of expiredReservations) {
      await prisma.ticketReservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.EXPIRED }
      });
      console.log('Marked reservation as expired:', reservation.id);
    }
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
}

export async function publishEmail(payload: { to: string; subject: string; html: string }) {
    const conn = await amqp.connect(process.env.AMQP_URL || "amqp://localhost");
    const channel = await conn.createChannel();
    const queue = "email_queue";
    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
    await channel.close();
    await conn.close();
}

enum WaitlistStatus {
    WAITING   = "WAITING",
    NOTIFIED  = "NOTIFIED",
    PURCHASED = "PURCHASED",
    EXPIRED   = "EXPIRED",
}

const WAITLIST_TTL_MIN = 30;

export async function allocateWaitlist(tierId: number): Promise<void> {
    let available = await remainingTickets(tierId);
    if (available <= 0) return;

    const waiters = await prisma.waitlistEntry.findMany({
        where: { ticketTierId: tierId, status: WaitlistStatus.WAITING },
        orderBy: { createdAt: "asc" },
    });

    for (const w of waiters) {
        if (available < w.quantity) break;

        const reservationId = await createReservation(w.userId, tierId, w.quantity);
        if (!reservationId) continue;

        const expiresAt = addMinutes(new Date(), WAITLIST_TTL_MIN);
        await prisma.waitlistEntry.update({
            where: { id: w.id },
            data: {
                status: WaitlistStatus.NOTIFIED,
                notifiedAt: new Date(),
                expiresAt,
            },
        });

        await sendWaitlistEmail(
            w.userId,
            reservationId,
            w.eventId,
            WAITLIST_TTL_MIN
        );

        available -= w.quantity;
        if (available <= 0) break;
    }
}

async function processWaitlistExpiry(): Promise<void> {
    const now = new Date();
    const expired = await prisma.waitlistEntry.findMany({
        where: {
            status: WaitlistStatus.NOTIFIED,
            expiresAt: { lt: now },
        },
    });

    for (const w of expired) {
        await prisma.waitlistEntry.update({
            where: { id: w.id },
            data: { status: WaitlistStatus.EXPIRED },
        });
        await prisma.ticketReservation.updateMany({
            where: {
                userId: w.userId,
                ticketTierId: w.ticketTierId,
                status: 'PENDING',
            },
            data: { status: 'EXPIRED' },
        });
        await allocateWaitlist(w.ticketTierId);
    }
}


async function monitorQueues(): Promise<void> {
    await processReservationExpiry();
    await processWaitlistExpiry();
}

setInterval(() => {
    monitorQueues().catch(err => console.error("queue monitor error:", err));
}, 60_000);