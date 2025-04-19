import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { headers } from "next/headers";
import { releaseDiscountReservation } from "@/app/api/discount/release/route";
import { ReservationStatus } from "@prisma/client";

export async function DELETE(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const paramsData = await Promise.resolve(params);
    const reservationId = parseInt(paramsData.reservationId);
    if (isNaN(reservationId)) {
      return new NextResponse('Invalid reservation ID', { status: 400 });
    }

    // find reservation
    const reservation = await prisma.ticketReservation.findUnique({
      where: { id: reservationId },
      include: {
        discountReservation: true
      }
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // verify user has permission to cancel this reservation
    if (reservation.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check for associated discount code reservation and release it if found
    if (reservation.discountReservation && reservation.discountReservation.length > 0) {
      for (const discountRes of reservation.discountReservation) {
        console.log(`Releasing discount reservation: ${discountRes.id}`);
        await releaseDiscountReservation(discountRes.id);
      }
    } else {
      // Find discount reservations that are linked to this ticket reservation
      const linkedDiscountReservations = await prisma.discountReservation.findMany({
        where: { 
          ticketReservationId: reservationId,
          userId: session.user.id,
          status: 'PENDING'
        }
      });
      
      // Release all linked discount reservations
      for (const discountRes of linkedDiscountReservations) {
        console.log(`Releasing linked discount reservation: ${discountRes.id}`);
        await releaseDiscountReservation(discountRes.id);
      }
    }

    // update reservation status to cancelled
    await prisma.ticketReservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });

    return new NextResponse('Reservation cancelled successfully', { status: 200 });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 