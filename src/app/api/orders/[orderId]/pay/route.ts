import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Redis } from '@upstash/redis';
import { ReservationStatus } from "@prisma/client";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ensure params is awaited
    const { orderId } = await Promise.resolve(params);
    const orderIdNum = parseInt(orderId);

    // Check if order exists and belongs to current user
    const order = await prisma.order.findUnique({
      where: {
        id: orderIdNum,
        userId: session.user.id,
      },
      include: {
        ticketTier: true,
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Use transaction to update order status and Redis queue
    const updatedOrder = await prisma.$transaction(async (prisma) => {
      // 1. Update order status to paid
      const order = await prisma.order.update({
        where: { id: orderIdNum },
        data: { status: 'PAID' },
      });

      // 2. Update ticket reservation status to completed
      await prisma.ticketReservation.updateMany({
        where: {
          userId: session.user.id,
          ticketTierId: order.ticketTierId,
          status: ReservationStatus.PENDING,
        },
        data: {
          status: ReservationStatus.COMPLETED,
        },
      });

      return order;
    });

    // 3. Remove order from Redis queue (if exists)
    const queueKey = `order_queue:${orderIdNum}`;
    await redis.del(queueKey);

    console.log('Payment completed:', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });

    return NextResponse.json({
      orderId: updatedOrder.id,
      status: updatedOrder.status
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 