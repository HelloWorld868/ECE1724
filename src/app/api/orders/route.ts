import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ReservationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    // Check if user is logged in
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { eventId, tierId, quantity, totalAmount, discountCode, reservationId, discountCodeId, discountReservationId } = await request.json();
    const parsedTierId = parseInt(tierId);
    const parsedQuantity = parseInt(quantity);

    // check reservation
    const reservation = await prisma.ticketReservation.findUnique({
      where: {
        id: parseInt(reservationId),
        userId: session.user.id,
        status: ReservationStatus.PENDING,
      },
    });

    if (!reservation || 
        reservation.ticketTierId !== parsedTierId || 
        reservation.quantity !== parsedQuantity) {
      return NextResponse.json(
        { error: 'Invalid reservation' },
        { status: 400 }
      );
    }

    // check reservation expired
    if (new Date() > reservation.expiresAt) {
      return NextResponse.json(
        { error: 'Reservation expired' },
        { status: 400 }
      );
    }

    // get discount code record from database 
    let discountCodeRecord = null;
    let discountReservationRecord = null;
    
    if (discountReservationId) {
      // if discount code reservation ID is provided, get reservation information
      discountReservationRecord = await prisma.discountReservation.findUnique({
        where: { 
          id: parseInt(discountReservationId.toString()),
          userId: session.user.id,
          status: ReservationStatus.PENDING
        },
        include: { discountCode: true }
      });
      
      // if discount code reservation is found, set the associated discount code as the current used discount code
      if (discountReservationRecord) {
        discountCodeRecord = discountReservationRecord.discountCode;
      }
    } else if (discountCodeId) {
      // use discount code ID to find discount code record
      discountCodeRecord = await prisma.discountCode.findUnique({
        where: { id: parseInt(discountCodeId.toString()) }
      });
    } else if (discountCode) {
      // backward compatible: use discount code string
      discountCodeRecord = await prisma.discountCode.findFirst({
        where: {
          code: discountCode,
          eventId: parseInt(eventId),
        },
      });
    }

    if ((discountCode || discountCodeId || discountReservationId) && !discountCodeRecord) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 400 }
      );
    }

    // Log discount code usage statistics
    if (discountCodeRecord) {
      console.log("=== DISCOUNT CODE USAGE STATS ===");
      console.log(`Using discount code: ${discountCodeRecord.code}`);
      console.log(`Current uses: ${discountCodeRecord.currentUses}`);
      console.log(`Max uses: ${discountCodeRecord.maxUses || 'Unlimited'}`);
      
      // Get remaining usage count
      const remainingUses = discountCodeRecord.maxUses 
        ? discountCodeRecord.maxUses - discountCodeRecord.currentUses 
        : 'Unlimited';
      console.log(`Remaining uses: ${remainingUses}`);
      
      // Count reservations for this code
      const reservationStats = await prisma.$transaction([
        prisma.discountReservation.count({ 
          where: { 
            discountCodeId: discountCodeRecord.id,
            status: ReservationStatus.PENDING 
          }
        }),
        prisma.discountReservation.count({ 
          where: { 
            discountCodeId: discountCodeRecord.id,
            status: ReservationStatus.COMPLETED 
          }
        })
      ]);
      
      console.log(`Pending reservations: ${reservationStats[0]}`);
      console.log(`Completed reservations: ${reservationStats[1]}`);
      console.log("================================");
    }

    // use transaction to ensure data consistency
    const [order, updatedTicketTier, updatedReservation] = await prisma.$transaction(async (tx) => {
      // use discountCodeId to get discount code record
      let finalDiscountCodeId = discountCodeRecord?.id;
      
      // create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          eventId: parseInt(eventId),
          ticketTierId: parsedTierId,
          quantity: parsedQuantity,
          totalAmount: parseFloat(totalAmount),
          status: 'PENDING',
          discountCodeId: finalDiscountCodeId,
        },
      });
      
      // update ticket quantity
      const newTicketTier = await tx.ticketTier.update({
        where: { id: parsedTierId },
        data: {
          quantity: {
            decrement: parsedQuantity
          },
        },
      });
      
      // update reservation status
      const newReservation = await tx.ticketReservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.COMPLETED }
      });
      
      // if discount code reservation is found, update its status to COMPLETED
      if (discountReservationRecord) {
        await tx.discountReservation.update({
          where: { id: discountReservationRecord.id },
          data: { status: ReservationStatus.COMPLETED }
        });
      }
      
      return [newOrder, newTicketTier, newReservation];
    });

    return NextResponse.json({ 
      orderId: order.id,
      message: 'Order created successfully',
      remainingTickets: updatedTicketTier.quantity
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 