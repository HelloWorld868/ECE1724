import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import prisma from '@/lib/prisma';
import { headers } from "next/headers";

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
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // verify user has permission to cancel this reservation
    if (reservation.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
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