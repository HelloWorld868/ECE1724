import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

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

    // Get the reason for refund if provided
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || 'Customer requested refund';
    } catch (e) {
      // If no body is provided, use a default reason
      reason = 'Customer requested refund';
    }

    // Check if order exists, belongs to current user, and is in CONFIRMED status
    const order = await prisma.order.findFirst({
      where: {
        id: orderIdNum,
        userId: session.user.id,
        status: 'CONFIRMED',
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not eligible for refund' },
        { status: 404 }
      );
    }

    // Find the original payment transaction
    const paymentTransaction = await prisma.transaction.findFirst({
      where: {
        orderId: orderIdNum,
        type: 'PAYMENT',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!paymentTransaction) {
      return NextResponse.json(
        { error: 'No payment found for this order' },
        { status: 400 }
      );
    }

    // In a real payment system, we would call the payment gateway's refund API here
    // using the original transaction ID, not the card number.
    
    try {
      // Create refund transaction record
      const refundTransaction = await prisma.transaction.create({
        data: {
          amount: paymentTransaction.amount,
          type: 'REFUND',
          cardLastFour: paymentTransaction.cardLastFour,
          user: {
            connect: { id: session.user.id }
          },
          order: {
            connect: { id: orderIdNum }
          }
        },
      });

      // Update order status to CANCELLED
      const updatedOrder = await prisma.order.update({
        where: { id: orderIdNum },
        data: { status: 'CANCELLED' },
      });

      // Update event inventory (add the tickets back to available tickets)
      await prisma.ticketTier.update({
        where: { 
          id: order.ticketTierId,
        },
        data: {
          quantity: {
            increment: order.quantity,
          },
        },
      });
      
      // Update reservation status to CANCELLED
      await prisma.ticketReservation.updateMany({
        where: {
          ticketTierId: order.ticketTierId,
          userId: session.user.id,
          status: 'COMPLETED',
        },
        data: {
          status: 'CANCELLED',
        },
      });
      
      // if the order used a discount code, decrease the discount code usage count
      if (order.discountCodeId) {
        // Log discount code refund information
        const discountCode = await prisma.discountCode.findUnique({
          where: { id: order.discountCodeId }
        });
        
        console.log("=== DISCOUNT CODE REFUND STATS ===");
        console.log(`Refunding order with discount code: ${discountCode?.code}`);
        console.log(`Discount code ID: ${order.discountCodeId}`);
        console.log(`Current usage count before refund: ${discountCode?.currentUses}`);
        
        // find the discount code reservation associated with the order
        const discountReservations = await prisma.discountReservation.findMany({
          where: {
            userId: session.user.id,
            discountCodeId: order.discountCodeId,
            status: 'COMPLETED'
          }
        });
        
        console.log(`Found ${discountReservations.length} completed discount reservations`);
        
        // update the first found discount code reservation to CANCELLED
        if (discountReservations.length > 0) {
          console.log(`Cancelling discount reservation ID: ${discountReservations[0].id}`);
          await prisma.discountReservation.update({
            where: { id: discountReservations[0].id },
            data: { status: 'CANCELLED' }
          });
        }
        
        // decrease the discount code usage count
        await prisma.discountCode.update({
          where: { id: order.discountCodeId },
          data: {
            currentUses: {
              decrement: 1
            }
          }
        });
        
        const updatedDiscountCode = await prisma.discountCode.findUnique({
          where: { id: order.discountCodeId }
        });
        console.log(`Usage count after refund: ${updatedDiscountCode?.currentUses}`);
        console.log("==================================");
      }

      console.log('Refund processed:', {
        orderId: updatedOrder.id,
        refundTransactionId: refundTransaction.id,
        amount: refundTransaction.amount,
        reason,
      });

      return NextResponse.json({
        orderId: updatedOrder.id,
        refundTransactionId: refundTransaction.id,
        status: updatedOrder.status,
      });
    } catch (refundError) {
      console.error('Refund error:', refundError);
      return NextResponse.json(
        { error: 'Failed to process refund transaction' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
} 