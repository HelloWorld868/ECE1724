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

    const { eventId, tierId, quantity, totalAmount, discountCode, reservationId } = await request.json();
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

    let discountCodeRecord = null;
    if (discountCode) {
      discountCodeRecord = await prisma.discountCode.findFirst({
        where: {
          code: discountCode,
          eventId: parseInt(eventId),
        },
      });

      if (!discountCodeRecord) {
        return NextResponse.json(
          { error: 'Invalid discount code' },
          { status: 400 }
        );
      }

      // check usage times
      if (discountCodeRecord.maxUses !== null && 
          discountCodeRecord.currentUses >= discountCodeRecord.maxUses) {
        return NextResponse.json(
          { error: 'Discount code has reached maximum usage' },
          { status: 400 }
        );
      }

      // check valid date
      const now = new Date();
      if (discountCodeRecord.startDate && now < discountCodeRecord.startDate) {
        return NextResponse.json(
          { error: 'Discount code is not yet active' },
          { status: 400 }
        );
      }
      if (discountCodeRecord.endDate && now > discountCodeRecord.endDate) {
        return NextResponse.json(
          { error: 'Discount code has expired' },
          { status: 400 }
        );
      }
    }

    // use transaction to ensure data consistency
    const [order, updatedTicketTier, updatedReservation] = await prisma.$transaction([
      // create order
      prisma.order.create({
        data: {
          userId: session.user.id,
          eventId: parseInt(eventId),
          ticketTierId: parsedTierId,
          quantity: parsedQuantity,
          totalAmount: parseFloat(totalAmount),
          status: 'CONFIRMED',
          discountCodeId: discountCodeRecord?.id,
        },
      }),
      // update ticket quantity
      prisma.ticketTier.update({
        where: { id: parsedTierId },
        data: {
          quantity: {
            decrement: parsedQuantity
          },
        },
      }),
      // update reservation status
      prisma.ticketReservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.COMPLETED }
      })
    ]);

    // if discount code is used, update usage times
    if (discountCodeRecord) {
      await prisma.discountCode.update({
        where: { id: discountCodeRecord.id },
        data: {
          currentUses: {
            increment: 1
          },
        },
      });
    }

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