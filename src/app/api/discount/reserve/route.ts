import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * API to link a discount reservation to a ticket reservation
 * This API assumes the discount reservation validity has already been checked
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { discountReservationId, ticketReservationId } = await request.json();

    if (!discountReservationId) {
      return NextResponse.json(
        { error: "Discount reservation ID is required" },
        { status: 400 }
      );
    }

    if (!ticketReservationId) {
      return NextResponse.json(
        { error: "Ticket reservation ID is required" },
        { status: 400 }
      );
    }

    console.log(`Linking discount reservation ${discountReservationId} to ticket reservation ${ticketReservationId}`);

    // Verify discount reservation belongs to the user
    const discountReservation = await prisma.discountReservation.findUnique({
      where: {
        id: parseInt(discountReservationId.toString()),
        userId
      },
      include: {
        discountCode: true
      }
    });

    if (!discountReservation) {
      return NextResponse.json(
        { error: "Discount reservation not found or doesn't belong to you" },
        { status: 404 }
      );
    }

    // Verify ticket reservation belongs to the user
    const ticketReservation = await prisma.ticketReservation.findUnique({
      where: {
        id: parseInt(ticketReservationId.toString()),
        userId
      }
    });

    if (!ticketReservation) {
      return NextResponse.json(
        { error: "Ticket reservation not found or doesn't belong to you" },
        { status: 404 }
      );
    }

    // Link the discount reservation to the ticket reservation
    const updatedReservation = await prisma.discountReservation.update({
      where: { id: discountReservation.id },
      data: { ticketReservationId: ticketReservation.id }
    });

    console.log(`Successfully linked discount reservation ${discountReservationId} to ticket reservation ${ticketReservationId}`);

    return NextResponse.json({
      success: true,
      discountReservationId: updatedReservation.id,
      ticketReservationId: ticketReservation.id,
      discountCode: discountReservation.discountCode.code,
      discountType: discountReservation.discountCode.discountType,
      discountValue: discountReservation.discountCode.discountValue,
      message: "Discount reservation successfully linked to ticket reservation"
    });
  } catch (error) {
    console.error("Error linking reservations:", error);
    return NextResponse.json(
      { error: "Server error processing your request" },
      { status: 500 }
    );
  }
}