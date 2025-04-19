import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ReservationStatus } from "@prisma/client";

/**
 * API to check if a discount code reservation is valid 
 * Returns the reservation details if valid, error if expired or not found
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
    const { discountCodeId } = await request.json();

    if (!discountCodeId) {
      return NextResponse.json(
        { error: "Discount code ID is required" },
        { status: 400 }
      );
    }

    console.log(`Checking discount reservation for code ${discountCodeId} and user ${userId}`);

    // Get discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: parseInt(discountCodeId.toString()) }
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 404 }
      );
    }

    // Find valid reservation
    const now = new Date();
    const existingReservation = await prisma.discountReservation.findFirst({
      where: {
        discountCodeId: discountCode.id,
        userId,
        status: ReservationStatus.PENDING,
        expiresAt: { gt: now } // Not expired
      }
    });

    if (!existingReservation) {
      console.log(`No valid reservation found for discount code ${discountCode.id} and user ${userId}`);
      return NextResponse.json(
        { error: "Discount code reservation has expired or does not exist" },
        { status: 400 }
      );
    }

    const timeRemaining = existingReservation.expiresAt.getTime() - now.getTime();
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
    
    console.log(`Valid reservation ${existingReservation.id} found, expires in ${minutesRemaining} minutes`);

    // Return the reservation details
    return NextResponse.json({
      valid: true,
      discountReservationId: existingReservation.id,
      reservationExpiry: existingReservation.expiresAt,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
      minutesRemaining,
      message: `Discount code is valid and will expire in ${minutesRemaining} minutes`
    });
  } catch (error) {
    console.error("Error checking discount reservation:", error);
    return NextResponse.json(
      { error: "Server error processing your request" },
      { status: 500 }
    );
  }
} 