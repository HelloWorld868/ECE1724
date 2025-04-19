import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ReservationStatus } from "@prisma/client";

// discount code reservation expiry time (15 minutes)
const DISCOUNT_RESERVATION_EXPIRY = 15 * 60 * 1000;

// get user id from session
async function getUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id;
}

export async function POST(req: Request) {
  try {
    console.log("======= DISCOUNT CODE VALIDATION START =======");
    
    const userId = await getUserId();
    if (!userId) {
      console.log("Unauthorized access attempt - no valid user session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log(`User ID: ${userId}`);

    const body = await req.json();
    const { code, eventId } = body;
    console.log(`Validation request received for code: '${code}', eventId: ${eventId}`);

    // Check required fields
    if (!code) {
      console.log("Validation failed: Missing discount code");
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    if (!eventId) {
      console.log("Validation failed: Missing event ID");
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get the discount code
    console.log(`Looking up discount code '${code}' for event ${eventId}`);
    const discount = await prisma.discountCode.findFirst({
      where: {
        code: code,
        eventId: parseInt(eventId.toString())
      }
    });

    if (!discount) {
      console.log(`Discount code '${code}' not found for event ${eventId}`);
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 404 }
      );
    }
    
    // DEBUG: get the reservation count for this discount code  
    const now = new Date();
    const [pendingCount, expiredCount, completedCount, cancelledCount] = await Promise.all([
      // active pending
      prisma.discountReservation.count({
        where: {
          discountCodeId: discount.id,
          status: ReservationStatus.PENDING,
          expiresAt: { gt: now }
        }
      }),
      // expired
      prisma.discountReservation.count({
        where: {
          discountCodeId: discount.id,
          status: ReservationStatus.PENDING,
          expiresAt: { lte: now }
        }
      }),
      // completed
      prisma.discountReservation.count({
        where: {
          discountCodeId: discount.id,
          status: ReservationStatus.COMPLETED
        }
      }),
      // cancelled
      prisma.discountReservation.count({
        where: {
          discountCodeId: discount.id,
          status: ReservationStatus.CANCELLED
        }
      })
    ]);
    
    console.log(`Found discount code: ${discount.id}, type: ${discount.discountType}, value: ${discount.discountValue}`);
    console.log(`Current uses: ${discount.currentUses}/${discount.maxUses || 'unlimited'}`);

    // add console log for discount code usage details in reservation table for this discount code
    const reservation = await prisma.discountReservation.findMany({
      where: {
        discountCodeId: discount.id
      }
    });
    console.log(`Current uses: ${discount.currentUses}/${discount.maxUses || 'unlimited'}`);
    console.log(`Active pending reservations: ${pendingCount}`);
    console.log(`Expired reservations: ${expiredCount}`);
    console.log(`Completed reservations: ${completedCount}`);
    console.log(`Cancelled reservations: ${cancelledCount}`);

    // DEBUG END

    // check if the user has a pending reservation for this discount code
    console.log(`Checking if user ${userId} has an existing valid reservation for discount ${discount.id}`);
    const existingReservation = await prisma.discountReservation.findFirst({
      where: {
        discountCodeId: discount.id,
        userId: userId,
        status: ReservationStatus.PENDING,
        expiresAt: { gt: new Date() } // ensure the reservation is not expired
      }
    });

    // if a valid pending reservation is found, return the reservation information
    if (existingReservation) {
      console.log(`Found existing valid reservation: ${existingReservation.id}, expires at: ${existingReservation.expiresAt}`);
      const timeRemaining = existingReservation.expiresAt.getTime() - new Date().getTime();
      const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
      
      console.log(`Reservation expires in ${minutesRemaining} minutes`);
      
      console.log("======= DISCOUNT CODE VALIDATION COMPLETE - EXISTING RESERVATION =======");
      return NextResponse.json({
        discountCodeId: discount.id,
        code: discount.code,
        discountValue: discount.discountValue,
        discountType: discount.discountType,
        expiresAt: existingReservation.expiresAt,
        discountReservationId: existingReservation.id
      });
    }
    
    // if no valid reservation is found, try to create a new reservation
    console.log(`No valid existing reservation found, creating new reservation for discount ${discount.id} and user ${userId}`);
    try {
      const reservation = await reserveDiscountCode(discount.id, userId);
      console.log(`New reservation created: ${reservation.discountReservationId}, expires at: ${reservation.expiresAt}`);
      console.log("======= DISCOUNT CODE VALIDATION COMPLETE - NEW RESERVATION =======");
      return NextResponse.json({
        discountCodeId: discount.id,
        code: discount.code,
        discountValue: discount.discountValue,
        discountType: discount.discountType,
        expiresAt: reservation.expiresAt,
        discountReservationId: reservation.discountReservationId
      });
    } catch (error: any) {
      console.error(`Failed to create reservation: ${error.message}`);
      console.log("======= DISCOUNT CODE VALIDATION FAILED =======");
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error validating discount code:", error);
    console.log("======= DISCOUNT CODE VALIDATION FAILED WITH ERROR =======");
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function reserveDiscountCode(discountCodeId: number, userId: string) {
  console.log(`\n===== DISCOUNT CODE RESERVATION REQUEST =====`);
  console.log(`Discount code ID: ${discountCodeId}, User ID: ${userId}`);
  
  // check and clean all old reservations for the same discount code
  const cancelResult = await prisma.discountReservation.updateMany({
    where: {
      discountCodeId: discountCodeId,
      userId: userId,
      status: ReservationStatus.PENDING,
      expiresAt: { gt: new Date() } // only cancel pending reservations that are not expired
    },
    data: {
      status: ReservationStatus.CANCELLED,
      updatedAt: new Date()
    }
  });
  
  console.log(`Cancelled previous pending reservations: ${cancelResult.count}`);

  // get discount code information
  console.log(`Getting discount code details...`);
  const discount = await prisma.discountCode.findUnique({
    where: { id: discountCodeId },
    include: {
      reservations: {
        where: {
          OR: [
            { status: ReservationStatus.PENDING },
            { status: ReservationStatus.COMPLETED }
          ]
        }
      }
    }
  });

  if (!discount) {
    console.error(`Discount code with ID ${discountCodeId} not found`);
    throw new Error(`Discount code with ID ${discountCodeId} not found`);
  }

  // Get reservation count statistics
  const now = new Date();
  
  const [pendingCount, expiredCount, completedCount, cancelledCount] = await Promise.all([
    // Active pending
    prisma.discountReservation.count({
      where: {
        discountCodeId: discountCodeId,
        status: ReservationStatus.PENDING,
        expiresAt: { gt: now }
      }
    }),
    // Expired
    prisma.discountReservation.count({
      where: {
        discountCodeId: discountCodeId,
        status: ReservationStatus.PENDING,
        expiresAt: { lte: now }
      }
    }),
    // Completed
    prisma.discountReservation.count({
      where: {
        discountCodeId: discountCodeId,
        status: ReservationStatus.COMPLETED
      }
    }),
    // Cancelled
    prisma.discountReservation.count({
      where: {
        discountCodeId: discountCodeId,
        status: ReservationStatus.CANCELLED
      }
    })
  ]);
  
  console.log(`\n===== DISCOUNT CODE STATUS STATISTICS =====`);
  console.log(`Discount code: ${discount.code} (ID: ${discount.id})`);
  console.log(`Type: ${discount.discountType}, Value: ${discount.discountValue}`);
  console.log(`Current uses: ${discount.currentUses}/${discount.maxUses || 'unlimited'}`);
  console.log(`Active pending reservations: ${pendingCount}`);
  console.log(`Expired reservations: ${expiredCount}`);
  console.log(`Completed reservations: ${completedCount}`);
  console.log(`Cancelled reservations: ${cancelledCount}`);
  console.log(`Total reservations: ${pendingCount + expiredCount + completedCount + cancelledCount}`);
  
  const availableCount = discount.maxUses === null ? 
    "unlimited" : 
    Math.max(0, discount.maxUses - (discount.currentUses + pendingCount));
  console.log(`Available uses remaining: ${availableCount}`);
  
  // check if the discount code has reached the maximum usage limit
  if (discount.maxUses !== null) {
    // calculate the number of pending reservations
    const pendingReservations = discount.reservations.filter(
      r => r.status === ReservationStatus.PENDING && r.expiresAt > new Date()
    ).length;
    
    const completedReservations = discount.reservations.filter(
      r => r.status === ReservationStatus.COMPLETED
    ).length;
    
    // total usage = completed uses + pending reservations
    const totalUsage = discount.currentUses + pendingReservations;
    
    console.log(`Usage limit check - Pending: ${pendingReservations}, Completed: ${completedReservations}, Total: ${totalUsage}, Limit: ${discount.maxUses}`);
    
    if (totalUsage >= discount.maxUses) {
      console.error(`Discount code ${discount.code} has reached maximum usage limit (${totalUsage}/${discount.maxUses})`);
      throw new Error("Maximum usage limit reached for this discount code");
    }
  }

  // create a new reservation
  const expiry = new Date();
  expiry.setTime(expiry.getTime() + DISCOUNT_RESERVATION_EXPIRY);
  
  console.log(`Creating new reservation, expires at: ${expiry}`);

  const reservation = await prisma.discountReservation.create({
    data: {
      discountCodeId: discountCodeId,
      userId: userId,
      status: ReservationStatus.PENDING,
      expiresAt: expiry
    }
  });
  
  console.log(`New reservation created, ID: ${reservation.id}`);
  console.log(`===== DISCOUNT CODE RESERVATION COMPLETED =====\n`);

  return {
    discountReservationId: reservation.id,
    discountCode: discount.code,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    expiresAt: expiry
  };
}