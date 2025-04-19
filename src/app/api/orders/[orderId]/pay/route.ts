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
    
    const { orderId } = await Promise.resolve(params);
    const orderIdNum = parseInt(orderId);

    // Get payment data from request (if any)
    const paymentData = await request.json().catch(() => ({}));
    const { cardLastFour } = paymentData;

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

    // Store the transaction details
    // Create a new transaction record for this payment
    try {
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          amount: order.totalAmount,
          type: "PAYMENT",
          cardLastFour: cardLastFour || null,
          user: {
            connect: { id: session.user.id }
          },
          order: {
            connect: { id: orderIdNum }
          }
        }
      });

      // Update order status from PENDING to CONFIRMED
      const updatedOrder = await prisma.order.update({
        where: { id: orderIdNum },
        data: { status: 'CONFIRMED' }
      });

      // If order uses a discount code, log the usage
      if (order.discountCodeId) {
        // Get discount code information
        const discountCode = await prisma.discountCode.findUnique({
          where: { id: order.discountCodeId }
        });

        console.log("\n=== DISCOUNT CODE PURCHASE CONFIRMATION ===");
        console.log(`Order ID: ${order.id}`);
        console.log(`Discount code: ${discountCode?.code}`);
        console.log(`Discount code ID: ${order.discountCodeId}`);
        console.log(`Current uses: ${discountCode?.currentUses}`);
        
        // Find linked reservation if any
        const discountReservation = await prisma.discountReservation.findFirst({
          where: {
            discountCodeId: order.discountCodeId,
            userId: order.userId,
            status: 'PENDING'
          }
        });

        if (discountReservation) {
          console.log(`Associated reservation ID: ${discountReservation.id}`);
          console.log(`Reservation status: ${discountReservation.status}`);
          
          // Update discount reservation status to COMPLETED
          await prisma.discountReservation.update({
            where: { id: discountReservation.id },
            data: { status: ReservationStatus.COMPLETED }
          });
          
          console.log(`Updated reservation status to COMPLETED`);
        } else {
          console.log("No associated discount reservation found");
        }
        
        // update discount code usage count
        await prisma.discountCode.update({
          where: { id: order.discountCodeId },
          data: { 
            currentUses: {
              increment: 1
            }
          }
        });
        
        // get updated discount code information
        const updatedDiscountCode = await prisma.discountCode.findUnique({
          where: { id: order.discountCodeId }
        });
        
        console.log(`Updated discount code usage count: ${updatedDiscountCode?.currentUses}`);
        console.log("==========================================\n");
      }

      // Update reservation status
      await prisma.ticketReservation.updateMany({
        where: {
          userId: session.user.id,
          ticketTierId: order.ticketTierId,
          status: ReservationStatus.PENDING,
        },
        data: {
          status: ReservationStatus.COMPLETED,
        }
      });

      // Remove order from Redis queue
      const queueKey = `order_queue:${orderIdNum}`;
      await redis.del(queueKey);

      // Return successful response
      console.log('Payment completed:', {
        orderId: updatedOrder.id,
        transactionId: transaction.id,
        amount: transaction.amount,
      });

      return NextResponse.json({
        orderId: updatedOrder.id,
        transactionId: transaction.id,
        status: updatedOrder.status
      });
    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to process payment transaction' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 