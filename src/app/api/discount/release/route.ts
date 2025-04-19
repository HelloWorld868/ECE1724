import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ReservationStatus } from "@prisma/client";

// Release a discount code reservation
export async function releaseDiscountReservation(discountReservationId: number) {
  try {

    console.log(`Releasing discount reservation ${discountReservationId}`);
    // get discount code reservation
    const reservation = await prisma.discountReservation.findUnique({
      where: { id: discountReservationId },
      include: { discountCode: true }
    });
    
    if (!reservation) {
      console.log(`Reservation not found: ${discountReservationId}`);
      return false;
    }
    
    // only release when the status is PENDING
    if (reservation.status !== ReservationStatus.PENDING) {
      console.log(`Cannot release reservation with status: ${reservation.status}`);
      return false;
    }
    
    const discountCodeId = reservation.discountCodeId;
    const discountCode = reservation.discountCode.code;
    
    console.log(`Releasing reservation ${discountReservationId} for discount code ${discountCode}`);
    
    // use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // update reservation status to CANCELLED
      await tx.discountReservation.update({
        where: { id: discountReservationId },
        data: { status: ReservationStatus.CANCELLED }
      });
      
      // note: currentUses is not modified here, only when the actual purchase is completed
    });
    
    // get latest discount code statistics
    const [pendingCount, completedCount, cancelledCount] = await prisma.$transaction([
      prisma.discountReservation.count({
        where: {
          discountCodeId: discountCodeId,
          status: ReservationStatus.PENDING
        }
      }),
      prisma.discountReservation.count({
        where: {
          discountCodeId: discountCodeId,
          status: ReservationStatus.COMPLETED
        }
      }),
      prisma.discountReservation.count({
        where: {
          discountCodeId: discountCodeId,
          status: ReservationStatus.CANCELLED
        }
      })
    ]);
    
    const updatedDiscountCode = await prisma.discountCode.findUnique({
      where: { id: discountCodeId }
    });
    
    console.log(`Reservation ${discountReservationId} status updated to CANCELLED`);
    console.log(`Updated statistics for discount code ${discountCode}:`);
    console.log(`- Current uses: ${updatedDiscountCode?.currentUses}`);
    console.log(`- Pending reservations: ${pendingCount}`);
    console.log(`- Completed reservations: ${completedCount}`);
    console.log(`- Cancelled reservations: ${cancelledCount}`);
    
    return true;
  } catch (error) {
    console.error("Error releasing discount reservation:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { discountReservationId } = await request.json();

    if (!discountReservationId) {
      return NextResponse.json(
        { error: "Discount reservation ID is required" },
        { status: 400 }
      );
    }

    console.log(`Releasing discount reservation ${discountReservationId} for user ${session.user.id}`);

    // Check if the reservation belongs to the current user
    const reservation = await prisma.discountReservation.findUnique({
      where: { 
        id: parseInt(discountReservationId.toString())
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only release your own reservations" },
        { status: 403 }
      );
    }

    // Release the reservation
    const result = await releaseDiscountReservation(parseInt(discountReservationId.toString()));

    // Whether or not the reservation was successfully released, return a success response
    // This is because the reservation is no longer active (it may be expired, completed, or cancelled)
    return NextResponse.json({
      success: true,
      message: result ? "Reservation released successfully" : "Reservation already processed or expired",
      reservationStatus: result ? "CANCELLED" : "NOT_MODIFIED"
    }, { status: 200 });  // Always return 200 status code

  } catch (error) {
    console.error("Error processing discount reservation release:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
} 