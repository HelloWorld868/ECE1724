import { Redis } from '@upstash/redis'
import prisma from '@/lib/prisma'
import { Prisma, TicketTier, TicketReservation } from '@prisma/client'

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
const RESERVATION_EXPIRY = 15 * 60; // 15 minutes in seconds

export async function enqueueOrder(task: OrderTask) {
  console.log('🚀 Enqueueing order to Redis:', task);
  await redis.lpush(ORDER_QUEUE, JSON.stringify(task));
  console.log('✅ Order added to Redis queue');
}

export async function dequeueOrder(): Promise<OrderTask | null> {
  console.log('🔍 Attempting to dequeue order from Redis');
  const task = await redis.rpop(ORDER_QUEUE);
  console.log('📦 Dequeued task from Redis:', task ? JSON.parse(task) : 'No tasks in queue');
  return task ? JSON.parse(task) : null;
}

export async function createReservation(
  userId: string,
  tierId: number,
  quantity: number
): Promise<number | null> {
  console.log('🎫 Creating ticket reservation:', { userId, tierId, quantity });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESERVATION_EXPIRY * 1000);
  console.log('⏰ Reservation will expire at:', expiresAt);

  try {
    // 检查是否有足够的票
    const ticketTier = await prisma.ticketTier.findUnique({
      where: { id: tierId },
      include: {
        reservations: true
      }
    }) as (TicketTier & { reservations: TicketReservation[] }) | null;

    if (!ticketTier) {
      console.log('❌ Ticket tier not found');
      return null;
    }

    // 计算可用票数
    const reservedQuantity = ticketTier.reservations.reduce(
      (sum: number, res) => sum + res.quantity, 
      0
    );
    const availableQuantity = ticketTier.quantity - reservedQuantity;
    console.log('📊 Ticket availability:', {
      total: ticketTier.quantity,
      reserved: reservedQuantity,
      available: availableQuantity,
      requested: quantity
    });

    if (availableQuantity < quantity) {
      console.log('❌ Not enough tickets available');
      return null;
    }

    // 创建预留
    const reservation = await prisma.ticketReservation.create({
      data: {
        ticketTierId: tierId,
        userId,
        quantity,
        expiresAt,
        status: ReservationStatus.PENDING
      }
    });
    console.log('✅ Reservation created:', reservation);

    return reservation.id;
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    return null;
  }
}

export async function processReservationExpiry() {
  const now = new Date();
  console.log('🧹 Processing expired reservations at:', now);
  
  try {
    // 查找所有过期的预留
    const expiredReservations = await prisma.ticketReservation.findMany({
      where: {
        status: ReservationStatus.PENDING,
        expiresAt: { lt: now }
      }
    });
    console.log('📅 Found expired reservations:', expiredReservations.length);

    // 更新状态为过期
    for (const reservation of expiredReservations) {
      await prisma.ticketReservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.EXPIRED }
      });
      console.log('🗑️ Marked reservation as expired:', reservation.id);
    }
  } catch (error) {
    console.error('❌ Error processing expired reservations:', error);
  }
}
