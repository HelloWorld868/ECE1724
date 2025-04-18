import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { ReservationStatus } from "@prisma/client";
import { createReservation } from "@/lib/queue";

export async function POST(request: Request) {
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

    const { tierId, quantity } = await request.json();
    
    const reservationId = await createReservation(
      session.user.id,
      parseInt(tierId),
      parseInt(quantity)
    );

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Failed to reserve tickets' },
        { status: 400 }
      );
    }

    return NextResponse.json({ reservationId });
  } catch (error) {
    console.error('Error reserving tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { reservationId: string } }
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

    const reservationId = parseInt(params.reservationId);
    
    await prisma.ticketReservation.update({
      where: {
        id: reservationId,
        userId: session.user.id,
      },
      data: {
        status: ReservationStatus.CANCELLED
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 